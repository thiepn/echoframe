function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
}

export function createScoreEvent(data) {
  const record = {
    scoreEventId: String(data.scoreEventId),
    runId: String(data.runId),
    sequenceNumber: Math.max(1, Math.trunc(data.sequenceNumber)),
    simulationMs: Math.max(0, Number(data.simulationMs) || 0),
    segmentId: data.segmentId === null || data.segmentId === undefined ? null : String(data.segmentId),
    segmentType: data.segmentType === null || data.segmentType === undefined ? null : String(data.segmentType),
    eventType: String(data.eventType),
    sourceKind: data.sourceKind === null || data.sourceKind === undefined ? null : String(data.sourceKind),
    sourceId: data.sourceId === null || data.sourceId === undefined ? null : String(data.sourceId),
    targetKind: data.targetKind === null || data.targetKind === undefined ? null : String(data.targetKind),
    targetId: data.targetId === null || data.targetId === undefined ? null : String(data.targetId),
    basePoints: Math.round(Number(data.basePoints) || 0),
    stageScalar: Number.isFinite(data.stageScalar) ? data.stageScalar : 1,
    comboBefore: Number.isFinite(data.comboBefore) ? data.comboBefore : 0,
    comboGain: Number.isFinite(data.comboGain) ? data.comboGain : 0,
    comboAfter: Number.isFinite(data.comboAfter) ? data.comboAfter : 0,
    comboMultiplier: Number.isFinite(data.comboMultiplier) ? data.comboMultiplier : 1,
    awardedPoints: Math.round(Number(data.awardedPoints) || 0),
    category: String(data.category),
    dedupeKey: String(data.dedupeKey),
    debug: Boolean(data.debug),
    metadata: structuredClone(data.metadata ?? {}),
  };
  return freezeDeep(record);
}
