import { TIME_DIFFICULTY_SCALARS, TIME_TARGETS_MS } from '../data/scoreDefinitions.js';
import { clamp } from '../utils/math.js';

function segmentKind(segmentId) {
  if (segmentId === 'null-architect-boss' || segmentId === 'boss') return 'boss';
  if (String(segmentId).startsWith('elite-')) return 'elite';
  if (String(segmentId).startsWith('combat-')) return 'normal';
  return null;
}

export function calculateTimeBonus({ eligibleCombatScore = 0, segmentDurations = {}, segmentScores = {}, difficultyId = 'standard' } = {}) {
  const scalar = TIME_DIFFICULTY_SCALARS[difficultyId] ?? 1;
  let weighted = 0;
  let weightTotal = 0;
  const segments = {};
  for (const [segmentId, rawDuration] of Object.entries(segmentDurations ?? {})) {
    const kind = segmentKind(segmentId);
    if (!kind) continue;
    const target = TIME_TARGETS_MS[kind];
    const lower = target.lower * scalar;
    const upper = target.upper * scalar;
    const duration = Math.max(0, Number(rawDuration) || 0);
    const efficiency = clamp((upper - duration) / Math.max(1, upper - lower), 0, 1);
    const weight = Math.max(1, Number(segmentScores[segmentId]) || 1);
    weighted += efficiency * weight;
    weightTotal += weight;
    segments[segmentId] = Object.freeze({ durationMs: duration, lowerTargetMs: lower, upperTargetMs: upper, efficiency, weight });
  }
  const weightedEfficiency = weightTotal > 0 ? weighted / weightTotal : 0;
  const bonus = Math.max(0, Math.round(Math.max(0, eligibleCombatScore) * 0.12 * weightedEfficiency));
  return Object.freeze({ bonus, weightedEfficiency, segments: Object.freeze(segments) });
}
