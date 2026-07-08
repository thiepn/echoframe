import { clamp } from './math.js';

export function clampDeltaSeconds(deltaMs, maximumDeltaMs = 32) {
  return clamp(Number(deltaMs) || 0, 0, maximumDeltaMs) / 1000;
}

export function normalizeInput(x, y) {
  const length = Math.hypot(x, y);
  if (length <= Number.EPSILON) {
    return { x: 0, y: 0, magnitude: 0 };
  }
  const divisor = Math.max(1, length);
  return { x: x / divisor, y: y / divisor, magnitude: Math.min(1, length) };
}

export function moveToward(current, target, maximumDelta) {
  if (current < target) {
    return Math.min(current + maximumDelta, target);
  }
  if (current > target) {
    return Math.max(current - maximumDelta, target);
  }
  return target;
}

export function moveVelocityToward(currentX, currentY, targetX, targetY, maximumDelta) {
  const deltaX = targetX - currentX;
  const deltaY = targetY - currentY;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance <= maximumDelta || distance <= Number.EPSILON) {
    return { x: targetX, y: targetY };
  }
  const scalar = maximumDelta / distance;
  return {
    x: currentX + deltaX * scalar,
    y: currentY + deltaY * scalar,
  };
}

export function chooseDashDirection(movement, aim) {
  const movementLength = Math.hypot(movement.x, movement.y);
  const source = movementLength > Number.EPSILON ? movement : aim;
  const length = Math.hypot(source.x, source.y);
  if (length <= Number.EPSILON) {
    return { x: 1, y: 0 };
  }
  return { x: source.x / length, y: source.y / length };
}

export function rayToExpandedAabbDistance(origin, direction, rectangle, expansion = 0) {
  const minX = rectangle.x - rectangle.width / 2 - expansion;
  const maxX = rectangle.x + rectangle.width / 2 + expansion;
  const minY = rectangle.y - rectangle.height / 2 - expansion;
  const maxY = rectangle.y + rectangle.height / 2 + expansion;

  let near = -Infinity;
  let far = Infinity;
  for (const [originValue, directionValue, minimum, maximum] of [
    [origin.x, direction.x, minX, maxX],
    [origin.y, direction.y, minY, maxY],
  ]) {
    if (Math.abs(directionValue) < 1e-9) {
      if (originValue < minimum || originValue > maximum) {
        return Infinity;
      }
      continue;
    }
    const first = (minimum - originValue) / directionValue;
    const second = (maximum - originValue) / directionValue;
    near = Math.max(near, Math.min(first, second));
    far = Math.min(far, Math.max(first, second));
    if (near > far) {
      return Infinity;
    }
  }

  if (far < 0 || near < 0) {
    return Infinity;
  }
  return near;
}

export function resolveDashDistance(origin, direction, desiredDistance, rectangles, radius) {
  let allowed = desiredDistance;
  for (const rectangle of rectangles) {
    const hitDistance = rayToExpandedAabbDistance(origin, direction, rectangle, radius + 2);
    if (Number.isFinite(hitDistance) && hitDistance >= 0) {
      allowed = Math.min(allowed, Math.max(0, hitDistance - 2));
    }
  }
  return allowed;
}
