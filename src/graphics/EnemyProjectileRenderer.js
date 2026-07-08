import { PALETTE } from '../data/constants.js';

/**
 * Applies the hostile projectile's canonical visual profile to a pooled sprite.
 * Rendering state is reset explicitly so pooled activations cannot inherit stale
 * tint, alpha, scale, or rotation values.
 */
export class EnemyProjectileRenderer {
  /** @param {import('phaser').Physics.Arcade.Sprite} sprite */
  constructor(sprite) {
    this.sprite = sprite;
  }

  /** @param {{direction:{x:number,y:number}}} activation */
  activate(activation) {
    const rotation = Math.atan2(activation.direction.y, activation.direction.x);
    this.sprite
      .setRotation(rotation)
      .setTint(PALETTE.dangerRed)
      .setAlpha(0.95)
      .setScale(0.85, 0.72);
  }

  reset() {
    this.sprite.clearTint().setAlpha(1).setScale(1).setRotation(0);
  }

  destroy() {
    this.sprite = null;
  }
}
