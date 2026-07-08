import { deterministicShuffle } from '../utils/deterministicShuffle.js';

export class SpawnPlanner {
  constructor({ points, validator }) { this.points = points; this.validator = validator; this.recentPointIds = []; }
  reset() { this.recentPointIds.length = 0; }
  plan(entries, { random, playerPosition, echoPositions = [], safetyRadius = 260 } = {}) {
    const occupiedByGroup = new Map();
    const planned = [];
    const rejections = {};
    for (const entry of entries) {
      const occupiedPositions = occupiedByGroup.get(entry.groupIndex ?? 0) ?? [];
      const candidates = deterministicShuffle(this.points.filter((point) => (!point.allowedEnemyTypes || point.allowedEnemyTypes.includes(entry.enemyType)) && (!entry.requiredRole || !point.allowedRoles || point.allowedRoles.includes(entry.requiredRole))), random);
      let selected = null;
      for (const point of candidates) {
        if (this.recentPointIds.includes(point.id) && candidates.length > 3) continue;
        const result = this.validator.validate(point, { playerPosition, echoPositions, occupiedPositions, clearanceRadius: entry.clearanceRadius ?? point.clearanceRadius, safetyRadius });
        if (result.valid) { selected = point; break; }
        for (const reason of result.reasons) rejections[reason] = (rejections[reason] ?? 0) + 1;
      }
      if (!selected) {
        const fallback = candidates.find((point) => this.validator.validate(point, { playerPosition, echoPositions: [], occupiedPositions: [], clearanceRadius: Math.min(32, entry.clearanceRadius ?? 32), safetyRadius: Math.min(180, safetyRadius) }).valid);
        if (!fallback) return { valid: false, planned: [], rejections: { ...rejections, 'spawn-capacity': 1 } };
        selected = fallback;
      }
      occupiedPositions.push({ x: selected.x, y: selected.y });
      occupiedByGroup.set(entry.groupIndex ?? 0, occupiedPositions);
      this.recentPointIds.push(selected.id);
      while (this.recentPointIds.length > 4) this.recentPointIds.shift();
      planned.push({ ...entry, spawnPointId: selected.id, x: selected.x, y: selected.y });
    }
    return { valid: true, planned, rejections };
  }
}
