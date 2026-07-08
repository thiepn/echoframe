import { ELITE_ELIGIBILITY } from '../data/eliteEligibilityDefinitions.js';

export function isEliteEligible({ enemyType, modifierId, isCopy = false, isBoss = false } = {}) {
  if (isBoss || isCopy) return false;
  return ELITE_ELIGIBILITY[modifierId]?.includes(enemyType) ?? false;
}

export function eligibleHosts(modifierId, allowedEnemyTypes = []) {
  return allowedEnemyTypes.filter((enemyType) => isEliteEligible({ enemyType, modifierId }));
}
