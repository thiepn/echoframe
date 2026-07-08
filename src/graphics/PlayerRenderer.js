import { PLAYER_BALANCE } from '../data/playerBalance.js';
import { getPaletteDefinition, getTrailDefinition } from '../data/cosmeticDefinitions.js';

function makeDiamond(scene, x, y, size, color, alpha = 1) {
  return scene.add.polygon(
    x,
    y,
    [0, -size, size, 0, 0, size, -size, 0],
    color,
    alpha,
  );
}

export class PlayerRenderer {
  constructor(scene, settingsManager) {
    this.scene = scene;
    this.settingsManager = settingsManager;
    const selection = settingsManager.getCosmeticSelection?.() ?? { paletteId: 'default', trailId: 'default' };
    this.cosmeticPalette = getPaletteDefinition(selection.paletteId);
    this.cosmeticTrail = getTrailDefinition(selection.trailId);
    this.playerColor = this.cosmeticPalette.playerColor;
    this.trailColor = this.cosmeticTrail.trailColor;
    this.container = scene.add.container(0, 0).setDepth(50);
    this.trail = scene.add
      .rectangle(-22, 0, 34, 7, this.trailColor, 0.22)
      .setOrigin(1, 0.5);
    this.locator = scene.add
      .ellipse(0, 0, 70, 70, 0x000000, 0)
      .setStrokeStyle(2, this.playerColor, 0.55);
    this.outer = makeDiamond(scene, 0, 0, 28, 0xedf7ff, 0.22)
      .setStrokeStyle(2, 0xedf7ff, 0.95);
    this.fins = [
      makeDiamond(scene, 0, -19, 9, this.playerColor, 0.8),
      makeDiamond(scene, 19, 0, 9, this.playerColor, 0.8),
      makeDiamond(scene, 0, 19, 9, this.playerColor, 0.8),
      makeDiamond(scene, -19, 0, 9, this.playerColor, 0.8),
    ];
    this.coreGlow = scene.add.circle(0, 0, 13, this.playerColor, 0.18);
    this.core = scene.add.circle(0, 0, 7, this.playerColor, 1);
    this.aimNose = scene.add.triangle(31, 0, -5, -6, 8, 0, -5, 6, 0xedf7ff, 1);
    this.invulnerabilityRing = scene.add
      .ellipse(0, 0, 78, 78, 0x000000, 0)
      .setStrokeStyle(3, 0xedf7ff, 0.95)
      .setVisible(false);
    this.aimLine = scene.add
      .line(
        0,
        0,
        PLAYER_BALANCE.visuals.aimLineStart,
        0,
        PLAYER_BALANCE.visuals.aimLineStart + PLAYER_BALANCE.visuals.aimLineLength,
        0,
        this.playerColor,
        0.34,
      )
      .setOrigin(0, 0.5);
    this.muzzleFlash = scene.add
      .triangle(40, 0, 0, -7, 15, 0, 0, 7, 0xedf7ff, 0.95)
      .setVisible(false);

    this.container.add([
      this.trail,
      this.locator,
      this.outer,
      ...this.fins,
      this.coreGlow,
      this.core,
      this.aimNose,
      this.invulnerabilityRing,
      this.aimLine,
      this.muzzleFlash,
    ]);

    this.aimAngle = 0;
    this.velocity = { x: 0, y: 0 };
    this.dashing = false;
    this.fireFlashRemainingMs = 0;
    this.elapsedMs = 0;
  }

  setPosition(x, y) {
    this.container.setPosition(x, y);
  }

  setAim(direction) {
    this.aimAngle = Math.atan2(direction.y, direction.x);
    this.aimNose.setRotation(this.aimAngle);
    this.aimLine.setRotation(this.aimAngle);
    this.muzzleFlash.setRotation(this.aimAngle);
  }

  setVelocity(x, y) {
    this.velocity.x = x;
    this.velocity.y = y;
  }

  setDashing(dashing) {
    this.dashing = dashing;
  }

  setInvulnerable(invulnerable) {
    this.invulnerabilityRing.setVisible(invulnerable);
  }

  playFire() {
    this.fireFlashRemainingMs = PLAYER_BALANCE.visuals.muzzleFlashMs;
    this.muzzleFlash.setVisible(true);
  }

  update(deltaMs) {
    this.elapsedMs += deltaMs;
    this.fireFlashRemainingMs = Math.max(0, this.fireFlashRemainingMs - deltaMs);
    this.muzzleFlash.setVisible(this.fireFlashRemainingMs > 0);

    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    const speedRatio = Math.min(1, speed / PLAYER_BALANCE.movement.maximumSpeed);
    const movementAngle = speed > 1 ? Math.atan2(this.velocity.y, this.velocity.x) : 0;
    const idleBreath = 1 + Math.sin(this.elapsedMs * 0.004) * 0.025;
    this.coreGlow.setScale(idleBreath + speedRatio * 0.08);
    this.locator.setRotation(this.elapsedMs * 0.00022);

    const locatorAlpha = this.settingsManager.get(
      'accessibility.persistentPlayerLocator',
      false,
    ) ? 0.9 : 0.5;
    this.locator.setAlpha(locatorAlpha);
    this.aimLine.setVisible(this.settingsManager.get('visual.aimLine', true));

    const highContrast = this.settingsManager.get('visual.highContrast', false);
    this.outer.setStrokeStyle(highContrast ? 4 : 2, 0xedf7ff, 1);
    this.invulnerabilityRing.setStrokeStyle(highContrast ? 5 : 3, 0xedf7ff, 0.95);

    const trailStyle = this.cosmeticTrail.trailStyle;
    if (trailStyle === 'wave') this.trail.setScale(0.7 + speedRatio * 1.4, 1 + Math.sin(this.elapsedMs * 0.018) * 0.35);
    else if (trailStyle === 'segmented') this.trail.setAlpha((Math.floor(this.elapsedMs / 70) % 2 ? 0.16 : 0.34) + speedRatio * 0.12);
    else if (trailStyle === 'station') this.trail.setScale(0.8 + speedRatio * 1.45, 0.65);

    if (this.dashing) {
      this.container.setScale(1.45, 0.72);
      this.container.setRotation(this.aimAngle);
      this.trail.setVisible(true).setScale(2.2, 1.4).setAlpha(0.52);
    } else {
      const lean = Math.min(0.08, speedRatio * 0.08);
      this.container.setScale(1 + lean, 1 - lean * 0.5);
      this.container.setRotation(speedRatio > 0.05 ? movementAngle * 0.04 : 0);
      this.trail
        .setVisible(speedRatio > 0.05)
        .setRotation(movementAngle)
        .setScale(0.55 + speedRatio * 1.2, 1)
        .setAlpha(0.12 + speedRatio * 0.24);
    }
  }

  destroy() {
    this.container.destroy(true);
  }
}
