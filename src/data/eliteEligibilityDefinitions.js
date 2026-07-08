import { CORE_ENEMY_TYPE_LIST } from './coreEnemyDefinitions.js';
import { ELITE_MODIFIER_TYPES } from '../elites/EliteModifierType.js';

export const ELITE_ELIGIBILITY = Object.freeze({
  [ELITE_MODIFIER_TYPES.overclocked]: Object.freeze([...CORE_ENEMY_TYPE_LIST]),
  [ELITE_MODIFIER_TYPES.replicating]: Object.freeze(CORE_ENEMY_TYPE_LIST.filter((type) => type !== 'suppressor')),
  [ELITE_MODIFIER_TYPES.resonant]: Object.freeze([...CORE_ENEMY_TYPE_LIST]),
});
