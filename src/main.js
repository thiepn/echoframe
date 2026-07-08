import Phaser from 'phaser';
import { createGameConfig } from './gameConfig.js';
import { MIN_VIEWPORT_HEIGHT, MIN_VIEWPORT_WIDTH } from './data/constants.js';
import { createAppServices } from './systems/AppServices.js';
import { showFatalError } from './systems/FatalErrorPresenter.js';
import './styles/main.css';

let services = null;
let game = null;
let fatalRouted = false;

function routeFatal(code, message) {
  if (fatalRouted) return;
  fatalRouted = true;
  try { game?.destroy?.(true); } catch { /* best-effort shutdown */ }
  showFatalError({ code, message });
}

function updateViewportNotice() {
  const viewportNotice = document.querySelector('#viewport-notice');
  if (!viewportNotice) return;
  const belowMinimum =
    globalThis.innerWidth < MIN_VIEWPORT_WIDTH ||
    globalThis.innerHeight < MIN_VIEWPORT_HEIGHT;
  viewportNotice.hidden = !belowMinimum;
}

globalThis.addEventListener('error', () => {
  routeFatal('EF-RUNTIME-UNCAUGHT', 'An unexpected runtime error stopped the signal.');
});
globalThis.addEventListener('unhandledrejection', () => {
  routeFatal('EF-PROMISE-UNCAUGHT', 'An unexpected asynchronous error stopped the signal.');
});

try {
  services = createAppServices();
  game = new Phaser.Game(createGameConfig(services));
  updateViewportNotice();
  globalThis.addEventListener('resize', updateViewportNotice, { passive: true });

  const publicApi = {
    game,
    getDebugSnapshot: () => services.debugManager.getSnapshot(game),
    getReleaseSnapshot: () => ({
      version: __APP_VERSION__,
      mode: __BUILD_MODE__,
      activeScenes: game.scene.getScenes(true).map((scene) => scene.scene.key),
      save: services.saveManager.getSnapshot(),
      input: services.inputManager.getDiagnostics(),
      audio: services.audioManager.getDiagnostics(),
      deploymentBase: import.meta.env.BASE_URL,
    }),
  };
  if (import.meta.env.DEV || import.meta.env.MODE === 'validation') {
    publicApi.triggerFatal = (code = 'EF-DEV-TRIGGER') => routeFatal(code, 'A development-only fatal presentation was requested.');
  }
  globalThis.__ECHOFRAME__ = Object.freeze(publicApi);
} catch {
  routeFatal('EF-BOOT-FAILED', 'ECHOFRAME could not initialize its required core systems.');
}
