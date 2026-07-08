import { ENEMY_ROLES } from '../enemy-ai/EnemyRole.js';

export const ENEMY_SYNERGY_DEFINITIONS = Object.freeze([
  Object.freeze({ roles: Object.freeze([ENEMY_ROLES.pressure, ENEMY_ROLES.ranged]), weight: 1.2, danger: 1.08 }),
  Object.freeze({ roles: Object.freeze([ENEMY_ROLES.defender, ENEMY_ROLES.ranged]), weight: 1.15, danger: 1.12 }),
  Object.freeze({ roles: Object.freeze([ENEMY_ROLES.control, ENEMY_ROLES.burst]), weight: 0.65, danger: 1.25, maximumControl: 1, requiresRecovery: true }),
  Object.freeze({ roles: Object.freeze([ENEMY_ROLES.spawner, ENEMY_ROLES.defender]), weight: 0.8, danger: 1.18, maximumSpawners: 1 }),
]);

export const HARD_PAIRING_RULES = Object.freeze([
  Object.freeze({ id: 'double-control', role: ENEMY_ROLES.control, maximum: 1 }),
  Object.freeze({ id: 'double-spawner', role: ENEMY_ROLES.spawner, maximum: 2 }),
  Object.freeze({ id: 'triple-defender', role: ENEMY_ROLES.defender, maximum: 2 }),
]);
