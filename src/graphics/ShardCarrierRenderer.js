import { PALETTE } from '../data/constants.js';
import { ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';

export class ShardCarrierRenderer {
  constructor(scene, settings) {
    this.settings = settings;
    this.container = scene.add.container(-1000, -1000).setDepth(45).setVisible(false);
    this.orbit = scene.add.circle(0, 0, 42, PALETTE.dangerRed, 0.04).setStrokeStyle(2, PALETTE.eliteOrange, 0.45);
    this.body = scene.add.polygon(0, 0, [0, -29, 25, -15, 25, 15, 0, 29, -25, 15, -25, -15], PALETTE.surfaceHighlight, 1).setStrokeStyle(3, PALETTE.dangerRed, 0.95);
    this.core = scene.add.circle(0, 0, 11, PALETTE.eliteOrange, 0.9);
    this.shards = [0, 1, 2].map((index) => scene.add.triangle(0, 0, 0, -8, 7, 6, -7, 6, PALETTE.dangerRed, 0.9).setPosition(Math.cos(index * Math.PI * 2 / 3) * 40, Math.sin(index * Math.PI * 2 / 3) * 40));
    this.container.add([this.orbit, this.body, this.core, ...this.shards]);
    this.orbitAngle = 0;
    this.flashMs = 0;
  }
  setPosition(x, y) { this.container.setPosition(x, y); }
  setRotation(rotation) { this.body.setRotation(rotation); }
  setVisible(value) { this.container.setVisible(value); }
  setSpawning(progress) { const value = Math.min(1, progress); this.container.setAlpha(0.2 + value * 0.8).setScale(0.55 + value * 0.45); }
  setActive() { this.container.setAlpha(1).setScale(1); }
  setState(state) { if (state === ENEMY_STATES.dying) this.shards.forEach((shard) => shard.setAlpha(0.25)); }
  flash() { this.flashMs = 60; }
  update(delta) {
    this.flashMs = Math.max(0, this.flashMs - delta);
    this.orbitAngle += delta * 0.0012;
    this.shards.forEach((shard, index) => shard.setPosition(Math.cos(this.orbitAngle + index * Math.PI * 2 / 3) * 40, Math.sin(this.orbitAngle + index * Math.PI * 2 / 3) * 40).setRotation(this.orbitAngle));
    this.body.setFillStyle(this.flashMs ? 0xffffff : PALETTE.surfaceHighlight, 1);
  }
  destroy() { this.container.destroy(true); }
}
