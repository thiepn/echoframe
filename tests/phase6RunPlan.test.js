import test from 'node:test';
import assert from 'node:assert/strict';
import { RunPlanGenerator } from '../src/run/RunPlanGenerator.js';
import { PHASE6_RUN_SEGMENTS } from '../src/data/phase6RunSegments.js';
import { RUN_SEGMENT_TYPES } from '../src/run/RunSegmentType.js';
import { isEliteEligible } from '../src/elites/EliteEligibility.js';

const generator = new RunPlanGenerator();
const plan = (seed = 123, difficultyId = 'standard') => generator.generate({ seed, difficultyId });

test('Phase 6 run plan contains the six canonical segments', () => {
  assert.deepEqual(plan().segments.map((segment) => segment.segmentId), ['combat-1', 'combat-2', 'elite-1', 'combat-3', 'combat-4', 'elite-2']);
});

test('Phase 6 run plan has four combat and two elite segments', () => {
  assert.deepEqual(plan().segments.map((segment) => segment.segmentType), [RUN_SEGMENT_TYPES.combat, RUN_SEGMENT_TYPES.combat, RUN_SEGMENT_TYPES.elite, RUN_SEGMENT_TYPES.combat, RUN_SEGMENT_TYPES.combat, RUN_SEGMENT_TYPES.elite]);
});

test('Phase 6 run plan exposes exactly five upgrade boundaries', () => {
  const value = plan();
  assert.equal(value.upgradeOfferCount, 5);
  assert.equal(value.segments.filter((segment) => segment.offerUpgradeAfter).length, 5);
  assert.equal(value.segments.at(-1).offerUpgradeAfter, false);
});

test('Phase 6 run plan exposes exactly two elite milestones', () => assert.equal(plan().expectedEliteCount, 2));

test('Phase 6 stops before boss handoff', () => assert.equal(plan().bossHandoffAvailable, false));

test('run-plan generation is deterministic', () => assert.deepEqual(plan(0x12345678), plan(0x12345678)));

test('run-plan generation changes elite content across seeds', () => {
  const signatures = new Set(Array.from({ length: 30 }, (_, index) => plan(index + 1).segments.filter((segment) => segment.elitePlan).map((segment) => `${segment.elitePlan.modifierId}:${segment.elitePlan.hostEnemyType}`).join('|')));
  assert.ok(signatures.size > 3);
});

test('run plan is deeply immutable', () => {
  const value = plan();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.segments), true);
  assert.equal(Object.isFrozen(value.segments[0]), true);
  assert.equal(Object.isFrozen(value.segments[2].elitePlan), true);
  assert.throws(() => value.segments.push({}), TypeError);
});

test('run plan is serializable and contains no functions', () => {
  const value = plan();
  const json = JSON.stringify(value);
  assert.deepEqual(JSON.parse(json), structuredClone(value));
  assert.equal(json.includes('function'), false);
});

test('run seeds normalize to unsigned 32-bit values', () => assert.equal(plan(-1).seed, 0xffffffff));

test('difficulty is recorded but does not alter canonical segment order', () => {
  const relaxed = plan(99, 'relaxed');
  const overclocked = plan(99, 'overclocked');
  assert.equal(relaxed.difficultyId, 'relaxed');
  assert.equal(overclocked.difficultyId, 'overclocked');
  assert.deepEqual(relaxed.segments.map((segment) => segment.segmentId), overclocked.segments.map((segment) => segment.segmentId));
});

test('Combat 1 only allows Drifter and Sentry', () => assert.deepEqual(plan().segments[0].allowedEnemyTypes, ['drifter', 'sentry']));

test('Combat 2 adds Lancer only', () => assert.deepEqual(plan().segments[1].allowedEnemyTypes, ['drifter', 'sentry', 'lancer']));

test('Elite 1 uses only the introduced early roster', () => assert.deepEqual(plan().segments[2].allowedEnemyTypes, ['drifter', 'sentry', 'lancer']));

test('Combat 3 adds Shard Carrier and Bulwark', () => assert.deepEqual(plan().segments[3].introductionEnemyTypes, ['shard-carrier', 'bulwark']));

test('Combat 4 introduces Suppressor', () => assert.deepEqual(plan().segments[4].introductionEnemyTypes, ['suppressor']));

test('Elite 2 exposes the full six-enemy roster', () => assert.equal(plan().segments[5].allowedEnemyTypes.length, 6));

test('segment threat ranges match canonical data', () => assert.deepEqual(plan().segments.map((segment) => segment.threatRange), PHASE6_RUN_SEGMENTS.map((segment) => segment.threatRange)));

test('segment active threat caps match canonical data', () => assert.deepEqual(plan().segments.map((segment) => segment.activeThreatCap), [6, 8, 8, 10, 12, 12]));

test('every segment has distinct deterministic encounter and elite seeds', () => {
  const value = plan(77);
  assert.equal(new Set(value.segments.map((segment) => segment.encounterSeed)).size, 6);
  assert.equal(new Set(value.segments.map((segment) => segment.eliteSeed)).size, 6);
});

test('named elite RNG streams are present and distinct', () => {
  const streams = plan(77).segments[2].randomStreamSeeds;
  const keys = ['runPlan', 'encounterComposition', 'eliteModifierSelection', 'eliteHostSelection', 'eliteSupportComposition', 'eliteSpawnSelection', 'eliteSpawnOrder', 'eliteCosmeticVariation'];
  assert.deepEqual(Object.keys(streams), keys);
  assert.equal(new Set(Object.values(streams)).size, keys.length);
});

test('elite plans contain deterministic support, spawn, order, and cosmetic seeds', () => {
  const elite = plan(44).segments[2].elitePlan;
  for (const key of ['selectionSeed', 'supportCompositionSeed', 'spawnSelectionSeed', 'spawnOrderSeed', 'cosmeticSeed']) assert.equal(Number.isInteger(elite[key]), true);
  assert.equal(new Set([elite.selectionSeed, elite.supportCompositionSeed, elite.spawnSelectionSeed, elite.spawnOrderSeed, elite.cosmeticSeed]).size, 5);
});

test('Elite 1 and Elite 2 avoid repeating a modifier when alternatives exist', () => {
  for (let seed = 1; seed <= 200; seed += 1) {
    const elites = plan(seed).segments.filter((segment) => segment.elitePlan).map((segment) => segment.elitePlan);
    assert.notEqual(elites[0].modifierId, elites[1].modifierId);
  }
});

test('elite host-modifier pairs do not repeat in one run', () => {
  for (let seed = 1; seed <= 200; seed += 1) {
    const pairs = plan(seed).segments.filter((segment) => segment.elitePlan).map((segment) => `${segment.elitePlan.hostEnemyType}:${segment.elitePlan.modifierId}`);
    assert.equal(new Set(pairs).size, pairs.length);
  }
});

test('Suppressor is never selected for Replicating', () => {
  for (let seed = 1; seed <= 500; seed += 1) {
    for (const segment of plan(seed).segments.filter((entry) => entry.elitePlan)) {
      assert.notDeepEqual([segment.elitePlan.hostEnemyType, segment.elitePlan.modifierId], ['suppressor', 'replicating']);
    }
  }
});

test('every selected elite host-modifier pair is eligible', () => {
  for (let seed = 1; seed <= 200; seed += 1) for (const segment of plan(seed).segments.filter((entry) => entry.elitePlan)) assert.equal(isEliteEligible({ enemyType: segment.elitePlan.hostEnemyType, modifierId: segment.elitePlan.modifierId }), true);
});

test('elite instance IDs are unique within a run', () => {
  const ids = plan(91).segments.filter((segment) => segment.elitePlan).map((segment) => segment.elitePlan.eliteInstanceId);
  assert.equal(new Set(ids).size, 2);
});

test('Replicating plans reserve one enemy slot', () => {
  for (let seed = 1; seed <= 200; seed += 1) for (const segment of plan(seed).segments.filter((entry) => entry.elitePlan?.modifierId === 'replicating')) assert.equal(segment.elitePlan.reservedEnemySlots, 1);
});

test('non-Replicating plans do not reserve a copy slot', () => {
  for (let seed = 1; seed <= 100; seed += 1) for (const segment of plan(seed).segments.filter((entry) => entry.elitePlan && entry.elitePlan.modifierId !== 'replicating')) assert.equal(segment.elitePlan.reservedEnemySlots, 0);
});
