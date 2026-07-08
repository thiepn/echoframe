export const ARENA_HAZARD_IDS = Object.freeze({ none: 'none', pulseNodes: 'pulse-nodes', conduitSweep: 'conduit-sweep' });
export const ARENA_HAZARD_DEFINITIONS = Object.freeze({
  none: Object.freeze({ id: 'none', label: 'No Hazard', type: 'none', maximumActive: 0, threatTag: 'none' }),
  'pulse-nodes': Object.freeze({ id: 'pulse-nodes', label: 'Pulse Nodes', type: 'circle', maximumActive: 3, warningMs: 900, warningFloorMs: 700, activeMs: 700, cooldownMs: 3200, radius: 54, damage: 14, playtest: true, threatTag: 'area-denial' }),
  'conduit-sweep': Object.freeze({ id: 'conduit-sweep', label: 'Conduit Sweep', type: 'strip', maximumActive: 2, warningMs: 1000, warningFloorMs: 750, activeMs: 650, cooldownMs: 3600, width: 52, damage: 16, playtest: true, threatTag: 'lane-denial' }),
});
