const KEYS = Object.freeze([
  'enemyScore', 'eliteScore', 'chamberScore', 'bossScore', 'crossfireScore',
  'bulwarkRearScore', 'nearMissScore', 'multiKillScore', 'timeBonus', 'avoidanceBonus',
]);
export function createScoreBreakdown(input = {}) {
  const result = {};
  for (const key of KEYS) result[key] = Math.max(0, Math.round(Number(input[key]) || 0));
  result.subtotal = Math.max(0, Math.round(input.subtotal === undefined || input.subtotal === null ? KEYS.reduce((sum, key) => sum + result[key], 0) : Number(input.subtotal) || 0));
  result.difficultyMultiplier = Number.isFinite(input.difficultyMultiplier) ? input.difficultyMultiplier : 1;
  result.finalScore = Math.max(0, Math.round(input.finalScore === undefined || input.finalScore === null ? result.subtotal * result.difficultyMultiplier : Number(input.finalScore) || 0));
  return Object.freeze(result);
}
