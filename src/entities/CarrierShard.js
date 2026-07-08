import { TEXTURE_KEYS } from '../graphics/TextureFactory.js';
import { PALETTE } from '../data/constants.js';
import { ContactDamageComponent } from '../components/ContactDamageComponent.js';

export const CARRIER_SHARD_STATES = Object.freeze({ inactive: 'INACTIVE', traveling: 'TRAVELING', telegraph: 'TELEGRAPH', active: 'ACTIVE' });

export class CarrierShard {
  constructor(scene, settingsManager) {
    this.scene = scene;
    this.settingsManager = settingsManager;
    this.bodySprite = scene.physics.add.sprite(-1000, -1000, TEXTURE_KEYS.physicsBody).setVisible(false);
    this.bodySprite.body.setCircle(18);
    this.bodySprite.body.enable = false;
    this.bodySprite.setData('carrierShardEntity', this);
    this.container = scene.add.container(-1000, -1000).setDepth(40).setVisible(false);
    this.marker = scene.add.circle(0, 0, 54, PALETTE.dangerRed, 0.04).setStrokeStyle(2, PALETTE.warningYellow, 0.75);
    this.triangle = scene.add.triangle(0, 0, 0, -15, 13, 11, -13, 11, PALETTE.dangerRed, 0.85).setStrokeStyle(2, 0xffffff, 0.65);
    this.ring = scene.add.circle(0, 0, 38, 0x000000, 0).setStrokeStyle(3, PALETTE.dangerRed, 0.65);
    this.container.add([this.marker, this.ring, this.triangle]);
    this.active = false;
    this.state = CARRIER_SHARD_STATES.inactive;
    this.activationId = 0;
    this.contactDamage = new ContactDamageComponent();
  }
  activate(data) {
    this.active = true;
    this.activationId = data.activationId;
    this.ownerId = data.ownerId;
    this.sourceEventId = data.sourceEventId;
    this.start = { x: data.x, y: data.y };
    this.target = { x: data.targetX, y: data.targetY };
    this.travelDurationMs = data.travelDurationMs;
    this.activationDelayMs = data.activationDelayMs;
    this.hazardDurationMs = data.hazardDurationMs;
    this.hazardRadius = data.hazardRadius;
    this.elapsedMs = 0;
    this.state = CARRIER_SHARD_STATES.traveling;
    this.contactDamage = new ContactDamageComponent({ damage: data.damage, cooldownMs: data.contactCooldownMs ?? 700 });
    this.bodySprite.body.enable = false;
    this.bodySprite.setActive(true).setPosition(data.x, data.y);
    this.container.setVisible(true).setAlpha(1).setPosition(data.x, data.y);
    this.marker.setRadius(data.hazardRadius);
  }
  update(deltaMs) {
    if (!this.active) return false;
    const delta = Math.max(0, Number(deltaMs) || 0);
    this.elapsedMs += delta;
    this.contactDamage.update(delta);
    if (this.state === CARRIER_SHARD_STATES.traveling) {
      const progress = Math.min(1, this.elapsedMs / this.travelDurationMs);
      const x = this.start.x + (this.target.x - this.start.x) * progress;
      const y = this.start.y + (this.target.y - this.start.y) * progress;
      this.bodySprite.setPosition(x, y);
      this.container.setPosition(x, y).setRotation(progress * Math.PI * 3);
      if (progress >= 1) { this.state = CARRIER_SHARD_STATES.telegraph; this.elapsedMs = 0; this.bodySprite.setPosition(this.target.x, this.target.y); this.container.setPosition(this.target.x, this.target.y).setRotation(0); }
    } else if (this.state === CARRIER_SHARD_STATES.telegraph) {
      const progress = Math.min(1, this.elapsedMs / this.activationDelayMs);
      this.ring.setScale(1.45 - progress * 0.45).setAlpha(0.25 + progress * 0.7);
      this.triangle.setScale(0.8 + progress * 0.2);
      if (this.elapsedMs >= this.activationDelayMs) { this.state = CARRIER_SHARD_STATES.active; this.elapsedMs = 0; this.bodySprite.body.enable = true; this.bodySprite.body.setCircle(this.hazardRadius); }
    } else if (this.state === CARRIER_SHARD_STATES.active) {
      this.marker.setAlpha(0.08 + Math.sin(this.elapsedMs * 0.012) * 0.025);
      this.ring.setAlpha(0.75);
      if (this.elapsedMs >= this.hazardDurationMs) return true;
    }
    return false;
  }
  get canDamage() { return this.active && this.state === CARRIER_SHARD_STATES.active && this.contactDamage.ready; }
  consumeDamage() { return this.contactDamage.consume(); }
  deactivate(reason = 'released') {
    if (!this.active) return false;
    this.active = false;
    this.deactivationReason = reason;
    this.state = CARRIER_SHARD_STATES.inactive;
    if (this.bodySprite?.body) this.bodySprite.body.enable = false;
    if (this.bodySprite) this.bodySprite.setActive?.(false)?.setPosition?.(-1000, -1000);
    if (this.container) this.container.setVisible?.(false)?.setPosition?.(-1000, -1000)?.setAlpha?.(1)?.setScale?.(1);
    this.ownerId = null;
    this.sourceEventId = null;
    this.contactDamage.reset();
    return true;
  }
  destroy() {
    this.active = false;
    if (this.bodySprite?.body) this.bodySprite.body.enable = false;
    this.bodySprite?.destroy?.();
    this.container?.destroy?.(true);
    this.bodySprite = null;
    this.container = null;
  }
  get x() { return this.bodySprite?.x ?? -1000; }
  get y() { return this.bodySprite?.y ?? -1000; }
}
