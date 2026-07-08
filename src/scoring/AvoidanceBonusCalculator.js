import { clamp } from '../utils/math.js';
export function calculateAvoidanceBonus(damageTaken = 0) {
  const acceptedDamage = Math.max(0, Number(damageTaken) || 0);
  const avoidanceScalar = clamp(1 - acceptedDamage / 180, 0, 1);
  return Object.freeze({ damageTaken: acceptedDamage, avoidanceScalar, bonus: Math.round(1500 * avoidanceScalar) });
}
