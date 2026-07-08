export class ReplicatingModifier {
  constructor({ definition }) { this.definition = definition; this.reset(); }

  reset() {
    this.triggered = false;
    this.pendingMs = 0;
    this.outcome = null;
    this.copyEnemyId = null;
  }

  onAcceptedDamage({ damageApplied = 0, remainingHealth, maximumHealth, targetDefeated }) {
    if (this.triggered || targetDefeated || maximumHealth <= 0 || !(Number(damageApplied) > 0)) return false;
    if (remainingHealth > maximumHealth * this.definition.triggerHealthRatio) return false;
    this.triggered = true;
    this.pendingMs = this.definition.splitWarningMs;
    this.outcome = 'triggered';
    return true;
  }

  update(deltaMs) {
    if (this.pendingMs > 0) this.pendingMs = Math.max(0, this.pendingMs - Math.max(0, Number(deltaMs) || 0));
    return this.readyToSpawn;
  }

  get readyToSpawn() { return this.triggered && this.pendingMs === 0 && !this.copyEnemyId && this.outcome === 'triggered'; }
  markSpawned(enemyId) { this.copyEnemyId = enemyId; this.outcome = 'copy-spawned'; }
  markRejected() { this.pendingMs = 0; this.outcome = 'copy-spawn-rejected'; }
  cancel(reason) { if (this.pendingMs > 0 || this.outcome === 'triggered') { this.pendingMs = 0; this.outcome = reason; } }
  snapshot() { return Object.freeze({ triggered: this.triggered, pendingMs: this.pendingMs, outcome: this.outcome, copyEnemyId: this.copyEnemyId, readyToSpawn: this.readyToSpawn }); }
}
