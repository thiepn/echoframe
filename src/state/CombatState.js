export const COMBAT_STATES = Object.freeze({
  initializing: 'INITIALIZING',
  chamberIntro: 'CHAMBER_INTRO',
  active: 'COMBAT_ACTIVE',
  recovery: 'RECOVERY',
  chamberClear: 'CHAMBER_CLEAR',
  upgrade: 'UPGRADE_SELECTION',
  finalUpgrade: 'FINAL_UPGRADE',
  bossIntro: 'BOSS_INTRO',
  bossActive: 'BOSS_ACTIVE',
  bossTransition: 'BOSS_TRANSITION',
  bossDestruction: 'BOSS_DESTRUCTION',
  victory: 'VICTORY',
  defeat: 'DEFEAT',
  results: 'RESULTS',
  bossReady: 'BOSS_READY',
  transitioning: 'TRANSITIONING',
  dead: 'PLAYER_DEAD',
  complete: 'RUN_COMPLETE',
  closed: 'CLOSED',
  disposed: 'DISPOSED',
});
export class CombatState {
  constructor() { this.value = COMBAT_STATES.initializing; }
  set(value) { this.value = value; return this; }
  is(value) { return this.value === value; }
}
