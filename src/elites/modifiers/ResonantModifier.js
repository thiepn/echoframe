export class ResonantModifier {
  constructor({ definition, maximumHealth }) {
    this.definition = definition;
    this.maximumHealth = maximumHealth;
    this.reset();
  }

  reset() {
    this.shieldAmount = 0;
    this.shieldRemainingMs = 0;
    this.cooldownRemainingMs = 0;
    this.lastTrigger = null;
    this.processedDeathEventIds = new Set();
    this.endEvent = null;
  }

  update(deltaMs) {
    const delta = Math.max(0, Number(deltaMs) || 0);
    this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - delta);
    if (this.shieldAmount <= 0) return;
    this.shieldRemainingMs = Math.max(0, this.shieldRemainingMs - delta);
    if (this.shieldRemainingMs === 0) {
      this.shieldAmount = 0;
      this.endEvent = 'expired';
    }
  }

  onAlliedDeath({ x, y, distance, deathEventId }) {
    const eventId = String(deathEventId ?? '');
    if (!eventId || this.processedDeathEventIds.has(eventId)) return false;
    this.processedDeathEventIds.add(eventId);
    if (this.processedDeathEventIds.size > 64) this.processedDeathEventIds.delete(this.processedDeathEventIds.values().next().value);
    if (this.cooldownRemainingMs > 0 || distance > this.definition.triggerRadius || this.shieldAmount > 0) return false;
    this.shieldAmount = this.maximumHealth * this.definition.shieldRatio;
    this.shieldRemainingMs = this.definition.shieldDurationMs;
    this.cooldownRemainingMs = this.definition.internalCooldownMs;
    this.lastTrigger = Object.freeze({ x, y, deathEventId: eventId });
    this.endEvent = null;
    return true;
  }

  absorb(amount) {
    const incoming = Math.max(0, Number(amount) || 0);
    if (this.shieldAmount <= 0 || incoming <= 0) return Object.freeze({ absorbed: 0, remaining: incoming, diagnostics: Object.freeze({ modifierId: 'resonant', shieldRemaining: this.shieldAmount }) });
    const absorbed = Math.min(this.shieldAmount, incoming);
    this.shieldAmount = Math.max(0, this.shieldAmount - absorbed);
    if (this.shieldAmount === 0) {
      this.shieldRemainingMs = 0;
      this.endEvent = 'broken';
    }
    return Object.freeze({ absorbed, remaining: incoming - absorbed, diagnostics: Object.freeze({ modifierId: 'resonant', shieldRemaining: this.shieldAmount }) });
  }

  consumeEndEvent() {
    const event = this.endEvent;
    this.endEvent = null;
    return event;
  }

  snapshot() {
    return Object.freeze({ shieldAmount: this.shieldAmount, shieldRemainingMs: this.shieldRemainingMs, cooldownRemainingMs: this.cooldownRemainingMs, lastTrigger: this.lastTrigger, processedDeathEvents: this.processedDeathEventIds.size, pendingEndEvent: this.endEvent });
  }
}
