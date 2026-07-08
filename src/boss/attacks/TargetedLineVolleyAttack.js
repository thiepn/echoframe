export function createTargetedLineVolleyPlan({ rng, phase = 'OBSERVE', player = { x: 800, y: 700 }, arenaBounds = { left: 80, right: 1520, top: 45, bottom: 855 }, firstUse = false } = {}) {
  const count = phase === 'DELETE' && rng.next() > 0.45 ? 3 : 2;
  const vertical = rng.next() > 0.5;
  const span = vertical ? arenaBounds.right - arenaBounds.left : arenaBounds.bottom - arenaBounds.top;
  const offsets = [];
  const safeOffset = Math.max(110, Math.min(240, span / 5));
  for (let i = 0; i < count; i += 1) offsets.push((i - (count - 1) / 2) * safeOffset + (rng.next() - 0.5) * 24);
  const anchor = vertical ? player.x : player.y;
  return Object.freeze({
    id: `line-${phase}-${vertical ? 'v' : 'h'}`,
    count,
    orientation: vertical ? 'vertical' : 'horizontal',
    positions: Object.freeze(offsets.map((offset) => anchor + offset)),
    telegraphMs: firstUse ? 1050 : 800,
    lockMs: 150,
    activeMs: 220,
    width: 46,
    damage: 18,
    blockable: false,
  });
}
export function validateLineVolleyPlan(plan, arenaBounds = { left: 80, right: 1520, top: 45, bottom: 855 }) {
  const reasons = [];
  if (![2,3].includes(plan.count)) reasons.push('line-count');
  if (plan.lockMs !== 150 || plan.damage !== 18) reasons.push('canonical-value');
  if (!plan.positions.every(Number.isFinite)) reasons.push('non-finite-position');
  const axisMin = plan.orientation === 'vertical' ? arenaBounds.left : arenaBounds.top;
  const axisMax = plan.orientation === 'vertical' ? arenaBounds.right : arenaBounds.bottom;
  const sorted = [...plan.positions].sort((a,b) => a-b);
  const boundaries = [axisMin, ...sorted, axisMax];
  let maximumGap = 0;
  for (let i = 1; i < boundaries.length; i += 1) maximumGap = Math.max(maximumGap, boundaries[i] - boundaries[i-1] - plan.width);
  if (maximumGap < 90) reasons.push('safe-route');
  return Object.freeze({ valid: reasons.length === 0, reasons: Object.freeze(reasons), maximumGap });
}
