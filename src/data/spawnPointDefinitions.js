import { ENEMY_ROLES } from '../enemy-ai/EnemyRole.js';

const allRoles = Object.freeze(Object.values(ENEMY_ROLES));
const allTypes = Object.freeze(['drifter', 'sentry', 'lancer', 'shard-carrier', 'bulwark', 'suppressor']);
const point = (id, x, y, extra = {}) => Object.freeze({
  id, x, y,
  allowedEnemyTypes: allTypes,
  allowedRoles: allRoles,
  minimumPlayerDistance: 260,
  minimumOtherSpawnDistance: 120,
  lineOfSightCategory: 'open',
  clearanceRadius: 58,
  firingLaneTags: Object.freeze(['horizontal', 'vertical', 'diagonal']),
  entryDirection: Object.freeze({ x: x < 800 ? 1 : -1, y: y < 450 ? 1 : -1 }),
  weight: 1,
  ...extra,
});

export const SPAWN_POINT_DEFINITIONS = Object.freeze([
  point('nw', 170, 150),
  point('n', 800, 150),
  point('ne', 1430, 150),
  point('w', 170, 450),
  point('e', 1430, 450),
  point('sw', 170, 740),
  point('s', 800, 740),
  point('se', 1430, 740),
  point('inner-nw', 420, 260, { clearanceRadius: 46, weight: 0.7 }),
  point('inner-ne', 1180, 260, { clearanceRadius: 46, weight: 0.7 }),
  point('inner-sw', 420, 640, { clearanceRadius: 46, weight: 0.7 }),
  point('inner-se', 1180, 640, { clearanceRadius: 46, weight: 0.7 }),
]);

export const SPAWN_POINTS_BY_ID = Object.freeze(Object.fromEntries(SPAWN_POINT_DEFINITIONS.map((entry) => [entry.id, entry])));
