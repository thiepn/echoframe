import { normalizeUint32 } from '../utils/math.js';
import { COMBAT_BALANCE } from '../data/combatBalance.js';
import { COMBAT_STATES } from './CombatState.js';
import { RunPlanGenerator } from '../run/RunPlanGenerator.js';
import { ScoreManager } from '../scoring/ScoreManager.js';

function createRunId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0];
  }
  return normalizeUint32(Date.now());
}

function createEmptyStatistics() { return { combat: null, elites: null, arenas: null, upgrades: null }; }

export class RunState {
  constructor({ runId = createRunId(), seed = createSeed(), difficultyId = 'standard', runPlanGenerator = new RunPlanGenerator(), unlockedUpgradeIds = null } = {}) {
    this.runId = runId;
    this.seed = normalizeUint32(seed);
    this.difficultyId = difficultyId;
    this.runPlan = runPlanGenerator.generate({ seed: this.seed, difficultyId: this.difficultyId });
    this.status = 'created';
    this.currentSegmentIndex = 0;
    this.currentSegmentId = this.runPlan.segments[0]?.segmentId ?? null;
    this.currentSegmentType = this.runPlan.segments[0]?.segmentType ?? null;
    this.currentSegmentSeed = this.runPlan.segments[0]?.encounterSeed ?? this.seed;
    this.currentChamberId = this.currentSegmentId ?? 'combat-1';
    this.currentArenaId = this.runPlan.segments[0]?.arenaDescriptor?.arenaInstanceId ?? null;
    this.arenaSequence = structuredClone(this.runPlan.arenaSequence ?? []);
    this.arenaHistory = [];
    this.hazardHistory = [];
    this.startedSegmentKeys = [];
    this.currentChamberIndex = this.runPlan.segments[0]?.chamberIndex ?? 1;
    this.currentEncounterStep = 0;
    this.currentThreat = 0;
    this.enemiesAlive = 0;
    this.hostileProjectilesActive = 0;
    this.playerHealth = COMBAT_BALANCE.player.maximumHealth;
    this.playerMaximumHealth = COMBAT_BALANCE.player.maximumHealth;
    this.combatElapsedMs = 0;
    this.chamberElapsedMs = 0;
    this.deathCount = 0;
    this.elapsedSimulationMs = 0;
    this.selectedUpgrades = new Map();
    this.unlockedUpgradeIds = Object.freeze([...(unlockedUpgradeIds ?? ['split-lens','piercing-signal','arc-relay','fracture-round','compression-coil','ricochet-matrix','extended-memory','resonant-damage','phantom-shield','stable-projection','dash-wake','phase-recovery','kinetic-charge','slipstream','emergency-repair','reactive-shell','last-frame','regenerative-circuit'])]);
    this.selectedUpgradeHistory = [];
    this.completedSegmentIds = [];
    this.upgradeOfferIndex = 0;
    this.eliteEncountersCompleted = 0;
    this.eliteModifiersDefeated = [];
    this.eliteHostTypesDefeated = [];
    this.segmentDurations = {};
    this.segmentHealthStart = {};
    this.segmentHealthEnd = {};
    this.preBossComplete = false;
    this.recoveryStarted = false;
    this.recoveryCompleted = false;
    this.recoveryDurationMs = 0;
    this.finalUpgradeCompleted = false;
    this.bossHandoffAvailable = Boolean(this.runPlan.bossHandoffAvailable);
    this.bossImplemented = Boolean(this.runPlan.bossImplemented);
    this.bossReadySnapshot = null;
    this.bossStarted = false;
    this.bossStartSnapshot = null;
    this.bossPhase = null;
    this.bossHealth = 0;
    this.bossMaximumHealth = 0;
    this.bossVulnerable = false;
    this.bossActiveAttackId = null;
    this.bossAttackHistory = [];
    this.bossPhaseDurations = {};
    this.bossDamageBySource = { player: 0, echo: 0, crossfire: 0 };
    this.bossProjectilesDestroyed = 0;
    this.hostileEchoesSpawned = 0;
    this.hostileEchoesDestroyed = 0;
    this.sectorPatternsCompleted = 0;
    this.bossSummonsDefeated = 0;
    this.bossDefeated = false;
    this.bossDefeatSimulationMs = 0;
    this.bossDestructionSkipped = false;
    this.victoryRecorded = false;
    this.bossOutcome = null;
    this.transitionLocked = false;
    this.scoreManager = new ScoreManager({ runId: this.runId, difficultyId: this.difficultyId });
    this.statistics = createEmptyStatistics();
    this.generationVersion = this.runPlan.generationVersion;
    this.disposed = false;
  }

  start() { this.#ensureUsable(); this.status = COMBAT_STATES.initializing; }
  setStatus(status) { this.#ensureUsable(); this.status = status; }
  advance(deltaMs) {
    this.#ensureUsable();
    const delta = Math.max(0, Number(deltaMs) || 0);
    if (![COMBAT_STATES.dead, COMBAT_STATES.complete, COMBAT_STATES.disposed, COMBAT_STATES.upgrade, COMBAT_STATES.transitioning].includes(this.status)) {
      this.elapsedSimulationMs += delta;
      this.combatElapsedMs += delta;
      this.chamberElapsedMs += delta;
      this.scoreManager.update(delta, this.elapsedSimulationMs, { paused: false });
    }
  }
  complete() { this.#ensureUsable(); this.status = COMBAT_STATES.complete; }
  reset() {
    this.#ensureUsable();
    this.status = 'created';
    this.currentSegmentIndex = 0;
    const segment = this.runPlan.segments[0];
    this.currentSegmentId = segment?.segmentId ?? null;
    this.currentSegmentType = segment?.segmentType ?? null;
    this.currentSegmentSeed = segment?.encounterSeed ?? this.seed;
    this.currentChamberIndex = segment?.chamberIndex ?? 1;
    this.currentChamberId = segment?.segmentId ?? 'combat-1';
    this.currentArenaId = this.runPlan.segments[0]?.arenaDescriptor?.arenaInstanceId ?? null;
    this.arenaSequence = structuredClone(this.runPlan.arenaSequence ?? []);
    this.arenaHistory = [];
    this.hazardHistory = [];
    this.startedSegmentKeys = [];
    this.currentEncounterStep = 0;
    this.currentThreat = 0;
    this.enemiesAlive = 0;
    this.hostileProjectilesActive = 0;
    this.playerHealth = this.playerMaximumHealth;
    this.combatElapsedMs = 0;
    this.chamberElapsedMs = 0;
    this.deathCount = 0;
    this.elapsedSimulationMs = 0;
    this.selectedUpgrades.clear();
    this.selectedUpgradeHistory = [];
    this.completedSegmentIds = [];
    this.upgradeOfferIndex = 0;
    this.eliteEncountersCompleted = 0;
    this.eliteModifiersDefeated = [];
    this.eliteHostTypesDefeated = [];
    this.segmentDurations = {};
    this.segmentHealthStart = {};
    this.segmentHealthEnd = {};
    this.preBossComplete = false;
    this.recoveryStarted = false;
    this.recoveryCompleted = false;
    this.recoveryDurationMs = 0;
    this.finalUpgradeCompleted = false;
    this.bossHandoffAvailable = Boolean(this.runPlan.bossHandoffAvailable);
    this.bossImplemented = Boolean(this.runPlan.bossImplemented);
    this.bossReadySnapshot = null;
    this.bossStarted = false;
    this.bossStartSnapshot = null;
    this.bossPhase = null;
    this.bossHealth = 0;
    this.bossMaximumHealth = 0;
    this.bossVulnerable = false;
    this.bossActiveAttackId = null;
    this.bossAttackHistory = [];
    this.bossPhaseDurations = {};
    this.bossDamageBySource = { player: 0, echo: 0, crossfire: 0 };
    this.bossProjectilesDestroyed = 0;
    this.hostileEchoesSpawned = 0;
    this.hostileEchoesDestroyed = 0;
    this.sectorPatternsCompleted = 0;
    this.bossSummonsDefeated = 0;
    this.bossDefeated = false;
    this.bossDefeatSimulationMs = 0;
    this.bossDestructionSkipped = false;
    this.victoryRecorded = false;
    this.bossOutcome = null;
    this.transitionLocked = false;
    this.scoreManager.reset();
    this.statistics = createEmptyStatistics();
  }
  serializeForDebug() {
    this.#ensureUsable();
    return {
      runId: this.runId,
      seed: this.seed,
      difficultyId: this.difficultyId,
      status: this.status,
      runPlan: structuredClone(this.runPlan),
      currentSegmentIndex: this.currentSegmentIndex,
      currentSegmentId: this.currentSegmentId,
      currentSegmentType: this.currentSegmentType,
      currentSegmentSeed: this.currentSegmentSeed,
      currentChamberId: this.currentChamberId,
      currentArenaId: this.currentArenaId,
      arenaSequence: structuredClone(this.arenaSequence),
      arenaHistory: [...this.arenaHistory],
      hazardHistory: [...this.hazardHistory],
      startedSegmentKeys: [...this.startedSegmentKeys],
      currentChamberIndex: this.currentChamberIndex,
      currentEncounterStep: this.currentEncounterStep,
      currentThreat: this.currentThreat,
      enemiesAlive: this.enemiesAlive,
      hostileProjectilesActive: this.hostileProjectilesActive,
      playerHealth: this.playerHealth,
      playerMaximumHealth: this.playerMaximumHealth,
      combatElapsedMs: this.combatElapsedMs,
      chamberElapsedMs: this.chamberElapsedMs,
      deathCount: this.deathCount,
      elapsedSimulationMs: this.elapsedSimulationMs,
      selectedUpgrades: Object.fromEntries(this.selectedUpgrades),
      selectedUpgradeHistory: structuredClone(this.selectedUpgradeHistory),
      completedSegmentIds: [...this.completedSegmentIds],
      upgradeOfferIndex: this.upgradeOfferIndex,
      eliteEncountersCompleted: this.eliteEncountersCompleted,
      eliteModifiersDefeated: [...this.eliteModifiersDefeated],
      eliteHostTypesDefeated: [...this.eliteHostTypesDefeated],
      segmentDurations: { ...this.segmentDurations },
      segmentHealthStart: { ...this.segmentHealthStart },
      segmentHealthEnd: { ...this.segmentHealthEnd },
      preBossComplete: this.preBossComplete,
      recoveryStarted: this.recoveryStarted,
      recoveryCompleted: this.recoveryCompleted,
      recoveryDurationMs: this.recoveryDurationMs,
      finalUpgradeCompleted: this.finalUpgradeCompleted,
      bossHandoffAvailable: this.bossHandoffAvailable,
      bossImplemented: this.bossImplemented,
      bossReadySnapshot: structuredClone(this.bossReadySnapshot),
      bossStarted: this.bossStarted,
      bossStartSnapshot: structuredClone(this.bossStartSnapshot),
      bossPhase: this.bossPhase,
      bossHealth: this.bossHealth,
      bossMaximumHealth: this.bossMaximumHealth,
      bossVulnerable: this.bossVulnerable,
      bossActiveAttackId: this.bossActiveAttackId,
      bossAttackHistory: structuredClone(this.bossAttackHistory),
      bossPhaseDurations: { ...this.bossPhaseDurations },
      bossDamageBySource: { ...this.bossDamageBySource },
      bossProjectilesDestroyed: this.bossProjectilesDestroyed,
      hostileEchoesSpawned: this.hostileEchoesSpawned,
      hostileEchoesDestroyed: this.hostileEchoesDestroyed,
      sectorPatternsCompleted: this.sectorPatternsCompleted,
      bossSummonsDefeated: this.bossSummonsDefeated,
      bossDefeated: this.bossDefeated,
      bossDefeatSimulationMs: this.bossDefeatSimulationMs,
      bossDestructionSkipped: this.bossDestructionSkipped,
      victoryRecorded: this.victoryRecorded,
      bossOutcome: structuredClone(this.bossOutcome),
      transitionLocked: this.transitionLocked,
      score: this.scoreManager.snapshot(),
      statistics: structuredClone(this.statistics),
      generationVersion: this.generationVersion,
    };
  }
  dispose() { if (this.disposed) return; this.selectedUpgrades.clear(); this.scoreManager?.ledger?.lock?.(); this.disposed = true; this.status = COMBAT_STATES.disposed; }
  #ensureUsable() { if (this.disposed) throw new Error('RunState has been disposed.'); }
}
