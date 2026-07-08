import { PALETTE } from '../data/constants.js';
import { TEXTURE_KEYS } from '../graphics/TextureFactory.js';

export class PlayerFeedbackSystem {
  constructor({ scene, cleanupRegistry, eventBus, audioManager, settingsManager, playerRenderer, cameraController }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.audioManager = audioManager;
    this.settingsManager = settingsManager;
    this.playerRenderer = playerRenderer;
    this.cameraController = cameraController;
    this.particles = Array.from({ length: 64 }, () => ({
      sprite: scene.add.image(-1000, -1000, TEXTURE_KEYS.particle)
        .setVisible(false)
        .setDepth(80),
      active: false,
      vx: 0,
      vy: 0,
      remainingMs: 0,
      totalMs: 1,
    }));

    cleanupRegistry.trackSubscription(eventBus.subscribe(
      'weapon:fired',
      (payload) => this.#onFired(payload),
      { owner: this },
    ));
    cleanupRegistry.trackSubscription(eventBus.subscribe(
      'player:dash:started',
      (payload) => this.#onDash(payload),
      { owner: this },
    ));
    cleanupRegistry.trackSubscription(eventBus.subscribe(
      'player:dash:ended',
      () => this.cameraController.impulse(0.0015, 45),
      { owner: this },
    ));
    cleanupRegistry.trackSubscription(eventBus.subscribe(
      'target:hit',
      (payload) => this.#onTargetHit(payload),
      { owner: this },
    ));
    cleanupRegistry.trackSubscription(eventBus.subscribe(
      'prototype:crossfire',
      (payload) => this.#onCrossfire(payload),
      { owner: this },
    ));
    cleanupRegistry.trackSubscription(eventBus.subscribe(
      'echo:deployed',
      () => this.cameraController.impulse(0.0012, 55),
      { owner: this },
    ));
    cleanupRegistry.trackSubscription(eventBus.subscribe(
      'prototype:completed',
      () => {
        this.audioManager.playObjectiveComplete();
        this.cameraController.completion();
      },
      { owner: this },
    ));
    cleanupRegistry.add(() => this.destroy());
  }

  update(deltaMs) {
    const deltaSeconds = deltaMs / 1000;
    for (const particle of this.particles) {
      if (!particle.active) {
        continue;
      }
      particle.remainingMs = Math.max(0, particle.remainingMs - deltaMs);
      particle.sprite.x += particle.vx * deltaSeconds;
      particle.sprite.y += particle.vy * deltaSeconds;
      particle.sprite.setAlpha(particle.remainingMs / particle.totalMs);
      if (particle.remainingMs === 0) {
        particle.active = false;
        particle.sprite.setVisible(false).setPosition(-1000, -1000);
      }
    }
  }

  destroy() {
    for (const particle of this.particles) {
      particle.sprite.destroy();
    }
    this.particles = [];
  }

  #onFired(payload) {
    this.playerRenderer.playFire();
    this.audioManager.playPlayerShot();
    this.#burst(payload.x, payload.y, 1, PALETTE.playerCyan, 90);
  }

  #onDash(payload) {
    this.audioManager.playDash();
    this.#burst(payload.x, payload.y, 6, PALETTE.playerCyan, 160);
  }

  #onTargetHit(payload) {
    this.audioManager.playTargetHit();
    const count = this.settingsManager.get('visual.reducedParticles', false) ? 2 : 4;
    const color = payload.source === 'echo' ? PALETTE.echoViolet : PALETTE.warningYellow;
    this.#burst(payload.x, payload.y, count, color, 130);
  }

  #onCrossfire(payload) {
    this.audioManager.playCrossfire?.();
    const target = this.scene.children.list.find((child) => child.getData?.('targetEntity')?.id === payload.targetId);
    const x = target?.x ?? this.scene.cameras.main.midPoint.x;
    const y = target?.y ?? this.scene.cameras.main.midPoint.y;
    const count = this.settingsManager.get('visual.reducedParticles', false) ? 3 : 7;
    this.#burst(x, y, count, PALETTE.successMint, 175);
    this.cameraController.impulse(0.0014, 55);
  }

  #burst(x, y, requestedCount, color, speed) {
    let created = 0;
    for (const particle of this.particles) {
      if (particle.active) {
        continue;
      }
      const angle = (created / Math.max(1, requestedCount)) * Math.PI * 2 + Math.random() * 0.45;
      particle.active = true;
      particle.vx = Math.cos(angle) * speed * (0.65 + Math.random() * 0.5);
      particle.vy = Math.sin(angle) * speed * (0.65 + Math.random() * 0.5);
      particle.remainingMs = 180 + Math.random() * 90;
      particle.totalMs = particle.remainingMs;
      particle.sprite
        .setPosition(x, y)
        .setTint(color)
        .setAlpha(0.9)
        .setScale(0.55 + Math.random() * 0.55)
        .setVisible(true);
      created += 1;
      if (created >= requestedCount) {
        break;
      }
    }
  }
}
