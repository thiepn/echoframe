import { HOSTILE_ECHO_DEFINITION } from '../../data/hostileEchoDefinitions.js';
import { convertHostileEchoReplay } from '../../hostile-echo/HostileEchoEventConverter.js';
export function createHostileEchoPlan({ rng, descriptor, spawnPoint, phase = 'IMITATE' } = {}) {
  const replay = convertHostileEchoReplay({ descriptor, rng, offset: { x: spawnPoint.x - (descriptor?.snapshots?.[0]?.x ?? spawnPoint.x), y: spawnPoint.y - (descriptor?.snapshots?.[0]?.y ?? spawnPoint.y) }, phase });
  return Object.freeze({ id: `hostile-echo-${phase}`, warningMs: HOSTILE_ECHO_DEFINITION.warningMs, spawnDelayMs: HOSTILE_ECHO_DEFINITION.spawnDelayMs, lifetimeMs: replay.durationMs, spawnPoint: Object.freeze({ ...spawnPoint }), replay });
}
