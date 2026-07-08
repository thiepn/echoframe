export class SuppressionModifierService {
  constructor({ eventBus = null } = {}) { this.eventBus = eventBus; this.reset(); }
  reset() { this.sources = new Map(); this.scalar = 1; this.active = false; }

  update(suppressors, playerPosition) {
    const previous = this.active;
    this.sources.clear();
    for (const enemy of suppressors) {
      if (!enemy.fieldActive) continue;
      const distance = Math.hypot(playerPosition.x - enemy.x, playerPosition.y - enemy.y);
      if (distance <= enemy.fieldRadius) this.sources.set(enemy.enemyId, enemy.echoRecoveryScalar);
    }
    this.#recalculate(previous);
    return this.scalar;
  }

  removeSource(enemyId) {
    const previous = this.active;
    const removed = this.sources.delete(enemyId);
    if (removed) this.#recalculate(previous);
    return removed;
  }

  snapshot() { return { active: this.active, scalar: this.scalar, sourceIds: [...this.sources.keys()] }; }

  #recalculate(previousActive) {
    this.scalar = this.sources.size ? Math.min(...this.sources.values()) : 1;
    this.active = this.scalar < 1;
    if (!previousActive && this.active) this.eventBus?.emit('enemy:suppressor:suppression:started', this.snapshot());
    if (previousActive && !this.active) this.eventBus?.emit('enemy:suppressor:suppression:ended', this.snapshot());
  }
}
