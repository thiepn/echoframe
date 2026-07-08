import { ENCOUNTER_BALANCE } from '../data/encounterBalance.js';
import { PROTOTYPE_ARENA } from '../data/prototypeArena.js';
import { CarrierShard } from '../entities/CarrierShard.js';
import { planCarrierHazards } from '../enemy-ai/carrierHazardPlacement.js';
import { CarrierShardPool } from '../pools/CarrierShardPool.js';

export class CarrierShardManager {
  constructor({ scene, eventBus, settingsManager, statistics, playerPositionProvider = null, arenaDescriptor = null }) {
    Object.assign(this, { scene, eventBus, settingsManager, statistics, playerPositionProvider, arenaDescriptor });
    this.group = scene.physics.add.group({ allowGravity: false });
    this.nextActivationId = 1;
    this.lastPlacementDiagnostics = null;
    this.pool = new CarrierShardPool({
      factory: () => {
        const shard = new CarrierShard(scene, settingsManager);
        this.group.add(shard.bodySprite);
        return shard;
      },
      initialCapacity: 12,
      expansionChunk: 3,
      hardCap: ENCOUNTER_BALANCE.carrierShardHardCap,
      onExhausted: (diagnostics) => console.warn('Carrier shard pool exhausted.', diagnostics),
    });
  }

  releaseFromCarrier(carrier) {
    const plan = planCarrierHazards({
      origin: { x: carrier.x, y: carrier.y },
      ownerId: carrier.enemyId,
      count: carrier.shardCount ?? 3,
      hazardRadius: carrier.hazardRadius,
      bounds: this.arenaDescriptor?.cameraBounds ?? PROTOTYPE_ARENA.bounds,
      walls: this.arenaDescriptor?.solidGeometry ?? PROTOTYPE_ARENA.walls,
      playerPosition: this.playerPositionProvider?.() ?? null,
    });
    this.lastPlacementDiagnostics = plan;
    let releasedCount = 0;
    for (const target of plan.points) {
      const shard = this.pool.acquire({
        activationId: this.nextActivationId++,
        ownerId: carrier.enemyId,
        sourceEventId: `carrier-release-${carrier.enemyId}`,
        x: carrier.x,
        y: carrier.y,
        targetX: target.x,
        targetY: target.y,
        travelDurationMs: 360,
        activationDelayMs: carrier.activationDelayMs,
        hazardDurationMs: carrier.hazardDurationMs,
        hazardRadius: carrier.hazardRadius,
        damage: carrier.hazardDamage,
        contactCooldownMs: 700,
      });
      if (!shard) continue;
      releasedCount += 1;
      this.eventBus.emit('enemy:carrier:released', {
        enemyId: carrier.enemyId,
        activationId: shard.activationId,
        targetX: target.x,
        targetY: target.y,
      });
    }
    if (!plan.valid || releasedCount < plan.requestedCount) {
      this.eventBus.emit('enemy:carrier:release:limited', {
        enemyId: carrier.enemyId,
        requested: plan.requestedCount,
        planned: plan.points.length,
        released: releasedCount,
        rejectionReasons: plan.rejectionReasons,
      });
    }
    return releasedCount;
  }

  update(deltaMs) {
    for (const shard of [...this.pool.activeItems]) if (shard.update(deltaMs)) this.deactivate(shard, 'lifetime');
    this.statistics?.recordSubordinatePeak?.(this.pool.activeItems.size);
  }

  deactivate(shard, reason = 'deactivate') {
    const id = shard.activationId;
    const released = this.pool.release(shard, reason);
    if (released) this.eventBus.emit('enemy:carrier:shard:deactivated', { activationId: id, reason });
    return released;
  }

  clear(reason = 'clear') { this.pool.releaseAll(reason); }
  getDiagnostics() { return { ...this.pool.diagnostics(), placement: this.lastPlacementDiagnostics }; }
  destroy() {
    this.clear('destroy');
    this.pool.destroy();
    if (this.group?.children) this.group.destroy?.(true);
    this.group = null;
  }
}
