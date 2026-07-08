import { PALETTE } from '../data/constants.js';
import { TEXTURE_KEYS } from '../graphics/TextureFactory.js';

export class CompletionTerminal {
  constructor(scene, { x, y }) {
    this.scene = scene;
    this.sprite = scene.add.image(x, y, TEXTURE_KEYS.completionTerminal).setDepth(20);
    this.ring = scene.add
      .ellipse(x, y, 104, 104, 0x000000, 0)
      .setStrokeStyle(3, PALETTE.disabledText, 0.7)
      .setDepth(19);
    this.label = scene.add.text(x, y + 70, 'TERMINAL LOCKED', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: PALETTE.disabledText,
      backgroundColor: '#080b14cc',
      padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setDepth(21);
    this.active = false;
    this.near = false;
    this.elapsed = 0;
  }

  setActive(active) {
    this.active = Boolean(active);
    this.sprite.setAlpha(this.active ? 1 : 0.38);
    this.ring.setStrokeStyle(
      this.active ? 4 : 3,
      this.active ? PALETTE.successMint : PALETTE.disabledText,
      this.active ? 0.95 : 0.7,
    );
    this.#refreshLabel();
  }

  setNear(near) {
    this.near = Boolean(near);
    this.#refreshLabel();
  }

  update(deltaMs) {
    this.elapsed += deltaMs;
    this.sprite.setRotation(this.elapsed * 0.00035);
    if (this.active) {
      const pulse = 1 + Math.sin(this.elapsed * 0.006) * 0.04;
      this.ring.setScale(pulse);
    }
  }

  #refreshLabel() {
    if (!this.active) {
      this.label.setText('TERMINAL LOCKED').setColor(PALETTE.disabledText);
    } else if (this.near) {
      this.label.setText('PRESS ENTER TO COMPLETE').setColor(PALETTE.successMint);
    } else {
      this.label.setText('TERMINAL READY').setColor(PALETTE.successMint);
    }
  }

  destroy() {
    this.sprite.destroy();
    this.ring.destroy();
    this.label.destroy();
  }
}
