import { PALETTE } from '../data/constants.js';

export class ProjectileRenderer {
  static configure(projectile, { highContrast = false } = {}) {
    projectile.clearTint();
    projectile.setAlpha(1);
    projectile.setScale(highContrast ? 1.18 : 1);
    if (highContrast) {
      projectile.setTint(0xffffff);
    } else {
      projectile.setTint(PALETTE.playerCyan);
    }
  }
}
