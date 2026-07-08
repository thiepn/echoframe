export class NearMissTracker {
  constructor({ enemyProjectileManager, playerProvider, timeProvider, behavior, profileProvider, onReduction, onNearMiss = null, telemetry = null } = {}) {
    Object.assign(this, { enemyProjectileManager, playerProvider, timeProvider, behavior, profileProvider, onReduction, onNearMiss, telemetry });
    this.accumulator = 0;
    this.genericStates = new Map();
  }
  update(deltaMs) {
    this.accumulator += Math.max(0, Number(deltaMs) || 0);
    if (this.accumulator < 50) return;
    this.accumulator = 0;
    const player = this.playerProvider(); const profile = this.profileProvider?.();
    if (!player) return;
    const activeIds = new Set();
    for (const projectile of this.enemyProjectileManager.pool.activeItems) {
      const projectileId = String(projectile.activationId ?? projectile.projectileId ?? projectile.id ?? 'unknown');
      activeIds.add(projectileId);
      const distance = Math.hypot(projectile.x - player.x, projectile.y - player.y);
      let qualified = false;
      if (profile && this.behavior) {
        const reduction = this.behavior.register({ projectileId, distance, playerRadius: 20, nowMs: this.timeProvider(), profile });
        if (reduction) { this.onReduction?.(reduction); qualified = true; }
      } else {
        const state = this.genericStates.get(projectileId) ?? { minimumDistance: Number.POSITIVE_INFINITY, previousDistance: Number.POSITIVE_INFINITY, awarded: false };
        state.minimumDistance = Math.min(state.minimumDistance, distance);
        const movingAway = Number.isFinite(state.previousDistance) && distance > state.previousDistance + 3;
        if (!state.awarded && state.minimumDistance <= 48 && state.minimumDistance > 20 && movingAway) { state.awarded = true; qualified = true; }
        state.previousDistance = distance;
        this.genericStates.set(projectileId, state);
      }
      if (qualified) {
        this.onNearMiss?.({ projectileId, sourceKind: projectile.sourceType ?? 'hostile-projectile', distance });
        if (this.telemetry) this.telemetry.nearMisses = (this.telemetry.nearMisses ?? 0) + 1;
      }
    }
    for (const id of this.genericStates.keys()) if (!activeIds.has(id)) this.genericStates.delete(id);
  }
  reset() { this.behavior?.reset?.(); this.accumulator = 0; this.genericStates.clear(); }
}
