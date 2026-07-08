import { clampVelocity, seekVelocity, separationVelocity } from './steering.js';

export function orbitVelocity(enemy, target, preferredMin, preferredMax, speed, clockwise = 1) {
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const radialX = dx / distance;
  const radialY = dy / distance;
  if (distance > preferredMax) return seekVelocity(enemy, target, speed);
  if (distance < preferredMin) return { x: -radialX * speed, y: -radialY * speed };
  return { x: -radialY * speed * clockwise, y: radialX * speed * clockwise };
}

export function combinedSteering(enemy, target, neighbours, speed, separationRadius = 70, separationStrength = 80) {
  const seek = seekVelocity(enemy, target, speed);
  const separation = separationVelocity(enemy, neighbours, separationRadius, separationStrength);
  return clampVelocity(seek.x + separation.x, seek.y + separation.y, speed);
}

export function rotateToward(current, target, maximumDelta) {
  let difference = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (difference < -Math.PI) difference += Math.PI * 2;
  const delta = Math.max(-maximumDelta, Math.min(maximumDelta, difference));
  return current + delta;
}
