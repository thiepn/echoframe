import { DESIGN_HEIGHT, DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { MenuButton } from './MenuButton.js';

export class ConfirmationModal {
  constructor(scene, focusManager, {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
  }) {
    this.scene = scene;
    this.focusManager = focusManager;
    this.container = scene.add.container(0, 0).setDepth(1000);
    this.scrim = scene.add
      .rectangle(
        DESIGN_WIDTH / 2,
        DESIGN_HEIGHT / 2,
        DESIGN_WIDTH,
        DESIGN_HEIGHT,
        0x000000,
        0.72,
      )
      .setInteractive();
    this.panel = scene.add.rectangle(
      DESIGN_WIDTH / 2,
      DESIGN_HEIGHT / 2,
      720,
      320,
      PALETTE.surface,
      1,
    ).setStrokeStyle(3, PALETTE.playerCyan, 1);
    this.titleText = scene.add.text(DESIGN_WIDTH / 2, 330, title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      color: PALETTE.primaryText,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.messageText = scene.add.text(DESIGN_WIDTH / 2, 415, message, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: PALETTE.mutedText,
      align: 'center',
      wordWrap: { width: 620 },
    }).setOrigin(0.5);

    const close = () => {
      onCancel?.();
      this.destroy();
    };
    const confirm = () => {
      onConfirm?.();
      this.destroy();
    };

    this.confirmButton = new MenuButton(scene, {
      x: DESIGN_WIDTH / 2 - 160,
      y: 550,
      width: 260,
      label: confirmLabel,
      onActivate: confirm,
    });
    this.cancelButton = new MenuButton(scene, {
      x: DESIGN_WIDTH / 2 + 160,
      y: 550,
      width: 260,
      label: cancelLabel,
      onActivate: close,
    });

    this.container.add([
      this.scrim,
      this.panel,
      this.titleText,
      this.messageText,
      this.confirmButton.container,
      this.cancelButton.container,
    ]);
    this.focusManager.pushModal(
      [this.cancelButton, this.confirmButton],
      close,
    );
    this.focusManager.focus(this.cancelButton, { playSound: false });
  }

  destroy() {
    if (!this.container.active) {
      return;
    }
    this.focusManager.popModal();
    this.confirmButton.destroy();
    this.cancelButton.destroy();
    this.container.destroy(true);
  }
}
