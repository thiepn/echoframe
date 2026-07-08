import { ARENA_HAZARD_DEFINITIONS } from '../data/arenaHazardDefinitions.js';
import { FACTIONS } from '../combat/Faction.js';

const STATES = Object.freeze({
  cooldown: 'COOLDOWN',
  warning: 'WARNING',
  active: 'ACTIVE',
});

export class ArenaHazardManager {
  constructor({ scene, eventBus, settingsManager, telemetry = null, descriptor, difficultyProfile = {} } = {}) {
    Object.assign(this, { scene, eventBus, settingsManager, telemetry, descriptor, difficultyProfile });
    this.definition = ARENA_HAZARD_DEFINITIONS[descriptor?.hazardConfigurationId] ?? ARENA_HAZARD_DEFINITIONS.none;
    this.group = scene.physics.add.staticGroup();
    this.items = [];
    this.elapsedMs = 0;
    this.cycleIndex = 0;
    this.enabled = this.definition.type !== 'none';
    this.destroyed = false;
    this.#create();
  }

  #outlineWidth(base) {
    if (this.settingsManager?.get('accessibility.largerTelegraphOutlines', false)) return base + 3;
    if (this.settingsManager?.get('visual.highContrast', false)) return base + 2;
    return base;
  }

  #create() {
    if (!this.enabled) return;
    const count = Math.min(this.definition.maximumActive, this.descriptor.hazardSockets.length);
    for (let index = 0; index < count; index += 1) {
      const socket = this.descriptor.hazardSockets[index];
      const width = this.definition.type === 'circle'
        ? this.definition.radius * 2
        : socket.orientation === 'vertical' ? this.definition.width : 520;
      const height = this.definition.type === 'circle'
        ? this.definition.radius * 2
        : socket.orientation === 'vertical' ? 520 : this.definition.width;
      const zone = this.scene.add.zone(socket.x, socket.y, width, height);
      this.scene.physics.add.existing(zone, true);
      zone.body.enable = false;
      this.group.add(zone);
      const visual = this.scene.add.rectangle(socket.x, socket.y, width, height, 0xff4d67, 0.06)
        .setStrokeStyle(this.#outlineWidth(3), 0xffd166, 0.7)
        .setDepth(30)
        .setVisible(false);
      zone.setData('arenaHazard', {
        id: `${this.descriptor.arenaInstanceId}-${socket.id}`,
        damage: this.definition.damage,
        activationId: 0,
        consumed: false,
        state: STATES.cooldown,
      });
      this.items.push({ socket, zone, visual, state: STATES.cooldown, remainingMs: this.definition.cooldownMs + index * (this.definition.warningMs + this.definition.activeMs + 300), activationId: 0 });
    }
  }

  update(deltaMs, { paused = false, recovery = false, majorExecutionActive = false } = {}) {
    if (!this.enabled || paused || recovery) return;
    const delta = Math.max(0, Number(deltaMs) || 0);
    this.elapsedMs += delta;
    for (const item of this.items) {
      item.remainingMs -= delta;
      if (item.remainingMs > 0) continue;
      if (item.state === STATES.cooldown) {
        if (majorExecutionActive) {
          item.remainingMs = 250;
          continue;
        }
        item.state = STATES.warning;
        item.remainingMs = Math.max(
          this.definition.warningFloorMs,
          this.definition.warningMs * (this.difficultyProfile.anticipation ?? 1),
        );
        item.activationId += 1;
        item.zone.body.enable = false;
        item.visual.setVisible(true).setFillStyle(0xffd166, 0.08).setStrokeStyle(this.#outlineWidth(3), 0xffd166, 0.9);
        this.eventBus?.emit('arena:hazard:warning', {
          hazardId: item.zone.getData('arenaHazard').id,
          activationId: item.activationId,
          configurationId: this.definition.id,
        });
      } else if (item.state === STATES.warning) {
        item.state = STATES.active;
        item.remainingMs = this.definition.activeMs;
        item.zone.body.enable = true;
        item.visual.setFillStyle(0xff4d67, 0.18).setStrokeStyle(this.#outlineWidth(4), 0xff4d67, 1);
        const data = item.zone.getData('arenaHazard');
        Object.assign(data, { activationId: item.activationId, consumed: false, state: STATES.active });
        this.telemetry?.recordHazardActivation?.();
        this.eventBus?.emit('arena:hazard:active', {
          hazardId: data.id,
          activationId: item.activationId,
          configurationId: this.definition.id,
        });
      } else {
        item.state = STATES.cooldown;
        item.remainingMs = this.definition.cooldownMs;
        item.zone.body.enable = false;
        item.visual.setVisible(false);
        item.zone.getData('arenaHazard').state = STATES.cooldown;
      }
    }
  }

  consume(zone) {
    const data = zone?.getData?.('arenaHazard');
    if (!data || data.state !== STATES.active || data.consumed) return null;
    data.consumed = true;
    return Object.freeze({
      damageId: `arena-hazard-${data.id}-${data.activationId}`,
      sourceFaction: FACTIONS.enemy,
      sourceType: 'arena-hazard',
      sourceId: data.id,
      amount: data.damage,
      activationId: data.activationId,
    });
  }

  clear(reason = 'clear') {
    if (this.destroyed) return false;
    for (const item of this.items) {
      if (item.zone?.body) item.zone.body.enable = false;
      item.state = STATES.cooldown;
      item.remainingMs = this.definition.cooldownMs;
      item.visual?.setVisible?.(false);
      const data = item.zone?.getData?.('arenaHazard');
      if (data) Object.assign(data, { consumed: false, state: STATES.cooldown });
    }
    // Keep the static group alive until CollisionManager has removed its
    // overlap. Phaser removes colliders through a deferred process queue, so
    // destroying the group here can leave one physics step with an invalid
    // StaticPhysicsGroup reference.
    this.enabled = false;
    this.eventBus?.emit('arena:hazards:cleared', { reason });
    return true;
  }

  destroy() {
    if (this.destroyed) return false;
    this.clear('destroy');
    for (const item of this.items) {
      item.zone?.destroy?.();
      item.visual?.destroy?.();
    }
    this.items = [];
    // Scene shutdown may already have destroyed the StaticPhysicsGroup's
    // internal children collection. Treat that state as already destroyed.
    if (this.group?.children) {
      this.group.clear?.(true, true);
      this.group.destroy?.(true);
    }
    this.group = null;
    this.destroyed = true;
    return true;
  }

  snapshot() {
    return Object.freeze({
      configurationId: this.definition.id,
      active: this.items.filter((item) => item.state === STATES.active).length,
      warning: this.items.filter((item) => item.state === STATES.warning).length,
      count: this.items.length,
      states: Object.freeze(this.items.map((item) => Object.freeze({
        id: item.socket.id,
        state: item.state,
        remainingMs: item.remainingMs,
        activationId: item.activationId,
      }))),
    });
  }
}
