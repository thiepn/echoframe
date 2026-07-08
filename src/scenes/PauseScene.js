import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../data/constants.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { ConfirmationModal } from '../ui/ConfirmationModal.js';
import { MenuSceneBase } from './MenuSceneBase.js';

export class PauseScene extends MenuSceneBase {
  constructor(services) { super(SCENE_KEYS.pause, services); }

  create() {
    this.mode = this.sceneData.mode ?? 'run';
    this.returnScene = this.sceneData.returnScene ?? SCENE_KEYS.run;
    this.setupMenu({
      title: 'Paused',
      subtitle: this.mode === 'tutorial' ? 'First Signal training is suspended.' : 'The current run is suspended.',
      onCancel: () => this.#resume(),
    });
    this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x000000, 0.38).setDepth(-1);
    let y = 280;
    this.addButton('Resume', () => this.#resume(), { y }); y += 68;
    this.addButton('Settings', () => this.#settings(), { y }); y += 68;
    this.addButton(this.mode === 'tutorial' ? 'Restart Tutorial' : 'Restart Run', () => this.#confirmRestart(), { y }); y += 68;
    this.addButton(this.mode === 'tutorial' ? 'Exit Tutorial' : 'Return to Main Menu', () => this.#confirmExit(), { y });
  }

  #resume() {
    const resumeKeys = this.mode === 'tutorial' ? [SCENE_KEYS.tutorial] : [this.returnScene, SCENE_KEYS.hud];
    this.services.inputManager.suppressHeldActions();
    this.services.sceneFlow.closeOverlay({ overlayKey: SCENE_KEYS.pause, resumeKeys, token: `resume-${performance.now()}` });
  }

  #settings() {
    this.services.sceneFlow.replace({
      sourceKeys: [SCENE_KEYS.pause],
      targetKey: SCENE_KEYS.settings,
      payload: { returnTo: SCENE_KEYS.pause, returnPayload: structuredClone(this.sceneData) },
      token: `pause-settings-${performance.now()}`,
    });
  }

  #confirmRestart() {
    new ConfirmationModal(this, this.focusManager, {
      title: this.mode === 'tutorial' ? 'Restart tutorial?' : 'Restart run?',
      message: this.mode === 'tutorial' ? 'Current lesson progress will be discarded. Tutorial completion will not be granted.' : 'The current run will be discarded and restarted from Combat 1.',
      confirmLabel: 'Restart',
      onConfirm: () => this.#restart(),
    });
  }

  #confirmExit() {
    new ConfirmationModal(this, this.focusManager, {
      title: this.mode === 'tutorial' ? 'Exit tutorial?' : 'Return to main menu?',
      message: this.mode === 'tutorial' ? 'An incomplete first-run tutorial remains incomplete.' : 'The current run will end without a result record.',
      confirmLabel: this.mode === 'tutorial' ? 'Exit' : 'Return',
      onConfirm: () => this.#exit(),
    });
  }

  #restart() {
    this.services.inputManager.suppressHeldActions();
    if (this.mode === 'tutorial') {
      this.services.sceneFlow.replace({
        sourceKeys: [SCENE_KEYS.pause, SCENE_KEYS.tutorial],
        targetKey: SCENE_KEYS.tutorial,
        payload: this.sceneData.tutorialPayload ?? { mode: 'replay', returnTo: SCENE_KEYS.mainMenu },
        token: `tutorial-restart-${performance.now()}`,
      });
      return;
    }
    const difficultyId = this.services.gameState.activeRun?.difficultyId ?? 'standard';
    const unlockedUpgradeIds = this.services.saveManager.getSnapshot().progression.unlockedUpgradeIds;
    const run = this.services.gameState.createRun({ difficultyId, unlockedUpgradeIds });
    this.services.sceneFlow.replace({
      sourceKeys: [SCENE_KEYS.pause, SCENE_KEYS.run, SCENE_KEYS.boss, SCENE_KEYS.hud],
      targetKey: SCENE_KEYS.run,
      payload: { runId: run.runId },
      launch: [{ key: SCENE_KEYS.hud, payload: { runId: run.runId } }],
      token: `pause-restart-${run.runId}`,
    });
  }

  #exit() {
    this.services.inputManager.suppressHeldActions();
    if (this.mode === 'tutorial') {
      const targetKey = this.sceneData.tutorialPayload?.returnTo ?? SCENE_KEYS.mainMenu;
      this.services.sceneFlow.replace({
        sourceKeys: [SCENE_KEYS.pause, SCENE_KEYS.tutorial],
        targetKey,
        payload: targetKey === SCENE_KEYS.archive ? { returnTo: SCENE_KEYS.mainMenu } : {},
        token: `tutorial-exit-${performance.now()}`,
      });
      return;
    }
    this.services.gameState.disposeRun();
    this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.pause, SCENE_KEYS.run, SCENE_KEYS.boss, SCENE_KEYS.hud], targetKey: SCENE_KEYS.mainMenu, token: `pause-menu-${performance.now()}` });
  }
}
