import { DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../data/difficulty.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { BUILD_VERSION } from '../utils/version.js';
import { MenuSceneBase } from './MenuSceneBase.js';

export class MainMenuScene extends MenuSceneBase {
  constructor(services) { super(SCENE_KEYS.mainMenu, services); }

  create() {
    const save = this.services.saveManager.getSnapshot();
    this.setupMenu({
      title: 'ECHOFRAME: LAST SIGNAL',
      subtitle: 'Fight with your past. Rebuild the signal.',
    });
    this.add.image(310, 250, 'foundation-player-emblem').setScale(1.7);
    this.add.image(DESIGN_WIDTH - 310, 250, 'foundation-echo-emblem').setScale(1.7);
    this.add.text(DESIGN_WIDTH / 2, 150, `Version 1.0 Release Candidate · ${BUILD_VERSION}`, { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.mutedText }).setOrigin(0.5);
    if ((save.progression.unseenUnlockIds ?? []).length > 0) {
      this.add.text(DESIGN_WIDTH / 2 + 245, 346, `${save.progression.unseenUnlockIds.length} NEW`, { fontFamily: 'monospace', fontSize: '13px', color: '#ffd166', backgroundColor: '#080b14ee', padding: { x: 7, y: 3 } }).setOrigin(0, 0.5);
    }
    let y = 220;
    this.addButton('Start Run', () => this.#startRun(), { y }); y += 58;
    this.difficultyButton = this.addButton(this.#difficultyLabel(), () => this.#cycleDifficulty(), { y }); y += 58;
    this.addButton(save.meta.tutorialCompleted ? 'Replay Tutorial' : 'First Signal Tutorial', () => this.#openTutorial(), { y }); y += 58;
    this.addButton('Archive & Cosmetics', () => this.#open(SCENE_KEYS.archive), { y }); y += 58;
    this.addButton('Statistics', () => this.#open(SCENE_KEYS.statistics), { y }); y += 58;
    this.addButton('Settings', () => this.#open(SCENE_KEYS.settings), { y }); y += 58;
    this.addButton('Credits', () => this.#open(SCENE_KEYS.credits), { y });
  }

  #startRun() {
    this.services.audioManager.ensureStarted();
    const difficultyId = this.#resolvedDifficulty();
    const save = this.services.saveManager.getSnapshot();
    if (!save.meta.tutorialCompleted) {
      this.services.sceneFlow.replace({
        sourceKeys: [SCENE_KEYS.mainMenu],
        targetKey: SCENE_KEYS.tutorial,
        payload: { mode: 'first-run', returnTo: SCENE_KEYS.mainMenu, difficultyId },
        token: `menu-to-first-signal-${performance.now()}`,
      });
      return;
    }
    this.#beginRun(difficultyId, save);
  }

  #beginRun(difficultyId, save = this.services.saveManager.getSnapshot()) {
    const run = this.services.gameState.createRun({ difficultyId, unlockedUpgradeIds: save.progression.unlockedUpgradeIds });
    this.services.saveManager.update((draft) => { draft.statistics.aggregateCounters.runsStarted = (draft.statistics.aggregateCounters.runsStarted ?? 0) + 1; }, { immediate: true });
    this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.mainMenu], targetKey: SCENE_KEYS.run, payload: { runId: run.runId }, launch: [{ key: SCENE_KEYS.hud, payload: { runId: run.runId } }], token: `menu-to-run-${run.runId}` });
  }

  #openTutorial() {
    this.services.audioManager.ensureStarted();
    this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.mainMenu], targetKey: SCENE_KEYS.tutorial, payload: { mode: 'replay', returnTo: SCENE_KEYS.mainMenu }, token: `menu-to-tutorial-${performance.now()}` });
  }

  #open(targetKey) {
    this.services.audioManager.ensureStarted();
    this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.mainMenu], targetKey, payload: { returnTo: SCENE_KEYS.mainMenu }, token: `menu-to-${targetKey}-${performance.now()}` });
  }

  #resolvedDifficulty() {
    const difficultyId = this.services.settingsManager.get('gameplay.lastDifficulty', 'standard');
    const save = this.services.saveManager.getSnapshot();
    return save.progression.unlockedDifficultyIds.includes(difficultyId) ? difficultyId : 'standard';
  }

  #cycleDifficulty() {
    const current = this.services.settingsManager.get('gameplay.lastDifficulty', 'standard');
    const unlocked = this.services.saveManager.getSnapshot().progression.unlockedDifficultyIds;
    const currentIndex = DIFFICULTY_ORDER.indexOf(current);
    for (let offset = 1; offset <= DIFFICULTY_ORDER.length; offset += 1) {
      const candidate = DIFFICULTY_ORDER[(currentIndex + offset) % DIFFICULTY_ORDER.length];
      if (unlocked.includes(candidate)) { this.services.settingsManager.set('gameplay.lastDifficulty', candidate); break; }
    }
    this.difficultyButton.setLabel(this.#difficultyLabel());
  }

  #difficultyLabel() {
    const id = this.services.settingsManager.get('gameplay.lastDifficulty', 'standard');
    const unlocked = this.services.saveManager.getSnapshot().progression.unlockedDifficultyIds;
    const lockedSuffix = id === 'overclocked' && !unlocked.includes(id) ? ' · LOCKED' : '';
    return `Difficulty: ${DIFFICULTIES[id]?.label ?? 'Standard'}${lockedSuffix}`;
  }
}
