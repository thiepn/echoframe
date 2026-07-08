import test from 'node:test';
import assert from 'node:assert/strict';
import { RunState } from '../src/state/RunState.js';
import { RunProgressionController } from '../src/run/RunProgressionController.js';
import { RunTransitionValidator } from '../src/run/RunTransitionValidator.js';
import { isPreBossRunComplete } from '../src/run/RunCompletionRules.js';
import { EliteTelemetry } from '../src/systems/EliteTelemetry.js';

function create() {
  const run = new RunState({ runId: 'phase6-test', seed: 12345, difficultyId: 'standard' });
  return { run, controller: new RunProgressionController(run) };
}

test('RunProgressionController starts Combat 1', () => {
  const { run, controller } = create();
  const segment = controller.markSegmentStarted();
  assert.equal(segment.segmentId, 'combat-1');
  assert.equal(run.currentSegmentIndex, 0);
  assert.equal(run.segmentHealthStart['combat-1'], 100);
});

test('segment completion records duration and health exactly once', () => {
  const { run, controller } = create(); controller.markSegmentStarted();
  const result = controller.completeCurrentSegment({ durationMs: 1234, endingHealth: 72 });
  assert.equal(result.completed, true);
  assert.equal(run.segmentDurations['combat-1'], 1234);
  assert.equal(run.segmentHealthEnd['combat-1'], 72);
  assert.equal(controller.completeCurrentSegment().completed, false);
});

test('upgrade cannot begin before the current segment completes', () => {
  const { controller } = create(); controller.markSegmentStarted();
  assert.equal(controller.beginUpgrade(), null);
});

test('upgrade lock is established after an upgrade-bearing segment', () => {
  const { run, controller } = create(); controller.markSegmentStarted(); controller.completeCurrentSegment();
  assert.equal(controller.beginUpgrade(), 0);
  assert.equal(run.transitionLocked, true);
});

test('advanceAfterUpgrade rejects missing transition lock', () => {
  const { controller } = create(); controller.markSegmentStarted(); controller.completeCurrentSegment();
  const result = controller.advanceAfterUpgrade();
  assert.equal(result.advanced, false);
  assert.ok(result.reasons.includes('upgrade-transition-not-locked'));
});

test('advanceAfterUpgrade moves sequentially and increments offer index', () => {
  const { run, controller } = create(); controller.markSegmentStarted(); controller.completeCurrentSegment(); controller.beginUpgrade();
  const result = controller.advanceAfterUpgrade();
  assert.equal(result.advanced, true);
  assert.equal(result.segment.segmentId, 'combat-2');
  assert.equal(run.currentSegmentIndex, 1);
  assert.equal(run.upgradeOfferIndex, 1);
  assert.equal(run.transitionLocked, false);
});

test('all five mandatory upgrade boundaries advance to Elite 2', () => {
  const { run, controller } = create(); controller.markSegmentStarted();
  for (let index = 0; index < 5; index += 1) {
    const completion = controller.completeCurrentSegment({ durationMs: 1000 + index, endingHealth: 90 - index });
    assert.equal(completion.requiresUpgrade, true);
    assert.equal(controller.beginUpgrade(), index);
    assert.equal(controller.advanceAfterUpgrade().advanced, true);
  }
  assert.equal(run.currentSegmentIndex, 5);
  assert.equal(controller.currentSegment.segmentId, 'elite-2');
  assert.equal(run.upgradeOfferIndex, 5);
});

test('elite segment completions increment elite counter', () => {
  const { run, controller } = create(); controller.markSegmentStarted();
  for (let index = 0; index < 3; index += 1) {
    controller.completeCurrentSegment();
    if (index < 2) { controller.beginUpgrade(); controller.advanceAfterUpgrade(); }
  }
  assert.equal(run.currentSegmentId, 'elite-1');
  assert.equal(run.eliteEncountersCompleted, 1);
});

test('pre-boss completion becomes true only after Elite 2 completes', () => {
  const { run, controller } = create(); controller.markSegmentStarted();
  for (let index = 0; index < 6; index += 1) {
    controller.completeCurrentSegment();
    if (index < 5) { controller.beginUpgrade(); controller.advanceAfterUpgrade(); }
  }
  assert.equal(isPreBossRunComplete(run), true);
});

test('RunTransitionValidator rejects nonsequential movement', () => {
  const { run, controller } = create(); controller.markSegmentStarted(); controller.completeCurrentSegment(); run.transitionLocked = true;
  const result = new RunTransitionValidator().validate(run, 3, { requireUpgradeLock: true });
  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes('nonsequential-segment'));
});

test('RunTransitionValidator rejects incomplete current segment', () => {
  const { run } = create(); run.transitionLocked = true;
  const result = new RunTransitionValidator().validate(run, 1, { requireUpgradeLock: true });
  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes('current-segment-incomplete'));
});

test('RunState reset clears Phase 6 progression state', () => {
  const { run, controller } = create(); controller.markSegmentStarted(); controller.completeCurrentSegment(); controller.beginUpgrade(); controller.advanceAfterUpgrade();
  run.eliteModifiersDefeated.push('overclocked'); run.preBossComplete = true;
  run.reset();
  assert.equal(run.currentSegmentIndex, 0);
  assert.deepEqual(run.completedSegmentIds, []);
  assert.equal(run.upgradeOfferIndex, 0);
  assert.deepEqual(run.eliteModifiersDefeated, []);
  assert.equal(run.preBossComplete, false);
});

test('RunState debug serialization includes complete run-plan progression', () => {
  const { run } = create();
  const snapshot = run.serializeForDebug();
  assert.equal(snapshot.runPlan.segments.length, 6);
  assert.equal(snapshot.runPlan.upgradeOfferCount, 5);
  assert.equal(snapshot.runPlan.expectedEliteCount, 2);
  assert.doesNotThrow(() => JSON.stringify(snapshot));
});

test('EliteTelemetry tracks modifier, host, copies, shields, and TTK', () => {
  const telemetry = new EliteTelemetry();
  telemetry.recordHost('lancer', 'replicating');
  telemetry.replicationTriggers += 1; telemetry.copiesSpawned += 1; telemetry.copiesDefeated += 1;
  telemetry.resonantTriggers += 1; telemetry.shieldGranted += 24; telemetry.shieldAbsorbed += 12;
  telemetry.recordDefeat('echo', 2500);
  const snapshot = telemetry.snapshot();
  assert.equal(snapshot.hostModifierPairs['lancer:replicating'], 1);
  assert.equal(snapshot.copiesSpawned, 1);
  assert.equal(snapshot.shieldAbsorbed, 12);
  assert.equal(snapshot.averageTimeToKillMs, 2500);
  assert.equal(snapshot.eliteDefeatsBySource.echo, 1);
});

test('EliteTelemetry reset removes prior lifecycle ownership statistics', () => {
  const telemetry = new EliteTelemetry(); telemetry.recordHost('drifter', 'overclocked'); telemetry.recordDefeat('player', 1000); telemetry.reset();
  const snapshot = telemetry.snapshot();
  assert.equal(snapshot.hostsSpawned, 0);
  assert.deepEqual(snapshot.hosts, {});
  assert.deepEqual(snapshot.timeToKillMs, []);
});
