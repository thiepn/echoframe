import { ELITE_MODIFIER_TYPES } from '../elites/EliteModifierType.js';

const freeze = (value) => Object.freeze(value);

export const ELITE_MODIFIER_DEFINITIONS = freeze({
  [ELITE_MODIFIER_TYPES.overclocked]: freeze({
    id: ELITE_MODIFIER_TYPES.overclocked,
    displayName: 'Overclocked',
    healthScalar: 1.3,
    movementScalar: 1.15,
    anticipationScalar: 0.85,
    recoveryScalar: 0.8,
    damageScalar: 1,
    threatSurcharge: 3,
    scoreScalar: 2,
    color: 0xff9d45,
    tags: freeze(['accelerated', 'timing-pressure']),
  }),
  [ELITE_MODIFIER_TYPES.replicating]: freeze({
    id: ELITE_MODIFIER_TYPES.replicating,
    displayName: 'Replicating',
    healthScalar: 1.15,
    movementScalar: 1,
    anticipationScalar: 1,
    recoveryScalar: 1,
    damageScalar: 1,
    triggerHealthRatio: 0.5,
    copyHealthRatio: 0.5,
    copyDamageScalar: 0.8,
    copySpeedScalar: 0.95,
    splitWarningMs: 900,
    threatSurcharge: 4,
    scoreScalar: 1.5,
    copyScoreScalar: 0.5,
    color: 0xff9d45,
    tags: freeze(['subordinate', 'capacity-reservation']),
  }),
  [ELITE_MODIFIER_TYPES.resonant]: freeze({
    id: ELITE_MODIFIER_TYPES.resonant,
    displayName: 'Resonant',
    healthScalar: 1.2,
    movementScalar: 1,
    anticipationScalar: 1,
    recoveryScalar: 1,
    damageScalar: 1,
    shieldRatio: 0.24,
    shieldDurationMs: 3500,
    triggerRadius: 300,
    internalCooldownMs: 2500,
    threatSurcharge: 4,
    scoreScalar: 1.9,
    color: 0xff9d45,
    tags: freeze(['shield', 'ally-death-reactive']),
  }),
});

export const getEliteModifierDefinition = (id) => ELITE_MODIFIER_DEFINITIONS[id] ?? null;
