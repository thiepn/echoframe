import { canDamage } from './Faction.js';
import { createDamageResult } from './DamageResult.js';

export class DamageService {
  constructor({ eventBus = null, capacity = 4096, runStateProvider = () => true } = {}) {
    this.eventBus = eventBus;
    this.capacity = Math.max(16, capacity);
    this.runStateProvider = runStateProvider;
    this.keys = new Set();
    this.order = [];
    this.rejected = {};
    this.accepted = 0;
  }
  resolve(packet, target, context = {}) {
    const reject = (reason) => {
      this.rejected[reason] = (this.rejected[reason] ?? 0) + 1;
      const result = createDamageResult({ accepted: false, rejectedReason: reason, remainingHealth: target?.health?.currentHealth ?? 0, critical: packet.critical, damageId: packet.damageId, amountBeforeMitigation: packet.finalAmount });
      this.eventBus?.emit('combat:damage:resolved', result);
      return result;
    };
    this.eventBus?.emit('combat:damage:requested', packet);
    if (!target?.health || !packet.targetId) return reject('invalid-target');
    if (target.active === false) return reject('target-inactive');
    if (target.health.defeated) return reject('target-defeated');
    if (!canDamage(packet.sourceFaction, target.faction)) return reject('friendly-fire');
    if (!this.runStateProvider()) return reject('run-state-blocked');
    const key = `${packet.damageId}:${packet.targetId}`;
    if (this.keys.has(key)) return reject('duplicate-damage');
    if (!packet.bypassInvulnerability && (context.dashInvulnerable || context.hitInvulnerable)) return reject('invulnerable');
    this.#remember(key);
    const amountBeforeMitigation = packet.finalAmount;
    let amount = amountBeforeMitigation * (1 - Math.max(0, Math.min(0.9, Number(context.damageReduction) || 0)));
    const amountAfterMitigation = amount;
    let shieldAbsorbed = 0;
    let modifierDiagnostics = null;
    if (typeof context.absorbDamage === 'function' && amount > 0) {
      const absorption = context.absorbDamage(amount) ?? {};
      shieldAbsorbed = Math.max(0, Math.min(amount, Number(absorption.absorbed) || 0));
      amount = Math.max(0, Number(absorption.remaining ?? (amount - shieldAbsorbed)) || 0);
      modifierDiagnostics = absorption.diagnostics ?? null;
    }
    if (context.preventLethal && amount >= target.health.currentHealth && target.health.currentHealth > 1) {
      amount = target.health.currentHealth - 1;
      context.consumePreventLethal?.();
    }
    const applied = target.health.damage(amount);
    this.accepted += 1;
    const result = createDamageResult({
      accepted: true,
      amountBeforeMitigation,
      amountAfterMitigation,
      shieldAbsorbed,
      damageApplied: applied.applied,
      remainingHealth: target.health.currentHealth,
      targetDefeated: applied.defeated,
      critical: packet.critical,
      damageId: packet.damageId,
      modifierDiagnostics,
    });
    this.eventBus?.emit('combat:damage:resolved', result);
    if (packet.critical) this.eventBus?.emit('combat:critical', { damageId: packet.damageId, targetId: packet.targetId });
    return result;
  }
  reset() { this.keys.clear(); this.order.length = 0; this.rejected = {}; this.accepted = 0; }
  diagnostics() { return { accepted: this.accepted, rejected: { ...this.rejected }, dedupeSize: this.keys.size, capacity: this.capacity }; }
  #remember(key) { this.keys.add(key); this.order.push(key); while (this.order.length > this.capacity) this.keys.delete(this.order.shift()); }
}
