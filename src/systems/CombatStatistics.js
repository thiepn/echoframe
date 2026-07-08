export class CombatStatistics {
  constructor(initial = {}) { this.reset(); Object.assign(this, structuredClone(initial ?? {})); }
  reset() {
    Object.assign(this, {
      result: null, totalDurationMs: 0, chamberDurations: { 1: 0, 2: 0 }, segmentDurations: {}, playerRemainingHealth: 100,
      damageTaken: 0, damageBlockedByDash: 0, damageBlockedByHitInvulnerability: 0,
      acceptedEnemyHits: 0, playerShotsFired: 0, playerProjectileHits: 0, echoShotsFired: 0,
      echoProjectileHits: 0, playerDamageDealt: 0, echoDamageDealt: 0, playerKills: 0,
      echoKills: 0, driftersDefeated: 0, sentriesDefeated: 0, lancersDefeated: 0,
      shardCarriersDefeated: 0, bulwarksDefeated: 0, suppressorsDefeated: 0, criticalHits: 0,
      echoDeployments: 0, rejectedDeployments: {}, echoActiveTimeMs: 0, replayedFireEvents: 0,
      replayedDashEvents: 0, maximumFireEventTimingErrorMs: 0, crossfireEvents: 0,
      playerDashes: 0, selectedUpgrade: null, selectedUpgradeLevel: 0, selectedUpgradeHistory: [],
      hostileProjectilesSpawned: 0, hostileProjectileHits: 0, hostileProjectileMisses: 0,
      playerProjectilePoolPeak: 0, echoProjectilePoolPeak: 0, hostileProjectilePoolPeak: 0,
      enemyPoolPeak: 0, subordinateObjectPeak: 0, suppressionEvents: 0, recoveryWindows: 0,
      encountersCompleted: 0, generationFallbackCount: 0, encounterPatternsSeen: [], averageEncounterThreat: 0,
      peakActiveEnemies: 0, peakProjectileCount: 0, eliteEncountersCompleted: 0, eliteModifiersDefeated: [], eliteHostTypesDefeated: [], eliteHostsSpawned: 0, overclockedAttacks: 0, replicationTriggers: 0, copiesSpawned: 0, copiesDefeated: 0, copySpawnRejections: 0, resonantTriggers: 0, resonantShieldGranted: 0, resonantShieldAbsorbed: 0,
      distanceMoved: 0, wallCollisions: 0, recordingBufferWraps: 0, eventBufferWraps: 0,
    });
  }
  recordPlayerShot() { this.playerShotsFired += 1; }
  recordEchoShot(n = 1) { this.echoShotsFired += n; }
  recordProjectileHit(source, damage, critical) { if (source === 'echo') { this.echoProjectileHits += 1; this.echoDamageDealt += damage; } else { this.playerProjectileHits += 1; this.playerDamageDealt += damage; } if (critical) this.criticalHits += 1; }
  recordDamageTaken(n) { this.damageTaken += n; this.acceptedEnemyHits += 1; }
  recordBlocked(kind) { if (kind === 'dash') this.damageBlockedByDash += 1; else this.damageBlockedByHitInvulnerability += 1; }
  recordKill(source, type) { if (source === 'echo') this.echoKills += 1; else this.playerKills += 1; const key = ({ drifter: 'driftersDefeated', sentry: 'sentriesDefeated', lancer: 'lancersDefeated', 'shard-carrier': 'shardCarriersDefeated', bulwark: 'bulwarksDefeated', suppressor: 'suppressorsDefeated' })[type]; if (key) this[key] += 1; }
  recordHostileProjectileSpawn() { this.hostileProjectilesSpawned += 1; }
  recordHostileProjectileHit() { this.hostileProjectileHits += 1; }
  recordHostileProjectileMiss() { this.hostileProjectileMisses += 1; }
  recordPoolPeaks({ player = 0, echo = 0, hostile = 0, enemy = 0 }) { this.playerProjectilePoolPeak = Math.max(this.playerProjectilePoolPeak, player); this.echoProjectilePoolPeak = Math.max(this.echoProjectilePoolPeak, echo); this.hostileProjectilePoolPeak = Math.max(this.hostileProjectilePoolPeak, hostile); this.enemyPoolPeak = Math.max(this.enemyPoolPeak, enemy); }
  recordSubordinatePeak(n) { this.subordinateObjectPeak = Math.max(this.subordinateObjectPeak, n); }
  recordPlayerPoolUsage(n) { this.recordPoolPeaks({ player: n }); }
  recordPoolUsage(n) { this.recordPlayerPoolUsage(n); }
  recordEchoPoolUsage(n) { this.recordPoolPeaks({ echo: n }); }
  recordDeployment() { this.echoDeployments += 1; }
  recordRejectedDeployment(reason) { this.rejectedDeployments[reason] = (this.rejectedDeployments[reason] ?? 0) + 1; }
  recordEchoActiveTime(ms) { this.echoActiveTimeMs += Math.max(0, Number(ms) || 0); }
  recordReplayedFireEvent() { this.replayedFireEvents += 1; }
  recordReplayedDashEvent() { this.replayedDashEvents += 1; }
  recordEventTimingError(ms) { this.maximumFireEventTimingErrorMs = Math.max(this.maximumFireEventTimingErrorMs, Math.abs(Number(ms) || 0)); }
  recordCrossfire() { this.crossfireEvents += 1; }
  recordDash() { this.playerDashes += 1; }
  recordDistance(n) { this.distanceMoved += Math.max(0, Number(n) || 0); }
  recordWallCollision() { this.wallCollisions += 1; }
  setSelectedUpgrade(id, level, offerIndex = this.selectedUpgradeHistory.length) { this.selectedUpgrade = id; this.selectedUpgradeLevel = level; this.selectedUpgradeHistory.push({ id, level, offerIndex }); }
  updateDirectorTelemetry(snapshot) { this.suppressionEvents = snapshot.suppressionEvents ?? this.suppressionEvents; this.recoveryWindows = snapshot.recoveryWindows ?? this.recoveryWindows; this.encountersCompleted = snapshot.encountersCompleted ?? this.encountersCompleted; this.generationFallbackCount = snapshot.generationFallbackCount ?? this.generationFallbackCount; this.encounterPatternsSeen = [...(snapshot.patternsSeen ?? this.encounterPatternsSeen)]; this.averageEncounterThreat = snapshot.averageThreat ?? this.averageEncounterThreat; this.subordinateObjectPeak = Math.max(this.subordinateObjectPeak, snapshot.subordinateObjectPeak ?? 0); this.peakActiveEnemies = Math.max(this.peakActiveEnemies, snapshot.peakEnemyCount ?? 0); this.peakProjectileCount = Math.max(this.peakProjectileCount, snapshot.peakProjectileCount ?? 0); }
  updateEliteTelemetry(snapshot = {}) { this.eliteHostsSpawned = snapshot.hostsSpawned ?? this.eliteHostsSpawned; this.overclockedAttacks = snapshot.overclockedAttacks ?? this.overclockedAttacks; this.replicationTriggers = snapshot.replicationTriggers ?? this.replicationTriggers; this.copiesSpawned = snapshot.copiesSpawned ?? this.copiesSpawned; this.copiesDefeated = snapshot.copiesDefeated ?? this.copiesDefeated; this.copySpawnRejections = snapshot.copySpawnRejections ?? this.copySpawnRejections; this.resonantTriggers = snapshot.resonantTriggers ?? this.resonantTriggers; this.resonantShieldGranted = snapshot.shieldGranted ?? this.resonantShieldGranted; this.resonantShieldAbsorbed = snapshot.shieldAbsorbed ?? this.resonantShieldAbsorbed; }
  updateBufferWraps(snapshot = 0, fire = 0, dash = 0) { this.recordingBufferWraps = Math.max(this.recordingBufferWraps, snapshot); this.eventBufferWraps = Math.max(this.eventBufferWraps, fire + dash); }
  snapshot() { return { ...structuredClone(this), playerAccuracy: this.playerShotsFired ? this.playerProjectileHits / this.playerShotsFired : 0, echoAccuracy: this.echoShotsFired ? this.echoProjectileHits / this.echoShotsFired : 0, totalEnemiesDefeated: this.playerKills + this.echoKills }; }
}
