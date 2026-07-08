export function shortestAngularDistance(a, b) {
  let value = ((a - b + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (value < -Math.PI) value += Math.PI * 2;
  return Math.abs(value);
}

export function classifyBulwarkHit({ shieldAngle, incomingDirection, shieldArcRadians, sideTransitionRadians, frontalScalar }) {
  const incomingSourceAngle = Math.atan2(-incomingDirection.y, -incomingDirection.x);
  const difference = shortestAngularDistance(incomingSourceAngle, shieldAngle);
  const halfArc = shieldArcRadians / 2;
  if (difference <= halfArc) return { zone: 'front', scalar: frontalScalar };
  if (difference <= halfArc + sideTransitionRadians) {
    const progress = (difference - halfArc) / sideTransitionRadians;
    return { zone: 'side', scalar: frontalScalar + (1 - frontalScalar) * progress };
  }
  return { zone: 'rear', scalar: 1 };
}
