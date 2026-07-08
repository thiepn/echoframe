import { BossProjectile } from '../entities/BossProjectile.js';
import { ProjectilePool } from '../pools/ProjectilePool.js';
import { BOSS_BALANCE } from '../data/bossBalance.js';
import { BOSS_PROJECTILE_PROFILES } from '../data/bossProjectileDefinitions.js';

export class BossProjectileManager {
  constructor({ scene, eventBus, telemetry, difficultyRules, arenaBounds }) {
    Object.assign(this, { scene, eventBus, telemetry, difficultyRules, arenaBounds });
    this.group = scene.physics.add.group({ allowGravity: false, immovable: false });
    this.nextActivationId = 1;
    this.pool = new ProjectilePool({
      factory: () => { const projectile = new BossProjectile(scene); this.group.add(projectile); projectile.setData('bossProjectileEntity', projectile); return projectile; },
      initialCapacity: 48,
      expansionChunk: 12,
      hardCap: BOSS_BALANCE.projectileCaps.total,
      onExhausted: (diagnostics) => this.eventBus?.emit('boss:projectile:pool-exhausted', diagnostics),
    });
  }
  activate({ profileId = 'fan', x, y, direction, ownerId = 'null-architect', sourceType = null, overrides = {} }) {
    const profile = BOSS_PROJECTILE_PROFILES[profileId] ?? BOSS_PROJECTILE_PROFILES.fan;
    const projectile = this.pool.acquire({
      activationId: this.nextActivationId++,
      profileId,
      ownerId,
      sourceType: sourceType ?? (profileId.startsWith('hostile') ? 'hostile-echo-projectile' : 'boss-projectile'),
      x, y, direction,
      speed: (overrides.speed ?? profile.speed) * (this.difficultyRules?.projectileSpeedScalar ?? 1),
      damage: overrides.damage ?? profile.damage,
      radius: overrides.radius ?? profile.radius,
      lifetimeMs: overrides.lifetimeMs ?? profile.lifetimeMs,
      blockable: overrides.blockable ?? profile.blockable,
      color: overrides.color ?? profile.color,
    });
    if (!projectile) return null;
    const diagnostics = this.pool.diagnostics();
    this.telemetry?.observeMaximum('maximumProjectiles', diagnostics.active);
    this.eventBus?.emit('boss:projectile:activated', { activationId: projectile.activationId, profileId, ownerId, x, y });
    return projectile;
  }
  update(deltaMs) {
    const margin = 100;
    for (const projectile of [...this.pool.activeItems]) {
      const alive = projectile.updateLifetime(deltaMs);
      const inside = projectile.x >= this.arenaBounds.left-margin && projectile.x <= this.arenaBounds.right+margin && projectile.y >= this.arenaBounds.top-margin && projectile.y <= this.arenaBounds.bottom+margin;
      if (!alive) this.deactivate(projectile, 'lifetime'); else if (!inside) this.deactivate(projectile, 'outside-arena');
    }
  }
  deactivate(projectile, reason = 'deactivate') {
    if (!projectile?.active) return false;
    const payload = { activationId: projectile.activationId, profileId: projectile.profileId, ownerId: projectile.ownerId, reason, blockable: projectile.blockable };
    const released = this.pool.release(projectile, reason);
    if (released) this.eventBus?.emit('boss:projectile:deactivated', payload);
    return released;
  }
  clear(reason = 'clear') { for (const projectile of [...this.pool.activeItems]) this.deactivate(projectile, reason); }
  getDiagnostics() { const diagnostics = this.pool.diagnostics(); const byProfile = {}; for (const projectile of this.pool.activeItems) byProfile[projectile.profileId] = (byProfile[projectile.profileId] ?? 0) + 1; return { ...diagnostics, byProfile }; }
  destroy() { this.clear('destroy'); this.pool.destroy(); this.group.destroy(true); }
}
