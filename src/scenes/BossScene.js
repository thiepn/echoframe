import { DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { PLAYER_BALANCE } from '../data/playerBalance.js';
import { ECHO_BALANCE } from '../data/echoBalance.js';
import { COMBAT_BALANCE, getDifficultyCombatProfile } from '../data/combatBalance.js';
import { BOSS_BALANCE, BOSS_PHASES } from '../data/bossBalance.js';
import { getBossDifficultyRules } from '../data/bossDifficultyRules.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { HitInvulnerabilityComponent } from '../components/HitInvulnerabilityComponent.js';
import { DamageService } from '../combat/DamageService.js';
import { createDamagePacket } from '../combat/DamagePacket.js';
import { FACTIONS } from '../combat/Faction.js';
import { Player } from '../entities/Player.js';
import { COMBAT_STATES, CombatState } from '../state/CombatState.js';
import { PLAYER_STATES } from '../state/PlayerState.js';
import { RunProgressionController } from '../run/RunProgressionController.js';
import { createBossStartSnapshot } from '../boss/BossSnapshot.js';
import { BossRandomStreams } from '../boss/BossRandomStreams.js';
import { BossAttackScheduler } from '../boss/BossAttackScheduler.js';
import { NullArchitectController } from '../boss/NullArchitectController.js';
import { BossOutcomeResolver } from '../boss/BossOutcomeResolver.js';
import { BossDestructionController } from '../boss/BossDestructionController.js';
import { createRotatingFanPlan } from '../boss/attacks/RotatingFanAttack.js';
import { createTargetedLineVolleyPlan } from '../boss/attacks/TargetedLineVolleyAttack.js';
import { createRearPanelPlan } from '../boss/attacks/RearPanelExposureAttack.js';
import { createHostileEchoPlan } from '../boss/attacks/HostileEchoAttack.js';
import { HostileEchoSpawnValidator } from '../hostile-echo/HostileEchoSpawnValidator.js';
import { NullArchitectRenderer } from '../graphics/NullArchitectRenderer.js';
import { BossTelemetry } from '../systems/BossTelemetry.js';
import { BossDebugController } from '../systems/BossDebugController.js';
import { BossProjectileManager } from '../systems/BossProjectileManager.js';
import { BossSectorManager } from '../systems/BossSectorManager.js';
import { BossSummonController } from '../systems/BossSummonController.js';
import { HostileEchoManager } from '../hostile-echo/HostileEchoManager.js';
import { ArenaManager } from '../systems/ArenaManager.js';
import { ArenaTelemetry } from '../systems/ArenaTelemetry.js';
import { PlayerController } from '../systems/PlayerController.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { ProjectileManager } from '../systems/ProjectileManager.js';
import { EchoProjectileManager } from '../systems/EchoProjectileManager.js';
import { EnemyProjectileManager } from '../systems/EnemyProjectileManager.js';
import { EnemyManager } from '../systems/EnemyManager.js';
import { CollisionManager } from '../systems/CollisionManager.js';
import { CombatStatistics } from '../systems/CombatStatistics.js';
import { UpgradeManager } from '../systems/UpgradeManager.js';
import { UpgradeTelemetry } from '../systems/UpgradeTelemetry.js';
import { EchoRecorder } from '../systems/EchoRecorder.js';
import { EchoCooldownModel } from '../systems/EchoCooldownModel.js';
import { EchoPlaybackSystem } from '../systems/EchoPlaybackSystem.js';
import { createEchoLoadoutSnapshot } from '../systems/EchoLoadoutSnapshot.js';
import { CrossfireTracker } from '../systems/CrossfireTracker.js';
import { SuppressionModifierService } from '../systems/SuppressionModifierService.js';
import { NearMissTracker } from '../systems/NearMissTracker.js';
import { CameraController } from '../systems/CameraController.js';
import { BaseScene } from './BaseScene.js';
import { TEXTURE_KEYS } from '../graphics/TextureFactory.js';
import { destroyPhysicsCollider } from '../utils/physicsCleanup.js';

const CENTER = Object.freeze({ x: 800, y: 450 });
const TELEMETRY_INTERVAL_MS = 100;
const PANEL_OFFSETS = Object.freeze({
  north: Object.freeze({ x: 0, y: -128 }),
  east: Object.freeze({ x: 128, y: 0 }),
  south: Object.freeze({ x: 0, y: 128 }),
  west: Object.freeze({ x: -128, y: 0 }),
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export class BossScene extends BaseScene {
  constructor(services) {
    super(SCENE_KEYS.boss, services);
    this.completed = false;
    this.telemetryElapsedMs = 0;
    this.attackRuntime = null;
    this.panelRuntime = null;
    this.introRemainingMs = 0;
    this.contactCooldownMs = 0;
    this.extraColliders = [];
  }

  create() {
    this.beginScene({ input: true });
    this.completed = false;
    this.telemetryElapsedMs = 0;
    this.attackRuntime = null;
    this.panelRuntime = null;
    this.contactCooldownMs = 0;
    this.outcomeResolver = new BossOutcomeResolver();

    const run = this.services.gameState.activeRun;
    if (!run || run.runId !== this.sceneData.runId) {
      this.#returnInvalidRunToMenu();
      return;
    }
    this.run = run;
    this.run.scoreManager.eventBus = this.services.eventBus;
    this.progression = new RunProgressionController(run);
    this.segment = this.progression.markSegmentStarted();
    if (!this.segment || this.segment.segmentType !== 'BOSS') {
      this.#returnInvalidRunToMenu();
      return;
    }

    this.run.bossStarted = true;
    this.run.bossStartSnapshot ??= createBossStartSnapshot(run);
    this.run.bossMaximumHealth = BOSS_BALANCE.health;
    this.combatState = new CombatState().set(COMBAT_STATES.bossIntro);
    this.run.setStatus(COMBAT_STATES.bossIntro);
    this.run.currentChamberIndex = this.segment.chamberIndex;
    this.run.currentChamberId = this.segment.segmentId;
    this.run.currentArenaId = this.segment.arenaDescriptor.arenaInstanceId;

    this.difficulty = getDifficultyCombatProfile(run.difficultyId);
    this.bossDifficulty = getBossDifficultyRules(run.difficultyId);
    this.statistics = new CombatStatistics(run.statistics.combat ?? {});
    this.upgradeTelemetry = new UpgradeTelemetry(run.statistics.upgrades ?? {});
    this.upgradeManager = new UpgradeManager({ run, eventBus: this.services.eventBus, telemetry: this.upgradeTelemetry });
    this.bossTelemetry = new BossTelemetry(run.statistics.boss ?? {});
    this.random = new BossRandomStreams(this.segment.encounterSeed, run.difficultyId, BOSS_BALANCE.generationVersion);

    this.playerHealth = new HealthComponent(run.playerMaximumHealth || COMBAT_BALANCE.player.maximumHealth);
    this.playerHealth.setCurrent(run.playerHealth ?? this.playerHealth.maximumHealth);
    this.hitInvulnerability = new HitInvulnerabilityComponent(Math.max(550, COMBAT_BALANCE.player.postHitInvulnerabilityMs * this.difficulty.hitInvulnerability));
    this.damageService = new DamageService({
      eventBus: this.services.eventBus,
      capacity: COMBAT_BALANCE.playtest.damageDeduplicationCapacity,
      runStateProvider: () => !this.completed && !this.combatState.is(COMBAT_STATES.results),
    });

    this.#createPresentation();
    this.arenaTelemetry = new ArenaTelemetry(run.statistics.arenas ?? {});
    this.arenaManager = new ArenaManager({ scene: this, eventBus: this.services.eventBus, telemetry: this.arenaTelemetry });
    this.arenaRuntime = this.arenaManager.activate(this.segment.arenaDescriptor);
    this.wallGroup = this.arenaRuntime.wallGroup;
    this.wallDefinitions = this.segment.arenaDescriptor.solidGeometry.filter((solid) => solid.id !== 'boss-core');
    const coreWall = this.wallGroup.getChildren().find((child) => child.getData('wallId') === 'boss-core');
    if (coreWall) this.wallGroup.remove(coreWall, true, true);

    this.player = new Player(this, { ...this.segment.arenaDescriptor.playerSpawn, settingsManager: this.services.settingsManager });
    this.projectileManager = new ProjectileManager({ scene: this, eventBus: this.services.eventBus, settingsManager: this.services.settingsManager, statistics: this.statistics, arenaBounds: this.segment.arenaDescriptor.cameraBounds });
    this.echoProjectileManager = new EchoProjectileManager({ scene: this, eventBus: this.services.eventBus, settingsManager: this.services.settingsManager, statistics: this.statistics, arenaBounds: this.segment.arenaDescriptor.cameraBounds });
    this.enemyProjectileManager = new EnemyProjectileManager({ scene: this, eventBus: this.services.eventBus, statistics: this.statistics, arenaBounds: this.segment.arenaDescriptor.cameraBounds });
    this.suppressionService = new SuppressionModifierService({ eventBus: this.services.eventBus });
    this.enemyManager = new EnemyManager({
      scene: this,
      eventBus: this.services.eventBus,
      settingsManager: this.services.settingsManager,
      difficultyProfile: this.difficulty,
      statistics: this.statistics,
      enemyProjectileManager: this.enemyProjectileManager,
      carrierShardManager: null,
      suppressionService: this.suppressionService,
      eliteManager: null,
      arenaDescriptor: this.segment.arenaDescriptor,
    });

    this.playerController = new PlayerController({
      player: this.player,
      inputContext: this.inputContext,
      eventBus: this.services.eventBus,
      statistics: this.statistics,
      dashDistanceResolver: (x, y, direction, desiredDistance, radius) => this.collisionManager?.resolveDashDistance(x, y, direction, desiredDistance, radius) ?? desiredDistance,
      movementSpeedProvider: () => this.upgradeManager.movementSpeedScalar(),
      secondaryDashProvider: (direction) => this.upgradeManager.tryVectorReversal(direction),
    });
    this.weaponSystem = new WeaponSystem({ player: this.player, playerController: this.playerController, inputContext: this.inputContext, projectileManager: this.projectileManager, eventBus: this.services.eventBus, statistics: this.statistics, upgradeManager: this.upgradeManager });
    this.echoRecorder = new EchoRecorder({
      eventBus: this.services.eventBus,
      timeProvider: () => this.run?.elapsedSimulationMs ?? 0,
      replayDurationProvider: () => this.upgradeManager.echoProfile({ durationMs: ECHO_BALANCE.recording.baseReplayDurationMs, cooldownMs: ECHO_BALANCE.cooldown.durationMs }).durationMs,
    });
    const echoProfile = this.upgradeManager.echoProfile({ durationMs: ECHO_BALANCE.recording.baseReplayDurationMs, cooldownMs: ECHO_BALANCE.cooldown.durationMs });
    this.echoCooldown = new EchoCooldownModel(echoProfile.cooldownMs);
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

    this.collisionManager = new CollisionManager({
      scene: this,
      player: this.player,
      playerController: this.playerController,
      projectileManager: this.projectileManager,
      echoProjectileManager: this.echoProjectileManager,
      enemyProjectileManager: this.enemyProjectileManager,
      enemyManager: this.enemyManager,
      wallGroup: this.wallGroup,
      wallDefinitions: this.wallDefinitions,
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
      onEnemyDamageResolved: ({ enemy, result, packet, projectile, source }) => this.#handleUpgradeDamage({ enemy, result, packet, projectile, source }),
      hostileProjectileInterceptionProvider: () => this.upgradeManager.level('null-absorption') > 0,
      onHostileProjectileDestroyed: (projectileId, reason) => this.#handleHostileProjectileDestroyed(projectileId, reason),
    });
    this.collisionManager.register();

    this.bossProjectileManager = new BossProjectileManager({ scene: this, eventBus: this.services.eventBus, telemetry: this.bossTelemetry, difficultyRules: this.bossDifficulty, arenaBounds: this.segment.arenaDescriptor.cameraBounds });
    this.bossNearMissTracker = new NearMissTracker({ enemyProjectileManager: this.bossProjectileManager, playerProvider: () => this.player, timeProvider: () => this.run.elapsedSimulationMs, profileProvider: () => null, behavior: null, onNearMiss: (payload) => this.run.scoreManager.recordNearMiss(payload, { simulationMs: this.run.elapsedSimulationMs, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType }), telemetry: this.bossTelemetry.data });
    this.hostileEchoManager = new HostileEchoManager({ scene: this, eventBus: this.services.eventBus, projectileManager: this.bossProjectileManager, telemetry: this.bossTelemetry, settingsManager: this.services.settingsManager });
    this.sectorManager = new BossSectorManager({
      scene: this,
      rng: this.random.sectorSelection,
      arenaBounds: { left: 128, right: 1472, top: 93, bottom: 807 },
      telemetry: this.bossTelemetry,
      eventBus: this.services.eventBus,
      damagePlayer: (data) => this.#damagePlayer(data),
      settingsManager: this.services.settingsManager,
    });
    this.summonController = new BossSummonController({ enemyManager: this.enemyManager, rng: this.random.summonSelection, telemetry: this.bossTelemetry, eventBus: this.services.eventBus, sockets: this.segment.arenaDescriptor.enemySockets });
    this.scheduler = new BossAttackScheduler({ rng: this.random.attackSelection, telemetry: this.bossTelemetry });
    this.bossController = new NullArchitectController({ damageService: this.damageService, scheduler: this.scheduler, telemetry: this.bossTelemetry, eventBus: this.services.eventBus, difficultyId: run.difficultyId });
    this.renderer = new NullArchitectRenderer(this, { ...CENTER, settingsManager: this.services.settingsManager });
    this.spawnValidator = new HostileEchoSpawnValidator();
    this.debugController = new BossDebugController(this);

    this.#createBossPhysics();
    this.#registerEvents();
    this.#registerBossCollisions();
    this.cameraController = new CameraController({ camera: this.cameras.main, settingsManager: this.services.settingsManager });
    this.echoRecorder.start(run.elapsedSimulationMs, this.playerController.getSnapshot());
    this.bossController.start();
    const seen = this.services.saveManager.getSnapshot().meta.seenIntroductions.includes('null-architect');
    this.introRemainingMs = seen ? BOSS_BALANCE.intro.repeatedMs : BOSS_BALANCE.intro.firstMs;
    this.destruction = new BossDestructionController({
      firstVictory: !this.services.saveManager.getSnapshot().statistics.bossRecords?.['null-architect']?.defeats,
      renderer: this.renderer,
      telemetry: this.bossTelemetry,
      onComplete: ({ skipped }) => this.#finalizeVictory(skipped),
    });

    this.services.eventBus.emit('player:health:changed', this.playerHealth.snapshot());
    this.services.debugManager.setGameplayProvider(() => this.#debugSnapshot(), this);
    this.#installDebugHooks();
    this.cleanup.add(() => this.#destroyBossRuntime());
    this.#emitTelemetry(true);
  }

  update(_time, delta) {
    if (!this.playerController || this.completed) return;
    const safeDeltaMs = Math.min(Math.max(0, Number(delta) || 0), ECHO_BALANCE.recording.maximumSimulationDeltaMs);
    if (!this.services.inputManager.locked && this.inputContext.justPressed('pause')) {
      this.services.eventBus.emit('run:pause:requested', { source: 'keyboard' });
      return;
    }
    if (this.destruction?.active) {
      if (this.inputContext.justPressed('confirm') || this.input.activePointer.justDown) this.destruction.skip();
      this.destruction.update(safeDeltaMs);
      this.renderer.update(safeDeltaMs);
      this.#emitTelemetryTimed(safeDeltaMs);
      return;
    }

    const locked = this.services.inputManager.locked;
    const introActive = this.introRemainingMs > 0;
    const simulationActive = !locked && !introActive && !this.bossController.transitioning && !this.completed;
    if (introActive && !locked) {
      this.introRemainingMs = Math.max(0, this.introRemainingMs - safeDeltaMs);
      if (this.introRemainingMs === 0) {
        this.combatState.set(COMBAT_STATES.bossActive);
        this.run.setStatus(COMBAT_STATES.bossActive);
        this.services.saveManager.update((save) => { if (!save.meta.seenIntroductions.includes('null-architect')) save.meta.seenIntroductions.push('null-architect'); }, { immediate: true });
      }
    }
    if (simulationActive) this.run.advance(safeDeltaMs);

    this.hitInvulnerability.update(safeDeltaMs, { paused: !simulationActive });
    this.playerController.setHitInvulnerable(this.hitInvulnerability.active);
    const speed = Math.hypot(this.player.velocity.x, this.player.velocity.y);
    this.upgradeManager.update(safeDeltaMs, this.playerHealth, simulationActive, { speed, maximumSpeed: PLAYER_BALANCE.movement.maximumSpeed * this.upgradeManager.movementSpeedScalar() });
    this.playerController.update(safeDeltaMs, this.cameras.main, !simulationActive);
    this.weaponSystem.update(safeDeltaMs, !simulationActive);
    if (simulationActive && this.inputContext.justPressed('deployEcho')) this.#requestEchoDeployment();

    if (simulationActive) {
      this.projectileManager.update(safeDeltaMs);
      this.echoPlaybackSystem.update(safeDeltaMs);
      this.echoProjectileManager.update(safeDeltaMs);
      this.bossProjectileManager.update(safeDeltaMs);
      this.bossNearMissTracker.update(safeDeltaMs);
      this.hostileEchoManager.update(safeDeltaMs);
      this.enemyProjectileManager.update(safeDeltaMs);
      this.enemyManager.update(safeDeltaMs, this.player);
      this.summonController.update(safeDeltaMs);
      this.echoCooldown.update(safeDeltaMs, 1);
      this.#updateTwinRecall();
      this.#updateSlipstream();
      this.echoRecorder.update(safeDeltaMs, this.run.elapsedSimulationMs, this.playerController.getSnapshot(), { enabled: this.#recordingEnabled() });
      this.sectorManager.update(safeDeltaMs, this.player, { paused: false });
      this.#updateAttackRuntime(safeDeltaMs);
      this.#updatePanels(safeDeltaMs);
      this.#updateContactDamage(safeDeltaMs);
      const update = this.bossController.update(safeDeltaMs, {
        summonThreat: this.summonController.activeThreat,
        hostileEchoes: this.hostileEchoManager.activeCount,
        hostileEchoCap: this.bossController.phase === BOSS_PHASES.imitate && this.bossController.health.currentHealth > this.bossController.maximumHealth * 0.48 ? 1 : 2,
        sectorActive: this.sectorManager.state !== 'SAFE',
        panelsActive: Boolean(this.panelRuntime),
        maximumMajor: this.attackRuntime?.major ? 0 : 1,
      });
      if (update.vulnerabilityEvents.length) this.renderer.setVulnerability(this.bossController.vulnerability.state);
      if (update.attack) this.#beginAttack(update.attack);
      if (update.transitionCompleted) this.#completePhaseTransition();
    }
    if (!locked && !introActive && this.bossController.transitioning && !this.completed) {
      const transitionUpdate = this.bossController.update(safeDeltaMs, { paused: false, transitioning: true });
      if (transitionUpdate.transitionCompleted) this.#completePhaseTransition();
    }

    this.renderer.update(safeDeltaMs);
    this.run.playerHealth = this.playerHealth.currentHealth;
    this.run.playerMaximumHealth = this.playerHealth.maximumHealth;
    this.run.bossHealth = this.bossController.health.currentHealth;
    this.run.bossMaximumHealth = this.bossController.maximumHealth;
    this.run.bossPhase = this.bossController.phase;
    this.run.bossVulnerable = this.bossController.canDamage('core');
    this.run.bossActiveAttackId = this.attackRuntime?.id ?? null;
    this.run.bossAttackHistory = this.scheduler.history.map((entry) => ({ ...entry }));
    this.run.bossPhaseDurations = { ...this.bossController.phaseDurations };
    this.run.hostileEchoesSpawned = this.bossTelemetry.data.hostileEchoesSpawned;
    this.run.hostileEchoesDestroyed = this.bossTelemetry.data.hostileEchoesDestroyed;
    this.run.sectorPatternsCompleted = this.bossTelemetry.data.sectorPatterns;
    this.run.bossSummonsDefeated = this.bossTelemetry.data.summonDefeats;
    this.#emitTelemetryTimed(safeDeltaMs);
  }

  #createPresentation() {
    this.createFoundationBackground();
    this.add.text(105, 66, 'NULL ARCHITECT · BOSS CHAMBER', { fontFamily: 'monospace', fontSize: '15px', color: '#ff9aac' }).setDepth(50);
    this.add.text(DESIGN_WIDTH / 2, 830, 'WASD MOVE · MOUSE AIM/FIRE · SHIFT/RMB DASH · SPACE ECHO · ESC PAUSE', { fontFamily: 'monospace', fontSize: '14px', color: PALETTE.mutedText, backgroundColor: '#080b14cc', padding: { x: 12, y: 6 } }).setOrigin(0.5).setDepth(100);
  }

  #createBossPhysics() {
    this.bossShell = this.physics.add.staticImage(CENTER.x, CENTER.y, TEXTURE_KEYS.physicsBody).setVisible(false);
    this.bossShell.body.setCircle(132, 18 - 132, 18 - 132);
    this.bossShell.refreshBody();
    this.coreZone = this.physics.add.staticImage(CENTER.x, CENTER.y, TEXTURE_KEYS.physicsBody).setVisible(false);
    this.coreZone.body.setCircle(60, 18 - 60, 18 - 60);
    this.coreZone.refreshBody();
    this.coreZone.setData('bossHitZone', 'core');
    this.panelZones = new Map();
    for (const [id, offset] of Object.entries(PANEL_OFFSETS)) {
      const zone = this.physics.add.staticImage(CENTER.x + offset.x, CENTER.y + offset.y, TEXTURE_KEYS.physicsBody).setVisible(false);
      zone.body.setCircle(28, -10, -10);
      zone.refreshBody();
      zone.setData('bossHitZone', `panel:${id}`);
      this.panelZones.set(id, zone);
    }
  }

  #registerBossCollisions() {
    const add = (handle) => { this.extraColliders.push(handle); return handle; };
    add(this.physics.add.collider(this.player.bodySprite, this.bossShell));
    add(this.physics.add.collider(this.enemyManager.group, this.bossShell));
    add(this.physics.add.overlap(this.player.bodySprite, this.bossShell, () => this.#bossContact()));
    add(this.physics.add.overlap(this.projectileManager.group, this.coreZone, (projectile, zone) => this.#bossProjectileHit(projectile, zone, 'player', this.projectileManager)));
    add(this.physics.add.overlap(this.echoProjectileManager.group, this.coreZone, (projectile, zone) => this.#bossProjectileHit(projectile, zone, 'echo', this.echoProjectileManager)));
    for (const zone of this.panelZones.values()) {
      add(this.physics.add.overlap(this.projectileManager.group, zone, (projectile, target) => this.#bossProjectileHit(projectile, target, 'player', this.projectileManager)));
      add(this.physics.add.overlap(this.echoProjectileManager.group, zone, (projectile, target) => this.#bossProjectileHit(projectile, target, 'echo', this.echoProjectileManager)));
    }
    add(this.physics.add.collider(this.bossProjectileManager.group, this.wallGroup, (sprite) => this.#destroyBossProjectile(sprite, 'wall')));
    add(this.physics.add.overlap(this.bossProjectileManager.group, this.player.bodySprite, (sprite) => this.#bossProjectilePlayerHit(sprite)));
    add(this.physics.add.overlap(this.projectileManager.group, this.bossProjectileManager.group, (friendly, hostile) => this.#interceptBossProjectile(friendly, hostile)));
    add(this.physics.add.overlap(this.echoProjectileManager.group, this.bossProjectileManager.group, (friendly, hostile) => this.#phantomShieldIntercept(friendly, hostile)));
  }

  #registerEvents() {
    const subscribe = (name, handler) => this.cleanup.trackSubscription(this.services.eventBus.subscribe(name, handler, { owner: this }));
    subscribe('run:pause:requested', () => this.#pauseCombat());
    subscribe('player:died', (payload) => this.#handlePlayerDeath(payload));
    subscribe('player:dash:started', (payload) => { this.upgradeManager.onDashStarted(payload.direction); });
    subscribe('echo:normal-expiration', (payload) => this.#memoryBurst(payload));
    subscribe('enemy:defeated', (payload) => { if (payload.enemyType === 'drifter') this.bossTelemetry.increment('summonDefeats'); this.crossfireTracker.clearTarget?.(payload.enemyId); this.run.scoreManager.recordEnemyDefeat(payload, { simulationMs: this.run.elapsedSimulationMs, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType }); });
    subscribe('boss:phase:transition', () => this.#beginPhaseTransition());
  }

  #beginAttack(entry) {
    if (this.attackRuntime) { this.scheduler.completeAttack(entry.id); return; }
    const phase = this.bossController.phase;
    if (entry.id === 'rotating-fan') {
      const angle = Math.atan2(this.player.y - CENTER.y, this.player.x - CENTER.x);
      const plan = createRotatingFanPlan({ rng: this.random.fanPattern, phase, playerAngle: angle, firstUse: entry.firstUse, emissionIndex: 0 });
      this.attackRuntime = { id: entry.id, major: true, stage: 'telegraph', remainingMs: plan.telegraphMs, plan, emissionIndex: 0 };
      this.renderer.setAttackApertures(plan.angles.slice(0, 4));
    } else if (entry.id === 'targeted-line-volley') {
      const plan = createTargetedLineVolleyPlan({ rng: this.random.linePattern, phase, player: this.player, arenaBounds: { left: 128, right: 1472, top: 93, bottom: 807 }, firstUse: entry.firstUse });
      this.attackRuntime = { id: entry.id, major: true, stage: 'tracking', remainingMs: plan.telegraphMs, plan, hit: false };
      this.renderer.drawLineTelegraphs(plan, 'tracking');
    } else if (entry.id === 'drifter-summon') {
      const plan = this.summonController.summon(phase, this.player);
      this.bossController.markMechanic('summon');
      this.bossTelemetry.recordAttackExecuted(entry.id);
      this.scheduler.completeAttack(entry.id);
      this.attackRuntime = { id: entry.id, major: false, stage: 'recovery', remainingMs: plan.spawnMs };
    } else if (entry.id === 'hostile-echo') {
      this.#scheduleHostileEcho(entry);
    } else if (entry.id === 'sector-deletion') {
      const plan = this.sectorManager.activate();
      if (plan) {
        this.bossController.markMechanic('sector-deletion');
        this.bossTelemetry.recordAttackExecuted(entry.id);
        this.attackRuntime = { id: entry.id, major: true, stage: 'sector', remainingMs: plan.warningMs + plan.disabledMs + 600 };
      } else this.scheduler.completeAttack(entry.id);
    } else if (entry.id === 'rear-panel-exposure') {
      this.#openRearPanels();
      this.scheduler.completeAttack(entry.id);
    }
  }

  #updateAttackRuntime(deltaMs) {
    const runtime = this.attackRuntime;
    if (!runtime) return;
    runtime.remainingMs -= deltaMs;
    if (runtime.id === 'rotating-fan') this.#updateFan(runtime);
    else if (runtime.id === 'targeted-line-volley') this.#updateLine(runtime);
    else if (runtime.id === 'hostile-echo') this.#updateHostileEcho(runtime);
    if (runtime.remainingMs <= 0 && ['recovery', 'sector'].includes(runtime.stage)) this.#finishAttack(runtime.id);
  }

  #updateFan(runtime) {
    if (runtime.stage === 'telegraph' && runtime.remainingMs <= 0) {
      this.#emitFan(runtime.plan);
      runtime.emissionIndex += 1;
      if (runtime.emissionIndex >= runtime.plan.emissions) {
        this.bossController.markMechanic('rotating-fan');
        this.bossTelemetry.recordAttackExecuted(runtime.id);
        runtime.stage = 'recovery';
        runtime.remainingMs = 500;
        this.renderer.setAttackApertures([]);
      } else {
        const angle = Math.atan2(this.player.y - CENTER.y, this.player.x - CENTER.x);
        runtime.plan = createRotatingFanPlan({ rng: this.random.fanPattern, phase: this.bossController.phase, playerAngle: angle, firstUse: false, emissionIndex: runtime.emissionIndex });
        runtime.stage = 'interval';
        runtime.remainingMs = runtime.plan.intervalMs;
      }
    } else if (runtime.stage === 'interval' && runtime.remainingMs <= 0) {
      this.#emitFan(runtime.plan);
      runtime.emissionIndex += 1;
      if (runtime.emissionIndex >= runtime.plan.emissions) {
        this.bossController.markMechanic('rotating-fan');
        this.bossTelemetry.recordAttackExecuted(runtime.id);
        runtime.stage = 'recovery';
        runtime.remainingMs = 500;
        this.renderer.setAttackApertures([]);
      } else runtime.remainingMs = runtime.plan.intervalMs;
    }
  }

  #emitFan(plan) {
    for (const angle of plan.angles) {
      const direction = { x: Math.cos(angle), y: Math.sin(angle) };
      this.bossProjectileManager.activate({ profileId: 'fan', x: CENTER.x + direction.x * 112, y: CENTER.y + direction.y * 112, direction, overrides: { speed: plan.speed, damage: plan.damage } });
    }
    this.bossTelemetry.increment('fanEmissions');
    this.bossTelemetry.increment('fanProjectiles', plan.angles.length);
  }

  #updateLine(runtime) {
    if (runtime.stage === 'tracking' && runtime.remainingMs <= 0) {
      runtime.stage = 'lock';
      runtime.remainingMs = runtime.plan.lockMs;
      this.renderer.drawLineTelegraphs(runtime.plan, 'lock');
    } else if (runtime.stage === 'lock' && runtime.remainingMs <= 0) {
      runtime.stage = 'execution';
      runtime.remainingMs = runtime.plan.activeMs;
      this.renderer.drawLineTelegraphs(runtime.plan, 'execution');
      if (this.#playerOnLine(runtime.plan)) {
        const result = this.#damagePlayer({ damageId: `boss-line-${this.run.elapsedSimulationMs}`, sourceType: 'boss-line-volley', sourceId: 'null-architect', amount: runtime.plan.damage, direction: { x: 0, y: -1 }, hitPosition: { x: this.player.x, y: this.player.y } });
        if (result?.accepted) this.bossTelemetry.increment('lineHits');
      }
    } else if (runtime.stage === 'execution' && runtime.remainingMs <= 0) {
      this.renderer.clearLineTelegraphs();
      this.bossController.markMechanic('targeted-line-volley');
      this.bossTelemetry.increment('lineVolleys');
      this.bossTelemetry.recordAttackExecuted(runtime.id);
      runtime.stage = 'recovery';
      runtime.remainingMs = 450;
    }
  }

  #playerOnLine(plan) {
    const coordinate = plan.orientation === 'vertical' ? this.player.x : this.player.y;
    return plan.positions.some((position) => Math.abs(coordinate - position) <= plan.width / 2 + PLAYER_BALANCE.movement.collisionRadius);
  }

  #scheduleHostileEcho(entry) {
    const loadout = createEchoLoadoutSnapshot({ ...this.weaponSystem.getEchoLoadoutSource(), echoDamageScalar: this.upgradeManager.echoScalar() });
    const source = this.echoRecorder.createReplayDescriptor(this.run.elapsedSimulationMs, loadout) ?? {
      snapshots: [{ timestampMs: 0, x: this.player.x, y: this.player.y, aimX: 1, aimY: 0 }, { timestampMs: 3800, x: this.player.x, y: this.player.y, aimX: -1, aimY: 0 }],
      fireEvents: [],
    };
    const origin = source.snapshots[0] ?? this.player;
    const chosen = this.spawnValidator.choose({
      rng: this.random.hostileEchoOffset,
      origin,
      context: {
        bounds: { left: 128, right: 1472, top: 93, bottom: 807 },
        player: this.player,
        boss: { ...CENTER, radius: 150 },
        solids: this.wallDefinitions,
        hostileEchoes: this.hostileEchoManager.activeEchoes,
        disabledCellPredicate: (point) => this.sectorManager.isPointDisabled(point),
      },
      fallbackSockets: this.segment.arenaDescriptor.enemySockets,
    });
    if (!chosen.accepted) {
      this.bossTelemetry.increment('hostileEchoesRejected');
      this.scheduler.completeAttack(entry.id);
      return;
    }
    const plan = createHostileEchoPlan({ rng: this.random.hostileEchoSelection, descriptor: source, spawnPoint: chosen.point, phase: this.bossController.phase });
    this.bossTelemetry.increment('hostileEchoesScheduled');
    this.attackRuntime = { id: entry.id, major: true, stage: 'warning', remainingMs: plan.warningMs + plan.spawnDelayMs, plan };
    this.hostileWarning = this.add.graphics().setDepth(30).lineStyle(5, 0xef3150, .9).strokeCircle(plan.spawnPoint.x, plan.spawnPoint.y, 42).lineBetween(plan.spawnPoint.x - 28, plan.spawnPoint.y, plan.spawnPoint.x + 28, plan.spawnPoint.y);
  }

  #updateHostileEcho(runtime) {
    if (runtime.stage === 'warning' && runtime.remainingMs <= 0) {
      this.hostileWarning?.destroy();
      this.hostileWarning = null;
      this.hostileEchoManager.spawn(runtime.plan.replay);
      this.bossController.markMechanic('hostile-echo');
      this.bossTelemetry.recordAttackExecuted(runtime.id);
      runtime.stage = 'recovery';
      runtime.remainingMs = 500;
    }
  }

  #openRearPanels() {
    const playerAngle = Math.atan2(this.player.y - CENTER.y, this.player.x - CENTER.x);
    const plan = createRearPanelPlan({ rng: this.random.panelSelection, playerAngle, disabledPanelIds: this.sectorManager.disabledPanelIds(), phase: this.bossController.phase });
    this.panelRuntime = { ...plan, remainingMs: plan.durationMs };
    this.renderer.setOpenPanels(plan.panelIds);
    this.bossController.markMechanic('rear-panel-exposure');
    this.bossTelemetry.increment('rearPanelExposures');
    this.bossTelemetry.recordAttackExecuted('rear-panel-exposure');
  }

  #updatePanels(deltaMs) {
    if (!this.panelRuntime) return;
    this.panelRuntime.remainingMs -= deltaMs;
    if (this.panelRuntime.remainingMs <= 0) {
      this.panelRuntime = null;
      this.renderer.setOpenPanels([]);
    }
  }

  #finishAttack(id) {
    this.scheduler.completeAttack(id);
    this.attackRuntime = null;
  }

  #bossProjectileHit(projectile, zone, source, manager) {
    if (!projectile?.active || this.completed) return;
    const hitZone = zone.getData('bossHitZone') ?? 'core';
    const panelId = hitZone.startsWith('panel:') ? hitZone.slice(6) : null;
    if (panelId && !this.panelRuntime?.panelIds.includes(panelId)) return;
    const now = this.run.elapsedSimulationMs;
    const hit = projectile.registerHit(`boss:${hitZone}`, now);
    if (!hit.accepted) return;
    const data = projectile.damagePacket;
    const amount = source === 'echo' ? data?.scaledDamage : data?.resolvedDamage;
    const packet = createDamagePacket({
      damageId: `${source}-boss-${projectile.activationId}-${hitZone}-${now}`,
      sourceFaction: source === 'echo' ? FACTIONS.echo : FACTIONS.player,
      sourceType: `${source}-projectile`,
      sourceId: projectile.ownerId,
      ownerId: projectile.ownerId,
      targetType: 'boss',
      targetId: 'null-architect',
      baseAmount: data?.baseDamage ?? amount,
      finalAmount: amount,
      critical: Boolean(data?.criticalResolved),
      damageTags: [source, 'projectile', ...(data?.tags ?? [])],
      hitPosition: { x: projectile.x, y: projectile.y },
      direction: { x: projectile.body.velocity.x, y: projectile.body.velocity.y },
      timestampMs: now,
      sourceEventId: projectile.sourceEventId,
      projectileActivationId: projectile.activationId,
      sourceUpgradeId: data?.sourceUpgradeId ?? null,
      triggerDepth: data?.triggerDepth ?? 0,
      canTriggerChain: data?.canTriggerChain !== false,
      canTriggerFragments: data?.canTriggerFragments !== false,
      canCrit: data?.canCrit !== false,
    });
    const result = this.bossController.receiveDamage(packet, { hitZone, source });
    if (result.accepted) {
      this.statistics.recordProjectileHit(source, result.damageApplied, packet.critical);
      this.services.eventBus.emit('combat:target:hit', { targetId: `boss:${hitZone}`, source, timestampMs: now, x: projectile.x, y: projectile.y, damageApplied: result.damageApplied, critical: packet.critical });
      this.#applyBossCrossfire({ source, hitZone, damageApplied: result.damageApplied, timestampMs: now });
      if (result.bossDefeated) this.#beginVictory();
    }
    if (!hit.continue) manager.deactivate(projectile, result.accepted ? 'boss-hit' : 'boss-rejected');
  }

  #applyBossCrossfire(payload) {
    const event = this.crossfireTracker.registerHit({ targetId: 'null-architect', source: payload.source, timestampMs: payload.timestampMs });
    if (!event) return;
    this.statistics.recordCrossfire();
    this.run.scoreManager.recordCrossfire(event, { simulationMs: this.run.elapsedSimulationMs, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType });
    const profile = this.upgradeManager.data('resonant-damage');
    if (!profile || !this.bossController.canDamage(payload.hitZone)) return;
    const scalar = this.upgradeManager.resonantDamage.resolve({ targetId: 'null-architect', firstSource: 'player', secondSource: 'echo', firstAt: event.playerHitTimestampMs, secondAt: event.echoHitTimestampMs, profile });
    if (!scalar) return;
    const amount = Math.max(0, payload.damageApplied * scalar);
    const packet = createDamagePacket({ damageId: `boss-crossfire-${event.crossfireEventId}`, sourceFaction: FACTIONS.echo, sourceType: 'resonant-damage', sourceId: `crossfire-${event.crossfireEventId}`, targetType: 'boss', targetId: 'null-architect', baseAmount: amount, finalAmount: amount, critical: false, damageTags: ['upgrade','resonant-damage'], hitPosition: CENTER, direction: { x: 0, y: 0 }, timestampMs: this.run.elapsedSimulationMs, sourceUpgradeId: 'resonant-damage', triggerDepth: 1, canTriggerChain: false, canTriggerFragments: false, canCrit: false });
    this.bossController.receiveDamage(packet, { hitZone: payload.hitZone, source: 'echo', crossfireBonus: amount });
  }

  #bossProjectilePlayerHit(projectile) {
    const entity = projectile.getData?.('bossProjectileEntity') ?? projectile;
    if (!entity?.active) return;
    const result = this.#damagePlayer({ damageId: `boss-projectile-${entity.activationId}`, sourceType: entity.sourceType, sourceId: entity.ownerId, amount: entity.damage, direction: { x: entity.body.velocity.x, y: entity.body.velocity.y }, hitPosition: { x: entity.x, y: entity.y }, projectileActivationId: entity.activationId });
    this.bossProjectileManager.deactivate(entity, result?.accepted ? 'player-hit' : 'player-invulnerable');
  }

  #interceptBossProjectile(friendly, hostileSprite) {
    const hostile = hostileSprite.getData?.('bossProjectileEntity') ?? hostileSprite;
    if (!friendly?.active || !hostile?.active || !hostile.blockable) return;
    const id = hostile.activationId;
    this.projectileManager.deactivate(friendly, 'boss-projectile-interception');
    this.bossProjectileManager.deactivate(hostile, 'player-projectile');
    this.#handleHostileProjectileDestroyed(id, 'player-projectile');
  }

  #phantomShieldIntercept(_friendly, hostileSprite) {
    const hostile = hostileSprite.getData?.('bossProjectileEntity') ?? hostileSprite;
    if (!hostile?.active || !hostile.blockable || this.upgradeManager.level('phantom-shield') < 1 || this.echoPlaybackSystem.activeCount < 1) return;
    const id = hostile.activationId;
    this.bossProjectileManager.deactivate(hostile, 'phantom-shield');
    this.upgradeTelemetry.phantomInterceptions += 1;
    this.bossTelemetry.increment('bossProjectileInterceptions');
    this.#handleHostileProjectileDestroyed(id, 'phantom-shield');
  }

  #destroyBossProjectile(sprite, reason) {
    const entity = sprite.getData?.('bossProjectileEntity') ?? sprite;
    if (entity?.active) this.bossProjectileManager.deactivate(entity, reason);
  }

  #bossContact() {
    if (this.contactCooldownMs > 0 || this.bossController.transitioning || this.introRemainingMs > 0 || this.completed) return;
    this.contactCooldownMs = BOSS_BALANCE.contactCooldownMs;
    const dx = this.player.x - CENTER.x, dy = this.player.y - CENTER.y, length = Math.hypot(dx,dy) || 1;
    this.#damagePlayer({ damageId: `boss-contact-${this.run.elapsedSimulationMs}`, sourceType: 'boss-contact', sourceId: 'null-architect', amount: BOSS_BALANCE.contactDamage, direction: { x: dx/length, y: dy/length }, hitPosition: { x: this.player.x, y: this.player.y } });
  }

  #updateContactDamage(deltaMs) { this.contactCooldownMs = Math.max(0, this.contactCooldownMs - deltaMs); }
  #damagePlayer(data) { const result = this.collisionManager.applyExternalPlayerDamage(data); if (result?.accepted) this.bossTelemetry.incrementMap('playerDamageBySource', data.sourceType, result.damageApplied); return result; }

  #beginPhaseTransition() {
    this.combatState.set(COMBAT_STATES.bossTransition);
    this.run.setStatus(COMBAT_STATES.bossTransition);
    this.#clearBossEffects('phase-transition');
    this.renderer.setVulnerability('CLOSED');
    this.renderer.setOpenPanels([]);
  }

  #completePhaseTransition() {
    this.renderer.setPhase(this.bossController.phase);
    this.combatState.set(COMBAT_STATES.bossActive);
    this.run.setStatus(COMBAT_STATES.bossActive);
  }

  #beginVictory() {
    if (this.completed || this.destruction.active) return;
    const accepted = this.outcomeResolver.submit('victory', { tick: this.run.elapsedSimulationMs, sequence: 0 });
    if (!accepted.accepted) return;
    this.combatState.set(COMBAT_STATES.bossDestruction);
    this.run.setStatus(COMBAT_STATES.bossDestruction);
    this.run.bossDefeated = true;
    this.run.bossDefeatSimulationMs = this.run.elapsedSimulationMs;
    this.bossTelemetry.increment('bossDefeated');
    this.#clearBossEffects('boss-defeated');
    this.playerController.lockForTransition();
    this.destruction.start();
  }

  #handlePlayerDeath(payload) {
    if (this.completed || this.destruction.active) return;
    const accepted = this.outcomeResolver.submit('defeat', { tick: this.run.elapsedSimulationMs, sequence: 0, cause: payload?.sourceType ?? 'unknown' });
    if (!accepted.accepted) return;
    this.combatState.set(COMBAT_STATES.defeat);
    this.run.setStatus(COMBAT_STATES.defeat);
    this.run.deathCount += 1;
    this.playerController.disable();
    this.#clearBossEffects('player-dead');
    this.cleanup.trackTimer(this.time.delayedCall(500, () => this.#finalizeDefeat(payload?.sourceType ?? 'unknown')));
  }

  #finalizeVictory(skipped) {
    if (this.completed) return;
    this.run.bossDestructionSkipped = Boolean(skipped);
    this.run.victoryRecorded = true;
    this.run.bossOutcome = 'victory';
    this.run.setStatus(COMBAT_STATES.victory);
    this.progression.completeCurrentSegment({ durationMs: this.bossController.elapsedMs, endingHealth: this.playerHealth.currentHealth });
    this.run.scoreManager.recordSegmentClear(this.segment.segmentId, { simulationMs: this.run.elapsedSimulationMs, segmentType: this.segment.segmentType });
    this.#completeResult('victory', null, skipped);
  }

  #finalizeDefeat(cause) {
    if (this.completed) return;
    this.run.bossOutcome = 'defeat';
    this.#completeResult('defeat', cause, false);
  }

  #completeResult(resultType, cause, skipped) {
    if (this.completed) return;
    this.completed = true;
    this.bossTelemetry.data.fightDurationMs = this.bossController.elapsedMs;
    this.run.playerHealth = this.playerHealth.currentHealth;
    this.run.statistics.combat = this.statistics.snapshot();
    this.run.statistics.upgrades = this.upgradeTelemetry.snapshot();
    this.run.statistics.arenas = this.arenaTelemetry.snapshot();
    this.run.statistics.boss = this.bossTelemetry.snapshot();
    const boss = this.bossController.snapshot();
    const result = {
      title: resultType === 'victory' ? 'Victory · Null Architect Defeated' : 'Signal Lost · Null Architect',
      result: resultType,
      cause,
      durationMs: this.run.combatElapsedMs,
      bossDurationMs: boss.elapsedMs,
      difficultyId: this.run.difficultyId,
      seed: this.run.seed,
      bossPhase: boss.phase,
      bossHealth: boss.health,
      bossMaximumHealth: boss.maximumHealth,
      phaseDurations: { ...boss.phaseDurations, [boss.phase]: boss.phaseElapsedMs },
      finalPlayerHealth: this.playerHealth.currentHealth,
      selectedUpgrades: Object.fromEntries(this.run.selectedUpgrades),
      selectedUpgradeHistory: structuredClone(this.run.selectedUpgradeHistory),
      arenaSequence: structuredClone(this.run.arenaSequence),
      hazardSequence: [...this.run.hazardHistory],
      eliteModifiersDefeated: [...this.run.eliteModifiersDefeated],
      eliteHostTypesDefeated: [...this.run.eliteHostTypesDefeated],
      bossTelemetry: this.bossTelemetry.snapshot(),
      statistics: this.statistics.snapshot(),
      destructionSkipped: Boolean(skipped),
      bossImplemented: true,
      victory: resultType === 'victory',
    };
    const finalized = this.services.runFinalizationService.finalize({ run: this.run, result });
    const finalResult = finalized.committed ? finalized.result : result;
    this.services.gameState.completeRun(finalResult);
    this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.boss, SCENE_KEYS.hud], targetKey: SCENE_KEYS.results, payload: finalResult, token: `boss-${resultType}-${this.run.runId}` });
  }

  #requestEchoDeployment({ force = false } = {}) {
    const rejection = this.#deploymentRejection();
    if (rejection && !force) { this.statistics.recordRejectedDeployment(rejection); return null; }
    const loadout = createEchoLoadoutSnapshot({ ...this.weaponSystem.getEchoLoadoutSource(), echoDamageScalar: this.upgradeManager.echoScalar() });
    const descriptor = this.echoRecorder.createReplayDescriptor(this.run.elapsedSimulationMs, loadout);
    if (!descriptor) return null;
    const echo = this.echoPlaybackSystem.deploy(descriptor);
    if (!echo) return null;
    this.echoCooldown.consume();
    if (loadout.twinRecall) this.upgradeManager.twinRecall.schedule(descriptor, loadout.twinRecall, this.run.elapsedSimulationMs);
    return echo;
  }

  #deploymentRejection() {
    if (!this.combatState.is(COMBAT_STATES.bossActive)) return 'transition';
    if (this.playerController.state.is(PLAYER_STATES.dashing)) return 'dashing';
    if (!this.echoRecorder.readiness.ready) return 'not-ready';
    if (!this.echoCooldown.isReady) return 'cooldown';
    if (!this.echoPlaybackSystem.canDeploy()) return 'active-cap';
    return null;
  }

  #updateTwinRecall() {
    for (const pending of this.upgradeManager.twinRecall.consumeReady(this.run.elapsedSimulationMs)) {
      if (!this.echoPlaybackSystem.canDeploy()) continue;
      const sourceLoadout = pending.descriptor.loadout;
      const loadout = createEchoLoadoutSnapshot({ ...sourceLoadout, echoDamageScalar: sourceLoadout.echoDamageScalar * pending.scalar, twinRecall: null });
      this.echoPlaybackSystem.deploy(deepFreeze({ ...pending.descriptor, loadout, twinRecallSecondary: true }));
    }
  }

  #updateSlipstream() { for (const echo of this.echoPlaybackSystem.pool.activeItems) this.upgradeManager.onEchoProximity(echo.instanceId, Math.hypot(echo.x - this.player.x, echo.y - this.player.y)); }
  #recordingEnabled() { return this.combatState.is(COMBAT_STATES.bossActive) && (this.playerController.state.is(PLAYER_STATES.active) || this.playerController.state.is(PLAYER_STATES.dashing)); }
  #lastFrameContext() { const context = { available: this.upgradeManager.lastFrameAvailable && this.upgradeManager.level('last-frame') > 0, triggered: false, consume: () => { context.triggered = this.upgradeManager.consumeLastFrame(); if (context.triggered) this.bossTelemetry.increment('lastFrameUses'); } }; return context; }
  #handleHostileProjectileDestroyed(projectileId, reason) { const qualifies = reason === 'player-projectile' || reason === 'phantom-shield'; const amount = qualifies ? this.upgradeManager.nullAbsorptionDestroyed(projectileId) : 0; if (amount > 0) this.echoCooldown.recover(amount); }
  #handleUpgradeDamage() { /* Existing summoned-enemy interactions are resolved by CollisionManager. */ }
  #memoryBurst(payload) { const descriptor = this.upgradeManager.memoryBurstDescriptor(payload); if (!descriptor || !this.bossController.canDamage('core')) return; const amount = descriptor.damage ?? 0; if (amount <= 0) return; const packet = createDamagePacket({ damageId: `memory-burst-boss-${payload.echoInstanceId}-${this.run.elapsedSimulationMs}`, sourceFaction: FACTIONS.echo, sourceType: 'memory-burst', sourceId: payload.echoInstanceId, targetType: 'boss', targetId: 'null-architect', baseAmount: amount, finalAmount: amount, critical: false, damageTags: ['echo','memory-burst'], hitPosition: CENTER, direction: { x: 0, y: 0 }, timestampMs: this.run.elapsedSimulationMs, triggerDepth: 1, canTriggerChain: false, canTriggerFragments: false, canCrit: false }); this.bossController.receiveDamage(packet, { hitZone: 'core', source: 'echo' }); }

  #pauseCombat() {
    if (this.completed || this.scene.isPaused()) return;
    this.services.sceneFlow.openOverlay({ pauseKeys: [SCENE_KEYS.boss, SCENE_KEYS.hud], overlayKey: SCENE_KEYS.pause, payload: { returnScene: SCENE_KEYS.boss }, token: `boss-pause-${this.run.runId}-${this.run.elapsedSimulationMs}` });
  }

  #clearBossEffects(reason) {
    if (this.attackRuntime) this.scheduler.completeAttack(this.attackRuntime.id);
    this.attackRuntime = null;
    this.hostileWarning?.destroy(); this.hostileWarning = null;
    this.renderer.clearLineTelegraphs();
    this.renderer.setAttackApertures([]);
    this.renderer.setOpenPanels([]);
    this.panelRuntime = null;
    this.bossProjectileManager.clear(reason);
    this.hostileEchoManager.clear(reason);
    this.sectorManager.reset();
    this.summonController.clear(reason);
    this.enemyProjectileManager.clear(reason);
    this.projectileManager.clear(reason);
    this.echoProjectileManager.clear(reason);
    this.echoPlaybackSystem.clear(reason);
  }

  #emitTelemetryTimed(deltaMs) { this.telemetryElapsedMs += deltaMs; if (this.telemetryElapsedMs >= TELEMETRY_INTERVAL_MS) { this.telemetryElapsedMs = 0; this.#emitTelemetry(); } }
  #emitTelemetry(force = false) {
    if (!force && !this.scene.isActive()) return;
    const boss = this.bossController.snapshot();
    this.services.eventBus.emit('combat:telemetry', {
      elapsedSimulationMs: this.run.elapsedSimulationMs,
      difficultyId: this.run.difficultyId,
      chamberIndex: this.segment.chamberIndex,
      segmentId: this.segment.segmentId,
      segmentType: this.segment.segmentType,
      segmentIndex: this.run.currentSegmentIndex,
      runStatus: this.combatState.value,
      score: this.run.scoreManager.snapshot(),
      player: this.playerController.getSnapshot(),
      health: this.playerHealth.snapshot(),
      invulnerability: this.hitInvulnerability.snapshot(),
      weapon: this.weaponSystem.getSnapshot(),
      statistics: this.statistics.snapshot(),
      projectilePool: this.projectileManager.getDiagnostics(),
      echoProjectilePool: this.echoProjectileManager.getDiagnostics(),
      hostileProjectilePool: this.enemyProjectileManager.getDiagnostics(),
      enemies: this.enemyManager.getDiagnostics(),
      recorder: this.echoRecorder.getDiagnostics(),
      cooldown: this.echoCooldown.snapshot(),
      playback: this.echoPlaybackSystem.getDiagnostics(),
      upgrades: this.upgradeManager.snapshot(),
      damage: this.damageService.diagnostics(),
      boss: {
        ...boss,
        name: 'NULL ARCHITECT',
        phaseLabel: ({ OBSERVE: 'Observe', IMITATE: 'Imitate', DELETE: 'Delete' })[boss.phase],
        activeAttackId: this.attackRuntime?.id ?? null,
        hostileEchoCount: this.hostileEchoManager.activeCount,
        sector: this.sectorManager.snapshot(),
        panels: this.panelRuntime?.panelIds ?? [],
        projectiles: this.bossProjectileManager.getDiagnostics(),
        summons: this.summonController.snapshot(),
        introRemainingMs: this.introRemainingMs,
        destruction: this.destruction?.snapshot?.() ?? null,
        telemetry: this.bossTelemetry.snapshot(),
      },
    });
  }

  #debugSnapshot() {
    const boss = this.bossController.snapshot();
    return {
      seed: this.run.seed,
      difficulty: this.run.difficultyId,
      combatStatus: this.combatState.value,
      bossPhase: boss.phase,
      bossHealth: `${Math.ceil(boss.health)} / ${Math.ceil(boss.maximumHealth)}`,
      bossVulnerability: boss.vulnerability.state,
      bossActiveAttack: this.attackRuntime?.id ?? 'none',
      hostileEchoes: this.hostileEchoManager.activeCount,
      sectorState: this.sectorManager.state,
      openPanels: this.panelRuntime?.panelIds?.join(', ') ?? 'none',
      bossProjectiles: this.bossProjectileManager.getDiagnostics().active,
      summonThreat: this.summonController.activeThreat,
      schedulerFallbacks: this.scheduler.fallbackCount,
      schedulerHistory: this.scheduler.history.length,
      playerHealth: this.playerHealth.currentHealth,
      cleanupOwners: this.cleanup.size,
    };
  }

  #installDebugHooks() {
    if (!this.services.debugManager.enabled && !import.meta.env.DEV) return;
    const hooks = {
      snapshot: () => this.#debugSnapshot(),
      forcePhase: (phase) => { const value = String(phase).toUpperCase(); const ok = this.bossController.forcePhase(value); if (ok) this.renderer.setPhase(value); return ok; },
      setHealth: (value) => this.bossController.forceHealth(value),
      setVulnerable: (value) => { this.bossController.vulnerability.force(Boolean(value)); this.renderer.setVulnerability(this.bossController.vulnerability.state); },
      forceAttack: (id) => this.#beginAttack({ id, firstUse: false }),
      forceSector: () => this.#beginAttack({ id: 'sector-deletion', firstUse: false }),
      forcePanel: () => this.#beginAttack({ id: 'rear-panel-exposure', firstUse: false }),
      forceVictory: () => { this.bossController.phase = BOSS_PHASES.delete; this.bossController.mechanics.add('sector-deletion'); this.bossController.mechanics.add('rear-panel-exposure'); this.bossController.destroyed = true; this.#beginVictory(); },
      forceDefeat: () => { this.playerHealth.setCurrent(0); this.#handlePlayerDeath({ sourceType: 'debug' }); },
      forceEchoReady: () => this.echoRecorder.forceReady(this.playerController.getSnapshot(), this.run.elapsedSimulationMs),
      deployEcho: () => this.#requestEchoDeployment({ force: true }),
      telemetry: () => this.bossTelemetry.snapshot(),
      randomStreams: () => this.random.snapshot(),
      printScoreLedger: () => this.run.scoreManager.ledger.snapshot(),
      printScoreBreakdown: () => this.run.scoreManager.finalized ?? this.run.scoreManager.snapshot(),
      setCombo: (value = 0) => { this.run.scoreManager.combo.reset(); this.run.scoreManager.combo.gain(Math.max(0, Number(value) || 0), this.run.elapsedSimulationMs, 'debug'); return this.run.scoreManager.combo.snapshot(); },
      addScoreEvent: (type = 'near-miss') => type === 'crossfire' ? this.run.scoreManager.recordCrossfire({ crossfireEventId: `debug-${this.run.elapsedSimulationMs}`, targetId: 'null-architect' }, { simulationMs: this.run.elapsedSimulationMs, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType, debug: true }) : this.run.scoreManager.recordNearMiss({ projectileId: `debug-${this.run.elapsedSimulationMs}` }, { simulationMs: this.run.elapsedSimulationMs, segmentId: this.segment.segmentId, segmentType: this.segment.segmentType, debug: true }),
    };
    globalThis.__ECHOFRAME_PHASE8__ = hooks;
    globalThis.__ECHOFRAME_PHASE9__ = hooks;
    this.cleanup.add(() => { if (globalThis.__ECHOFRAME_PHASE8__ === hooks) delete globalThis.__ECHOFRAME_PHASE8__; if (globalThis.__ECHOFRAME_PHASE9__ === hooks) delete globalThis.__ECHOFRAME_PHASE9__; });
  }

  #destroyBossRuntime() {
    this.services.debugManager.clearGameplayProvider(this);
    for (const collider of this.extraColliders.splice(0)) destroyPhysicsCollider(collider);
    this.collisionManager?.destroy();
    this.#clearBossEffects('scene-shutdown');
    this.echoRecorder?.dispose();
    this.echoPlaybackSystem?.destroy();
    this.hostileEchoManager?.destroy();
    this.bossProjectileManager?.destroy();
    this.sectorManager?.destroy();
    this.enemyManager?.destroy();
    this.enemyProjectileManager?.destroy();
    this.echoProjectileManager?.destroy();
    this.projectileManager?.destroy();
    this.renderer?.destroy();
    this.bossShell?.destroy();
    this.coreZone?.destroy();
    for (const zone of this.panelZones?.values?.() ?? []) zone.destroy();
    this.player?.destroy();
    this.arenaManager?.destroy();
    this.playerController = null;
  }

  #returnInvalidRunToMenu() {
    this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.boss, SCENE_KEYS.hud], targetKey: SCENE_KEYS.mainMenu, fadeMs: 0, token: `invalid-boss-run-${performance.now()}` });
  }
}
