import { ENEMY_SYNERGY_DEFINITIONS, HARD_PAIRING_RULES } from '../data/enemySynergyDefinitions.js';

export class EnemySynergyRules {
  constructor(definitions = ENEMY_SYNERGY_DEFINITIONS) { this.definitions = definitions; }
  evaluate(roleCounts) {
    let weight = 1;
    let danger = 1;
    let requiresRecovery = false;
    const violations = [];
    for (const rule of HARD_PAIRING_RULES) if ((roleCounts[rule.role] ?? 0) > rule.maximum) violations.push(rule.id);
    for (const rule of this.definitions) {
      if (rule.roles.every((role) => (roleCounts[role] ?? 0) > 0)) {
        weight *= rule.weight;
        danger *= rule.danger;
        requiresRecovery ||= Boolean(rule.requiresRecovery);
      }
    }
    return { valid: violations.length === 0, violations, weight, danger, requiresRecovery };
  }
}
