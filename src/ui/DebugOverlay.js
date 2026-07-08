import { DESIGN_WIDTH, PALETTE } from '../data/constants.js';

export class DebugOverlay {
  constructor(scene, debugManager) {
    this.scene = scene;
    this.debugManager = debugManager;
    this.elapsed = 0;
    this.updateInterval = 250;
    this.text = scene.add
      .text(DESIGN_WIDTH - 18, 18, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: PALETTE.primaryText,
        backgroundColor: '#080b14dd',
        padding: { x: 10, y: 8 },
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(5000)
      .setScrollFactor(0)
      .setVisible(debugManager.enabled);
  }

  update(_time, delta) {
    this.text.setVisible(this.debugManager.enabled);
    if (!this.debugManager.enabled) {
      return;
    }

    this.elapsed += delta;
    if (this.elapsed < this.updateInterval) {
      return;
    }
    this.elapsed = 0;
    const snapshot = this.debugManager.getSnapshot(this.scene.game);
    const lines = [
      `ECHOFRAME ${snapshot.buildVersion}`,
      `Mode: ${snapshot.buildMode}`,
      `Phaser: ${snapshot.phaserVersion}`,
      `FPS: ${snapshot.fps}  Frame: ${snapshot.frameMs} ms`,
      `Viewport: ${snapshot.viewport}`,
      `Logical: ${snapshot.logical}`,
      `Scenes: ${snapshot.activeScenes.join(', ') || 'none'}`,
      `Listeners: ${snapshot.listenerCount}`,
      `Cleanup entries: ${snapshot.cleanupCount}`,
      `Save schema: ${snapshot.schemaVersion}`,
      `Transition: ${snapshot.currentTransition}`,
      `Transitions: ${snapshot.transitionCount}`,
      `Audio contexts: ${snapshot.audioContexts}`,
    ];
    if (snapshot.gameplay?.bossPhase) {
      lines.push(
        `Boss phase: ${snapshot.gameplay.bossPhase} · ${snapshot.gameplay.combatStatus}`,
        `Boss health: ${snapshot.gameplay.bossHealth}`,
        `Vulnerability: ${snapshot.gameplay.bossVulnerability}`,
        `Attack: ${snapshot.gameplay.bossActiveAttack}`,
        `Hostile Echoes: ${snapshot.gameplay.hostileEchoes}`,
        `Sector: ${snapshot.gameplay.sectorState} · Panels ${snapshot.gameplay.openPanels}`,
        `Boss shots: ${snapshot.gameplay.bossProjectiles} · Summon threat ${snapshot.gameplay.summonThreat}/8`,
        `Scheduler: ${snapshot.gameplay.schedulerHistory} selections · ${snapshot.gameplay.schedulerFallbacks} fallback`,
        `Player health: ${snapshot.gameplay.playerHealth}`,
        `Seed: ${snapshot.gameplay.seed} · ${snapshot.gameplay.difficulty}`,
      );
    } else if (snapshot.gameplay) {
      lines.push(
        `Player: ${snapshot.gameplay.playerPosition}`,
        `Velocity: ${snapshot.gameplay.playerVelocity}`,
        `State: ${snapshot.gameplay.playerState}`,
        `Aim: ${snapshot.gameplay.aim}`,
        `Dash: ${snapshot.gameplay.dashRemaining} ms / CD ${snapshot.gameplay.dashCooldown} ms`,
        `Projectiles: ${snapshot.gameplay.activeProjectiles}/${snapshot.gameplay.projectileCapacity}`,
        `Hits: ${snapshot.gameplay.targetHits}  Walls: ${snapshot.gameplay.wallCollisions}`,
        `Recorder: ${snapshot.gameplay.snapshotCount}/${snapshot.gameplay.snapshotCapacity} @ ${snapshot.gameplay.sampleRateHz}Hz`,
        `History: ${Math.round(snapshot.gameplay.recordingSpanMs)}ms  Wraps ${snapshot.gameplay.snapshotWraps}`,
        `Events: F ${snapshot.gameplay.fireEventCount}/${snapshot.gameplay.fireEventCapacity}  D ${snapshot.gameplay.dashEventCount}/${snapshot.gameplay.dashEventCapacity}`,
        `Echo: ${snapshot.gameplay.echoState} #${snapshot.gameplay.echoInstanceId}  Active ${snapshot.gameplay.activeEchoCount}`,
        `Replay: ${Math.round(snapshot.gameplay.sourceTimeMs)}ms  Elapsed ${Math.round(snapshot.gameplay.playbackElapsedMs)}ms`,
        `Cursors: S ${snapshot.gameplay.snapshotCursor} F ${snapshot.gameplay.fireCursor} D ${snapshot.gameplay.dashCursor}`,
        `Echo CD: ${Math.round(snapshot.gameplay.echoCooldownMs)}ms`,
        `Echo shots: ${snapshot.gameplay.activeEchoProjectiles}/${snapshot.gameplay.echoProjectileCapacity}`,
        `Event error: ${snapshot.gameplay.lastEventTimingErrorMs.toFixed(2)} / max ${snapshot.gameplay.maximumEventTimingErrorMs.toFixed(2)}ms`,
        `Crossfire: ${snapshot.gameplay.crossfires}  Loadout: ${snapshot.gameplay.loadoutVersion}`,
        `Director: ${snapshot.gameplay.directorState} · ${snapshot.gameplay.pacingPhase}`,
        `Seed: ${snapshot.gameplay.directorSeed} · ${snapshot.gameplay.descriptorId}`,
        `Pattern: ${snapshot.gameplay.encounterPattern}`,
        `Threat: ${snapshot.gameplay.activeThreat}/${snapshot.gameplay.actualThreat} target ${snapshot.gameplay.targetThreat}`,
        `Queue: ${snapshot.gameplay.spawnQueueLength} · scheduled threat ${snapshot.gameplay.scheduledThreatRemaining}`,
        `Enemies: ${snapshot.gameplay.enemyCountsByType}`,
        `Roles: ${snapshot.gameplay.enemyCountsByRole}`,
        `Shards: ${snapshot.gameplay.carrierShardsActive} · suppression ${snapshot.gameplay.suppressionActive ? snapshot.gameplay.suppressionScalar : 'off'}`,
        `Generation: ${snapshot.gameplay.generationAttempts} attempts · fallback ${snapshot.gameplay.generationFallback}`,
      );
    }
    this.text.setText(lines);
  }

  destroy() {
    this.text.destroy();
  }
}
