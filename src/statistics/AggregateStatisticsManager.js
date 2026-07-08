function add(record, key, value = 1) { record[key] = Math.max(0, Number(record[key]) || 0) + Math.max(0, Number(value) || 0); }
function ensure(save) {
  const stats = save.statistics;
  stats.aggregateCounters ??= {};
  stats.combatCounters ??= {};
  stats.echoCounters ??= {};
  stats.scoreCounters ??= {};
  stats.difficultyRecords ??= {};
  return stats;
}
export class AggregateStatisticsManager {
  apply(save, run) {
    const stats = ensure(save);
    const aggregate = stats.aggregateCounters;
    add(aggregate, 'runsCompleted'); add(aggregate, run.result === 'victory' ? 'victories' : 'defeats');
    add(aggregate, 'totalSimulationMs', run.durationMs); add(aggregate, 'totalScore', run.finalScore);
    aggregate.highestScore = Math.max(Number(aggregate.highestScore) || 0, run.finalScore);
    add(aggregate, 'totalEnemiesDefeated', run.totalEnemiesDefeated); add(aggregate, 'totalElitesDefeated', run.eliteParentsDefeated);
    add(aggregate, 'totalBossesDefeated', run.result === 'victory' ? 1 : 0);
    const combat = stats.combatCounters;
    for (const [key, value] of Object.entries(run.killsByEnemyType ?? {})) add(combat, `kills:${key}`, value);
    add(combat, 'damageDealt', (run.playerDamage ?? 0) + (run.echoDamage ?? 0)); add(combat, 'damageTaken', run.damageTaken);
    add(combat, 'criticalHits', run.criticalHits); add(combat, 'dashes', run.playerDashes); add(combat, 'damageFreeChambers', run.damageFreeStandardSegments);
    const echo = stats.echoCounters; add(echo, 'deployments', run.echoDeployments); add(echo, 'shots', run.echoShotsFired); add(echo, 'hits', run.echoProjectileHits); add(echo, 'damage', run.echoDamage); add(echo, 'kills', run.echoKills); add(echo, 'crossfireEvents', run.crossfireEvents);
    echo.highestDamageShare = Math.max(Number(echo.highestDamageShare) || 0, run.echoDamageShare);
    const score = stats.scoreCounters; add(score, 'totalScore', run.finalScore); add(score, 'totalCrossfireScore', run.scoreBreakdown.crossfireScore); add(score, 'totalNearMissScore', run.scoreBreakdown.nearMissScore); score.highestCombo = Math.max(Number(score.highestCombo) || 0, run.highestCombo); score.bestAvoidanceBonus = Math.max(Number(score.bestAvoidanceBonus) || 0, run.scoreBreakdown.avoidanceBonus); score.bestTimeBonus = Math.max(Number(score.bestTimeBonus) || 0, run.scoreBreakdown.timeBonus);
    score.categoryLifetimeTotals ??= {}; for (const [key, value] of Object.entries(run.scoreBreakdown)) if (key.endsWith('Score') || key.endsWith('Bonus')) add(score.categoryLifetimeTotals, key, value);
    const diff = stats.difficultyRecords[run.difficultyId] ?? { runs: 0, victories: 0, totalScore: 0, highestScore: 0 };
    add(diff, 'runs'); add(diff, 'victories', run.result === 'victory' ? 1 : 0); add(diff, 'totalScore', run.finalScore); diff.highestScore = Math.max(diff.highestScore, run.finalScore); stats.difficultyRecords[run.difficultyId] = diff;
    return structuredClone(stats);
  }
}
