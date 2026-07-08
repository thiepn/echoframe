import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RunPlanGenerator, RUN_PLAN_GENERATIONS } from '../src/run/RunPlanGenerator.js';
import { RunState } from '../src/state/RunState.js';
import { RunProgressionController } from '../src/run/RunProgressionController.js';
import { RUN_SEGMENT_TYPES } from '../src/run/RunSegmentType.js';
import { RecoveryChamberController } from '../src/systems/RecoveryChamberController.js';
import { BossHandoffController } from '../src/systems/BossHandoffController.js';
import { RECOVERY_CHAMBER } from '../src/data/recoveryChamberDefinition.js';

const generator = new RunPlanGenerator({ generationVersion: RUN_PLAN_GENERATIONS.phase7 });

test('Phase 7 run plan is deterministic, immutable, and serializable', () => {
  const a = generator.generate({ seed: 20260706, difficultyId: 'standard' });
  const b = generator.generate({ seed: 20260706, difficultyId: 'standard' });
  assert.deepEqual(a, b);
  assert.ok(Object.isFrozen(a));
  assert.doesNotThrow(() => JSON.stringify(a));
});

test('Phase 7 run plan contains eight segments and seven mandatory upgrades', () => {
  const plan = generator.generate({ seed: 1, difficultyId: 'standard' });
  assert.equal(plan.segments.length, 8);
  assert.equal(plan.upgradeOfferCount, 7);
  assert.equal(plan.expectedEliteCount, 2);
  assert.equal(plan.recoveryChamberIncluded, true);
  assert.equal(plan.bossHandoffAvailable, true);
  assert.equal(plan.bossImplemented, false);
});

const expectedTypes = [
  RUN_SEGMENT_TYPES.combat,
  RUN_SEGMENT_TYPES.combat,
  RUN_SEGMENT_TYPES.elite,
  RUN_SEGMENT_TYPES.combat,
  RUN_SEGMENT_TYPES.combat,
  RUN_SEGMENT_TYPES.elite,
  RUN_SEGMENT_TYPES.recovery,
  RUN_SEGMENT_TYPES.bossHandoff,
];

for (let index = 0; index < expectedTypes.length; index += 1) {
  test(`Phase 7 segment ${index + 1} has the canonical type and arena`, () => {
    const plan = generator.generate({ seed: 99, difficultyId: 'relaxed' });
    const segment = plan.segments[index];
    assert.equal(segment.segmentType, expectedTypes[index]);
    assert.equal(segment.segmentIndex, index);
    assert.ok(segment.arenaDescriptor);
    if (index < 7) assert.equal(segment.offerUpgradeAfter, true);
    else assert.equal(segment.offerUpgradeAfter, false);
  });
}

test('Recovery segment is safe and Boss Handoff references fixed chamber', () => {
  const plan = generator.generate({ seed: 99, difficultyId: 'standard' });
  const recovery = plan.segments[6];
  const handoff = plan.segments[7];
  assert.equal(recovery.arenaDescriptor.hazardConfigurationId, 'none');
  assert.equal(recovery.allowedEnemyTypes.length, 0);
  assert.equal(handoff.arenaDescriptor.templateId, 'boss-chamber');
  assert.equal(handoff.arenaDescriptor.hazardConfigurationId, 'none');
});

for (const difficultyId of ['relaxed', 'standard', 'overclocked']) {
  test(`${difficultyId} Phase 7 plan reproduces exact arena, encounter, elite, and handoff seeds`, () => {
    const first = generator.generate({ seed: 0xdeadbeef, difficultyId });
    const second = generator.generate({ seed: 0xdeadbeef, difficultyId });
    assert.deepEqual(first.arenaSequence, second.arenaSequence);
    assert.deepEqual(first.segments.map((x) => x.encounterSeed), second.segments.map((x) => x.encounterSeed));
    assert.deepEqual(first.segments.map((x) => x.elitePlan), second.segments.map((x) => x.elitePlan));
  });
}

test('RunProgressionController advances through six combat upgrades into recovery', () => {
  const run = new RunState({ runPlanGenerator: generator, seed: 7 });
  const progression = new RunProgressionController(run);
  for (let index = 0; index < 6; index += 1) {
    const segment = progression.markSegmentStarted();
    assert.equal(segment.segmentIndex, index);
    assert.equal(progression.completeCurrentSegment({ durationMs: 1000, endingHealth: 80 }).completed, true);
    assert.equal(progression.beginUpgrade(), index);
    assert.equal(progression.advanceAfterUpgrade().advanced, true);
  }
  assert.equal(progression.currentSegment.segmentType, RUN_SEGMENT_TYPES.recovery);
  assert.equal(run.upgradeOfferIndex, 6);
});

test('Recovery completion opens final upgrade and advances to Boss Handoff', () => {
  const run = new RunState({ runPlanGenerator: generator, seed: 8 });
  const progression = new RunProgressionController(run);
  for (let index = 0; index < 6; index += 1) {
    progression.markSegmentStarted(); progression.completeCurrentSegment(); progression.beginUpgrade(); progression.advanceAfterUpgrade();
  }
  assert.equal(progression.currentSegment.segmentType, RUN_SEGMENT_TYPES.recovery);
  progression.completeCurrentSegment({ durationMs: 20000 });
  assert.equal(progression.beginUpgrade(), 6);
  const next = progression.advanceAfterUpgrade();
  assert.equal(next.advanced, true);
  assert.equal(next.segment.segmentType, RUN_SEGMENT_TYPES.bossHandoff);
  assert.equal(run.upgradeOfferIndex, 7);
});

test('Recovery calibration is pause-safe and auto-completes at canonical limit', () => {
  const controller = new RecoveryChamberController();
  controller.start();
  controller.update(RECOVERY_CHAMBER.minimumCalibrationMs - 1);
  assert.equal(controller.snapshot().ready, false);
  controller.update(5000, { paused: true });
  assert.equal(controller.snapshot().elapsedMs, RECOVERY_CHAMBER.minimumCalibrationMs - 1);
  controller.update(1);
  assert.equal(controller.snapshot().ready, true);
  controller.update(RECOVERY_CHAMBER.autoCompleteMs);
  assert.equal(controller.snapshot().completed, true);
});

test('Recovery terminal activation requires readiness and proximity', () => {
  const controller = new RecoveryChamberController();
  controller.start();
  const terminal = RECOVERY_CHAMBER.terminal;
  assert.equal(controller.canActivate({ x: terminal.x, y: terminal.y }, terminal), false);
  controller.update(RECOVERY_CHAMBER.minimumCalibrationMs);
  assert.equal(controller.canActivate({ x: terminal.x, y: terminal.y }, terminal), true);
  assert.equal(controller.canActivate({ x: 0, y: 0 }, terminal), false);
});

test('Boss Handoff snapshot is BOSS_READY and never claims boss implementation or victory', () => {
  const run = new RunState({ runPlanGenerator: generator, seed: 9 });
  run.playerHealth = 73;
  run.recoveryDurationMs = 21000;
  run.selectedUpgrades.set('split-lens', 2);
  const snapshot = new BossHandoffController().build(run);
  assert.equal(snapshot.status, 'BOSS_READY');
  assert.equal(snapshot.bossImplemented, false);
  assert.equal(snapshot.bossChamberTemplateId, 'boss-chamber');
  assert.equal(snapshot.playerHealth, 73);
  assert.equal(snapshot.selectedUpgrades['split-lens'], 2);
  assert.equal('victory' in snapshot, false);
});

test('RunState debug serialization includes Phase 7 arena, recovery, and boss state', () => {
  const run = new RunState({ runPlanGenerator: generator, seed: 10 });
  run.recoveryStarted = true;
  run.recoveryCompleted = true;
  run.finalUpgradeCompleted = true;
  run.bossHandoffAvailable = true;
  const debug = run.serializeForDebug();
  assert.equal(debug.runPlan.generationVersion, RUN_PLAN_GENERATIONS.phase7);
  assert.equal(debug.arenaSequence.length, 8);
  assert.equal(debug.recoveryCompleted, true);
  assert.equal(debug.finalUpgradeCompleted, true);
  assert.equal(debug.bossHandoffAvailable, true);
});


test('release package and runtime version metadata stay aligned while legacy Phase 7 generation remains available', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const runtimeVersionSource = readFileSync(new URL('../src/utils/version.js', import.meta.url), 'utf8');
  const constantsSource = readFileSync(new URL('../src/data/constants.js', import.meta.url), 'utf8');
  assert.equal(packageJson.version, '1.0.0');
  assert.match(runtimeVersionSource, new RegExp(`BUILD_VERSION = ['"]${packageJson.version}['"]`));
  assert.match(constantsSource, new RegExp(`RELEASE_VERSION = ['"]${packageJson.version}['"]`));
  assert.match(constantsSource, /FOUNDATION_VERSION = RELEASE_VERSION/);
  assert.equal(RUN_PLAN_GENERATIONS.phase7, 2);
});
