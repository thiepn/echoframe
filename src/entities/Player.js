import { PLAYER_BALANCE } from '../data/playerBalance.js';
import { TEXTURE_KEYS } from '../graphics/TextureFactory.js';
import { PlayerRenderer } from '../graphics/PlayerRenderer.js';

export class Player {
  constructor(scene, { x, y, settingsManager }) {
    this.scene = scene;
    this.bodySprite = scene.physics.add.sprite(x, y, TEXTURE_KEYS.physicsBody);
    this.bodySprite.setVisible(false);
    this.bodySprite.setActive(true);
    this.bodySprite.setCollideWorldBounds(false);
    this.bodySprite.body.setCircle(PLAYER_BALANCE.movement.collisionRadius);
    this.bodySprite.body.setMaxVelocity(
      PLAYER_BALANCE.movement.maximumSpeed * 3,
      PLAYER_BALANCE.movement.maximumSpeed * 3,
    );
    this.renderer = new PlayerRenderer(scene, settingsManager);
    this.renderer.setPosition(x, y);
    this.active = true;
  }

  setVelocity(x, y) {
    this.bodySprite.setVelocity(x, y);
    this.renderer.setVelocity(x, y);
  }

  setPosition(x, y) {
    this.bodySprite.setPosition(x, y);
    this.bodySprite.body.reset(x, y);
    this.renderer.setPosition(x, y);
  }

  updateVisuals(deltaMs, aimDirection, { dashing, invulnerable }) {
    this.renderer.setPosition(this.x, this.y);
    this.renderer.setAim(aimDirection);
    this.renderer.setDashing(dashing);
    this.renderer.setInvulnerable(invulnerable);
    this.renderer.update(deltaMs);
  }

  get x() {
    return this.bodySprite.x;
  }

  get y() {
    return this.bodySprite.y;
  }

  get velocity() {
    return this.bodySprite.body.velocity;
  }

  destroy() {
    if (!this.active) {
      return;
    }
    this.active = false;
    this.renderer.destroy();
    this.bodySprite.destroy();
  }
}
