import { DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { formatDuration } from '../utils/math.js';
import { MenuSceneBase } from './MenuSceneBase.js';

const TABS = Object.freeze(['Overview', 'Combat', 'Echo', 'Boss', 'Score', 'Records', 'Recent Runs']);
const n = (value) => Math.round(Number(value) || 0).toLocaleString('en-US');
const pct = (num, den) => `${den > 0 ? Math.round(num / den * 100) : 0}%`;
function flatten(record, prefix = '') { const out = []; for (const [key, value] of Object.entries(record ?? {})) { const label = `${prefix}${key}`; if (value && typeof value === 'object' && !Array.isArray(value)) out.push(...flatten(value, `${label} · `)); else out.push([label, value]); } return out; }

export class StatisticsScene extends MenuSceneBase {
  constructor(services) { super(SCENE_KEYS.statistics, services); this.tabIndex = 0; this.recentIndex = 0; this.viewObjects = []; }
  create() { this.returnTo = this.sceneData.returnTo ?? SCENE_KEYS.mainMenu; this.returnPayload = this.sceneData.resultData ?? {}; this.setupMenu({ title: 'Statistics', subtitle: 'Local-only records, aggregates, score history, and recent deterministic runs.', onCancel: () => this.#back() }); this.#render(); }
  #clearView() { this.clearButtons(); for (const object of this.viewObjects) object.destroy(); this.viewObjects = []; }
  #add(object) { this.viewObjects.push(object); return object; }
  #render() {
    this.#clearView(); const save = this.services.saveManager.getSnapshot(); const stats = save.statistics; const aggregate = stats.aggregateCounters; const tab = TABS[this.tabIndex];
    TABS.forEach((label, index) => this.addButton(label, () => { this.tabIndex = index; this.#render(); }, { x: 170 + index * 210, y: 155, width: 194, height: 40, fontSize: 15 }));
    this.#add(this.add.rectangle(DESIGN_WIDTH / 2, 500, 1370, 570, PALETTE.surface, 0.93).setStrokeStyle(2, PALETTE.surfaceHighlight, 0.8));
    let lines = [];
    if (tab === 'Overview') lines = [
      ['Runs started', aggregate.runsStarted], ['Runs completed', aggregate.runsCompleted], ['Victories', aggregate.victories], ['Defeats', aggregate.defeats], ['Victory rate', pct(aggregate.victories, aggregate.runsCompleted)], ['Simulation time', formatDuration(aggregate.totalSimulationMs)], ['Total score', n(aggregate.totalScore)], ['Average score', n(aggregate.runsCompleted ? aggregate.totalScore / aggregate.runsCompleted : 0)], ['Highest score', n(aggregate.highestScore)], ['Enemies defeated', n(aggregate.totalEnemiesDefeated)], ['Elites defeated', n(aggregate.totalElitesDefeated)], ['Bosses defeated', n(aggregate.totalBossesDefeated)],
    ];
    if (tab === 'Combat') lines = flatten(stats.combatCounters).map(([k,v]) => [k, n(v)]);
    if (tab === 'Echo') lines = flatten(stats.echoCounters).map(([k,v]) => [k, k.includes('Share') ? `${Math.round((Number(v)||0)*100)}%` : n(v)]);
    if (tab === 'Boss') lines = flatten(stats.bossRecords).map(([k,v]) => [k, k.toLowerCase().includes('time') ? formatDuration(v) : n(v)]);
    if (tab === 'Score') lines = flatten(stats.scoreCounters).map(([k,v]) => [k, n(v)]);
    if (tab === 'Records') lines = flatten(stats.personalBests).map(([k,v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]);
    if (tab === 'Recent Runs') { this.#renderRecent(save.records.recentRuns); this.addButton('Back', () => this.#back(), { x: DESIGN_WIDTH / 2, y: 830, width: 300, height: 46, fontSize: 18 }); return; }
    if (!lines.length) lines = [['No data yet', 'Complete a run to populate this tab.']];
    const left = lines.slice(0, 12); const right = lines.slice(12, 24);
    const renderColumn = (column, x) => this.#add(this.add.text(x, 235, column.map(([k,v]) => `${String(k).replaceAll(':',' · ')}\n  ${v}`).join('\n\n'), { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.primaryText, lineSpacing: 3, wordWrap: { width: 590 } }).setOrigin(0, 0));
    renderColumn(left, 190); if (right.length) renderColumn(right, 850);
    this.addButton('Back', () => this.#back(), { x: DESIGN_WIDTH / 2, y: 830, width: 300, height: 46, fontSize: 18 });
  }
  #renderRecent(records) {
    const newest = [...records].reverse(); this.recentIndex = Math.min(this.recentIndex, Math.max(0, newest.length - 1));
    if (!newest.length) { this.#add(this.add.text(DESIGN_WIDTH / 2, 470, 'No completed runs yet.', { fontFamily: 'monospace', fontSize: '24px', color: PALETTE.mutedText }).setOrigin(0.5)); return; }
    newest.slice(0, 8).forEach((run, index) => this.addButton(`${run.result.toUpperCase()} · ${n(run.finalScore)} · ${run.difficultyId}`, () => { this.recentIndex = index; this.#render(); }, { x: 430, y: 245 + index * 58, width: 570, height: 44, fontSize: 15 }));
    const run = newest[this.recentIndex];
    const details = [`Run ${run.runId}`, `Completed ${run.completedAt}`, `Result ${run.result}`, `Score ${n(run.finalScore)} · Subtotal ${n(run.subtotal)}`, `Seed ${run.seed} · ${run.difficultyId}`, `Duration ${formatDuration(run.durationMs)}`, `Boss ${formatDuration(run.bossDurationMs)} · Phase ${run.bossPhaseReached ?? 'none'}`, `Damage taken ${n(run.damageTaken)} · Health ${n(run.finalPlayerHealth)}`, `Combo ${Number(run.highestCombo).toFixed(1)} · Crossfire ${run.crossfireEvents} · Near misses ${run.nearMisses}`, `Player / Echo damage ${n(run.playerDamage)} / ${n(run.echoDamage)}`, `Unlocks ${(run.newUnlockIds ?? []).join(', ') || 'none'}`];
    this.#add(this.add.text(790, 245, details, { fontFamily: 'monospace', fontSize: '16px', color: PALETTE.primaryText, lineSpacing: 10, wordWrap: { width: 610 } }).setOrigin(0, 0));
  }
  #back() { this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.statistics], targetKey: this.returnTo, payload: this.returnPayload, token: `statistics-back-${performance.now()}` }); }
}
