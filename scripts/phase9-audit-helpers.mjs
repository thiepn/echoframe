import { ScoreManager } from '../src/scoring/ScoreManager.js';
import { SeededRandom } from '../src/utils/SeededRandom.js';

export const DIFFICULTIES = ['relaxed', 'standard', 'overclocked'];
export const SEGMENTS = ['combat-1', 'combat-2', 'elite-1', 'combat-3', 'combat-4', 'elite-2', 'null-architect-boss'];
export const ENEMIES = ['drifter', 'sentry', 'lancer', 'shard-carrier', 'bulwark', 'suppressor'];
export const ELITES = ['overclocked', 'replicating', 'resonant'];

export function runScoreSimulation({ seed, difficultyId, result = 'victory' }) {
  const rng = new SeededRandom(seed);
  const manager = new ScoreManager({ runId: `audit-${difficultyId}-${seed}`, difficultyId });
  const segmentDurations = {};
  let simulationMs = 0;
  let damageTaken = 0;
  let enemyIndex = 0;
  let duplicateAccepted = 0;
  let scoreAfterOutcomeAccepted = 0;
  for (const segmentId of SEGMENTS) {
    const isBoss = segmentId === 'null-architect-boss';
    const isElite = segmentId.startsWith('elite-');
    const count = isBoss ? 4 : rng.integer(5, 11);
    for (let i = 0; i < count; i += 1) {
      simulationMs += rng.integer(90, 650);
      const enemyType = rng.pick(ENEMIES);
      const modifier = isElite && i === 0 ? rng.pick(ELITES) : null;
      const isCopy = modifier === 'replicating' && i === 1;
      const payload = { enemyId: `enemy-${enemyIndex++}`, enemyType, eliteModifierId: isCopy ? null : modifier, isEliteCopy: isCopy, source: i % 3 === 0 ? 'echo' : 'player' };
      const accepted = manager.recordEnemyDefeat(payload, { simulationMs, segmentId, segmentType: isBoss ? 'BOSS' : isElite ? 'ELITE' : 'COMBAT' });
      const duplicate = manager.recordEnemyDefeat(payload, { simulationMs, segmentId });
      if (duplicate.accepted) duplicateAccepted += 1;
      if (!accepted.accepted) throw new Error(`Expected enemy event acceptance: ${accepted.reason}`);
      if (rng.next() < 0.24) manager.recordCrossfire({ crossfireEventId: `cross-${seed}-${segmentId}-${i}`, targetId: payload.enemyId }, { simulationMs: simulationMs + 1, segmentId });
      if (rng.next() < 0.22) manager.recordNearMiss({ projectileId: `near-${seed}-${segmentId}-${i}` }, { simulationMs: simulationMs + 2, segmentId });
      if (rng.next() < 0.08) { const amount = rng.integer(4, 18); damageTaken += amount; manager.recordAcceptedDamage(amount, simulationMs + 3); }
      manager.update(rng.integer(16, 120), simulationMs + 20, { paused: false });
    }
    const kindBase = isBoss ? rng.integer(215000, 295000) : isElite ? rng.integer(62000, 89000) : rng.integer(76000, 108000);
    segmentDurations[segmentId] = kindBase;
    if (result === 'victory' || !isBoss) manager.recordSegmentClear(segmentId, { simulationMs: simulationMs + kindBase, segmentId });
    simulationMs += kindBase;
  }
  const finalized = manager.finalize({ result, segmentDurations, damageTaken, durationMs: simulationMs });
  const after = manager.recordNearMiss({ projectileId: `post-${seed}` }, { simulationMs: simulationMs + 1, segmentId: 'boss' });
  if (after.accepted) scoreAfterOutcomeAccepted += 1;
  return structuredClone({ finalized, snapshot: manager.snapshot(), duplicateAccepted, scoreAfterOutcomeAccepted });
}
