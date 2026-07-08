import { PROTOTYPE_ARENA } from '../data/prototypeArena.js';
import { ELITE_BALANCE } from '../data/eliteBalance.js';
import { SeededRandom, deriveSeed } from '../utils/SeededRandom.js';

function insideWall(x, y, radius, walls = PROTOTYPE_ARENA.walls) {
  return walls.some((wall) => Math.abs(x - wall.x) < wall.width / 2 + radius && Math.abs(y - wall.y) < wall.height / 2 + radius);
}

export class ReplicationSpawnService {
  constructor({ arenaDescriptor = null } = {}) { this.arenaDescriptor = arenaDescriptor; }
  setArenaDescriptor(arenaDescriptor) { this.arenaDescriptor = arenaDescriptor; }
  findPlacement({ parent, player, activeEnemies, seed }) {
    const random = new SeededRandom(deriveSeed(seed, `copy-placement-${parent.enemyId}`));
    const bounds = this.arenaDescriptor?.cameraBounds ?? PROTOTYPE_ARENA.bounds;
    const walls = this.arenaDescriptor?.solidGeometry ?? PROTOTYPE_ARENA.walls;
    const radius = parent.bodySprite?.body?.radius ?? 24;
    for (let attempt = 0; attempt < ELITE_BALANCE.copyPlacementAttempts; attempt += 1) {
      const angle = random.next() * Math.PI * 2;
      const distance = ELITE_BALANCE.copyPlacementRadius + attempt * 12;
      const x = parent.x + Math.cos(angle) * distance;
      const y = parent.y + Math.sin(angle) * distance;
      if (x - radius < bounds.left || x + radius > bounds.right || y - radius < bounds.top || y + radius > bounds.bottom) continue;
      if (insideWall(x, y, radius, walls)) continue;
      if (player && Math.hypot(x - player.x, y - player.y) < ELITE_BALANCE.copyMinimumPlayerDistance) continue;
      if (activeEnemies.some((enemy) => enemy !== parent && enemy.active && Math.hypot(x - enemy.x, y - enemy.y) < ELITE_BALANCE.copyMinimumEnemyDistance)) continue;
      return Object.freeze({ valid: true, x, y, attempts: attempt + 1, fallbackUsed: false });
    }
    const candidates = [
      { x: bounds.left + 140, y: bounds.top + 140 }, { x: bounds.right - 140, y: bounds.top + 140 },
      { x: bounds.left + 140, y: bounds.bottom - 140 }, { x: bounds.right - 140, y: bounds.bottom - 140 },
    ];
    const fallback = candidates.find((point) => (!player || Math.hypot(point.x - player.x, point.y - player.y) >= ELITE_BALANCE.copyMinimumPlayerDistance) && !insideWall(point.x, point.y, radius, walls) && !activeEnemies.some((enemy) => enemy !== parent && enemy.active && Math.hypot(point.x - enemy.x, point.y - enemy.y) < ELITE_BALANCE.copyMinimumEnemyDistance));
    return fallback ? Object.freeze({ valid: true, ...fallback, attempts: ELITE_BALANCE.copyPlacementAttempts, fallbackUsed: true }) : Object.freeze({ valid: false, reason: 'elite-copy-placement-unavailable', attempts: ELITE_BALANCE.copyPlacementAttempts });
  }
}
