export class WeaponClock {
  constructor(intervalMs) {
    this.intervalMs = Math.max(1, Number(intervalMs) || 1);
    this.cooldownRemainingMs = 0;
    this.wasHeld = false;
  }

  update(deltaMs, { held, canFire }) {
    const delta = Math.max(0, Number(deltaMs) || 0);
    this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - delta);

    if (!held) {
      this.wasHeld = false;
      return false;
    }

    const freshPress = !this.wasHeld;
    this.wasHeld = true;
    if (!canFire) {
      return false;
    }

    if (freshPress || this.cooldownRemainingMs <= 0) {
      this.cooldownRemainingMs = this.intervalMs;
      return true;
    }
    return false;
  }

  suppressHeld() {
    this.wasHeld = true;
  }

  reset() {
    this.cooldownRemainingMs = 0;
    this.wasHeld = false;
  }

  snapshot() {
    return {
      intervalMs: this.intervalMs,
      cooldownRemainingMs: this.cooldownRemainingMs,
      wasHeld: this.wasHeld,
    };
  }
}
