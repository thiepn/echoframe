import { ActionEventRingBuffer } from '../buffers/ActionEventRingBuffer.js';
import { SnapshotRingBuffer } from '../buffers/SnapshotRingBuffer.js';
import { ECHO_BALANCE } from '../data/echoBalance.js';
import { lerpAngle } from '../utils/angleMath.js';

function normalizeAim(x, y) {
  const length = Math.hypot(Number(x) || 0, Number(y) || 0);
  return length > 0 ? { x: x / length, y: y / length } : { x: 1, y: 0 };
}

function toRecorderState(playerSnapshot, timestampMs) {
  const aim = normalizeAim(playerSnapshot.aim?.x, playerSnapshot.aim?.y);
  return {
    timestampMs,
    x: Number(playerSnapshot.position?.x) || 0,
    y: Number(playerSnapshot.position?.y) || 0,
    aimX: aim.x,
    aimY: aim.y,
    aimRotation: Math.atan2(aim.y, aim.x),
    velocityX: Number(playerSnapshot.velocity?.x) || 0,
    velocityY: Number(playerSnapshot.velocity?.y) || 0,
    movementState: String(playerSnapshot.state ?? 'ACTIVE'),
    dashVisualState: Boolean(playerSnapshot.dash?.active),
  };
}

function interpolateState(before, after, timestampMs) {
  const denominator = after.timestampMs - before.timestampMs;
  const alpha = denominator > 0
    ? Math.max(0, Math.min(1, (timestampMs - before.timestampMs) / denominator))
    : 1;
  const rotation = lerpAngle(before.aimRotation, after.aimRotation, alpha);
  return {
    timestampMs,
    x: before.x + (after.x - before.x) * alpha,
    y: before.y + (after.y - before.y) * alpha,
    aimX: Math.cos(rotation),
    aimY: Math.sin(rotation),
    aimRotation: rotation,
    velocityX: before.velocityX + (after.velocityX - before.velocityX) * alpha,
    velocityY: before.velocityY + (after.velocityY - before.velocityY) * alpha,
    movementState: alpha < 0.5 ? before.movementState : after.movementState,
    dashVisualState: alpha < 0.5 ? before.dashVisualState : after.dashVisualState,
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  return Object.freeze(value);
}

export class EchoRecorder {
  constructor({ eventBus, timeProvider, replayDurationProvider = () => ECHO_BALANCE.recording.baseReplayDurationMs }) {
    this.eventBus = eventBus;
    this.timeProvider = timeProvider;
    this.replayDurationProvider = replayDurationProvider;
    this.snapshots = new SnapshotRingBuffer(ECHO_BALANCE.recording.snapshotCapacity);
    this.fireEvents = new ActionEventRingBuffer(ECHO_BALANCE.recording.fireEventCapacity);
    this.dashEvents = new ActionEventRingBuffer(ECHO_BALANCE.recording.dashEventCapacity);
    this.started = false;
    this.enabled = true;
    this.lastFrameState = null;
    this.nextSampleTimeMs = 0;
    this.droppedCatchUpSamples = 0;
    this.lastProgressBucket = -1;
    this.lastReady = false;
    this.unsubscribeFire = eventBus.subscribe('weapon:fired', (payload) => {
      this.#recordFire(payload);
    }, { owner: this });
    this.unsubscribeDash = eventBus.subscribe('player:dash:started', (payload) => {
      this.#recordDash(payload);
    }, { owner: this });
  }

  start(simulationTimeMs, playerSnapshot) {
    const time = Math.max(0, Number(simulationTimeMs) || 0);
    this.started = true;
    this.enabled = true;
    this.lastFrameState = toRecorderState(playerSnapshot, time);
    this.snapshots.append(this.lastFrameState);
    this.nextSampleTimeMs = time + ECHO_BALANCE.recording.sampleIntervalMs;
    this.#emitProgress(true);
  }

  update(deltaMs, simulationTimeMs, playerSnapshot, { enabled = true } = {}) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      return;
    }
    const currentTime = Math.max(0, Number(simulationTimeMs) || 0);
    if (!this.started || !this.lastFrameState) {
      this.start(currentTime, playerSnapshot);
      return;
    }
    const current = toRecorderState(playerSnapshot, currentTime);
    if (currentTime < this.lastFrameState.timestampMs) {
      this.reset();
      this.start(currentTime, playerSnapshot);
      return;
    }

    let produced = 0;
    while (
      this.nextSampleTimeMs <= currentTime + 0.0001 &&
      produced < ECHO_BALANCE.recording.maximumCatchUpSamples
    ) {
      this.snapshots.append(interpolateState(
        this.lastFrameState,
        current,
        this.nextSampleTimeMs,
      ));
      this.nextSampleTimeMs += ECHO_BALANCE.recording.sampleIntervalMs;
      produced += 1;
    }

    if (this.nextSampleTimeMs <= currentTime) {
      const missingSpan = currentTime - this.nextSampleTimeMs;
      this.droppedCatchUpSamples += Math.floor(
        missingSpan / ECHO_BALANCE.recording.sampleIntervalMs,
      ) + 1;
      this.nextSampleTimeMs = currentTime + ECHO_BALANCE.recording.sampleIntervalMs;
    }

    this.lastFrameState = current;
    this.#emitProgress(false, deltaMs);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  get recordingSpanMs() {
    const oldest = this.snapshots.oldestTimestampMs;
    const newest = this.snapshots.newestTimestampMs;
    return oldest === null || newest === null ? 0 : Math.max(0, newest - oldest);
  }

  get readiness() {
    const spanRatio = Math.max(
      0,
      Math.min(1, this.recordingSpanMs / Math.min(ECHO_BALANCE.recording.maximumReplayDurationMs, Math.max(ECHO_BALANCE.recording.baseReplayDurationMs, Number(this.replayDurationProvider?.()) || ECHO_BALANCE.recording.baseReplayDurationMs))),
    );
    const sampleRatio = Math.max(
      0,
      Math.min(1, this.snapshots.count / ECHO_BALANCE.recording.minimumBaseSnapshots),
    );
    return {
      progress: Math.min(spanRatio, sampleRatio),
      ready:
        this.recordingSpanMs >= Math.min(ECHO_BALANCE.recording.maximumReplayDurationMs, Math.max(ECHO_BALANCE.recording.baseReplayDurationMs, Number(this.replayDurationProvider?.()) || ECHO_BALANCE.recording.baseReplayDurationMs)) - 0.01 &&
        this.snapshots.count >= ECHO_BALANCE.recording.minimumBaseSnapshots,
      spanMs: this.recordingSpanMs,
    };
  }

  createReplayDescriptor(deploymentTimeMs, loadoutSnapshot) {
    const deploymentTime = Number(deploymentTimeMs) || 0;
    const durationMs = Math.min(ECHO_BALANCE.recording.maximumReplayDurationMs, ECHO_BALANCE.recording.baseReplayDurationMs + Math.max(0, Number(loadoutSnapshot?.replayDurationBonusMs) || 0));
    const replayStartMs = deploymentTime - durationMs;
    const replayEndMs = deploymentTime;
    if (!this.readiness.ready || replayStartMs < (this.snapshots.oldestTimestampMs ?? Infinity)) {
      return null;
    }
    const snapshots = this.snapshots.extractRange(replayStartMs, replayEndMs, {
      includeNeighbors: true,
    });
    if (snapshots.length === 0) {
      return null;
    }
    const descriptor = {
      replayStartMs,
      replayEndMs,
      durationMs,
      deploymentTimeMs: deploymentTime,
      snapshots,
      fireEvents: this.fireEvents.eventsInRange(replayStartMs, replayEndMs),
      dashEvents: this.dashEvents.eventsInRange(replayStartMs, replayEndMs),
      loadout: loadoutSnapshot,
      recorderDiagnostics: this.getDiagnostics(),
    };
    return deepFreeze(descriptor);
  }

  forceReady(playerSnapshot, simulationTimeMs) {
    this.clearHistory();
    const endTime = Math.max(0, Number(simulationTimeMs) || 0);
    const durationMs = Math.min(ECHO_BALANCE.recording.maximumReplayDurationMs, Math.max(ECHO_BALANCE.recording.baseReplayDurationMs, Number(this.replayDurationProvider?.()) || ECHO_BALANCE.recording.baseReplayDurationMs));
    const startTime = endTime - durationMs;
    for (
      let time = startTime;
      time <= endTime + 0.001;
      time += ECHO_BALANCE.recording.sampleIntervalMs
    ) {
      this.snapshots.append(toRecorderState(playerSnapshot, time));
    }
    this.started = true;
    this.lastFrameState = toRecorderState(playerSnapshot, endTime);
    this.nextSampleTimeMs = endTime + ECHO_BALANCE.recording.sampleIntervalMs;
    this.#emitProgress(true);
  }

  clearHistory() {
    this.snapshots.clear();
    this.fireEvents.clear();
    this.dashEvents.clear();
    this.started = false;
    this.lastFrameState = null;
    this.nextSampleTimeMs = 0;
    this.droppedCatchUpSamples = 0;
    this.lastProgressBucket = -1;
    this.lastReady = false;
  }

  reset() {
    this.clearHistory();
    this.enabled = true;
  }

  getDiagnostics() {
    const snapshotDiagnostics = this.snapshots.diagnostics();
    const fireDiagnostics = this.fireEvents.diagnostics();
    const dashDiagnostics = this.dashEvents.diagnostics();
    return {
      sampleRateHz: ECHO_BALANCE.recording.sampleRateHz,
      sampleIntervalMs: ECHO_BALANCE.recording.sampleIntervalMs,
      snapshotCount: snapshotDiagnostics.count,
      snapshotCapacity: snapshotDiagnostics.capacity,
      snapshotWrapCount: snapshotDiagnostics.wrapCount,
      oldestTimestampMs: snapshotDiagnostics.oldestTimestampMs,
      newestTimestampMs: snapshotDiagnostics.newestTimestampMs,
      fireEventCount: fireDiagnostics.count,
      fireEventCapacity: fireDiagnostics.capacity,
      fireEventWrapCount: fireDiagnostics.wrapCount,
      dashEventCount: dashDiagnostics.count,
      dashEventCapacity: dashDiagnostics.capacity,
      dashEventWrapCount: dashDiagnostics.wrapCount,
      recordingSpanMs: this.recordingSpanMs,
      droppedCatchUpSamples: this.droppedCatchUpSamples,
      ...this.readiness,
    };
  }

  dispose() {
    this.unsubscribeFire?.();
    this.unsubscribeDash?.();
    this.unsubscribeFire = null;
    this.unsubscribeDash = null;
    this.clearHistory();
  }

  #recordFire(payload) {
    if (!this.started || !this.enabled || !payload?.projectileMetadata) {
      return;
    }
    const aim = normalizeAim(payload.direction?.x, payload.direction?.y);
    this.fireEvents.append({
      timestampMs: Math.max(0, Number(this.timeProvider()) || 0),
      aimX: aim.x,
      aimY: aim.y,
      aimRotation: Math.atan2(aim.y, aim.x),
      projectileMetadata: structuredClone(payload.projectileMetadata),
      weaponEventId: payload.weaponEventId,
    });
  }

  #recordDash(payload) {
    if (!this.started || !this.enabled || !payload?.direction) {
      return;
    }
    const direction = normalizeAim(payload.direction.x, payload.direction.y);
    this.dashEvents.append({
      timestampMs: Math.max(0, Number(this.timeProvider()) || 0),
      directionX: direction.x,
      directionY: direction.y,
      durationMs: Number(payload.durationMs) || 0,
      distance: Number(payload.distance) || 0,
      invulnerabilityMs: Number(payload.invulnerabilityMs) || 0,
      dashEventId: payload.dashEventId,
    });
  }

  #emitProgress(force) {
    const readiness = this.readiness;
    const bucket = Math.floor(readiness.progress * 100);
    if (!force && bucket === this.lastProgressBucket && readiness.ready === this.lastReady) {
      return;
    }
    this.lastProgressBucket = bucket;
    this.eventBus.emit('echo:recording:progress', {
      progress: readiness.progress,
      ready: readiness.ready,
      spanMs: readiness.spanMs,
      sampleCount: this.snapshots.count,
    });
    if (readiness.ready && !this.lastReady) {
      this.eventBus.emit('echo:recording:ready', {
        spanMs: readiness.spanMs,
        sampleCount: this.snapshots.count,
      });
    }
    this.lastReady = readiness.ready;
  }
}
