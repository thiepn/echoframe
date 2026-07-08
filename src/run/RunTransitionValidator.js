export class RunTransitionValidator {
  validate(run, nextIndex, { requireUpgradeLock = false } = {}) {
    const reasons = [];
    if (!run?.runPlan) reasons.push('missing-run-plan');
    if (!Number.isInteger(nextIndex)) reasons.push('invalid-segment-index');
    if (nextIndex < 0 || nextIndex >= (run?.runPlan?.segments?.length ?? 0)) reasons.push('segment-out-of-range');
    if (requireUpgradeLock && !run?.transitionLocked) reasons.push('upgrade-transition-not-locked');
    const current = run?.runPlan?.segments?.[run.currentSegmentIndex];
    if (current && !run?.completedSegmentIds?.includes(current.segmentId)) reasons.push('current-segment-incomplete');
    if (Number.isInteger(nextIndex) && nextIndex !== (run?.currentSegmentIndex ?? -1) + 1) reasons.push('nonsequential-segment');
    return Object.freeze({ valid: reasons.length === 0, reasons: Object.freeze([...new Set(reasons)]) });
  }
}
