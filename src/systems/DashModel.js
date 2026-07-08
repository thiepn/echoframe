import { chooseDashDirection } from '../utils/playerMath.js';

export class DashModel {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.active = false;
    this.direction = { x: 1, y: 0 };
    this.remainingMs = 0;
    this.cooldownRemainingMs = 0;
    this.invulnerabilityRemainingMs = 0;
    this.buffered = false;
    this.wallRecoveryRemainingMs = 0;
    this.distance = 0;
  }

  request({ movement, aim, canStart, distance }) {
    if (!canStart || this.active) {
      return { started: false, buffered: false };
    }
    if (this.cooldownRemainingMs <= 0) {
      this.start({ movement, aim, distance });
      return { started: true, buffered: false };
    }
    if (this.cooldownRemainingMs <= this.config.inputBufferMs) {
      this.buffered = true;
      return { started: false, buffered: true };
    }
    return { started: false, buffered: false };
  }

  start({ movement, aim, distance }) {
    this.active = true;
    this.direction = chooseDashDirection(movement, aim);
    this.remainingMs = this.config.durationMs;
    this.invulnerabilityRemainingMs = this.config.invulnerabilityMs;
    this.wallRecoveryRemainingMs = 0;
    this.distance = Math.max(0, Number(distance) || 0);
    this.buffered = false;
  }

  update(deltaMs, { canStartBuffered, movement, aim, bufferedDistance }) {
    const delta = Math.max(0, Number(deltaMs) || 0);
    this.invulnerabilityRemainingMs = Math.max(
      0,
      this.invulnerabilityRemainingMs - delta,
    );

    if (this.active) {
      if (this.wallRecoveryRemainingMs > 0) {
        this.wallRecoveryRemainingMs = Math.max(
          0,
          this.wallRecoveryRemainingMs - delta,
        );
        if (this.wallRecoveryRemainingMs === 0) {
          this.finish();
          return { ended: true, startedBuffered: false };
        }
        return { ended: false, startedBuffered: false };
      }

      this.remainingMs = Math.max(0, this.remainingMs - delta);
      if (this.remainingMs === 0) {
        this.finish();
        return { ended: true, startedBuffered: false };
      }
      return { ended: false, startedBuffered: false };
    }

    this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - delta);
    if (this.buffered && this.cooldownRemainingMs === 0 && canStartBuffered) {
      this.start({ movement, aim, distance: bufferedDistance });
      return { ended: false, startedBuffered: true };
    }
    return { ended: false, startedBuffered: false };
  }

  notifyWallStop() {
    if (!this.active || this.wallRecoveryRemainingMs > 0) {
      return false;
    }
    this.remainingMs = 0;
    this.wallRecoveryRemainingMs = this.config.wallStopRecoveryMs;
    return true;
  }

  finish() {
    this.active = false;
    this.remainingMs = 0;
    this.wallRecoveryRemainingMs = 0;
    this.cooldownRemainingMs = this.config.cooldownMs;
  }

  get velocityScalar() {
    if (!this.active || this.wallRecoveryRemainingMs > 0) {
      return 0;
    }
    return this.distance / (this.config.durationMs / 1000);
  }

  get invulnerable() {
    return this.invulnerabilityRemainingMs > 0;
  }

  snapshot() {
    return {
      active: this.active,
      direction: { ...this.direction },
      remainingMs: this.remainingMs,
      cooldownRemainingMs: this.cooldownRemainingMs,
      invulnerabilityRemainingMs: this.invulnerabilityRemainingMs,
      buffered: this.buffered,
      wallRecoveryRemainingMs: this.wallRecoveryRemainingMs,
      distance: this.distance,
    };
  }
}
