import { PALETTE } from '../data/constants.js';
import { ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';

export class SuppressorRenderer {
  constructor(scene, settings) {
    this.settings = settings;
    this.container = scene.add.container(-1000, -1000).setDepth(43).setVisible(false);
    this.field = scene.add.circle(0, 0, 210, PALETTE.echoViolet, 0.035).setStrokeStyle(3, PALETTE.echoViolet, 0.7).setVisible(false);
    this.inner = scene.add.circle(0, 0, 25, PALETTE.surfaceHighlight, 0.95).setStrokeStyle(4, PALETTE.echoViolet, 0.95);
    this.core = scene.add.circle(0, 0, 9, PALETTE.dangerRed, 0.9);
    this.emitters = [0, 1, 2, 3].map((index) => scene.add.rectangle(Math.cos(index * Math.PI / 2) * 35, Math.sin(index * Math.PI / 2) * 35, 13, 6, PALETTE.echoViolet, 0.9).setRotation(index * Math.PI / 2));
    this.container.add([this.field, this.inner, this.core, ...this.emitters]);
    this.flashMs = 0;
  }
  setPosition(x, y) { this.container.setPosition(x, y); }
  setRotation(rotation) { this.inner.setRotation(rotation); }
  setVisible(value) { this.container.setVisible(value); }
  setSpawning(progress) { const value = Math.min(1, progress); this.container.setAlpha(0.2 + value * 0.8).setScale(0.5 + value * 0.5); }
  setActive() { this.container.setAlpha(1).setScale(1); }
  setState(state, progress = 0) {
    const active = state === ENEMY_STATES.execution;
    const anticipating = state === ENEMY_STATES.anticipation;
    this.field.setVisible(active || anticipating).setAlpha(active ? 0.65 : 0.15 + progress * 0.45);
    this.field.setScale(active ? 1 + Math.sin(progress * Math.PI * 4) * 0.02 : 0.65 + progress * 0.35);
  }
  flash() { this.flashMs = 60; }
  update(delta) { this.flashMs = Math.max(0, this.flashMs - delta); this.inner.rotation += delta * 0.0007; this.core.setFillStyle(this.flashMs ? 0xffffff : PALETTE.dangerRed, 0.9); }
  destroy() { this.container.destroy(true); }
}
