import { BOSS_ATTACK_DEFINITIONS, BOSS_ATTACKS_BY_ID } from '../data/bossAttackDefinitions.js';
export class BossAttackCatalog{all(){return BOSS_ATTACK_DEFINITIONS;}get(id){return BOSS_ATTACKS_BY_ID[id]??null;}forPhase(phase){return BOSS_ATTACK_DEFINITIONS.filter((attack)=>attack.phases.includes(phase));}}
