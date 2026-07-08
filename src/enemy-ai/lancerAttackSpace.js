import { normalizeArenaBounds } from '../utils/arenaGeometry.js';

const EPSILON = 1e-6;

function normalizeDirection(direction) {
  const x = Number(direction?.x) || 0;
  const y = Number(direction?.y) || 0;
  const length = Math.hypot(x, y);
  if (length <= EPSILON) return null;
  return { x: x / length, y: y / length };
}

function rayAabbEntryDistance(origin, direction, rectangle) {
  let minimum = -Infinity;
  let maximum = Infinity;
  for (const axis of ['x', 'y']) {
    const value = origin[axis];
    const delta = direction[axis];
    const lower = rectangle[axis === 'x' ? 'left' : 'top'];
    const upper = rectangle[axis === 'x' ? 'right' : 'bottom'];
    if (Math.abs(delta) <= EPSILON) {
      if (value < lower || value > upper) return null;
      continue;
    }
    const first = (lower - value) / delta;
    const second = (upper - value) / delta;
    const near = Math.min(first, second);
    const far = Math.max(first, second);
    minimum = Math.max(minimum, near);
    maximum = Math.min(maximum, far);
    if (minimum > maximum) return null;
  }
  if (maximum < 0) return null;
  return Math.max(0, minimum);
}

function distanceToArenaEdge(origin, direction, bounds, radius) {
  const normalized = normalizeArenaBounds(bounds);
  const rectangle = {
    left: normalized.left + radius,
    right: normalized.right - radius,
    top: normalized.top + radius,
    bottom: normalized.bottom - radius,
  };
  const distances = [];
  if (direction.x > EPSILON) distances.push((rectangle.right - origin.x) / direction.x);
  else if (direction.x < -EPSILON) distances.push((rectangle.left - origin.x) / direction.x);
  if (direction.y > EPSILON) distances.push((rectangle.bottom - origin.y) / direction.y);
  else if (direction.y < -EPSILON) distances.push((rectangle.top - origin.y) / direction.y);
  return Math.min(...distances.filter((value) => value >= 0));
}

/**
 * Compute a wall-safe Lancer lane. The result is deterministic and contains no
 * Phaser objects, so it can be used both by runtime AI and validation tests.
 */
export function evaluateLancerChargePath({
  origin,
  direction,
  maximumDistance,
  collisionRadius = 23,
  minimumDistance = 140,
  bounds,
  walls = [],
  stopPadding = 4,
} = {}) {
  const normalizedDirection = normalizeDirection(direction);
  const requestedDistance = Math.max(0, Number(maximumDistance) || 0);
  const radius = Math.max(0, Number(collisionRadius) || 0);
  if (!normalizedDirection || requestedDistance <= 0) {
    return { valid: false, reason: 'invalid-direction', maximumDistance: 0, endpoint: { ...origin } };
  }

  let availableDistance = Math.min(requestedDistance, distanceToArenaEdge(origin, normalizedDirection, bounds, radius));
  let limitingObstacle = 'arena-boundary';

  for (const wall of walls) {
    const rectangle = {
      left: wall.x - wall.width / 2 - radius,
      right: wall.x + wall.width / 2 + radius,
      top: wall.y - wall.height / 2 - radius,
      bottom: wall.y + wall.height / 2 + radius,
    };
    const hitDistance = rayAabbEntryDistance(origin, normalizedDirection, rectangle);
    if (hitDistance !== null && hitDistance < availableDistance) {
      availableDistance = Math.max(0, hitDistance - Math.max(0, Number(stopPadding) || 0));
      limitingObstacle = wall.id ?? 'wall';
    }
  }

  const valid = Number.isFinite(availableDistance) && availableDistance >= Math.max(0, Number(minimumDistance) || 0);
  const maximumSafeDistance = valid ? availableDistance : 0;
  return {
    valid,
    reason: valid ? null : 'insufficient-charge-space',
    maximumDistance: maximumSafeDistance,
    requestedDistance,
    limitingObstacle,
    direction: normalizedDirection,
    endpoint: {
      x: origin.x + normalizedDirection.x * maximumSafeDistance,
      y: origin.y + normalizedDirection.y * maximumSafeDistance,
    },
  };
}
