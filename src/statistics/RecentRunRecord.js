function finite(value, fallback = 0) { return Number.isFinite(value) ? value : fallback; }
function strings(value, limit = 64) { return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string').slice(0, limit) : []; }
export function createRecentRunRecord(input = {}) {
  const output = {
    runId: String(input.runId ?? `legacy-run-${Number.isFinite(input.index) ? input.index : 'unknown'}`),
    completedAt: typeof input.completedAt === 'string' ? input.completedAt : new Date().toISOString(),
    result: input.result === 'victory' ? 'victory' : 'defeat',
    seed: Math.max(0, Math.trunc(finite(input.seed))),
    difficultyId: ['relaxed', 'standard', 'overclocked'].includes(input.difficultyId) ? input.difficultyId : 'standard',
    finalScore: Math.max(0, Math.round(finite(input.finalScore))),
    subtotal: Math.max(0, Math.round(finite(input.subtotal))),
    durationMs: Math.max(0, finite(input.durationMs)),
    bossDurationMs: Math.max(0, finite(input.bossDurationMs)),
    bossPhaseReached: input.bossPhaseReached === null || input.bossPhaseReached === undefined ? null : String(input.bossPhaseReached),
    finalPlayerHealth: Math.max(0, finite(input.finalPlayerHealth)),
    damageTaken: Math.max(0, finite(input.damageTaken)),
    highestCombo: Math.max(0, finite(input.highestCombo)),
    crossfireEvents: Math.max(0, Math.trunc(finite(input.crossfireEvents))),
    nearMisses: Math.max(0, Math.trunc(finite(input.nearMisses))),
    playerDamage: Math.max(0, finite(input.playerDamage)),
    echoDamage: Math.max(0, finite(input.echoDamage)),
    selectedUpgradeHistory: Array.isArray(input.selectedUpgradeHistory) ? structuredClone(input.selectedUpgradeHistory.slice(0, 32)) : [],
    arenaSequence: strings(input.arenaSequence, 16),
    eliteModifiers: strings(input.eliteModifiers, 16),
    newUnlockIds: strings(input.newUnlockIds, 32),
    personalBestIds: strings(input.personalBestIds, 32),
  };
  if (Number.isFinite(input.index)) output.index = input.index;
  return Object.freeze(output);
}
