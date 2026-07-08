import { isEliteEligible } from './EliteEligibility.js';
import { ELITE_ENCOUNTER_RULES } from '../data/eliteEncounterRules.js';
import { ENCOUNTER_BALANCE } from '../data/encounterBalance.js';
import { CORE_ENEMY_DEFINITIONS } from '../data/coreEnemyDefinitions.js';
import { SPAWN_POINT_DEFINITIONS } from '../data/spawnPointDefinitions.js';

const MAJOR_TYPES = new Set(['lancer', 'suppressor']);
const BODY_BLOCK_TYPES = new Set(['drifter', 'lancer', 'bulwark']);

export class EliteEncounterValidator {
  validate({ segment, elitePlan, supportEnemyTypes = [], poolCapacityAvailable = Infinity, copyPlacementAvailable = true, descriptor = null } = {}) {
    const reasons = [];
    const entries = descriptor?.enemyEntries ?? [];
    const primaryEntries = entries.filter((entry) => entry.elite);
    const resolvedPlan = elitePlan ?? primaryEntries[0]?.elite ?? null;

    if (!segment?.requiresElite && resolvedPlan) reasons.push('elite-in-normal-segment');
    if (segment?.requiresElite && !resolvedPlan) reasons.push('elite-missing-primary');
    if (segment?.requiresElite && descriptor && primaryEntries.length !== 1) reasons.push(primaryEntries.length > 1 ? 'elite-duplicate-primary' : 'elite-missing-primary');
    if (resolvedPlan && !isEliteEligible({ enemyType: resolvedPlan.hostEnemyType, modifierId: resolvedPlan.modifierId })) reasons.push('elite-ineligible-host');
    if (resolvedPlan && !segment?.allowedEnemyTypes?.includes(resolvedPlan.hostEnemyType)) reasons.push('elite-ineligible-host');

    const supports = descriptor
      ? entries.filter((entry) => !entry.elite).map((entry) => entry.enemyType)
      : supportEnemyTypes;
    if (resolvedPlan?.modifierId === 'replicating' && poolCapacityAvailable < ELITE_ENCOUNTER_RULES.reserveReplicatingEnemySlots) reasons.push('elite-copy-slot-unavailable');
    if (resolvedPlan?.modifierId === 'replicating' && !copyPlacementAvailable) reasons.push('elite-copy-placement-unavailable');
    if (resolvedPlan?.modifierId === 'resonant' && supports.length < ELITE_ENCOUNTER_RULES.requiredResonantSupportCount) reasons.push('elite-resonant-no-support');

    if (descriptor) this.#validateDescriptor(descriptor, resolvedPlan, reasons, poolCapacityAvailable);
    return Object.freeze({ valid: reasons.length === 0, reasons: Object.freeze([...new Set(reasons)]) });
  }

  #validateDescriptor(descriptor, elitePlan, reasons, poolCapacityAvailable) {
    const entries = descriptor.enemyEntries ?? [];
    let baseThreat = 0;
    let projectilePressure = 0;
    let bodyBlockPressure = 0;
    const roleCounts = {};
    const typeCounts = {};
    for (const entry of entries) {
      const definition = CORE_ENEMY_DEFINITIONS[entry.enemyType];
      if (!definition) { reasons.push('elite-invalid-enemy-type'); continue; }
      baseThreat += definition.threatCost;
      projectilePressure += ENCOUNTER_BALANCE.projectilePressureWeights[entry.enemyType] ?? 0;
      if (BODY_BLOCK_TYPES.has(entry.enemyType)) bodyBlockPressure += definition.threatCost;
      roleCounts[definition.role] = (roleCounts[definition.role] ?? 0) + 1;
      typeCounts[entry.enemyType] = (typeCounts[entry.enemyType] ?? 0) + 1;
      if (!SPAWN_POINT_DEFINITIONS.some((point) => point.id === entry.spawnPointId)) reasons.push('elite-socket-invalid');
    }
    for (const [role, count] of Object.entries(roleCounts)) if (count > (ENCOUNTER_BALANCE.perRoleCaps[role] ?? Infinity)) reasons.push('elite-role-cap');
    for (const [type, count] of Object.entries(typeCounts)) if (count > (ENCOUNTER_BALANCE.perTypeCaps[type] ?? Infinity)) reasons.push('elite-type-cap');
    if (projectilePressure > ENCOUNTER_BALANCE.maximumProjectilePressure) reasons.push('elite-projectile-saturation');
    if (bodyBlockPressure > ENCOUNTER_BALANCE.maximumBodyBlockPressure) reasons.push('elite-body-block-saturation');
    if ((roleCounts.CONTROL ?? 0) > ENCOUNTER_BALANCE.maximumControlPressure) reasons.push('elite-control-saturation');
    if ((roleCounts.SPAWNER ?? 0) > ENCOUNTER_BALANCE.perRoleCaps.SPAWNER) reasons.push('elite-spawner-saturation');

    const expectedThreat = baseThreat + (elitePlan?.threatSurcharge ?? 0);
    if (Math.abs(expectedThreat - descriptor.actualThreat) > 0.001) reasons.push('elite-threat-mismatch');
    if (elitePlan?.modifierId === 'replicating' && entries.length + 1 > poolCapacityAvailable) reasons.push('elite-copy-slot-unavailable');

    const grouped = new Map();
    for (const entry of entries) {
      const group = grouped.get(entry.groupIndex) ?? [];
      group.push(entry);
      grouped.set(entry.groupIndex, group);
    }
    for (const group of grouped.values()) {
      const groupThreat = group.reduce((sum, entry) => sum + (CORE_ENEMY_DEFINITIONS[entry.enemyType]?.threatCost ?? 0), 0);
      if (descriptor.activeThreatCap > 0 && groupThreat > descriptor.activeThreatCap) reasons.push('elite-active-cap');
      if (group.filter((entry) => MAJOR_TYPES.has(entry.enemyType)).length > ELITE_ENCOUNTER_RULES.maximumMajorExecutionsPerWindow) reasons.push('elite-telegraph-conflict');
    }
  }
}
