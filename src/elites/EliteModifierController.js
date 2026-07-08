import { getEliteModifierDefinition } from '../data/eliteModifierDefinitions.js';
import { OverclockedModifier } from './modifiers/OverclockedModifier.js';
import { ReplicatingModifier } from './modifiers/ReplicatingModifier.js';
import { ResonantModifier } from './modifiers/ResonantModifier.js';
import { createEliteSnapshot } from './EliteSnapshot.js';

export class EliteModifierController {
  constructor({ enemy, eliteMetadata, activationProfile }) {
    this.enemy = enemy;
    this.eliteMetadata = eliteMetadata;
    this.activationProfile = activationProfile;
    this.modifierId = eliteMetadata.modifierId;
    this.eliteInstanceId = eliteMetadata.eliteInstanceId;
    this.definition = getEliteModifierDefinition(this.modifierId);
    this.state = 'ACTIVE';
    if (this.modifierId === 'overclocked') this.modifier = new OverclockedModifier({ definition: this.definition });
    else if (this.modifierId === 'replicating') this.modifier = new ReplicatingModifier({ definition: this.definition });
    else this.modifier = new ResonantModifier({ definition: this.definition, maximumHealth: activationProfile.maximumHealth });
  }
  update(deltaMs) {
    this.modifier.update?.(deltaMs);
    if (this.modifierId === 'replicating' && this.modifier.pendingMs > 0) this.state = 'SPLIT_WARNING';
    else if (this.modifierId === 'resonant' && this.modifier.shieldAmount > 0) this.state = 'SHIELDED';
    else this.state = 'ACTIVE';
  }
  onAcceptedDamage(result) {
    if (this.modifierId !== 'replicating') return false;
    return this.modifier.onAcceptedDamage({ damageApplied: result.damageApplied, remainingHealth: result.remainingHealth, maximumHealth: this.enemy.health.maximumHealth, targetDefeated: result.targetDefeated });
  }
  onAlliedDeath(payload) {
    if (this.modifierId !== 'resonant') return false;
    return this.modifier.onAlliedDeath(payload);
  }
  absorbDamage(amount) {
    if (this.modifierId !== 'resonant') return Object.freeze({ absorbed: 0, remaining: Math.max(0, Number(amount) || 0) });
    return this.modifier.absorb(amount);
  }
  onAttackExecution() { this.modifier.onAttackExecution?.(); }
  cancel(reason) { if (this.modifierId === 'replicating') this.modifier.cancel(reason); this.state = 'CANCELLED'; }
  reset() { this.modifier.reset?.(); this.state = 'INACTIVE'; }
  snapshot() { return createEliteSnapshot(this); }
}
