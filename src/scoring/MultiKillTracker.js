import { COMBO_DEFINITIONS } from '../data/scoreDefinitions.js';

export class MultiKillTracker {
  constructor({ windowMs = COMBO_DEFINITIONS.multiKillWindowMs } = {}) {
    this.windowMs = Math.max(0, Number(windowMs) || 0);
    this.reset();
  }
  register({ targetId, simulationMs }) {
    const id = String(targetId);
    const now = Math.max(0, Number(simulationMs) || 0);
    if (this.seen.has(id)) return Object.freeze({ accepted: false, reason: 'duplicate-kill' });
    this.seen.add(id);
    const chained = this.lastKillMs !== null && now - this.lastKillMs <= this.windowMs;
    this.chainLength = chained ? this.chainLength + 1 : 1;
    this.lastKillMs = now;
    this.maximumChain = Math.max(this.maximumChain, this.chainLength);
    return Object.freeze({ accepted: true, extra: chained, chainLength: this.chainLength });
  }
  resetWindow() { this.lastKillMs = null; this.chainLength = 0; }
  reset() { this.seen = new Set(); this.lastKillMs = null; this.chainLength = 0; this.maximumChain = 0; }
  snapshot() { return Object.freeze({ chainLength: this.chainLength, maximumChain: this.maximumChain, seenCount: this.seen.size, lastKillMs: this.lastKillMs }); }
}
