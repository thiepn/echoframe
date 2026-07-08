export class EliteTelemetry {
  constructor(initial = {}) { this.reset(); Object.assign(this, structuredClone(initial ?? {})); }

  reset() {
    Object.assign(this, {
      segmentsStarted: 0,
      segmentsCompleted: 0,
      segmentDurations: {},
      hostsSpawned: 0,
      modifiers: {},
      hosts: {},
      hostModifierPairs: {},
      damageTaken: 0,
      damageDealt: 0,
      overclockedAttacks: 0,
      replicationTriggers: 0,
      copiesSpawned: 0,
      copiesDefeated: 0,
      copySpawnRejections: 0,
      resonantTriggers: 0,
      shieldGranted: 0,
      shieldAbsorbed: 0,
      shieldExpiries: 0,
      shieldBreaks: 0,
      eliteDefeats: 0,
      eliteDefeatsBySource: {},
      timeToKillMs: [],
      fallbacks: 0,
      rejectionReasons: {},
    });
  }

  recordHost(enemyType, modifierId) {
    this.hostsSpawned += 1;
    this.hosts[enemyType] = (this.hosts[enemyType] ?? 0) + 1;
    this.modifiers[modifierId] = (this.modifiers[modifierId] ?? 0) + 1;
    const pair = `${enemyType}:${modifierId}`;
    this.hostModifierPairs[pair] = (this.hostModifierPairs[pair] ?? 0) + 1;
  }

  recordRejection(reason) { this.rejectionReasons[reason] = (this.rejectionReasons[reason] ?? 0) + 1; }
  recordDefeat(source, timeToKillMs) {
    this.eliteDefeats += 1;
    this.eliteDefeatsBySource[source] = (this.eliteDefeatsBySource[source] ?? 0) + 1;
    if (Number.isFinite(timeToKillMs) && timeToKillMs >= 0) this.timeToKillMs.push(timeToKillMs);
  }
  recordSegmentDuration(segmentId, durationMs) { this.segmentDurations[segmentId] = Math.max(0, Number(durationMs) || 0); }

  snapshot() {
    const values = this.timeToKillMs;
    return {
      ...structuredClone(this),
      averageTimeToKillMs: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
      maximumTimeToKillMs: values.length ? Math.max(...values) : 0,
    };
  }
}
