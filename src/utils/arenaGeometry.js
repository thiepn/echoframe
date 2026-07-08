const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

/**
 * Normalize either { left, right, top, bottom } or { x, y, width, height }
 * into a single immutable edge-based shape.
 */
export function normalizeArenaBounds(bounds = {}) {
  const hasEdges = [bounds.left, bounds.right, bounds.top, bounds.bottom]
    .every((value) => Number.isFinite(Number(value)));
  if (hasEdges) {
    const left = finite(bounds.left);
    const right = finite(bounds.right);
    const top = finite(bounds.top);
    const bottom = finite(bounds.bottom);
    return Object.freeze({
      left: Math.min(left, right),
      right: Math.max(left, right),
      top: Math.min(top, bottom),
      bottom: Math.max(top, bottom),
      width: Math.abs(right - left),
      height: Math.abs(bottom - top),
      x: Math.min(left, right),
      y: Math.min(top, bottom),
    });
  }

  const x = finite(bounds.x);
  const y = finite(bounds.y);
  const width = Math.max(0, finite(bounds.width));
  const height = Math.max(0, finite(bounds.height));
  return Object.freeze({
    left: x,
    right: x + width,
    top: y,
    bottom: y + height,
    width,
    height,
    x,
    y,
  });
}

export function clampPointToBounds(point, bounds, radius = 0) {
  const normalized = normalizeArenaBounds(bounds);
  const inset = Math.max(0, Number(radius) || 0);
  const minimumX = normalized.left + inset;
  const maximumX = normalized.right - inset;
  const minimumY = normalized.top + inset;
  const maximumY = normalized.bottom - inset;
  return {
    x: Math.max(minimumX, Math.min(maximumX, Number(point.x) || 0)),
    y: Math.max(minimumY, Math.min(maximumY, Number(point.y) || 0)),
  };
}

export function pointInsideBounds(point, bounds, radius = 0) {
  const normalized = normalizeArenaBounds(bounds);
  const inset = Math.max(0, Number(radius) || 0);
  return point.x >= normalized.left + inset && point.x <= normalized.right - inset &&
    point.y >= normalized.top + inset && point.y <= normalized.bottom - inset;
}

export function circleOverlapsWall(point, radius, wall) {
  const halfWidth = Math.max(0, Number(wall.width) || 0) / 2;
  const halfHeight = Math.max(0, Number(wall.height) || 0) / 2;
  const closestX = Math.max(wall.x - halfWidth, Math.min(point.x, wall.x + halfWidth));
  const closestY = Math.max(wall.y - halfHeight, Math.min(point.y, wall.y + halfHeight));
  return Math.hypot(point.x - closestX, point.y - closestY) < Math.max(0, Number(radius) || 0);
}

export function pointHasWallClearance(point, radius, walls = []) {
  return !walls.some((wall) => circleOverlapsWall(point, radius, wall));
}
