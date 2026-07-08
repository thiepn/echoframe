import { AudioManager } from './AudioManager.js';
import { DebugManager } from './DebugManager.js';
import { InputManager } from './InputManager.js';
import { SaveManager } from './SaveManager.js';
import { SceneFlowController } from './SceneFlowController.js';
import { SettingsManager } from './SettingsManager.js';
import { GameState } from '../state/GameState.js';
import { EventBus } from '../utils/EventBus.js';
import { RunFinalizationService } from './RunFinalizationService.js';
import { ProgressionManager } from '../progression/ProgressionManager.js';

export function createAppServices() {
  const eventBus = new EventBus();
  const debugManager = new DebugManager({ eventBus });
  const audioManager = new AudioManager({ eventBus });
  const saveManager = new SaveManager({ eventBus });
  const settingsManager = new SettingsManager({ saveManager, audioManager, eventBus });
  const inputManager = new InputManager({ eventBus, bindingProvider: () => settingsManager.get('controls.bindings', {}) });
  settingsManager.getCosmeticSelection = () => {
    const progression = saveManager.getSnapshot().progression;
    return Object.freeze({ paletteId: progression.selectedPaletteId ?? 'default', trailId: progression.selectedTrailId ?? 'default' });
  };
  const gameState = new GameState();
  const progressionManager = new ProgressionManager();
  const runFinalizationService = new RunFinalizationService({ saveManager, progressionManager });
  const sceneFlow = new SceneFlowController({ eventBus, inputManager, debugManager });

  const services = {
    eventBus, debugManager, inputManager, audioManager, saveManager, settingsManager,
    gameState, sceneFlow, runFinalizationService, progressionManager, game: null,
    attachGame(game) {
      if (this.game === game) return;
      this.game = game;
      inputManager.attachGame(game); sceneFlow.attachGame(game); debugManager.configure(this);
      const visibilityHandler = () => {
        audioManager.handleVisibility(document.hidden);
        inputManager.suppressHeldActions();
        if (document.hidden && settingsManager.get('accessibility.pauseOnFocusLoss', true)) eventBus.emit('run:pause:requested', { source: 'focus-loss' });
      };
      document.addEventListener('visibilitychange', visibilityHandler);
      globalThis.addEventListener('blur', () => inputManager.suppressHeldActions());
      globalThis.addEventListener('beforeunload', () => saveManager.flush(), { once: true });
    },
  };
  return services;
}
