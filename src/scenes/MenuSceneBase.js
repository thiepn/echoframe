import { DESIGN_WIDTH } from '../data/constants.js';
import { UIFocusManager } from '../systems/UIFocusManager.js';
import { MenuButton } from '../ui/MenuButton.js';
import { BaseScene } from './BaseScene.js';

export class MenuSceneBase extends BaseScene {
  constructor(key, services) {
    super(key, services);
    this.buttons = [];
  }

  setupMenu({ title, subtitle = '', onCancel = null, debug = true } = {}) {
    this.beginScene({ input: true });
    this.createFoundationBackground();
    this.createHeader(title, subtitle);
    this.focusManager = new UIFocusManager({
      inputContext: this.inputContext,
      audioManager: this.services.audioManager,
      onCancel,
    });
    this.cleanup.add(() => {
      for (const button of this.buttons) {
        button.destroy();
      }
      this.buttons = [];
    });
    if (debug) {
      this.mountDebugOverlay();
    }
  }

  addButton(label, onActivate, {
    x = DESIGN_WIDTH / 2,
    y,
    width = 440,
    height = 52,
    fontSize = 21,
    enabled = true,
  }) {
    const button = new MenuButton(this, {
      x,
      y,
      width,
      height,
      label,
      onActivate,
      fontSize,
    });
    button.setEnabled(enabled);
    this.buttons.push(button);
    this.focusManager.register(button);
    return button;
  }

  clearButtons() {
    for (const button of this.buttons) {
      this.focusManager.unregister(button);
      button.destroy();
    }
    this.buttons = [];
  }

  update(time, delta) {
    if (!this.services.inputManager.locked) {
      this.focusManager?.update();
    }
    this.updateDebug(time, delta);
  }
}
