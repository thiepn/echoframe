import { COMBAT_BALANCE } from '../data/combatBalance.js';
import { CORE_ENEMY_DEFINITIONS, CORE_ENEMY_TYPE_LIST } from '../data/coreEnemyDefinitions.js';
import { PROTOTYPE_ARENA } from '../data/prototypeArena.js';
import { Bulwark } from '../enemies/Bulwark.js';
import { Drifter } from '../enemies/Drifter.js';
import { Lancer } from '../enemies/Lancer.js';
import { Sentry } from '../enemies/Sentry.js';
import { ShardCarrier } from '../enemies/ShardCarrier.js';
import { Suppressor } from '../enemies/Suppressor.js';
import { ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';
import { evaluateLancerChargePath } from '../enemy-ai/lancerAttackSpace.js';
import { applyEliteAnticipation, applyEliteRecovery, createEliteActivationProfile } from '../elites/EliteActivationProfile.js';
import { EnemyPool } from '../pools/EnemyPool.js';
import { MajorExecutionCoordinator } from './MajorExecutionCoordinator.js';
import { ELITE_BALANCE } from '../data/eliteBalance.js';

const constructors = Object.freeze({
  drifter: Drifter,
  sentry: Sentry,
  lancer: Lancer,
  'shard-carrier': ShardCarrier,
  bulwark: Bulwark,
  suppressor: Suppressor,
});

export class EnemyManager {
  constructor({ scene, eventBus, settingsManager, difficultyProfile, statistics, enemyProjectileManager, carrierShardManager, suppressionService, eliteManager = null, arenaDescriptor = null }) {
    Object.assign(this, { scene, eventBus, settingsManager, difficulty: difficultyProfile, statistics, enemyProjectileManager, carrierShardManager, suppressionService, eliteManager, arenaDescriptor });
    this.group = scene.physics.add.group({ allowGravity: false });
    this.nextEnemyId = 1;
    this.majorExecutionCoordinator = new MajorExecutionCoordinator();
    this.activeEnemyCache = [];
    this.pools = {};
    for (const type of CORE_ENEMY_TYPE_LIST) {
      const definition = CORE_ENEMY_DEFINITIONS[type];
      const EnemyClass = constructors[type];
      this.pools[type] = new EnemyPool({
        factory: () => { const enemy = new EnemyClass(scene, settingsManager); this.group.add(enemy.bodySprite); return enemy; },
        initialCapacity: definition.poolConfiguration.initial,
        expansionChunk: definition.poolConfiguration.expansion,
        hardCap: definition.poolConfiguration.hardCap,
        onExhausted: (diagnostics) => console.warn(`${type} pool exhausted.`, diagnostics),
      });
    }
  }

  setEliteManager(eliteManager) { this.eliteManager = eliteManager; }

  spawn(type, point, metadata = {}) {
    if (this.activeCount >= COMBAT_BALANCE.sliceCaps.enemies + 4) return null;
    const definition = CORE_ENEMY_DEFINITIONS[type];
    const pool = this.pools[type];
    if (!definition || !pool) return null;
    const activationProfile = createEliteActivationProfile({
      enemyType: type,
      enemyDefinition: definition,
      difficultyProfile: this.difficulty,
      elite: metadata.elite ?? null,
      copyProfile: metadata.copyProfile ?? null,
    });
    const common = {
      enemyId: `${type}-${this.nextEnemyId++}`,
      x: point.x,
      y: point.y,
      maximumHealth: activationProfile.maximumHealth,
      moveSpeed: activationProfile.moveSpeed,
      spawnDurationMs: metadata.elite ? this.#eliteSpawnDuration(metadata.elite.selectionSeed, definition.spawnDuration) : definition.spawnDuration,
      threatCost: definition.threatCost + (metadata.elite?.threatSurcharge ?? 0),
      descriptorId: metadata.descriptorId ?? null,
      activationProfile,
    };
    const data = this.#activationData(type, definition, common, activationProfile);
    const enemy = pool.acquire(data);
    if (!enemy) return null;
    enemy.baseThreatCost = definition.threatCost;
    enemy.threatCost = common.threatCost;
    enemy.role = definition.role;
    this.activeEnemyCache.push(enemy);
    if (metadata.elite) this.eliteManager?.attach(enemy, metadata.elite, activationProfile);
    else if (metadata.copyProfile) this.eliteManager?.attachCopy(enemy, metadata.copyProfile);
    this.eventBus.emit('enemy:spawned', {
      enemyId: enemy.enemyId,
      enemyType: type,
      role: definition.role,
      threatCost: enemy.threatCost,
      x: enemy.x,
      y: enemy.y,
      descriptorId: metadata.descriptorId ?? null,
      elite: metadata.elite ? { modifierId: metadata.elite.modifierId, eliteInstanceId: metadata.elite.eliteInstanceId } : null,
      isEliteCopy: Boolean(metadata.copyProfile),
    });
    this.statistics.recordPoolPeaks?.({ enemy: this.activeCount });
    return enemy;
  }

  update(delta, player) {
    this.majorExecutionCoordinator.update(delta);
    const list = this.activeEnemyCache;
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const enemy = list[index];
      if (!enemy?.active) continue;
      if (enemy.state.is(ENEMY_STATES.dying)) {
        if (enemy.updateDeath(delta)) this.deactivate(enemy, 'death-complete');
        continue;
      }
      enemy.update(delta, {
        player,
        neighbours: list,
        fire: (source, direction) => this.#fire(source, direction),
        telegraph: (source, direction) => this.#telegraph(source, direction),
        lunge: (source, direction) => this.eventBus.emit('enemy:drifter:lunged', { enemyId: source.enemyId, directionX: direction.x, directionY: direction.y }),
        commit: (source, direction, attackEventId) => this.eventBus.emit('enemy:lancer:attack:committed', { enemyId: source.enemyId, directionX: direction.x, directionY: direction.y, attackEventId }),
        anticipate: (source) => this.eventBus.emit('enemy:suppressor:anticipation', { enemyId: source.enemyId, x: source.x, y: source.y, radius: source.fieldRadius }),
        fieldStarted: (source) => this.eventBus.emit('enemy:suppressor:field:activated', { enemyId: source.enemyId, x: source.x, y: source.y, radius: source.fieldRadius, scalar: source.echoRecoveryScalar }),
        fieldEnded: (source) => this.eventBus.emit('enemy:suppressor:field:ended', { enemyId: source.enemyId }),
        requestMajorExecution: (source, executionType) => this.majorExecutionCoordinator.request(source.enemyId, executionType),
      });
    }
  }

  damage(enemy, amount, source, critical = false, zone = 'normal') {
    enemy.renderer.flash?.(zone);
    this.eventBus.emit('enemy:damaged', { enemyId: enemy.enemyId, enemyType: enemy.type, amount, source, critical, zone, remainingHealth: enemy.health.currentHealth, x: enemy.x, y: enemy.y, eliteModifierId: enemy.eliteController?.modifierId ?? null });
  }

  onDamageResolved(enemy, result, packet) { this.eliteManager?.onDamageResolved(enemy, result, packet); }
  onDamageDealt(sourceEnemyId, amount) { this.eliteManager?.onDamageDealt(sourceEnemyId, amount); }
  absorbTemporaryShield(enemy, amount) { return this.eliteManager?.absorbDamage(enemy, amount) ?? Object.freeze({ absorbed: 0, remaining: Math.max(0, Number(amount) || 0) }); }

  beginDeath(enemy, source) {
    if (!enemy?.active || enemy.state.is(ENEMY_STATES.dying)) return false;
    if (enemy.type === 'shard-carrier') enemy.releaseShards(this.carrierShardManager);
    if (enemy.type === 'suppressor') this.suppressionService?.removeSource(enemy.enemyId);
    if (!enemy.beginDying(COMBAT_BALANCE.playtest.enemyDeathMs)) return false;
    this.eliteManager?.notifyEnemyDefeated(enemy, source);
    this.statistics.recordKill?.(source, enemy.type);
    this.eventBus.emit('enemy:defeated', { enemyId: enemy.enemyId, enemyType: enemy.type, source, x: enemy.x, y: enemy.y, eliteModifierId: enemy.eliteController?.modifierId ?? null, isEliteCopy: enemy.isEliteCopy, copyOfEliteInstanceId: enemy.copyOfEliteInstanceId });
    return true;
  }

  deactivate(enemy, reason = 'deactivate') {
    const pool = this.pools[enemy?.type];
    if (!pool || !enemy?.active) return false;
    const enemyId = enemy.enemyId;
    const enemyType = enemy.type;
    const wasElite = enemy.isElite;
    const wasCopy = enemy.isEliteCopy;
    if (enemyType === 'suppressor') this.suppressionService?.removeSource(enemyId);
    this.eliteManager?.detach(enemy, reason);
    const released = pool.release(enemy, reason);
    if (released) {
      const index = this.activeEnemyCache.indexOf(enemy);
      if (index >= 0) this.activeEnemyCache.splice(index, 1);
      this.eventBus.emit('enemy:deactivated', { enemyId, enemyType, reason, wasElite, wasCopy });
    }
    return released;
  }

  clear(reason = 'clear') { for (let index = this.activeEnemyCache.length - 1; index >= 0; index -= 1) this.deactivate(this.activeEnemyCache[index], reason); }
  get activeEnemies() { return this.activeEnemyCache; }
  get activeCount() { return this.activeEnemyCache.length; }
  get activeSuppressors() { return this.activeEnemyCache.filter((enemy) => enemy.type === 'suppressor'); }
  countByType(type) { return this.pools[type]?.activeItems.size ?? 0; }
  countsByType() { return Object.fromEntries(CORE_ENEMY_TYPE_LIST.map((type) => [type, this.countByType(type)])); }
  countsByRole() { const counts = {}; for (const enemy of this.activeEnemyCache) counts[enemy.role] = (counts[enemy.role] ?? 0) + 1; return counts; }
  get activeDrifters() { return this.countByType('drifter'); }
  get activeSentries() { return this.countByType('sentry'); }
  getActiveSnapshots() {
    return this.activeEnemyCache.map((enemy) => ({
      enemyId: enemy.enemyId,
      type: enemy.type,
      role: enemy.role,
      threatCost: enemy.threatCost,
      x: enemy.x,
      y: enemy.y,
      state: enemy.state.value,
      health: enemy.health.currentHealth,
      maximumHealth: enemy.health.maximumHealth,
      moveSpeed: enemy.moveSpeed ?? 0,
      shieldAngle: enemy.shieldAngle ?? null,
      fieldActive: enemy.fieldActive ?? false,
      isElite: enemy.isElite,
      isEliteCopy: enemy.isEliteCopy,
      elite: enemy.eliteController?.snapshot?.() ?? null,
      copyOfEliteInstanceId: enemy.copyOfEliteInstanceId,
    }));
  }
  getDiagnostics() {
    const pools = Object.fromEntries(CORE_ENEMY_TYPE_LIST.map((type) => [type, this.pools[type].diagnostics()]));
    return { active: this.activeCount, majorExecutions: this.majorExecutionCoordinator.snapshot(), drifters: this.activeDrifters, sentries: this.activeSentries, countsByType: this.countsByType(), countsByRole: this.countsByRole(), elite: this.eliteManager?.snapshot?.() ?? { active: 0, elites: [] }, pools, drifterPool: pools.drifter, sentryPool: pools.sentry };
  }
  destroy() { this.clear('destroy'); this.majorExecutionCoordinator.reset(); for (const pool of Object.values(this.pools)) pool.destroy(); this.group.destroy(true); }


  #eliteSpawnDuration(selectionSeed, baseDuration) {
    const minimum = Math.max(baseDuration, ELITE_BALANCE.spawnTelegraphMinimumMs);
    const maximum = Math.max(minimum, ELITE_BALANCE.spawnTelegraphMaximumMs);
    const range = maximum - minimum + 1;
    return minimum + ((Number(selectionSeed) >>> 0) % range);
  }

  #activationData(type, definition, common, profile) {
    const damage = profile.damageScalar;
    if (type === 'drifter') return { ...common, contactDamage: definition.damageValues.contact * damage, contactCooldownMs: COMBAT_BALANCE.playtest.drifterContactCooldownMs, lungeDamage: definition.damageValues.lunge * damage, lungeAnticipationMs: applyEliteAnticipation(profile, definition.attackTimings.anticipationMs), lungeSpeed: definition.lungeSpeed * profile.movementScalar * this.difficulty.enemyMovement, lungeDurationMs: definition.attackTimings.executionMs, recoveryMs: applyEliteRecovery(profile, definition.attackTimings.recoveryMs), lungeTriggerRange: definition.lungeTriggerRange };
    if (type === 'sentry') return { ...common, telegraphMs: applyEliteAnticipation(profile, definition.attackTimings.anticipationMs), recoveryMs: applyEliteRecovery(profile, definition.attackTimings.recoveryMs), burstCount: definition.projectileValues.count, burstSpacingMs: definition.attackTimings.burstSpacingMs, projectileSpeed: definition.projectileValues.speed * this.difficulty.projectileSpeed, projectileDamage: definition.damageValues.projectile * damage, spawnAttackLockoutMs: definition.attackTimings.spawnLockoutMs };
    if (type === 'lancer') return { ...common, telegraphMs: applyEliteAnticipation(profile, definition.attackTimings.anticipationMs), lockMs: definition.attackTimings.lockMs, chargeSpeed: definition.chargeSpeed * profile.movementScalar * this.difficulty.enemyMovement, maximumCharge: definition.maximumCharge, chargeDamage: definition.damageValues.charge * damage, recoveryMs: applyEliteRecovery(profile, definition.attackTimings.recoveryMs), contactCooldownMs: applyEliteRecovery(profile, definition.attackTimings.recoveryMs), collisionRadius: definition.collisionRadius, endpointValidator: (enemy, target, direction) => this.#validLancerEndpoint(enemy, target, direction, definition) };
    if (type === 'shard-carrier') return { ...common, preferredRangeMin: definition.preferredRangeMin, preferredRangeMax: definition.preferredRangeMax, shardCount: definition.projectileValues.shardCount, hazardDamage: definition.damageValues.hazard * damage, activationDelayMs: applyEliteAnticipation(profile, definition.attackTimings.activationDelayMs), hazardDurationMs: definition.attackTimings.hazardDurationMs, hazardRadius: definition.projectileValues.hazardRadius };
    if (type === 'bulwark') return { ...common, contactDamage: definition.damageValues.contact * damage, contactCooldownMs: 700, shieldArcRadians: definition.shieldArcDegrees * Math.PI / 180, sideTransitionRadians: definition.sideTransitionDegrees * Math.PI / 180, frontalScalar: definition.frontalScalar, turnSpeedRadiansPerSecond: definition.turnSpeedDegreesPerSecond * Math.PI / 180 * profile.movementScalar * this.difficulty.enemyMovement, rearStaggerThreshold: definition.rearStaggerThreshold, rearStaggerWindowMs: definition.attackTimings.staggerWindowMs, staggerMs: applyEliteRecovery(profile, definition.attackTimings.staggerMs) };
    return { ...common, contactDamage: definition.damageValues.contact * damage, contactCooldownMs: 700, fieldRadius: definition.fieldRadius, echoRecoveryScalar: definition.echoRecoveryScalar, fieldSetupMs: applyEliteAnticipation(profile, definition.attackTimings.setupMs), relocationIntervalMs: (definition.attackTimings.relocationMinMs + definition.attackTimings.relocationMaxMs) / 2 };
  }

  #validLancerEndpoint(enemy, target, direction, definition) {
    return evaluateLancerChargePath({ origin: { x: enemy.x, y: enemy.y }, direction: direction ?? enemy.directionTo(target), maximumDistance: definition.maximumCharge, collisionRadius: definition.collisionRadius, minimumDistance: 140, bounds: this.arenaDescriptor?.cameraBounds ?? PROTOTYPE_ARENA.bounds, walls: this.arenaDescriptor?.solidGeometry ?? PROTOTYPE_ARENA.walls });
  }

  #telegraph(enemy, direction) {
    if (enemy.type === 'lancer') this.eventBus.emit('enemy:lancer:attack:anticipated', { enemyId: enemy.enemyId, directionX: direction.x, directionY: direction.y, maximumCharge: enemy.maximumCharge });
    else this.eventBus.emit(enemy.type === 'drifter' ? 'enemy:drifter:anticipation' : 'enemy:sentry:anticipation', { enemyId: enemy.enemyId, directionX: direction.x, directionY: direction.y });
  }

  #fire(source, direction) {
    const projectile = this.enemyProjectileManager.activate({ x: source.x + direction.x * 38, y: source.y + direction.y * 38, direction, speed: source.projectileSpeed, lifetimeMs: COMBAT_BALANCE.playtest.sentryProjectileLifetimeMs, damage: source.projectileDamage, radius: 6, ownerId: source.enemyId });
    if (projectile) this.eventBus.emit('enemy:sentry:fired', { enemyId: source.enemyId, activationId: projectile.activationId });
  }
}
