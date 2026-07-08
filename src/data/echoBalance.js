export const ECHO_BALANCE = Object.freeze({
  recording: Object.freeze({
    baseReplayDurationMs: 3500,
    maximumReplayDurationMs: 5300,
    sampleRateHz: 30,
    sampleIntervalMs: 1000 / 30,
    minimumBaseSnapshots: 105,
    interpolationMargin: 5,
    snapshotCapacity: Math.ceil(5.3 * 30) + 5,
    fireEventCapacity: 192,
    dashEventCapacity: 64,
    maximumCatchUpSamples: 4,
    maximumSimulationDeltaMs: 100,
  }),
  cooldown: Object.freeze({
    durationMs: 7000,
  }),
  playback: Object.freeze({
    damageScalar: 0.55,
    activeCap: 1,
    maximumFutureActiveCap: 2,
    eventTimingToleranceMs: 20,
    spawnVisualDurationMs: 110,
    dissolveDurationMs: 300,
    minimumOpacity: 0.55,
    maximumOpacity: 0.7,
  }),
  projectilePool: Object.freeze({
    initialCapacity: 32,
    expansionChunk: 16,
    hardCap: 120,
  }),
  crossfire: Object.freeze({
    windowMs: 1000,
    targetCooldownMs: 1250,
  }),
  completion: Object.freeze({
    totalHits: 30,
    echoHits: 8,
    deployments: 3,
    crossfires: 3,
    playerDashes: 3,
  }),
  telemetry: Object.freeze({
    progressIntervalMs: 100,
  }),
});
