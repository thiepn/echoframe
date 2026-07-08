const METRICS = Object.freeze({
  highestScore: 'higher', victoryScore: 'higher', fastestVictoryMs: 'lower', fastestBossMs: 'lower',
  highestCombo: 'higher', crossfireEvents: 'higher', echoDamageShare: 'higher', lowestDamageTaken: 'lower', playerAccuracy: 'higher',
});

function compare(direction, candidate, previous) {
  if (previous === null || previous === undefined) return 'FIRST_RECORD';
  if (candidate === previous) return 'TIED_BEST';
  if ((direction === 'higher' && candidate > previous) || (direction === 'lower' && candidate < previous)) return 'NEW_BEST';
  return 'BELOW_BEST';
}

export class PersonalBestManager {
  compare({ save, run }) {
    if (run.debug) return Object.freeze([]);
    const difficulty = run.difficultyId;
    const current = save.statistics.personalBests?.[difficulty] ?? {};
    const playerShots = Math.max(0, Number(run.playerShotsFired) || 0);
    const values = {
      highestScore: run.finalScore,
      highestCombo: run.highestCombo,
      crossfireEvents: run.crossfireEvents,
      echoDamageShare: run.echoDamageShare,
    };
    if (run.result === 'victory') {
      values.victoryScore = run.finalScore;
      values.fastestVictoryMs = run.durationMs;
      values.fastestBossMs = run.bossDurationMs;
      values.lowestDamageTaken = run.damageTaken;
    }
    if (playerShots >= 50) values.playerAccuracy = run.playerAccuracy;
    const comparisons = [];
    for (const [metric, value] of Object.entries(values)) {
      if (!Number.isFinite(value)) continue;
      const previousRecord = current[metric] ?? null;
      const previous = previousRecord?.value ?? null;
      const label = compare(METRICS[metric], value, previous);
      comparisons.push(Object.freeze({ metric, direction: METRICS[metric], oldValue: previous, newValue: value, difference: previous === null || previous === undefined ? null : value - previous, label }));
    }
    return Object.freeze(comparisons);
  }

  apply(save, run, comparisons, completedAt = new Date().toISOString()) {
    if (run.debug) return Object.freeze([]);
    save.statistics.personalBests ??= {};
    const difficulty = run.difficultyId;
    save.statistics.personalBests[difficulty] ??= {};
    const updated = [];
    for (const comparison of comparisons) {
      if (!['FIRST_RECORD', 'NEW_BEST'].includes(comparison.label)) continue;
      save.statistics.personalBests[difficulty][comparison.metric] = {
        value: comparison.newValue, runId: run.runId, seed: run.seed, date: completedAt,
        difficultyId: difficulty, result: run.result,
      };
      updated.push(`${difficulty}:${comparison.metric}`);
    }
    return Object.freeze(updated);
  }
}
