import { getDifficultyCombatProfile } from './combatBalance.js';

export function getBossDifficultyRules(id = 'standard') {
  const base = getDifficultyCombatProfile(id);
  return Object.freeze({
    id,
    healthScalar: base.enemyHealth,
    projectileSpeedScalar: base.projectileSpeed,
    anticipationScalar: base.anticipation,
    recoveryScalar: base.recovery,
    playerInvulnerabilityScalar: base.hitInvulnerability,
  });
}
