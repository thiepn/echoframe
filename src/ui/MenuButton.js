import { PALETTE } from '../data/constants.js';
import { FocusableControl } from './FocusableControl.js';

export class MenuButton extends FocusableControl {
  constructor(scene, {
    x,
    y,
    width = 420,
    height = 54,
    label,
    onActivate,
    fontSize = 22,
  }) {
    super();
    this.scene = scene;
    this.onActivate = onActivate;
    this.container = scene.add.container(x, y);
    this.background = scene.add
      .rectangle(0, 0, width, height, PALETTE.surface, 0.96)
      .setStrokeStyle(2, PALETTE.surfaceHighlight, 1);
    this.marker = scene.add
      .triangle(-width / 2 + 18, 0, -8, -8, 8, 0, -8, 8, PALETTE.playerCyan, 1)
      .setVisible(false);
    this.labelText = scene.add
      .text(0, 0, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${fontSize}px`,
        color: PALETTE.primaryText,
        align: 'center',
        wordWrap: { width: Math.max(80, width - 34) },
      })
      .setOrigin(0.5);

    this.container.add([this.background, this.marker, this.labelText]);
    this.background.setInteractive({ useHandCursor: true });
    this.background.on('pointerover', () => this.focusManager?.focus(this));
    this.background.on('pointerdown', () => {
      if (this.enabled) {
        this.focusManager?.focus(this, { playSound: false });
        this.focusManager?.activateFocused();
      }
    });
  }

  setLabel(label) {
    this.labelText.setText(label);
  }

  setEnabled(enabled) {
    super.setEnabled(enabled);
    this.container.setAlpha(this.enabled ? 1 : 0.45);
    if (this.enabled) {
      this.background.setInteractive({ useHandCursor: true });
    } else {
      this.background.disableInteractive();
    }
  }

  setFocused(focused) {
    super.setFocused(focused);
    this.marker.setVisible(this.focused);
    this.background.setStrokeStyle(
      this.focused ? 3 : 2,
      this.focused ? PALETTE.playerCyan : PALETTE.surfaceHighlight,
      1,
    );
    this.container.setScale(this.focused ? 1.015 : 1);
  }

  activate() {
    if (this.enabled) {
      this.onActivate?.();
    }
  }

  destroy() {
    this.background.removeAllListeners();
    this.container.destroy(true);
  }
}
