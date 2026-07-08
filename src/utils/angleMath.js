export function normalizeAngle(angle) {
  const tau = Math.PI * 2;
  let normalized = (Number(angle) || 0) % tau;
  if (normalized > Math.PI) {
    normalized -= tau;
  } else if (normalized < -Math.PI) {
    normalized += tau;
  }
  return normalized;
}

export function shortestAngleDelta(fromAngle, toAngle) {
  return normalizeAngle(normalizeAngle(toAngle) - normalizeAngle(fromAngle));
}

export function lerpAngle(fromAngle, toAngle, alpha) {
  const t = Math.max(0, Math.min(1, Number(alpha) || 0));
  return normalizeAngle(normalizeAngle(fromAngle) + shortestAngleDelta(fromAngle, toAngle) * t);
}
