function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export function createEncounterDescriptor(input) {
  return deepFreeze({
    encounterId: String(input.encounterId),
    seed: Number(input.seed) >>> 0,
    chamberIndex: Number(input.chamberIndex),
    segmentId: input.segmentId ? String(input.segmentId) : null,
    segmentType: input.segmentType ? String(input.segmentType) : null,
    activeThreatCap: Math.max(0, Number(input.activeThreatCap) || 0),
    arenaInstanceId: input.arenaInstanceId ? String(input.arenaInstanceId) : null,
    requiredArenaTags: [...(input.requiredArenaTags ?? [])],
    forbiddenArenaTags: [...(input.forbiddenArenaTags ?? [])],
    selectedSocketIds: [...(input.selectedSocketIds ?? [])],
    sequenceIndex: Number(input.sequenceIndex),
    phase: String(input.phase),
    pattern: String(input.pattern),
    targetThreat: Math.max(0, Number(input.targetThreat) || 0),
    actualThreat: Math.max(0, Number(input.actualThreat) || 0),
    enemyEntries: [...(input.enemyEntries ?? [])].map((entry) => ({ ...entry })),
    spawnGroups: [...(input.spawnGroups ?? [])].map((group) => ({ ...group, entries: [...(group.entries ?? [])] })),
    spawnIntervalMs: Math.max(0, Number(input.spawnIntervalMs) || 0),
    minimumDurationMs: Math.max(0, Number(input.minimumDurationMs) || 0),
    completionRule: input.completionRule ?? 'all-enemies-defeated',
    recoveryAfterMs: Math.max(0, Number(input.recoveryAfterMs) || 0),
    tags: [...(input.tags ?? [])],
    generationDiagnostics: { ...(input.generationDiagnostics ?? {}) },
  });
}
