import { BaseEnemy } from './BaseEnemy.js';
import { SuppressorRenderer } from '../graphics/SuppressorRenderer.js';
import { ContactDamageComponent } from '../components/ContactDamageComponent.js';
import { SuppressorBrain } from '../enemy-ai/SuppressorBrain.js';
import { ENEMY_STATES } from '../enemy-ai/EnemyStateMachine.js';

export class Suppressor extends BaseEnemy {
  constructor(scene, settings) { super(scene, { type: 'suppressor', renderer: new SuppressorRenderer(scene, settings), radius: 28 }); this.brain = new SuppressorBrain(this); this.contactDamage = new ContactDamageComponent(); }
  activate(data) { super.activate(data); Object.assign(this, { fieldRadius: data.fieldRadius, echoRecoveryScalar: data.echoRecoveryScalar, fieldSetupMs: data.fieldSetupMs, relocationIntervalMs: data.relocationIntervalMs }); this.contactDamage = new ContactDamageComponent({ damage: data.contactDamage, cooldownMs: data.contactCooldownMs ?? 700 }); this.brain.reset(); }
  beginAnticipation() { if (this.state.is(ENEMY_STATES.active)) this.state.transition(ENEMY_STATES.anticipation); }
  beginField() { if (this.state.is(ENEMY_STATES.anticipation)) this.state.transition(ENEMY_STATES.execution); }
  endField() { if (this.state.is(ENEMY_STATES.execution)) this.state.transition(ENEMY_STATES.recovery); }
  finishRecovery() { if (this.state.is(ENEMY_STATES.recovery)) this.state.transition(ENEMY_STATES.active); }
  get fieldActive() { return this.active && this.state.is(ENEMY_STATES.execution); }
  get canDealContactDamage() { return this.fieldActive && this.contactDamage.ready; }
  get contactDamageAmount() { return this.contactDamage.damage; }
  get contactDamageSourceType() { return 'suppressor-contact'; }
  update(delta, context) { this.contactDamage.update(delta); this.brain.update(delta, context); this.updateRenderer(delta); const duration = this.state.is(ENEMY_STATES.anticipation) ? this.fieldSetupMs : this.relocationIntervalMs; this.renderer.setState(this.state.value, duration ? this.state.elapsedMs / duration : 0); }
  deactivate() { this.contactDamage.reset(); this.brain.reset(); return super.deactivate(); }
}
