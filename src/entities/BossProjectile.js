import Phaser from 'phaser';
import { TEXTURE_KEYS } from '../graphics/TextureFactory.js';

export class BossProjectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, -1000, -1000, TEXTURE_KEYS.physicsBody);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(35).setActive(false).setVisible(false);
    this.body.enable = false;
    this.resetFields();
  }
  activate(data) {
    Object.assign(this, {
      activationId: data.activationId,
      ownerId: data.ownerId ?? 'null-architect',
      sourceType: data.sourceType ?? 'boss-projectile',
      profileId: data.profileId,
      damage: data.damage,
      remainingLifetimeMs: data.lifetimeMs,
      blockable: data.blockable !== false,
      radius: data.radius,
    });
    this.setActive(true).setVisible(true).setTint(data.color ?? 0xff405b).setAlpha(0.98).setScale(Math.max(0.3, data.radius / 18));
    this.body.enable = true;
    this.body.setCircle(data.radius, 18 - data.radius, 18 - data.radius);
    this.body.reset(data.x, data.y);
    this.setPosition(data.x, data.y).setVelocity(data.direction.x * data.speed, data.direction.y * data.speed);
    return this;
  }
  updateLifetime(deltaMs) { this.remainingLifetimeMs = Math.max(0, this.remainingLifetimeMs - Math.max(0, Number(deltaMs) || 0)); this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x); return this.remainingLifetimeMs > 0; }
  deactivate(reason = 'deactivated') { if (!this.active && !this.body.enable) return false; this.deactivationReason = reason; this.setVelocity(0,0); this.body.stop(); this.body.enable = false; this.setActive(false).setVisible(false).clearTint().setPosition(-1000,-1000); this.resetFields(); return true; }
  resetFields() { this.activationId = 0; this.ownerId = null; this.sourceType = null; this.profileId = null; this.damage = 0; this.remainingLifetimeMs = 0; this.blockable = true; this.radius = 0; this.deactivationReason = 'reset'; }
}
