import { CORE_ENEMY_DEFINITIONS } from '../data/coreEnemyDefinitions.js';
import { ENCOUNTER_BALANCE } from '../data/encounterBalance.js';
import { EnemySynergyRules } from './EnemySynergyRules.js';

export class EncounterCompositionValidator {
  constructor({ balance = ENCOUNTER_BALANCE, synergyRules = new EnemySynergyRules() } = {}) { this.balance = balance; this.synergyRules = synergyRules; }
  validate(enemyTypes, { targetThreat, allowedEnemyTypes, pattern, spawnCapacity = Infinity } = {}) {
    const reasons = [];
    const counts = {};
    const roleCounts = {};
    let threat = 0;
    let projectilePressure = 0;
    let bodyBlockPressure = 0;
    for (const type of enemyTypes) {
      const definition = CORE_ENEMY_DEFINITIONS[type];
      if (!definition || !allowedEnemyTypes.includes(type)) { reasons.push('invalid-enemy-type'); continue; }
      counts[type] = (counts[type] ?? 0) + 1;
      roleCounts[definition.role] = (roleCounts[definition.role] ?? 0) + 1;
      threat += definition.threatCost;
      projectilePressure += this.balance.projectilePressureWeights[type] ?? 0;
      if (['drifter', 'lancer', 'bulwark'].includes(type)) bodyBlockPressure += definition.threatCost;
    }
    if (enemyTypes.length > this.balance.maximumActiveEnemies) reasons.push('enemy-cap');
    for (const [type, count] of Object.entries(counts)) if (count > (this.balance.perTypeCaps[type] ?? Infinity)) reasons.push('enemy-cap');
    for (const [role, count] of Object.entries(roleCounts)) if (count > (this.balance.perRoleCaps[role] ?? Infinity)) reasons.push('role-cap');
    if (projectilePressure > this.balance.maximumProjectilePressure) reasons.push('projectile-saturation');
    if (bodyBlockPressure > this.balance.maximumBodyBlockPressure) reasons.push('body-block-risk');
    if ((roleCounts.CONTROL ?? 0) > this.balance.maximumControlPressure) reasons.push('control-saturation');
    if (enemyTypes.length > spawnCapacity) reasons.push('spawn-capacity');
    const uniqueCount = Object.keys(counts).length;
    if (pattern && uniqueCount < pattern.minimumTypes) reasons.push('insufficient-variety');
    if (pattern && uniqueCount > pattern.maximumTypes) reasons.push('excessive-variety');
    if (pattern && pattern.requiredRoles.some((role) => !(roleCounts[role] > 0))) reasons.push('missing-required-role');
    const synergy = this.synergyRules.evaluate(roleCounts);
    reasons.push(...synergy.violations.map(() => 'unsafe-pairing'));
    const minimum = targetThreat * (1 - this.balance.threatToleranceBelow);
    const maximum = targetThreat * (1 + this.balance.threatToleranceAbove);
    if (targetThreat > 0 && threat < minimum) reasons.push('threat-too-low');
    if (targetThreat > 0 && threat > maximum) reasons.push('threat-too-high');
    return { valid: reasons.length === 0, reasons: [...new Set(reasons)], threat, counts, roleCounts, projectilePressure, bodyBlockPressure, synergy };
  }
}
