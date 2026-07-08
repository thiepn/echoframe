import { RunTransitionValidator } from './RunTransitionValidator.js';

export class RunProgressionController {
  constructor(run, validator = new RunTransitionValidator()) { this.run = run; this.validator = validator; }
  get currentSegment() { return this.run.runPlan.segments[this.run.currentSegmentIndex] ?? null; }

  markSegmentStarted() {
    const segment = this.currentSegment;
    if (!segment) return null;
    this.run.currentSegmentId = segment.segmentId;
    this.run.currentSegmentType = segment.segmentType;
    this.run.currentChamberIndex = segment.chamberIndex;
    this.run.currentChamberId = segment.segmentId;
    this.run.currentSegmentSeed = segment.encounterSeed ?? segment.arenaSeed ?? this.run.seed;
    this.run.currentArenaId = segment.arenaDescriptor?.arenaInstanceId ?? null;
    if (segment.arenaDescriptor && !this.run.arenaHistory.includes(segment.arenaDescriptor.templateId)) this.run.arenaHistory.push(segment.arenaDescriptor.templateId);
    if (segment.arenaDescriptor && !this.run.hazardHistory.includes(segment.arenaDescriptor.hazardConfigurationId)) this.run.hazardHistory.push(segment.arenaDescriptor.hazardConfigurationId);
    if (!(segment.segmentId in this.run.segmentHealthStart)) this.run.segmentHealthStart[segment.segmentId] = this.run.playerHealth;
    return segment;
  }

  completeCurrentSegment({ durationMs = 0, endingHealth = this.run.playerHealth } = {}) {
    const segment = this.currentSegment;
    if (!segment || this.run.completedSegmentIds.includes(segment.segmentId)) return Object.freeze({ completed: false, reason: 'already-complete-or-missing' });
    this.run.completedSegmentIds.push(segment.segmentId);
    this.run.segmentDurations[segment.segmentId] = Math.max(0, Number(durationMs) || 0);
    this.run.segmentHealthEnd[segment.segmentId] = Math.max(0, Number(endingHealth) || 0);
    if (segment.requiresElite) this.run.eliteEncountersCompleted += 1;
    return Object.freeze({ completed: true, segment, requiresUpgrade: segment.offerUpgradeAfter, runComplete: this.run.currentSegmentIndex >= this.run.runPlan.segments.length - 1 });
  }

  beginUpgrade() {
    const segment = this.currentSegment;
    if (!segment?.offerUpgradeAfter || !this.run.completedSegmentIds.includes(segment.segmentId)) return null;
    this.run.transitionLocked = true;
    return this.run.upgradeOfferIndex;
  }

  advanceAfterUpgrade() {
    const nextIndex = this.run.currentSegmentIndex + 1;
    const validation = this.validator.validate(this.run, nextIndex, { requireUpgradeLock: true });
    if (!validation.valid) return Object.freeze({ advanced: false, reasons: validation.reasons });
    this.run.currentSegmentIndex = nextIndex;
    this.run.upgradeOfferIndex += 1;
    this.run.transitionLocked = false;
    const segment = this.markSegmentStarted();
    return Object.freeze({ advanced: true, segment });
  }

  resetTransitionLock() { this.run.transitionLocked = false; }
  snapshot() { return Object.freeze({ currentSegmentIndex: this.run.currentSegmentIndex, currentSegment: this.currentSegment, upgradeOfferIndex: this.run.upgradeOfferIndex, completedSegmentIds: Object.freeze([...this.run.completedSegmentIds]), transitionLocked: this.run.transitionLocked }); }
}
