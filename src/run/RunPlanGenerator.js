import { PHASE6_RUN_SEGMENTS } from '../data/phase6RunSegments.js';
import { PHASE7_RUN_SEGMENTS } from '../data/phase7RunSegments.js';
import { PHASE8_RUN_SEGMENTS } from '../data/phase8RunSegments.js';
import { deriveSeed } from '../utils/SeededRandom.js';
import { EliteSelectionPlanner } from '../elites/EliteSelectionPlanner.js';
import { ArenaGenerator } from '../arena/ArenaGenerator.js';
import { ArenaHistory } from '../arena/ArenaHistory.js';
import { RUN_SEGMENT_TYPES } from './RunSegmentType.js';
import { createRunPlan } from './RunPlan.js';
import { createRunSegmentDefinition } from './RunSegmentDefinition.js';

export const RUN_PLAN_GENERATIONS = Object.freeze({
  phase6: 1,
  phase7: 2,
  phase8: 3,
});

function randomStreamSeeds(segmentSeed) {
  return Object.freeze({
    runPlan: segmentSeed,
    encounterComposition: deriveSeed(segmentSeed, 'encounter-composition'),
    eliteModifierSelection: deriveSeed(segmentSeed, 'elite-modifier-selection'),
    eliteHostSelection: deriveSeed(segmentSeed, 'elite-host-selection'),
    eliteSupportComposition: deriveSeed(segmentSeed, 'elite-support-composition'),
    eliteSpawnSelection: deriveSeed(segmentSeed, 'elite-spawn-selection'),
    eliteSpawnOrder: deriveSeed(segmentSeed, 'elite-spawn-order'),
    eliteCosmeticVariation: deriveSeed(segmentSeed, 'elite-cosmetic-variation'),
  });
}

export class RunPlanGenerator {
  constructor({
    generationVersion = RUN_PLAN_GENERATIONS.phase6,
    elitePlanner = new EliteSelectionPlanner(),
    arenaGenerator = new ArenaGenerator(),
  } = {}) {
    this.generationVersion = generationVersion;
    this.elitePlanner = elitePlanner;
    this.arenaGenerator = arenaGenerator;
  }

  generate({ seed, difficultyId = 'standard' } = {}) {
    if (this.generationVersion >= RUN_PLAN_GENERATIONS.phase8) return this.#generatePhase8({ seed, difficultyId });
    return this.generationVersion >= RUN_PLAN_GENERATIONS.phase7
      ? this.#generatePhase7({ seed, difficultyId })
      : this.#generatePhase6({ seed, difficultyId });
  }

  #generatePhase6({ seed, difficultyId }) {
    const normalizedSeed = Number(seed) >>> 0;
    const elitePlans = [];
    const segments = PHASE6_RUN_SEGMENTS.map((source) => {
      const segmentSeed = deriveSeed(normalizedSeed, `phase6-segment-${source.segmentId}`);
      const base = {
        ...source,
        encounterSeed: deriveSeed(segmentSeed, 'encounters'),
        eliteSeed: deriveSeed(segmentSeed, 'elite'),
        randomStreamSeeds: randomStreamSeeds(segmentSeed),
        completionRule: 'all-hostiles-resolved',
      };
      if (source.requiresElite) {
        base.elitePlan = this.elitePlanner.select({ seed: base.eliteSeed, segment: source, previousElitePlans: elitePlans });
        elitePlans.push(base.elitePlan);
      } else base.elitePlan = null;
      return createRunSegmentDefinition(base);
    });
    return createRunPlan({
      seed: normalizedSeed,
      difficultyId,
      generationVersion: RUN_PLAN_GENERATIONS.phase6,
      segments,
      upgradeOfferCount: 5,
      expectedEliteCount: 2,
      recoveryChamberIncluded: false,
      bossHandoffAvailable: false,
      bossImplemented: false,
    });
  }

  #generatePhase8({ seed, difficultyId }) {
    const normalizedSeed = Number(seed) >>> 0;
    const elitePlans = [];
    const arenaHistory = new ArenaHistory();
    const arenaSequence = [];
    const segments = PHASE8_RUN_SEGMENTS.map((source) => {
      const segmentSeed = deriveSeed(normalizedSeed, `phase8-segment-${source.segmentId}`);
      const base = {
        ...source,
        encounterSeed: deriveSeed(segmentSeed, 'encounters'),
        eliteSeed: deriveSeed(segmentSeed, 'elite'),
        arenaSeed: deriveSeed(segmentSeed, 'arena'),
        randomStreamSeeds: {
          ...randomStreamSeeds(segmentSeed),
          bossAttackSelection: deriveSeed(segmentSeed, 'boss-attack-selection'),
          bossAttackVariation: deriveSeed(segmentSeed, 'boss-attack-variation'),
          bossFanPattern: deriveSeed(segmentSeed, 'boss-fan-pattern'),
          bossLinePattern: deriveSeed(segmentSeed, 'boss-line-pattern'),
          bossSummonSelection: deriveSeed(segmentSeed, 'boss-summon-selection'),
          hostileEchoSelection: deriveSeed(segmentSeed, 'hostile-echo-selection'),
          bossSectorSelection: deriveSeed(segmentSeed, 'boss-sector-selection'),
          bossPanelSelection: deriveSeed(segmentSeed, 'boss-panel-selection'),
        },
        completionRule: source.segmentType === RUN_SEGMENT_TYPES.recovery
          ? 'recovery-terminal'
          : source.segmentType === RUN_SEGMENT_TYPES.boss
            ? 'null-architect-defeated'
            : 'all-hostiles-resolved',
      };
      if (source.requiresElite) {
        base.elitePlan = this.elitePlanner.select({ seed: base.eliteSeed, segment: source, previousElitePlans: elitePlans });
        elitePlans.push(base.elitePlan);
      } else base.elitePlan = null;
      base.arenaDescriptor = this.arenaGenerator.generate({
        seed: base.arenaSeed,
        segment: base,
        history: arenaHistory,
        recovery: source.segmentType === RUN_SEGMENT_TYPES.recovery,
        boss: source.segmentType === RUN_SEGMENT_TYPES.boss,
      });
      arenaSequence.push(Object.freeze({
        segmentId: source.segmentId,
        arenaInstanceId: base.arenaDescriptor.arenaInstanceId,
        templateId: base.arenaDescriptor.templateId,
        transformId: base.arenaDescriptor.transformId,
        hazardConfigurationId: base.arenaDescriptor.hazardConfigurationId,
        decorationVariantId: base.arenaDescriptor.decorationVariantId,
      }));
      return createRunSegmentDefinition(base);
    });
    return createRunPlan({
      seed: normalizedSeed,
      difficultyId,
      generationVersion: RUN_PLAN_GENERATIONS.phase8,
      segments,
      arenaSequence,
      upgradeOfferCount: 7,
      expectedEliteCount: 2,
      recoveryChamberIncluded: true,
      bossHandoffAvailable: false,
      bossImplemented: true,
      bossTemplateId: 'boss-chamber',
    });
  }

  #generatePhase7({ seed, difficultyId }) {
    const normalizedSeed = Number(seed) >>> 0;
    const elitePlans = [];
    const arenaHistory = new ArenaHistory();
    const arenaSequence = [];
    const segments = PHASE7_RUN_SEGMENTS.map((source) => {
      const segmentSeed = deriveSeed(normalizedSeed, `phase7-segment-${source.segmentId}`);
      const base = {
        ...source,
        encounterSeed: deriveSeed(segmentSeed, 'encounters'),
        eliteSeed: deriveSeed(segmentSeed, 'elite'),
        arenaSeed: deriveSeed(segmentSeed, 'arena'),
        randomStreamSeeds: randomStreamSeeds(segmentSeed),
        completionRule: source.segmentType === RUN_SEGMENT_TYPES.recovery
          ? 'recovery-terminal'
          : source.segmentType === RUN_SEGMENT_TYPES.bossHandoff
            ? 'boss-ready'
            : 'all-hostiles-resolved',
      };
      if (source.requiresElite) {
        base.elitePlan = this.elitePlanner.select({ seed: base.eliteSeed, segment: source, previousElitePlans: elitePlans });
        elitePlans.push(base.elitePlan);
      } else base.elitePlan = null;
      base.arenaDescriptor = this.arenaGenerator.generate({
        seed: base.arenaSeed,
        segment: base,
        history: arenaHistory,
        recovery: source.segmentType === RUN_SEGMENT_TYPES.recovery,
        boss: source.segmentType === RUN_SEGMENT_TYPES.bossHandoff,
      });
      arenaSequence.push(Object.freeze({
        segmentId: source.segmentId,
        arenaInstanceId: base.arenaDescriptor.arenaInstanceId,
        templateId: base.arenaDescriptor.templateId,
        transformId: base.arenaDescriptor.transformId,
        hazardConfigurationId: base.arenaDescriptor.hazardConfigurationId,
        decorationVariantId: base.arenaDescriptor.decorationVariantId,
      }));
      return createRunSegmentDefinition(base);
    });
    return createRunPlan({
      seed: normalizedSeed,
      difficultyId,
      generationVersion: RUN_PLAN_GENERATIONS.phase7,
      segments,
      arenaSequence,
      upgradeOfferCount: 7,
      expectedEliteCount: 2,
      recoveryChamberIncluded: true,
      bossHandoffAvailable: true,
      bossImplemented: false,
    });
  }
}
