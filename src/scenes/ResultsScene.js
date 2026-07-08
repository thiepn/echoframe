import { DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { DIFFICULTIES } from '../data/difficulty.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { getUpgrade } from '../upgrades/UpgradeCatalog.js';
import { formatDuration } from '../utils/math.js';
import { MenuSceneBase } from './MenuSceneBase.js';

const LABELS = Object.freeze({ enemyScore: 'Enemies', eliteScore: 'Elites', chamberScore: 'Chambers', bossScore: 'Boss victory', crossfireScore: 'Crossfire', bulwarkRearScore: 'Bulwark rear', nearMissScore: 'Near misses', multiKillScore: 'Multi-kill', timeBonus: 'Time bonus', avoidanceBonus: 'Avoidance bonus' });
const metricLabel = (id) => ({ highestScore: 'Highest score', victoryScore: 'Victory score', fastestVictoryMs: 'Fastest victory', fastestBossMs: 'Fastest boss', highestCombo: 'Highest combo', crossfireEvents: 'Crossfire events', echoDamageShare: 'Echo damage share', lowestDamageTaken: 'Lowest damage taken', playerAccuracy: 'Player accuracy' })[id] ?? id;
const formatMetric = (id, value) => id.endsWith('Ms') ? formatDuration(value ?? 0) : ['echoDamageShare','playerAccuracy'].includes(id) ? `${Math.round((value ?? 0) * 100)}%` : Number(value ?? 0).toLocaleString('en-US', { maximumFractionDigits: 1 });

export class ResultsScene extends MenuSceneBase {
  constructor(services) { super(SCENE_KEYS.results, services); this.revealed = false; }

  create() {
    const victory = this.sceneData.result === 'victory';
    this.setupMenu({ title: victory ? 'VICTORY · SIGNAL RESTORED' : 'SIGNAL LOST', subtitle: victory ? 'The Null Architect is destroyed. The run ledger is finalized.' : `The run ended during ${this.sceneData.bossPhase ?? this.sceneData.segmentId ?? 'combat'}.` });
    const breakdown = this.sceneData.scoreBreakdown ?? this.sceneData.score?.breakdown ?? {};
    const finalScore = Math.max(0, Math.round(this.sceneData.finalScore ?? 0));
    const difficulty = DIFFICULTIES[this.sceneData.difficultyId]?.label ?? 'Standard';
    this.finalScore = finalScore;
    this.scoreText = this.add.text(DESIGN_WIDTH / 2, 166, 'FINAL SCORE  0', { fontFamily: 'monospace', fontSize: '38px', color: victory ? '#72f1b8' : '#ffd166' }).setOrigin(0.5);
    this.#startScoreCount();
    this.add.text(DESIGN_WIDTH / 2, 207, `${difficulty} · ${formatDuration(this.sceneData.durationMs ?? 0)} · Seed ${this.sceneData.seed ?? 0}`, { fontFamily: 'monospace', fontSize: '15px', color: PALETTE.mutedText }).setOrigin(0.5);

    const breakdownLines = Object.entries(LABELS).map(([key, label]) => `${label.padEnd(18)} ${Math.round(breakdown[key] ?? 0).toLocaleString('en-US').padStart(8)}`);
    breakdownLines.push('─'.repeat(29));
    breakdownLines.push(`${'Subtotal'.padEnd(18)} ${Math.round(breakdown.subtotal ?? 0).toLocaleString('en-US').padStart(8)}`);
    breakdownLines.push(`${'Difficulty'.padEnd(18)} ×${Number(breakdown.difficultyMultiplier ?? 1).toFixed(2)}`);
    this.add.rectangle(340, 440, 560, 390, PALETTE.surface, 0.94).setStrokeStyle(2, PALETTE.playerCyan, 0.72);
    this.add.text(90, 272, ['SCORE BREAKDOWN', '', ...breakdownLines], { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.primaryText, lineSpacing: 7 }).setOrigin(0, 0);

    const bests = this.sceneData.personalBestComparisons ?? [];
    const bestLines = bests.slice(0, 6).map((entry) => `${entry.label.replaceAll('_', ' ')} · ${metricLabel(entry.metric)}: ${entry.oldValue === null ? 'No prior record' : formatMetric(entry.metric, entry.oldValue)} → ${formatMetric(entry.metric, entry.newValue)}`);
    this.add.rectangle(920, 390, 530, 290, PALETTE.surface, 0.94).setStrokeStyle(2, PALETTE.echoViolet, 0.72);
    this.add.text(685, 270, ['PERSONAL BESTS', '', ...(bestLines.length ? bestLines : ['No qualifying records in this run.'])], { fontFamily: 'monospace', fontSize: '13px', color: PALETTE.primaryText, lineSpacing: 8, wordWrap: { width: 470 } }).setOrigin(0, 0);

    const unlocks = this.sceneData.unlocks ?? [];
    this.add.rectangle(1370, 420, 330, 350, PALETTE.surface, 0.94).setStrokeStyle(2, PALETTE.warningYellow, 0.72);
    this.unlockText = this.add.text(1220, 270, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffd166', lineSpacing: 7, wordWrap: { width: 290 } }).setOrigin(0, 0);
    this.unlockIndex = 0;
    this.unlockEntries = unlocks;
    this.#showUnlocks(unlocks);

    const finalized = this.sceneData.finalizedRun ?? {};
    const statsLines = [
      `Highest combo: ${Number(this.sceneData.combo?.highestCombo ?? finalized.highestCombo ?? 0).toFixed(1)}`,
      `Damage taken: ${Math.round(finalized.damageTaken ?? this.sceneData.statistics?.damageTaken ?? 0)}`,
      `Crossfire: ${finalized.crossfireEvents ?? 0}`,
      `Near misses: ${finalized.nearMisses ?? 0}`,
      `Player / Echo damage: ${Math.round(finalized.playerDamage ?? 0)} / ${Math.round(finalized.echoDamage ?? 0)}`,
      `Upgrades: ${(this.sceneData.selectedUpgradeHistory ?? []).map((e) => `${getUpgrade(e.id)?.name ?? e.id} L${e.level}`).join(' · ') || 'None'}`,
    ];
    this.add.text(DESIGN_WIDTH / 2, 655, statsLines, { fontFamily: 'monospace', fontSize: '14px', color: PALETTE.mutedText, align: 'center', wordWrap: { width: 1320 }, lineSpacing: 5 }).setOrigin(0.5);

    this.addButton('Restart Full Run', () => this.#restart(), { x: 430, y: 790, width: 360 });
    this.addButton('View Statistics', () => this.#open(SCENE_KEYS.statistics), { x: 800, y: 790, width: 320 });
    this.addButton('Archive & Unlocks', () => this.#open(SCENE_KEYS.archive), { x: 1145, y: 790, width: 320 });
    this.addButton('Main Menu', () => this.#menu(), { x: 1430, y: 790, width: 230 });
    const skip = () => this.#skipCounting();
    this.input.keyboard?.on('keydown-SPACE', skip);
    this.input.keyboard?.on('keydown-ENTER', skip);
    this.cleanup.add(() => {
      this.input.keyboard?.off('keydown-SPACE', skip);
      this.input.keyboard?.off('keydown-ENTER', skip);
      this.scoreTween?.stop();
    });
  }

  #showUnlocks(unlocks) {
    if (!unlocks.length) { this.unlockText.setText(['UNLOCKS', '', 'No new rewards.', '', 'Progress remains breadth-only.']); return; }
    this.#renderUnlockCard();
    if (unlocks.length > 1) {
      this.addButton('Previous Reward', () => { this.unlockIndex = (this.unlockIndex + unlocks.length - 1) % unlocks.length; this.#renderUnlockCard(); }, { x: 1295, y: 565, width: 145, height: 38, fontSize: 12 });
      this.addButton('Next Reward', () => { this.unlockIndex = (this.unlockIndex + 1) % unlocks.length; this.#renderUnlockCard(); }, { x: 1450, y: 565, width: 145, height: 38, fontSize: 12 });
    }
    const ids = unlocks.map((entry) => entry.id);
    const save = this.services.saveManager.getSnapshot();
    const unseen = new Set(save.progression.unseenUnlockIds ?? []);
    const seen = new Set(save.meta.seenUnlockIds ?? []);
    if (ids.some((id) => unseen.has(id) || !seen.has(id))) {
      this.services.saveManager.update((draft) => {
        draft.progression.unseenUnlockIds = (draft.progression.unseenUnlockIds ?? []).filter((id) => !ids.includes(id));
        for (const id of ids) if (!draft.meta.seenUnlockIds.includes(id)) draft.meta.seenUnlockIds.push(id);
      });
    }
  }

  #renderUnlockCard() {
    const entry = this.unlockEntries?.[this.unlockIndex];
    if (!entry) return;
    this.unlockText.setText([
      `NEW UNLOCK ${this.unlockIndex + 1}/${this.unlockEntries.length}`,
      '',
      entry.displayName,
      String(entry.type).toUpperCase(),
      '',
      entry.requirementText,
      '',
      'Granted for future runs.',
    ]);
  }

  #startScoreCount() {
    const reducedMotion = this.services.settingsManager.getSnapshot?.().visual?.reducedParticles;
    if (reducedMotion || this.finalScore === 0) { this.#skipCounting(); return; }
    const counter = { value: 0 };
    this.scoreTween = this.tweens.add({
      targets: counter, value: this.finalScore, duration: 1100, ease: 'Cubic.Out',
      onUpdate: () => this.scoreText?.setText(`FINAL SCORE  ${Math.round(counter.value).toLocaleString('en-US')}`),
      onComplete: () => this.#skipCounting(),
    });
  }
  #skipCounting() {
    if (this.revealed) return;
    this.revealed = true;
    this.scoreTween?.stop();
    this.scoreTween = null;
    this.scoreText?.setText(`FINAL SCORE  ${this.finalScore.toLocaleString('en-US')}`);
  }
  #restart() {
    const save = this.services.saveManager.getSnapshot();
    const run = this.services.gameState.createRun({ difficultyId: this.sceneData.difficultyId ?? 'standard', unlockedUpgradeIds: save.progression.unlockedUpgradeIds });
    this.services.saveManager.update((draft) => { draft.statistics.aggregateCounters.runsStarted = (draft.statistics.aggregateCounters.runsStarted ?? 0) + 1; }, { immediate: true });
    this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.results], targetKey: SCENE_KEYS.run, payload: { runId: run.runId }, launch: [{ key: SCENE_KEYS.hud, payload: { runId: run.runId } }], token: `phase9-restart-${run.runId}` });
  }
  #open(targetKey) { this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.results], targetKey, payload: { returnTo: SCENE_KEYS.results, resultData: this.sceneData }, token: `results-${targetKey}-${performance.now()}` }); }
  #menu() { this.services.gameState.disposeRun(); this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.results], targetKey: SCENE_KEYS.mainMenu, token: `results-menu-${performance.now()}` }); }
}
