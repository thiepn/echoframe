import { UNLOCK_DEFINITIONS } from '../data/progressionDefinitions.js';

function echoShare(run) {
  if (Number.isFinite(run.echoDamageShare)) return Math.max(0, Math.min(1, run.echoDamageShare));
  const player = Math.max(0, Number(run.playerDamage ?? run.statistics?.playerDamageDealt) || 0);
  const echo = Math.max(0, Number(run.echoDamage ?? run.statistics?.echoDamageDealt) || 0);
  return player + echo > 0 ? echo / (player + echo) : 0;
}

export class UnlockEvaluator {
  evaluate({ finalizedRun = {}, save = {} } = {}) {
    const already = new Set(save.progression?.unlockRecords?.map((entry) => entry.unlockId) ?? []);
    const run = finalizedRun;
    const standard = run.difficultyId === 'standard';
    const victory = run.result === 'victory';
    const nonDebug = !run.debug;
    const conditions = {
      'unlock-twin-recall': nonDebug && (run.crossfireEvents ?? 0) > 0,
      'unlock-vector-reversal': nonDebug && (run.eliteParentsDefeated ?? run.eliteModifiersDefeated?.length ?? 0) > 0,
      'unlock-null-absorption': nonDebug && standard && (run.damageFreeStandardSegments ?? 0) > 0,
      'unlock-memory-burst': nonDebug && Boolean(run.bossReached),
      'unlock-afterburn': nonDebug && standard && (run.efficientDashSegments ?? 0) > 0,
      'unlock-deflection-pulse': nonDebug && standard && victory && (run.defensiveInteractions ?? 0) >= 12,
      'unlock-overclocked': nonDebug && standard && victory,
      'unlock-signal-restored': nonDebug && standard && victory,
      'unlock-memory-violet': nonDebug && victory && echoShare(run) >= 0.35,
      'unlock-architect-fracture': nonDebug && victory && (run.lastFrameUses ?? 0) === 0,
      'unlock-resonant-wave': nonDebug && victory && echoShare(run) >= 0.35,
      'unlock-clean-vector': nonDebug && standard && (run.cleanVectorSegments ?? 0) > 0,
      'unlock-station-cyan': nonDebug && run.difficultyId === 'overclocked' && victory,
    };
    return Object.freeze(UNLOCK_DEFINITIONS
      .filter((definition) => conditions[definition.id] && !already.has(definition.id))
      .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id)));
  }
}
