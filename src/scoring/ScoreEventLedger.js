import { SCORE_LEDGER_CAPACITY } from '../data/scoreDefinitions.js';
import { createScoreEvent } from './ScoreEvent.js';

export class ScoreEventLedger {
  constructor({ runId, capacity = SCORE_LEDGER_CAPACITY } = {}) {
    this.runId = String(runId ?? 'unknown-run');
    this.capacity = Math.max(1, Math.trunc(capacity));
    this.events = [];
    this.dedupeKeys = new Set();
    this.nextSequence = 1;
    this.locked = false;
    this.rejections = {};
  }

  accept(input) {
    const rejection = this.#validate(input);
    if (rejection) return this.#reject(rejection);
    const event = createScoreEvent({
      ...input,
      runId: this.runId,
      sequenceNumber: this.nextSequence,
      scoreEventId: input.scoreEventId ?? `${this.runId}:score:${this.nextSequence}`,
    });
    this.nextSequence += 1;
    this.events.push(event);
    this.dedupeKeys.add(event.dedupeKey);
    return Object.freeze({ accepted: true, event });
  }

  lock() { this.locked = true; }
  unlockForReset() { this.locked = false; }

  reset() {
    this.events = [];
    this.dedupeKeys.clear();
    this.nextSequence = 1;
    this.locked = false;
    this.rejections = {};
  }

  totalsByCategory({ includeDebug = true } = {}) {
    const totals = {};
    for (const event of this.events) {
      if (!includeDebug && event.debug) continue;
      totals[event.category] = (totals[event.category] ?? 0) + event.awardedPoints;
    }
    return Object.freeze({ ...totals });
  }

  recomputeTotal({ includeDebug = true } = {}) {
    return this.events.reduce((sum, event) => sum + (includeDebug || !event.debug ? event.awardedPoints : 0), 0);
  }

  snapshot() {
    return Object.freeze({
      runId: this.runId,
      capacity: this.capacity,
      size: this.events.length,
      locked: this.locked,
      nextSequence: this.nextSequence,
      total: this.recomputeTotal(),
      categoryTotals: this.totalsByCategory(),
      rejections: Object.freeze({ ...this.rejections }),
      events: Object.freeze([...this.events]),
    });
  }

  #validate(input) {
    if (this.locked) return 'post-outcome';
    if (this.events.length >= this.capacity) return 'ledger-capacity';
    if (!input || typeof input !== 'object') return 'invalid-event';
    if (input.runId !== undefined && String(input.runId) !== this.runId) return 'cross-run';
    if (!input.eventType || !input.category || !input.dedupeKey) return 'missing-fields';
    if (this.dedupeKeys.has(String(input.dedupeKey))) return 'duplicate';
    if (!Number.isFinite(input.awardedPoints)) return 'non-finite-points';
    if (Math.round(input.awardedPoints) < 0) return 'negative-points';
    if (!Number.isFinite(input.simulationMs) || input.simulationMs < 0) return 'invalid-time';
    return null;
  }

  #reject(reason) {
    this.rejections[reason] = (this.rejections[reason] ?? 0) + 1;
    return Object.freeze({ accepted: false, reason });
  }
}
