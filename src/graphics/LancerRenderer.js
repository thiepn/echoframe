import { PALETTE } from '../data/constants.js';
import { ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';

export class LancerRenderer {
  constructor(scene, settings) {
    this.settings = settings;
    this.container = scene.add.container(-1000, -1000).setDepth(46).setVisible(false);
    this.lane = scene.add.rectangle(26, 0, 620, 46, PALETTE.dangerRed, 0.09).setOrigin(0, 0.5).setStrokeStyle(2, PALETTE.eliteOrange, 0.85).setVisible(false);
    this.trail = scene.add.triangle(-32, 0, -4, -12, 14, 0, -4, 12, PALETTE.dangerRed, 0.25);
    this.body = scene.add.polygon(0, 0, [34, 0, 4, -15, -30, -11, -40, 0, -30, 11, 4, 15], PALETTE.dangerRed, 0.72).setStrokeStyle(3, PALETTE.eliteOrange, 0.95);
    this.core = scene.add.circle(-5, 0, 7, 0xffffff, 0.9);
    this.container.add([this.lane, this.trail, this.body, this.core]);
    this.flashMs = 0;
  }
  setPosition(x, y) { this.container.setPosition(x, y); }
  setRotation(rotation) { this.container.setRotation(rotation); }
  setLaneLength(length) { this.lane.setSize(Math.max(0, Number(length) || 0), this.lane.height); }
  setVisible(value) { this.container.setVisible(value); }
  setSpawning(progress) { const value = Math.min(1, progress); this.container.setAlpha(0.25 + value * 0.75).setScale(0.5 + value * 0.5); }
  setActive() { this.container.setAlpha(1).setScale(1); }
  setState(state, progress = 0) {
    const telegraph = state === ENEMY_STATES.anticipation || state === ENEMY_STATES.lock;
    this.lane.setVisible(telegraph);
    if (telegraph) {
      const width = this.settings?.get('accessibility.largerTelegraphOutlines', false) ? 5 : 3;
      this.lane.setStrokeStyle(width, PALETTE.eliteOrange, 0.9).setAlpha(0.35 + Math.min(1, progress) * 0.55);
      this.container.setScale(state === ENEMY_STATES.lock ? 0.82 : 0.92, 1.08);
    } else if (state === ENEMY_STATES.execution) this.container.setScale(1.5, 0.68);
    else if (state === ENEMY_STATES.recovery) this.container.setScale(0.88, 1.12).setRotation(this.container.rotation + 0.05);
    else if (state !== ENEMY_STATES.spawning) this.container.setScale(1).setAlpha(1);
  }
  flash() { this.flashMs = 60; }
  update(delta) { this.flashMs = Math.max(0, this.flashMs - delta); this.body.setFillStyle(this.flashMs ? 0xffffff : PALETTE.dangerRed, this.flashMs ? 0.95 : 0.72); }
  destroy() { this.container.destroy(true); }
}
