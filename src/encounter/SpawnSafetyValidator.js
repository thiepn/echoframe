import { normalizeArenaBounds, pointHasWallClearance } from '../utils/arenaGeometry.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class SpawnSafetyValidator {
  constructor({ wallDefinitions = [], worldBounds = { x: 80, y: 45, width: 1440, height: 810 } } = {}) {
    this.wallDefinitions = wallDefinitions;
    this.worldBounds = normalizeArenaBounds(worldBounds);
  }

  validate(point, {
    playerPosition,
    echoPositions = [],
    occupiedPositions = [],
    clearanceRadius = point.clearanceRadius ?? 32,
    safetyRadius = point.minimumPlayerDistance ?? 260,
  } = {}) {
    const reasons = [];
    const bounds = this.worldBounds;
    if (
      point.x - clearanceRadius < bounds.left ||
      point.x + clearanceRadius > bounds.right ||
      point.y - clearanceRadius < bounds.top ||
      point.y + clearanceRadius > bounds.bottom
    ) reasons.push('arena-incompatible');
    if (playerPosition && distance(point, playerPosition) < safetyRadius) reasons.push('player-safety-distance');
    if (echoPositions.some((position) => distance(point, position) < safetyRadius * 0.65)) reasons.push('echo-safety-distance');
    if (occupiedPositions.some((position) => distance(point, position) < (point.minimumOtherSpawnDistance ?? 120))) reasons.push('enemy-clearance');
    if (!pointHasWallClearance(point, clearanceRadius, this.wallDefinitions)) reasons.push('wall-clearance');
    return { valid: reasons.length === 0, reasons };
  }
}
