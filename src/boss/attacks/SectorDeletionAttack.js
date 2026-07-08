import { BOSS_SECTOR_GRID, BOSS_SECTOR_PATTERNS, BOSS_SECTOR_RULES } from '../../data/bossSectorDefinitions.js';
const ADJACENCY = Object.freeze({ nw:['n','w'],n:['nw','ne','c'],ne:['n','e'],w:['nw','c','sw'],c:['n','w','e','s'],e:['ne','c','se'],sw:['w','s'],s:['sw','c','se'],se:['e','s'] });
export function validateSectorPattern(pattern) {
  const disabled = new Set(pattern.disabled);
  const safe = BOSS_SECTOR_GRID.cells.filter((cell) => !disabled.has(cell));
  const safeRatio = safe.length / BOSS_SECTOR_GRID.cells.length;
  const visited = new Set();
  const queue = safe.length ? [safe[0]] : [];
  while (queue.length) { const cell = queue.shift(); if (visited.has(cell)) continue; visited.add(cell); for (const next of ADJACENCY[cell] ?? []) if (!disabled.has(next) && !visited.has(next)) queue.push(next); }
  return Object.freeze({ valid: safeRatio >= BOSS_SECTOR_RULES.minimumSafeRatio && visited.size === safe.length, safeRatio, connected: visited.size === safe.length, minimumRouteWidth: 120, reasons: Object.freeze([...(safeRatio < BOSS_SECTOR_RULES.minimumSafeRatio ? ['safe-area'] : []), ...(visited.size !== safe.length ? ['connectivity'] : [])]) });
}
export function createSectorDeletionPlan({ rng, previousPatternId = null } = {}) {
  const candidates = BOSS_SECTOR_PATTERNS.filter((item) => item.id !== previousPatternId);
  const pattern = candidates[rng.integer(0, candidates.length - 1)];
  const validation = validateSectorPattern(pattern);
  return Object.freeze({ ...pattern, warningMs: BOSS_SECTOR_RULES.warningMs, disabledMs: rng.integer(...BOSS_SECTOR_RULES.disabledRangeMs), damage: BOSS_SECTOR_RULES.damage, tickMs: BOSS_SECTOR_RULES.tickMs, entryGraceMs: BOSS_SECTOR_RULES.entryGraceMs, validation });
}
