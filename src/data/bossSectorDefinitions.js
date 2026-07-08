const cells = Object.freeze([
  'nw','n','ne','w','c','e','sw','s','se',
]);
const make = (id, disabled) => Object.freeze({ id, disabled: Object.freeze([...disabled]) });
export const BOSS_SECTOR_GRID = Object.freeze({ columns: 3, rows: 3, cells });
export const BOSS_SECTOR_PATTERNS = Object.freeze([
  make('left-contraction', ['nw','w','sw']),
  make('right-contraction', ['ne','e','se']),
  make('top-contraction', ['nw','n','ne']),
  make('bottom-contraction', ['sw','s','se']),
  make('opposite-corners-a', ['nw','se']),
  make('opposite-corners-b', ['ne','sw']),
]);
export const BOSS_SECTOR_RULES = Object.freeze({ warningMs: 1000, disabledRangeMs: Object.freeze([2500,3500]), minimumSafeRatio: 0.45, minimumRouteWidth: 90, damage: 16, tickMs: 700, entryGraceMs: 250 });
export const BOSS_SECTOR_STATES = Object.freeze({ safe: 'SAFE', warning: 'WARNING', disabled: 'DISABLED', restoring: 'RESTORING' });
