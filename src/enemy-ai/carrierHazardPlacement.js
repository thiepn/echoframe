import { clampPointToBounds, pointHasWallClearance } from '../utils/arenaGeometry.js';

function stableHash(text) {
  let hash = 2166136261;
  for (let index = 0; index < String(text).length; index += 1) {
    hash ^= String(text).charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function preservesPlayerEscapeRoute(points, playerPosition, hazardRadius) {
  if (!playerPosition) return true;
  const sampleDistance = Math.max(150, hazardRadius * 2.8);
  const samples = [
    { x: playerPosition.x + sampleDistance, y: playerPosition.y },
    { x: playerPosition.x - sampleDistance, y: playerPosition.y },
    { x: playerPosition.x, y: playerPosition.y + sampleDistance },
    { x: playerPosition.x, y: playerPosition.y - sampleDistance },
  ];
  return samples.some((sample) => points.every((point) => distance(point, sample) > hazardRadius * 1.25));
}

/**
 * Plan bounded, wall-safe Carrier hazard destinations. Candidate generation is
 * deterministic from ownerId and does not consume encounter-generation RNG.
 */
export function planCarrierHazards({
  origin,
  ownerId,
  count = 3,
  hazardRadius = 54,
  bounds,
  walls = [],
  playerPosition = null,
  minimumPlayerDistance = 120,
  minimumHazardSpacing = null,
} = {}) {
  const desiredCount = Math.max(0, Math.min(3, Math.floor(Number(count) || 0)));
  const radius = Math.max(1, Number(hazardRadius) || 54);
  const spacing = minimumHazardSpacing ?? radius * 2 + 24;
  const rotation = stableHash(ownerId) / 4294967296 * Math.PI * 2;
  const candidates = [];
  for (let ring = 0; ring < 4; ring += 1) {
    const ringRadius = 120 + ring * 48;
    for (let slot = 0; slot < 12; slot += 1) {
      const angle = rotation + slot * Math.PI * 2 / 12 + ring * 0.17;
      const unclamped = {
        x: origin.x + Math.cos(angle) * ringRadius,
        y: origin.y + Math.sin(angle) * ringRadius,
      };
      candidates.push(clampPointToBounds(unclamped, bounds, radius + 6));
    }
  }

  const points = [];
  const rejectionReasons = {};
  const reject = (reason) => { rejectionReasons[reason] = (rejectionReasons[reason] ?? 0) + 1; };
  for (const candidate of candidates) {
    if (playerPosition && distance(candidate, playerPosition) < minimumPlayerDistance) { reject('player-clearance'); continue; }
    if (!pointHasWallClearance(candidate, radius + 8, walls)) { reject('wall-clearance'); continue; }
    if (points.some((point) => distance(point, candidate) < spacing)) { reject('hazard-spacing'); continue; }
    const proposed = [...points, candidate];
    if (!preservesPlayerEscapeRoute(proposed, playerPosition, radius)) { reject('escape-route'); continue; }
    points.push(candidate);
    if (points.length >= desiredCount) break;
  }

  return {
    valid: points.length === desiredCount,
    requestedCount: desiredCount,
    points,
    rejectionReasons,
  };
}
