import { BaseEnemy } from './BaseEnemy.js';
import { LancerRenderer } from '../graphics/LancerRenderer.js';
import { ContactDamageComponent } from '../components/ContactDamageComponent.js';
import { LancerBrain } from '../enemy-ai/LancerBrain.js';
import { ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';

export class Lancer extends BaseEnemy {
  constructor(scene, settings) { super(scene, { type: 'lancer', renderer: new LancerRenderer(scene, settings), radius: 23 }); this.brain = new LancerBrain(this); this.contactDamage = new ContactDamageComponent(); }
  activate(data) {
    super.activate(data);
    Object.assign(this, { telegraphMs: data.telegraphMs, lockMs: data.lockMs, chargeSpeed: data.chargeSpeed, maximumCharge: data.maximumCharge, chargeDamage: data.chargeDamage, recoveryMs: data.recoveryMs, collisionRadius: data.collisionRadius ?? 23 });
    this.currentChargeDistance = this.maximumCharge;
    this.contactDamage = new ContactDamageComponent({ damage: data.chargeDamage, cooldownMs: data.contactCooldownMs ?? 1000 });
    this.endpointValidator = data.endpointValidator ?? (() => true);
    this.brain.reset();
  }
  beginAnticipation(direction, maximumDistance = this.maximumCharge) { if (this.state.is(ENEMY_STATES.active)) { this.currentChargeDistance = Math.max(0, Math.min(this.maximumCharge, Number(maximumDistance) || 0)); this.state.transition(ENEMY_STATES.anticipation); this.renderer.setRotation(Math.atan2(direction.y, direction.x)); this.renderer.setLaneLength?.(this.currentChargeDistance); } }
  cancelAnticipation() { if (this.state.is(ENEMY_STATES.anticipation)) { this.state.transition(ENEMY_STATES.active); this.currentChargeDistance = this.maximumCharge; this.renderer.setLaneLength?.(this.maximumCharge); } }
  beginLock() { if (this.state.is(ENEMY_STATES.anticipation)) this.state.transition(ENEMY_STATES.lock); }
  beginExecution() { if (this.state.is(ENEMY_STATES.lock)) this.state.transition(ENEMY_STATES.execution); }
  beginRecovery() { if (this.state.is(ENEMY_STATES.execution)) this.state.transition(ENEMY_STATES.recovery); }
  finishRecovery() { if (this.state.is(ENEMY_STATES.recovery)) this.state.transition(ENEMY_STATES.active); }
  get canDealContactDamage() { return this.state.is(ENEMY_STATES.execution); }
  get contactDamageAmount() { return this.chargeDamage; }
  get contactDamageSourceType() { return 'lancer-charge'; }
  update(delta, context) { this.contactDamage.update(delta); this.brain.update(delta, context); this.updateRenderer(delta); const duration = this.state.is(ENEMY_STATES.anticipation) ? this.telegraphMs : this.state.is(ENEMY_STATES.lock) ? this.lockMs : this.recoveryMs; this.renderer.setState(this.state.value, duration ? this.state.elapsedMs / duration : 0); }
  deactivate() { this.contactDamage.reset(); this.currentChargeDistance = this.maximumCharge; this.brain.reset(); return super.deactivate(); }
}
