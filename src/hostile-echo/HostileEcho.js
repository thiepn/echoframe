export class HostileEcho {
  constructor(scene, settingsManager = null) {
    this.scene = scene;
    this.settingsManager = settingsManager;
    const larger = settingsManager?.get('accessibility.largerTelegraphOutlines', false);
    const high = settingsManager?.get('visual.highContrast', false);
    const bodyWidth = larger ? 7 : high ? 6 : 4;
    const sigilWidth = larger ? 6 : high ? 5 : 3;
    this.container = scene.add.container(-1000, -1000).setDepth(32).setVisible(false);
    this.body = scene.add.graphics();
    this.body.fillStyle(0x13070b, 1).fillCircle(0, 0, 24).lineStyle(bodyWidth, 0xe52f50, 1).strokeCircle(0, 0, 24);
    this.body.lineStyle(Math.max(3, bodyWidth - 1), 0xff8797, 0.9).beginPath().moveTo(-28, -16).lineTo(-10, -30).lineTo(0, -18).lineTo(18, -34).lineTo(30, -12).strokePath();
    this.sigil = scene.add.graphics();
    this.sigil.lineStyle(sigilWidth, 0xa11a38, 0.8).strokeCircle(0, 0, 34).lineBetween(-30, 0, 30, 0).lineBetween(0, -30, 0, 30);
    this.container.add([this.sigil, this.body]);
    this.visualOutlineWidth = bodyWidth;
    this.resetFields();
  }

  activate(data) {
    Object.assign(this, { instanceId: data.instanceId, descriptor: data.descriptor, remainingMs: data.descriptor.durationMs, elapsedMs: 0, nextFireIndex: 0, active: true });
    const first = data.descriptor.snapshots[0];
    this.container.setPosition(first.x, first.y).setVisible(true).setAlpha(1);
    return this;
  }

  update(deltaMs, fire) {
    if (!this.active) return false;
    this.elapsedMs += deltaMs;
    this.remainingMs -= deltaMs;
    const sourceTime = this.descriptor.replayStartMs + this.elapsedMs;
    const snapshots = this.descriptor.snapshots;
    let index = 0;
    while (index < snapshots.length - 2 && snapshots[index + 1].timestampMs < sourceTime) index += 1;
    const a = snapshots[index];
    const b = snapshots[Math.min(index + 1, snapshots.length - 1)];
    const span = Math.max(1, b.timestampMs - a.timestampMs);
    const t = Math.max(0, Math.min(1, (sourceTime - a.timestampMs) / span));
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    this.container.setPosition(x, y).setRotation(Math.atan2(a.aimY, a.aimX));
    this.sigil.rotation -= deltaMs * 0.002;
    while (this.nextFireIndex < this.descriptor.fireEvents.length && this.descriptor.fireEvents[this.nextFireIndex].timestampMs <= sourceTime) {
      fire?.(this, this.descriptor.fireEvents[this.nextFireIndex]);
      this.nextFireIndex += 1;
    }
    return this.remainingMs > 0;
  }

  deactivate(reason = 'deactivate') {
    if (!this.active) return false;
    this.active = false;
    this.reason = reason;
    this.container.setVisible(false).setPosition(-1000, -1000);
    this.resetFields();
    return true;
  }

  resetFields() {
    this.instanceId = null;
    this.descriptor = null;
    this.remainingMs = 0;
    this.elapsedMs = 0;
    this.nextFireIndex = 0;
    this.active = false;
    this.reason = 'reset';
  }

  get x() { return this.container.x; }
  get y() { return this.container.y; }
  destroy() { this.container.destroy(true); }
}
