export class EchoCooldownModel {
  constructor(durationMs) {
    this.durationMs = Math.max(0, Number(durationMs) || 0);
    this.remainingMs = 0;
  }

  consume() {
    if (!this.isReady) {
      return false;
    }
    this.remainingMs = this.durationMs;
    return true;
  }

  update(deltaMs, recoveryScalar = 1) {
    const scalar = Math.max(0, Math.min(1, Number(recoveryScalar) || 0));
    this.remainingMs = Math.max(0, this.remainingMs - Math.max(0, Number(deltaMs) || 0) * scalar);
  }

  recover(amountMs) {
    this.remainingMs = Math.max(0, this.remainingMs - Math.max(0, Number(amountMs) || 0));
  }

  setDuration(durationMs, { preserveRatio = true } = {}) {
    const nextDuration = Math.max(0, Number(durationMs) || 0);
    const ratio = this.durationMs > 0 ? this.remainingMs / this.durationMs : 0;
    this.durationMs = nextDuration;
    this.remainingMs = preserveRatio
      ? Math.max(0, Math.min(nextDuration, nextDuration * ratio))
      : Math.max(0, Math.min(nextDuration, this.remainingMs));
  }

  forceReady() {
    this.remainingMs = 0;
  }

  reset() {
    this.remainingMs = 0;
  }

  get isReady() {
    return this.remainingMs <= 0;
  }

  get normalizedRemaining() {
    return this.durationMs > 0 ? Math.max(0, Math.min(1, this.remainingMs / this.durationMs)) : 0;
  }

  snapshot() {
    return {
      durationMs: this.durationMs,
      remainingMs: this.remainingMs,
      normalizedRemaining: this.normalizedRemaining,
      isReady: this.isReady,
    };
  }
}
