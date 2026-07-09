import Phaser from 'phaser';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { TUTORIAL_ARENA } from '../data/tutorialArena.js';
import { bindingListLabel } from '../input/BindingCatalog.js';
import { TEXTURE_KEYS } from '../graphics/TextureFactory.js';
import { EchoPrototypeStatistics } from '../state/EchoPrototypeStatistics.js';
import { TUTORIAL_STEPS } from '../tutorial/TutorialStepCatalog.js';
import { TutorialController } from '../tutorial/TutorialController.js';
import { evaluateTutorialRecording } from '../tutorial/TutorialRecordingLock.js';
import { TUTORIAL_STATES } from '../tutorial/TutorialState.js';
import { createEchoLoadoutSnapshot } from '../systems/EchoLoadoutSnapshot.js';
import { EchoPlaybackSystem } from '../systems/EchoPlaybackSystem.js';
import { EchoProjectileManager } from '../systems/EchoProjectileManager.js';
import { EchoRecorder } from '../systems/EchoRecorder.js';
import { PlayerController } from '../systems/PlayerController.js';
import { ProjectileManager } from '../systems/ProjectileManager.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { Player } from '../entities/Player.js';
import { BaseScene } from './BaseScene.js';

const MARKER_RADIUS = 50;

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

export class TutorialScene extends BaseScene {
  constructor(services) {
    super(SCENE_KEYS.tutorial, services);
    this.simulationTimeMs = 0;
    this.exiting = false;
    this.lockedReplayDescriptor = null;
    this.recordingLockState = 'idle';
    this.recordingFailureReason = null;
    this.recordingPathSamples = [];
    this.recordingPathSampleElapsedMs = 0;
    this.recordingWindowFireEvents = 0;
    this.tutorialStatusMessage = null;
    this.tutorialStatusColor = PALETTE.mutedText;
    this.tutorialStatusUntilMs = 0;
  }

  create() {
    this.beginScene({ input: true });
    this.services.audioManager.ensureStarted();
    this.simulationTimeMs = 0;
    this.exiting = false;
    this.entryMode = this.sceneData.mode ?? 'replay';
    this.returnTo = this.sceneData.returnTo ?? SCENE_KEYS.mainMenu;
    this.statistics = new EchoPrototypeStatistics();
    this.controller = new TutorialController({ eventBus: this.services.eventBus, entrySource: this.entryMode });
    this.rerecordKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.cleanup.add(() => this.input.keyboard.removeKey(this.rerecordKey));

    this.#createArena();
    this.#createPresentation();
    this.#createProductionSystems();
    this.#registerCollisions();
    this.#registerEvents();
    this.#installDebugHooks();
    this.#syncStep();

    this.onTutorialResume = () => {
      this.controller.setPaused(false);
      this.services.inputManager.suppressHeldActions();
    };
    this.events.on(Phaser.Scenes.Events.RESUME, this.onTutorialResume);
    this.cleanup.add(() => this.events.off(Phaser.Scenes.Events.RESUME, this.onTutorialResume));
  }

  #createArena() {
    const highContrast = this.services.settingsManager.get('visual.highContrast', false);
    const largerOutlines = this.services.settingsManager.get('accessibility.largerTelegraphOutlines', false);
    const telegraphWidth = largerOutlines ? 7 : highContrast ? 6 : 5;
    this.cameras.main.setBounds(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    this.physics.world.setBounds(TUTORIAL_ARENA.bounds.left, TUTORIAL_ARENA.bounds.top, TUTORIAL_ARENA.bounds.right - TUTORIAL_ARENA.bounds.left, TUTORIAL_ARENA.bounds.bottom - TUTORIAL_ARENA.bounds.top);
    this.add.tileSprite(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, TEXTURE_KEYS.grid).setAlpha(0.32);
    this.add.rectangle(DESIGN_WIDTH / 2, 495, 1450, 700, PALETTE.background, 0.7).setStrokeStyle(3, PALETTE.surfaceHighlight, 0.9);
    this.add.text(90, 165, 'FIRST SIGNAL // TRAINING CHAMBER', { fontFamily: 'monospace', fontSize: '18px', color: PALETTE.mutedText });

    this.movementMarkers = TUTORIAL_ARENA.movementCheckpoints.map((point, index) => this.#marker(point, index + 1, PALETTE.playerCyan));
    this.pathMarkers = TUTORIAL_ARENA.recordingPath.map((point, index) => this.#marker(point, index + 1, PALETTE.echoViolet));

    const gate = TUTORIAL_ARENA.dashGate;
    this.dashGateVisual = this.add.rectangle(gate.x, gate.y, gate.width, gate.height, PALETTE.warningYellow, 0.08).setStrokeStyle(telegraphWidth, PALETTE.warningYellow, 0.9);
    for (let y = gate.y - gate.height / 2 + 16; y < gate.y + gate.height / 2; y += 30) {
      this.add.line(0, 0, gate.x - gate.width / 2, y, gate.x + gate.width / 2, y + 18, PALETTE.warningYellow, 0.65).setOrigin(0);
    }

    this.stationaryTarget = this.physics.add.image(TUTORIAL_ARENA.stationaryTarget.x, TUTORIAL_ARENA.stationaryTarget.y, TEXTURE_KEYS.targetDummy).setImmovable(true).setAlpha(0.35);
    this.stationaryTarget.body.setCircle(32, 2, 2);
    this.stationaryTargetHealth = 1;

    const shield = TUTORIAL_ARENA.shieldTarget;
    this.shieldTarget = this.physics.add.image(shield.x, shield.y, TEXTURE_KEYS.targetDummy).setImmovable(true).setTint(PALETTE.echoViolet).setAlpha(0.3);
    this.shieldTarget.body.setCircle(36, -2, -2);
    this.shieldTargetHealth = 1;
    this.shieldArc = this.add.graphics();
    this.shieldArc.lineStyle(largerOutlines ? 11 : highContrast ? 9 : 8, PALETTE.warningYellow, 0.9);
    this.shieldArc.beginPath();
    this.shieldArc.arc(shield.x, shield.y, 58, Math.PI * 0.58, Math.PI * 1.42, false);
    this.shieldArc.strokePath();
    this.add.text(shield.x - 82, shield.y - 85, 'PROTECTED FRONT', { fontFamily: 'monospace', fontSize: '14px', color: '#ffd166' }).setOrigin(0.5);
    this.add.text(shield.x + 95, shield.y + 62, 'REAR', { fontFamily: 'monospace', fontSize: '15px', color: '#72f1b8', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.triangle(shield.x + 66, shield.y, 0, 0, 28, 14, 0, 28, PALETTE.successMint, 0.9).setAngle(180);

    const signal = TUTORIAL_ARENA.signalGate;
    this.signalGate = this.add.container(signal.x, signal.y);
    const outer = this.add.circle(0, 0, signal.radius, PALETTE.successMint, 0.08).setStrokeStyle(telegraphWidth, PALETTE.successMint, 0.9);
    const inner = this.add.circle(0, 0, signal.radius - 18, PALETTE.void, 0.5).setStrokeStyle(2, 0xffffff, 0.45);
    const label = this.add.text(0, 0, 'SIGNAL', { fontFamily: 'monospace', fontSize: '15px', color: '#edf7ff', fontStyle: 'bold' }).setOrigin(0.5);
    this.signalGate.add([outer, inner, label]).setVisible(false);
  }

  #marker(point, number, color) {
    const highContrast = this.services.settingsManager.get('visual.highContrast', false);
    const largerOutlines = this.services.settingsManager.get('accessibility.largerTelegraphOutlines', false);
    const markerWidth = largerOutlines ? 7 : highContrast ? 5 : 4;
    const container = this.add.container(point.x, point.y);
    const ring = this.add.circle(0, 0, MARKER_RADIUS, color, 0.05).setStrokeStyle(markerWidth, color, 0.8);
    const crossH = this.add.rectangle(0, 0, 54, 2, color, 0.7);
    const crossV = this.add.rectangle(0, 0, 2, 54, color, 0.7);
    const label = this.add.text(0, 0, String(number), { fontFamily: 'monospace', fontSize: '20px', color: '#edf7ff', fontStyle: 'bold' }).setOrigin(0.5);
    container.add([ring, crossH, crossV, label]);
    container.setData('ring', ring);
    container.setVisible(false);
    return container;
  }

  #createPresentation() {
    const hudOpacity = this.services.settingsManager.get('visual.hudOpacity', 0.9);
    const highContrast = this.services.settingsManager.get('visual.highContrast', false);
    this.objectivePanel = this.add.rectangle(DESIGN_WIDTH / 2, 72, 980, 112, PALETTE.surface, 0.94).setStrokeStyle(highContrast ? 4 : 2, PALETTE.playerCyan, 0.9).setScrollFactor(0).setDepth(100);
    this.stepText = this.add.text(340, 42, '', { fontFamily: 'monospace', fontSize: '17px', color: '#72f1b8', fontStyle: 'bold' }).setDepth(101);
    this.objectiveText = this.add.text(DESIGN_WIDTH / 2, 68, '', { fontFamily: 'Arial, sans-serif', fontSize: '21px', color: PALETTE.primaryText, align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5).setDepth(101);
    this.hintText = this.add.text(DESIGN_WIDTH / 2, 111, '', { fontFamily: 'monospace', fontSize: '15px', color: PALETTE.mutedText, align: 'center' }).setOrigin(0.5).setDepth(101);
    this.progressText = this.add.text(1260, 42, '', { fontFamily: 'monospace', fontSize: '16px', color: '#ffd166' }).setOrigin(1, 0).setDepth(101);
    this.pauseHint = this.add.text(1510, 865, 'Esc — Pause', { fontFamily: 'monospace', fontSize: '15px', color: PALETTE.mutedText }).setOrigin(1, 1).setDepth(101);

    this.recordingPathVisual = this.add.graphics().setDepth(18).setVisible(false);
    this.recordingPanel = this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 72, 700, 74, PALETTE.surface, 0.94)
      .setStrokeStyle(highContrast ? 4 : 2, PALETTE.echoViolet, 0.9)
      .setDepth(100)
      .setVisible(false);
    this.recordingTitle = this.add.text(DESIGN_WIDTH / 2 - 320, DESIGN_HEIGHT - 100, 'ECHO MEMORY', { fontFamily: 'monospace', fontSize: '13px', color: '#c7baff', fontStyle: 'bold' }).setDepth(101).setVisible(false);
    this.recordingTrack = this.add.rectangle(DESIGN_WIDTH / 2 - 320, DESIGN_HEIGHT - 70, 520, 10, PALETTE.background, 1).setOrigin(0, 0.5).setDepth(101).setVisible(false);
    this.recordingFill = this.add.rectangle(DESIGN_WIDTH / 2 - 320, DESIGN_HEIGHT - 70, 0, 10, PALETTE.echoViolet, 0.9).setOrigin(0, 0.5).setDepth(102).setVisible(false);
    this.recordingShotMarkers = Array.from({ length: 4 }, (_, index) => this.add.circle(DESIGN_WIDTH / 2 - 320 + ((index + 1) / 5) * 520, DESIGN_HEIGHT - 70, 5, PALETTE.warningYellow, 0.2).setStrokeStyle(2, PALETTE.warningYellow, 0.55).setDepth(103).setVisible(false));
    this.recordingStateText = this.add.text(DESIGN_WIDTH / 2 + 320, DESIGN_HEIGHT - 82, '', { fontFamily: 'monospace', fontSize: '13px', color: PALETTE.mutedText, align: 'right' }).setOrigin(1, 0.5).setDepth(102).setVisible(false);
    this.tutorialHudObjects = [this.objectivePanel, this.stepText, this.objectiveText, this.hintText, this.progressText, this.pauseHint, this.recordingPanel, this.recordingTitle, this.recordingTrack, this.recordingFill, this.recordingStateText, ...this.recordingShotMarkers];
    for (const object of this.tutorialHudObjects) object.setAlpha(hudOpacity);
  }

  #createProductionSystems() {
    this.player = new Player(this, { ...TUTORIAL_ARENA.playerSpawn, settingsManager: this.services.settingsManager });
    this.player.bodySprite.setCollideWorldBounds(true);
    this.projectileManager = new ProjectileManager({ scene: this, eventBus: this.services.eventBus, settingsManager: this.services.settingsManager, statistics: this.statistics, arenaBounds: TUTORIAL_ARENA.bounds });
    this.echoProjectileManager = new EchoProjectileManager({ scene: this, eventBus: this.services.eventBus, settingsManager: this.services.settingsManager, statistics: this.statistics, arenaBounds: TUTORIAL_ARENA.bounds });
    this.playerController = new PlayerController({ player: this.player, inputContext: this.inputContext, eventBus: this.services.eventBus, statistics: this.statistics, dashDistanceResolver: (_x, _y, _direction, desired) => desired });
    this.weaponSystem = new WeaponSystem({ player: this.player, playerController: this.playerController, inputContext: this.inputContext, projectileManager: this.projectileManager, eventBus: this.services.eventBus, statistics: this.statistics });
    this.echoRecorder = new EchoRecorder({ eventBus: this.services.eventBus, timeProvider: () => this.simulationTimeMs });
    this.echoPlaybackSystem = new EchoPlaybackSystem({ scene: this, eventBus: this.services.eventBus, settingsManager: this.services.settingsManager, audioManager: this.services.audioManager, statistics: this.statistics, echoProjectileManager: this.echoProjectileManager, activeCapProvider: () => 1 });
    this.echoRecorder.start(this.simulationTimeMs, this.playerController.getSnapshot());

    this.cleanup.add(() => this.echoPlaybackSystem.destroy());
    this.cleanup.add(() => this.echoRecorder.dispose());
    this.cleanup.add(() => this.echoProjectileManager.destroy());
    this.cleanup.add(() => this.projectileManager.destroy());
    this.cleanup.add(() => this.player.destroy());
  }

  #installDebugHooks() {
    if (!this.services.debugManager.enabled) return;
    const advanceTo = (targetState) => {
      if (this.controller.state === TUTORIAL_STATES.intro) this.controller.begin(this.simulationTimeMs);
      while (this.controller.state !== targetState && ![TUTORIAL_STATES.complete, TUTORIAL_STATES.exiting].includes(this.controller.state)) {
        if (this.controller.state === TUTORIAL_STATES.moveCheckpoints) {
          this.controller.checkpoint(this.controller.moveCheckpointIndex, 'player');
        } else if (this.controller.state === TUTORIAL_STATES.aimAndFire) {
          this.controller.stationaryTarget({ source: 'player', defeated: true });
        } else if (this.controller.state === TUTORIAL_STATES.dashGate) {
          this.controller.dashGate({ owner: 'player', dashing: true, directionValid: true });
        } else if (this.controller.state === TUTORIAL_STATES.recordPath) {
          while (this.controller.pathCheckpointIndex < 4) this.controller.pathCheckpoint(this.controller.pathCheckpointIndex, 'player');
          this.controller.recordingQualified({ fireEvents: 4, spanMs: 3500 });
        } else if (this.controller.state === TUTORIAL_STATES.deployEcho) {
          this.controller.echoRearHit({ source: 'echo', rear: true, defeated: true });
        } else if (this.controller.state === TUTORIAL_STATES.enterSignalGate) break;
        else break;
      }
      this.#syncStep();
      return this.controller.snapshot();
    };
    const hooks = {
      snapshot: () => ({ ...this.controller.snapshot(), simulationTimeMs: this.simulationTimeMs, entryMode: this.entryMode, diagnostics: this.echoRecorder.getDiagnostics(), recordingLockState: this.recordingLockState, hasLockedReplay: Boolean(this.lockedReplayDescriptor), lockedFireEvents: this.lockedReplayDescriptor?.fireEvents.length ?? 0 }),
      advanceTo,
      resetCurrentStep: () => {
        if ([TUTORIAL_STATES.recordPath, TUTORIAL_STATES.deployEcho].includes(this.controller.state)) this.controller.retryRecording();
        this.#syncStep();
        return this.controller.snapshot();
      },
      showTriggerZones: (visible = true) => {
        for (const marker of [...this.movementMarkers, ...this.pathMarkers]) marker.setVisible(Boolean(visible));
        this.dashGateVisual.setVisible(Boolean(visible));
        this.shieldArc.setVisible(Boolean(visible));
        return true;
      },
      prepareLockedEcho: () => {
        advanceTo(TUTORIAL_STATES.deployEcho);
        this.player.setPosition(TUTORIAL_ARENA.shieldTarget.x + 230, TUTORIAL_ARENA.shieldTarget.y);
        this.simulationTimeMs = Math.max(this.simulationTimeMs, 6000);
        const snapshot = this.playerController.getSnapshot();
        this.echoRecorder.setEnabled(true);
        this.echoRecorder.forceReady(snapshot, this.simulationTimeMs);
        for (let index = 0; index < 4; index += 1) this.services.eventBus.emit('weapon:fired', { direction: { x: -1, y: 0 }, projectileMetadata: { damage: 1, speed: 850, lifetimeMs: 1200, radius: 4, critical: false }, weaponEventId: `tutorial-debug-${index}` });
        const descriptor = this.echoRecorder.createReplayDescriptor(this.simulationTimeMs, createEchoLoadoutSnapshot({ ...this.weaponSystem.getEchoLoadoutSource(), echoDamageScalar: 1 }));
        if (descriptor) {
          this.lockedReplayDescriptor = descriptor;
          this.recordingLockState = 'locked';
          this.echoRecorder.setEnabled(false);
          this.inputContext.suppressHeldActions();
          this.#updatePresentation();
        }
        return { locked: Boolean(descriptor), fireEvents: descriptor?.fireEvents.length ?? 0, descriptorDurationMs: descriptor?.durationMs ?? 0 };
      },
      forceEchoVisual: () => {
        const prepared = hooks.prepareLockedEcho();
        if (prepared.locked) this.#deployEcho();
        return { deployed: this.recordingLockState === 'deployed', fireEvents: prepared.fireEvents };
      },
      forceEchoSuccess: () => { advanceTo(TUTORIAL_STATES.deployEcho); return this.controller.echoRearHit({ source: 'echo', rear: true, defeated: true }); },
      complete: () => { advanceTo(TUTORIAL_STATES.enterSignalGate); this.player.setPosition(TUTORIAL_ARENA.signalGate.x, TUTORIAL_ARENA.signalGate.y); return true; },
      printBindings: () => structuredClone(this.services.settingsManager.get('controls.bindings', {})),
    };
    globalThis.__ECHOFRAME_PHASE10_TUTORIAL__ = hooks;
    this.cleanup.add(() => { if (globalThis.__ECHOFRAME_PHASE10_TUTORIAL__ === hooks) delete globalThis.__ECHOFRAME_PHASE10_TUTORIAL__; });
  }

  #registerCollisions() {
    const stationaryOverlap = this.physics.add.overlap(this.projectileManager.group, this.stationaryTarget, (projectile) => {
      if (!projectile?.active || this.controller.state !== TUTORIAL_STATES.aimAndFire) return;
      this.projectileManager.deactivate(projectile, 'tutorial-target');
      this.stationaryTargetHealth -= 1;
      this.statistics.recordPlayerHit();
      this.services.audioManager.playTargetHit();
      if (this.stationaryTargetHealth <= 0) this.controller.stationaryTarget({ source: 'player', defeated: true });
    });
    const playerShieldOverlap = this.physics.add.overlap(this.projectileManager.group, this.shieldTarget, (projectile) => {
      if (!projectile?.active || this.controller.state !== TUTORIAL_STATES.deployEcho) return;
      this.projectileManager.deactivate(projectile, 'tutorial-shield-front');
      this.#showStatus('Direct player fire cannot complete this lesson. Use the Echo replay.', false);
    });
    const echoShieldOverlap = this.physics.add.overlap(this.echoProjectileManager.group, this.shieldTarget, (projectile) => {
      if (!projectile?.active || this.controller.state !== TUTORIAL_STATES.deployEcho) return;
      const rear = projectile.x > this.shieldTarget.x + 4;
      this.echoProjectileManager.deactivate(projectile, rear ? 'tutorial-rear-hit' : 'tutorial-front-block');
      if (!rear) { this.#showStatus('The Echo struck the protected front. Re-record a path that ends behind the target.', false); return; }
      this.statistics.recordEchoHit(projectile.damagePacket?.scaledDamage ?? 0);
      this.shieldTargetHealth -= 1;
      if (this.shieldTargetHealth <= 0) this.controller.echoRearHit({ source: 'echo', rear: true, defeated: true });
    });
    this.cleanup.add(() => stationaryOverlap.destroy());
    this.cleanup.add(() => playerShieldOverlap.destroy());
    this.cleanup.add(() => echoShieldOverlap.destroy());
  }

  #registerEvents() {
    const unsubStep = this.services.eventBus.subscribe('tutorial:step:entered', () => this.#syncStep(), { owner: this });
    const unsubFire = this.services.eventBus.subscribe('weapon:fired', () => this.services.audioManager.playPlayerShot(), { owner: this });
    const unsubDash = this.services.eventBus.subscribe('player:dash:started', () => this.services.audioManager.playDash(), { owner: this });
    const unsubPause = this.services.eventBus.subscribe('run:pause:requested', () => this.#pause('focus-loss'), { owner: this });
    this.cleanup.add(() => { unsubStep(); unsubFire(); unsubDash(); unsubPause(); this.services.eventBus.clearByOwner(this); });
  }

  update(_time, delta) {
    if (!this.player || this.exiting) return;
    if (this.inputContext.justPressed('pause')) { this.#pause('input'); return; }
    if (this.controller.state === TUTORIAL_STATES.intro) {
      const movement = this.inputContext.getMovementVector();
      if (Math.hypot(movement.x, movement.y) > 0 || this.inputContext.justPressed('confirm') || this.inputContext.isDown('fire')) this.controller.begin(this.simulationTimeMs);
    }

    const safeDelta = Math.min(50, Math.max(0, delta));
    this.simulationTimeMs += safeDelta;
    this.playerController.update(safeDelta, this.cameras.main, this.controller.state === TUTORIAL_STATES.intro || this.controller.state === TUTORIAL_STATES.complete);
    this.weaponSystem.update(safeDelta, ![TUTORIAL_STATES.aimAndFire, TUTORIAL_STATES.recordPath].includes(this.controller.state));
    this.projectileManager.update(safeDelta);
    this.echoProjectileManager.update(safeDelta);
    this.echoPlaybackSystem.update(safeDelta);
    const recordingEnabled = this.controller.state === TUTORIAL_STATES.recordPath && !this.lockedReplayDescriptor;
    this.echoRecorder.update(safeDelta, this.simulationTimeMs, this.playerController.getSnapshot(), { enabled: recordingEnabled });
    this.#captureRecordingPath(safeDelta);

    this.#checkObjectives();
    this.#updatePresentation();
  }

  #checkObjectives() {
    const state = this.controller.state;
    if (state === TUTORIAL_STATES.moveCheckpoints) {
      const index = this.controller.moveCheckpointIndex;
      const point = TUTORIAL_ARENA.movementCheckpoints[index];
      if (point && distance(this.player, point) <= MARKER_RADIUS) this.controller.checkpoint(index, 'player');
    } else if (state === TUTORIAL_STATES.dashGate) {
      const gate = TUTORIAL_ARENA.dashGate;
      const inside = Math.abs(this.player.x - gate.x) <= gate.width / 2 + 18 && Math.abs(this.player.y - gate.y) <= gate.height / 2;
      if (inside) this.controller.dashGate({ owner: 'player', dashing: this.playerController.dash.active, directionValid: this.playerController.dash.direction.x > 0.2 });
    } else if (state === TUTORIAL_STATES.recordPath) {
      const index = this.controller.pathCheckpointIndex;
      const point = TUTORIAL_ARENA.recordingPath[index];
      if (point && distance(this.player, point) <= MARKER_RADIUS) this.controller.pathCheckpoint(index, 'player');
      if (this.controller.pathCheckpointIndex >= TUTORIAL_ARENA.recordingPath.length) this.#tryLockRecording();
    } else if (state === TUTORIAL_STATES.deployEcho && Phaser.Input.Keyboard.JustDown(this.rerecordKey)) {
      this.#beginRerecord();
    } else if (state === TUTORIAL_STATES.deployEcho && this.inputContext.justPressed('deployEcho')) {
      this.#deployEcho();
    } else if (state === TUTORIAL_STATES.enterSignalGate) {
      if (distance(this.player, TUTORIAL_ARENA.signalGate) <= TUTORIAL_ARENA.signalGate.radius) this.#completeTutorial();
    }
  }

  #tryLockRecording() {
    const loadout = createEchoLoadoutSnapshot({ ...this.weaponSystem.getEchoLoadoutSource(), echoDamageScalar: 1 });
    const candidate = evaluateTutorialRecording({
      recorder: this.echoRecorder,
      deploymentTimeMs: this.simulationTimeMs,
      loadoutSnapshot: loadout,
      pathCount: this.controller.pathCheckpointIndex,
    });
    this.recordingWindowFireEvents = candidate.fireEvents;
    if (!candidate.accepted) {
      this.recordingLockState = 'recording';
      if (candidate.reason !== this.recordingFailureReason) {
        this.recordingFailureReason = candidate.reason;
        const message = candidate.reason === 'insufficient-fire-events'
          ? 'Path complete. Keep firing until four shots are inside the Echo memory window.'
          : 'Path complete. Keep moving and firing until 3.5 seconds of Echo memory are ready.';
        this.#showStatus(message, false);
      }
      return false;
    }

    this.lockedReplayDescriptor = candidate.descriptor;
    this.recordingLockState = 'locked';
    this.recordingFailureReason = null;
    this.echoRecorder.setEnabled(false);
    this.inputContext.suppressHeldActions();
    const advanced = this.controller.recordingQualified({ fireEvents: candidate.fireEvents, spanMs: candidate.spanMs });
    if (advanced) this.#showStatus('Recording locked. Release the controls, then press Space to deploy.', true);
    return advanced;
  }

  #deployEcho() {
    const descriptor = this.lockedReplayDescriptor;
    if (!descriptor) {
      this.#showStatus('No locked recording is available. Press R to re-record lesson 4.', false);
      return;
    }
    const echo = this.echoPlaybackSystem.deploy(descriptor);
    if (!echo) {
      this.#showStatus('Echo deployment unavailable. Release Space and try again.', false);
      return;
    }
    this.lockedReplayDescriptor = null;
    this.recordingLockState = 'deployed';
    this.inputContext.suppressHeldActions();
    this.#showStatus('Echo deployed. Move clear and watch the replay strike from the rear. Press R to re-record if it misses.', true);
  }

  #beginRerecord() {
    if (this.controller.state !== TUTORIAL_STATES.deployEcho || !this.controller.retryRecording()) return false;
    this.lockedReplayDescriptor = null;
    this.recordingLockState = 'recording';
    this.recordingFailureReason = null;
    this.recordingPathSamples = [];
    this.recordingPathSampleElapsedMs = 0;
    this.recordingWindowFireEvents = 0;
    this.echoPlaybackSystem.clear('tutorial-explicit-rerecord');
    this.inputContext.suppressHeldActions();
    this.#syncStep();
    this.#showStatus('Re-recording started. Follow all four markers while firing.', true);
    return true;
  }

  #captureRecordingPath(deltaMs) {
    if (this.controller.state !== TUTORIAL_STATES.recordPath || this.lockedReplayDescriptor) return;
    this.recordingPathSampleElapsedMs += deltaMs;
    if (this.recordingPathSampleElapsedMs < 90) return;
    this.recordingPathSampleElapsedMs = 0;
    this.recordingPathSamples.push({ x: this.player.x, y: this.player.y });
    if (this.recordingPathSamples.length > 80) this.recordingPathSamples.shift();
  }

  #renderRecordingPath(visible) {
    this.recordingPathVisual.clear().setVisible(visible);
    if (!visible || this.recordingPathSamples.length < 2) return;
    this.recordingPathVisual.lineStyle(4, PALETTE.echoViolet, this.recordingLockState === 'locked' ? 0.75 : 0.32);
    this.recordingPathVisual.beginPath();
    this.recordingPathVisual.moveTo(this.recordingPathSamples[0].x, this.recordingPathSamples[0].y);
    for (const point of this.recordingPathSamples.slice(1)) this.recordingPathVisual.lineTo(point.x, point.y);
    this.recordingPathVisual.strokePath();
  }

  #syncStep() {
    const state = this.controller.state;
    if (state === TUTORIAL_STATES.recordPath) {
      this.lockedReplayDescriptor = null;
      this.recordingLockState = 'recording';
      this.recordingFailureReason = null;
      this.recordingPathSamples = [];
      this.recordingPathSampleElapsedMs = 0;
      this.recordingWindowFireEvents = 0;
      this.echoRecorder.reset();
      this.echoRecorder.start(this.simulationTimeMs, this.playerController.getSnapshot());
      this.echoPlaybackSystem.clear('tutorial-record-reset');
      this.shieldTargetHealth = 1;
    }
    if (state === TUTORIAL_STATES.enterSignalGate) {
      this.echoPlaybackSystem.beginTransitionDissolve();
      this.services.audioManager.playObjectiveComplete();
    }
    this.stationaryTarget.setAlpha(state === TUTORIAL_STATES.aimAndFire ? 1 : 0.25);
    this.shieldTarget.setAlpha(state === TUTORIAL_STATES.deployEcho ? 1 : 0.25);
    this.shieldArc.setAlpha(state === TUTORIAL_STATES.deployEcho ? 1 : 0.25);
    this.dashGateVisual.setAlpha(state === TUTORIAL_STATES.dashGate ? 1 : 0.25);
    this.signalGate.setVisible(state === TUTORIAL_STATES.enterSignalGate || state === TUTORIAL_STATES.complete);
    this.movementMarkers.forEach((marker, index) => marker.setVisible(state === TUTORIAL_STATES.moveCheckpoints && index >= this.controller.moveCheckpointIndex));
    this.pathMarkers.forEach((marker, index) => marker.setVisible(state === TUTORIAL_STATES.recordPath && index >= this.controller.pathCheckpointIndex));
    this.#updatePresentation();
  }

  #updatePresentation() {
    const state = this.controller.state;
    const step = TUTORIAL_STEPS[state] ?? TUTORIAL_STEPS[TUTORIAL_STATES.intro];
    this.stepText.setText(step.number ? `LESSON ${step.number} / 6` : 'FIRST SIGNAL');
    this.objectiveText.setText(step.objective);
    const statusActive = this.tutorialStatusMessage && this.simulationTimeMs < this.tutorialStatusUntilMs;
    this.hintText
      .setText(statusActive ? this.tutorialStatusMessage : this.#bindingHint(state))
      .setColor(statusActive ? this.tutorialStatusColor : PALETTE.mutedText);
    const diagnostics = this.echoRecorder?.getDiagnostics?.() ?? { recordingSpanMs: 0, fireEventCount: 0 };
    if (state === TUTORIAL_STATES.moveCheckpoints) this.progressText.setText(`${this.controller.moveCheckpointIndex} / 3`);
    else if (state === TUTORIAL_STATES.recordPath) this.progressText.setText(`${this.controller.pathCheckpointIndex}/4  ·  ${Math.min(3.5, diagnostics.recordingSpanMs / 1000).toFixed(1)}s  ·  ${diagnostics.fireEventCount}/4 shots`);
    else if (state === TUTORIAL_STATES.deployEcho) this.progressText.setText(this.recordingLockState === 'deployed' ? 'ECHO ACTIVE' : 'RECORDING LOCKED');
    else this.progressText.setText('');
    this.movementMarkers.forEach((marker, index) => marker.setAlpha(index === this.controller.moveCheckpointIndex ? 1 : 0.42));
    this.pathMarkers.forEach((marker, index) => marker.setAlpha(index === this.controller.pathCheckpointIndex ? 1 : 0.42));
    this.#updateRecordingPresentation(state, diagnostics);
  }

  #updateRecordingPresentation(state, diagnostics) {
    const visible = [TUTORIAL_STATES.recordPath, TUTORIAL_STATES.deployEcho].includes(state);
    for (const object of [this.recordingPanel, this.recordingTitle, this.recordingTrack, this.recordingFill, this.recordingStateText, ...this.recordingShotMarkers]) object.setVisible(visible);
    this.#renderRecordingPath(visible);
    if (!visible) return;

    const locked = state === TUTORIAL_STATES.deployEcho && this.recordingLockState !== 'recording';
    const progress = locked ? 1 : Math.max(0, Math.min(1, diagnostics.readinessProgress ?? diagnostics.progress ?? diagnostics.recordingSpanMs / 3500));
    const shots = locked ? 4 : Math.min(4, this.controller.pathCheckpointIndex >= TUTORIAL_ARENA.recordingPath.length ? this.recordingWindowFireEvents : diagnostics.fireEventCount ?? 0);
    this.recordingFill.displayWidth = 520 * progress;
    this.recordingFill.setFillStyle(locked ? PALETTE.successMint : PALETTE.echoViolet, 0.9);
    this.recordingShotMarkers.forEach((marker, index) => marker.setFillStyle(index < shots ? PALETTE.warningYellow : PALETTE.surfaceHighlight, index < shots ? 1 : 0.2));
    const label = this.recordingLockState === 'deployed'
      ? 'ECHO ACTIVE\nR — RE-RECORD'
      : locked
        ? 'MEMORY LOCKED\nSPACE — DEPLOY · R — RE-RECORD'
        : `RECORDING ${Math.round(progress * 100)}%\n${shots}/4 SHOTS IN MEMORY`;
    this.recordingStateText.setText(label).setColor(locked ? '#72f1b8' : PALETTE.mutedText);
  }

  #bindingHint(state) {
    const bindings = this.services.settingsManager.get('controls.bindings', {});
    const labels = (action) => bindingListLabel(bindings[action]);
    const hints = {
      [TUTORIAL_STATES.intro]: `Move: ${labels('moveUp')} / ${labels('moveLeft')} / ${labels('moveDown')} / ${labels('moveRight')}`,
      [TUTORIAL_STATES.moveCheckpoints]: `Movement bindings: ${labels('moveUp')} · ${labels('moveLeft')} · ${labels('moveDown')} · ${labels('moveRight')}`,
      [TUTORIAL_STATES.aimAndFire]: `Aim with pointer · Fire: ${labels('fire')}`,
      [TUTORIAL_STATES.dashGate]: `Dash: ${labels('dash')}`,
      [TUTORIAL_STATES.recordPath]: `Move through markers while holding ${labels('fire')} · The memory locks only when the final 3.5s contain four shots`,
      [TUTORIAL_STATES.deployEcho]: `Deploy Echo: ${labels('deployEcho')} · Re-record: R`,
      [TUTORIAL_STATES.enterSignalGate]: 'Move into the open signal gate.',
    };
    return hints[state] ?? '';
  }

  #showStatus(message, success) {
    this.tutorialStatusMessage = message;
    this.tutorialStatusColor = success ? '#72f1b8' : '#ffd166';
    this.tutorialStatusUntilMs = this.simulationTimeMs + 2600;
    this.hintText.setColor(this.tutorialStatusColor).setText(message);
  }

  #pause(source) {
    if (this.exiting || this.scene.isPaused()) return;
    this.controller.setPaused(true);
    this.services.inputManager.suppressHeldActions();
    this.services.sceneFlow.openOverlay({
      pauseKeys: [SCENE_KEYS.tutorial],
      overlayKey: SCENE_KEYS.pause,
      payload: { returnScene: SCENE_KEYS.tutorial, mode: 'tutorial', tutorialPayload: { mode: this.entryMode, returnTo: this.returnTo, difficultyId: this.sceneData.difficultyId }, source },
      token: `tutorial-pause-${performance.now()}`,
    });
  }

  #completeTutorial() {
    if (this.exiting || !this.controller.signalGate({ owner: 'player' }, this.simulationTimeMs)) return;
    this.exiting = true;
    this.services.saveManager.update((draft) => { draft.meta.tutorialCompleted = true; }, { immediate: true });
    this.controller.markExiting();
    this.services.inputManager.suppressHeldActions();
    if (this.entryMode === 'first-run') {
      const save = this.services.saveManager.getSnapshot();
      const requested = this.sceneData.difficultyId ?? 'standard';
      const difficultyId = save.progression.unlockedDifficultyIds.includes(requested) ? requested : 'standard';
      const run = this.services.gameState.createRun({ difficultyId, unlockedUpgradeIds: save.progression.unlockedUpgradeIds });
      this.services.saveManager.update((draft) => { draft.statistics.aggregateCounters.runsStarted = (draft.statistics.aggregateCounters.runsStarted ?? 0) + 1; }, { immediate: true });
      this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.tutorial], targetKey: SCENE_KEYS.run, payload: { runId: run.runId }, launch: [{ key: SCENE_KEYS.hud, payload: { runId: run.runId } }], token: `tutorial-to-run-${run.runId}` });
    } else {
      this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.tutorial], targetKey: this.returnTo, payload: this.returnTo === SCENE_KEYS.archive ? { returnTo: SCENE_KEYS.mainMenu } : {}, token: `tutorial-replay-return-${performance.now()}` });
    }
  }
}
