import Phaser from 'phaser';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { CleanupRegistry } from '../utils/CleanupRegistry.js';
import { DebugOverlay } from '../ui/DebugOverlay.js';

export class BaseScene extends Phaser.Scene {
  constructor(key, services) {
    super({ key });
    this.services = services;
    this.cleanup = null;
    this.inputContext = null;
    this.focusManager = null;
    this.debugOverlay = null;
    this.sceneData = {};
  }

  init(data = {}) {
    this.sceneData = data;
    this.cleanup = new CleanupRegistry(this.scene.key);
    this.services.debugManager.registerCleanupRegistry(this.cleanup);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.#shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.#shutdown, this);
  }

  beginScene({ input = true } = {}) {
    this.services.attachGame(this.game);
    this.cameras.main.setBackgroundColor(PALETTE.void);
    if (input) {
      this.inputContext = this.services.inputManager.createContext(
        this,
        this.cleanup,
      );
    }
  }

  createFoundationBackground() {
    if (this.textures.exists('foundation-grid')) {
      this.add.tileSprite(
        DESIGN_WIDTH / 2,
        DESIGN_HEIGHT / 2,
        DESIGN_WIDTH,
        DESIGN_HEIGHT,
        'foundation-grid',
      ).setAlpha(0.35);
    }

    this.add.rectangle(
      DESIGN_WIDTH / 2,
      DESIGN_HEIGHT / 2,
      DESIGN_WIDTH - 80,
      DESIGN_HEIGHT - 80,
      PALETTE.background,
      0.42,
    ).setStrokeStyle(2, PALETTE.surfaceHighlight, 0.5);
  }

  createHeader(title, subtitle = '') {
    this.add.text(DESIGN_WIDTH / 2, 70, title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '44px',
      color: PALETTE.primaryText,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (subtitle) {
      this.add.text(DESIGN_WIDTH / 2, 120, subtitle, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: PALETTE.mutedText,
        align: 'center',
        wordWrap: { width: 1100 },
      }).setOrigin(0.5);
    }
  }

  mountDebugOverlay() {
    this.debugOverlay = new DebugOverlay(this, this.services.debugManager);
    this.cleanup.add(() => this.debugOverlay?.destroy());
  }

  updateDebug(time, delta) {
    this.debugOverlay?.update(time, delta);
  }

  #shutdown() {
    if (!this.cleanup) {
      return;
    }
    this.focusManager?.destroy();
    this.focusManager = null;
    this.services.debugManager.unregisterCleanupRegistry(this.cleanup);
    this.cleanup.cleanup();
    this.cleanup = null;
    this.inputContext = null;
    this.debugOverlay = null;
  }
}
