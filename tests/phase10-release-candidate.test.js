import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  ACTION_LABELS,
  DEFAULT_BINDINGS,
  GAMEPLAY_ACTIONS,
  bindingLabel,
  clearSecondaryBinding,
  defaultBindingsSnapshot,
  descriptorKey,
  normalizeBindings,
  normalizeDescriptor,
  replaceBinding,
  validateCandidate,
} from '../src/input/BindingCatalog.js';
import { legacyBindingDescriptor, migrateLegacyBindings } from '../src/input/BindingMigration.js';
import { TUTORIAL_ARENA } from '../src/data/tutorialArena.js';
import { createDefaultSaveData } from '../src/state/defaultSaveData.js';
import { validateSaveData } from '../src/state/SaveSchema.js';
import { TutorialController } from '../src/tutorial/TutorialController.js';
import {
  validateCheckpoint,
  validateDashGate,
  validateEchoRearHit,
  validateRecording,
  validateSignalGate,
  validateStationaryTarget,
} from '../src/tutorial/TutorialObjectiveValidator.js';
import { TUTORIAL_SEQUENCE, TUTORIAL_STATES } from '../src/tutorial/TutorialState.js';
import { TUTORIAL_STEPS, TUTORIAL_THRESHOLDS } from '../src/tutorial/TutorialStepCatalog.js';

let registered = 0;
function phase10Test(name, fn) {
  registered += 1;
  test(`Phase 10 · ${name}`, fn);
}

// 140 binding descriptor, conflict, migration, and repair tests.
for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  phase10Test(`keyboard descriptor Key${letter} remains serializable and stable`, () => {
    const value = normalizeDescriptor({ device: 'keyboard', code: `Key${letter}`, ignored: true });
    assert.deepEqual(value, { device: 'keyboard', code: `Key${letter}` });
    assert.equal(descriptorKey(value), `keyboard:Key${letter}`);
    assert.equal(Object.isFrozen(value), true);
  });
}
for (let digit = 0; digit <= 9; digit += 1) {
  phase10Test(`digit descriptor ${digit} is supported`, () => {
    assert.deepEqual(normalizeDescriptor({ device: 'keyboard', code: `Digit${digit}` }), { device: 'keyboard', code: `Digit${digit}` });
  });
}
for (let digit = 0; digit <= 9; digit += 1) {
  phase10Test(`numpad descriptor ${digit} is supported`, () => {
    assert.deepEqual(normalizeDescriptor({ device: 'keyboard', code: `Numpad${digit}` }), { device: 'keyboard', code: `Numpad${digit}` });
  });
}
for (const button of [0, 1, 2]) {
  phase10Test(`pointer button ${button} is supported and labeled`, () => {
    const descriptor = normalizeDescriptor({ device: 'pointer', button });
    assert.deepEqual(descriptor, { device: 'pointer', button });
    assert.notEqual(bindingLabel(descriptor), 'Unbound');
  });
}
const invalidDescriptors = [
  null, undefined, 7, 'KeyW', [], {}, { device: 'touch', button: 0 },
  { device: 'pointer', button: -1 }, { device: 'pointer', button: 3 }, { device: 'pointer', button: 1.5 },
  { device: 'pointer', button: 'left' }, { device: 'keyboard' }, { device: 'keyboard', code: '' },
  { device: 'keyboard', code: 'Tab' }, { device: 'keyboard', code: 'MetaLeft' },
  { device: 'keyboard', code: 'ControlLeft' }, { device: 'keyboard', code: 'AltRight' },
  { device: 'keyboard', code: 'F1' }, { device: 'keyboard', code: 'UnknownKey' },
  { device: 'keyboard', code: 42 },
];
invalidDescriptors.forEach((candidate, index) => phase10Test(`invalid descriptor case ${index + 1} is rejected`, () => {
  assert.equal(normalizeDescriptor(candidate), null);
}));
for (const action of GAMEPLAY_ACTIONS) {
  phase10Test(`default action ${action} is reachable and plain JSON`, () => {
    assert.ok(DEFAULT_BINDINGS[action].length >= 1 && DEFAULT_BINDINGS[action].length <= 2);
    assert.doesNotThrow(() => JSON.stringify(DEFAULT_BINDINGS[action]));
    assert.equal(ACTION_LABELS[action].length > 0, true);
  });
}
const validAlternates = [
  ['moveUp', { device: 'keyboard', code: 'KeyI' }], ['moveUp', { device: 'keyboard', code: 'ArrowUp' }],
  ['moveDown', { device: 'keyboard', code: 'KeyK' }], ['moveDown', { device: 'keyboard', code: 'ArrowDown' }],
  ['moveLeft', { device: 'keyboard', code: 'KeyJ' }], ['moveLeft', { device: 'keyboard', code: 'ArrowLeft' }],
  ['moveRight', { device: 'keyboard', code: 'KeyL' }], ['moveRight', { device: 'keyboard', code: 'ArrowRight' }],
  ['fire', { device: 'keyboard', code: 'KeyF' }], ['fire', { device: 'pointer', button: 1 }],
  ['dash', { device: 'keyboard', code: 'ShiftRight' }], ['dash', { device: 'keyboard', code: 'KeyQ' }],
  ['deployEcho', { device: 'keyboard', code: 'KeyE' }], ['deployEcho', { device: 'pointer', button: 1 }],
  ['pause', { device: 'keyboard', code: 'KeyP' }], ['pause', { device: 'keyboard', code: 'Escape' }],
];
validAlternates.forEach(([action, descriptor], index) => phase10Test(`valid alternate binding ${index + 1} commits deterministically`, () => {
  const result = replaceBinding(defaultBindingsSnapshot(), action, 0, descriptor);
  assert.equal(result.ok, true);
  assert.equal(descriptorKey(result.bindings[action][0]), descriptorKey(descriptor));
  assert.equal(Object.isFrozen(result.bindings), true);
}));
const conflicts = [
  ['moveUp', { device: 'keyboard', code: 'KeyS' }, 'opposing-movement-conflict'],
  ['moveDown', { device: 'keyboard', code: 'KeyW' }, 'opposing-movement-conflict'],
  ['moveLeft', { device: 'keyboard', code: 'KeyD' }, 'opposing-movement-conflict'],
  ['moveRight', { device: 'keyboard', code: 'KeyA' }, 'opposing-movement-conflict'],
  ['fire', { device: 'pointer', button: 2 }, 'binding-conflict'],
  ['dash', { device: 'pointer', button: 0 }, 'binding-conflict'],
  ['deployEcho', { device: 'keyboard', code: 'KeyW' }, 'binding-conflict'],
  ['pause', { device: 'keyboard', code: 'Space' }, 'binding-conflict'],
  ['moveUp', { device: 'keyboard', code: 'Escape' }, 'escape-reserved-for-pause'],
  ['fire', { device: 'keyboard', code: 'Escape' }, 'escape-reserved-for-pause'],
  ['moveLeft', { device: 'keyboard', code: 'ShiftLeft' }, 'modifier-only-reserved'],
  ['deployEcho', { device: 'keyboard', code: 'ShiftRight' }, 'modifier-only-reserved'],
  ['fire', { device: 'pointer', button: 4 }, 'unsupported-input'],
  ['dash', { device: 'keyboard', code: 'F5' }, 'unsupported-input'],
  ['unknown', { device: 'keyboard', code: 'KeyZ' }, 'unknown-action'],
  ['pause', { device: 'keyboard', code: 'KeyD' }, 'binding-conflict'],
];
conflicts.forEach(([action, descriptor, reason], index) => phase10Test(`conflict case ${index + 1} preserves the valid set`, () => {
  const before = defaultBindingsSnapshot();
  const validation = validateCandidate(action, descriptor, before);
  assert.equal(validation.valid, false);
  assert.equal(validation.reason, reason);
  assert.deepEqual(before, defaultBindingsSnapshot());
}));
const legacyByAction = {
  moveUp: 'W', moveDown: 'S', moveLeft: 'A', moveRight: 'D', fire: 'MOUSE_LEFT',
  dash: 'SHIFT_OR_MOUSE_RIGHT', deployEcho: 'SPACE', pause: 'ESC',
};
for (const [action, legacy] of Object.entries(legacyByAction)) {
  phase10Test(`legacy ${legacy} maps correctly for ${action}`, () => {
    const expected = legacyBindingDescriptor(legacy);
    const migrated = migrateLegacyBindings(legacyByAction);
    assert.deepEqual(migrated.bindings[action], expected);
  });
}
for (const omitted of GAMEPLAY_ACTIONS) {
  phase10Test(`missing required action ${omitted} is repaired`, () => {
    const malformed = defaultBindingsSnapshot();
    delete malformed[omitted];
    const result = normalizeBindings(malformed, { repair: true });
    assert.ok(result.bindings[omitted].length >= 1);
    assert.ok(result.issues.some((issue) => issue.startsWith(`${omitted}:`)));
  });
}
for (const action of GAMEPLAY_ACTIONS) {
  phase10Test(`secondary slot operation for ${action} remains bounded`, () => {
    const base = defaultBindingsSnapshot();
    const alternate = { device: 'keyboard', code: `Key${'ZXCVBNMQ'[GAMEPLAY_ACTIONS.indexOf(action)]}` };
    const added = replaceBinding(base, action, 1, alternate);
    if (added.ok) {
      assert.ok(added.bindings[action].length <= 2);
      const cleared = clearSecondaryBinding(added.bindings, action);
      assert.equal(cleared.bindings[action].length, 1);
    } else {
      assert.ok(['binding-conflict', 'opposing-movement-conflict'].includes(added.reason));
    }
  });
}
const labelCases = [
  [{ device: 'keyboard', code: 'KeyW' }, 'W'], [{ device: 'keyboard', code: 'Digit7' }, '7'],
  [{ device: 'keyboard', code: 'ShiftLeft' }, 'Left Shift'], [{ device: 'keyboard', code: 'Space' }, 'Space'],
  [{ device: 'pointer', button: 0 }, 'Left mouse'], [{ device: 'pointer', button: 1 }, 'Middle mouse'],
  [{ device: 'pointer', button: 2 }, 'Right mouse'],
];
labelCases.forEach(([descriptor, label], index) => phase10Test(`display label case ${index + 1} is separate from storage`, () => {
  assert.equal(bindingLabel(descriptor), label);
  const before = structuredClone(descriptor);
  bindingLabel(descriptor);
  assert.deepEqual(descriptor, before);
}));

// 100 deterministic tutorial model and objective tests.
function completeTutorial(seed = 0) {
  const events = [];
  const controller = new TutorialController({ eventBus: { emit: (type, payload) => events.push({ type, payload }) }, entrySource: seed % 2 ? 'archive' : 'first-run' });
  assert.equal(controller.begin(100 + seed), true);
  for (let index = 0; index < 3; index += 1) assert.equal(controller.checkpoint(index, 'player'), true);
  assert.equal(controller.stationaryTarget({ source: 'player', defeated: true }), true);
  assert.equal(controller.dashGate({ owner: 'player', dashing: true, directionValid: true }), true);
  for (let index = 0; index < 4; index += 1) assert.equal(controller.pathCheckpoint(index, 'player'), true);
  assert.equal(controller.recordingQualified({ fireEvents: 4 + seed % 4, spanMs: 3500 + seed }), true);
  assert.equal(controller.echoRearHit({ source: 'echo', rear: true, defeated: true }), true);
  assert.equal(controller.signalGate({ owner: 'player' }, 5100 + seed), true);
  return { controller, events };
}
for (let seed = 0; seed < 10; seed += 1) {
  phase10Test(`valid tutorial timeline ${seed + 1} completes exactly once`, () => {
    const { controller, events } = completeTutorial(seed);
    assert.equal(controller.completed, true);
    assert.equal(controller.state, TUTORIAL_STATES.complete);
    assert.equal(controller.transitionCount, 7);
    assert.equal(events.filter((event) => event.type === 'tutorial:completed').length, 1);
    assert.equal(controller.signalGate({ owner: 'player' }, 6000), false);
  });
}
for (let index = 0; index < 15; index += 1) {
  phase10Test(`checkpoint ownership/order rejection ${index + 1}`, () => {
    const owner = index % 3 === 0 ? 'echo' : index % 3 === 1 ? 'projectile' : 'player';
    const expected = index % 3;
    const actual = owner === 'player' ? (expected + 1) % 3 : expected;
    const result = validateCheckpoint({ owner, index: actual, expectedIndex: expected });
    assert.equal(result.accepted, false);
    assert.ok(['player-only', 'out-of-order'].includes(result.reason));
  });
}
for (let index = 0; index < 15; index += 1) {
  phase10Test(`stationary target rejection ${index + 1}`, () => {
    const payload = index % 2 === 0 ? { source: 'echo', defeated: true } : { source: 'player', defeated: false };
    const result = validateStationaryTarget(payload);
    assert.equal(result.accepted, false);
    assert.ok(['player-projectile-required', 'target-not-defeated'].includes(result.reason));
  });
}
for (let index = 0; index < 15; index += 1) {
  phase10Test(`dash gate rejection ${index + 1}`, () => {
    const payload = index % 3 === 0
      ? { owner: 'echo', dashing: true, directionValid: true }
      : index % 3 === 1
        ? { owner: 'player', dashing: false, directionValid: true }
        : { owner: 'player', dashing: true, directionValid: false };
    const result = validateDashGate(payload);
    assert.equal(result.accepted, false);
    assert.ok(['player-only', 'dash-required', 'wrong-direction'].includes(result.reason));
  });
}
for (let index = 0; index < 15; index += 1) {
  phase10Test(`recording qualification boundary ${index + 1}`, () => {
    const mode = index % 3;
    const payload = mode === 0
      ? { pathCount: 3, fireEvents: 9, spanMs: 9000 }
      : mode === 1
        ? { pathCount: 4, fireEvents: 3, spanMs: 9000 }
        : { pathCount: 4, fireEvents: 9, spanMs: 3499 };
    const result = validateRecording(payload);
    assert.equal(result.accepted, false);
    assert.ok(['path-incomplete', 'insufficient-fire-events', 'insufficient-history'].includes(result.reason));
  });
}
for (let index = 0; index < 15; index += 1) {
  phase10Test(`shield target ownership/arc rejection ${index + 1}`, () => {
    const mode = index % 3;
    const payload = mode === 0
      ? { source: 'player', rear: true, defeated: true }
      : mode === 1
        ? { source: 'echo', rear: false, defeated: true }
        : { source: 'echo', rear: true, defeated: false };
    const result = validateEchoRearHit(payload);
    assert.equal(result.accepted, false);
    assert.ok(['friendly-echo-required', 'rear-hit-required', 'target-not-defeated'].includes(result.reason));
  });
}
const controllerSpecialCases = [
  () => { const c = new TutorialController(); c.setPaused(true); assert.equal(c.begin(), false); assert.equal(c.state, TUTORIAL_STATES.intro); },
  () => { const c = new TutorialController(); c.begin(); c.setPaused(true); assert.equal(c.checkpoint(0), false); assert.equal(c.moveCheckpointIndex, 0); },
  () => { const c = new TutorialController(); assert.equal(c.retryRecording(), false); },
  () => { const c = new TutorialController(); c.begin(); c.checkpoint(0); c.checkpoint(1); c.checkpoint(2); c.stationaryTarget({ source: 'player', defeated: true }); c.dashGate({ owner: 'player', dashing: true }); assert.equal(c.retryRecording(), true); assert.equal(c.pathCheckpointIndex, 0); },
  () => { const { controller } = completeTutorial(); controller.markExiting(); assert.equal(controller.state, TUTORIAL_STATES.exiting); },
  () => { const c = new TutorialController(); for (let i = 0; i < 150; i += 1) c.checkpoint(4, 'echo'); assert.equal(c.invalidActions.length, 100); },
  () => { assert.equal(validateSignalGate({ owner: 'echo' }).accepted, false); assert.equal(validateSignalGate({ owner: 'player' }).accepted, true); },
  () => { const c = new TutorialController(); const frozen = c.snapshot(); assert.equal(Object.isFrozen(frozen), true); },
  () => { const c = new TutorialController(); c.begin(); assert.equal(c.begin(), false); assert.equal(c.transitionCount, 1); },
  () => { const c = new TutorialController(); c.reset(); assert.equal(c.completed, false); assert.equal(c.stepIndex, 0); },
];
controllerSpecialCases.forEach((fn, index) => phase10Test(`controller lifecycle special case ${index + 1}`, fn));
const sequenceMetadataCases = [
  () => assert.equal(TUTORIAL_SEQUENCE[0], TUTORIAL_STATES.intro),
  () => assert.equal(TUTORIAL_SEQUENCE.at(-1), TUTORIAL_STATES.complete),
  () => assert.equal(new Set(TUTORIAL_SEQUENCE).size, TUTORIAL_SEQUENCE.length),
  () => assert.equal(Object.keys(TUTORIAL_STEPS).includes(TUTORIAL_STATES.deployEcho), true),
  () => assert.deepEqual(TUTORIAL_THRESHOLDS, { checkpointRadius: 50, recordingMinimumMs: 3500, recordingPathCheckpoints: 4, recordingFireEvents: 4 }),
];
sequenceMetadataCases.forEach((fn, index) => phase10Test(`tutorial sequence contract ${index + 1}`, fn));

// 70 save migration, preservation, clamping, and untrusted-data tests.
for (let index = 0; index < 10; index += 1) {
  phase10Test(`audio normalization case ${index + 1}`, () => {
    const save = createDefaultSaveData();
    save.settings.audio.masterVolume = index % 2 ? -index : index;
    save.settings.audio.musicVolume = Number.NaN;
    save.settings.audio.effectsVolume = index / 3;
    const normalized = validateSaveData(save).data.settings.audio;
    assert.ok(normalized.masterVolume >= 0 && normalized.masterVolume <= 1);
    assert.ok(normalized.musicVolume >= 0 && normalized.musicVolume <= 1);
    assert.ok(normalized.effectsVolume >= 0 && normalized.effectsVolume <= 1);
  });
}
for (let index = 0; index < 10; index += 1) {
  phase10Test(`visual normalization case ${index + 1}`, () => {
    const save = createDefaultSaveData();
    save.settings.visual.screenShake = index - 4;
    save.settings.visual.hudOpacity = index / 20;
    const visual = validateSaveData(save).data.settings.visual;
    assert.ok(visual.screenShake >= 0 && visual.screenShake <= 1);
    assert.ok(visual.hudOpacity >= 0.5 && visual.hudOpacity <= 1);
  });
}
const booleanPaths = [
  ['settings.audio.muted', false], ['settings.visual.reducedFlashes', false], ['settings.visual.reducedParticles', false],
  ['settings.visual.highContrast', false], ['settings.visual.damageNumbers', true], ['settings.visual.aimLine', true],
  ['settings.accessibility.pauseOnFocusLoss', true], ['settings.accessibility.persistentPlayerLocator', false],
  ['settings.accessibility.largerTelegraphOutlines', false], ['meta.tutorialCompleted', false],
];
function setPath(root, path, value) { const keys = path.split('.'); let current = root; for (const key of keys.slice(0, -1)) current = current[key]; current[keys.at(-1)] = value; }
function getPath(root, path) { return path.split('.').reduce((value, key) => value[key], root); }
booleanPaths.forEach(([path, fallback], index) => phase10Test(`boolean normalization ${index + 1} rejects coercion`, () => {
  const save = createDefaultSaveData();
  setPath(save, path, index % 2 ? 'true' : 1);
  assert.equal(getPath(validateSaveData(save).data, path), fallback);
}));
for (let index = 0; index < 10; index += 1) {
  phase10Test(`progression preservation case ${index + 1}`, () => {
    const save = createDefaultSaveData();
    save.progression.unlockedPaletteIds.push('high-contrast');
    save.progression.selectedPaletteId = 'high-contrast';
    save.statistics.aggregateCounters.totalScore = 1000 + index;
    save.meta.tutorialCompleted = index % 2 === 0;
    const normalized = validateSaveData(save).data;
    assert.equal(normalized.statistics.aggregateCounters.totalScore, 1000 + index);
    assert.equal(normalized.meta.tutorialCompleted, index % 2 === 0);
    assert.ok(normalized.progression.unlockedPaletteIds.includes('default'));
  });
}
for (let index = 0; index < 10; index += 1) {
  phase10Test(`recent-run list remains bounded and unique ${index + 1}`, () => {
    const save = createDefaultSaveData();
    save.records.recentRuns = Array.from({ length: 60 + index }, (_, runIndex) => ({
      runId: `run-${runIndex % 55}`, result: runIndex % 2 ? 'victory' : 'defeat', seed: runIndex,
      difficultyId: 'standard', finalScore: runIndex, durationMs: 1000,
    }));
    const runs = validateSaveData(save).data.records.recentRuns;
    assert.ok(runs.length <= 50);
    assert.equal(new Set(runs.map((run) => run.runId)).size, runs.length);
  });
}
for (let index = 0; index < 10; index += 1) {
  phase10Test(`schema-1 migration preserves Phase 9 data ${index + 1}`, () => {
    const save = createDefaultSaveData();
    save.schemaVersion = 1;
    save.settings.controls.bindings = { ...legacyByAction };
    save.statistics.aggregateCounters.runsStarted = 40 + index;
    save.statistics.personalBests = { highestScore: { value: 9000 + index } };
    save.meta.tutorialCompleted = index % 2 === 1;
    const result = validateSaveData(save);
    assert.equal(result.migrated, true);
    assert.equal(result.data.schemaVersion, 2);
    assert.equal(result.data.statistics.aggregateCounters.runsStarted, 40 + index);
    assert.equal(result.data.statistics.personalBests.highestScore.value, 9000 + index);
    assert.deepEqual(result.data.settings.controls.bindings.moveRight, [{ device: 'keyboard', code: 'KeyD' }]);
  });
}
const malformedRoots = [null, undefined, 5, 'save', [], true, Symbol('x'), () => {}, 42n, false];
malformedRoots.forEach((value, index) => phase10Test(`malformed save root ${index + 1} falls back safely`, () => {
  const result = validateSaveData(value);
  assert.equal(result.data.schemaVersion, 2);
  assert.equal(result.data.meta.tutorialCompleted, false);
  assert.deepEqual(result.data.settings.controls.bindings, defaultBindingsSnapshot());
  assert.ok(result.issues.length >= 1);
}));

// 39 release-facing source, metadata, arena, security, and deployment tests.
const arenaChecks = [
  () => assert.equal(TUTORIAL_ARENA.movementCheckpoints.length, 3),
  () => assert.equal(TUTORIAL_ARENA.recordingPath.length, 4),
  () => assert.ok(TUTORIAL_ARENA.playerSpawn.x > TUTORIAL_ARENA.bounds.left),
  () => assert.ok(TUTORIAL_ARENA.playerSpawn.y > TUTORIAL_ARENA.bounds.top),
  () => assert.ok(TUTORIAL_ARENA.stationaryTarget.x < TUTORIAL_ARENA.dashGate.x),
  () => assert.ok(Math.hypot(TUTORIAL_ARENA.shieldTarget.x - TUTORIAL_ARENA.recordingPath.at(-1).x, TUTORIAL_ARENA.shieldTarget.y - TUTORIAL_ARENA.recordingPath.at(-1).y) > 100),
  () => assert.ok(TUTORIAL_ARENA.signalGate.radius > 0),
  () => assert.ok(TUTORIAL_ARENA.bounds.right <= 1600),
  () => assert.ok(TUTORIAL_ARENA.bounds.bottom <= 900),
  () => assert.equal(Object.isFrozen(TUTORIAL_ARENA), true),
];
arenaChecks.forEach((fn, index) => phase10Test(`authored tutorial arena invariant ${index + 1}`, fn));
const productionFiles = [
  'src/scenes/MainMenuScene.js', 'src/scenes/TutorialScene.js', 'src/scenes/SettingsScene.js',
  'src/scenes/PauseScene.js', 'src/scenes/CreditsScene.js', 'index.html', 'public/manifest.webmanifest',
  'src/main.js', 'src/input/BindingCatalog.js', 'src/state/SaveSchema.js',
];
productionFiles.forEach((file, index) => phase10Test(`production file contract ${index + 1}: ${file}`, () => {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  assert.equal(source.includes('interactive rebinding remains deferred'), false);
  assert.equal(source.includes('pre-boss run complete'), false);
  assert.equal(source.includes('foundation milestone'), false);
  assert.equal(source.includes('not implemented'), false);
  if (file === 'src/scenes/TutorialScene.js') {
    assert.match(source, /hudOpacity/);
    assert.match(source, /largerTelegraphOutlines/);
    assert.match(source, /highContrast/);
  }
  if (file === 'src/scenes/RunScene.js') {
    assert.doesNotMatch(source, /cameras\.main\.shake/);
    assert.match(source, /cameraController\.impulse/);
  }
  if (file === 'src/scenes/TutorialScene.js') {
    const accessibilitySources = [
      'src/systems/ArenaHazardManager.js',
      'src/systems/BossSectorManager.js',
      'src/hostile-echo/HostileEcho.js',
      'src/graphics/NullArchitectRenderer.js',
    ].map((target) => readFileSync(new URL(`../${target}`, import.meta.url), 'utf8')).join('\n');
    assert.match(accessibilitySources, /largerTelegraphOutlines/);
    assert.match(accessibilitySources, /settingsManager/);
  }
}));
const metadataChecks = [
  () => assert.equal(JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version, '1.0.0'),
  () => assert.match(readFileSync(new URL('../src/utils/version.js', import.meta.url), 'utf8'), /BUILD_VERSION\s*=\s*'1\.0\.0'/),
  () => assert.match(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), /deterministic desktop browser action-roguelite/),
  () => assert.doesNotMatch(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), /prototype/i),
  () => assert.doesNotMatch(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'), /prototype/i),
  () => assert.equal(JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url))).start_url, '.'),
  () => assert.match(readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8'), /normalizeBase/),
  () => assert.match(readFileSync(new URL('../src/scenes/MainMenuScene.js', import.meta.url), 'utf8'), /Version 1\.0 ·/),
  () => assert.match(readFileSync(new URL('../src/scenes/CreditsScene.js', import.meta.url), 'utf8'), /Phaser 3\.90\.0/),
];
metadataChecks.forEach((fn, index) => phase10Test(`release metadata contract ${index + 1}`, fn));
const fatalChecks = [
  () => assert.match(readFileSync(new URL('../src/systems/FatalErrorPresenter.js', import.meta.url), 'utf8'), /Error code:/),
  () => assert.match(readFileSync(new URL('../src/systems/FatalErrorPresenter.js', import.meta.url), 'utf8'), /Reload/),
  () => assert.match(readFileSync(new URL('../src/systems/FatalErrorPresenter.js', import.meta.url), 'utf8'), /Clear Local Data/),
  () => assert.doesNotMatch(readFileSync(new URL('../src/systems/FatalErrorPresenter.js', import.meta.url), 'utf8'), /stack\.toString|error\.stack/),
  () => assert.match(readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), /unhandledrejection/),
];
fatalChecks.forEach((fn, index) => phase10Test(`fatal presentation contract ${index + 1}`, fn));
const securityChecks = [
  () => assert.doesNotMatch(readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), /\beval\s*\(/),
  () => assert.doesNotMatch(readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), /new Function\s*\(/),
  () => assert.doesNotMatch(readFileSync(new URL('../src/state/SaveSchema.js', import.meta.url), 'utf8'), /innerHTML\s*=/),
  () => assert.match(readFileSync(new URL('../src/scenes/SettingsScene.js', import.meta.url), 'utf8'), /URL\.revokeObjectURL/),
  () => assert.match(readFileSync(new URL('../src/scenes/SettingsScene.js', import.meta.url), 'utf8'), /input\.remove\(\)/),
];
securityChecks.forEach((fn, index) => phase10Test(`security/privacy source contract ${index + 1}`, fn));

assert.equal(registered, 349, `Expected exactly 349 Phase 10 tests, registered ${registered}.`);
