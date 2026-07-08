import { ECHO_BALANCE } from '../data/echoBalance.js';
import { ECHO_STATES } from '../state/EchoState.js';
import { EchoPool } from '../pools/EchoPool.js';
import { interpolateReplaySnapshot } from '../utils/replayInterpolation.js';
import { consumeEventsThrough } from '../utils/replayEvents.js';

function rotateDirection(x, y, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: x * cosine - y * sine,
    y: x * sine + y * cosine,
  };
}

export class EchoPlaybackSystem {
  constructor({
    scene,
    eventBus,
    settingsManager,
    audioManager,
    statistics,
    echoProjectileManager,
    activeCapProvider = () => ECHO_BALANCE.playback.activeCap,
  }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.settingsManager = settingsManager;
    this.audioManager = audioManager;
    this.statistics = statistics;
    this.echoProjectileManager = echoProjectileManager;
    this.activeCapProvider = activeCapProvider;
    this.pool = new EchoPool({ scene, settingsManager });
    this.nextEchoInstanceId = 1;
    this.telemetryElapsedMs = 0;
    this.maximumEventTimingErrorMs = 0;
    this.lastEventTimingErrorMs = 0;
  }

  get activeCount() {
    return this.pool.activeItems.size;
  }

  canDeploy() {
    return this.activeCount < Math.max(1, Number(this.activeCapProvider?.()) || ECHO_BALANCE.playback.activeCap);
  }

  deploy(descriptor) {
    if (!descriptor || !this.canDeploy()) {
      return null;
    }
    const initial = interpolateReplaySnapshot(
      descriptor.snapshots,
      descriptor.replayStartMs,
      0,
    ).snapshot;
    if (!initial) {
      return null;
    }
    const instanceId = this.nextEchoInstanceId;
    this.nextEchoInstanceId += 1;
    const echo = this.pool.acquire({
      instanceId,
      descriptor,
      initialSnapshot: initial,
    });
    if (!echo) {
      return null;
    }
    echo.phantomShieldRemaining = descriptor.loadout?.phantomShieldCapacity ?? 0;
    this.statistics.recordDeployment();
    this.audioManager.playEchoDeploy?.();
    this.eventBus.emit('echo:deployed', {
      echoInstanceId: instanceId,
      replayStartMs: descriptor.replayStartMs,
      replayEndMs: descriptor.replayEndMs,
      fireEventCount: descriptor.fireEvents.length,
      dashEventCount: descriptor.dashEvents.length,
      loadoutVersion: descriptor.loadout.version,
    });
    this.eventBus.emit('echo:state:changed', {
      echoInstanceId: instanceId,
      state: ECHO_STATES.playback,
    });
    this.eventBus.emit('echo:playback:started', {
      echoInstanceId: instanceId,
      sourceTimeMs: descriptor.replayStartMs,
      durationMs: descriptor.durationMs,
    });
    return echo;
  }

  update(deltaMs) {
    const delta = Math.max(0, Number(deltaMs) || 0);
    this.telemetryElapsedMs += delta;
    for (const echo of [...this.pool.activeItems]) {
      if (echo.state.is(ECHO_STATES.playback)) {
        this.#updatePlayback(echo, delta);
      } else if (echo.state.is(ECHO_STATES.dissolving)) {
        echo.updateVisuals(delta);
        if (echo.renderer.dissolveComplete) {
          this.#releaseEcho(echo, 'dissolve-complete');
        }
      }
    }
    if (this.telemetryElapsedMs >= ECHO_BALANCE.telemetry.progressIntervalMs) {
      this.telemetryElapsedMs = 0;
      this.#emitProgress();
    }
  }

  beginTransitionDissolve() {
    for (const echo of this.pool.activeItems) {
      if (echo.beginDissolve()) {
        this.eventBus.emit('echo:dissolve:started', {
          echoInstanceId: echo.instanceId,
          reason: 'transition',
        });
      }
    }
  }

  clear(reason = 'clear', { immediate = true } = {}) {
    for (const echo of [...this.pool.activeItems]) {
      if (!immediate && echo.state.is(ECHO_STATES.playback)) {
        echo.beginDissolve();
        continue;
      }
      this.#releaseEcho(echo, reason);
    }
  }

  getDiagnostics() {
    const pool = this.pool.diagnostics();
    const first = [...this.pool.activeItems][0] ?? null;
    return {
      activeCount: pool.active,
      capacity: pool.capacity,
      hardCap: pool.hardCap,
      nextEchoInstanceId: this.nextEchoInstanceId,
      maximumEventTimingErrorMs: this.maximumEventTimingErrorMs,
      lastEventTimingErrorMs: this.lastEventTimingErrorMs,
      activeEcho: first ? {
        instanceId: first.instanceId,
        state: first.state.value,
        sourceTimeMs: first.sourceTimeMs,
        playbackElapsedMs: first.playbackElapsedMs,
        replayStartMs: first.replayStartMs,
        replayEndMs: first.replayEndMs,
        playbackRemainingMs: Math.max(0, first.replayEndMs - first.sourceTimeMs),
        snapshotCursor: first.snapshotCursor,
        fireCursor: first.fireCursor,
        dashCursor: first.dashCursor,
        loadoutVersion: first.loadout?.version ?? 'none',
      } : null,
    };
  }

  getActiveDescriptors() {
    return [...this.pool.activeItems].map((echo) => ({
      instanceId: echo.instanceId,
      replayStartMs: echo.replayStartMs,
      replayEndMs: echo.replayEndMs,
      sourceTimeMs: echo.sourceTimeMs,
      fireEventCount: echo.descriptor?.fireEvents.length ?? 0,
      dashEventCount: echo.descriptor?.dashEvents.length ?? 0,
      fireCursor: echo.fireCursor,
      dashCursor: echo.dashCursor,
    }));
  }

  destroy() {
    this.clear('destroy');
    this.pool.destroy();
  }

  #updatePlayback(echo, deltaMs) {
    const previousSourceTimeMs = echo.sourceTimeMs;
    echo.playbackElapsedMs = Math.min(
      echo.descriptor.durationMs,
      echo.playbackElapsedMs + deltaMs,
    );
    echo.sourceTimeMs = echo.replayStartMs + echo.playbackElapsedMs;
    const interpolation = interpolateReplaySnapshot(
      echo.descriptor.snapshots,
      echo.sourceTimeMs,
      echo.snapshotCursor,
    );
    echo.snapshotCursor = interpolation.cursor;
    if (interpolation.snapshot) {
      echo.applySnapshot(interpolation.snapshot, deltaMs);
    }

    echo.fireCursor = consumeEventsThrough(
      echo.descriptor.fireEvents,
      echo.fireCursor,
      echo.sourceTimeMs,
      (event) => this.#replayFire(echo, event, previousSourceTimeMs),
    );
    echo.dashCursor = consumeEventsThrough(
      echo.descriptor.dashEvents,
      echo.dashCursor,
      echo.sourceTimeMs,
      (event) => this.#replayDash(echo, event),
    );
    echo.updateVisuals(deltaMs);
    this.statistics.recordEchoActiveTime(deltaMs);

    if (echo.playbackElapsedMs >= echo.descriptor.durationMs) {
      this.eventBus.emit('echo:playback:completed', {
        echoInstanceId: echo.instanceId,
        sourceTimeMs: echo.sourceTimeMs,
        replayEndMs: echo.replayEndMs,
        fireEventsReplayed: echo.fireCursor,
        dashEventsReplayed: echo.dashCursor,
      });
      this.eventBus.emit('echo:normal-expiration', {
        echoInstanceId: echo.instanceId,
        x: echo.x,
        y: echo.y,
        loadout: echo.loadout,
      });
      if (echo.beginDissolve()) {
        this.audioManager.playEchoDissolve?.();
        this.eventBus.emit('echo:dissolve:started', {
          echoInstanceId: echo.instanceId,
          reason: 'playback-complete',
        });
        this.eventBus.emit('echo:state:changed', {
          echoInstanceId: echo.instanceId,
          state: ECHO_STATES.dissolving,
        });
      }
    }
  }

  #replayFire(echo, event, previousSourceTimeMs) {
    if (!echo.state.is(ECHO_STATES.playback)) {
      return;
    }
    const eventInterpolation = interpolateReplaySnapshot(
      echo.descriptor.snapshots,
      event.timestampMs,
      echo.snapshotCursor,
    ).snapshot;
    if (!eventInterpolation) {
      return;
    }
    const eventAimLength = Math.hypot(event.aimX, event.aimY) || 1;
    const baseDirection = {
      x: event.aimX / eventAimLength,
      y: event.aimY / eventAimLength,
    };
    const loadout = echo.loadout;
    let spawned = 0;
    for (const spreadAngle of loadout.spreadAngles) {
      const direction = rotateDirection(baseDirection.x, baseDirection.y, spreadAngle);
      const x = eventInterpolation.x + direction.x * loadout.spawnOffset;
      const y = eventInterpolation.y + direction.y * loadout.spawnOffset;
      const criticalResolved = Boolean(event.projectileMetadata?.criticalResolved);
      const scaledDamage = loadout.baseDamage * loadout.echoDamageScalar * (
        criticalResolved ? loadout.criticalMultiplier : 1
      );
      const projectile = this.echoProjectileManager.activate({
        x,
        y,
        direction,
        projectileSpeed: loadout.projectileSpeed,
        projectileLifetimeMs: loadout.projectileLifetimeMs,
        projectileRadius: loadout.projectileRadius,
        ownerId: echo.instanceId,
        sourceEventId: event.weaponEventId,
        damagePacket: {
          faction: 'echo',
          ownerType: 'echo',
          ownerId: echo.instanceId,
          sourceEventId: event.weaponEventId,
          baseDamage: loadout.baseDamage,
          scaledDamage,
          criticalChance: loadout.criticalChance,
          criticalMultiplier: loadout.criticalMultiplier,
          criticalResolved,
          pierceCount: loadout.pierceCount,
          ricochetCount: loadout.ricochetCount,
          ricochetDecay: loadout.ricochetDecay,
          sameTargetGuardMs: loadout.sameTargetGuardMs,
          canCrit: true, canTriggerChain: true, canTriggerFragments: true, triggerDepth: 0,
        },
      });
      if (projectile) {
        spawned += 1;
      }
    }
    if (spawned === 0) {
      return;
    }
    const timingErrorMs = Math.max(0, echo.sourceTimeMs - event.timestampMs);
    echo.lastEventTimingErrorMs = timingErrorMs;
    this.lastEventTimingErrorMs = timingErrorMs;
    this.maximumEventTimingErrorMs = Math.max(this.maximumEventTimingErrorMs, timingErrorMs);
    this.statistics.recordEchoShot(spawned);
    this.statistics.recordReplayedFireEvent();
    this.statistics.recordEventTimingError(timingErrorMs);
    echo.renderer.playFire();
    this.audioManager.playEchoShot?.();
    this.eventBus.emit('echo:fire:replayed', {
      echoInstanceId: echo.instanceId,
      sourceEventId: event.weaponEventId,
      eventTimestampMs: event.timestampMs,
      previousSourceTimeMs,
      dispatchSourceTimeMs: echo.sourceTimeMs,
      timingErrorMs,
      projectileCount: spawned,
    });
  }

  #replayDash(echo, event) {
    if (!echo.state.is(ECHO_STATES.playback)) {
      return;
    }
    echo.renderer.playDash(event.durationMs);
    this.statistics.recordReplayedDashEvent();
    this.audioManager.playEchoDash?.();
    this.eventBus.emit('echo:dash:replayed', {
      echoInstanceId: echo.instanceId,
      sourceEventId: event.dashEventId,
      timestampMs: event.timestampMs,
      directionX: event.directionX,
      directionY: event.directionY,
      durationMs: event.durationMs,
      distance: event.distance,
      x: echo.x,
      y: echo.y,
      loadout: echo.loadout,
    });
  }

  #emitProgress() {
    const diagnostics = this.getDiagnostics();
    this.eventBus.emit('echo:playback:progress', {
      activeCount: diagnostics.activeCount,
      activeCap: Math.max(1, Number(this.activeCapProvider?.()) || ECHO_BALANCE.playback.activeCap),
      activeEcho: diagnostics.activeEcho,
    });
  }

  #releaseEcho(echo, reason) {
    const payload = { echoInstanceId: echo.instanceId, reason, x: echo.x, y: echo.y, loadout: echo.loadout, phantomShieldRemaining: echo.phantomShieldRemaining ?? 0 };
    const instanceId = echo.instanceId;
    if (!this.pool.release(echo)) {
      return false;
    }
    this.eventBus.emit('echo:deactivated', payload);
    this.eventBus.emit('echo:state:changed', {
      echoInstanceId: instanceId,
      state: ECHO_STATES.inactive,
    });
    return true;
  }
}
