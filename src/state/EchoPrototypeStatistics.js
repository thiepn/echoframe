const REJECTION_REASONS = Object.freeze([
  'not-ready',
  'cooldown',
  'active-cap',
  'dashing',
  'transition',
  'paused',
  'disabled',
  'invalid-history',
]);

export class EchoPrototypeStatistics {
  constructor() {
    this.reset();
  }

  reset() {
    this.playerShotsFired = 0;
    this.playerTargetHits = 0;
    this.echoShotsFired = 0;
    this.echoTargetHits = 0;
    this.echoDeployments = 0;
    this.rejectedDeployments = Object.fromEntries(REJECTION_REASONS.map((reason) => [reason, 0]));
    this.echoActiveTimeMs = 0;
    this.echoDamageMetadataContribution = 0;
    this.crossfireEvents = 0;
    this.replayedFireEvents = 0;
    this.replayedDashEvents = 0;
    this.maximumFireEventTimingErrorMs = 0;
    this.maximumPositionInterpolationError = 0;
    this.dashesUsed = 0;
    this.distanceMoved = 0;
    this.wallCollisions = 0;
    this.playerProjectilePoolPeakUsage = 0;
    this.echoProjectilePoolPeakUsage = 0;
    this.recordingBufferWraps = 0;
    this.eventBufferWraps = 0;
  }

  recordShot() { this.recordPlayerShot(); }
  recordPlayerShot() { this.playerShotsFired += 1; }
  recordHit() { this.recordPlayerHit(); }
  recordPlayerHit() { this.playerTargetHits += 1; }
  recordEchoShot(count = 1) { this.echoShotsFired += Math.max(0, Math.trunc(count) || 0); }
  recordEchoHit(scaledDamage = 0) {
    this.echoTargetHits += 1;
    this.echoDamageMetadataContribution += Math.max(0, Number(scaledDamage) || 0);
  }
  recordDeployment() { this.echoDeployments += 1; }
  recordRejectedDeployment(reason) {
    const key = REJECTION_REASONS.includes(reason) ? reason : 'invalid-history';
    this.rejectedDeployments[key] += 1;
  }
  recordEchoActiveTime(deltaMs) { this.echoActiveTimeMs += Math.max(0, Number(deltaMs) || 0); }
  recordCrossfire() { this.crossfireEvents += 1; }
  recordReplayedFireEvent() { this.replayedFireEvents += 1; }
  recordReplayedDashEvent() { this.replayedDashEvents += 1; }
  recordEventTimingError(errorMs) {
    this.maximumFireEventTimingErrorMs = Math.max(
      this.maximumFireEventTimingErrorMs,
      Math.abs(Number(errorMs) || 0),
    );
  }
  recordPositionInterpolationError(error) {
    this.maximumPositionInterpolationError = Math.max(
      this.maximumPositionInterpolationError,
      Math.abs(Number(error) || 0),
    );
  }
  recordDash() { this.dashesUsed += 1; }
  recordDistance(distance) {
    if (Number.isFinite(distance) && distance > 0) {
      this.distanceMoved += distance;
    }
  }
  recordWallCollision() { this.wallCollisions += 1; }
  recordPoolUsage(activeCount) { this.recordPlayerPoolUsage(activeCount); }
  recordPlayerPoolUsage(activeCount) {
    this.playerProjectilePoolPeakUsage = Math.max(
      this.playerProjectilePoolPeakUsage,
      Math.max(0, Math.trunc(activeCount) || 0),
    );
  }
  recordEchoPoolUsage(activeCount) {
    this.echoProjectilePoolPeakUsage = Math.max(
      this.echoProjectilePoolPeakUsage,
      Math.max(0, Math.trunc(activeCount) || 0),
    );
  }
  updateBufferWraps(snapshotWraps, fireWraps, dashWraps) {
    this.recordingBufferWraps = Math.max(0, Math.trunc(snapshotWraps) || 0);
    this.eventBufferWraps = Math.max(
      0,
      (Math.trunc(fireWraps) || 0) + (Math.trunc(dashWraps) || 0),
    );
  }

  snapshot() {
    const totalHits = this.playerTargetHits + this.echoTargetHits;
    return {
      shotsFired: this.playerShotsFired,
      targetHits: totalHits,
      hitRatio: this.playerShotsFired > 0 ? this.playerTargetHits / this.playerShotsFired : 0,
      playerShotsFired: this.playerShotsFired,
      playerTargetHits: this.playerTargetHits,
      playerHitRatio: this.playerShotsFired > 0 ? this.playerTargetHits / this.playerShotsFired : 0,
      echoShotsFired: this.echoShotsFired,
      echoTargetHits: this.echoTargetHits,
      echoHitRatio: this.echoShotsFired > 0 ? this.echoTargetHits / this.echoShotsFired : 0,
      totalHits,
      echoDeployments: this.echoDeployments,
      rejectedDeployments: structuredClone(this.rejectedDeployments),
      echoActiveTimeMs: this.echoActiveTimeMs,
      echoDamageMetadataContribution: this.echoDamageMetadataContribution,
      crossfireEvents: this.crossfireEvents,
      replayedFireEvents: this.replayedFireEvents,
      replayedDashEvents: this.replayedDashEvents,
      maximumFireEventTimingErrorMs: this.maximumFireEventTimingErrorMs,
      maximumPositionInterpolationError: this.maximumPositionInterpolationError,
      dashesUsed: this.dashesUsed,
      distanceMoved: this.distanceMoved,
      wallCollisions: this.wallCollisions,
      projectilePoolPeakUsage: this.playerProjectilePoolPeakUsage,
      playerProjectilePoolPeakUsage: this.playerProjectilePoolPeakUsage,
      echoProjectilePoolPeakUsage: this.echoProjectilePoolPeakUsage,
      recordingBufferWraps: this.recordingBufferWraps,
      eventBufferWraps: this.eventBufferWraps,
    };
  }
}
