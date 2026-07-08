import { HOSTILE_ECHO_DEFINITION } from '../data/hostileEchoDefinitions.js';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
function finite(value, fallback = 0) { return Number.isFinite(value) ? value : fallback; }
export function convertHostileEchoReplay({ descriptor, rng, offset = { x: 0, y: 0 }, phase = 'IMITATE' } = {}) {
  const snapshots = (descriptor?.snapshots ?? []).map((snapshot) => ({
    timestampMs: finite(snapshot.timestampMs),
    x: finite(snapshot.x) + finite(offset.x),
    y: finite(snapshot.y) + finite(offset.y),
    aimX: finite(snapshot.aimX, 1),
    aimY: finite(snapshot.aimY, 0),
    dashVisualState: Boolean(snapshot.dashVisualState),
  }));
  const start = snapshots[0]?.timestampMs ?? 0;
  const end = snapshots.at(-1)?.timestampMs ?? start + 3500;
  const maximumEvents = Math.max(1, Math.floor(((end - start) / 1000) * HOSTILE_ECHO_DEFINITION.maximumFireEventsPerSecond));
  const fireEvents = (descriptor?.fireEvents ?? []).filter((event) => Number.isFinite(event.timestampMs)).slice(0, maximumEvents).map((event, index) => ({
    timestampMs: event.timestampMs,
    aimX: finite(event.aimX, 1),
    aimY: finite(event.aimY, 0),
    hostileEventId: `hostile-fire-${index}`,
  }));
  const durationMs = Math.max(HOSTILE_ECHO_DEFINITION.lifetimeRangeMs[0], Math.min(HOSTILE_ECHO_DEFINITION.lifetimeRangeMs[1], end - start || rng.integer(...HOSTILE_ECHO_DEFINITION.lifetimeRangeMs)));
  const result = {
    replayStartMs: start,
    replayEndMs: start + durationMs,
    durationMs,
    phase,
    offset: { x: finite(offset.x), y: finite(offset.y) },
    snapshots: snapshots.length >= 2 ? snapshots : createFallbackSnapshots({ rng, durationMs, offset }),
    fireEvents,
    inheritedUpgradeIds: [],
  };
  return deepFreeze(result);
}
export function createFallbackSnapshots({ rng, durationMs = 3800, offset = { x: 0, y: 0 }, center = { x: 800, y: 450 } } = {}) {
  const radius = HOSTILE_ECHO_DEFINITION.fallbackPathRadius;
  const direction = rng.next() > 0.5 ? 1 : -1;
  const startAngle = rng.next() * Math.PI * 2;
  const result = [];
  for (let time = 0; time <= durationMs; time += 100) {
    const angle = startAngle + direction * (time / durationMs) * Math.PI * 1.3;
    result.push(Object.freeze({ timestampMs: time, x: center.x + offset.x + Math.cos(angle) * radius, y: center.y + offset.y + Math.sin(angle) * radius, aimX: -Math.cos(angle), aimY: -Math.sin(angle), dashVisualState: false }));
  }
  return Object.freeze(result);
}
