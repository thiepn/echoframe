import {
  BULWARK_REAR_POINTS,
  CHAMBER_SCORES,
  COMBO_DEFINITIONS,
  CROSSFIRE_BASE_POINTS,
  DIFFICULTY_SCORE_MULTIPLIERS,
  ELITE_SCORE_SCALARS,
  ENEMY_BASE_SCORES,
  NEAR_MISS_POINTS,
  NEAR_MISS_RATE_LIMIT,
  SCORE_CATEGORIES,
  SCORE_EVENT_TYPES,
  STAGE_SCALARS,
} from '../data/scoreDefinitions.js';
import { calculateAvoidanceBonus } from './AvoidanceBonusCalculator.js';
import { ComboController } from './ComboController.js';
import { MultiKillTracker } from './MultiKillTracker.js';
import { createScoreBreakdown } from './ScoreBreakdown.js';
import { ScoreEventLedger } from './ScoreEventLedger.js';
import { calculateTimeBonus } from './TimeBonusCalculator.js';

function freeze(value) { return Object.freeze(structuredClone(value)); }
function segmentScoreCategory(segmentId) { return segmentId === 'null-architect-boss' || segmentId === 'boss' ? SCORE_CATEGORIES.boss : SCORE_CATEGORIES.chamber; }

export class ScoreManager {
  constructor({ runId, difficultyId = 'standard', eventBus = null } = {}) {
    this.runId = String(runId ?? 'run');
    this.difficultyId = difficultyId;
    this.eventBus = eventBus;
    this.ledger = new ScoreEventLedger({ runId: this.runId });
    this.combo = new ComboController();
    this.multiKill = new MultiKillTracker();
    this.nearMissProjectiles = new Set();
    this.nearMissTimestamps = [];
    this.segmentScores = {};
    this.telemetry = { accepted: 0, rejected: {}, nearMissAccepted: 0, nearMissRateLimited: 0, finalizations: 0, ledgerCapWarnings: 0 };
    this.finalized = null;
  }

  get currentScore() { return this.ledger.recomputeTotal(); }
  get comboMultiplier() { return this.combo.multiplier; }

  update(deltaMs, simulationMs, { paused = false } = {}) {
    const decayed = this.combo.update(deltaMs, simulationMs, { paused });
    if (decayed > 0) this.eventBus?.emit('score:combo:changed', this.snapshot());
    return decayed;
  }

  recordEnemyDefeat(payload, context = {}) {
    const type = payload?.enemyType;
    const base = ENEMY_BASE_SCORES[type];
    if (!base) return this.#reject('unknown-enemy');
    const isCopy = Boolean(payload.isEliteCopy);
    const modifier = payload.eliteModifierId;
    const isElite = Boolean(modifier) || isCopy;
    const scalar = isCopy ? ELITE_SCORE_SCALARS['replicating-copy'] : (modifier ? ELITE_SCORE_SCALARS[modifier] ?? 1 : 1);
    const eventType = isCopy ? SCORE_EVENT_TYPES.eliteCopyDefeat : isElite ? SCORE_EVENT_TYPES.eliteDefeat : SCORE_EVENT_TYPES.enemyDefeat;
    const category = isElite ? SCORE_CATEGORIES.elite : SCORE_CATEGORIES.enemy;
    const comboGain = isElite && !isCopy ? COMBO_DEFINITIONS.eliteKillGain : COMBO_DEFINITIONS.normalKillGain;
    const targetId = payload.enemyId ?? `${type}-${context.simulationMs ?? 0}`;
    const multi = this.multiKill.register({ targetId, simulationMs: context.simulationMs });
    const result = this.#award({
      eventType, category, basePoints: Math.round(base * scalar), comboGain,
      dedupeKey: `enemy-defeat:${targetId}`,
      sourceKind: payload.source ?? 'unknown', sourceId: payload.source ?? null,
      targetKind: type, targetId, context,
      metadata: { enemyType: type, eliteModifierId: modifier ?? null, isEliteCopy: isCopy, scoreScalar: scalar },
    });
    if (result.accepted && multi.accepted && multi.extra) {
      this.combo.gain(COMBO_DEFINITIONS.multiKillExtraGain, context.simulationMs, 'multi-kill');
      this.eventBus?.emit('score:combo:multi-kill', { chainLength: multi.chainLength, gain: COMBO_DEFINITIONS.multiKillExtraGain });
    }
    return result;
  }

  recordCrossfire(payload = {}, context = {}) {
    const segmentId = context.segmentId ?? payload.segmentId;
    return this.#award({
      eventType: SCORE_EVENT_TYPES.crossfire,
      category: SCORE_CATEGORIES.crossfire,
      basePoints: CROSSFIRE_BASE_POINTS,
      stageScalar: STAGE_SCALARS[segmentId] ?? 1,
      comboGain: COMBO_DEFINITIONS.crossfireGain,
      dedupeKey: `crossfire:${payload.crossfireEventId ?? `${payload.targetId}:${context.simulationMs}`}`,
      sourceKind: 'player-echo', sourceId: 'crossfire', targetKind: payload.targetKind ?? 'combat-target', targetId: payload.targetId,
      context, metadata: payload,
    });
  }

  recordBulwarkRearBreak(payload = {}, context = {}) {
    return this.#award({
      eventType: SCORE_EVENT_TYPES.bulwarkRearBreak,
      category: SCORE_CATEGORIES.bulwarkRear,
      basePoints: BULWARK_REAR_POINTS,
      comboEligible: false,
      comboGain: payload.crossfire ? COMBO_DEFINITIONS.crossfireGain : 0,
      dedupeKey: `bulwark-rear:${payload.enemyId}`,
      sourceKind: payload.source ?? 'player', sourceId: payload.source ?? null,
      targetKind: 'bulwark', targetId: payload.enemyId, context, metadata: payload,
    });
  }

  recordNearMiss(payload = {}, context = {}) {
    const projectileId = String(payload.projectileId ?? payload.activationId ?? 'unknown');
    if (this.nearMissProjectiles.has(projectileId)) return this.#reject('near-miss-duplicate');
    const now = Math.max(0, Number(context.simulationMs) || 0);
    this.nearMissTimestamps = this.nearMissTimestamps.filter((value) => now - value < 1000);
    if (this.nearMissTimestamps.length >= NEAR_MISS_RATE_LIMIT) {
      this.telemetry.nearMissRateLimited += 1;
      return this.#reject('near-miss-rate-limit');
    }
    this.nearMissProjectiles.add(projectileId);
    this.nearMissTimestamps.push(now);
    const result = this.#award({
      eventType: SCORE_EVENT_TYPES.nearMiss,
      category: SCORE_CATEGORIES.nearMiss,
      basePoints: NEAR_MISS_POINTS,
      comboGain: COMBO_DEFINITIONS.nearMissGain,
      dedupeKey: `near-miss:${projectileId}`,
      sourceKind: payload.sourceKind ?? 'hostile-projectile', sourceId: projectileId,
      targetKind: 'player', targetId: 'player', context, metadata: payload,
    });
    if (result.accepted) this.telemetry.nearMissAccepted += 1;
    return result;
  }

  recordSegmentClear(segmentId, context = {}) {
    const base = CHAMBER_SCORES[segmentId];
    if (!base) return this.#reject('non-scoring-segment');
    const category = segmentScoreCategory(segmentId);
    const result = this.#award({
      eventType: category === SCORE_CATEGORIES.boss ? SCORE_EVENT_TYPES.bossVictory : SCORE_EVENT_TYPES.chamberClear,
      category, basePoints: base, comboEligible: false, comboGain: 0,
      dedupeKey: `segment-clear:${segmentId}`, sourceKind: 'run-progression', sourceId: segmentId,
      targetKind: 'segment', targetId: segmentId, context: { ...context, segmentId }, metadata: { segmentId },
    });
    if (result.accepted) {
      this.segmentScores[segmentId] = base;
      this.combo.resetSegment();
      this.multiKill.resetWindow();
      this.eventBus?.emit('score:combo:changed', this.snapshot());
    }
    return result;
  }

  recordAcceptedDamage(amount, simulationMs) {
    if (!(Number(amount) > 0)) return Object.freeze({ accepted: false, reason: 'no-health-damage' });
    const change = this.combo.applyAcceptedDamage(simulationMs);
    this.eventBus?.emit('score:combo:penalty', change);
    this.eventBus?.emit('score:combo:changed', this.snapshot());
    return Object.freeze({ accepted: true, ...change });
  }

  finalize({ result = 'defeat', segmentDurations = {}, damageTaken = 0, durationMs = 0, debug = false } = {}) {
    if (this.finalized) return this.finalized;
    this.ledger.lock();
    const categoryTotals = this.ledger.totalsByCategory({ includeDebug: debug });
    const eligibleCombatScore = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
    const time = calculateTimeBonus({ eligibleCombatScore, segmentDurations, segmentScores: this.segmentScores, difficultyId: this.difficultyId });
    const avoidance = calculateAvoidanceBonus(damageTaken);
    const difficultyMultiplier = DIFFICULTY_SCORE_MULTIPLIERS[this.difficultyId] ?? 1;
    const breakdown = createScoreBreakdown({
      ...categoryTotals,
      timeBonus: time.bonus,
      avoidanceBonus: avoidance.bonus,
      subtotal: eligibleCombatScore + time.bonus + avoidance.bonus,
      difficultyMultiplier,
    });
    const finalScore = Math.max(0, Math.round(breakdown.subtotal * difficultyMultiplier));
    const reconciled = createScoreBreakdown({ ...breakdown, finalScore });
    this.telemetry.finalizations += 1;
    this.finalized = freeze({
      runId: this.runId, result, difficultyId: this.difficultyId, durationMs: Math.max(0, Number(durationMs) || 0),
      currentScore: this.currentScore, finalScore, breakdown: reconciled, timeBonusInputs: time,
      avoidanceBonusInputs: avoidance, combo: this.combo.snapshot(), ledger: this.ledger.snapshot(),
      debug: Boolean(debug), reconciliationMatches: this.ledger.recomputeTotal({ includeDebug: debug }) === eligibleCombatScore,
    });
    this.eventBus?.emit('score:finalized', this.finalized);
    return this.finalized;
  }

  reset() {
    this.ledger.reset(); this.combo.reset(); this.multiKill.reset(); this.nearMissProjectiles.clear(); this.nearMissTimestamps = [];
    this.segmentScores = {}; this.finalized = null;
  }

  snapshot() {
    return freeze({ currentScore: this.currentScore, combo: this.combo.snapshot(), ledgerSize: this.ledger.events.length, categoryTotals: this.ledger.totalsByCategory(), finalized: this.finalized, telemetry: this.telemetry, multiKill: this.multiKill.snapshot() });
  }

  #award({ eventType, category, basePoints, stageScalar = 1, comboGain = 0, comboEligible = true, dedupeKey, sourceKind, sourceId, targetKind, targetId, context = {}, metadata = {} }) {
    const comboBefore = this.combo.combo;
    const comboMultiplier = comboEligible ? this.combo.multiplier : 1;
    const awardedPoints = Math.max(0, Math.round((Number(basePoints) || 0) * (Number(stageScalar) || 1) * comboMultiplier));
    const gainPreview = comboGain > 0 ? { after: comboBefore + comboGain } : { after: comboBefore };
    const result = this.ledger.accept({
      runId: this.runId, simulationMs: Math.max(0, Number(context.simulationMs) || 0),
      segmentId: context.segmentId ?? null, segmentType: context.segmentType ?? null,
      eventType, sourceKind, sourceId, targetKind, targetId, basePoints, stageScalar,
      comboBefore, comboGain, comboAfter: gainPreview.after, comboMultiplier, awardedPoints, category, dedupeKey,
      debug: Boolean(context.debug), metadata,
    });
    if (!result.accepted) return this.#reject(result.reason);
    if (comboGain > 0) this.combo.gain(comboGain, context.simulationMs, eventType);
    this.telemetry.accepted += 1;
    this.eventBus?.emit('score:event:accepted', result.event);
    this.eventBus?.emit('score:changed', this.snapshot());
    return result;
  }

  #reject(reason) {
    this.telemetry.rejected[reason] = (this.telemetry.rejected[reason] ?? 0) + 1;
    if (reason === 'ledger-capacity') this.telemetry.ledgerCapWarnings += 1;
    this.eventBus?.emit('score:event:rejected', { reason });
    return Object.freeze({ accepted: false, reason });
  }
}
