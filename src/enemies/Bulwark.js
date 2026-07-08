import { BaseEnemy } from './BaseEnemy.js';
import { BulwarkRenderer } from '../graphics/BulwarkRenderer.js';
import { ContactDamageComponent } from '../components/ContactDamageComponent.js';
import { BulwarkBrain } from '../enemy-ai/BulwarkBrain.js';
import { ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';
import { classifyBulwarkHit } from '../enemy-ai/bulwarkDefense.js';

export class Bulwark extends BaseEnemy {
  constructor(scene, settings) { super(scene, { type: 'bulwark', renderer: new BulwarkRenderer(scene, settings), radius: 34 }); this.brain = new BulwarkBrain(this); this.contactDamage = new ContactDamageComponent(); this.rearEvents = []; }
  activate(data) {
    super.activate(data);
    Object.assign(this, { shieldArcRadians: data.shieldArcRadians, sideTransitionRadians: data.sideTransitionRadians, frontalScalar: data.frontalScalar, turnSpeedRadiansPerSecond: data.turnSpeedRadiansPerSecond, rearStaggerThreshold: data.rearStaggerThreshold, rearStaggerWindowMs: data.rearStaggerWindowMs, staggerMs: data.staggerMs });
    this.shieldAngle = 0;
    this.contactDamage = new ContactDamageComponent({ damage: data.contactDamage, cooldownMs: data.contactCooldownMs ?? 700 });
    this.rearEvents = [];
  }
  modifyIncomingDamage(packet) {
    if (this.state.is(ENEMY_STATES.staggered)) return { packet, zone: 'staggered', scalar: 1 };
    const classification = classifyBulwarkHit({ shieldAngle: this.shieldAngle, incomingDirection: packet.direction, shieldArcRadians: this.shieldArcRadians, sideTransitionRadians: this.sideTransitionRadians, frontalScalar: this.frontalScalar });
    const { scalar, zone } = classification;
    const finalAmount = packet.finalAmount * scalar;
    if (zone === 'rear') this.registerRearDamage(finalAmount, packet.timestampMs);
    return { packet: Object.freeze({ ...packet, finalAmount }), zone, scalar };
  }
  registerRearDamage(amount, timestampMs) { this.rearEvents.push({ amount, timestampMs }); this.#trimRearEvents(timestampMs); const total = this.rearEvents.reduce((sum, event) => sum + event.amount, 0); if (total >= this.rearStaggerThreshold && this.state.is(ENEMY_STATES.active)) { this.state.transition(ENEMY_STATES.staggered); this.rearEvents = []; return true; } return false; }
  updateRearPressure(_delta) { const now = this.scene?.run?.elapsedSimulationMs ?? 0; this.#trimRearEvents(now); }
  finishStagger() { if (this.state.is(ENEMY_STATES.staggered)) this.state.transition(ENEMY_STATES.active); }
  get canDealContactDamage() { return this.state.is(ENEMY_STATES.active) && this.contactDamage.ready; }
  get contactDamageAmount() { return this.contactDamage.damage; }
  get contactDamageSourceType() { return 'bulwark-contact'; }
  update(delta, context) { this.contactDamage.update(delta); this.brain.update(delta, context); this.updateRenderer(delta); this.renderer.setState(this.state.value, this.staggerMs ? this.state.elapsedMs / this.staggerMs : 0); }
  deactivate() { this.contactDamage.reset(); this.rearEvents = []; return super.deactivate(); }
  #trimRearEvents(now) { this.rearEvents = this.rearEvents.filter((event) => now - event.timestampMs <= this.rearStaggerWindowMs); }
}
