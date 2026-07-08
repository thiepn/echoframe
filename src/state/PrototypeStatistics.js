export class PrototypeStatistics {
  constructor() {
    this.reset();
  }

  reset() {
    this.shotsFired = 0;
    this.targetHits = 0;
    this.dashesUsed = 0;
    this.distanceMoved = 0;
    this.wallCollisions = 0;
    this.projectilePoolPeakUsage = 0;
  }

  recordShot() {
    this.shotsFired += 1;
  }

  recordHit() {
    this.targetHits += 1;
  }

  recordDash() {
    this.dashesUsed += 1;
  }

  recordDistance(distance) {
    if (Number.isFinite(distance) && distance > 0) {
      this.distanceMoved += distance;
    }
  }

  recordWallCollision() {
    this.wallCollisions += 1;
  }

  recordPoolUsage(activeCount) {
    this.projectilePoolPeakUsage = Math.max(
      this.projectilePoolPeakUsage,
      Math.max(0, Math.trunc(activeCount) || 0),
    );
  }

  snapshot() {
    return {
      shotsFired: this.shotsFired,
      targetHits: this.targetHits,
      hitRatio: this.shotsFired > 0 ? this.targetHits / this.shotsFired : 0,
      dashesUsed: this.dashesUsed,
      distanceMoved: this.distanceMoved,
      wallCollisions: this.wallCollisions,
      projectilePoolPeakUsage: this.projectilePoolPeakUsage,
    };
  }
}
