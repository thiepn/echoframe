import { CHAMBER_STATES, ChamberState } from '../state/ChamberState.js';
import { ENCOUNTER_SLICE, SPAWN_POINTS } from '../data/encounterSlice.js';
import { ENCOUNTER_BALANCE, DIRECTOR_STATES, ENCOUNTER_PHASES } from '../data/encounterBalance.js';
import { CORE_ENEMY_DEFINITIONS } from '../data/coreEnemyDefinitions.js';
import { EncounterGenerator } from '../encounter/EncounterGenerator.js';
import { EncounterHistory } from '../encounter/EncounterHistory.js';
import { RecoveryWindowController } from '../encounter/RecoveryWindowController.js';

export class EncounterDirector {
  constructor(options) {
    Object.assign(this, options);
    this.chamberIndex = options.chamberIndex ?? 1;
    this.state = new ChamberState();
    this.stepIndex = 0;
    this.spawnIndex = 0;
    this.spawnTimerMs = 0;
    this.completed = false;
    this.directorState = DIRECTOR_STATES.idle;
    this.currentDescriptor = null;
    this.descriptors = options.descriptors ? [...options.descriptors] : [];
    this.precomputedDescriptors = Boolean(options.descriptors);
    this.activeThreatCap = Math.max(0, Number(options.activeThreatCap) || 0);
    this.recoveryController = new RecoveryWindowController();
    this.legacyMode = options.seed === undefined && options.generator === undefined;
    if (this.legacyMode) this.steps = ENCOUNTER_SLICE[this.chamberIndex] ?? [];
    else {
      this.seed = Number(options.seed) >>> 0;
      this.difficultyId = options.difficultyId ?? 'standard';
      this.generator = options.generator ?? new EncounterGenerator();
      this.history = options.encounterHistory ?? new EncounterHistory();
    }
  }

  start() {
    if (this.legacyMode) { this.state.set(CHAMBER_STATES.intro); this.eventBus?.emit('encounter:step:started', this.snapshot()); return; }
    if (this.precomputedDescriptors) {
      this.directorState = DIRECTOR_STATES.generating;
      this.eventBus?.emit('director:generation:completed', { seed: this.seed, chamberIndex: this.chamberIndex, descriptorIds: this.descriptors.map((descriptor) => descriptor.encounterId), precomputed: true });
      this.#activateDescriptor(0);
      return;
    }
    this.directorState = DIRECTOR_STATES.generating;
    this.eventBus?.emit('director:generation:started', { seed: this.seed, chamberIndex: this.chamberIndex });
    this.descriptors = this.generator.generateChamber({
      seed: this.seed,
      difficultyId: this.difficultyId,
      chamberIndex: this.chamberIndex,
      playerPosition: this.playerProvider?.() ?? { x: 800, y: 450 },
      spawnSafetyRadius: this.spawnSafetyRadius,
      spawnIntervalScalar: this.difficultyProfile?.spawnInterval ?? 1,
      encounterHistory: this.history,
    });
    this.eventBus?.emit('director:generation:completed', { seed: this.seed, chamberIndex: this.chamberIndex, descriptorIds: this.descriptors.map((descriptor) => descriptor.encounterId) });
    this.#activateDescriptor(0);
  }

  update(delta) {
    if (this.completed) return;
    if (this.legacyMode) { this.#updateLegacy(delta); return; }
    const safeDelta = Math.max(0, Number(delta) || 0);
    this.state.update(safeDelta);
    const descriptor = this.currentDescriptor;
    if (!descriptor) { this.#complete(); return; }
    if (this.directorState === DIRECTOR_STATES.recovery) {
      if (this.recoveryController.update(safeDelta)) {
        this.eventBus?.emit('director:recovery:ended', { descriptorId: descriptor.encounterId, chamberIndex: this.chamberIndex });
        this.telemetry?.recordRecovery?.(this.recoveryController.durationMs);
        this.#activateDescriptor(this.stepIndex + 1);
      }
      return;
    }
    if (this.directorState === DIRECTOR_STATES.intro) {
      if (this.state.elapsedMs >= descriptor.minimumDurationMs) {
        this.directorState = DIRECTOR_STATES.spawning;
        this.state.set(CHAMBER_STATES.spawning);
        this.spawnTimerMs = 0;
      }
      return;
    }
    if (this.directorState === DIRECTOR_STATES.spawning) {
      this.spawnTimerMs += safeDelta;
      while (this.spawnIndex < descriptor.enemyEntries.length && this.spawnTimerMs >= descriptor.enemyEntries[this.spawnIndex].spawnDelayMs) {
        const entry = descriptor.enemyEntries[this.spawnIndex];
        const entryThreat = CORE_ENEMY_DEFINITIONS[entry.enemyType]?.threatCost ?? 0;
        const cap = descriptor.activeThreatCap || this.activeThreatCap;
        const activeThreat = this.enemyManager.activeEnemies?.reduce((sum, activeEnemy) => sum + (activeEnemy.baseThreatCost ?? activeEnemy.threatCost ?? 0), 0) ?? 0;
        if (cap > 0 && activeThreat > 0 && activeThreat + entryThreat > cap) break;
        const enemy = this.enemyManager.spawn(entry.enemyType, { x: entry.x, y: entry.y }, { descriptorId: descriptor.encounterId, elite: entry.elite ?? null });
        if (enemy) {
          this.telemetry?.recordSpawn?.(entry.enemyType);
          this.eventBus?.emit('director:spawn:planned', { descriptorId: descriptor.encounterId, enemyType: entry.enemyType, spawnPointId: entry.spawnPointId, activationOrder: entry.activationOrder });
        } else this.eventBus?.emit('director:spawn:rejected', { descriptorId: descriptor.encounterId, enemyType: entry.enemyType, spawnPointId: entry.spawnPointId, reason: 'pool-or-cap' });
        this.spawnIndex += 1;
      }
      if (this.spawnIndex >= descriptor.enemyEntries.length) {
        this.directorState = DIRECTOR_STATES.active;
        this.state.set(CHAMBER_STATES.active);
      }
      return;
    }
    if (this.directorState === DIRECTOR_STATES.active) {
      if (this.spawnIndex >= descriptor.enemyEntries.length && this.enemyManager.activeCount === 0) {
        this.eventBus?.emit('director:encounter:completed', { descriptorId: descriptor.encounterId, chamberIndex: this.chamberIndex, sequenceIndex: this.stepIndex });
        this.telemetry?.complete?.('complete', this.playerHealthProvider?.() ?? 0);
        if (descriptor.recoveryAfterMs > 0 && descriptor.phase !== ENCOUNTER_PHASES.climax) this.#beginRecovery(descriptor.recoveryAfterMs, descriptor);
        else this.#activateDescriptor(this.stepIndex + 1);
      }
    }
  }

  forceComplete() { if (this.completed) return false; this.enemyManager.clear('director-force-complete'); this.#complete(); return true; }
  dispose() { this.completed = true; this.directorState = DIRECTOR_STATES.disposed; this.recoveryController.reset(); this.currentDescriptor = null; this.descriptors = []; }

  snapshot() {
    if (this.legacyMode) {
      const step = this.steps[this.stepIndex];
      return { chamberIndex: this.chamberIndex, stepIndex: this.stepIndex, stepId: step?.id ?? null, label: step?.label ?? 'Complete', state: this.state.value, scheduledSpawns: step ? Math.max(0, step.spawns.length - this.spawnIndex) : 0, completed: this.completed, elapsedMs: this.state.elapsedMs };
    }
    const descriptor = this.currentDescriptor;
    const activeThreat = this.enemyManager.activeEnemies?.reduce((sum, enemy) => sum + (enemy.baseThreatCost ?? enemy.threatCost ?? 0), 0) ?? 0;
    return {
      chamberIndex: this.chamberIndex,
      stepIndex: this.stepIndex,
      stepId: descriptor?.encounterId ?? null,
      descriptorId: descriptor?.encounterId ?? null,
      label: descriptor?.pattern ?? 'Complete',
      pattern: descriptor?.pattern ?? null,
      phase: descriptor?.phase ?? ENCOUNTER_PHASES.complete,
      state: this.state.value,
      directorState: this.directorState,
      targetThreat: descriptor?.targetThreat ?? 0,
      actualThreat: descriptor?.actualThreat ?? 0,
      activeThreat,
      scheduledThreatRemaining: descriptor ? descriptor.enemyEntries.slice(this.spawnIndex).reduce((sum, entry) => sum + (entry.elite?.totalThreat ?? CORE_ENEMY_DEFINITIONS[entry.enemyType]?.threatCost ?? 0), 0) : 0,
      scheduledSpawns: descriptor ? Math.max(0, descriptor.enemyEntries.length - this.spawnIndex) : 0,
      spawnQueueLength: descriptor ? Math.max(0, descriptor.enemyEntries.length - this.spawnIndex) : 0,
      recoveryRemainingMs: this.recoveryController.remainingMs,
      generationAttempts: descriptor?.generationDiagnostics?.generationAttempts ?? 0,
      rejectionReasons: descriptor?.generationDiagnostics?.rejectionReasons ?? {},
      fallbackUsed: descriptor?.generationDiagnostics?.fallbackUsed ?? false,
      completed: this.completed,
      elapsedMs: this.state.elapsedMs,
      seed: descriptor?.seed ?? this.seed,
      segmentId: descriptor?.segmentId ?? null,
      activeThreatCap: descriptor?.activeThreatCap ?? this.activeThreatCap,
      elitePlan: descriptor?.enemyEntries?.find((entry) => entry.elite)?.elite ?? null,
    };
  }

  #activateDescriptor(index) {
    if (index >= this.descriptors.length) { this.#complete(); return; }
    this.stepIndex = index;
    this.spawnIndex = 0;
    this.spawnTimerMs = 0;
    this.currentDescriptor = this.descriptors[index];
    const descriptor = this.currentDescriptor;
    this.telemetry?.begin?.(descriptor, { difficultyId: this.difficultyId, playerHealth: this.playerHealthProvider?.() ?? 0 });
    this.eventBus?.emit('director:descriptor:activated', { descriptor });
    this.eventBus?.emit('director:phase:changed', { descriptorId: descriptor.encounterId, phase: descriptor.phase, chamberIndex: this.chamberIndex });
    if (descriptor.phase === ENCOUNTER_PHASES.recovery) this.#beginRecovery(descriptor.recoveryAfterMs * (this.difficultyProfile?.recoveryWindow ?? 1), descriptor);
    else {
      this.directorState = DIRECTOR_STATES.intro;
      this.state.set(CHAMBER_STATES.intro);
      this.eventBus?.emit('encounter:step:started', this.snapshot());
    }
  }

  #beginRecovery(durationMs, descriptor) {
    this.directorState = DIRECTOR_STATES.recovery;
    this.state.set(CHAMBER_STATES.recovery);
    this.recoveryController.reset();
    this.recoveryController.start(Math.max(ENCOUNTER_BALANCE.minimumRecoveryMs, durationMs * (this.difficultyProfile?.recoveryWindow ?? 1)));
    this.eventBus?.emit('director:recovery:started', { descriptorId: descriptor.encounterId, durationMs: this.recoveryController.durationMs, chamberIndex: this.chamberIndex });
  }

  #complete() {
    if (this.completed) return;
    this.completed = true;
    this.directorState = DIRECTOR_STATES.complete;
    this.state.set(CHAMBER_STATES.complete);
    this.eventBus?.emit('director:chamber:completed', { chamberIndex: this.chamberIndex, seed: this.seed });
    this.eventBus?.emit('encounter:step:completed', this.snapshot());
  }

  #updateLegacy(delta) {
    this.state.update(delta);
    const step = this.steps[this.stepIndex];
    if (!step) { this.#complete(); return; }
    if (this.state.value === CHAMBER_STATES.intro) { if (this.state.elapsedMs >= step.introMs) { this.state.set(CHAMBER_STATES.spawning); this.spawnTimerMs = 0; } return; }
    if (this.state.value === CHAMBER_STATES.spawning) {
      this.spawnTimerMs -= delta;
      while (this.spawnIndex < step.spawns.length && this.spawnTimerMs <= 0) {
        const spawn = step.spawns[this.spawnIndex++];
        this.enemyManager.spawn(spawn.type, this.#safePoint(SPAWN_POINTS[spawn.point]));
        this.spawnTimerMs += step.spawnIntervalMs * this.difficultyProfile.spawnInterval;
      }
      if (this.spawnIndex >= step.spawns.length) this.state.set(CHAMBER_STATES.active);
      return;
    }
    if (this.state.value === CHAMBER_STATES.active && this.enemyManager.activeCount === 0) this.state.set(CHAMBER_STATES.recovery);
    if (this.state.value === CHAMBER_STATES.recovery && this.state.elapsedMs >= step.recoveryMs * this.difficultyProfile.recoveryWindow) { this.eventBus?.emit('encounter:step:completed', this.snapshot()); this.stepIndex += 1; this.spawnIndex = 0; this.state.set(CHAMBER_STATES.intro); }
  }

  #safePoint(point) {
    const player = this.playerProvider?.();
    if (!player || Math.hypot(point.x - player.x, point.y - player.y) >= 260) return point;
    return { x: point.x < 800 ? 1430 : 170, y: point.y < 450 ? 740 : 150 };
  }
}
