import { CORE_ENEMY_DEFINITIONS } from '../data/coreEnemyDefinitions.js';
import { getEliteModifierDefinition } from '../data/eliteModifierDefinitions.js';

export class EliteThreatModel {
  static calculate(enemyType, modifierId) {
    const baseThreat = CORE_ENEMY_DEFINITIONS[enemyType]?.threatCost ?? 0;
    const threatSurcharge = getEliteModifierDefinition(modifierId)?.threatSurcharge ?? 0;
    return Object.freeze({ baseThreat, threatSurcharge, totalThreat: baseThreat + threatSurcharge });
  }
}
