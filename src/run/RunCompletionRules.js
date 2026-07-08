export function isPreBossRunComplete(run) {
  if (!run?.runPlan) return false;
  const boundary = run.runPlan.segments.find((segment) => segment.segmentId === 'elite-2')
    ?? run.runPlan.segments.at(-1);
  return Boolean(boundary && run.completedSegmentIds?.includes(boundary.segmentId));
}

export function isBossHandoffReady(run) {
  return Boolean(
    run?.bossHandoffAvailable
    && run?.finalUpgradeCompleted
    && run?.runPlan?.bossHandoffAvailable
    && run?.status === 'BOSS_READY',
  );
}
