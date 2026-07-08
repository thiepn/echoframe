import { EchoRenderer } from '../graphics/EchoRenderer.js';
import { ECHO_STATES, EchoState } from '../state/EchoState.js';

export class Echo {
  constructor(scene, settingsManager, poolIndex) {
    this.scene = scene;
    this.poolIndex = poolIndex;
    this.renderer = new EchoRenderer(scene, settingsManager);
    this.state = new EchoState();
    this.resetFields();
  }

  activate({ instanceId, descriptor, initialSnapshot }) {
    this.resetFields();
    this.instanceId = instanceId;
    this.descriptor = descriptor;
    this.loadout = descriptor.loadout;
    this.replayStartMs = descriptor.replayStartMs;
    this.replayEndMs = descriptor.replayEndMs;
    this.playbackElapsedMs = 0;
    this.sourceTimeMs = descriptor.replayStartMs;
    this.snapshotCursor = 0;
    this.fireCursor = 0;
    this.dashCursor = 0;
    this.state.transition(ECHO_STATES.spawning);
    this.renderer.activate({
      x: initialSnapshot.x,
      y: initialSnapshot.y,
      aimRotation: initialSnapshot.aimRotation,
    });
    this.state.transition(ECHO_STATES.playback);
  }

  applySnapshot(snapshot, deltaMs) {
    this.currentSnapshot = snapshot;
    this.renderer.setPlaybackTransform(snapshot, deltaMs);
  }

  get x() { return this.renderer?.container?.x ?? this.currentSnapshot?.x ?? 0; }

  get y() { return this.renderer?.container?.y ?? this.currentSnapshot?.y ?? 0; }

  beginDissolve() {
    if (!this.state.is(ECHO_STATES.playback)) {
      return false;
    }
    this.state.transition(ECHO_STATES.dissolving);
    this.renderer.beginDissolve();
    return true;
  }

  updateVisuals(deltaMs) {
    this.renderer.update(deltaMs);
  }

  forceDeactivate() {
    if (this.state.is(ECHO_STATES.playback)) {
      this.state.transition(ECHO_STATES.dissolving);
    }
    if (this.state.is(ECHO_STATES.dissolving)) {
      this.state.transition(ECHO_STATES.inactive);
    } else {
      this.state.reset();
    }
    this.renderer.deactivate();
    this.resetFields();
  }

  resetFields() {
    this.instanceId = 0;
    this.descriptor = null;
    this.loadout = null;
    this.currentSnapshot = null;
    this.replayStartMs = 0;
    this.replayEndMs = 0;
    this.playbackElapsedMs = 0;
    this.sourceTimeMs = 0;
    this.snapshotCursor = 0;
    this.fireCursor = 0;
    this.dashCursor = 0;
    this.lastEventTimingErrorMs = 0;
  }

  destroy() {
    this.forceDeactivate();
    this.renderer.destroy();
  }
}
