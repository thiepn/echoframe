const palette = (id, displayName, playerColor, echoColor, requirementText) => Object.freeze({ id, type: 'palette', displayName, playerColor, echoColor, requirementText });
const trail = (id, displayName, trailColor, trailStyle, requirementText) => Object.freeze({ id, type: 'trail', displayName, trailColor, trailStyle, requirementText });

export const PALETTE_DEFINITIONS = Object.freeze([
  palette('default', 'Default Signal', 0x55e6ff, 0x9a82ff, 'Available on a fresh save.'),
  palette('signal-restored', 'Signal Restored', 0x72f1b8, 0x55e6ff, 'Earn the first Standard victory.'),
  palette('memory-violet', 'Memory Violet', 0xb795ff, 0x6fe7ff, 'Win with at least 35% friendly-Echo damage share.'),
  palette('architect-fracture', 'Architect Fracture', 0xf4f6ff, 0xff6f91, 'Defeat the Null Architect without consuming Last Frame.'),
]);

export const TRAIL_DEFINITIONS = Object.freeze([
  trail('default', 'Default Trail', 0x55e6ff, 'clean', 'Available on a fresh save.'),
  trail('resonant-wave', 'Resonant Wave', 0x9a82ff, 'wave', 'Win with at least 35% friendly-Echo damage share.'),
  trail('clean-vector', 'Clean Vector', 0x72f1b8, 'segmented', 'Clear a Standard combat chamber without damage while dashing at least three times.'),
  trail('station-cyan', 'Station Cyan', 0x55e6ff, 'station', 'Complete an Overclocked victory.'),
]);

export const COSMETIC_IDS = Object.freeze({
  palettes: Object.freeze(PALETTE_DEFINITIONS.map((entry) => entry.id)),
  trails: Object.freeze(TRAIL_DEFINITIONS.map((entry) => entry.id)),
});

export function getPaletteDefinition(id) { return PALETTE_DEFINITIONS.find((entry) => entry.id === id) ?? PALETTE_DEFINITIONS[0]; }
export function getTrailDefinition(id) { return TRAIL_DEFINITIONS.find((entry) => entry.id === id) ?? TRAIL_DEFINITIONS[0]; }
