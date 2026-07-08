function value(input, key, fallback = 0) { const number = Number(input?.[key]); return Number.isFinite(number) ? number : fallback; }
export function buildFinalizedRunModel({ run, result, scoreFinalization, debug = false } = {}) {
  const statistics = result.statistics ?? run.statistics?.combat ?? {};
  const boss = result.bossTelemetry ?? run.statistics?.boss ?? {};
  const playerDamage = value(statistics, 'playerDamageDealt') + value(boss, 'bossDamageByPlayer');
  const echoDamage = value(statistics, 'echoDamageDealt') + value(boss, 'bossDamageByEcho');
  const totalDamage = playerDamage + echoDamage;
  const segmentDurations = result.segmentDurations ?? run.segmentDurations ?? {};
  const damageFreeStandardSegments = Object.keys(segmentDurations).filter((id) => /^(combat|elite)-/.test(id) && (run.segmentHealthStart?.[id] ?? 0) <= (run.segmentHealthEnd?.[id] ?? -1)).length;
  const lowerTargets = { 'combat-1': 75000, 'combat-2': 75000, 'combat-3': 75000, 'combat-4': 75000, 'elite-1': 60000, 'elite-2': 60000 };
  const efficientDashSegments = Object.entries(segmentDurations).filter(([id, duration]) => lowerTargets[id] && duration <= lowerTargets[id] && value(statistics, 'playerDashes') > 0).length;
  const killsByEnemyType = {
    drifter: value(statistics, 'driftersDefeated'), sentry: value(statistics, 'sentriesDefeated'), lancer: value(statistics, 'lancersDefeated'),
    'shard-carrier': value(statistics, 'shardCarriersDefeated'), bulwark: value(statistics, 'bulwarksDefeated'), suppressor: value(statistics, 'suppressorsDefeated'),
  };
  const lastFrameUses = value(boss, 'lastFrameUses');
  const defensiveInteractions = value(boss, 'bossProjectileInterceptions') + value(boss, 'hostileEchoesDestroyed') + value(statistics, 'damageBlockedByDash') + value(statistics, 'damageBlockedByHitInvulnerability');
  return Object.freeze({
    runId: run.runId, seed: run.seed, difficultyId: run.difficultyId, result: result.result === 'victory' ? 'victory' : 'defeat', debug: Boolean(debug),
    durationMs: Math.max(0, Number(result.durationMs ?? run.combatElapsedMs) || 0), bossDurationMs: Math.max(0, Number(result.bossDurationMs) || 0),
    bossPhaseReached: result.bossPhase ?? run.bossPhase ?? null, bossReached: Boolean(run.bossStarted || result.bossImplemented),
    finalPlayerHealth: Math.max(0, Number(result.finalPlayerHealth ?? run.playerHealth) || 0), damageTaken: value(statistics, 'damageTaken'),
    finalScore: scoreFinalization.finalScore, subtotal: scoreFinalization.breakdown.subtotal, scoreBreakdown: scoreFinalization.breakdown,
    highestCombo: scoreFinalization.combo.highestCombo, crossfireEvents: value(statistics, 'crossfireEvents'), nearMisses: value(run.scoreManager?.telemetry, 'nearMissAccepted'),
    playerDamage, echoDamage, echoDamageShare: totalDamage > 0 ? echoDamage / totalDamage : 0,
    playerShotsFired: value(statistics, 'playerShotsFired'), playerProjectileHits: value(statistics, 'playerProjectileHits'),
    playerAccuracy: value(statistics, 'playerShotsFired') > 0 ? value(statistics, 'playerProjectileHits') / value(statistics, 'playerShotsFired') : 0,
    echoShotsFired: value(statistics, 'echoShotsFired'), echoProjectileHits: value(statistics, 'echoProjectileHits'),
    playerDashes: value(statistics, 'playerDashes'), criticalHits: value(statistics, 'criticalHits'), echoDeployments: value(statistics, 'echoDeployments'),
    playerKills: value(statistics, 'playerKills'), echoKills: value(statistics, 'echoKills'), totalEnemiesDefeated: value(statistics, 'playerKills') + value(statistics, 'echoKills'),
    killsByEnemyType, eliteParentsDefeated: (result.eliteModifiersDefeated ?? run.eliteModifiersDefeated ?? []).length,
    eliteModifiersDefeated: [...(result.eliteModifiersDefeated ?? run.eliteModifiersDefeated ?? [])],
    selectedUpgradeHistory: structuredClone(result.selectedUpgradeHistory ?? run.selectedUpgradeHistory ?? []),
    arenaSequence: (result.arenaSequence ?? run.arenaSequence ?? []).map((entry) => typeof entry === 'string' ? entry : entry.templateId ?? entry.arenaInstanceId ?? 'unknown'),
    segmentDurations: structuredClone(segmentDurations), damageFreeStandardSegments, efficientDashSegments,
    cleanVectorSegments: damageFreeStandardSegments > 0 && value(statistics, 'playerDashes') >= 3 ? damageFreeStandardSegments : 0,
    defensiveInteractions, lastFrameUses, destructionSkipped: Boolean(result.destructionSkipped),
  });
}
