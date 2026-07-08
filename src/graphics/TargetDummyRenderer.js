import { PALETTE } from '../data/constants.js';

export class TargetDummyRenderer {
  constructor(scene, sprite, settingsManager) {
    this.scene = scene;
    this.sprite = sprite;
    this.settingsManager = settingsManager;
    this.baseScale = 1;
    this.hitTween = null;
  }

  playHit() {
    this.hitTween?.stop();
    const reducedFlashes = this.settingsManager.get('visual.reducedFlashes', false);
    this.sprite.setTint(reducedFlashes ? PALETTE.successMint : 0xffffff);
    this.hitTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.9,
      scaleY: 1.1,
      duration: 40,
      yoyo: true,
      onComplete: () => {
        this.sprite.setScale(this.baseScale);
        this.sprite.clearTint();
        this.hitTween = null;
      },
    });
  }

  destroy() {
    this.hitTween?.stop();
    this.hitTween = null;
  }
}
