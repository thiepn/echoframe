import { TEXTURE_KEYS } from '../graphics/TextureFactory.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { EnemyStateMachine, ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';
import { FACTIONS } from '../combat/Faction.js';

export class BaseEnemy {
  constructor(scene, { type, renderer, radius = 22 }) {
    this.scene = scene;
    this.type = type;
    this.faction = FACTIONS.enemy;
    this.renderer = renderer;
    this.bodySprite = scene.physics.add.sprite(-1000, -1000, TEXTURE_KEYS.physicsBody).setVisible(false);
    this.bodySprite.body.setCircle(radius);
    this.bodySprite.body.enable = false;
    this.bodySprite.setData('enemyEntity', this);
    this.state = new EnemyStateMachine();
    this.health = new HealthComponent(1);
    this.active = false;
    this.enemyId = null;
    this.spawnDurationMs = 650;
    this.deathRemainingMs = 0;
    this.moveSpeed = 0;
    this.isElite = false;
    this.isEliteCopy = false;
    this.eliteMetadata = null;
    this.eliteController = null;
    this.copyOfEliteInstanceId = null;
    this.copyDamageScalar = 1;
    this.copySpeedScalar = 1;
    this.activationProfile = null;
    this.copyAssemblyRemainingMs = 0;
    this.descriptorId = null;
  }

  activate(data) {
    this.active = true;
    this.enemyId = data.enemyId;
    this.spawnDurationMs = data.spawnDurationMs;
    this.moveSpeed = data.moveSpeed;
    this.health.reset(data.maximumHealth);
    this.bodySprite.body.enable = true;
    this.bodySprite.setActive(true).setPosition(data.x, data.y);
    this.bodySprite.body.reset(data.x, data.y);
    this.bodySprite.setVelocity(0, 0);
    this.renderer.setPosition(data.x, data.y);
    this.renderer.setVisible(true);
    this.state.reset();
    this.state.transition(ENEMY_STATES.spawning);
    this.deathRemainingMs = 0;
    this.activationProfile = data.activationProfile ?? null;
    this.descriptorId = data.descriptorId ?? null;
    this.isElite = false;
    this.isEliteCopy = false;
    this.eliteMetadata = null;
    this.eliteController = null;
    this.copyOfEliteInstanceId = null;
    this.copyDamageScalar = 1;
    this.copySpeedScalar = 1;
  }

  activateFromSpawn() {
    if (this.state.is(ENEMY_STATES.spawning)) {
      this.state.transition(ENEMY_STATES.active);
      this.renderer.setActive?.();
    }
  }

  setVelocity(x, y) {
    if (this.bodySprite?.body) this.bodySprite.setVelocity(x, y);
  }

  setPosition(x, y) {
    if (this.bodySprite?.body) this.bodySprite.body.reset(x, y);
    else this.bodySprite?.setPosition(x, y);
    this.renderer?.setPosition(x, y);
  }

  directionTo(target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  beginDying(durationMs) {
    if (!this.active || this.state.is(ENEMY_STATES.dying)) return false;
    this.state.transition(ENEMY_STATES.dying);
    if (this.bodySprite?.body) {
      this.bodySprite.body.enable = false;
      this.bodySprite.setVelocity(0, 0);
    }
    this.deathRemainingMs = durationMs;
    return true;
  }

  updateDeath(deltaMs) {
    if (!this.state.is(ENEMY_STATES.dying)) return false;
    this.deathRemainingMs = Math.max(0, this.deathRemainingMs - deltaMs);
    this.renderer.container?.setAlpha(Math.max(0, this.deathRemainingMs / 240));
    return this.deathRemainingMs <= 0;
  }

  deactivate() {
    if (!this.active) return false;
    this.active = false;
    if (this.bodySprite) {
      if (this.bodySprite.body) {
        this.bodySprite.setVelocity(0, 0);
        this.bodySprite.body.enable = false;
      }
      this.bodySprite.setPosition(-1000, -1000).setActive(false);
    }
    this.renderer.setVisible(false);
    this.renderer.container?.setAlpha(1).setScale(1);
    this.enemyId = null;
    this.state.reset();
    this.health.reset(1);
    this.isElite = false;
    this.isEliteCopy = false;
    this.eliteMetadata = null;
    this.eliteController = null;
    this.copyOfEliteInstanceId = null;
    this.copyDamageScalar = 1;
    this.copySpeedScalar = 1;
    this.activationProfile = null;
    this.copyAssemblyRemainingMs = 0;
    this.descriptorId = null;
    return true;
  }

  updateRenderer(deltaMs) {
    this.renderer.setPosition(this.x, this.y);
    const velocity = this.bodySprite?.body?.velocity ?? { x: 0, y: 0 };
    if (Math.hypot(velocity.x, velocity.y) > 0.5) {
      this.renderer.setRotation(Math.atan2(velocity.y, velocity.x));
    }
    if (this.state.is(ENEMY_STATES.spawning)) {
      this.renderer.setSpawning(this.state.elapsedMs / this.spawnDurationMs);
    }
    this.renderer.update(
      deltaMs,
      this.moveSpeed ? Math.hypot(velocity.x, velocity.y) / this.moveSpeed : 0,
    );
  }

  get x() {
    return this.bodySprite?.x ?? -1000;
  }

  get y() {
    return this.bodySprite?.y ?? -1000;
  }

  destroy() {
    this.renderer?.destroy();
    if (this.bodySprite?.scene) this.bodySprite.destroy();
    this.bodySprite = null;
  }
}
