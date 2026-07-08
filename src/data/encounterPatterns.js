import { ENEMY_ROLES } from '../enemy-ai/EnemyRole.js';
import { ENCOUNTER_PHASES } from './encounterBalance.js';

const pattern = (id, options) => Object.freeze({ id, ...options });
export const ENCOUNTER_PATTERNS = Object.freeze({
  introduction: pattern('INTRODUCTION', { phases: Object.freeze([ENCOUNTER_PHASES.intro]), minimumTypes: 1, maximumTypes: 2, simultaneousSpawnLimit: 2, requiredRoles: Object.freeze([]), allowedRoles: Object.freeze(Object.values(ENEMY_ROLES)), requiresRecovery: false }),
  pressureLine: pattern('PRESSURE_LINE', { phases: Object.freeze([ENCOUNTER_PHASES.build, ENCOUNTER_PHASES.pressure]), minimumTypes: 1, maximumTypes: 2, simultaneousSpawnLimit: 3, requiredRoles: Object.freeze([ENEMY_ROLES.pressure]), allowedRoles: Object.freeze([ENEMY_ROLES.pressure, ENEMY_ROLES.burst, ENEMY_ROLES.ranged]), requiresRecovery: false }),
  rangedCross: pattern('RANGED_CROSS', { phases: Object.freeze([ENCOUNTER_PHASES.build, ENCOUNTER_PHASES.pressure]), minimumTypes: 2, maximumTypes: 3, simultaneousSpawnLimit: 3, requiredRoles: Object.freeze([ENEMY_ROLES.ranged]), allowedRoles: Object.freeze([ENEMY_ROLES.ranged, ENEMY_ROLES.pressure, ENEMY_ROLES.defender]), requiresRecovery: false }),
  burstWindow: pattern('BURST_WINDOW', { phases: Object.freeze([ENCOUNTER_PHASES.build, ENCOUNTER_PHASES.pressure]), minimumTypes: 1, maximumTypes: 2, simultaneousSpawnLimit: 2, requiredRoles: Object.freeze([ENEMY_ROLES.burst]), allowedRoles: Object.freeze([ENEMY_ROLES.burst, ENEMY_ROLES.pressure]), requiresRecovery: true }),
  controlZone: pattern('CONTROL_ZONE', { phases: Object.freeze([ENCOUNTER_PHASES.pressure, ENCOUNTER_PHASES.climax]), minimumTypes: 2, maximumTypes: 3, simultaneousSpawnLimit: 3, requiredRoles: Object.freeze([ENEMY_ROLES.control]), allowedRoles: Object.freeze([ENEMY_ROLES.control, ENEMY_ROLES.pressure, ENEMY_ROLES.burst]), requiresRecovery: true }),
  defensiveCore: pattern('DEFENSIVE_CORE', { phases: Object.freeze([ENCOUNTER_PHASES.build, ENCOUNTER_PHASES.pressure, ENCOUNTER_PHASES.climax]), minimumTypes: 2, maximumTypes: 4, simultaneousSpawnLimit: 4, requiredRoles: Object.freeze([ENEMY_ROLES.defender]), allowedRoles: Object.freeze([ENEMY_ROLES.defender, ENEMY_ROLES.ranged, ENEMY_ROLES.pressure, ENEMY_ROLES.spawner]), requiresRecovery: false }),
  mixedEscalation: pattern('MIXED_ESCALATION', { phases: Object.freeze([ENCOUNTER_PHASES.pressure, ENCOUNTER_PHASES.climax]), minimumTypes: 3, maximumTypes: 5, simultaneousSpawnLimit: 4, requiredRoles: Object.freeze([]), allowedRoles: Object.freeze(Object.values(ENEMY_ROLES)), requiresRecovery: true }),
  recovery: pattern('RECOVERY', { phases: Object.freeze([ENCOUNTER_PHASES.recovery]), minimumTypes: 0, maximumTypes: 0, simultaneousSpawnLimit: 0, requiredRoles: Object.freeze([]), allowedRoles: Object.freeze([]), requiresRecovery: false }),
  finale: pattern('FINALE', { phases: Object.freeze([ENCOUNTER_PHASES.climax]), minimumTypes: 2, maximumTypes: 6, simultaneousSpawnLimit: 4, requiredRoles: Object.freeze([]), allowedRoles: Object.freeze(Object.values(ENEMY_ROLES)), requiresRecovery: false }),
});
export const ENCOUNTER_PATTERN_LIST = Object.freeze(Object.values(ENCOUNTER_PATTERNS));
