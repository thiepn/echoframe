import { TUTORIAL_THRESHOLDS } from './TutorialStepCatalog.js';

export function validateCheckpoint({ owner, index, expectedIndex }) {
  if (owner !== 'player') return { accepted: false, reason: 'player-only' };
  if (index !== expectedIndex) return { accepted: false, reason: 'out-of-order' };
  return { accepted: true };
}
export function validateStationaryTarget({ source, defeated }) {
  if (source !== 'player') return { accepted: false, reason: 'player-projectile-required' };
  if (!defeated) return { accepted: false, reason: 'target-not-defeated' };
  return { accepted: true };
}
export function validateDashGate({ owner, dashing, directionValid = true }) {
  if (owner !== 'player') return { accepted: false, reason: 'player-only' };
  if (!dashing) return { accepted: false, reason: 'dash-required' };
  if (!directionValid) return { accepted: false, reason: 'wrong-direction' };
  return { accepted: true };
}
export function validateRecording({ pathCount, fireEvents, spanMs }) {
  if (pathCount < TUTORIAL_THRESHOLDS.recordingPathCheckpoints) return { accepted: false, reason: 'path-incomplete' };
  if (fireEvents < TUTORIAL_THRESHOLDS.recordingFireEvents) return { accepted: false, reason: 'insufficient-fire-events' };
  if (spanMs < TUTORIAL_THRESHOLDS.recordingMinimumMs) return { accepted: false, reason: 'insufficient-history' };
  return { accepted: true };
}
export function validateEchoRearHit({ source, rear, defeated }) {
  if (source !== 'echo') return { accepted: false, reason: 'friendly-echo-required' };
  if (!rear) return { accepted: false, reason: 'rear-hit-required' };
  if (!defeated) return { accepted: false, reason: 'target-not-defeated' };
  return { accepted: true };
}
export function validateSignalGate({ owner }) {
  return owner === 'player' ? { accepted: true } : { accepted: false, reason: 'player-only' };
}
