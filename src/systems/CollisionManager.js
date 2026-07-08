import { resolveDashDistance } from '../utils/playerMath.js';
import { createDamagePacket } from '../combat/DamagePacket.js';
import { FACTIONS } from '../combat/Faction.js';
import { ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';
import { destroyPhysicsCollider } from '../utils/physicsCleanup.js';

export class CollisionManager {
  constructor(options) {
    Object.assign(this, options);
    this.colliders = [];
    this.currentWallContacts = new Set();
    this.previousWallContacts = new Set();
    this.finalizeContacts = () => this.#finalize();
    this.nextContactId = 1;
    this.playerTarget = this.playerHealth ? { faction: FACTIONS.player, health: this.playerHealth, active: true } : null;
  }

  register() {
    this.colliders.push(
      this.scene.physics.add.collider(this.player.bodySprite, this.wallGroup, (_player, wall) => this.currentWallContacts.add(wall.getData('wallId') ?? 'wall')),
      this.scene.physics.add.collider(this.projectileManager.group, this.wallGroup, (projectile, wall) => this.#projectileWall(projectile, wall, this.projectileManager, 'player')),
    );
    if (this.echoProjectileManager) this.colliders.push(this.scene.physics.add.collider(this.echoProjectileManager.group, this.wallGroup, (projectile, wall) => this.#projectileWall(projectile, wall, this.echoProjectileManager, 'echo')));
    if (this.enemyManager) {
      this.colliders.push(
        this.scene.physics.add.collider(this.enemyManager.group, this.wallGroup),
        this.scene.physics.add.collider(this.enemyManager.group, this.enemyManager.group),
        this.scene.physics.add.overlap(this.projectileManager.group, this.enemyManager.group, (projectile, body) => this.#damageEnemy(projectile, body, 'player', this.projectileManager)),
        this.scene.physics.add.overlap(this.echoProjectileManager.group, this.enemyManager.group, (projectile, body) => this.#damageEnemy(projectile, body, 'echo', this.echoProjectileManager)),
        this.scene.physics.add.overlap(this.player.bodySprite, this.enemyManager.group, (_player, body) => this.#contactEnemy(body)),
      );
    }
    if (this.enemyProjectileManager) {
      this.colliders.push(
        this.scene.physics.add.collider(this.enemyProjectileManager.group, this.wallGroup, (projectile) => { const id=projectile.activationId; this.enemyProjectileManager.deactivate(projectile, 'wall'); this.onHostileProjectileDestroyed?.(id,'wall'); }),
        this.scene.physics.add.overlap(this.enemyProjectileManager.group, this.player.bodySprite, (projectile) => this.#enemyProjectile(projectile)),
      );
      if (this.hostileProjectileInterceptionProvider) {
        this.colliders.push(this.scene.physics.add.overlap(
          this.projectileManager.group,
          this.enemyProjectileManager.group,
          (friendly, hostile) => this.#interceptHostileProjectile(friendly, hostile),
        ));
      }
    }
    if (this.carrierShardManager) this.colliders.push(this.scene.physics.add.overlap(this.carrierShardManager.group, this.player.bodySprite, (body) => this.#carrierShard(body)));
    if (this.arenaHazardManager?.group) this.colliders.push(this.scene.physics.add.overlap(this.arenaHazardManager.group, this.player.bodySprite, (zone) => this.#arenaHazard(zone)));
    this.scene.events.on('postupdate', this.finalizeContacts);
  }

  resolveDashDistance(x, y, direction, desired, radius) { return resolveDashDistance({ x, y }, direction, desired, this.wallDefinitions, radius); }
  destroy() {
    this.scene?.events?.off?.('postupdate', this.finalizeContacts);
    for (const collider of this.colliders) destroyPhysicsCollider(collider);
    this.colliders = [];
    this.currentWallContacts.clear();
    this.previousWallContacts.clear();
  }
  debugDamagePlayer(amount = 10) { return this.#applyPlayer({ damageId: `debug-${this.nextContactId++}`, sourceType: 'debug', sourceId: 'debug', amount, direction: { x: 0, y: -1 }, hitPosition: { x: this.player.x, y: this.player.y } }); }
  applyExternalPlayerDamage(data) { return this.#applyPlayer(data); }

  #finalize() {
    for (const id of this.currentWallContacts) if (!this.previousWallContacts.has(id)) { this.playerController.notifyWallCollision(); this.eventBus.emit('player:wall:collision', { wallId: id, x: this.player.x, y: this.player.y }); }
    const swap = this.previousWallContacts;
    this.previousWallContacts = this.currentWallContacts;
    this.currentWallContacts = swap;
    this.currentWallContacts.clear();
  }

  #wallNormal(projectile, wall) {
    const dx=projectile.x-wall.x,dy=projectile.y-wall.y;
    const nx=Math.abs(dx/(wall.displayWidth/2||1)),ny=Math.abs(dy/(wall.displayHeight/2||1));
    return nx>ny?{x:Math.sign(dx)||1,y:0}:{x:0,y:Math.sign(dy)||1};
  }

  #projectileWall(projectile, wall, manager, source) {
    if (!projectile?.active) return;
    const profile=this.ricochetProfileProvider?.(source)??null;
    if (profile && projectile.remainingRicochets>0) {
      const normal=this.#wallNormal(projectile,wall),v=projectile.body.velocity,dot=v.x*normal.x+v.y*normal.y;
      let x=v.x-2*dot*normal.x,y=v.y-2*dot*normal.y;
      const speed=Math.hypot(x,y)||1;
      if(Math.abs(x)/speed<.08)x=Math.sign(x||normal.x)*speed*.08;
      if(Math.abs(y)/speed<.08)y=Math.sign(y||normal.y)*speed*.08;
      if(projectile.registerRicochet(profile.decay)){projectile.setVelocity(x,y).setRotation(Math.atan2(y,x));projectile.x+=normal.x*4;projectile.y+=normal.y*4;this.onWallRicochet?.({projectile,source,wallId:wall.getData('wallId')});return;}
    }
    manager.deactivate(projectile, 'wall');
  }

  #damageEnemy(projectile, body, source, manager) {
    if (!projectile?.active) return;
    const enemy = body.getData('enemyEntity');
    if (!enemy?.active || enemy.state.is(ENEMY_STATES.spawning) || enemy.state.is(ENEMY_STATES.dying)) return;
    const now=this.simulationTimeProvider();
    const hit = projectile.registerHit(enemy.enemyId,now);
    if (!hit.accepted) return;
    const data = projectile.damagePacket;
    const amount = source === 'echo' ? data?.scaledDamage : data?.resolvedDamage;
    let packet = createDamagePacket({ damageId: `${source}-${projectile.activationId}-${enemy.enemyId}-${now}`, sourceFaction: source === 'echo' ? FACTIONS.echo : FACTIONS.player, sourceType: `${source}-projectile`, sourceId: projectile.ownerId, ownerId: projectile.ownerId, targetType: enemy.type, targetId: enemy.enemyId, baseAmount: data?.baseDamage, finalAmount: amount, critical: Boolean(data?.criticalResolved), damageTags: [source, 'projectile', ...(data?.tags ?? [])], hitPosition: { x: projectile.x, y: projectile.y }, direction: { x: projectile.body.velocity.x, y: projectile.body.velocity.y }, timestampMs: now, sourceEventId: projectile.sourceEventId, projectileActivationId: projectile.activationId, sourceUpgradeId: data?.sourceUpgradeId ?? null, triggerDepth: data?.triggerDepth ?? 0, canTriggerChain: data?.canTriggerChain !== false, canTriggerFragments: data?.canTriggerFragments !== false, canCrit: data?.canCrit !== false });
    let zone = 'normal';
    if (typeof enemy.modifyIncomingDamage === 'function') {
      const modified = enemy.modifyIncomingDamage(packet);
      packet = modified.packet;
      zone = modified.zone;
      this.eventBus.emit('enemy:bulwark:guard:changed', { enemyId: enemy.enemyId, zone, scalar: modified.scalar });
    }
    const result = this.damageService.resolve(packet, enemy, { absorbDamage: (value) => this.enemyManager.absorbTemporaryShield(enemy, value) });
    if (result.accepted) {
      this.statistics.recordProjectileHit(source, result.damageApplied, packet.critical);
      this.enemyManager.onDamageResolved?.(enemy, result, packet);
      this.enemyManager.damage(enemy, result.damageApplied, source, packet.critical, zone);
      this.onEnemyDamageResolved?.({enemy,result,packet,projectile,source});
      this.eventBus.emit('combat:target:hit', { targetId: enemy.enemyId, source, timestampMs: packet.timestampMs, x: projectile.x, y: projectile.y,damageApplied:result.damageApplied,critical:packet.critical });
      this.eventBus.emit('target:hit', { targetId: enemy.enemyId, source, timestampMs: packet.timestampMs, x: projectile.x, y: projectile.y });
      if (result.targetDefeated) this.enemyManager.beginDeath(enemy, source);
    }
    if (!hit.continue) manager.deactivate(projectile, 'enemy-hit');
  }

  #contactEnemy(body) {
    const enemy = body.getData('enemyEntity');
    if (!enemy?.active || !enemy.canDealContactDamage || !enemy.contactDamage?.consume()) return;
    const direction = enemy.directionTo(this.player);
    this.#applyPlayer({ damageId: `contact-${enemy.enemyId}-${this.nextContactId++}`, sourceType: enemy.contactDamageSourceType, sourceId: enemy.enemyId, amount: enemy.contactDamageAmount, direction, hitPosition: { x: this.player.x, y: this.player.y } });
  }

  #carrierShard(body) {
    const shard = body.getData('carrierShardEntity');
    if (!shard?.canDamage || !shard.consumeDamage()) return;
    const dx = this.player.x - shard.x, dy = this.player.y - shard.y, length = Math.hypot(dx, dy) || 1;
    this.#applyPlayer({ damageId: `carrier-shard-${shard.activationId}-${this.nextContactId++}`, sourceType: 'carrier-hazard', sourceId: shard.ownerId, amount: shard.contactDamage.damage, direction: { x: dx / length, y: dy / length }, hitPosition: { x: this.player.x, y: this.player.y } });
  }

  #arenaHazard(zone) {
    const hazard=this.arenaHazardManager?.consume(zone);if(!hazard)return;
    const result=this.#applyPlayer({damageId:hazard.damageId,sourceType:hazard.sourceType,sourceId:hazard.sourceId,amount:hazard.amount,direction:{x:0,y:-1},hitPosition:{x:this.player.x,y:this.player.y}});
    if(result?.accepted){this.arenaTelemetry?.recordHazardDamage?.(result.damageApplied);this.eventBus.emit('arena:hazard:player-hit',{amount:result.damageApplied,sourceId:hazard.sourceId});}
  }


  #interceptHostileProjectile(friendly, hostile) {
    if (!friendly?.active || !hostile?.active || !this.hostileProjectileInterceptionProvider?.()) return;
    const projectileId = hostile.activationId;
    this.projectileManager.deactivate(friendly, 'hostile-interception');
    this.enemyProjectileManager.deactivate(hostile, 'player-projectile');
    this.onHostileProjectileDestroyed?.(projectileId, 'player-projectile');
  }

  #enemyProjectile(projectile) {
    if (!projectile?.active) return;
    const result = this.#applyPlayer({ damageId: `enemy-projectile-${projectile.activationId}`, sourceType: 'sentry-projectile', sourceId: projectile.ownerId, amount: projectile.damage, direction: { x: projectile.body.velocity.x, y: projectile.body.velocity.y }, hitPosition: { x: projectile.x, y: projectile.y }, projectileActivationId: projectile.activationId });
    if (result?.accepted) this.statistics.recordHostileProjectileHit();
    const id=projectile.activationId;this.enemyProjectileManager.deactivate(projectile, result?.accepted ? 'player-hit' : 'player-invulnerable');this.onHostileProjectileDestroyed?.(id,result?.accepted?'player-hit':'player-invulnerable');
  }

  #applyPlayer({ damageId, sourceType, sourceId, amount, direction, hitPosition, projectileActivationId = null }) {
    const lastFrame = this.lastFrameProvider?.() ?? { available: false };
    const dashInvulnerable = this.playerController.dash.invulnerable;
    const hitInvulnerable = this.hitInvulnerability.active;
    const packet = createDamagePacket({ damageId, sourceFaction: FACTIONS.enemy, sourceType, sourceId, targetType: 'player', targetId: 'player', baseAmount: amount, finalAmount: amount, damageTags: sourceType==='arena-hazard'?['hazard']:['enemy'], hitPosition, direction, timestampMs: this.simulationTimeProvider(), projectileActivationId });
    const result = this.damageService.resolve(packet, this.playerTarget, { dashInvulnerable, hitInvulnerable, damageReduction: this.playerDamageReductionProvider?.() ?? 0, preventLethal: lastFrame.available, consumePreventLethal: lastFrame.consume });
    if (result.accepted) {
      this.statistics.recordDamageTaken(result.damageApplied);
      this.enemyManager?.onDamageDealt?.(sourceId, result.damageApplied);
      this.hitInvulnerability.start(lastFrame.triggered ? 1200 : this.hitInvulnerability.durationMs);
      this.playerController.setHitInvulnerable?.(true);
      this.onAcceptedPlayerDamage?.(result);
      this.eventBus.emit('player:health:changed', this.playerHealth.snapshot());
      this.eventBus.emit('player:damaged', { amount: result.damageApplied, remainingHealth: result.remainingHealth, x: this.player.x, y: this.player.y, sourceType, sourceId });
      if (result.targetDefeated) this.eventBus.emit('player:died', { sourceType, timestampMs: packet.timestampMs });
    } else if (result.rejectedReason === 'invulnerable') this.statistics.recordBlocked(dashInvulnerable ? 'dash' : 'hit');
    return result;
  }
}
