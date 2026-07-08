import { COMBO_DEFINITIONS } from '../data/scoreDefinitions.js';

export class ComboController {
  constructor(definitions = COMBO_DEFINITIONS) {
    this.definitions = definitions;
    this.reset();
  }

  get multiplier() {
    return Math.min(
      this.definitions.maximumMultiplier,
      1 + Math.min(this.combo, this.definitions.multiplierComboCap) * this.definitions.multiplierPerPoint,
    );
  }

  gain(amount, simulationMs, source = 'unknown') {
    const value = Math.max(0, Number(amount) || 0);
    const before = this.combo;
    this.combo += value;
    this.highestCombo = Math.max(this.highestCombo, this.combo);
    this.lastGainMs = Math.max(0, Number(simulationMs) || 0);
    this.gainsBySource[source] = (this.gainsBySource[source] ?? 0) + value;
    return Object.freeze({ before, gain: value, after: this.combo, multiplierBefore: this.#multiplierFor(before), multiplierAfter: this.multiplier });
  }

  applyAcceptedDamage(simulationMs) {
    const before = this.combo;
    this.combo = Math.max(0, this.combo / 2);
    this.lastGainMs = Math.max(0, Number(simulationMs) || 0);
    this.damagePenalties += 1;
    return Object.freeze({ before, after: this.combo });
  }

  update(deltaMs, simulationMs, { paused = false } = {}) {
    if (paused) return 0;
    const now = Math.max(0, Number(simulationMs) || 0);
    if (now - this.lastGainMs < this.definitions.decayDelayMs || this.combo <= 0) return 0;
    const decay = Math.min(this.combo, Math.max(0, Number(deltaMs) || 0) * this.definitions.decayPerSecond / 1000);
    this.combo -= decay;
    this.decayedAmount += decay;
    return decay;
  }

  resetSegment() {
    const previous = this.combo;
    this.combo = 0;
    this.lastGainMs = 0;
    return previous;
  }

  reset() {
    this.combo = 0;
    this.highestCombo = 0;
    this.lastGainMs = 0;
    this.damagePenalties = 0;
    this.decayedAmount = 0;
    this.gainsBySource = {};
  }

  snapshot() {
    return Object.freeze({
      combo: this.combo,
      multiplier: this.multiplier,
      highestCombo: this.highestCombo,
      lastGainMs: this.lastGainMs,
      damagePenalties: this.damagePenalties,
      decayedAmount: this.decayedAmount,
      gainsBySource: Object.freeze({ ...this.gainsBySource }),
    });
  }

  #multiplierFor(combo) {
    return Math.min(this.definitions.maximumMultiplier, 1 + Math.min(combo, this.definitions.multiplierComboCap) * this.definitions.multiplierPerPoint);
  }
}
