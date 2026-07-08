import { BOSS_PHASES } from './bossBalance.js';

export const BOSS_ATTACK_CATEGORIES = Object.freeze({
  minorProjectile: 'MINOR_PROJECTILE', majorProjectile: 'MAJOR_PROJECTILE', summon: 'SUMMON', hostileEcho: 'HOSTILE_ECHO', sector: 'SECTOR', vulnerability: 'VULNERABILITY', transition: 'TRANSITION',
});
const attack = (value) => Object.freeze({ ...value, phases: Object.freeze([...value.phases]) });
export const BOSS_ATTACK_DEFINITIONS = Object.freeze([
  attack({ id: 'rotating-fan', category: BOSS_ATTACK_CATEGORIES.majorProjectile, phases: [BOSS_PHASES.observe,BOSS_PHASES.imitate,BOSS_PHASES.delete], cooldownMs: Object.freeze({ OBSERVE: 4200, IMITATE: 3900, DELETE: 3700 }), major: true }),
  attack({ id: 'targeted-line-volley', category: BOSS_ATTACK_CATEGORIES.majorProjectile, phases: [BOSS_PHASES.observe,BOSS_PHASES.imitate,BOSS_PHASES.delete], cooldownMs: Object.freeze({ OBSERVE: 5500, IMITATE: 5200, DELETE: 5000 }), major: true }),
  attack({ id: 'drifter-summon', category: BOSS_ATTACK_CATEGORIES.summon, phases: [BOSS_PHASES.observe,BOSS_PHASES.imitate], cooldownMs: Object.freeze({ OBSERVE: 9000, IMITATE: 9500 }), major: false }),
  attack({ id: 'hostile-echo', category: BOSS_ATTACK_CATEGORIES.hostileEcho, phases: [BOSS_PHASES.imitate,BOSS_PHASES.delete], cooldownMs: Object.freeze({ IMITATE: 7200, DELETE: 6500 }), major: true }),
  attack({ id: 'sector-deletion', category: BOSS_ATTACK_CATEGORIES.sector, phases: [BOSS_PHASES.delete], cooldownMs: Object.freeze({ DELETE: 7500 }), major: true }),
  attack({ id: 'rear-panel-exposure', category: BOSS_ATTACK_CATEGORIES.vulnerability, phases: [BOSS_PHASES.delete], cooldownMs: Object.freeze({ DELETE: 5800 }), major: false }),
]);
export const BOSS_ATTACKS_BY_ID = Object.freeze(Object.fromEntries(BOSS_ATTACK_DEFINITIONS.map((item) => [item.id,item])));
