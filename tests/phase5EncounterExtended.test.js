import test from 'node:test';
import assert from 'node:assert/strict';
import { PROTOTYPE_ARENA } from '../src/data/prototypeArena.js';
import { ENCOUNTER_BALANCE } from '../src/data/encounterBalance.js';
import { CORE_ENEMY_DEFINITIONS } from '../src/data/coreEnemyDefinitions.js';
import { EncounterCompositionValidator } from '../src/encounter/EncounterCompositionValidator.js';
import { createEncounterDescriptor } from '../src/encounter/EncounterDescriptor.js';
import { EncounterGenerator } from '../src/encounter/EncounterGenerator.js';
import { EncounterHistory } from '../src/encounter/EncounterHistory.js';
import { createEncounterRandomStreams } from '../src/encounter/EncounterRandomStreams.js';
import { EnemySynergyRules } from '../src/encounter/EnemySynergyRules.js';
import { SpawnPlanner } from '../src/encounter/SpawnPlanner.js';
import { SpawnSafetyValidator } from '../src/encounter/SpawnSafetyValidator.js';
import { ThreatBudgetModel } from '../src/encounter/ThreatBudgetModel.js';
import { ENEMY_ROLES } from '../src/enemy-ai/EnemyRole.js';
import { deterministicShuffle } from '../src/utils/deterministicShuffle.js';
import { normalizeArenaBounds } from '../src/utils/arenaGeometry.js';
import { SeededRandom } from '../src/utils/SeededRandom.js';
import { weightedSelection } from '../src/utils/weightedSelection.js';

const ALL_TYPES = Object.keys(CORE_ENEMY_DEFINITIONS);
const genericPattern = Object.freeze({ minimumTypes: 1, maximumTypes: 6, requiredRoles: [] });

test('normalizeArenaBounds supports edge and rectangle shapes', () => {
  assert.deepEqual(normalizeArenaBounds({ left: 10, right: 110, top: 20, bottom: 220 }), {
    left: 10, right: 110, top: 20, bottom: 220, width: 100, height: 200, x: 10, y: 20,
  });
  assert.deepEqual(normalizeArenaBounds({ x: 10, y: 20, width: 100, height: 200 }), {
    left: 10, right: 110, top: 20, bottom: 220, width: 100, height: 200, x: 10, y: 20,
  });
});

test('SpawnSafetyValidator enforces edge-style arena bounds', () => {
  const validator = new SpawnSafetyValidator({ wallDefinitions: [], worldBounds: { left: 80, right: 1520, top: 45, bottom: 855 } });
  assert.equal(validator.validate({ x: 85, y: 450, clearanceRadius: 20 }, {}).reasons.includes('arena-incompatible'), true);
  assert.equal(validator.validate({ x: 120, y: 450, clearanceRadius: 20 }, {}).valid, true);
});

test('SpawnSafetyValidator rejects internal-wall overlap', () => {
  const validator = new SpawnSafetyValidator({ wallDefinitions: PROTOTYPE_ARENA.walls, worldBounds: PROTOTYPE_ARENA.bounds });
  const result = validator.validate({ x: 800, y: 350, clearanceRadius: 30 }, {});
  assert.equal(result.valid, false);
  assert.equal(result.reasons.includes('wall-clearance'), true);
});

test('SpawnSafetyValidator returns structured player, Echo, and enemy-clearance reasons', () => {
  const validator = new SpawnSafetyValidator({ wallDefinitions: [], worldBounds: { x: 0, y: 0, width: 1000, height: 1000 } });
  const result = validator.validate(
    { x: 500, y: 500, clearanceRadius: 20, minimumOtherSpawnDistance: 120 },
    {
      playerPosition: { x: 510, y: 500 },
      echoPositions: [{ x: 520, y: 500 }],
      occupiedPositions: [{ x: 530, y: 500 }],
      safetyRadius: 260,
    },
  );
  assert.deepEqual(new Set(result.reasons), new Set(['player-safety-distance', 'echo-safety-distance', 'enemy-clearance']));
});

test('named encounter streams are reproducible', () => {
  const a = createEncounterRandomStreams({ seed: 77, chamberIndex: 2, sequenceIndex: 3, phase: 'PRESSURE', attempt: 4 });
  const b = createEncounterRandomStreams({ seed: 77, chamberIndex: 2, sequenceIndex: 3, phase: 'PRESSURE', attempt: 4 });
  assert.deepEqual(a.seeds, b.seeds);
  assert.deepEqual([a.composition.nextUint32(), a.spawnSelection.nextUint32(), a.spawnOrder.nextUint32()], [b.composition.nextUint32(), b.spawnSelection.nextUint32(), b.spawnOrder.nextUint32()]);
});

test('named encounter streams are isolated from cosmetic calls', () => {
  const a = createEncounterRandomStreams({ seed: 91, chamberIndex: 1, sequenceIndex: 2, phase: 'BUILD', attempt: 1 });
  const b = createEncounterRandomStreams({ seed: 91, chamberIndex: 1, sequenceIndex: 2, phase: 'BUILD', attempt: 1 });
  for (let index = 0; index < 1000; index += 1) a.cosmetic.next();
  assert.deepEqual([a.composition.nextUint32(), a.spawnSelection.nextUint32(), a.spawnOrder.nextUint32()], [b.composition.nextUint32(), b.spawnSelection.nextUint32(), b.spawnOrder.nextUint32()]);
});

test('different generation attempts derive different gameplay streams', () => {
  const a = createEncounterRandomStreams({ seed: 11, chamberIndex: 1, sequenceIndex: 0, phase: 'INTRO', attempt: 1 });
  const b = createEncounterRandomStreams({ seed: 11, chamberIndex: 1, sequenceIndex: 0, phase: 'INTRO', attempt: 2 });
  assert.notEqual(a.seeds.composition, b.seeds.composition);
  assert.notEqual(a.seeds.spawnSelection, b.seeds.spawnSelection);
  assert.equal(a.seeds.recoveryVariation, b.seeds.recoveryVariation);
});

test('EncounterDescriptor deep-freezes nested entries and diagnostics', () => {
  const descriptor = createEncounterDescriptor({
    encounterId: 'test', seed: 1, chamberIndex: 1, sequenceIndex: 0, phase: 'INTRO', pattern: 'A',
    enemyEntries: [{ enemyType: 'drifter', nested: { value: 1 } }],
    spawnGroups: [{ groupIndex: 0, entries: [0] }],
    generationDiagnostics: { randomStreamSeeds: { composition: 1 } },
  });
  assert.equal(Object.isFrozen(descriptor), true);
  assert.equal(Object.isFrozen(descriptor.enemyEntries), true);
  assert.equal(Object.isFrozen(descriptor.enemyEntries[0]), true);
  assert.equal(Object.isFrozen(descriptor.enemyEntries[0].nested), true);
  assert.equal(Object.isFrozen(descriptor.generationDiagnostics.randomStreamSeeds), true);
});

test('EncounterDescriptor remains plain serializable data', () => {
  const descriptor = new EncounterGenerator().generateChamber({ seed: 100, difficultyId: 'standard', chamberIndex: 1, encounterHistory: new EncounterHistory() })[0];
  const copy = JSON.parse(JSON.stringify(descriptor));
  assert.equal(copy.encounterId, descriptor.encounterId);
  assert.equal(copy.enemyEntries.every((entry) => Number.isFinite(entry.x) && Number.isFinite(entry.y)), true);
});

test('EncounterGenerator records all five named stream seeds', () => {
  const descriptor = new EncounterGenerator().generateChamber({ seed: 101, difficultyId: 'standard', chamberIndex: 1, encounterHistory: new EncounterHistory() })[0];
  assert.deepEqual(Object.keys(descriptor.generationDiagnostics.randomStreamSeeds).sort(), ['composition', 'cosmetic', 'recoveryVariation', 'spawnOrder', 'spawnSelection']);
});

test('difficulty pacing scalar changes delays without changing composition', () => {
  const generator = new EncounterGenerator();
  const relaxed = generator.generateChamber({ seed: 202, difficultyId: 'relaxed', chamberIndex: 1, spawnIntervalScalar: 1.15, encounterHistory: new EncounterHistory() });
  const overclocked = generator.generateChamber({ seed: 202, difficultyId: 'overclocked', chamberIndex: 1, spawnIntervalScalar: 0.88, encounterHistory: new EncounterHistory() });
  assert.deepEqual(relaxed.map((descriptor) => descriptor.generationDiagnostics.compositionSignature), overclocked.map((descriptor) => descriptor.generationDiagnostics.compositionSignature));
  assert.ok(relaxed[0].spawnIntervalMs > overclocked[0].spawnIntervalMs);
  assert.ok(relaxed[0].enemyEntries.at(-1).spawnDelayMs >= overclocked[0].enemyEntries.at(-1).spawnDelayMs);
});

test('recovery variation is deterministic and stays in configured ranges', () => {
  const generator = new EncounterGenerator();
  const a = generator.generateChamber({ seed: 303, difficultyId: 'standard', chamberIndex: 2, encounterHistory: new EncounterHistory() });
  const b = generator.generateChamber({ seed: 303, difficultyId: 'standard', chamberIndex: 2, encounterHistory: new EncounterHistory() });
  assert.deepEqual(a.map((descriptor) => descriptor.recoveryAfterMs), b.map((descriptor) => descriptor.recoveryAfterMs));
  const recovery = a.find((descriptor) => descriptor.phase === 'RECOVERY');
  assert.ok(recovery.recoveryAfterMs >= ENCOUNTER_BALANCE.recoveryRanges.afterPressure[0]);
  assert.ok(recovery.recoveryAfterMs <= ENCOUNTER_BALANCE.recoveryRanges.afterPressure[1]);
});

test('generated spawn entries are finite, inside the arena, and wall-clear', () => {
  const validator = new SpawnSafetyValidator({ wallDefinitions: PROTOTYPE_ARENA.walls, worldBounds: PROTOTYPE_ARENA.bounds });
  const descriptors = new EncounterGenerator().generateChamber({ seed: 404, difficultyId: 'standard', chamberIndex: 2, encounterHistory: new EncounterHistory() });
  for (const entry of descriptors.flatMap((descriptor) => descriptor.enemyEntries)) {
    assert.equal(Number.isFinite(entry.x) && Number.isFinite(entry.y), true);
    const radius = CORE_ENEMY_DEFINITIONS[entry.enemyType].collisionRadius + 12;
    assert.equal(validator.validate({ ...entry, clearanceRadius: radius }, { safetyRadius: 0 }).valid, true);
  }
});

test('250 generated runs contain no NaN coordinates or negative threat', () => {
  const generator = new EncounterGenerator();
  for (let seed = 0; seed < 250; seed += 1) {
    for (const chamberIndex of [1, 2]) {
      const descriptors = generator.generateChamber({ seed, difficultyId: 'standard', chamberIndex, encounterHistory: new EncounterHistory() });
      for (const descriptor of descriptors) {
        assert.ok(descriptor.actualThreat >= 0);
        assert.equal(descriptor.enemyEntries.every((entry) => Number.isFinite(entry.x) && Number.isFinite(entry.y) && Number.isFinite(entry.spawnDelayMs)), true);
      }
    }
  }
});

test('ThreatBudgetModel reset changes target and clears spent threat', () => {
  const model = new ThreatBudgetModel({ targetThreat: 10 });
  model.consume(4);
  model.reset(6);
  assert.equal(model.targetThreat, 6);
  assert.equal(model.spentThreat, 0);
  assert.equal(model.remainingThreat, 6);
});

test('ThreatBudgetModel rejects overspend without mutating state', () => {
  const model = new ThreatBudgetModel({ targetThreat: 5, toleranceAbove: 0 });
  assert.equal(model.consume(4), true);
  assert.equal(model.consume(2), false);
  assert.equal(model.spentThreat, 4);
  assert.equal(model.remainingThreat, 1);
});

test('composition validator reports control saturation', () => {
  const result = new EncounterCompositionValidator().validate(['suppressor', 'suppressor'], { targetThreat: 10, allowedEnemyTypes: ALL_TYPES, pattern: genericPattern });
  assert.equal(result.valid, false);
  assert.equal(result.reasons.includes('control-saturation'), true);
});

test('composition validator reports body-block pressure', () => {
  const result = new EncounterCompositionValidator().validate(['bulwark', 'bulwark', 'lancer', 'drifter'], { targetThreat: 12, allowedEnemyTypes: ALL_TYPES, pattern: genericPattern });
  assert.equal(result.reasons.includes('body-block-risk'), true);
});

test('composition validator reports projectile saturation', () => {
  const result = new EncounterCompositionValidator().validate(['sentry', 'sentry', 'sentry', 'sentry', 'sentry'], { targetThreat: 10, allowedEnemyTypes: ALL_TYPES, pattern: genericPattern });
  assert.equal(result.reasons.includes('projectile-saturation'), true);
});

test('composition validator reports threat outside tolerance', () => {
  const low = new EncounterCompositionValidator().validate(['drifter'], { targetThreat: 10, allowedEnemyTypes: ALL_TYPES, pattern: genericPattern });
  const high = new EncounterCompositionValidator().validate(['suppressor', 'bulwark', 'lancer'], { targetThreat: 5, allowedEnemyTypes: ALL_TYPES, pattern: genericPattern });
  assert.equal(low.reasons.includes('threat-too-low'), true);
  assert.equal(high.reasons.includes('threat-too-high'), true);
});

test('EnemySynergyRules flags control-burst recovery pressure', () => {
  const result = new EnemySynergyRules().evaluate({ [ENEMY_ROLES.control]: 1, [ENEMY_ROLES.burst]: 1 });
  assert.equal(result.requiresRecovery, true);
  assert.ok(result.danger > 1);
});

test('EnemySynergyRules rejects hard cap violations', () => {
  const result = new EnemySynergyRules().evaluate({ [ENEMY_ROLES.control]: 2, [ENEMY_ROLES.defender]: 3 });
  assert.equal(result.valid, false);
  assert.deepEqual(new Set(result.violations), new Set(['double-control', 'triple-defender']));
});

test('EncounterHistory enforces bounded history length', () => {
  const history = new EncounterHistory(3);
  for (let index = 0; index < 7; index += 1) history.add({ pattern: `P${index}`, enemyEntries: [{ enemyType: 'drifter' }], generationDiagnostics: {}, recoveryAfterMs: 0 });
  assert.equal(history.snapshot().entries.length, 3);
  assert.equal(history.previousPattern(), 'P6');
});

test('EncounterHistory detects repeated dominant roles', () => {
  const history = new EncounterHistory();
  for (let index = 0; index < 2; index += 1) history.add({ pattern: `P${index}`, enemyEntries: [{ enemyType: 'drifter' }], generationDiagnostics: { dominantRole: ENEMY_ROLES.pressure }, recoveryAfterMs: 0 });
  assert.equal(history.dominantRoleRepeats(ENEMY_ROLES.pressure, 2), true);
  assert.equal(history.dominantRoleRepeats(ENEMY_ROLES.ranged, 1), false);
});

test('SpawnPlanner rejects an impossible point set', () => {
  const points = [{ id: 'blocked', x: 50, y: 50, allowedEnemyTypes: ['drifter'], allowedRoles: [ENEMY_ROLES.pressure], minimumOtherSpawnDistance: 120 }];
  const planner = new SpawnPlanner({ points, validator: new SpawnSafetyValidator({ wallDefinitions: [], worldBounds: { x: 0, y: 0, width: 100, height: 100 } }) });
  const result = planner.plan([{ enemyType: 'drifter', requiredRole: ENEMY_ROLES.pressure, clearanceRadius: 60 }], { random: new SeededRandom(1), playerPosition: { x: 50, y: 50 }, safetyRadius: 260 });
  assert.equal(result.valid, false);
  assert.equal(result.rejections['spawn-capacity'], 1);
});

test('deterministicShuffle does not mutate input', () => {
  const input = ['a', 'b', 'c', 'd'];
  const output = deterministicShuffle(input, new SeededRandom(2));
  assert.deepEqual(input, ['a', 'b', 'c', 'd']);
  assert.deepEqual([...output].sort(), [...input].sort());
});

test('weightedSelection ignores zero and negative weights', () => {
  const random = { next: () => 0.5 };
  assert.equal(weightedSelection([{ value: 'a', weight: 0 }, { value: 'b', weight: -1 }], random), null);
  assert.equal(weightedSelection([{ value: 'a', weight: 0 }, { value: 'b', weight: 2 }], random), 'b');
});

test('Chamber 2 introduces Carrier, Bulwark, and Suppressor in separate encounters before the full-roster finale', () => {
  const newTypes = new Set(['shard-carrier', 'bulwark', 'suppressor']);
  for (let seed = 1; seed <= 100; seed += 1) {
    const descriptors = new EncounterGenerator().generateChamber({
      seed,
      difficultyId: 'standard',
      chamberIndex: 2,
      playerPosition: { x: 800, y: 720 },
      spawnSafetyRadius: 260,
      encounterHistory: new EncounterHistory(),
    });
    const introductions = descriptors.slice(0, 3).map((descriptor) => [
      ...new Set(descriptor.enemyEntries.map((entry) => entry.enemyType).filter((type) => newTypes.has(type))),
    ]);
    assert.equal(introductions.every((types) => types.length === 1), true, `seed ${seed} introduced multiple new types together`);
    assert.deepEqual(new Set(introductions.flat()), newTypes, `seed ${seed} did not introduce each new type exactly once`);
    assert.deepEqual(new Set(descriptors.at(-1).enemyEntries.map((entry) => entry.enemyType)), new Set(Object.keys(CORE_ENEMY_DEFINITIONS)));
  }
});
