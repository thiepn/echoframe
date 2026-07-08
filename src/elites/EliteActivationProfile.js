import { getEliteModifierDefinition } from '../data/eliteModifierDefinitions.js';
import { ELITE_BALANCE } from '../data/eliteBalance.js';

const finitePositive = (value, fallback = 1) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

export function applyEliteAnticipation(profile, baseMs) {
  const base = Math.max(0, Number(baseMs) || 0);
  return Math.max(profile.anticipationFloorMs, base * profile.anticipationMultiplier);
}

export function applyEliteRecovery(profile, baseMs) {
  const base = Math.max(0, Number(baseMs) || 0);
  return Math.max(profile.recoveryFloorMs, base * profile.recoveryMultiplier);
}

export function createEliteActivationProfile({ enemyType, enemyDefinition, difficultyProfile, elite = null, copyProfile = null } = {}) {
  if (!enemyDefinition) throw new Error(`Missing enemy definition for ${enemyType ?? 'unknown'}.`);
  const difficulty = difficultyProfile ?? {};
  const modifier = elite ? getEliteModifierDefinition(elite.modifierId) : null;
  const healthScalar = finitePositive(copyProfile?.healthScalar ?? modifier?.healthScalar, 1);
  const movementScalar = finitePositive(copyProfile?.movementScalar ?? modifier?.movementScalar, 1);
  const damageScalar = finitePositive(copyProfile?.damageScalar ?? modifier?.damageScalar, 1);
  const anticipationScalar = finitePositive(modifier?.anticipationScalar, 1);
  const recoveryScalar = finitePositive(modifier?.recoveryScalar, 1);
  const difficultyHealthScalar = finitePositive(difficulty.enemyHealth, 1);
  const difficultyMovementScalar = finitePositive(difficulty.enemyMovement, 1);
  const difficultyAnticipationScalar = finitePositive(difficulty.anticipation, 1);
  const difficultyRecoveryScalar = finitePositive(difficulty.recovery, 1);
  const maximumHealth = Math.max(1, Math.round(copyProfile?.maximumHealth ?? (enemyDefinition.health * healthScalar * difficultyHealthScalar)));
  const moveSpeed = enemyDefinition.moveSpeed * movementScalar * difficultyMovementScalar;
  const profile = {
    enemyType,
    maximumHealth,
    moveSpeed,
    healthScalar,
    movementScalar,
    damageScalar,
    anticipationScalar,
    recoveryScalar,
    difficultyHealthScalar,
    difficultyMovementScalar,
    difficultyAnticipationScalar,
    difficultyRecoveryScalar,
    anticipationMultiplier: anticipationScalar * difficultyAnticipationScalar,
    recoveryMultiplier: recoveryScalar * difficultyRecoveryScalar,
    anticipationFloorMs: ELITE_BALANCE.anticipationFloorsMs[enemyType] ?? 0,
    recoveryFloorMs: ELITE_BALANCE.recoveryFloorMs,
    modifierId: elite?.modifierId ?? null,
    eliteInstanceId: elite?.eliteInstanceId ?? null,
    threatSurcharge: Math.max(0, Number(elite?.threatSurcharge) || 0),
    isElite: Boolean(elite),
    isCopy: Boolean(copyProfile),
    copyOfEliteInstanceId: copyProfile?.copyOfEliteInstanceId ?? null,
    copyProfile: copyProfile ? Object.freeze({ ...copyProfile }) : null,
  };
  return Object.freeze(profile);
}
