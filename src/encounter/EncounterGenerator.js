import { CORE_ENEMY_DEFINITIONS } from '../data/coreEnemyDefinitions.js';
import { ENCOUNTER_BALANCE, ENCOUNTER_PHASES } from '../data/encounterBalance.js';
import { SPAWN_POINT_DEFINITIONS } from '../data/spawnPointDefinitions.js';
import { PROTOTYPE_ARENA } from '../data/prototypeArena.js';
import { SeededRandom, deriveSeed } from '../utils/SeededRandom.js';
import { weightedSelection } from '../utils/weightedSelection.js';
import { deterministicShuffle } from '../utils/deterministicShuffle.js';
import { EncounterCompositionValidator } from './EncounterCompositionValidator.js';
import { createEncounterDescriptor } from './EncounterDescriptor.js';
import { EncounterPatternCatalog } from './EncounterPatternCatalog.js';
import { createEncounterRandomStreams } from './EncounterRandomStreams.js';
import { SpawnPlanner } from './SpawnPlanner.js';
import { SpawnSafetyValidator } from './SpawnSafetyValidator.js';
import { ThreatBudgetModel } from './ThreatBudgetModel.js';

function countBy(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

function dominantRole(types) {
  const roles = countBy(types.map((type) => CORE_ENEMY_DEFINITIONS[type].role));
  return Object.entries(roles).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

function compositionSignature(types) {
  const counts = countBy(types);
  return Object.keys(counts).sort().map((type) => `${type}:${counts[type]}`).join('|');
}

function randomInteger(random, [minimum, maximum]) {
  return random.integer(Math.round(minimum), Math.round(maximum));
}

export class EncounterGenerator {
  constructor({
    balance = ENCOUNTER_BALANCE,
    wallDefinitions = PROTOTYPE_ARENA.walls,
    spawnPoints = SPAWN_POINT_DEFINITIONS,
  } = {}) {
    this.balance = balance;
    this.catalog = new EncounterPatternCatalog();
    this.validator = new EncounterCompositionValidator({ balance });
    this.spawnPlanner = new SpawnPlanner({
      points: spawnPoints,
      validator: new SpawnSafetyValidator({ wallDefinitions, worldBounds: PROTOTYPE_ARENA.bounds }),
    });
  }

  #configureArena(arenaDescriptor) {
    if (!arenaDescriptor) return;
    const points = (arenaDescriptor.enemySockets ?? []).map((point) => ({
      ...point,
      allowedEnemyTypes: point.allowedEnemyTypes ?? Object.keys(CORE_ENEMY_DEFINITIONS),
      allowedRoles: point.allowedRoles ?? point.roleTags ?? [],
      clearanceRadius: point.radius ?? 48,
    }));
    if (!points.length) return;
    this.spawnPlanner = new SpawnPlanner({
      points,
      validator: new SpawnSafetyValidator({
        wallDefinitions: arenaDescriptor.solidGeometry ?? [],
        worldBounds: arenaDescriptor.cameraBounds ?? PROTOTYPE_ARENA.bounds,
      }),
    });
  }

  generate(input) {
    this.#configureArena(input.arenaDescriptor);
    const seed = Number(input.seed) >>> 0;
    const patterns = this.catalog.forPhase(input.phase).filter((pattern) => pattern.id !== 'RECOVERY');
    if (input.phase === ENCOUNTER_PHASES.recovery) return this.#recoveryDescriptor(input, seed);

    const allowed = [...input.allowedEnemyTypes];
    const diagnostics = { generationAttempts: 0, rejectionReasons: {}, fallbackUsed: false };
    const previousPattern = input.encounterHistory?.previousPattern?.() ?? null;
    const orderedPatterns = patterns.filter((pattern) => pattern.id !== previousPattern || patterns.length === 1);
    const mandatory = [...(input.mandatoryEnemyTypes ?? [])];

    for (let attempt = 1; attempt <= this.balance.maximumAttempts; attempt += 1) {
      diagnostics.generationAttempts = attempt;
      const streams = createEncounterRandomStreams({
        seed,
        chamberIndex: input.chamberIndex,
        sequenceIndex: input.sequenceIndex,
        phase: input.phase,
        attempt,
      });
      const pattern = orderedPatterns[streams.composition.integer(0, Math.max(0, orderedPatterns.length - 1))] ?? patterns[0];
      const types = this.#buildComposition({
        random: streams.composition,
        allowed,
        targetThreat: input.threatTarget,
        pattern,
        mandatory,
        attempt,
      });
      const validation = this.validator.validate(types, {
        targetThreat: input.threatTarget,
        allowedEnemyTypes: allowed,
        pattern,
        spawnCapacity: Math.max(24, this.spawnPlanner.points.length * 4),
      });
      const signature = compositionSignature(types);
      if (input.encounterHistory?.exactRepeat?.(signature)) validation.reasons.push('exact-repeat');
      if (!validation.valid || validation.reasons.includes('exact-repeat')) {
        this.#recordRejections(diagnostics, validation.reasons);
        continue;
      }

      const orderedTypes = deterministicShuffle(types, streams.spawnOrder);
      const entries = orderedTypes.map((enemyType, index) => ({
        enemyType,
        requiredRole: CORE_ENEMY_DEFINITIONS[enemyType].role,
        clearanceRadius: CORE_ENEMY_DEFINITIONS[enemyType].collisionRadius + 12,
        groupIndex: Math.floor(index / pattern.simultaneousSpawnLimit),
        activationOrder: index,
      }));
      this.spawnPlanner.reset();
      const plan = this.spawnPlanner.plan(entries, {
        random: streams.spawnSelection,
        playerPosition: input.playerPosition ?? { x: 800, y: input.chamberIndex === 2 ? 720 : 450 },
        echoPositions: input.echoPositions ?? [],
        safetyRadius: input.spawnSafetyRadius ?? 260,
      });
      if (!plan.valid) {
        this.#recordRejections(diagnostics, Object.entries(plan.rejections).flatMap(([reason, count]) => Array(count).fill(reason)));
        continue;
      }
      return this.#descriptor(input, seed, pattern, plan.planned, validation, diagnostics, streams);
    }

    diagnostics.fallbackUsed = true;
    return this.#fallback(input, seed, diagnostics);
  }

  generateChamber({
    seed,
    difficultyId,
    chamberIndex,
    playerPosition,
    echoPositions,
    spawnSafetyRadius,
    spawnIntervalScalar = 1,
    encounterHistory = null,
  } = {}) {
    const profile = this.balance.chamberProfiles[chamberIndex];
    if (!profile) return [];
    const descriptors = [];
    const newOrderRandom = new SeededRandom(deriveSeed(seed, `new-enemy-order-${chamberIndex}`));
    const newOrder = deterministicShuffle(['shard-carrier', 'bulwark', 'suppressor'], newOrderRandom);
    for (let index = 0; index < profile.phases.length; index += 1) {
      const phase = profile.phases[index];
      let mandatoryEnemyTypes = [];
      let allowedEnemyTypes = profile.allowedEnemyTypes;
      if (chamberIndex === 1 && index === 1) mandatoryEnemyTypes = ['lancer'];
      if (chamberIndex === 1 && index === 4) mandatoryEnemyTypes = ['lancer', newOrderRandom.next() < 0.5 ? 'drifter' : 'sentry'];
      if (chamberIndex === 2 && index < 3) {
        mandatoryEnemyTypes = [newOrder[index]];
        // Introduce each Phase 5 enemy in isolation from the other unseen types.
        // Legacy enemies may support the encounter, but the other two new types
        // remain ineligible until their own authored introduction descriptor.
        allowedEnemyTypes = ['drifter', 'sentry', 'lancer', newOrder[index]];
      }
      if (chamberIndex === 2 && index === 4) mandatoryEnemyTypes = [...profile.allowedEnemyTypes];
      const descriptor = this.generate({
        seed,
        difficultyId,
        chamberIndex,
        sequenceIndex: index,
        phase,
        threatTarget: profile.targetThreats[index],
        allowedEnemyTypes,
        encounterHistory,
        mandatoryEnemyTypes,
        playerPosition,
        echoPositions,
        spawnSafetyRadius,
        spawnIntervalScalar,
      });
      descriptors.push(descriptor);
      encounterHistory?.add?.(descriptor);
    }
    return descriptors;
  }


  generateSegment({
    segment,
    difficultyId,
    playerPosition,
    echoPositions,
    spawnSafetyRadius,
    spawnIntervalScalar = 1,
    encounterHistory = null,
  } = {}) {
    if (!segment) return [];
    const phases = [ENCOUNTER_PHASES.intro, ENCOUNTER_PHASES.build, ENCOUNTER_PHASES.pressure, ENCOUNTER_PHASES.recovery, ENCOUNTER_PHASES.climax];
    const minimum = Number(segment.threatRange?.[0]) || 1;
    const maximum = Number(segment.threatRange?.[1]) || minimum;
    const midpoint = Math.round((minimum + maximum) / 2);
    const targets = [minimum, midpoint, maximum, 0, maximum];
    const descriptors = [];
    for (let index = 0; index < phases.length; index += 1) {
      const phase = phases[index];
      let allowedEnemyTypes = [...segment.allowedEnemyTypes];
      let mandatoryEnemyTypes = [];
      if (segment.segmentId === 'combat-2' && index === 0) mandatoryEnemyTypes = ['lancer'];
      if (segment.segmentId === 'combat-3' && index === 0) {
        mandatoryEnemyTypes = ['shard-carrier'];
        allowedEnemyTypes = ['drifter', 'sentry', 'lancer', 'shard-carrier'];
      }
      if (segment.segmentId === 'combat-3' && index === 1) {
        mandatoryEnemyTypes = ['bulwark'];
        allowedEnemyTypes = ['drifter', 'sentry', 'lancer', 'bulwark'];
      }
      if (segment.segmentId === 'combat-4' && index === 0) {
        mandatoryEnemyTypes = ['suppressor'];
        allowedEnemyTypes = ['drifter', 'sentry', 'lancer', 'suppressor'];
      }
      if (segment.requiresElite && phase === ENCOUNTER_PHASES.climax) mandatoryEnemyTypes = [segment.elitePlan.hostEnemyType];
      const descriptor = this.generate({
        seed: segment.encounterSeed,
        difficultyId,
        chamberIndex: segment.chamberIndex,
        segmentId: segment.segmentId,
        segmentType: segment.segmentType,
        activeThreatCap: segment.activeThreatCap,
        sequenceIndex: index,
        phase,
        threatTarget: targets[index],
        allowedEnemyTypes,
        encounterHistory,
        mandatoryEnemyTypes,
        playerPosition,
        echoPositions,
        spawnSafetyRadius,
        spawnIntervalScalar,
        arenaDescriptor: segment.arenaDescriptor ?? null,
        requiredArenaTags: segment.requiredArenaTags ?? [],
        forbiddenArenaTags: segment.arenaDescriptor?.forbiddenEncounterTags ?? [],
      });
      const withElite = segment.requiresElite && phase === ENCOUNTER_PHASES.climax
        ? this.#injectElite(descriptor, segment.elitePlan)
        : descriptor;
      const resolved = this.#applySegmentSpawnConstraints(withElite, segment);
      descriptors.push(resolved);
      encounterHistory?.add?.(resolved);
    }
    return descriptors;
  }


  #applySegmentSpawnConstraints(descriptor, segment) {
    if (!descriptor.enemyEntries.length) return descriptor;
    const majorTypes = new Set(['lancer', 'suppressor']);
    const entries = [];
    let groupIndex = 0;
    let groupThreat = 0;
    let groupMajorExecutions = 0;
    let groupSize = 0;
    for (const source of descriptor.enemyEntries) {
      const threat = CORE_ENEMY_DEFINITIONS[source.enemyType]?.threatCost ?? 0;
      const major = majorTypes.has(source.enemyType) ? 1 : 0;
      const exceedsThreat = segment.activeThreatCap > 0 && groupSize > 0 && groupThreat + threat > segment.activeThreatCap;
      const exceedsMajor = groupSize > 0 && groupMajorExecutions + major > this.balance.maximumMajorTelegraphs;
      const exceedsSize = groupSize >= 3;
      if (exceedsThreat || exceedsMajor || exceedsSize) {
        groupIndex += 1;
        groupThreat = 0;
        groupMajorExecutions = 0;
        groupSize = 0;
      }
      const withinGroup = groupSize;
      entries.push({
        ...source,
        groupIndex,
        activationOrder: entries.length,
        spawnDelayMs: groupIndex * descriptor.spawnIntervalMs + withinGroup * 70,
      });
      groupThreat += threat;
      groupMajorExecutions += major;
      groupSize += 1;
    }
    const spawnGroups = [...new Set(entries.map((entry) => entry.groupIndex))].map((index) => ({
      groupIndex: index,
      entries: entries.filter((entry) => entry.groupIndex === index).map((entry) => entry.activationOrder),
      delayMs: index * descriptor.spawnIntervalMs,
    }));
    return createEncounterDescriptor({
      ...descriptor,
      enemyEntries: entries,
      spawnGroups,
      generationDiagnostics: {
        ...descriptor.generationDiagnostics,
        phase6SpawnConstraintPass: true,
        maximumMajorExecutionsPerGroup: this.balance.maximumMajorTelegraphs,
        activeThreatCap: segment.activeThreatCap,
      },
    });
  }

  #buildComposition({ random, allowed, targetThreat, pattern, mandatory, attempt }) {
    const types = [];
    const budget = new ThreatBudgetModel({
      targetThreat,
      toleranceBelow: this.balance.threatToleranceBelow,
      toleranceAbove: this.balance.threatToleranceAbove,
    });
    for (const type of mandatory) {
      const definition = CORE_ENEMY_DEFINITIONS[type];
      if (!definition || !budget.consume(definition.threatCost)) return [...mandatory];
      types.push(type);
    }

    const candidates = allowed.filter((type) => pattern.allowedRoles.includes(CORE_ENEMY_DEFINITIONS[type].role));
    let guard = 0;
    while (budget.spentThreat < budget.minimumThreat && guard < 50) {
      guard += 1;
      const entries = candidates.map((type) => {
        const definition = CORE_ENEMY_DEFINITIONS[type];
        const count = types.filter((value) => value === type).length;
        const cap = this.balance.perTypeCaps[type] ?? 1;
        const requiredBoost = pattern.requiredRoles.includes(definition.role) &&
          !types.some((value) => CORE_ENEMY_DEFINITIONS[value].role === definition.role) ? 5 : 1;
        const uniqueTypes = new Set(types);
        const preservesPatternVariety = uniqueTypes.has(type) || uniqueTypes.size < pattern.maximumTypes;
        const fits = budget.canConsume(definition.threatCost) && count < cap && preservesPatternVariety;
        return {
          value: type,
          weight: fits ? requiredBoost * (1 + ((attempt + definition.threatCost) % 3) * 0.15) / definition.threatCost : 0,
        };
      });
      const selected = weightedSelection(entries, random);
      if (!selected || !budget.consume(CORE_ENEMY_DEFINITIONS[selected].threatCost)) break;
      types.push(selected);
    }
    return types;
  }

  #descriptor(input, seed, pattern, planned, validation, diagnostics, streams) {
    const spawnIntervalMs = Math.round(
      (input.phase === ENCOUNTER_PHASES.climax ? 360 : input.phase === ENCOUNTER_PHASES.intro ? 700 : 500) *
      (input.spawnIntervalScalar ?? 1),
    );
    const groups = [...new Set(planned.map((entry) => entry.groupIndex))].map((groupIndex) => ({
      groupIndex,
      entries: planned.filter((entry) => entry.groupIndex === groupIndex).map((entry) => entry.activationOrder),
      delayMs: groupIndex * spawnIntervalMs,
    }));
    const dominant = dominantRole(planned.map((entry) => entry.enemyType));
    const range = pattern.requiresRecovery || input.phase === ENCOUNTER_PHASES.pressure
      ? this.balance.recoveryRanges.afterPressure
      : this.balance.recoveryRanges.betweenWaves;
    const recoveryAfterMs = randomInteger(streams.recoveryVariation, range);
    return createEncounterDescriptor({
      encounterId: `c${input.chamberIndex}-e${input.sequenceIndex}-${seed.toString(16)}`,
      seed,
      chamberIndex: input.chamberIndex,
      segmentId: input.segmentId ?? null,
      segmentType: input.segmentType ?? null,
      activeThreatCap: input.activeThreatCap ?? 0,
      arenaInstanceId: input.arenaDescriptor?.arenaInstanceId ?? null,
      requiredArenaTags: input.requiredArenaTags ?? [],
      forbiddenArenaTags: input.forbiddenArenaTags ?? [],
      selectedSocketIds: planned.map((entry) => entry.spawnPointId),
      sequenceIndex: input.sequenceIndex,
      phase: input.phase,
      pattern: pattern.id,
      targetThreat: input.threatTarget,
      actualThreat: validation.threat,
      enemyEntries: planned.map((entry, index) => ({
        ...entry,
        spawnDelayMs: index * spawnIntervalMs,
        difficultyProfile: input.difficultyId ?? 'standard',
      })),
      spawnGroups: groups,
      spawnIntervalMs,
      minimumDurationMs: input.phase === ENCOUNTER_PHASES.intro ? 900 : 500,
      recoveryAfterMs,
      tags: [input.phase.toLowerCase(), dominant?.toLowerCase()].filter(Boolean),
      generationDiagnostics: {
        ...diagnostics,
        dominantRole: dominant,
        compositionSignature: compositionSignature(planned.map((entry) => entry.enemyType)),
        spawnPlanSignature: planned.map((entry) => entry.spawnPointId).join('>'),
        spawnTopology: 'authored-sockets',
        synergyDanger: validation.synergy.danger,
        randomStreamSeeds: streams.seeds,
      },
    });
  }

  #recoveryDescriptor(input, seed) {
    const streams = createEncounterRandomStreams({
      seed,
      chamberIndex: input.chamberIndex,
      segmentId: input.segmentId ?? null,
      segmentType: input.segmentType ?? null,
      activeThreatCap: input.activeThreatCap ?? 0,
      sequenceIndex: input.sequenceIndex,
      phase: input.phase,
      attempt: 0,
    });
    const recoveryAfterMs = randomInteger(streams.recoveryVariation, this.balance.recoveryRanges.afterPressure);
    return createEncounterDescriptor({
      encounterId: `c${input.chamberIndex}-recovery-${seed.toString(16)}`,
      seed,
      chamberIndex: input.chamberIndex,
      segmentId: input.segmentId ?? null,
      segmentType: input.segmentType ?? null,
      activeThreatCap: input.activeThreatCap ?? 0,
      arenaInstanceId: input.arenaDescriptor?.arenaInstanceId ?? null,
      requiredArenaTags: input.requiredArenaTags ?? [],
      forbiddenArenaTags: input.forbiddenArenaTags ?? [],
      selectedSocketIds: [],
      sequenceIndex: input.sequenceIndex,
      phase: ENCOUNTER_PHASES.recovery,
      pattern: 'RECOVERY',
      targetThreat: 0,
      actualThreat: 0,
      enemyEntries: [],
      spawnGroups: [],
      spawnIntervalMs: 0,
      minimumDurationMs: 0,
      completionRule: 'timer',
      recoveryAfterMs,
      tags: ['recovery'],
      generationDiagnostics: {
        generationAttempts: 1,
        rejectionReasons: {},
        fallbackUsed: false,
        dominantRole: null,
        compositionSignature: '',
        spawnPlanSignature: '',
        randomStreamSeeds: streams.seeds,
      },
    });
  }

  #fallback(input, seed, diagnostics) {
    const fallbackTypes = input.mandatoryEnemyTypes?.length
      ? [...input.mandatoryEnemyTypes]
      : [input.allowedEnemyTypes[0]];
    while (
      fallbackTypes.length < this.spawnPlanner.points.length &&
      fallbackTypes.reduce((sum, type) => sum + CORE_ENEMY_DEFINITIONS[type].threatCost, 0) < input.threatTarget * 0.75
    ) fallbackTypes.push(input.allowedEnemyTypes[0]);

    const streams = createEncounterRandomStreams({
      seed,
      chamberIndex: input.chamberIndex,
      segmentId: input.segmentId ?? null,
      segmentType: input.segmentType ?? null,
      activeThreatCap: input.activeThreatCap ?? 0,
      sequenceIndex: input.sequenceIndex,
      phase: input.phase,
      attempt: this.balance.maximumAttempts + 1,
    });
    const entries = fallbackTypes.map((enemyType, index) => ({
      enemyType,
      requiredRole: CORE_ENEMY_DEFINITIONS[enemyType].role,
      clearanceRadius: CORE_ENEMY_DEFINITIONS[enemyType].collisionRadius + 12,
      groupIndex: Math.floor(index / 2),
      activationOrder: index,
    }));
    this.spawnPlanner.reset();
    const plan = this.spawnPlanner.plan(entries, {
      random: streams.spawnSelection,
      playerPosition: input.playerPosition ?? { x: 800, y: 450 },
      safetyRadius: input.spawnSafetyRadius ?? 260,
    });
    const planned = plan.valid ? plan.planned : entries.map((entry, index) => {
      const point = this.spawnPlanner.points[index % this.spawnPlanner.points.length];
      return { ...entry, spawnPointId: point.id, x: point.x, y: point.y };
    });
    const validation = this.validator.validate(fallbackTypes, {
      targetThreat: 0,
      allowedEnemyTypes: input.allowedEnemyTypes,
      pattern: { minimumTypes: 1, maximumTypes: 6, requiredRoles: [] },
      spawnCapacity: Math.max(24, this.spawnPlanner.points.length * 4),
    });
    return this.#descriptor(
      input,
      seed,
      { id: 'SAFE_FALLBACK', simultaneousSpawnLimit: 2, requiresRecovery: true },
      planned,
      validation,
      diagnostics,
      streams,
    );
  }


  #injectElite(descriptor, elitePlan) {
    const hostIndex = descriptor.enemyEntries.findIndex((entry) => entry.enemyType === elitePlan.hostEnemyType);
    const resolvedIndex = hostIndex >= 0 ? hostIndex : 0;
    const enemyEntries = descriptor.enemyEntries.map((entry, index) => index === resolvedIndex
      ? { ...entry, elite: { ...elitePlan, tags: [...(elitePlan.tags ?? [])] } }
      : { ...entry });
    return createEncounterDescriptor({
      ...descriptor,
      targetThreat: descriptor.targetThreat + elitePlan.threatSurcharge,
      actualThreat: descriptor.actualThreat + elitePlan.threatSurcharge,
      enemyEntries,
      tags: [...descriptor.tags, 'elite', elitePlan.modifierId],
      generationDiagnostics: {
        ...descriptor.generationDiagnostics,
        eliteModifierId: elitePlan.modifierId,
        eliteHostEnemyType: elitePlan.hostEnemyType,
        eliteThreatSurcharge: elitePlan.threatSurcharge,
      },
    });
  }

  #recordRejections(diagnostics, reasons) {
    for (const reason of reasons) diagnostics.rejectionReasons[reason] = (diagnostics.rejectionReasons[reason] ?? 0) + 1;
  }
}
