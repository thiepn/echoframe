import { ECHO_BALANCE } from '../data/echoBalance.js';
import { getPaletteDefinition, getTrailDefinition } from '../data/cosmeticDefinitions.js';

export class EchoRenderer {
  constructor(scene, settingsManager) {
    this.scene = scene;
    this.settingsManager = settingsManager;
    const selection = settingsManager.getCosmeticSelection?.() ?? { paletteId: 'default', trailId: 'default' };
    this.cosmeticPalette = getPaletteDefinition(selection.paletteId);
    this.cosmeticTrail = getTrailDefinition(selection.trailId);
    this.echoColor = this.cosmeticPalette.echoColor;
    this.accentColor = this.cosmeticPalette.playerColor;
    this.spawnRemainingMs = 0;
    this.dissolveRemainingMs = 0;
    this.firePulseRemainingMs = 0;
    this.dashPulseRemainingMs = 0;
    this.scanPhase = 0;
    this.root = scene.add.container(-1000, -1000).setDepth(30).setVisible(false);
    this.groundRing = scene.add.ellipse(0, 0, 62, 32, 0x000000, 0)
      .setStrokeStyle(2, this.echoColor, 0.62);
    this.core = scene.add.polygon(0, 0, [0, -18, 14, 0, 0, 18, -14, 0], this.echoColor, 0.88)
      .setStrokeStyle(2, this.accentColor, 0.72);
    this.segmentTop = scene.add.rectangle(0, -24, 18, 4, this.accentColor, 0.75);
    this.segmentRight = scene.add.rectangle(24, 0, 18, 4, this.echoColor, 0.82).setRotation(Math.PI / 2);
    this.segmentBottom = scene.add.rectangle(0, 24, 18, 4, this.accentColor, 0.68);
    this.segmentLeft = scene.add.rectangle(-24, 0, 18, 4, this.echoColor, 0.78).setRotation(Math.PI / 2);
    this.nose = scene.add.triangle(24, 0, -5, -6, 8, 0, -5, 6, this.accentColor, 0.82);
    this.scanBar = scene.add.rectangle(0, 0, 44, 2, this.accentColor, 0.4);
    this.root.add([
      this.groundRing,
      this.core,
      this.segmentTop,
      this.segmentRight,
      this.segmentBottom,
      this.segmentLeft,
      this.nose,
      this.scanBar,
    ]);
    this.ghosts = [0.16, 0.1, 0.06].map((alpha, index) => scene.add.polygon(
      -1000,
      -1000,
      [0, -16, 12, 0, 0, 16, -12, 0],
      index % 2 === 0 ? this.echoColor : this.accentColor,
      alpha,
    ).setDepth(28 - index).setVisible(false));
    this.lastX = -1000;
    this.lastY = -1000;
    this.lastRotation = 0;
  }

  activate({ x, y, aimRotation }) {
    this.spawnRemainingMs = ECHO_BALANCE.playback.spawnVisualDurationMs;
    this.dissolveRemainingMs = 0;
    this.firePulseRemainingMs = 0;
    this.dashPulseRemainingMs = 0;
    this.scanPhase = 0;
    this.lastX = x;
    this.lastY = y;
    this.lastRotation = aimRotation;
    this.root.setPosition(x, y).setRotation(aimRotation).setScale(0.76).setVisible(true);
    for (const ghost of this.ghosts) {
      ghost.setPosition(x, y).setRotation(aimRotation).setVisible(true);
    }
    this.#applyOpacity(ECHO_BALANCE.playback.minimumOpacity);
  }

  setPlaybackTransform(snapshot, deltaMs) {
    const x = snapshot.x;
    const y = snapshot.y;
    this.lastX = x;
    this.lastY = y;
    this.lastRotation = snapshot.aimRotation;
    this.root.setPosition(x, y).setRotation(snapshot.aimRotation);
    const reducedParticles = this.settingsManager.get('visual.reducedParticles', false);
    const smoothing = reducedParticles ? [0.28, 0.18, 0.1] : [0.38, 0.24, 0.14];
    for (let index = 0; index < this.ghosts.length; index += 1) {
      const ghost = this.ghosts[index];
      const factor = 1 - Math.pow(1 - smoothing[index], Math.max(0.25, deltaMs / 16.67));
      ghost.x += (x - ghost.x) * factor;
      ghost.y += (y - ghost.y) * factor;
      ghost.rotation += (snapshot.aimRotation - ghost.rotation) * factor;
      ghost.setVisible(!reducedParticles || index === 0);
    }
  }

  playFire() {
    this.firePulseRemainingMs = 70;
  }

  playDash(durationMs) {
    this.dashPulseRemainingMs = Math.max(60, Number(durationMs) || 0);
  }

  beginDissolve() {
    this.dissolveRemainingMs = ECHO_BALANCE.playback.dissolveDurationMs;
  }

  update(deltaMs) {
    const delta = Math.max(0, Number(deltaMs) || 0);
    this.scanPhase += delta * 0.012;
    this.scanBar.y = Math.sin(this.scanPhase) * 13;
    this.segmentTop.x = Math.sin(this.scanPhase * 0.67) * 2;
    this.segmentBottom.x = -this.segmentTop.x;

    if (this.spawnRemainingMs > 0) {
      this.spawnRemainingMs = Math.max(0, this.spawnRemainingMs - delta);
      const progress = 1 - this.spawnRemainingMs / ECHO_BALANCE.playback.spawnVisualDurationMs;
      this.root.setScale(0.76 + progress * 0.24);
    } else if (this.dissolveRemainingMs <= 0) {
      this.root.setScale(1);
    }

    this.firePulseRemainingMs = Math.max(0, this.firePulseRemainingMs - delta);
    this.dashPulseRemainingMs = Math.max(0, this.dashPulseRemainingMs - delta);
    const fireScale = this.firePulseRemainingMs > 0 ? 1.12 : 1;
    const dashStretch = this.dashPulseRemainingMs > 0 ? 1.28 : 1;
    this.core.setScale(dashStretch * fireScale, 1 / Math.sqrt(dashStretch));
    this.nose.x = this.firePulseRemainingMs > 0 ? 28 : 24;

    const wasDissolving = this.dissolveRemainingMs > 0;
    if (wasDissolving) {
      this.dissolveRemainingMs = Math.max(0, this.dissolveRemainingMs - delta);
      const ratio = this.dissolveRemainingMs / ECHO_BALANCE.playback.dissolveDurationMs;
      this.#applyOpacity(ECHO_BALANCE.playback.maximumOpacity * ratio);
      this.segmentTop.y = -24 - (1 - ratio) * 14;
      this.segmentBottom.y = 24 + (1 - ratio) * 14;
      this.segmentLeft.x = -24 - (1 - ratio) * 12;
      this.segmentRight.x = 24 + (1 - ratio) * 12;
      this.scanBar.setScale(Math.max(0.05, ratio), 1);
      for (let index = 0; index < this.ghosts.length; index += 1) {
        const baseAlpha = [0.16, 0.1, 0.06][index];
        this.ghosts[index].setAlpha(baseAlpha * ratio);
      }
    } else {
      this.#applyOpacity(ECHO_BALANCE.playback.maximumOpacity);
      for (let index = 0; index < this.ghosts.length; index += 1) {
        this.ghosts[index].setAlpha([0.16, 0.1, 0.06][index]);
      }
      this.segmentTop.y = -24;
      this.segmentBottom.y = 24;
      this.segmentLeft.x = -24;
      this.segmentRight.x = 24;
      this.scanBar.setScale(1, 1);
    }
  }

  get dissolveComplete() {
    return this.dissolveRemainingMs <= 0;
  }

  deactivate() {
    this.root.setVisible(false).setPosition(-1000, -1000).setRotation(0).setScale(1).setAlpha(1);
    for (const ghost of this.ghosts) {
      ghost.setVisible(false).setPosition(-1000, -1000).setRotation(0);
    }
    this.spawnRemainingMs = 0;
    this.dissolveRemainingMs = 0;
    this.firePulseRemainingMs = 0;
    this.dashPulseRemainingMs = 0;
  }

  destroy() {
    this.root.destroy(true);
    for (const ghost of this.ghosts) {
      ghost.destroy();
    }
    this.ghosts = [];
  }

  #applyOpacity(value) {
    const highContrast = this.settingsManager.get('visual.highContrast', false);
    const alpha = Math.max(0, Math.min(ECHO_BALANCE.playback.maximumOpacity, value));
    this.root.setAlpha(alpha);
    this.core.setStrokeStyle(highContrast ? 3 : 2, this.accentColor, highContrast ? 0.95 : 0.72);
  }
}
