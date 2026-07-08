import { BOSS_BALANCE } from '../data/bossBalance.js';
import { getBossDifficultyRules } from '../data/bossDifficultyRules.js';
export function createBossActivationProfile(difficultyId='standard'){const difficulty=getBossDifficultyRules(difficultyId);return Object.freeze({maximumHealth:Math.round(BOSS_BALANCE.health*difficulty.healthScalar),contactDamage:BOSS_BALANCE.contactDamage,projectileSpeedScalar:difficulty.projectileSpeedScalar,anticipationScalar:difficulty.anticipationScalar,recoveryScalar:difficulty.recoveryScalar});}
