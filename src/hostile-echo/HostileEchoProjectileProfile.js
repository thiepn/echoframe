import { BOSS_PROJECTILE_PROFILES } from '../data/bossProjectileDefinitions.js';
export function hostileEchoProjectileProfile(phase='IMITATE'){return phase==='DELETE'?BOSS_PROJECTILE_PROFILES.hostileEcho3:BOSS_PROJECTILE_PROFILES.hostileEcho2;}
