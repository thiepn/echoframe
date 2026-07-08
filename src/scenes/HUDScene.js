import { DESIGN_HEIGHT, DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { BaseScene } from './BaseScene.js';

const TYPE_LABELS = Object.freeze({
  drifter: 'D', sentry: 'S', lancer: 'L', 'shard-carrier': 'C', bulwark: 'B', suppressor: 'X',
});

export class HUDScene extends BaseScene {
  constructor(services) { super(SCENE_KEYS.hud, services); this.telemetry = null; this.trailingHealth = 1; this.trailingBossHealth = 1; this.scoreFlyouts = []; }
  create() {
    this.beginScene({ input: false });
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.telemetry = null;
    this.topPanel = this.add.rectangle(DESIGN_WIDTH / 2, 38, 1220, 58, PALETTE.surface, 0.94).setStrokeStyle(2, PALETTE.surfaceHighlight, 1).setDepth(1000);
    this.statusText = this.add.text(DESIGN_WIDTH / 2, 38, 'DIRECTOR INITIALIZING', { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.primaryText }).setOrigin(0.5).setDepth(1001);
    this.healthPanel = this.add.rectangle(265, 92, 420, 76, PALETTE.surface, 0.94).setStrokeStyle(2, PALETTE.dangerRed, 0.8).setDepth(1000);
    this.healthLabel = this.add.text(80, 72, 'WARDEN HEALTH', { fontFamily: 'monospace', fontSize: '13px', color: PALETTE.mutedText }).setDepth(1001);
    this.healthTrack = this.add.rectangle(80, 104, 365, 18, PALETTE.background, 1).setOrigin(0, 0.5).setDepth(1001);
    this.healthTrail = this.add.rectangle(80, 104, 365, 18, PALETTE.warningYellow, 0.55).setOrigin(0, 0.5).setDepth(1002);
    this.healthFill = this.add.rectangle(80, 104, 365, 18, PALETTE.dangerRed, 0.95).setOrigin(0, 0.5).setDepth(1003);
    this.healthText = this.add.text(450, 104, '100 / 100', { fontFamily: 'monospace', fontSize: '14px', color: PALETTE.primaryText }).setOrigin(1, 0.5).setDepth(1004);
    this.encounterText = this.add.text(DESIGN_WIDTH - 76, 77, '', { fontFamily: 'monospace', fontSize: '13px', color: PALETTE.primaryText, align: 'right', lineSpacing: 4, backgroundColor: '#080b14dd', padding: { x: 10, y: 8 } }).setOrigin(1, 0).setDepth(1001);
    this.scorePanel = this.add.rectangle(DESIGN_WIDTH - 172, 38, 260, 58, PALETTE.surface, 0.98).setStrokeStyle(2, PALETTE.playerCyan, 0.85).setDepth(1002);
    this.scoreText = this.add.text(DESIGN_WIDTH - 292, 19, 'SCORE 0', { fontFamily: 'monospace', fontSize: '17px', color: PALETTE.primaryText }).setOrigin(0, 0).setDepth(1003);
    this.comboText = this.add.text(DESIGN_WIDTH - 292, 42, 'COMBO 0.0 · 1.00×', { fontFamily: 'monospace', fontSize: '13px', color: '#9a82ff' }).setOrigin(0, 0).setDepth(1003);
    this.timerText = this.add.text(DESIGN_WIDTH - 48, 42, '00:00', { fontFamily: 'monospace', fontSize: '13px', color: PALETTE.mutedText }).setOrigin(1, 0).setDepth(1003);
    this.comboDecay = this.add.rectangle(DESIGN_WIDTH - 292, 58, 220, 3, PALETTE.echoViolet, 0.8).setOrigin(0, 0.5).setDepth(1003);
    this.scoreFlyouts = Array.from({ length: 6 }, (_, index) => this.add.text(DESIGN_WIDTH - 58, 82 + index * 22, '', { fontFamily: 'monospace', fontSize: '13px', color: '#72f1b8', backgroundColor: '#080b14bb', padding: { x: 5, y: 2 } }).setOrigin(1, 0).setDepth(1004).setVisible(false));
    this.bossPanel = this.add.rectangle(DESIGN_WIDTH / 2, 102, 620, 78, PALETTE.surface, 0.96).setStrokeStyle(3, PALETTE.dangerRed, 0.9).setDepth(1000).setVisible(false);
    this.bossLabel = this.add.text(DESIGN_WIDTH / 2, 78, 'NULL ARCHITECT', { fontFamily: 'monospace', fontSize: '15px', color: '#ff9aac' }).setOrigin(0.5).setDepth(1002).setVisible(false);
    this.bossTrack = this.add.rectangle(DESIGN_WIDTH / 2 - 250, 107, 500, 18, PALETTE.background, 1).setOrigin(0, 0.5).setDepth(1001).setVisible(false);
    this.bossTrail = this.add.rectangle(DESIGN_WIDTH / 2 - 250, 107, 500, 18, PALETTE.warningYellow, 0.5).setOrigin(0, 0.5).setDepth(1002).setVisible(false);
    this.bossFill = this.add.rectangle(DESIGN_WIDTH / 2 - 250, 107, 500, 18, PALETTE.dangerRed, 0.96).setOrigin(0, 0.5).setDepth(1003).setVisible(false);
    this.bossText = this.add.text(DESIGN_WIDTH / 2, 132, '', { fontFamily: 'monospace', fontSize: '13px', color: PALETTE.primaryText }).setOrigin(0.5).setDepth(1004).setVisible(false);

    this.echoPanel = this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 92, 540, 94, PALETTE.surface, 0.94).setStrokeStyle(2, PALETTE.echoViolet, 0.8).setDepth(1000);
    this.echoLabel = this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 121, 'ECHO RECORDING', { fontFamily: 'monospace', fontSize: '15px', color: '#c7baff' }).setOrigin(0.5).setDepth(1001);
    this.echoTrack = this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 92, 440, 13, PALETTE.background, 1).setDepth(1001);
    this.echoFill = this.add.rectangle(DESIGN_WIDTH / 2 - 220, DESIGN_HEIGHT - 92, 0, 13, PALETTE.echoViolet, 0.92).setOrigin(0, 0.5).setDepth(1002);
    this.echoDetail = this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 65, '', { fontFamily: 'monospace', fontSize: '13px', color: PALETTE.mutedText }).setOrigin(0.5).setDepth(1001);
    this.dashText = this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 28, 'DASH READY', { fontFamily: 'monospace', fontSize: '13px', color: '#55e6ff', backgroundColor: '#080b14dd', padding: { x: 12, y: 5 } }).setOrigin(0.5).setDepth(1001);
    this.helpText = this.add.text(DESIGN_WIDTH - 76, DESIGN_HEIGHT - 150, 'WASD Move\nMouse Aim / Fire\nShift / RMB Dash\nSpace Deploy Echo\nEsc Pause', { fontFamily: 'monospace', fontSize: '13px', color: PALETTE.mutedText, align: 'right', lineSpacing: 4, backgroundColor: '#080b14cc', padding: { x: 10, y: 8 } }).setOrigin(1, 0).setDepth(1001);

    this.cleanup.trackSubscription(this.services.eventBus.subscribe('combat:telemetry', (payload) => { this.telemetry = payload; this.#render(); }, { owner: this }));
    this.cleanup.trackSubscription(this.services.eventBus.subscribe('settings:changed', () => this.#opacity(), { owner: this }));
    this.cleanup.trackSubscription(this.services.eventBus.subscribe('score:event:accepted', (event) => this.#showScoreFlyout(event), { owner: this }));
    this.#opacity();
    this.mountDebugOverlay();
  }
  update(time, delta) {
    if (this.telemetry) {
      const health = this.telemetry.health.currentHealth / this.telemetry.health.maximumHealth;
      this.trailingHealth += (health - this.trailingHealth) * Math.min(1, delta / 260);
      this.healthTrail.displayWidth = 365 * Math.max(0, this.trailingHealth);
      if (this.telemetry.boss) {
        const bossHealth = this.telemetry.boss.maximumHealth ? this.telemetry.boss.health / this.telemetry.boss.maximumHealth : 0;
        this.trailingBossHealth += (bossHealth - this.trailingBossHealth) * Math.min(1, delta / 300);
        this.bossTrail.displayWidth = 500 * Math.max(0, this.trailingBossHealth);
      }
    }
    this.updateDebug(time, delta);
  }
  #render() {
    const t = this.telemetry;
    this.#renderScore(t);
    if (t.boss) { this.#renderBoss(t); return; }
    this.#setBossVisible(false);
    const encounter = t.encounter ?? {};
    const counts = t.enemies.countsByType ?? {};
    const healthRatio = t.health.maximumHealth ? t.health.currentHealth / t.health.maximumHealth : 0;
    this.trailingHealth = Math.max(this.trailingHealth, healthRatio);
    this.healthFill.displayWidth = 365 * Math.max(0, healthRatio);
    this.healthText.setText(`${Math.ceil(t.health.currentHealth)} / ${Math.ceil(t.health.maximumHealth)}`);
    const phase = encounter.phase ?? encounter.state ?? 'INITIALIZING';
    const suppression = t.suppression?.active ? ` · SUPPRESSED ×${t.suppression.scalar.toFixed(2)}` : '';
    const segmentLabel = t.segmentId ? String(t.segmentId).replace('-', ' ').toUpperCase() : `CHAMBER ${t.chamberIndex}`;
    const elite = t.enemies?.elite?.elites?.[0] ?? null;
    const eliteStatus = elite ? ` · ELITE ${String(elite.modifierId).toUpperCase()} ${String(elite.hostEnemyType).toUpperCase()}` : '';
    this.statusText.setText(`SEGMENT ${(t.segmentIndex ?? 0) + 1}/6 · ${segmentLabel} · ${phase} · ${(encounter.pattern ?? encounter.label ?? 'DIRECTOR').toUpperCase()}${suppression}${eliteStatus}`);
    const roster = Object.entries(TYPE_LABELS).map(([type, label]) => `${label}${counts[type] ?? 0}`).join(' ');
    this.encounterText.setText([
      `Seed ${encounter.seed ?? 0} · Encounter ${Math.min((encounter.stepIndex ?? 0) + 1, 5)}/5`,
      `Enemies ${t.enemies.active} · ${roster}`,
      `Threat ${encounter.activeThreat ?? 0}/${encounter.actualThreat ?? 0} · Queue ${encounter.spawnQueueLength ?? encounter.scheduledSpawns ?? 0}`,
      `Hostile ${t.hostileProjectilePool.active} · Shards ${t.carrierShardPool.active}`,
      elite ? `Elite ${elite.modifierId} · Shield ${Math.ceil(elite.shieldAmount ?? 0)} · Split ${Math.ceil(elite.pendingCopyMs ?? 0)}ms` : `Elite none`,
      `Upgrades ${(t.statistics.selectedUpgradeHistory ?? []).length}/5 · Latest ${t.statistics.selectedUpgrade ?? 'None'}`, 
    ]);
    const activeEcho = t.playback.activeCount > 0;
    let echoProgress = t.recorder.readinessProgress ?? Math.min(1, (t.recorder.recordingSpanMs ?? 0) / 3500);
    let echoStatus = `RECORDING ${Math.round(echoProgress * 100)}%`;
    if (activeEcho) { echoProgress = 1; echoStatus = 'ECHO ACTIVE · CAP REACHED'; }
    else if (!t.cooldown.isReady) {
      echoProgress = 1 - t.cooldown.normalizedRemaining;
      echoStatus = t.suppression?.active ? `ECHO COOLDOWN SUPPRESSED ${(t.cooldown.remainingMs / 1000).toFixed(1)}s` : `ECHO COOLDOWN ${(t.cooldown.remainingMs / 1000).toFixed(1)}s`;
    } else if (t.recorder.recordingSpanMs >= 3499) { echoProgress = 1; echoStatus = 'ECHO READY · PRESS SPACE'; }
    this.echoLabel.setText(echoStatus);
    this.echoFill.displayWidth = 440 * Math.max(0, Math.min(1, echoProgress));
    this.echoDetail.setText(`Deployments ${t.statistics.echoDeployments} · Echo hits ${t.statistics.echoProjectileHits} · Crossfire ${t.statistics.crossfireEvents} · Recovery ${t.statistics.recoveryWindows}`);
    const dash = t.player.dash;
    this.dashText.setText(dash.active ? 'DASHING' : dash.cooldownRemainingMs > 0 ? `DASH ${(dash.cooldownRemainingMs / 1000).toFixed(1)}s` : 'DASH READY');
  }
  #renderBoss(t) {
    const boss = t.boss;
    this.#setBossVisible(true);
    const healthRatio = boss.maximumHealth ? boss.health / boss.maximumHealth : 0;
    this.trailingBossHealth = Math.max(this.trailingBossHealth, healthRatio);
    this.bossFill.displayWidth = 500 * Math.max(0, healthRatio);
    const state = boss.transitioning ? 'TRANSITION' : boss.vulnerability?.vulnerable ? 'VULNERABLE' : 'CLOSED';
    this.bossLabel.setText(`NULL ARCHITECT · ${String(boss.phaseLabel ?? boss.phase).toUpperCase()}`);
    this.bossText.setText(`${Math.ceil(boss.health)} / ${Math.ceil(boss.maximumHealth)} · ${state}`);
    this.statusText.setText(`BOSS · ${String(boss.phaseLabel ?? boss.phase).toUpperCase()} · ${(boss.activeAttackId ?? 'ASSESSING').toUpperCase()}`);
    this.encounterText.setText([
      `Hostile Echoes ${boss.hostileEchoCount ?? 0}`,
      `Boss projectiles ${boss.projectiles?.active ?? 0}`,
      `Summon threat ${boss.summons?.activeThreat ?? 0}/8`,
      `Sector ${boss.sector?.state ?? 'SAFE'}`,
      `Panels ${(boss.panels ?? []).join(', ') || 'closed'}`,
      `Run status ${t.runStatus}`,
    ]);
    const healthRatioPlayer = t.health.maximumHealth ? t.health.currentHealth / t.health.maximumHealth : 0;
    this.trailingHealth = Math.max(this.trailingHealth, healthRatioPlayer);
    this.healthFill.displayWidth = 365 * Math.max(0, healthRatioPlayer);
    this.healthText.setText(`${Math.ceil(t.health.currentHealth)} / ${Math.ceil(t.health.maximumHealth)}`);
    const activeEcho = t.playback.activeCount > 0;
    let echoProgress = t.recorder.readinessProgress ?? Math.min(1, (t.recorder.recordingSpanMs ?? 0) / 3500);
    let echoStatus = `RECORDING ${Math.round(echoProgress * 100)}%`;
    if (activeEcho) { echoProgress = 1; echoStatus = `FRIENDLY ECHO ACTIVE ${t.playback.activeCount}`; }
    else if (!t.cooldown.isReady) { echoProgress = 1 - t.cooldown.normalizedRemaining; echoStatus = `ECHO COOLDOWN ${(t.cooldown.remainingMs / 1000).toFixed(1)}s`; }
    else if (t.recorder.recordingSpanMs >= 3499) { echoProgress = 1; echoStatus = 'ECHO READY · PRESS SPACE'; }
    this.echoLabel.setText(echoStatus);
    this.echoFill.displayWidth = 440 * Math.max(0, Math.min(1, echoProgress));
    this.echoDetail.setText(`Player damage ${Math.round(boss.telemetry?.bossDamageByPlayer ?? 0)} · Echo damage ${Math.round(boss.telemetry?.bossDamageByEcho ?? 0)} · Crossfire ${Math.round(boss.telemetry?.crossfireDamage ?? 0)}`);
    const dash = t.player.dash;
    this.dashText.setText(dash.active ? 'DASHING' : dash.cooldownRemainingMs > 0 ? `DASH ${(dash.cooldownRemainingMs / 1000).toFixed(1)}s` : 'DASH READY');
  }
  #renderScore(t) {
    const score = t.score ?? {};
    const combo = score.combo ?? {};
    const current = Math.max(0, Math.round(score.currentScore ?? 0));
    const comboValue = Math.max(0, Number(combo.combo) || 0);
    const multiplier = Math.max(1, Number(combo.multiplier) || 1);
    this.scoreText.setText(`SCORE ${current.toLocaleString('en-US')}`);
    this.comboText.setText(`COMBO ${comboValue.toFixed(1)} · ${multiplier.toFixed(2)}×`);
    const elapsed = Math.max(0, Number(t.elapsedSimulationMs) || 0);
    const seconds = Math.floor(elapsed / 1000);
    this.timerText.setText(`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
    const sinceGain = Math.max(0, elapsed - (Number(combo.lastGainMs) || 0));
    const graceRatio = comboValue <= 0 ? 0 : Math.max(0, Math.min(1, 1 - Math.max(0, sinceGain - 2000) / 1000));
    this.comboDecay.displayWidth = 220 * graceRatio;
    this.comboDecay.setVisible(comboValue > 0);
  }

  #showScoreFlyout(event) {
    const slot = this.scoreFlyouts.find((entry) => !entry.visible) ?? this.scoreFlyouts[0];
    if (!slot) return;
    slot.__phase9Tween?.stop?.();
    const label = String(event?.eventType ?? 'score').replaceAll('-', ' ').toUpperCase();
    slot.setText(`+${Math.max(0, Math.round(event?.awardedPoints ?? 0))} ${label}`).setAlpha(1).setY(82).setVisible(true);
    slot.__phase9Tween = this.tweens.add({ targets: slot, y: 58, alpha: 0, duration: this.services.settingsManager.get('visual.reducedParticles', false) ? 450 : 800, onComplete: () => slot.setVisible(false) });
  }

  #setBossVisible(visible) {
    for (const object of [this.bossPanel, this.bossLabel, this.bossTrack, this.bossTrail, this.bossFill, this.bossText]) object?.setVisible(visible);
  }
  #opacity() {
    const alpha = this.services.settingsManager.get('visual.hudOpacity', 1);
    for (const child of this.children.list) if (child.setAlpha && child !== this.debugOverlay?.text) child.setAlpha(alpha);
  }
}
