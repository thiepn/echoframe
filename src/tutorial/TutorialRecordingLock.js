import { validateRecording } from './TutorialObjectiveValidator.js';

function normalizePathCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

export function evaluateTutorialRecording({
  recorder,
  deploymentTimeMs,
  loadoutSnapshot,
  pathCount,
} = {}) {
  if (!recorder || typeof recorder.createReplayDescriptor !== 'function') {
    return Object.freeze({
      accepted: false,
      reason: 'recorder-unavailable',
      descriptor: null,
      pathCount: normalizePathCount(pathCount),
      fireEvents: 0,
      spanMs: 0,
    });
  }

  const descriptor = recorder.createReplayDescriptor(deploymentTimeMs, loadoutSnapshot);
  const normalizedPathCount = normalizePathCount(pathCount);
  const fireEvents = descriptor?.fireEvents?.length ?? 0;
  const spanMs = descriptor?.durationMs ?? 0;
  const validation = validateRecording({
    pathCount: normalizedPathCount,
    fireEvents,
    spanMs,
  });

  return Object.freeze({
    accepted: Boolean(descriptor && validation.accepted),
    reason: descriptor ? validation.reason ?? null : recorder.readiness?.ready ? 'descriptor-unavailable' : 'insufficient-history',
    descriptor: descriptor ?? null,
    pathCount: normalizedPathCount,
    fireEvents,
    spanMs,
  });
}
