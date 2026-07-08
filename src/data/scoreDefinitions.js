export const ENEMY_BASE_SCORES = Object.freeze({
  drifter: 100,
  sentry: 180,
  lancer: 280,
  'shard-carrier': 300,
  bulwark: 450,
  suppressor: 520,
});

export const ELITE_SCORE_SCALARS = Object.freeze({
  overclocked: 2,
  replicating: 1.5,
  resonant: 1.9,
  'replicating-copy': 0.5,
});

export const CHAMBER_SCORES = Object.freeze({
  'combat-1': 500,
  'combat-2': 650,
  'elite-1': 900,
  'combat-3': 750,
  'combat-4': 900,
  'elite-2': 1200,
  'null-architect-boss': 5000,
  boss: 5000,
});

export const DIFFICULTY_SCORE_MULTIPLIERS = Object.freeze({
  relaxed: 0.75,
  standard: 1,
  overclocked: 1.35,
});

export const STAGE_SCALARS = Object.freeze({
  'combat-1': 1,
  'combat-2': 1.1,
  'elite-1': 1.35,
  'combat-3': 1.25,
  'combat-4': 1.4,
  'elite-2': 1.65,
  'null-architect-boss': 2,
  boss: 2,
});

export const SCORE_CATEGORIES = Object.freeze({
  enemy: 'enemyScore',
  elite: 'eliteScore',
  chamber: 'chamberScore',
  boss: 'bossScore',
  crossfire: 'crossfireScore',
  bulwarkRear: 'bulwarkRearScore',
  nearMiss: 'nearMissScore',
  multiKill: 'multiKillScore',
  time: 'timeBonus',
  avoidance: 'avoidanceBonus',
});

export const SCORE_EVENT_TYPES = Object.freeze({
  enemyDefeat: 'enemy-defeat',
  eliteDefeat: 'elite-defeat',
  eliteCopyDefeat: 'elite-copy-defeat',
  chamberClear: 'chamber-clear',
  bossVictory: 'boss-victory',
  crossfire: 'crossfire',
  bulwarkRearBreak: 'bulwark-rear-break',
  nearMiss: 'near-miss',
});

export const COMBO_DEFINITIONS = Object.freeze({
  normalKillGain: 1,
  eliteKillGain: 3,
  crossfireGain: 0.5,
  nearMissGain: 0.2,
  multiKillExtraGain: 0.5,
  multiKillWindowMs: 600,
  decayDelayMs: 2000,
  decayPerSecond: 1,
  multiplierPerPoint: 0.03,
  multiplierComboCap: 20,
  maximumMultiplier: 1.6,
});

export const TIME_TARGETS_MS = Object.freeze({
  normal: Object.freeze({ lower: 75000, upper: 110000 }),
  elite: Object.freeze({ lower: 60000, upper: 90000 }),
  boss: Object.freeze({ lower: 210000, upper: 300000 }),
});

export const TIME_DIFFICULTY_SCALARS = Object.freeze({ relaxed: 1.15, standard: 1, overclocked: 0.9 });
export const SCORE_LEDGER_CAPACITY = 4096;
export const NEAR_MISS_POINTS = 15;
export const NEAR_MISS_RATE_LIMIT = 4;
export const CROSSFIRE_BASE_POINTS = 40;
export const BULWARK_REAR_POINTS = 75;
