export class ArenaRuntime {
  constructor({ descriptor, wallGroup, wallVisuals = [], floor = null, decoration = null } = {}) {
    Object.assign(this, { descriptor, wallGroup, wallVisuals, floor, decoration });
    this.active = true;
  }
  get bounds() { return this.descriptor.cameraBounds; }
  get wallDefinitions() { return this.descriptor.solidGeometry; }
  socketById(id) { return this.descriptor.enemySockets.find((socket) => socket.id === id) || this.descriptor.eliteSockets.find((socket) => socket.id === id) || null; }
  destroy() {
    if (!this.active) return false;
    this.active = false;
    this.floor?.destroy?.();
    this.decoration?.destroy?.();
    for (const visual of this.wallVisuals ?? []) {
      if (visual?.active || visual?.scene) visual.destroy?.();
    }
    // Phaser can invalidate StaticPhysicsGroup.children before scene shutdown
    // callbacks execute. Only invoke group cleanup while its collection exists.
    if (this.wallGroup?.children) {
      this.wallGroup.clear?.(true, true);
      this.wallGroup.destroy?.(true);
    }
    this.wallGroup = null;
    this.wallVisuals = [];
    this.floor = null;
    this.decoration = null;
    return true;
  }
  snapshot() {
    return Object.freeze({
      active: this.active,
      arenaInstanceId: this.descriptor?.arenaInstanceId,
      templateId: this.descriptor?.templateId,
      transformId: this.descriptor?.transformId,
      hazardConfigurationId: this.descriptor?.hazardConfigurationId,
      wallCount: this.descriptor?.solidGeometry?.length ?? 0,
    });
  }
}
