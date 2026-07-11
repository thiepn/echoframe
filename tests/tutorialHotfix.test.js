import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventBus } from '../src/utils/EventBus.js';
import { TutorialController } from '../src/tutorial/TutorialController.js';
import { TUTORIAL_STATES } from '../src/tutorial/TutorialState.js';

function advanceToDeployment(controller) {
  controller.begin(100);
  for (let index = 0; index < 3; index += 1) controller.checkpoint(index, 'player');
  controller.stationaryTarget({ source: 'player', defeated: true });
  controller.dashGate({ owner: 'player', dashing: true, directionValid: true });
  for (let index = 0; index < 4; index += 1) controller.pathCheckpoint(index, 'player');
  controller.recordingQualified({ fireEvents: 4, spanMs: 3500 });
  assert.equal(controller.state, TUTORIAL_STATES.deployEcho);
}

test('successful Echo deployment advances lesson 5 exactly once', () => {
  const controller = new TutorialController();
  advanceToDeployment(controller);

  assert.equal(controller.echoDeployed({ source: 'player', deployed: true }), true);
  assert.equal(controller.state, TUTORIAL_STATES.enterSignalGate);
  assert.equal(controller.pathCheckpointIndex, 4);
  assert.equal(controller.echoDeployed({ source: 'player', deployed: true }), false);
  assert.equal(controller.state, TUTORIAL_STATES.enterSignalGate);
});

test('Echo deployment event integration is owner-scoped and does not re-record lesson 4', () => {
  const eventBus = new EventBus();
  const controller = new TutorialController({ eventBus });
  advanceToDeployment(controller);
  const owner = {};
  const unsubscribe = eventBus.subscribe('echo:deployed', () => {
    controller.echoDeployed({ source: 'player', deployed: true });
  }, { owner });

  eventBus.emit('echo:deployed', { echoInstanceId: 1 });
  assert.equal(controller.state, TUTORIAL_STATES.enterSignalGate);
  assert.equal(controller.pathCheckpointIndex, 4);
  unsubscribe();
});

test('tutorial can be skipped from any incomplete stage', () => {
  const controller = new TutorialController();
  controller.begin(100);
  assert.equal(controller.skip(500), true);
  assert.equal(controller.completed, true);
  assert.equal(controller.state, TUTORIAL_STATES.complete);
  assert.equal(controller.skip(600), false);
});

test('configured tutorial scene exposes clickable exit and skip controls', () => {
  const hotfix = readFileSync(new URL('../src/scenes/TutorialSceneHotfix.js', import.meta.url), 'utf8');
  const config = readFileSync(new URL('../src/gameConfig.js', import.meta.url), 'utf8');

  assert.match(config, /TutorialSceneHotfix/);
  assert.match(hotfix, /label: 'EXIT'/);
  assert.match(hotfix, /label: 'SKIP \[K\]'/);
  assert.match(hotfix, /subscribe\('echo:deployed'/);
  assert.match(hotfix, /controller\.echoDeployed/);
  assert.match(hotfix, /draft\.meta\.tutorialCompleted = true/);
});
