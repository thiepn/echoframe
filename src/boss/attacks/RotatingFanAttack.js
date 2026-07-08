const TAU = Math.PI * 2;
function normalizeAngle(value) { let result = value % TAU; if (result < 0) result += TAU; return result; }
export function createRotatingFanPlan({ rng, phase = 'OBSERVE', playerAngle = 0, firstUse = false, emissionIndex = 0 } = {}) {
  const count = rng.integer(8, 12);
  const gapWidth = (rng.integer(55, 80) * Math.PI) / 180;
  const baseGapCenter = normalizeAngle(playerAngle + Math.PI + (rng.next() - 0.5) * 0.7);
  const gapCenter = normalizeAngle(baseGapCenter + emissionIndex * (0.28 + rng.next() * 0.16));
  const spacing = TAU / count;
  const angles = [];
  for (let i = 0; i < count; i += 1) {
    const angle = normalizeAngle(i * spacing + rng.next() * spacing * 0.16);
    let distance = Math.abs(normalizeAngle(angle - gapCenter));
    distance = Math.min(distance, TAU - distance);
    if (distance >= gapWidth / 2) angles.push(angle);
  }
  while (angles.length < 8) {
    const angle = normalizeAngle(gapCenter + gapWidth / 2 + spacing * (angles.length + 1));
    angles.push(angle);
  }
  return Object.freeze({
    id: `fan-${phase}-${emissionIndex}`,
    count: angles.length,
    angles: Object.freeze(angles.slice(0, 12)),
    gapCenter,
    gapWidth,
    damage: 12,
    speed: 330,
    telegraphMs: firstUse ? 950 : 650,
    emissions: phase === 'DELETE' ? 3 : 2,
    intervalMs: 430,
  });
}
export function validateRotatingFanPlan(plan) {
  const reasons = [];
  if (plan.count < 8 || plan.count > 12) reasons.push('projectile-count');
  if (plan.speed !== 330) reasons.push('projectile-speed');
  if (!(plan.gapWidth >= 55 * Math.PI / 180)) reasons.push('gap-width');
  if (!plan.angles.every(Number.isFinite)) reasons.push('non-finite-angle');
  return Object.freeze({ valid: reasons.length === 0, reasons: Object.freeze(reasons) });
}
