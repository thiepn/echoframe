export const BOSS_BALANCE = Object.freeze({
  id: 'null-architect',
  generationVersion: 1,
  health: 3600,
  phaseThresholds: Object.freeze({ observe: 0.70, imitate: 0.35, delete: 0 }),
  contactDamage: 20,
  contactCooldownMs: 700,
  addThreatCap: 8,
  maximumInvulnerableMs: 2800,
  minimumVulnerableMs: 3500,
  targetFightDurationMs: Object.freeze([210000, 300000]),
  phaseTransitionMs: 1350,
  intro: Object.freeze({ firstMs: 3200, repeatedMs: 1500 }),
  vulnerability: Object.freeze({ openingMs: 850, vulnerableMs: 4200, closingMs: 650, closedCycleMs: 2600 }),
  longFightThresholdMs: 420000,
  longFightRecoveryScalar: 0.90,
  projectileCaps: Object.freeze({ fan: 72, hostileEcho: 32, other: 24, total: 96 }),
  destruction: Object.freeze({ freezeMs: 110, destabilizeMs: 700, fractureStageMs: 450, settleMs: 1000 }),
});

export const BOSS_PHASES = Object.freeze({
  observe: 'OBSERVE',
  imitate: 'IMITATE',
  delete: 'DELETE',
});

export const BOSS_VULNERABILITY_STATES = Object.freeze({
  closed: 'CLOSED', opening: 'OPENING', vulnerable: 'VULNERABLE', closing: 'CLOSING',
});
