export class RecoveryWindowController {
  constructor() { this.reset(); }
  start(durationMs) { if (this.active) return false; this.active = true; this.completed = false; this.durationMs = Math.max(0, Number(durationMs) || 0); this.remainingMs = this.durationMs; return true; }
  update(deltaMs, { paused = false } = {}) { if (!this.active || paused) return false; this.remainingMs = Math.max(0, this.remainingMs - Math.max(0, Number(deltaMs) || 0)); if (this.remainingMs <= 0) { this.active = false; this.completed = true; return true; } return false; }
  reset() { this.active = false; this.completed = false; this.durationMs = 0; this.remainingMs = 0; }
  snapshot() { return { active: this.active, completed: this.completed, durationMs: this.durationMs, remainingMs: this.remainingMs }; }
}
