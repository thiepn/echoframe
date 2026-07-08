const PANEL_IDS = Object.freeze(['north','east','south','west']);
const ANGLES = Object.freeze({ east: 0, south: Math.PI/2, west: Math.PI, north: -Math.PI/2 });
function circularDistance(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
export function createRearPanelPlan({ rng, playerAngle = 0, disabledPanelIds = [], phase = 'DELETE' } = {}) {
  const valid = PANEL_IDS.filter((id) => !disabledPanelIds.includes(id));
  const ordered = valid.map((id) => ({ id, distance: circularDistance(ANGLES[id], playerAngle) })).sort((a,b) => b.distance-a.distance || a.id.localeCompare(b.id));
  const count = ordered.length > 1 && rng.next() > 0.62 ? 2 : 1;
  const selected = ordered.slice(0,count).map((entry) => entry.id);
  return Object.freeze({ id: `panel-${phase}-${selected.join('-')}`, panelIds: Object.freeze(selected), durationMs: rng.integer(3500,4500), targetSize: 48, lockAngle: playerAngle });
}
