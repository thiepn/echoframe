export function createDrifterSummonPlan({ rng, phase = 'OBSERVE', sockets = [], activeThreat = 0, threatCap = 8 } = {}) {
  const requested = phase === 'OBSERVE' ? rng.integer(2,4) : rng.integer(2,3);
  const count = Math.max(0, Math.min(requested, threatCap - activeThreat, sockets.length));
  const ordered = [...sockets];
  for (let i = ordered.length - 1; i > 0; i -= 1) { const j = rng.integer(0, i); [ordered[i], ordered[j]] = [ordered[j], ordered[i]]; }
  return Object.freeze({ id: `summon-${phase}`, count, spawnMs: 700, threat: count, sockets: Object.freeze(ordered.slice(0,count).map((socket) => Object.freeze({ ...socket }))) });
}
