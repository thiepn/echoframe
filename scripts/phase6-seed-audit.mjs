import fs from 'node:fs';
import path from 'node:path';
import { RunPlanGenerator } from '../src/run/RunPlanGenerator.js';
import { EncounterGenerator } from '../src/encounter/EncounterGenerator.js';
import { EncounterHistory } from '../src/encounter/EncounterHistory.js';
import { EliteEncounterValidator } from '../src/elites/EliteEncounterValidator.js';
import { isEliteEligible } from '../src/elites/EliteEligibility.js';
import { CORE_ENEMY_DEFINITIONS } from '../src/data/coreEnemyDefinitions.js';
import { SPAWN_POINT_DEFINITIONS } from '../src/data/spawnPointDefinitions.js';
import { generateUpgradeOffers } from '../src/upgrades/UpgradeOfferGenerator.js';

const difficulties = ['relaxed', 'standard', 'overclocked'];
const safetyRadius = { relaxed: 300, standard: 260, overclocked: 230 };
const spawnIds = new Set(SPAWN_POINT_DEFINITIONS.map((point) => point.id));
const increment = (object, key, amount = 1) => { object[key] = (object[key] ?? 0) + amount; };
const stable = (value) => JSON.stringify(value);
const report = {
  generatedAt: new Date().toISOString(),
  scope: '300 deterministic Phase 6 pre-boss run plans across all difficulties.',
  difficulties: {},
  totals: {
    runPlans: 0, segments: 0, descriptors: 0, deterministicPlanComparisons: 0, deterministicPlanMatches: 0,
    deterministicDescriptorComparisons: 0, deterministicDescriptorMatches: 0, planGenerationErrors: 0,
    encounterGenerationErrors: 0, generationAttempts: 0, maximumGenerationAttempts: 0, fallbackCount: 0,
    ineligiblePairCount: 0, normalSegmentEliteCount: 0, missingEliteSegmentCount: 0, activeCapViolations: 0,
    roleCapViolations: 0, copyReservationViolations: 0, resonantNoSupportViolations: 0,
    repeatedModifierCount: 0, repeatedHostModifierPairCount: 0, upgradeOfferMismatches: 0, errors: [],
  },
};

for (const difficultyId of difficulties) {
  const metrics = {
    runPlans: 0, segments: 0, descriptors: 0, deterministicPlanMatches: 0, deterministicDescriptorMatches: 0,
    generationAttempts: 0, maximumGenerationAttempts: 0, fallbackCount: 0, rejectionReasons: {},
    elite1ModifierFrequency: {}, elite2ModifierFrequency: {}, eliteHostFrequencyBySegment: {}, hostModifierPairFrequency: {},
    enemyFrequency: {}, roleFrequency: {}, patternFrequency: {}, spawnPointFrequency: {}, eliteSocketFrequency: {},
    supportThreatSum: 0, totalEliteThreatSum: 0, eliteDescriptors: 0, threatDeviationSum: 0, errors: [],
  };
  for (let seed = 1; seed <= 100; seed += 1) {
    const planA = new RunPlanGenerator().generate({ seed, difficultyId });
    const planB = new RunPlanGenerator().generate({ seed, difficultyId });
    metrics.runPlans += 1;
    report.totals.runPlans += 1;
    report.totals.deterministicPlanComparisons += 1;
    if (stable(planA) === stable(planB)) { metrics.deterministicPlanMatches += 1; report.totals.deterministicPlanMatches += 1; }
    else { report.totals.planGenerationErrors += 1; metrics.errors.push({ seed, reason: 'nondeterministic-run-plan' }); }

    const elitePlans = planA.segments.filter((segment) => segment.requiresElite).map((segment) => segment.elitePlan);
    if (elitePlans.length !== 2) { report.totals.missingEliteSegmentCount += 1; metrics.errors.push({ seed, reason: 'missing-elite-segment', count: elitePlans.length }); }
    if (elitePlans[0]?.modifierId === elitePlans[1]?.modifierId) report.totals.repeatedModifierCount += 1;
    if (elitePlans[0] && elitePlans[1] && `${elitePlans[0].hostEnemyType}:${elitePlans[0].modifierId}` === `${elitePlans[1].hostEnemyType}:${elitePlans[1].modifierId}`) report.totals.repeatedHostModifierPairCount += 1;

    const offersA = Array.from({ length: 5 }, (_, offerIndex) => generateUpgradeOffers({ seed: planA.seed, offerIndex, levels: new Map() }).map((entry) => entry.id));
    const offersB = Array.from({ length: 5 }, (_, offerIndex) => generateUpgradeOffers({ seed: planA.seed, offerIndex, levels: new Map() }).map((entry) => entry.id));
    if (stable(offersA) !== stable(offersB)) { report.totals.upgradeOfferMismatches += 1; metrics.errors.push({ seed, reason: 'upgrade-offer-nondeterminism' }); }

    for (const segment of planA.segments) {
      metrics.segments += 1; report.totals.segments += 1;
      if (!segment.requiresElite && segment.elitePlan) { report.totals.normalSegmentEliteCount += 1; metrics.errors.push({ seed, segmentId: segment.segmentId, reason: 'elite-in-normal-segment' }); }
      if (segment.requiresElite) {
        const elite = segment.elitePlan;
        if (!elite || !isEliteEligible({ enemyType: elite.hostEnemyType, modifierId: elite.modifierId })) { report.totals.ineligiblePairCount += 1; metrics.errors.push({ seed, segmentId: segment.segmentId, reason: 'ineligible-elite-pair' }); }
        const bucket = segment.segmentId === 'elite-1' ? metrics.elite1ModifierFrequency : metrics.elite2ModifierFrequency;
        increment(bucket, elite?.modifierId ?? 'missing');
        metrics.eliteHostFrequencyBySegment[segment.segmentId] ??= {};
        increment(metrics.eliteHostFrequencyBySegment[segment.segmentId], elite?.hostEnemyType ?? 'missing');
        increment(metrics.hostModifierPairFrequency, `${elite?.hostEnemyType}:${elite?.modifierId}`);
        if (elite?.modifierId === 'replicating' && elite.reservedEnemySlots < 1) { report.totals.copyReservationViolations += 1; metrics.errors.push({ seed, segmentId: segment.segmentId, reason: 'copy-reservation-missing' }); }
      }

      const generate = () => new EncounterGenerator().generateSegment({
        segment, difficultyId, playerPosition: { x: 800, y: 450 }, spawnSafetyRadius: safetyRadius[difficultyId], encounterHistory: new EncounterHistory(),
      });
      const descriptorsA = generate();
      const descriptorsB = generate();
      report.totals.deterministicDescriptorComparisons += descriptorsA.length;
      if (stable(descriptorsA) === stable(descriptorsB)) { metrics.deterministicDescriptorMatches += descriptorsA.length; report.totals.deterministicDescriptorMatches += descriptorsA.length; }
      else { report.totals.encounterGenerationErrors += 1; metrics.errors.push({ seed, segmentId: segment.segmentId, reason: 'nondeterministic-descriptors' }); }
      if (descriptorsA.length !== 5) metrics.errors.push({ seed, segmentId: segment.segmentId, reason: 'invalid-descriptor-count', count: descriptorsA.length });

      for (const descriptor of descriptorsA) {
        metrics.descriptors += 1; report.totals.descriptors += 1;
        const diagnostics = descriptor.generationDiagnostics ?? {};
        metrics.generationAttempts += diagnostics.generationAttempts ?? 0;
        report.totals.generationAttempts += diagnostics.generationAttempts ?? 0;
        metrics.maximumGenerationAttempts = Math.max(metrics.maximumGenerationAttempts, diagnostics.generationAttempts ?? 0);
        report.totals.maximumGenerationAttempts = Math.max(report.totals.maximumGenerationAttempts, diagnostics.generationAttempts ?? 0);
        if (diagnostics.fallbackUsed) { metrics.fallbackCount += 1; report.totals.fallbackCount += 1; }
        for (const [reason, count] of Object.entries(diagnostics.rejectionReasons ?? {})) increment(metrics.rejectionReasons, reason, count);
        increment(metrics.patternFrequency, descriptor.pattern);
        metrics.threatDeviationSum += Math.abs(descriptor.actualThreat - descriptor.targetThreat - (descriptor.enemyEntries.find((entry) => entry.elite)?.elite?.threatSurcharge ?? 0));

        for (const entry of descriptor.enemyEntries) {
          const definition = CORE_ENEMY_DEFINITIONS[entry.enemyType];
          increment(metrics.enemyFrequency, entry.enemyType);
          if (definition) increment(metrics.roleFrequency, definition.role);
          increment(metrics.spawnPointFrequency, entry.spawnPointId);
          if (!spawnIds.has(entry.spawnPointId)) metrics.errors.push({ seed, segmentId: segment.segmentId, descriptorId: descriptor.encounterId, reason: 'invalid-spawn-point' });
          if (entry.elite) increment(metrics.eliteSocketFrequency, entry.spawnPointId);
        }

        const groups = new Map();
        for (const entry of descriptor.enemyEntries) { const list = groups.get(entry.groupIndex) ?? []; list.push(entry); groups.set(entry.groupIndex, list); }
        for (const group of groups.values()) {
          const groupThreat = group.reduce((sum, entry) => sum + (CORE_ENEMY_DEFINITIONS[entry.enemyType]?.threatCost ?? 0), 0);
          if (groupThreat > segment.activeThreatCap) { report.totals.activeCapViolations += 1; metrics.errors.push({ seed, segmentId: segment.segmentId, descriptorId: descriptor.encounterId, reason: 'active-cap-violation', groupThreat }); }
        }

        if (segment.requiresElite && descriptor.enemyEntries.some((entry) => entry.elite)) {
          const validation = new EliteEncounterValidator().validate({ segment, elitePlan: segment.elitePlan, descriptor, poolCapacityAvailable: 64, copyPlacementAvailable: true });
          for (const reason of validation.reasons) {
            if (reason === 'elite-active-cap') report.totals.activeCapViolations += 1;
            if (reason === 'elite-role-cap') report.totals.roleCapViolations += 1;
            if (reason === 'elite-copy-slot-unavailable') report.totals.copyReservationViolations += 1;
            if (reason === 'elite-resonant-no-support') report.totals.resonantNoSupportViolations += 1;
            metrics.errors.push({ seed, segmentId: segment.segmentId, descriptorId: descriptor.encounterId, reason });
          }
          const surcharge = segment.elitePlan.threatSurcharge;
          metrics.supportThreatSum += descriptor.actualThreat - segment.elitePlan.baseThreat - surcharge;
          metrics.totalEliteThreatSum += descriptor.actualThreat;
          metrics.eliteDescriptors += 1;
        }
      }
    }
  }
  metrics.averageGenerationAttempts = metrics.descriptors ? metrics.generationAttempts / metrics.descriptors : 0;
  metrics.averageSupportThreat = metrics.eliteDescriptors ? metrics.supportThreatSum / metrics.eliteDescriptors : 0;
  metrics.averageTotalEliteThreat = metrics.eliteDescriptors ? metrics.totalEliteThreatSum / metrics.eliteDescriptors : 0;
  metrics.averageThreatDeviation = metrics.descriptors ? metrics.threatDeviationSum / metrics.descriptors : 0;
  report.difficulties[difficultyId] = metrics;
  report.totals.errors.push(...metrics.errors.map((error) => ({ difficultyId, ...error })));
}
report.totals.averageGenerationAttempts = report.totals.descriptors ? report.totals.generationAttempts / report.totals.descriptors : 0;
report.totals.passed = report.totals.planGenerationErrors === 0 && report.totals.encounterGenerationErrors === 0
  && report.totals.ineligiblePairCount === 0 && report.totals.normalSegmentEliteCount === 0
  && report.totals.missingEliteSegmentCount === 0 && report.totals.activeCapViolations === 0
  && report.totals.roleCapViolations === 0 && report.totals.copyReservationViolations === 0
  && report.totals.resonantNoSupportViolations === 0 && report.totals.upgradeOfferMismatches === 0
  && report.totals.repeatedModifierCount === 0 && report.totals.repeatedHostModifierPairCount === 0
  && report.totals.errors.length === 0;
const outputPath = path.resolve('docs/PHASE6_SEED_AUDIT.json');
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: report.totals, summaries: Object.fromEntries(Object.entries(report.difficulties).map(([key, value]) => [key, { plans: value.runPlans, segments: value.segments, descriptors: value.descriptors, averageGenerationAttempts: value.averageGenerationAttempts, maximumGenerationAttempts: value.maximumGenerationAttempts, fallbacks: value.fallbackCount, errors: value.errors.length, averageSupportThreat: value.averageSupportThreat, averageTotalEliteThreat: value.averageTotalEliteThreat }])) }, null, 2));
if (!report.totals.passed) process.exitCode = 1;
