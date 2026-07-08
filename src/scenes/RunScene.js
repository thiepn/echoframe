import {
  DESIGN_WIDTH,
  PALETTE,
} from '../data/constants.js';
import { COMBAT_BALANCE, getDifficultyCombatProfile } from '../data/combatBalance.js';
import { ECHO_BALANCE } from '../data/echoBalance.js';
import { PLAYER_BALANCE } from '../data/playerBalance.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { HitInvulnerabilityComponent } from '../components/HitInvulnerabilityComponent.js';
import { DamageService } from '../combat/DamageService.js';
import { createDamagePacket } from '../combat/DamagePacket.js';
import { FACTIONS } from '../combat/Faction.js';
import { Player } from '../entities/Player.js';
import { COMBAT_STATES, CombatState } from '../state/CombatState.js';
import { PLAYER_STATES } from '../state/PlayerState.js';
import { CameraController } from '../systems/CameraController.js';
import { ArenaManager } from '../systems/ArenaManager.js';
import { ArenaTelemetry } from '../systems/ArenaTelemetry.js';
import { ArenaHazardManager } from '../systems/ArenaHazardManager.js';
import { ArenaDebugController } from '../systems/ArenaDebugController.js';
import { ArenaValidator } from '../arena/ArenaValidator.js';
import { ChamberController } from '../systems/ChamberController.js';
import { CarrierShardManager } from '../systems/CarrierShardManager.js';
import { CollisionManager } from '../systems/CollisionManager.js';
import { CombatFeedbackSystem } from '../systems/CombatFeedbackSystem.js';
import { CombatStatistics } from '../systems/CombatStatistics.js';
import { CrossfireTracker } from '../systems/CrossfireTracker.js';
import { EchoCooldownModel } from '../systems/EchoCooldownModel.js';
import { createEchoLoadoutSnapshot } from '../systems/EchoLoadoutSnapshot.js';
import { EchoPlaybackSystem } from '../systems/EchoPlaybackSystem.js';
import { EchoProjectileManager } from '../systems/EchoProjectileManager.js';
import { EchoRecorder } from '../systems/EchoRecorder.js';
import { EncounterTelemetry } from '../systems/EncounterTelemetry.js';
import { EncounterGenerator } from '../encounter/EncounterGenerator.js';
import { EncounterHistory } from '../encounter/EncounterHistory.js';
import { EncounterDirector } from '../systems/EncounterDirector.js';
import { EnemyManager } from '../systems/EnemyManager.js';
import { EliteManager } from '../systems/EliteManager.js';
import { EliteTelemetry } from '../systems/EliteTelemetry.js';
import { EliteDebugController } from '../systems/EliteDebugController.js';
import { EnemyProjectileManager } from '../systems/EnemyProjectileManager.js';
import { PlayerController } from '../systems/PlayerController.js';
import { PlayerFeedbackSystem } from '../systems/PlayerFeedbackSystem.js';
import { ProjectileManager } from '../systems/ProjectileManager.js';
import { UpgradeManager } from '../systems/UpgradeManager.js';
import { UpgradeTelemetry } from '../systems/UpgradeTelemetry.js';
import { ChainProjectileManager } from '../systems/ChainProjectileManager.js';
import { FragmentProjectileManager } from '../systems/FragmentProjectileManager.js';
import { DashWakeManager } from '../systems/DashWakeManager.js';
import { MemoryBurstManager } from '../systems/MemoryBurstManager.js';
import { NearMissTracker } from '../systems/NearMissTracker.js';
import { ProjectileInterceptionService } from '../systems/ProjectileInterceptionService.js';
import { DeflectionPulseManager } from '../systems/DeflectionPulseManager.js';
import { SuppressionModifierService } from '../systems/SuppressionModifierService.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { RunProgressionController } from '../run/RunProgressionController.js';
import { BaseScene } from './BaseScene.js';

const TELEMETRY_INTERVAL_MS = 100;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export class RunScene extends BaseScene {
  constructor(services) {
    super(SCENE_KEYS.run, services);
    this.completed = false;
    this.telemetryElapsedMs = 0;
    this.chamberHandled = false;
  }

  create() {
    this.completed = false;
    this.telemetryElapsedMs = 0;
    this.chamberHandled = false;
    this.beginScene({ input: true });
    const run = this.services.gameState.activeRun;
    if (!run || run.runId !== this.sceneData.runId) {
      this.#returnInvalidRunToMenu();
      return;
    }

    this.run = run;
    this.run.scoreManager.eventBus = this.services.eventBus;
    this.runProgression = new RunProgressionController(run);
    this.segment = this.runProgression.markSegmentStarted();
    if (!this.segment) { this.#returnInvalidRunToMenu(); return; }
    this.chamberIndex = this.segment.chamberIndex;
    this.difficulty = getDifficultyCombatProfile(run.difficultyId);
    this.combatState = new CombatState();
    this.combatState.set(COMBAT_STATES.chamberIntro);
    run.setStatus(COMBAT_STATES.chamberIntro);
    run.currentChamberIndex = this.chamberIndex;
    run.currentChamberId = this.segment.segmentId;
    run.currentArenaId = this.segment.arenaDescriptor?.arenaInstanceId ?? null;
    run.chamberElapsedMs = 0;

    this.statistics = new CombatStatistics(run.statistics.combat ?? {});
    this.upgradeTelemetry = new UpgradeTelemetry(run.statistics.upgrades ?? {});
    this.upgradeManager = new UpgradeManager({ run, eventBus: this.services.eventBus, telemetry: this.upgradeTelemetry });
    this.playerHealth = new HealthComponent(run.playerMaximumHealth || COMBAT_BALANCE.player.maximumHealth);
    this.playerHealth.setCurrent(run.playerHealth ?? this.playerHealth.maximumHealth);
    const invulnerabilityDuration = COMBAT_BALANCE.player.postHitInvulnerabilityMs * this.difficulty.hitInvulnerability;
    this.hitInvulnerability = new HitInvulnerabilityComponent(invulnerabilityDuration);
    this.damageService = new DamageService({
      eventBus: this.services.eventBus,
      capacity: COMBAT_BALANCE.playtest.damageDeduplicationCapacity,
      runStateProvider: () => this.#combatAcceptsDamage(),
    });

    this.#createArenaPresentation();
    this.arenaTelemetry = new ArenaTelemetry(run.statistics.arenas ?? {});
    this.arenaManager = new ArenaManager({ scene: this, eventBus: this.services.eventBus, telemetry: this.arenaTelemetry });
    this.arenaRuntime = this.arenaManager.activate(this.segment.arenaDescriptor);
    this.arenaDebugController = new ArenaDebugController({ arenaManager: this.arenaManager, arenaValidator: new ArenaValidator() });
    this.wallGroup = this.arenaRuntime.wallGroup;
    this.player = new Player(this, {
      ...this.segment.arenaDescriptor.playerSpawn,
      settingsManager: this.services.settingsManager,
    });

    this.projectileManager = new ProjectileManager({
      scene: this,
      eventBus: this.services.eventBus,
      settingsManager: this.services.settingsManager,
      statistics: this.statistics,
      arenaBounds: this.segment.arenaDescriptor.cameraBounds,
    });
    this.echoProjectileManager = new EchoProjectileManager({
      scene: this,
      eventBus: this.services.eventBus,
      settingsManager: this.services.settingsManager,
      statistics: this.statistics,
      arenaBounds: this.segment.arenaDescriptor.cameraBounds,
    });
    this.enemyProjectileManager = new EnemyProjectileManager({
      scene: this,
      eventBus: this.services.eventBus,
      statistics: this.statistics,
      arenaBounds: this.segment.arenaDescriptor.cameraBounds,
    });
    this.carrierShardManager = new CarrierShardManager({
      scene: this,
      eventBus: this.services.eventBus,
      settingsManager: this.services.settingsManager,
      statistics: this.statistics,
      playerPositionProvider: () => ({ x: this.player.x, y: this.player.y }),
      arenaDescriptor: this.segment.arenaDescriptor,
    });
    this.suppressionService = new SuppressionModifierService({ eventBus: this.services.eventBus });
    this.eliteTelemetry = new EliteTelemetry(run.statistics.elites ?? {});
    this.eliteManager = new EliteManager({
      scene: this,
      eventBus: this.services.eventBus,
      settingsManager: this.services.settingsManager,
      playerProvider: () => this.player,
      telemetry: this.eliteTelemetry,
      arenaDescriptor: this.segment.arenaDescriptor,
    });
    this.enemyManager = new EnemyManager({
      scene: this,
      eventBus: this.services.eventBus,
      settingsManager: this.services.settingsManager,
      difficultyProfile: this.difficulty,
      statistics: this.statistics,
      enemyProjectileManager: this.enemyProjectileManager,
      carrierShardManager: this.carrierShardManager,
      suppressionService: this.suppressionService,
      eliteManager: this.eliteManager,
      arenaDescriptor: this.segment.arenaDescriptor,
    });
    this.eliteManager.setEnemyManager(this.enemyManager);
    this.eliteDebugController = new EliteDebugController(this.eliteManager);

    this.playerController = new PlayerController({
      player: this.player,
      inputContext: this.inputContext,
      eventBus: this.services.eventBus,
      statistics: this.statistics,
      dashDistanceResolver: (x, y, direction, desiredDistance, radius) =>
        this.collisionManager?.resolveDashDistance(x, y, direction, desiredDistance, radius) ?? desiredDistance,
      movementSpeedProvider: () => this.upgradeManager.movementSpeedScalar(),
      secondaryDashProvider: (direction) => this.upgradeManager.tryVectorReversal(direction),
    });
    this.weaponSystem = new WeaponSystem({
      player: this.player,
      playerController: this.playerController,
      inputContext: this.inputContext,
      projectileManager: this.projectileManager,
      eventBus: this.services.eventBus,
      statistics: this.statistics,
      upgradeManager: this.upgradeManager,
    });

    this.echoRecorder = new EchoRecorder({
      eventBus: this.services.eventBus,
      timeProvider: () => this.run?.elapsedSimulationMs ?? 0,
      replayDurationProvider: () => this.upgradeManager.echoProfile({ durationMs: ECHO_BALANCE.recording.baseReplayDurationMs, cooldownMs: ECHO_BALANCE.cooldown.durationMs }).durationMs,
    });
    const initialEchoProfile = this.upgradeManager.echoProfile({ durationMs: ECHO_BALANCE.recording.baseReplayDurationMs, cooldownMs: ECHO_BALANCE.cooldown.durationMs });
    this.echoCooldown = new EchoCooldownModel(initialEchoProfile.cooldownMs);
    this.crossfireTracker = new CrossfireTracker(ECHO_BALANCE.crossfire);
    this.echoPlaybackSystem = new EchoPlaybackSystem({
      scene: this,
      eventBus: this.services.eventBus,
      settingsManager: this.services.settingsManager,
      audioManager: this.services.audioManager,
      statistics: this.statistics,
      echoProjectileManager: this.echoProjectileManager,
      activeCapProvider: () => this.upgradeManager.echoProfile({ durationMs: ECHO_BALANCE.recording.baseReplayDurationMs, cooldownMs: ECHO_BALANCE.cooldown.durationMs }).activeCap,
    });
    this.arenaHazardManager = new ArenaHazardManager({
      scene: this,
      eventBus: this.services.eventBus,
      settingsManager: this.services.settingsManager,
      telemetry: this.arenaTelemetry,
      descriptor: this.segment.arenaDescriptor,
      difficultyProfile: this.difficulty,
    });
    this.chainProjectileManager = new ChainProjectileManager({
      eventBus: this.services.eventBus,
      damageService: this.damageService,
      enemyManager: this.enemyManager,
      statistics: this.statistics,
      telemetry: this.upgradeTelemetry,
      timeProvider: () => this.run?.elapsedSimulationMs ?? 0,
    });
    this.fragmentProjectileManager = new FragmentProjectileManager({
      projectileManager: this.projectileManager,
      echoProjectileManager: this.echoProjectileManager,
      telemetry: this.upgradeTelemetry,
    });
    this.dashWakeManager = new DashWakeManager({
      scene: this,
      eventBus: this.services.eventBus,
      damageService: this.damageService,
      enemyManager: this.enemyManager,
      timeProvider: () => this.run?.elapsedSimulationMs ?? 0,
      telemetry: this.upgradeTelemetry,
    });
    this.memoryBurstManager = new MemoryBurstManager({
      scene: this,
      eventBus: this.services.eventBus,
      damageService: this.damageService,
      enemyManager: this.enemyManager,
      timeProvider: () => this.run?.elapsedSimulationMs ?? 0,
      telemetry: this.upgradeTelemetry,
    });
    this.nearMissTracker = new NearMissTracker({
      enemyProjectileManager: this.enemyProjectileManager,
      playerProvider: () => this.player,
      timeProvider: () => this.run?.elapsedSimulationMs ?? 0,
      behavior: this.upgradeManager.phaseRecovery,
      profileProvider: () => this.upgradeManager.phaseRecoveryProfile(),
      onReduction: (amountMs) => this.echoCooldown.recover(amountMs),
      onNearMiss: (payload) => this.run.scoreManager.recordNearMiss(payload, { simulationMs: this.run.elapsedSimulationMs, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType }),
      telemetry: this.upgradeTelemetry,
    });
    this.projectileInterceptionService = new ProjectileInterceptionService({
      echoPlaybackSystem: this.echoPlaybackSystem,
      enemyProjectileManager: this.enemyProjectileManager,
      onDestroyed: (projectileId) => this.#handleHostileProjectileDestroyed(projectileId, 'phantom-shield'),
      telemetry: this.upgradeTelemetry,
    });
    this.deflectionPulseManager = new DeflectionPulseManager({
      scene: this,
      enemyManager: this.enemyManager,
      behavior: this.upgradeManager.deflection,
      wallProvider: () => this.segment.arenaDescriptor.solidGeometry,
      telemetry: this.upgradeTelemetry,
    });

    this.collisionManager = new CollisionManager({
      scene: this,
      player: this.player,
      playerController: this.playerController,
      projectileManager: this.projectileManager,
      echoProjectileManager: this.echoProjectileManager,
      enemyProjectileManager: this.enemyProjectileManager,
      enemyManager: this.enemyManager,
      carrierShardManager: this.carrierShardManager,
      arenaHazardManager: this.arenaHazardManager,
      arenaTelemetry: this.arenaTelemetry,
      wallGroup: this.wallGroup,
      wallDefinitions: this.segment.arenaDescriptor.solidGeometry,
      damageService: this.damageService,
      playerHealth: this.playerHealth,
      hitInvulnerability: this.hitInvulnerability,
      statistics: this.statistics,
      eventBus: this.services.eventBus,
      simulationTimeProvider: () => this.run?.elapsedSimulationMs ?? 0,
      playerDamageReductionProvider: () => this.upgradeManager.damageReduction(),
      lastFrameProvider: () => this.#lastFrameContext(),
      onAcceptedPlayerDamage: (result) => { this.upgradeManager.onPlayerDamaged(); this.run.scoreManager.recordAcceptedDamage(result?.damageApplied ?? 0, this.run.elapsedSimulationMs); },
      ricochetProfileProvider: () => this.upgradeManager.data('ricochet-matrix'),
      onWallRicochet: () => { this.upgradeTelemetry.ricochets += 1; this.services.audioManager.playRicochet?.(); },
      onEnemyDamageResolved: (payload) => this.#handleUpgradeDamage(payload),
      hostileProjectileInterceptionProvider: () => this.upgradeManager.level('null-absorption') > 0,
      onHostileProjectileDestroyed: (projectileId, reason) => this.#handleHostileProjectileDestroyed(projectileId, reason),
    });
    this.collisionManager.register();

    this.cameraController = new CameraController({
      camera: this.cameras.main,
      settingsManager: this.services.settingsManager,
    });
    this.playerFeedbackSystem = new PlayerFeedbackSystem({
      scene: this,
      cleanupRegistry: this.cleanup,
      eventBus: this.services.eventBus,
      audioManager: this.services.audioManager,
      settingsManager: this.services.settingsManager,
      playerRenderer: this.player.renderer,
      cameraController: this.cameraController,
    });
    this.combatFeedbackSystem = new CombatFeedbackSystem({
      scene: this,
      eventBus: this.services.eventBus,
      audioManager: this.services.audioManager,
      cameraController: this.cameraController,
      settingsManager: this.services.settingsManager,
    });

    this.chamberController = new ChamberController(this.chamberIndex);
    this.encounterTelemetry = new EncounterTelemetry(this.statistics.snapshot());
    this.encounterHistory = new EncounterHistory();
    this.encounterGenerator = new EncounterGenerator();
    const descriptors = this.encounterGenerator.generateSegment({
      segment: this.segment,
      difficultyId: this.run.difficultyId,
      playerPosition: this.player,
      spawnSafetyRadius: this.run.difficultyId === 'relaxed' ? 300 : this.run.difficultyId === 'overclocked' ? 230 : 260,
      spawnIntervalScalar: this.difficulty.spawnInterval,
      encounterHistory: this.encounterHistory,
    });
    this.encounterDirector = new EncounterDirector({
      chamberIndex: this.chamberIndex,
      segmentId: this.segment?.segmentId ?? null,
      segmentType: this.segment?.segmentType ?? null,
      segmentIndex: this.run.currentSegmentIndex,
      runPlanSummary: JSON.stringify(this.run.runPlan.segments.map((segment) => ({ id: segment.segmentId, elite: segment.elitePlan?.modifierId ?? null }))),
      seed: this.segment.encounterSeed,
      difficultyId: this.run.difficultyId,
      difficultyProfile: this.difficulty,
      eventBus: this.services.eventBus,
      enemyManager: this.enemyManager,
      playerProvider: () => this.player,
      playerHealthProvider: () => this.playerHealth.currentHealth,
      spawnSafetyRadius: this.run.difficultyId === 'relaxed' ? 300 : this.run.difficultyId === 'overclocked' ? 230 : 260,
      activeThreatCap: this.segment.activeThreatCap,
      descriptors,
      telemetry: this.encounterTelemetry,
    });
    this.encounterDirector.start();

    this.#registerEvents();
    this.echoRecorder.start(run.elapsedSimulationMs, this.playerController.getSnapshot());
    this.services.eventBus.emit('player:health:changed', this.playerHealth.snapshot());
    this.services.eventBus.emit('chamber:started', { chamberIndex: this.chamberIndex, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType });
    if (this.segment.requiresElite) this.eliteTelemetry.segmentsStarted += 1;
    this.services.debugManager.setGameplayProvider(() => this.#createDebugSnapshot(), this);
    this.#installDebugHooks();
    this.cleanup.add(() => this.#destroyCombat());
    this.#emitTelemetry(true);
  }

  update(_time, delta) {
    if (this.completed || !this.playerController) return;
    const safeDeltaMs = Math.min(Math.max(0, Number(delta) || 0), ECHO_BALANCE.recording.maximumSimulationDeltaMs);
    const locked = this.services.inputManager.locked;
    if (!locked && this.inputContext.justPressed('pause')) {
      this.services.eventBus.emit('run:pause:requested', { source: 'keyboard' });
      return;
    }

    const simulationActive = this.#simulationActive() && !locked;
    if (simulationActive) {
      this.run.advance(safeDeltaMs);
      this.chamberController.update(safeDeltaMs);
    }

    this.hitInvulnerability.update(safeDeltaMs, { paused: !simulationActive });
    this.playerController.setHitInvulnerable(this.hitInvulnerability.active);
    const playerSpeed = Math.hypot(this.player?.velocity?.x ?? 0, this.player?.velocity?.y ?? 0);
    this.upgradeManager.update(safeDeltaMs, this.playerHealth, simulationActive, { speed: playerSpeed, maximumSpeed: PLAYER_BALANCE.movement.maximumSpeed * this.upgradeManager.movementSpeedScalar() });

    this.playerController.update(safeDeltaMs, this.cameras.main, !simulationActive);
    this.weaponSystem.update(safeDeltaMs, !simulationActive);
    if (simulationActive && this.inputContext.justPressed('deployEcho')) this.#requestEchoDeployment();

    if (simulationActive) {
      this.projectileManager.update(safeDeltaMs);
      this.echoPlaybackSystem.update(safeDeltaMs);
      this.echoProjectileManager.update(safeDeltaMs);
      this.dashWakeManager.update(safeDeltaMs);
      this.nearMissTracker.update(safeDeltaMs);
      this.projectileInterceptionService.update(safeDeltaMs);
      this.#updateTwinRecall();
      this.#updateSlipstream();
      this.encounterDirector.update(safeDeltaMs);
      this.arenaHazardManager.update(safeDeltaMs, {
        paused: false,
        recovery: this.encounterDirector.state.value === 'RECOVERY',
        majorExecutionActive: (this.enemyManager.majorExecutionCoordinator?.snapshot?.().recentExecutions?.length ?? 0) > 0,
      });
      const encounterState = this.encounterDirector.state.value;
      if (encounterState === 'RECOVERY') {
        this.combatState.set(COMBAT_STATES.recovery);
        this.run.setStatus(COMBAT_STATES.recovery);
      } else if (!this.encounterDirector.completed && this.combatState.is(COMBAT_STATES.chamberIntro)) {
        this.combatState.set(COMBAT_STATES.active);
        this.run.setStatus(COMBAT_STATES.active);
      } else if (!this.encounterDirector.completed && this.combatState.is(COMBAT_STATES.recovery) && encounterState !== 'RECOVERY') {
        this.combatState.set(COMBAT_STATES.active);
        this.run.setStatus(COMBAT_STATES.active);
      }
      this.enemyManager.update(safeDeltaMs, this.player);
      this.eliteManager.update(safeDeltaMs);
      this.carrierShardManager.update(safeDeltaMs);
      const recoveryScalar = this.suppressionService.update(this.enemyManager.activeSuppressors, this.player);
      this.echoCooldown.update(safeDeltaMs, recoveryScalar);
      this.enemyProjectileManager.update(safeDeltaMs);
      this.encounterTelemetry.update(safeDeltaMs, {
        activeEnemies: this.enemyManager.activeCount,
        activeProjectiles: this.enemyProjectileManager.getDiagnostics().active + this.projectileManager.getDiagnostics().active + this.echoProjectileManager.getDiagnostics().active,
        subordinateObjects: this.carrierShardManager.getDiagnostics().active,
      });
      this.playerFeedbackSystem.update(safeDeltaMs);
      this.echoRecorder.update(
        safeDeltaMs,
        this.run.elapsedSimulationMs,
        this.playerController.getSnapshot(),
        { enabled: this.#recordingEnabled() },
      );
      if (this.encounterDirector.completed) this.#handleChamberClear();
    }

    this.run.currentEncounterStep = this.encounterDirector.stepIndex;
    this.run.currentThreat = this.encounterDirector.snapshot().activeThreat ?? 0;
    this.run.enemiesAlive = this.enemyManager.activeCount;
    this.run.hostileProjectilesActive = this.enemyProjectileManager.getDiagnostics().active;
    this.run.playerHealth = this.playerHealth.currentHealth;
    this.run.playerMaximumHealth = this.playerHealth.maximumHealth;

    this.telemetryElapsedMs += safeDeltaMs;
    if (this.telemetryElapsedMs >= TELEMETRY_INTERVAL_MS) {
      this.telemetryElapsedMs = 0;
      this.#emitTelemetry();
    }
  }

  #createArenaPresentation() {
    this.createFoundationBackground();
    this.add.text(105, 66, `ARENA RUN · ${this.segment.label.toUpperCase()} · ${this.segment.requiresElite ? 'ELITE' : 'COMBAT'}`, {
      fontFamily: 'monospace', fontSize: '15px', color: '#ff9aac',
    }).setDepth(50);
    this.add.text(DESIGN_WIDTH / 2, 830, 'WASD MOVE · MOUSE AIM/FIRE · SHIFT/RMB DASH · SPACE ECHO · ESC PAUSE', {
      fontFamily: 'monospace', fontSize: '14px', color: PALETTE.mutedText,
      backgroundColor: '#080b14cc', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(100);
  }

  #registerEvents() {
    const subscribe = (name, fn) => this.cleanup.trackSubscription(this.services.eventBus.subscribe(name, fn, { owner: this }));
    subscribe('run:pause:requested', () => this.#pauseCombat());
    subscribe('player:died', (payload) => this.#handlePlayerDeath(payload));
    subscribe('combat:target:hit', (payload) => this.#onCombatTargetHit(payload));
    subscribe('player:dash:started', (payload) => this.#handleDashStarted(payload));
    subscribe('echo:dash:replayed', (payload) => this.#handleEchoDash(payload));
    subscribe('echo:normal-expiration', (payload) => this.#handleEchoExpiration(payload));
    subscribe('enemy:deactivated', ({ enemyId }) => { this.crossfireTracker.clearTarget?.(enemyId); this.upgradeManager.resonantDamage.clearTarget?.(enemyId); });
    subscribe('enemy:defeated', (payload) => { this.encounterTelemetry?.recordDefeat?.(payload.enemyType); this.run.scoreManager.recordEnemyDefeat(payload, { simulationMs: this.run.elapsedSimulationMs, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType }); });
    subscribe('enemy:spawned', ({ enemyType }) => {
      const method = ({
        drifter: 'playDrifterSpawn', sentry: 'playSentrySpawn', lancer: 'playLancerSpawn',
        'shard-carrier': 'playCarrierSpawn', bulwark: 'playBulwarkSpawn', suppressor: 'playSuppressorSpawn',
      })[enemyType];
      this.services.audioManager[method]?.();
    });
    subscribe('enemy:sentry:anticipation', () => this.services.audioManager.playSentryAnticipation?.());
    subscribe('enemy:sentry:fired', () => this.services.audioManager.playSentryShot?.());
    subscribe('enemy:drifter:lunged', () => this.services.audioManager.playDrifterLunge?.());
    subscribe('enemy:lancer:attack:anticipated', () => this.services.audioManager.playLancerAnticipation?.());
    subscribe('enemy:lancer:attack:committed', () => this.services.audioManager.playLancerAttack?.());
    subscribe('enemy:carrier:released', () => this.services.audioManager.playCarrierRelease?.());
    subscribe('enemy:suppressor:anticipation', () => this.services.audioManager.playSuppressorAnticipation?.());
    subscribe('enemy:suppressor:suppression:started', () => { this.encounterTelemetry?.recordSuppression?.(); this.services.audioManager.playSuppressorActive?.(); });
    subscribe('enemy:suppressor:suppression:ended', () => this.services.audioManager.playSuppressorExpire?.());
    subscribe('director:recovery:started', () => this.services.audioManager.playRecoveryStart?.());
    subscribe('director:phase:changed', ({ phase }) => { if (phase === 'CLIMAX') this.services.audioManager.playClimaxStart?.(); });
    subscribe('elite:spawned', () => this.services.audioManager.playEliteSpawn?.());
    subscribe('elite:overclocked:attack', () => this.services.audioManager.playEliteOverclockedPulse?.());
    subscribe('elite:replicating:triggered', () => this.services.audioManager.playEliteSplitWarning?.());
    subscribe('elite:replicating:copy:assembled', () => this.services.audioManager.playEliteCopyAssembly?.());
    subscribe('elite:resonant:shield:started', () => this.services.audioManager.playEliteShield?.());
    subscribe('elite:resonant:shield:ended', () => this.services.audioManager.playEliteShieldBreak?.());
    subscribe('elite:defeated', ({ modifierId, enemyType }) => {
      if (!this.run.eliteModifiersDefeated.includes(modifierId)) this.run.eliteModifiersDefeated.push(modifierId);
      if (!this.run.eliteHostTypesDefeated.includes(enemyType)) this.run.eliteHostTypesDefeated.push(enemyType);
      this.services.audioManager.playEliteDefeat?.();
    });
  }

  #pauseCombat() {
    if (!this.scene.isActive() || this.game.scene.isActive(SCENE_KEYS.pause) || this.completed) return;
    this.services.sceneFlow.openOverlay({
      pauseKeys: [SCENE_KEYS.run, SCENE_KEYS.hud],
      overlayKey: SCENE_KEYS.pause,
      payload: { runId: this.run?.runId },
      token: `pause-${performance.now()}`,
    });
  }

  #simulationActive() {
    return [COMBAT_STATES.chamberIntro, COMBAT_STATES.active, COMBAT_STATES.recovery].includes(this.combatState.value)
      && !this.playerHealth.defeated;
  }

  #combatAcceptsDamage() {
    return this.#simulationActive() && !this.services.inputManager.locked && !this.completed;
  }

  #recordingEnabled() {
    return this.#simulationActive() && (this.playerController.state.is(PLAYER_STATES.active) || this.playerController.state.is(PLAYER_STATES.dashing));
  }

  #requestEchoDeployment({ force = false } = {}) {
    const time = this.run.elapsedSimulationMs;
    const rejection = this.#deploymentRejection();
    if (rejection && !force) {
      this.statistics.recordRejectedDeployment(rejection);
      this.services.eventBus.emit('echo:deployment:rejected', { reason: rejection, timestampMs: time });
      return null;
    }
    const loadout = createEchoLoadoutSnapshot({
      ...this.weaponSystem.getEchoLoadoutSource(),
      echoDamageScalar: this.upgradeManager.echoScalar(),
    });
    const descriptor = this.echoRecorder.createReplayDescriptor(time, loadout);
    if (!descriptor) return null;
    const echo = this.echoPlaybackSystem.deploy(descriptor);
    if (!echo) return null;
    this.echoCooldown.consume();
    const twinProfile = loadout.twinRecall;
    if (twinProfile) this.upgradeManager.twinRecall.schedule(descriptor, twinProfile, time);
    return echo;
  }

  #deploymentRejection() {
    if (!this.#simulationActive() || this.services.inputManager.locked) return 'transition';
    if (this.playerController.state.is(PLAYER_STATES.dashing)) return 'dashing';
    if (!this.playerController.state.is(PLAYER_STATES.active)) return 'disabled';
    if (!this.echoRecorder.readiness.ready) return 'not-ready';
    if (!this.echoCooldown.isReady) return this.suppressionService?.active ? 'suppressed-cooldown' : 'cooldown';
    if (!this.echoPlaybackSystem.canDeploy()) return 'active-cap';
    return null;
  }

  #onCombatTargetHit(payload) {
    const crossfire = this.crossfireTracker.registerHit(payload);
    if (!crossfire) return;
    this.statistics.recordCrossfire();
    this.run.scoreManager.recordCrossfire(crossfire, { simulationMs: this.run.elapsedSimulationMs, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType });
    this.services.eventBus.emit('prototype:crossfire', crossfire);
    const profile = this.upgradeManager.data('resonant-damage');
    if (!profile) return;
    const enemy = this.enemyManager.activeEnemies.find((candidate) => candidate.enemyId === payload.targetId);
    if (!enemy?.active) return;
    const bonus = this.upgradeManager.resonantDamage.resolve({
      targetId: payload.targetId,
      firstSource: 'player',
      secondSource: 'echo',
      firstAt: crossfire.playerHitTimestampMs,
      secondAt: crossfire.echoHitTimestampMs,
      profile,
    });
    if (!bonus) return;
    const amount = Math.max(0, (Number(payload.damageApplied) || 0) * bonus);
    const packet = createDamagePacket({
      damageId: `resonant-damage-${payload.targetId}-${crossfire.crossfireEventId}`,
      sourceFaction: FACTIONS.echo,
      sourceType: 'resonant-damage',
      sourceId: `crossfire-${crossfire.crossfireEventId}`,
      targetType: enemy.type,
      targetId: enemy.enemyId,
      baseAmount: amount,
      finalAmount: amount,
      critical: false,
      damageTags: ['upgrade', 'resonant-damage'],
      hitPosition: { x: enemy.x, y: enemy.y },
      direction: { x: 0, y: 0 },
      timestampMs: this.run.elapsedSimulationMs,
      sourceUpgradeId: 'resonant-damage',
      triggerDepth: 1,
      canTriggerChain: false,
      canTriggerFragments: false,
      canCrit: false,
    });
    const result = this.damageService.resolve(packet, enemy, { absorbDamage: (value) => this.enemyManager.absorbTemporaryShield(enemy, value) });
    if (result.accepted) {
      this.enemyManager.onDamageResolved?.(enemy, result, packet);
      this.enemyManager.damage(enemy, result.damageApplied, 'echo', false, 'normal');
      if (result.targetDefeated) this.enemyManager.beginDeath(enemy, 'echo');
    }
  }

  #handleUpgradeDamage({ enemy, result, packet, projectile, source }) {
    if (!result?.accepted || !enemy?.active || (packet.triggerDepth ?? 0) > 0) return;
    if (packet.canTriggerChain !== false) {
      const profile = this.upgradeManager.registerArcHit(source === 'echo' ? `echo-${projectile.ownerId}` : 'player');
      if (profile) this.chainProjectileManager.trigger({ originEnemy: enemy, source, baseDamage: result.damageApplied, profile, sourceId: projectile.ownerId ?? source });
    }
    if (packet.critical && packet.canTriggerFragments !== false) {
      const descriptors = this.upgradeManager.createFragments({
        origin: { x: projectile.x, y: projectile.y },
        direction: { x: projectile.body.velocity.x, y: projectile.body.velocity.y },
        damage: result.damageApplied,
        sourceId: projectile.ownerId ?? source,
      });
      this.fragmentProjectileManager.spawn(descriptors, { source });
    }
  }

  #handleHostileProjectileDestroyed(projectileId, reason) {
    if (!projectileId) return;
    const qualifies = reason === 'player-projectile' || reason === 'phantom-shield';
    const amount = qualifies ? this.upgradeManager.nullAbsorptionDestroyed(projectileId) : 0;
    if (amount > 0) this.echoCooldown.recover(amount);
    this.services.eventBus.emit('upgrade:hostile-projectile:destroyed', { projectileId, reason, qualifies, cooldownReductionMs: amount });
  }

  #handleDashStarted(payload) {
    this.weaponSystem.reduceCharge(0.5);
    this.upgradeManager.onDashStarted(payload.direction);
    const end = { x: payload.x + payload.direction.x * payload.distance, y: payload.y + payload.direction.y * payload.distance };
    const wake = this.upgradeManager.dashWakeDescriptor({ start: { x: payload.x, y: payload.y }, end, source: 'player', sourceId: payload.dashEventId });
    if (wake) this.dashWakeManager.activate(wake);
    this.deflectionPulseManager.trigger(this.player, this.upgradeManager.deflectionProfile());
  }

  #handleEchoDash(payload) {
    const profile = payload.loadout?.dashWake;
    if (!profile?.enabled) return;
    const end = { x: payload.x + payload.directionX * payload.distance, y: payload.y + payload.directionY * payload.distance };
    this.dashWakeManager.activate({ start: { x: payload.x, y: payload.y }, end, source: 'echo', sourceId: payload.echoInstanceId, lifetimeMs: profile.lifetimeMs, damage: profile.damage * 0.55, width: profile.width });
  }

  #handleEchoExpiration(payload) {
    const descriptor = this.upgradeManager.memoryBurstDescriptor(payload);
    if (descriptor) this.memoryBurstManager.trigger(descriptor);
  }

  #updateTwinRecall() {
    for (const pending of this.upgradeManager.twinRecall.consumeReady(this.run.elapsedSimulationMs)) {
      if (!this.#simulationActive() || !this.echoPlaybackSystem.canDeploy()) continue;
      const sourceLoadout = pending.descriptor.loadout;
      const loadout = createEchoLoadoutSnapshot({ ...sourceLoadout, echoDamageScalar: sourceLoadout.echoDamageScalar * pending.scalar, twinRecall: null });
      const descriptor = deepFreeze({ ...pending.descriptor, loadout, twinRecallSecondary: true });
      this.echoPlaybackSystem.deploy(descriptor);
    }
  }

  #updateSlipstream() {
    for (const echo of this.echoPlaybackSystem.pool.activeItems) {
      this.upgradeManager.onEchoProximity(echo.instanceId, Math.hypot(echo.x - this.player.x, echo.y - this.player.y));
    }
  }

  #lastFrameContext() {
    const context = {
      available: this.upgradeManager.lastFrameAvailable && this.upgradeManager.level('last-frame') > 0,
      triggered: false,
      consume: () => { context.triggered = this.upgradeManager.consumeLastFrame(); },
    };
    return context;
  }

  #handlePlayerDeath(payload) {
    if (this.completed || this.combatState.is(COMBAT_STATES.dead)) return;
    this.combatState.set(COMBAT_STATES.dead);
    this.run.setStatus(COMBAT_STATES.dead);
    this.run.deathCount += 1;
    this.playerController.disable();
    this.echoRecorder.setEnabled(false);
    this.enemyProjectileManager.clear('player-dead');
    this.carrierShardManager.clear('player-dead');
    this.suppressionService.reset();
    this.projectileManager.clear('player-dead');
    this.echoProjectileManager.clear('player-dead');
    this.echoPlaybackSystem.clear('player-dead');
    this.services.audioManager.playPlayerDeath?.();
    this.cameraController.impulse(0.004, 160);
    this.cleanup.trackTimer(this.time.delayedCall(450, () => this.#completeRun('death', payload?.sourceType ?? 'unknown')));
  }

  #handleChamberClear() {
    if (this.chamberHandled || !this.chamberController.clear()) return;
    this.chamberHandled = true;
    this.combatState.set(COMBAT_STATES.chamberClear);
    this.run.setStatus(COMBAT_STATES.chamberClear);
    this.statistics.chamberDurations[this.chamberIndex] = this.chamberController.elapsedMs;
    this.statistics.segmentDurations[this.segment.segmentId] = this.chamberController.elapsedMs;
    const completion = this.runProgression.completeCurrentSegment({ durationMs: this.chamberController.elapsedMs, endingHealth: this.playerHealth.currentHealth });
    this.run.scoreManager.recordSegmentClear(this.segment.segmentId, { simulationMs: this.run.elapsedSimulationMs, segmentType: this.segment.segmentType });
    if (this.segment.requiresElite) {
      this.eliteTelemetry.segmentsCompleted += 1;
      this.eliteTelemetry.recordSegmentDuration(this.segment.segmentId, this.chamberController.elapsedMs);
      this.statistics.eliteEncountersCompleted += 1;
      this.services.audioManager.playEliteChamberComplete?.();
    }
    this.services.eventBus.emit('chamber:cleared', { chamberIndex: this.chamberIndex, segmentId: this.segment.segmentId, durationMs: this.chamberController.elapsedMs });
    this.services.audioManager.playChamberClear?.();
    this.#clearTransientCombat('segment-clear');
    this.upgradeManager.applyChamberRepair(this.playerHealth);
    this.playerController.lockForTransition();
    this.run.playerHealth = this.playerHealth.currentHealth;
    this.run.playerMaximumHealth = this.playerHealth.maximumHealth;
    this.statistics.updateEliteTelemetry(this.eliteTelemetry.snapshot());
    this.run.statistics.combat = this.statistics.snapshot();
    this.run.statistics.elites = this.eliteTelemetry.snapshot();
    this.run.statistics.upgrades = this.upgradeTelemetry.snapshot();

    if (completion.requiresUpgrade) {
      const offerIndex = this.runProgression.beginUpgrade();
      this.run.setStatus(COMBAT_STATES.upgrade);
      this.services.sceneFlow.replace({
        sourceKeys: [SCENE_KEYS.run, SCENE_KEYS.hud],
        targetKey: SCENE_KEYS.upgrade,
        payload: { runId: this.run.runId, offerIndex, completedSegmentId: this.segment.segmentId },
        token: `${this.segment.segmentId}-upgrade-${this.run.runId}-${offerIndex}`,
      });
    } else {
      this.run.preBossComplete = true;
      this.#completeRun('victory');
    }
  }

  #completeRun(resultType, cause = null) {
    if (this.completed) return;
    this.completed = true;
    this.#clearTransientCombat('run-complete');
    this.statistics.updateDirectorTelemetry(this.encounterTelemetry.snapshot());
    this.statistics.updateEliteTelemetry(this.eliteTelemetry.snapshot());
    this.statistics.result = resultType;
    this.statistics.totalDurationMs = this.run.combatElapsedMs;
    this.statistics.playerRemainingHealth = this.playerHealth.currentHealth;
    this.run.playerHealth = this.playerHealth.currentHealth;
    this.run.statistics.combat = this.statistics.snapshot();
    this.run.statistics.elites = this.eliteTelemetry.snapshot();
    this.run.statistics.upgrades = this.upgradeTelemetry.snapshot();
    const result = {
      title: resultType === 'victory' ? 'Pre-Boss Run Complete' : 'Signal Lost',
      result: resultType,
      cause,
      durationMs: this.run.combatElapsedMs,
      difficultyId: this.run.difficultyId,
      seed: this.run.seed,
      statistics: this.statistics.snapshot(),
      selectedUpgrades: Object.fromEntries(this.run.selectedUpgrades),
      selectedUpgradeHistory: structuredClone(this.run.selectedUpgradeHistory),
      segmentDurations: { ...this.run.segmentDurations },
      runPlan: structuredClone(this.run.runPlan),
      preBossComplete: this.run.preBossComplete,
      eliteTelemetry: this.eliteTelemetry.snapshot(),
      transitionCount: this.services.sceneFlow.transitionCount + 1,
    };
    this.services.eventBus.emit('run:combat:completed', structuredClone(result));
    const finalized = this.services.runFinalizationService.finalize({ run: this.run, result });
    const finalResult = finalized.committed ? finalized.result : result;
    this.services.gameState.completeRun(finalResult);
    this.services.sceneFlow.replace({
      sourceKeys: [SCENE_KEYS.run, SCENE_KEYS.hud],
      targetKey: SCENE_KEYS.results,
      payload: finalResult,
      token: `combat-results-${this.run.runId}-${resultType}`,
    });
  }

  #clearTransientCombat(reason) {
    this.eliteManager?.clear(reason);
    this.enemyManager?.clear(reason);
    this.carrierShardManager?.clear(reason);
    this.arenaHazardManager?.clear(reason);
    this.suppressionService?.reset();
    this.enemyProjectileManager?.clear(reason);
    this.projectileManager?.clear(reason);
    this.echoProjectileManager?.clear(reason);
    this.echoPlaybackSystem?.clear(reason);
    this.dashWakeManager?.clear();
    this.memoryBurstManager?.clear();
    this.deflectionPulseManager?.clear();
    this.nearMissTracker?.reset();
    this.upgradeManager?.clearTransient();
    this.echoRecorder?.setEnabled(false);
  }

  #emitTelemetry(force = false) {
    if (!force && !this.scene.isActive()) return;
    const recorder = this.echoRecorder.getDiagnostics();
    const playback = this.echoPlaybackSystem.getDiagnostics();
    const enemyDiagnostics = this.enemyManager.getDiagnostics();
    const hostilePool = this.enemyProjectileManager.getDiagnostics();
    const carrierShards = this.carrierShardManager.getDiagnostics();
    const directorTelemetry = this.encounterTelemetry.snapshot();
    this.statistics.updateDirectorTelemetry(directorTelemetry);
    this.statistics.updateBufferWraps(recorder.snapshotWrapCount, recorder.fireEventWrapCount, recorder.dashEventWrapCount);
    this.services.eventBus.emit('combat:telemetry', {
      elapsedSimulationMs: this.run.elapsedSimulationMs,
      difficultyId: this.run.difficultyId,
      chamberIndex: this.chamberIndex,
      segmentId: this.segment?.segmentId ?? null,
      segmentType: this.segment?.segmentType ?? null,
      segmentIndex: this.run.currentSegmentIndex,
      runPlanSummary: JSON.stringify(this.run.runPlan.segments.map((segment) => ({ id: segment.segmentId, elite: segment.elitePlan?.modifierId ?? null }))),
      runStatus: this.combatState.value,
      encounter: this.encounterDirector.snapshot(),
      player: this.playerController.getSnapshot(),
      health: this.playerHealth.snapshot(),
      invulnerability: this.hitInvulnerability.snapshot(),
      weapon: this.weaponSystem.getSnapshot(),
      statistics: this.statistics.snapshot(),
      projectilePool: this.projectileManager.getDiagnostics(),
      echoProjectilePool: this.echoProjectileManager.getDiagnostics(),
      hostileProjectilePool: hostilePool,
      carrierShardPool: carrierShards,
      enemies: enemyDiagnostics,
      recorder,
      cooldown: this.echoCooldown.snapshot(),
      playback,
      upgrades: this.upgradeManager.snapshot(),
      damage: this.damageService.diagnostics(),
      suppression: this.suppressionService.snapshot(),
      directorTelemetry,
      arena: this.arenaManager?.snapshot?.() ?? null,
      arenaHazards: this.arenaHazardManager?.snapshot?.() ?? null,
      score: this.run.scoreManager.snapshot(),
    });
  }

  #createDebugSnapshot() {
    if (!this.playerController) return null;
    const telemetry = {
      player: this.playerController.getSnapshot(),
      enemy: this.enemyManager.getDiagnostics(),
      hostile: this.enemyProjectileManager.getDiagnostics(),
      carrierShards: this.carrierShardManager.getDiagnostics(),
      recorder: this.echoRecorder.getDiagnostics(),
      playback: this.echoPlaybackSystem.getDiagnostics(),
      playerPool: this.projectileManager.getDiagnostics(),
      echoPool: this.echoProjectileManager.getDiagnostics(),
      encounter: this.encounterDirector.snapshot(),
      damage: this.damageService.diagnostics(),
      suppression: this.suppressionService.snapshot(),
      directorTelemetry: this.encounterTelemetry.snapshot(),
    };
    return {
      playerPosition: `${telemetry.player.position.x.toFixed(1)}, ${telemetry.player.position.y.toFixed(1)}`,
      playerVelocity: `${telemetry.player.velocity.x.toFixed(1)}, ${telemetry.player.velocity.y.toFixed(1)}`,
      playerState: telemetry.player.state,
      aim: `${telemetry.player.aim.x.toFixed(3)}, ${telemetry.player.aim.y.toFixed(3)}`,
      dashRemaining: Math.round(telemetry.player.dash.remainingMs),
      dashCooldown: Math.round(telemetry.player.dash.cooldownRemainingMs),
      activeProjectiles: telemetry.playerPool.active,
      projectileCapacity: telemetry.playerPool.capacity,
      targetHits: this.statistics.playerProjectileHits + this.statistics.echoProjectileHits,
      wallCollisions: this.statistics.wallCollisions,
      recordingSpanMs: telemetry.recorder.recordingSpanMs,
      sampleRateHz: telemetry.recorder.sampleRateHz,
      snapshotCount: telemetry.recorder.snapshotCount,
      snapshotCapacity: telemetry.recorder.snapshotCapacity,
      snapshotWraps: telemetry.recorder.snapshotWrapCount,
      fireEventCount: telemetry.recorder.fireEventCount,
      fireEventCapacity: telemetry.recorder.fireEventCapacity,
      dashEventCount: telemetry.recorder.dashEventCount,
      dashEventCapacity: telemetry.recorder.dashEventCapacity,
      activeEchoCount: telemetry.playback.activeCount,
      echoState: telemetry.playback.activeEcho?.state ?? 'INACTIVE',
      echoInstanceId: telemetry.playback.activeEcho?.instanceId ?? 0,
      sourceTimeMs: telemetry.playback.activeEcho?.sourceTimeMs ?? 0,
      playbackElapsedMs: telemetry.playback.activeEcho?.playbackElapsedMs ?? 0,
      snapshotCursor: telemetry.playback.activeEcho?.snapshotCursor ?? 0,
      fireCursor: telemetry.playback.activeEcho?.fireCursor ?? 0,
      dashCursor: telemetry.playback.activeEcho?.dashCursor ?? 0,
      echoCooldownMs: this.echoCooldown.remainingMs,
      activeEchoProjectiles: telemetry.echoPool.active,
      echoProjectileCapacity: telemetry.echoPool.capacity,
      lastEventTimingErrorMs: telemetry.playback.lastEventTimingErrorMs,
      maximumEventTimingErrorMs: telemetry.playback.maximumEventTimingErrorMs,
      crossfires: this.statistics.crossfireEvents,
      loadoutVersion: telemetry.playback.activeEcho?.loadoutVersion ?? 'none',
      combatStatus: this.combatState.value,
      arenaInstanceId: this.segment.arenaDescriptor?.arenaInstanceId ?? null,
      arenaTemplate: this.segment.arenaDescriptor?.templateId ?? null,
      arenaTransform: this.segment.arenaDescriptor?.transformId ?? null,
      arenaHazard: this.segment.arenaDescriptor?.hazardConfigurationId ?? 'none',
      chamberIndex: this.chamberIndex,
      segmentId: this.segment?.segmentId ?? null,
      segmentType: this.segment?.segmentType ?? null,
      segmentIndex: this.run.currentSegmentIndex,
      runPlanSummary: JSON.stringify(this.run.runPlan.segments.map((segment) => ({ id: segment.segmentId, elite: segment.elitePlan?.modifierId ?? null }))),
      encounterStep: telemetry.encounter.stepIndex,
      encounterState: telemetry.encounter.state,
      enemiesActive: telemetry.enemy.active,
      driftersActive: telemetry.enemy.drifters,
      sentriesActive: telemetry.enemy.sentries,
      enemyCountsByType: JSON.stringify(telemetry.enemy.countsByType),
      enemyCountsByRole: JSON.stringify(telemetry.enemy.countsByRole),
      carrierShardsActive: telemetry.carrierShards.active,
      suppressionActive: telemetry.suppression.active,
      suppressionScalar: telemetry.suppression.scalar,
      hostileProjectiles: telemetry.hostile.active,
      playerHealth: `${this.playerHealth.currentHealth}/${this.playerHealth.maximumHealth}`,
      hitInvulnerabilityMs: this.hitInvulnerability.remainingMs,
      hitInvulnerabilityDurationMs: this.hitInvulnerability.durationMs,
      dashInvulnerable: telemetry.player.dash.invulnerable,
      acceptedDamage: telemetry.damage.accepted,
      rejectedDamage: JSON.stringify(telemetry.damage.rejected),
      enemyPoolCapacity: Object.values(telemetry.enemy.pools).reduce((sum, pool) => sum + pool.capacity, 0),
      hostileProjectileCapacity: telemetry.hostile.capacity,
      directorSeed: telemetry.encounter.seed ?? this.run.seed,
      directorState: telemetry.encounter.directorState ?? telemetry.encounter.state,
      pacingPhase: telemetry.encounter.phase ?? telemetry.encounter.state,
      descriptorId: telemetry.encounter.descriptorId ?? telemetry.encounter.stepId ?? 'none',
      encounterPattern: telemetry.encounter.pattern ?? telemetry.encounter.label ?? 'none',
      targetThreat: telemetry.encounter.targetThreat ?? 0,
      actualThreat: telemetry.encounter.actualThreat ?? 0,
      activeThreat: telemetry.encounter.activeThreat ?? 0,
      scheduledThreatRemaining: telemetry.encounter.scheduledThreatRemaining ?? 0,
      scheduledSpawns: telemetry.encounter.scheduledSpawns,
      spawnQueueLength: telemetry.encounter.spawnQueueLength ?? telemetry.encounter.scheduledSpawns,
      recoveryRemainingMs: telemetry.encounter.recoveryRemainingMs ?? 0,
      generationAttempts: telemetry.encounter.generationAttempts ?? 0,
      generationFallback: Boolean(telemetry.encounter.fallbackUsed),
      generationRejections: JSON.stringify(telemetry.encounter.rejectionReasons ?? {}),
      selectedUpgradeLevels: JSON.stringify(Object.fromEntries(this.run.selectedUpgrades)),
      damageDeduplicationCount: telemetry.damage.dedupeSize,
      eliteState: JSON.stringify(this.eliteManager?.snapshot?.() ?? { active: 0, elites: [] }),
    };
  }

  #installDebugHooks() {
    if (!this.services.debugManager.enabled) return;
    const hooks = {
      getSnapshot: () => ({ ...this.#createDebugSnapshot(), activeEnemySnapshots: this.enemyManager.getActiveSnapshots(), combatStatistics: this.statistics.snapshot(), collisionHandles: this.collisionManager.colliders.length }),
      forceRecordingReady: () => this.echoRecorder.forceReady(this.playerController.getSnapshot(), this.run.elapsedSimulationMs),
      forceCooldownReady: () => this.echoCooldown.forceReady(),
      deployEcho: () => this.#requestEchoDeployment({ force: true }),
      clearEnemies: () => this.enemyManager.clear('debug-clear'),
      spawnDrifter: () => this.enemyManager.spawn('drifter', { x: 250, y: 180 }),
      spawnSentry: () => this.enemyManager.spawn('sentry', { x: 1350, y: 180 }),
      spawnSentryFacingPlayer: () => this.enemyManager.spawn('sentry', { x: this.player.x, y: Math.max(140, this.player.y - 300) }),
      defeatAllEnemies: () => { for (const enemy of [...this.enemyManager.activeEnemies]) this.enemyManager.beginDeath(enemy, 'player'); },
      setPlayerHealth: (value) => { this.playerHealth.setCurrent(value); this.services.eventBus.emit('player:health:changed', this.playerHealth.snapshot()); return this.playerHealth.snapshot(); },
      damagePlayer: (amount = 10) => { this.hitInvulnerability.clear(); return this.collisionManager?.debugDamagePlayer?.(amount) ?? null; },
      forceDeathNow: () => {
        if (this.completed || this.combatState.is(COMBAT_STATES.dead)) return false;
        this.playerHealth.setCurrent(0);
        this.services.eventBus.emit('player:health:changed', this.playerHealth.snapshot());
        this.#handlePlayerDeath({ sourceType: 'debug-lifecycle' });
        this.#completeRun('death', 'debug-lifecycle');
        return true;
      },
      makePlayerInvulnerable: (duration = 5000) => this.hitInvulnerability.start(duration),
      completeCurrentChamber: () => { this.encounterDirector.forceComplete(); this.#handleChamberClear(); },
      applyUpgrade: (id) => this.upgradeManager.apply(id),
      stressHostileProjectiles: () => { for (let i = 0; i < COMBAT_BALANCE.sliceCaps.hostileProjectiles; i += 1) { const a = i / COMBAT_BALANCE.sliceCaps.hostileProjectiles * Math.PI * 2; this.enemyProjectileManager.activate({ x: 800, y: 450, direction: { x: Math.cos(a), y: Math.sin(a) }, speed: 30, lifetimeMs: 10000, damage: 1, radius: 6, ownerId: 'stress' }); } return this.enemyProjectileManager.getDiagnostics(); },
      stressEnemyPools: () => { for (let i = 0; i < 12; i += 1) this.enemyManager.spawn('drifter', { x: 160 + i * 90, y: 160 + (i % 2) * 80 }); for (let i = 0; i < 4; i += 1) this.enemyManager.spawn('sentry', { x: 320 + i * 260, y: 700 }); return this.enemyManager.getDiagnostics(); },
      clearCombatObjects: () => this.#clearTransientCombat('debug-clear'),
      printDamageDiagnostics: () => this.damageService.diagnostics(),
      printEncounterState: () => this.encounterDirector.snapshot(),
      printEncounterDescriptor: () => structuredClone(this.encounterDirector.currentDescriptor),
      printThreatCalculations: () => this.encounterDirector.snapshot(),
      printSpawnSafety: () => structuredClone(this.encounterDirector.currentDescriptor?.enemyEntries ?? []),
      regenerateSameSeed: () => this.encounterGenerator.generateSegment({ segment: this.segment, difficultyId: this.run.difficultyId, playerPosition: this.player, spawnSafetyRadius: this.encounterDirector.spawnSafetyRadius ?? 260, spawnIntervalScalar: this.difficulty.spawnInterval, encounterHistory: new EncounterHistory() }),
      spawnLancer: () => this.enemyManager.spawn('lancer', { x: 250, y: 700 }),
      spawnShardCarrier: () => this.enemyManager.spawn('shard-carrier', { x: 1350, y: 700 }),
      spawnBulwark: () => this.enemyManager.spawn('bulwark', { x: 250, y: 450 }),
      spawnSuppressor: () => this.enemyManager.spawn('suppressor', { x: 1350, y: 450 }),
      spawnFullRoster: () => ['drifter', 'sentry', 'lancer', 'shard-carrier', 'bulwark', 'suppressor'].map((type, index) => this.enemyManager.spawn(type, { x: 220 + index * 220, y: index % 2 ? 650 : 180 })),
      forceSuppressorState: () => { const enemy = this.enemyManager.spawn('suppressor', { x: Math.min(1430, this.player.x + 120), y: this.player.y }); enemy?.activateFromSpawn(); enemy?.beginAnticipation(); enemy?.beginField(); if (enemy?.brain) enemy.brain.relocationRemainingMs = enemy.relocationIntervalMs; this.suppressionService.update(this.enemyManager.activeSuppressors, this.player); return { enemyId: enemy?.enemyId ?? null, suppression: this.suppressionService.snapshot() }; },
      clearCarrierShards: () => this.carrierShardManager.clear('debug-clear'),
      printRunPlan: () => structuredClone(this.run.runPlan),
      printCurrentSegment: () => structuredClone(this.segment),
      printEliteState: () => this.eliteManager.snapshot(),
      printArenaDescriptor: () => structuredClone(this.segment.arenaDescriptor),
      validateArena: () => this.arenaDebugController.validate(),
      printArenaState: () => ({ runtime: this.arenaManager.snapshot(), hazards: this.arenaHazardManager.snapshot() }),
      spawnElite: (enemyType = 'drifter', modifierId = 'overclocked') => {
        const plan = { modifierId, eliteInstanceId: `debug-${modifierId}-${enemyType}-${Date.now()}`, hostEnemyType: enemyType, baseThreat: 1, threatSurcharge: modifierId === 'overclocked' ? 3 : 4, totalThreat: modifierId === 'overclocked' ? 4 : 5, selectionSeed: this.run.seed, reservedEnemySlots: modifierId === 'replicating' ? 1 : 0, reservedSubordinateSlots: 0, tags: ['debug'] };
        return this.enemyManager.spawn(enemyType, { x: 800, y: 260 }, { descriptorId: 'debug-elite', elite: plan });
      },
      triggerReplication: (enemyId) => this.eliteDebugController.forceReplicationThreshold(enemyId),
      triggerResonance: (enemyId) => this.eliteDebugController.grantResonantShield(enemyId),
      printScoreLedger: () => this.run.scoreManager.ledger.snapshot(),
      printScoreBreakdown: () => this.run.scoreManager.finalized ?? this.run.scoreManager.snapshot(),
      setCombo: (value = 0) => { this.run.scoreManager.combo.reset(); this.run.scoreManager.combo.gain(Math.max(0, Number(value) || 0), this.run.elapsedSimulationMs, 'debug'); return this.run.scoreManager.combo.snapshot(); },
      addScoreEvent: (type = 'near-miss') => type === 'crossfire'
        ? this.run.scoreManager.recordCrossfire({ crossfireEventId: `debug-${this.run.elapsedSimulationMs}`, targetId: 'debug-target' }, { simulationMs: this.run.elapsedSimulationMs, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType, debug: true })
        : this.run.scoreManager.recordNearMiss({ projectileId: `debug-${this.run.elapsedSimulationMs}` }, { simulationMs: this.run.elapsedSimulationMs, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType, debug: true }),
      applyComboDamagePenalty: (amount = 1) => this.run.scoreManager.recordAcceptedDamage(amount, this.run.elapsedSimulationMs),
      evaluateUnlocks: () => this.services.runFinalizationService.progressionManager.evaluate({ finalizedRun: { result: 'defeat', debug: true }, save: this.services.saveManager.getSnapshot() }),
      jumpToSegment: (index) => {
        const nextIndex = Math.max(0, Math.min(this.run.runPlan.segments.length - 1, Number(index) || 0));
        this.#clearTransientCombat('debug-segment-jump');
        this.run.currentSegmentIndex = nextIndex;
        this.run.currentSegmentId = this.run.runPlan.segments[nextIndex].segmentId;
        this.run.currentSegmentType = this.run.runPlan.segments[nextIndex].segmentType;
        this.run.transitionLocked = false;
        this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.run, SCENE_KEYS.hud], targetKey: SCENE_KEYS.run, payload: { runId: this.run.runId }, launch: [{ key: SCENE_KEYS.hud, payload: { runId: this.run.runId } }], token: `debug-jump-${nextIndex}-${performance.now()}` });
        return structuredClone(this.run.runPlan.segments[nextIndex]);
      },
    };
    globalThis.__ECHOFRAME_PHASE5__ = hooks;
    globalThis.__ECHOFRAME_PHASE6__ = hooks;
    globalThis.__ECHOFRAME_PHASE7__ = hooks;
    globalThis.__ECHOFRAME_PHASE9__ = hooks;
    this.cleanup.add(() => {
      if (globalThis.__ECHOFRAME_PHASE5__ === hooks) delete globalThis.__ECHOFRAME_PHASE5__;
      if (globalThis.__ECHOFRAME_PHASE6__ === hooks) delete globalThis.__ECHOFRAME_PHASE6__;
      if (globalThis.__ECHOFRAME_PHASE7__ === hooks) delete globalThis.__ECHOFRAME_PHASE7__;
      if (globalThis.__ECHOFRAME_PHASE9__ === hooks) delete globalThis.__ECHOFRAME_PHASE9__;
    });
  }

  #destroyCombat() {
    this.services.debugManager.clearGameplayProvider(this);
    if (this.run) {
      this.statistics?.updateEliteTelemetry?.(this.eliteTelemetry?.snapshot?.() ?? {});
      this.run.statistics.combat = this.statistics?.snapshot?.() ?? this.run.statistics.combat;
      this.run.statistics.elites = this.eliteTelemetry?.snapshot?.() ?? this.run.statistics.elites;
      this.run.statistics.arenas = this.arenaTelemetry?.snapshot?.() ?? this.run.statistics.arenas;
      this.run.statistics.upgrades = this.upgradeTelemetry?.snapshot?.() ?? this.run.statistics.upgrades;
    }
    this.collisionManager?.destroy();
    this.dashWakeManager?.destroy();
    this.memoryBurstManager?.destroy();
    this.deflectionPulseManager?.clear();
    this.nearMissTracker?.reset();
    this.upgradeManager?.clearTransient();
    this.arenaHazardManager?.destroy();
    this.combatFeedbackSystem?.destroy();
    this.echoRecorder?.dispose();
    this.echoPlaybackSystem?.destroy();
    this.enemyManager?.destroy();
    this.eliteManager?.destroy();
    this.carrierShardManager?.destroy();
    this.suppressionService?.reset();
    this.encounterDirector?.dispose?.();
    this.enemyProjectileManager?.destroy();
    this.echoProjectileManager?.destroy();
    this.projectileManager?.destroy();
    this.player?.destroy();
    this.arenaManager?.destroy();
    this.collisionManager = null;
    this.arenaHazardManager = null;
    this.arenaManager = null;
    this.arenaRuntime = null;
    this.echoRecorder = null;
    this.echoPlaybackSystem = null;
    this.enemyManager = null;
    this.eliteManager = null;
    this.eliteDebugController = null;
    this.carrierShardManager = null;
    this.suppressionService = null;
    this.encounterDirector = null;
    this.enemyProjectileManager = null;
    this.echoProjectileManager = null;
    this.projectileManager = null;
    this.playerController = null;
    this.weaponSystem = null;
    this.player = null;
  }

  #returnInvalidRunToMenu() {
    this.services.sceneFlow.replace({
      sourceKeys: [SCENE_KEYS.run, SCENE_KEYS.hud],
      targetKey: SCENE_KEYS.mainMenu,
      fadeMs: 0,
      token: `invalid-run-${performance.now()}`,
    });
  }
}
