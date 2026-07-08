import { PALETTE } from '../data/constants.js';
import { ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';

export class BulwarkRenderer {
  constructor(scene, settings) {
    this.settings = settings;
    this.container = scene.add.container(-1000, -1000).setDepth(47).setVisible(false);
    this.shieldArc = scene.add.arc(0, 0, 48, -75, 75, false, PALETTE.dangerRed, 0.14).setStrokeStyle(7, PALETTE.warningYellow, 0.9);
    this.shield = scene.add.arc(0, 0, 34, -78, 78, false, PALETTE.surfaceHighlight, 0.9).setStrokeStyle(5, PALETTE.dangerRed, 1);
    this.core = scene.add.circle(-12, 0, 14, PALETTE.eliteOrange, 0.9).setStrokeStyle(3, 0xffffff, 0.7);
    this.rearWeakness = scene.add.triangle(-32, 0, -7, -8, -7, 8, 8, 0, PALETTE.warningYellow, 0.85);
    this.container.add([this.shieldArc, this.shield, this.core, this.rearWeakness]);
    this.flashMs = 0;
  }
  setPosition(x, y) { this.container.setPosition(x, y); }
  setRotation(rotation) { this.container.setRotation(rotation); }
  setVisible(value) { this.container.setVisible(value); }
  setSpawning(progress) { const value = Math.min(1, progress); this.container.setAlpha(0.25 + value * 0.75).setScale(0.6 + value * 0.4); }
  setActive() { this.container.setAlpha(1).setScale(1); }
  setState(state, progress = 0) {
    const staggered = state === ENEMY_STATES.staggered;
    this.shield.setAlpha(staggered ? 0.2 : 0.9);
    this.shieldArc.setAlpha(staggered ? 0.15 : 0.75);
    this.core.setScale(staggered ? 1.25 + Math.sin(progress * Math.PI * 6) * 0.08 : 1);
  }
  flash(kind = 'normal') { this.flashMs = 65; this.flashKind = kind; }
  update(delta) { this.flashMs = Math.max(0, this.flashMs - delta); this.core.setFillStyle(this.flashMs ? 0xffffff : PALETTE.eliteOrange, this.flashMs ? 1 : 0.9); }
  destroy() { this.container.destroy(true); }
}
