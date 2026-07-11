import Phaser from 'phaser';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { TUTORIAL_STATES } from '../tutorial/TutorialState.js';
import { MenuButton } from '../ui/MenuButton.js';
import { TutorialScene } from './TutorialScene.js';

export class TutorialSceneHotfix extends TutorialScene {
  create() {
    super.create();

    this.skipTutorialKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.cleanup.add(() => this.input.keyboard.removeKey(this.skipTutorialKey));

    this.exitTutorialButton = new MenuButton(this, {
      x: 1372,
      y: 72,
      width: 126,
      height: 42,
      label: 'EXIT',
      fontSize: 15,
      onActivate: () => this.exitTutorialDirect(),
    });
    this.skipTutorialButton = new MenuButton(this, {
      x: 1510,
      y: 72,
      width: 148,
      height: 42,
      label: 'SKIP [K]',
      fontSize: 15,
      onActivate: () => this.skipTutorial(),
    });
    for (const button of [this.exitTutorialButton, this.skipTutorialButton]) {
      button.container.setDepth(160).setScrollFactor(0);
      this.cleanup.add(() => button.destroy());
    }

    const unsubscribeEchoDeployed = this.services.eventBus.subscribe('echo:deployed', () => {
      if (this.exiting || this.controller.state !== TUTORIAL_STATES.deployEcho) return;
      if (!this.controller.echoDeployed({ source: 'player', deployed: true })) return;
      this.time.delayedCall(0, () => {
        if (this.exiting || this.controller.state !== TUTORIAL_STATES.enterSignalGate) return;
        this.tutorialStatusMessage = 'Echo deployed successfully. Enter the open signal gate.';
        this.tutorialStatusColor = '#72f1b8';
        this.tutorialStatusUntilMs = this.simulationTimeMs + 3200;
        this.hintText?.setColor(this.tutorialStatusColor).setText(this.tutorialStatusMessage);
      });
    }, { owner: this });
    this.cleanup.add(unsubscribeEchoDeployed);
  }

  update(time, delta) {
    if (!this.exiting && Phaser.Input.Keyboard.JustDown(this.skipTutorialKey)) {
      this.skipTutorial();
      return;
    }
    super.update(time, delta);
  }

  exitTutorialDirect() {
    if (this.exiting) return false;
    this.exiting = true;
    this.services.inputManager.suppressHeldActions();
    const targetKey = this.entryMode === 'first-run' ? SCENE_KEYS.mainMenu : this.returnTo;
    this.services.sceneFlow.replace({
      sourceKeys: [SCENE_KEYS.tutorial],
      targetKey,
      payload: targetKey === SCENE_KEYS.archive ? { returnTo: SCENE_KEYS.mainMenu } : {},
      token: `tutorial-direct-exit-${performance.now()}`,
    });
    return true;
  }

  skipTutorial() {
    if (this.exiting || !this.controller.skip(this.simulationTimeMs)) return false;
    this.exiting = true;
    this.services.saveManager.update((draft) => { draft.meta.tutorialCompleted = true; }, { immediate: true });
    this.controller.markExiting();
    this.services.inputManager.suppressHeldActions();

    if (this.entryMode === 'first-run') {
      const save = this.services.saveManager.getSnapshot();
      const requested = this.sceneData.difficultyId ?? 'standard';
      const difficultyId = save.progression.unlockedDifficultyIds.includes(requested) ? requested : 'standard';
      const run = this.services.gameState.createRun({
        difficultyId,
        unlockedUpgradeIds: save.progression.unlockedUpgradeIds,
      });
      this.services.saveManager.update((draft) => {
        draft.statistics.aggregateCounters.runsStarted = (draft.statistics.aggregateCounters.runsStarted ?? 0) + 1;
      }, { immediate: true });
      this.services.sceneFlow.replace({
        sourceKeys: [SCENE_KEYS.tutorial],
        targetKey: SCENE_KEYS.run,
        payload: { runId: run.runId },
        launch: [{ key: SCENE_KEYS.hud, payload: { runId: run.runId } }],
        token: `tutorial-skipped-to-run-${run.runId}`,
      });
      return true;
    }

    this.services.sceneFlow.replace({
      sourceKeys: [SCENE_KEYS.tutorial],
      targetKey: this.returnTo,
      payload: this.returnTo === SCENE_KEYS.archive ? { returnTo: SCENE_KEYS.mainMenu } : {},
      token: `tutorial-skipped-return-${performance.now()}`,
    });
    return true;
  }
}
