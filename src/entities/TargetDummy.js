import { TEXTURE_KEYS } from '../graphics/TextureFactory.js';
import { TargetDummyRenderer } from '../graphics/TargetDummyRenderer.js';

export class TargetDummy {
  constructor(scene, staticGroup, { id, x, y, settingsManager, debugEnabled }) {
    this.id = id;
    this.hitCount = 0;
    this.sprite = staticGroup.create(x, y, TEXTURE_KEYS.targetDummy);
    this.sprite.setCircle(30, 4, 4);
    this.sprite.refreshBody();
    this.sprite.setData('targetEntity', this);
    this.renderer = new TargetDummyRenderer(scene, this.sprite, settingsManager);
    this.hitLabel = scene.add.text(x, y + 45, '0', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd166',
    }).setOrigin(0.5).setVisible(debugEnabled);
  }

  registerHit() {
    this.hitCount += 1;
    this.hitLabel.setText(String(this.hitCount));
    this.renderer.playHit();
    return this.hitCount;
  }

  reset() {
    this.hitCount = 0;
    this.hitLabel.setText('0');
  }

  destroy() {
    this.renderer.destroy();
    this.hitLabel.destroy();
    this.sprite.destroy();
  }
}
