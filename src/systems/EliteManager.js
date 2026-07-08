import { EliteModifierController } from '../elites/EliteModifierController.js';
import { EliteOverlayRenderer } from '../graphics/EliteOverlayRenderer.js';
import { ReplicationSpawnService } from './ReplicationSpawnService.js';
import { ResonantShieldService } from './ResonantShieldService.js';
import { EliteTelemetry } from './EliteTelemetry.js';
import { ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';

export class EliteManager {
  constructor({ scene, eventBus, settingsManager, playerProvider = () => null, telemetry = new EliteTelemetry(), arenaDescriptor = null } = {}) {
    Object.assign(this, { scene, eventBus, settingsManager, playerProvider, telemetry, arenaDescriptor });
    this.enemyManager = null;
    this.controllers = new Map();
    this.overlays = new Map();
    this.copyLinks = new Map();
    this.replicationSpawnService = new ReplicationSpawnService({ arenaDescriptor });
    this.resonantShieldService = new ResonantShieldService();
    this.unsubscribers = [];
    for (const eventName of ['enemy:drifter:lunged', 'enemy:sentry:fired', 'enemy:lancer:attack:committed', 'enemy:suppressor:field:activated']) {
      this.unsubscribers.push(eventBus?.subscribe?.(eventName, (payload = {}) => this.#recordAttackExecution(payload.enemyId), { owner: this }));
    }
  }

  setEnemyManager(enemyManager) { this.enemyManager = enemyManager; }

  attach(enemy, eliteMetadata, activationProfile) {
    if (!enemy || !eliteMetadata || this.controllers.has(enemy.enemyId)) return null;
    const controller = new EliteModifierController({ enemy, eliteMetadata, activationProfile });
    controller.spawnSimulationMs = this.scene?.run?.elapsedSimulationMs ?? 0;
    enemy.eliteMetadata = eliteMetadata;
    enemy.eliteController = controller;
    enemy.isElite = true;
    const overlay = new EliteOverlayRenderer(this.scene, this.settingsManager);
    overlay.activate(enemy, controller);
    this.controllers.set(enemy.enemyId, controller);
    this.overlays.set(enemy.enemyId, overlay);
    this.telemetry.recordHost(enemy.type, controller.modifierId);
    this.eventBus?.emit('elite:spawned', {
      enemyId: enemy.enemyId,
      enemyType: enemy.type,
      modifierId: controller.modifierId,
      eliteInstanceId: controller.eliteInstanceId,
      threatSurcharge: eliteMetadata.threatSurcharge,
      activationProfile,
    });
    return controller;
  }

  attachCopy(enemy, copyProfile) {
    enemy.isEliteCopy = true;
    enemy.copyOfEliteInstanceId = copyProfile.copyOfEliteInstanceId;
    enemy.copyDamageScalar = copyProfile.damageScalar;
    enemy.copySpeedScalar = copyProfile.movementScalar;
    enemy.copyAssemblyRemainingMs = 700;
    enemy.renderer?.container?.setAlpha(0.62);
    this.eventBus?.emit('elite:copy:spawned', { enemyId: enemy.enemyId, enemyType: enemy.type, copyOfEliteInstanceId: enemy.copyOfEliteInstanceId });
  }

  controllerForEnemyId(enemyId) { return this.controllers.get(enemyId) ?? null; }

  update(deltaMs) {
    const delta = Math.max(0, Number(deltaMs) || 0);
    for (const [enemyId, controller] of [...this.controllers]) {
      if (!controller.enemy?.active) { this.detach(controller.enemy, 'inactive'); continue; }
      controller.update(delta);
      this.#consumeShieldEnd(controller);
      this.overlays.get(enemyId)?.update(delta);
      if (controller.modifierId === 'replicating' && controller.modifier.readyToSpawn) this.#spawnCopy(controller);
    }
    for (const enemy of this.enemyManager?.activeEnemies ?? []) {
      if (!enemy.isEliteCopy || !(enemy.copyAssemblyRemainingMs > 0)) continue;
      enemy.copyAssemblyRemainingMs = Math.max(0, enemy.copyAssemblyRemainingMs - delta);
      const progress = 1 - enemy.copyAssemblyRemainingMs / 700;
      enemy.renderer?.container?.setAlpha(0.62 + progress * 0.38);
    }
    this.#updateCopyLinks(delta);
  }

  onDamageResolved(enemy, result, packet) {
    const controller = this.controllers.get(enemy?.enemyId);
    if (!controller || !result?.accepted) return;
    this.telemetry.damageTaken += result.damageApplied;
    const triggered = controller.onAcceptedDamage(result);
    if (triggered) {
      this.telemetry.replicationTriggers += 1;
      this.eventBus?.emit('elite:replicating:triggered', {
        enemyId: enemy.enemyId,
        eliteInstanceId: controller.eliteInstanceId,
        pendingMs: controller.modifier.pendingMs,
        sourceType: packet?.sourceType ?? 'unknown',
      });
    }
  }

  onDamageDealt(sourceEnemyId, amount) {
    const enemy = this.enemyManager?.activeEnemies?.find((candidate) => candidate.enemyId === sourceEnemyId);
    if (!this.controllers.has(sourceEnemyId) && !enemy?.isEliteCopy) return;
    this.telemetry.damageDealt += Math.max(0, Number(amount) || 0);
  }

  absorbDamage(enemy, amount) {
    const controller = this.controllers.get(enemy?.enemyId);
    const result = this.resonantShieldService.absorb(controller, amount);
    if (result.absorbed > 0) {
      this.telemetry.shieldAbsorbed += result.absorbed;
      this.eventBus?.emit('elite:resonant:shield:absorbed', { enemyId: enemy.enemyId, amount: result.absorbed, remainingShield: controller.modifier.shieldAmount });
      this.#consumeShieldEnd(controller);
    }
    return result;
  }

  notifyEnemyDefeated(enemy, source = 'unknown') {
    if (!enemy) return;
    if (enemy.isEliteCopy) this.telemetry.copiesDefeated += 1;
    const defeatedController = this.controllers.get(enemy.enemyId);
    if (defeatedController) {
      defeatedController.cancel('cancelled-parent-death');
      const timeToKillMs = Math.max(0, (this.scene?.run?.elapsedSimulationMs ?? 0) - (defeatedController.spawnSimulationMs ?? 0));
      this.telemetry.recordDefeat(source, timeToKillMs);
      this.eventBus?.emit('elite:defeated', { enemyId: enemy.enemyId, enemyType: enemy.type, modifierId: defeatedController.modifierId, source, timeToKillMs });
    }
    const deathEventId = `death-${enemy.enemyId}-${this.scene?.run?.elapsedSimulationMs ?? 0}`;
    for (const controller of this.controllers.values()) {
      if (controller.enemy === enemy || !controller.enemy.active || controller.enemy.state.is(ENEMY_STATES.dying)) continue;
      const distance = Math.hypot(controller.enemy.x - enemy.x, controller.enemy.y - enemy.y);
      if (controller.onAlliedDeath({ x: enemy.x, y: enemy.y, distance, deathEventId })) {
        const granted = controller.modifier.shieldAmount;
        this.telemetry.resonantTriggers += 1;
        this.telemetry.shieldGranted += granted;
        this.eventBus?.emit('elite:resonant:shield:started', {
          enemyId: controller.enemy.enemyId,
          eliteInstanceId: controller.eliteInstanceId,
          amount: granted,
          durationMs: controller.definition.shieldDurationMs,
          sourceEnemyId: enemy.enemyId,
        });
      }
    }
  }

  detach(enemy, reason = 'deactivate') {
    if (!enemy) return false;
    const controller = this.controllers.get(enemy.enemyId);
    if (controller) {
      if (reason !== 'death-complete') controller.cancel(reason === 'destroy' ? 'cancelled-shutdown' : 'cancelled-segment-end');
      controller.reset();
      this.controllers.delete(enemy.enemyId);
    }
    const overlay = this.overlays.get(enemy.enemyId);
    overlay?.destroy();
    this.overlays.delete(enemy.enemyId);
    this.#removeCopyLink(enemy.enemyId);
    enemy.eliteController = null;
    enemy.eliteMetadata = null;
    enemy.isElite = false;
    enemy.copyAssemblyRemainingMs = 0;
    return Boolean(controller || overlay);
  }

  clear(reason = 'segment-end') {
    for (const controller of [...this.controllers.values()]) this.detach(controller.enemy, reason);
    for (const link of this.copyLinks.values()) link.graphics?.destroy();
    this.copyLinks.clear();
  }

  snapshot() {
    return Object.freeze({
      active: this.controllers.size,
      copyLinks: this.copyLinks.size,
      elites: Object.freeze([...this.controllers.values()].map((controller) => controller.snapshot())),
      telemetry: this.telemetry.snapshot(),
    });
  }

  destroy() {
    this.clear('destroy');
    for (const unsubscribe of this.unsubscribers) unsubscribe?.();
    this.unsubscribers.length = 0;
    this.enemyManager = null;
  }

  #recordAttackExecution(enemyId) {
    const controller = this.controllerForEnemyId(enemyId);
    if (!controller) return;
    controller.onAttackExecution();
    if (controller.modifierId === 'overclocked') {
      this.telemetry.overclockedAttacks += 1;
      this.eventBus?.emit('elite:overclocked:attack', { enemyId, eliteInstanceId: controller.eliteInstanceId, attackCount: controller.modifier.attackCount });
    }
  }

  #spawnCopy(controller) {
    const parent = controller.enemy;
    if (!parent?.active || parent.state.is(ENEMY_STATES.dying)) { controller.modifier.cancel('cancelled-parent-death'); return; }
    const placement = this.replicationSpawnService.findPlacement({
      parent,
      player: this.playerProvider?.(),
      activeEnemies: this.enemyManager?.activeEnemies ?? [],
      seed: controller.eliteMetadata.selectionSeed,
    });
    if (!placement.valid) {
      controller.modifier.markRejected();
      this.telemetry.copySpawnRejections += 1;
      this.telemetry.recordRejection(placement.reason);
      this.eventBus?.emit('elite:copy:rejected', { enemyId: parent.enemyId, reason: placement.reason });
      return;
    }
    const copyProfile = {
      copyOfEliteInstanceId: controller.eliteInstanceId,
      maximumHealth: Math.max(1, Math.round(parent.health.maximumHealth * controller.definition.copyHealthRatio)),
      healthScalar: controller.definition.copyHealthRatio,
      movementScalar: controller.definition.copySpeedScalar,
      damageScalar: controller.definition.copyDamageScalar,
    };
    const copy = this.enemyManager?.spawn(parent.type, placement, { descriptorId: parent.descriptorId ?? null, copyProfile });
    if (!copy) {
      controller.modifier.markRejected();
      this.telemetry.copySpawnRejections += 1;
      this.telemetry.recordRejection('elite-copy-slot-unavailable');
      this.eventBus?.emit('elite:copy:rejected', { enemyId: parent.enemyId, reason: 'elite-copy-slot-unavailable' });
      return;
    }
    controller.modifier.markSpawned(copy.enemyId);
    this.telemetry.copiesSpawned += 1;
    this.#createCopyLink(parent, copy);
    this.eventBus?.emit('elite:replicating:copy:assembled', {
      parentEnemyId: parent.enemyId,
      copyEnemyId: copy.enemyId,
      eliteInstanceId: controller.eliteInstanceId,
      x: copy.x,
      y: copy.y,
      fallbackUsed: placement.fallbackUsed,
    });
  }

  #createCopyLink(parent, copy) {
    const graphics = this.scene?.add?.graphics?.();
    graphics?.setDepth?.(39);
    this.copyLinks.set(copy.enemyId, { parent, copy, remainingMs: 700, graphics });
  }

  #updateCopyLinks(deltaMs) {
    for (const [copyId, link] of [...this.copyLinks]) {
      link.remainingMs = Math.max(0, link.remainingMs - deltaMs);
      if (!link.parent?.active || !link.copy?.active || link.remainingMs <= 0) { this.#removeCopyLink(copyId); continue; }
      const alpha = Math.max(0.15, link.remainingMs / 700);
      link.graphics?.clear?.();
      link.graphics?.lineStyle?.(2, 0xff9d45, alpha);
      link.graphics?.beginPath?.();
      link.graphics?.moveTo?.(link.parent.x, link.parent.y);
      link.graphics?.lineTo?.(link.copy.x, link.copy.y);
      link.graphics?.strokePath?.();
      link.graphics?.strokeCircle?.(link.parent.x, link.parent.y, 8);
      link.graphics?.strokeCircle?.(link.copy.x, link.copy.y, 8);
    }
  }

  #removeCopyLink(enemyId) {
    const direct = this.copyLinks.get(enemyId);
    if (direct) { direct.graphics?.destroy?.(); this.copyLinks.delete(enemyId); }
    for (const [copyId, link] of [...this.copyLinks]) {
      if (link.parent?.enemyId === enemyId || link.copy?.enemyId === enemyId) { link.graphics?.destroy?.(); this.copyLinks.delete(copyId); }
    }
  }

  #consumeShieldEnd(controller) {
    if (controller?.modifierId !== 'resonant') return;
    const reason = controller.modifier.consumeEndEvent?.();
    if (!reason) return;
    if (reason === 'expired') this.telemetry.shieldExpiries += 1;
    else this.telemetry.shieldBreaks += 1;
    this.eventBus?.emit('elite:resonant:shield:ended', { enemyId: controller.enemy.enemyId, eliteInstanceId: controller.eliteInstanceId, reason });
  }
}
