import { ENEMY_ROLES } from '../enemy-ai/EnemyRole.js';

export const ENCOUNTER_PHASES = Object.freeze({
  intro: 'INTRO',
  build: 'BUILD',
  pressure: 'PRESSURE',
  recovery: 'RECOVERY',
  climax: 'CLIMAX',
  complete: 'COMPLETE',
});

export const DIRECTOR_STATES = Object.freeze({
  idle: 'IDLE',
  generating: 'GENERATING',
  intro: 'INTRO',
  spawning: 'SPAWNING',
  active: 'ACTIVE',
  recovery: 'RECOVERY',
  complete: 'COMPLETE',
  failed: 'FAILED',
  disposed: 'DISPOSED',
});

export const ENCOUNTER_BALANCE = Object.freeze({
  generationVersion: 2,
  maximumAttempts: 48,
  threatToleranceBelow: 0.15,
  threatToleranceAbove: 0.08,
  maximumActiveEnemies: 20,
  technicalEnemyHardCap: 30,
  maximumMajorTelegraphs: 2,
  majorExecutionWindowMs: 300,
  minimumRecoveryMs: 1500,
  spawnSafetyRadius: Object.freeze({ relaxed: 300, standard: 260, overclocked: 230 }),
  perRoleCaps: Object.freeze({
    [ENEMY_ROLES.pressure]: 7,
    [ENEMY_ROLES.ranged]: 4,
    [ENEMY_ROLES.burst]: 3,
    [ENEMY_ROLES.spawner]: 2,
    [ENEMY_ROLES.defender]: 2,
    [ENEMY_ROLES.control]: 1,
  }),
  perTypeCaps: Object.freeze({ drifter: 10, sentry: 5, lancer: 3, 'shard-carrier': 2, bulwark: 2, suppressor: 1 }),
  projectilePressureWeights: Object.freeze({ drifter: 0, sentry: 3, lancer: 0, 'shard-carrier': 2, bulwark: 0, suppressor: 0 }),
  maximumProjectilePressure: 12,
  maximumBodyBlockPressure: 11,
  maximumControlPressure: 1,
  carrierShardHardCap: 24,
  recoveryRanges: Object.freeze({ betweenWaves: Object.freeze([1500, 3000]), afterPressure: Object.freeze([2500, 4000]) }),
  chamberProfiles: Object.freeze({
    1: Object.freeze({
      allowedEnemyTypes: Object.freeze(['drifter', 'sentry', 'lancer']),
      phases: Object.freeze(['INTRO', 'BUILD', 'PRESSURE', 'RECOVERY', 'CLIMAX']),
      targetThreats: Object.freeze([5, 7, 9, 0, 9]),
    }),
    2: Object.freeze({
      allowedEnemyTypes: Object.freeze(['drifter', 'sentry', 'lancer', 'shard-carrier', 'bulwark', 'suppressor']),
      phases: Object.freeze(['INTRO', 'BUILD', 'PRESSURE', 'RECOVERY', 'CLIMAX']),
      targetThreats: Object.freeze([8, 10, 13, 0, 18]),
    }),
  }),
});
