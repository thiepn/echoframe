import fs from 'node:fs';
import path from 'node:path';
import { EncounterGenerator } from '../src/encounter/EncounterGenerator.js';
import { EncounterHistory } from '../src/encounter/EncounterHistory.js';
import { CORE_ENEMY_DEFINITIONS } from '../src/data/coreEnemyDefinitions.js';
import { ENCOUNTER_BALANCE } from '../src/data/encounterBalance.js';
import { SPAWN_POINT_DEFINITIONS } from '../src/data/spawnPointDefinitions.js';

const difficulties = ['relaxed', 'standard', 'overclocked'];
const phase5Types = ['lancer', 'shard-carrier', 'bulwark', 'suppressor'];
const chamberTwoIntroductionTypes = ['shard-carrier', 'bulwark', 'suppressor'];
const spawnIds = new Set(SPAWN_POINT_DEFINITIONS.map((point) => point.id));
const report = {
  generatedAt: new Date().toISOString(),
  difficulties: {},
  totals: { runs: 0, descriptors: 0, deterministicRunComparisons: 0, deterministicRunMatches: 0, deterministicDescriptorComparisons: 0, deterministicDescriptorMatches: 0, generationAttempts: 0, maximumGenerationAttempts: 0, fallbacks: 0, errors: [] },
};
const increment = (object, key, amount = 1) => { object[key] = (object[key] ?? 0) + amount; };
const stable = (value) => JSON.stringify(value);

for (const difficultyId of difficulties) {
  const metrics = {
    runs: 0, descriptors: 0, deterministicRunComparisons: 0, deterministicRunMatches: 0, deterministicDescriptorComparisons: 0, deterministicDescriptorMatches: 0, generationAttempts: 0, maximumGenerationAttempts: 0, fallbacks: 0,
    rejectionReasons: {}, enemyFrequency: {}, roleFrequency: {}, patternFrequency: {}, spawnPointFrequency: {},
    actualThreatSum: 0, absoluteThreatDeviationSum: 0, errors: [],
  };
  for (let seed = 1; seed <= 100; seed += 1) {
    const generatorA = new EncounterGenerator();
    const generatorB = new EncounterGenerator();
    const runA = [];
    const runB = [];
    for (const chamberIndex of [1, 2]) {
      const playerPosition = { x: 800, y: chamberIndex === 2 ? 720 : 450 };
      const safetyRadius = ENCOUNTER_BALANCE.spawnSafetyRadius[difficultyId];
      runA.push(...generatorA.generateChamber({ seed, difficultyId, chamberIndex, playerPosition, spawnSafetyRadius: safetyRadius, encounterHistory: new EncounterHistory() }));
      runB.push(...generatorB.generateChamber({ seed, difficultyId, chamberIndex, playerPosition, spawnSafetyRadius: safetyRadius, encounterHistory: new EncounterHistory() }));
    }
    metrics.runs += 1;
    metrics.deterministicRunComparisons += 1;
    metrics.deterministicDescriptorComparisons += Math.max(runA.length, runB.length);
    const runMatches = stable(runA) === stable(runB);
    if (runMatches) {
      metrics.deterministicRunMatches += 1;
      metrics.deterministicDescriptorMatches += runA.length;
    } else {
      const sharedLength = Math.min(runA.length, runB.length);
      for (let index = 0; index < sharedLength; index += 1) if (stable(runA[index]) === stable(runB[index])) metrics.deterministicDescriptorMatches += 1;
      metrics.errors.push({ seed, reason: 'nondeterministic-regeneration' });
    }
    const chamberTwo = runA.filter((descriptor) => descriptor.chamberIndex === 2);
    const chamberTwoTypes = new Set(chamberTwo.flatMap((descriptor) => descriptor.enemyEntries.map((entry) => entry.enemyType)));
    for (const type of phase5Types) if (!chamberTwoTypes.has(type)) metrics.errors.push({ seed, reason: 'missing-new-enemy', type });
    const introducedTypes = [];
    for (const [introductionIndex, descriptor] of chamberTwo.slice(0, 3).entries()) {
      const presentNewTypes = [...new Set(descriptor.enemyEntries.map((entry) => entry.enemyType).filter((type) => chamberTwoIntroductionTypes.includes(type)))];
      if (presentNewTypes.length !== 1) metrics.errors.push({ seed, reason: 'non-isolated-new-enemy-introduction', introductionIndex, types: presentNewTypes });
      introducedTypes.push(...presentNewTypes);
    }
    if (new Set(introducedTypes).size !== chamberTwoIntroductionTypes.length) metrics.errors.push({ seed, reason: 'incomplete-new-enemy-introduction-sequence', types: introducedTypes });
    const finaleTypes = new Set(chamberTwo.at(-1)?.enemyEntries.map((entry) => entry.enemyType) ?? []);
    for (const type of Object.keys(CORE_ENEMY_DEFINITIONS)) if (!finaleTypes.has(type)) metrics.errors.push({ seed, reason: 'finale-missing-enemy', type });
    for (const chamberIndex of [1, 2]) {
      const descriptors = runA.filter((descriptor) => descriptor.chamberIndex === chamberIndex);
      if (!descriptors.some((descriptor) => descriptor.phase === 'RECOVERY')) metrics.errors.push({ seed, chamberIndex, reason: 'missing-recovery' });
      const finale = descriptors.at(-1);
      if (!finale || finale.phase !== 'CLIMAX' || finale.enemyEntries.length === 0) metrics.errors.push({ seed, chamberIndex, reason: 'invalid-finale' });
      let previousSignature = null;
      for (const descriptor of descriptors) {
        metrics.descriptors += 1;
        const diagnostics = descriptor.generationDiagnostics;
        metrics.generationAttempts += diagnostics.generationAttempts;
        metrics.maximumGenerationAttempts = Math.max(metrics.maximumGenerationAttempts, diagnostics.generationAttempts);
        if (diagnostics.fallbackUsed) metrics.fallbacks += 1;
        for (const [reason, count] of Object.entries(diagnostics.rejectionReasons ?? {})) increment(metrics.rejectionReasons, reason, count);
        increment(metrics.patternFrequency, descriptor.pattern);
        metrics.actualThreatSum += descriptor.actualThreat;
        metrics.absoluteThreatDeviationSum += Math.abs(descriptor.actualThreat - descriptor.targetThreat);
        if (descriptor.actualThreat < 0) metrics.errors.push({ seed, chamberIndex, descriptor: descriptor.encounterId, reason: 'negative-threat' });
        if (descriptor.enemyEntries.length > ENCOUNTER_BALANCE.maximumActiveEnemies) metrics.errors.push({ seed, chamberIndex, descriptor: descriptor.encounterId, reason: 'enemy-cap' });
        const signature = diagnostics.compositionSignature;
        if (signature && previousSignature === signature) metrics.errors.push({ seed, chamberIndex, descriptor: descriptor.encounterId, reason: 'exact-consecutive-repeat' });
        if (signature) previousSignature = signature;
        for (const entry of descriptor.enemyEntries) {
          const definition = CORE_ENEMY_DEFINITIONS[entry.enemyType];
          if (!definition) metrics.errors.push({ seed, chamberIndex, descriptor: descriptor.encounterId, reason: 'invalid-enemy-type', type: entry.enemyType });
          if (!spawnIds.has(entry.spawnPointId)) metrics.errors.push({ seed, chamberIndex, descriptor: descriptor.encounterId, reason: 'missing-spawn-point', spawnPointId: entry.spawnPointId });
          if (chamberIndex === 1 && !ENCOUNTER_BALANCE.chamberProfiles[1].allowedEnemyTypes.includes(entry.enemyType)) metrics.errors.push({ seed, chamberIndex, descriptor: descriptor.encounterId, reason: 'chamber-roster-violation', type: entry.enemyType });
          increment(metrics.enemyFrequency, entry.enemyType);
          if (definition) increment(metrics.roleFrequency, definition.role);
          increment(metrics.spawnPointFrequency, entry.spawnPointId);
        }
      }
    }
  }
  metrics.averageGenerationAttempts = metrics.descriptors ? metrics.generationAttempts / metrics.descriptors : 0;
  metrics.averageActualThreat = metrics.descriptors ? metrics.actualThreatSum / metrics.descriptors : 0;
  metrics.averageAbsoluteThreatDeviation = metrics.descriptors ? metrics.absoluteThreatDeviationSum / metrics.descriptors : 0;
  report.difficulties[difficultyId] = metrics;
  report.totals.runs += metrics.runs;
  report.totals.descriptors += metrics.descriptors;
  report.totals.deterministicRunComparisons += metrics.deterministicRunComparisons;
  report.totals.deterministicRunMatches += metrics.deterministicRunMatches;
  report.totals.deterministicDescriptorComparisons += metrics.deterministicDescriptorComparisons;
  report.totals.deterministicDescriptorMatches += metrics.deterministicDescriptorMatches;
  report.totals.generationAttempts += metrics.generationAttempts;
  report.totals.maximumGenerationAttempts = Math.max(report.totals.maximumGenerationAttempts, metrics.maximumGenerationAttempts);
  report.totals.fallbacks += metrics.fallbacks;
  report.totals.errors.push(...metrics.errors.map((error) => ({ difficultyId, ...error })));
}
report.totals.averageGenerationAttempts = report.totals.descriptors ? report.totals.generationAttempts / report.totals.descriptors : 0;
const outputPath = path.resolve('docs/PHASE5_SEED_AUDIT.json');
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: report.totals, summaries: Object.fromEntries(Object.entries(report.difficulties).map(([key, value]) => [key, { runs: value.runs, descriptors: value.descriptors, averageGenerationAttempts: value.averageGenerationAttempts, maximumGenerationAttempts: value.maximumGenerationAttempts, fallbacks: value.fallbacks, errors: value.errors.length, averageActualThreat: value.averageActualThreat, averageAbsoluteThreatDeviation: value.averageAbsoluteThreatDeviation }])) }, null, 2));
if (report.totals.errors.length) process.exitCode = 1;
