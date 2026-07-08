import { ELITE_ENCOUNTER_RULES } from '../data/eliteEncounterRules.js';

export class MajorExecutionCoordinator {
  constructor({ maximumExecutions = ELITE_ENCOUNTER_RULES.maximumMajorExecutionsPerWindow, windowMs = ELITE_ENCOUNTER_RULES.majorExecutionWindowMs } = {}) {
    this.maximumExecutions = Math.max(1, Number(maximumExecutions) || 1);
    this.windowMs = Math.max(1, Number(windowMs) || 1);
    this.elapsedMs = 0;
    this.executions = [];
  }

  update(deltaMs) {
    this.elapsedMs += Math.max(0, Number(deltaMs) || 0);
    this.#prune();
  }

  request(enemyId, executionType = 'major') {
    this.#prune();
    if (this.executions.length >= this.maximumExecutions) return false;
    this.executions.push(Object.freeze({ enemyId: String(enemyId ?? 'unknown'), executionType: String(executionType), timestampMs: this.elapsedMs }));
    return true;
  }

  reset() {
    this.elapsedMs = 0;
    this.executions.length = 0;
  }

  snapshot() {
    this.#prune();
    return Object.freeze({
      elapsedMs: this.elapsedMs,
      windowMs: this.windowMs,
      maximumExecutions: this.maximumExecutions,
      recentExecutions: Object.freeze(this.executions.map((entry) => Object.freeze({ ...entry }))),
    });
  }

  #prune() {
    const cutoff = this.elapsedMs - this.windowMs;
    while (this.executions.length && this.executions[0].timestampMs <= cutoff) this.executions.shift();
  }
}
