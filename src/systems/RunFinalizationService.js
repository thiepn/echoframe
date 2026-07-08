import { ProgressionManager } from '../progression/ProgressionManager.js';
import { ArchiveDiscoveryManager } from '../progression/ArchiveDiscoveryManager.js';
import { AggregateStatisticsManager } from '../statistics/AggregateStatisticsManager.js';
import { PersonalBestManager } from '../statistics/PersonalBestManager.js';
import { createRecentRunRecord } from '../statistics/RecentRunRecord.js';
import { buildFinalizedRunModel } from '../statistics/RunStatisticsAggregator.js';

export class RunFinalizationService {
  constructor({ saveManager, progressionManager = new ProgressionManager(), aggregateManager = new AggregateStatisticsManager(), personalBestManager = new PersonalBestManager() } = {}) {
    this.saveManager = saveManager;
    this.progressionManager = progressionManager;
    this.aggregateManager = aggregateManager;
    this.personalBestManager = personalBestManager;
    this.finalizedRunIds = new Set();
  }

  finalize({ run, result, debug = false } = {}) {
    if (!run?.scoreManager) throw new Error('RunFinalizationService requires a run ScoreManager.');
    if (this.finalizedRunIds.has(run.runId)) return Object.freeze({ committed: false, reason: 'already-finalized', result: structuredClone(result) });
    const scoreFinalization = run.scoreManager.finalize({ result: result.result, segmentDurations: run.segmentDurations, damageTaken: result.statistics?.damageTaken ?? run.statistics?.combat?.damageTaken ?? 0, durationMs: result.durationMs, debug });
    const finalizedRun = buildFinalizedRunModel({ run, result, scoreFinalization, debug });
    if (finalizedRun.debug) {
      this.finalizedRunIds.add(run.runId);
      const debugResult = Object.freeze({ ...structuredClone(result), runId: run.runId, score: scoreFinalization, finalScore: scoreFinalization.finalScore, scoreBreakdown: scoreFinalization.breakdown, combo: scoreFinalization.combo, personalBestComparisons: Object.freeze([]), personalBestIds: Object.freeze([]), unlocks: Object.freeze([]), appliedUnlockIds: Object.freeze([]), finalizedRun });
      return Object.freeze({ committed: true, persisted: false, result: debugResult, scoreFinalization, finalizedRun, unlockDefinitions: Object.freeze([]), comparisons: Object.freeze([]), write: { ok: true, skipped: true } });
    }
    const saveBefore = this.saveManager.getSnapshot();
    const comparisons = this.personalBestManager.compare({ save: saveBefore, run: finalizedRun });
    const unlockDefinitions = this.progressionManager.evaluate({ finalizedRun, save: saveBefore });
    const completedAt = new Date().toISOString();
    let appliedUnlockIds = [];
    let personalBestIds = [];
    const write = this.saveManager.update((save) => {
      this.aggregateManager.apply(save, finalizedRun);
      personalBestIds = [...this.personalBestManager.apply(save, finalizedRun, comparisons, completedAt)];
      appliedUnlockIds = [...this.progressionManager.apply(save, unlockDefinitions, completedAt)];
      const discoveries = ['enemy-roster', ...(finalizedRun.eliteModifiersDefeated.map((id) => `elite:${id}`))];
      if (finalizedRun.bossReached) discoveries.push('boss:null-architect', 'echo:hostile');
      if (finalizedRun.result === 'victory') discoveries.push('lore:signal-restored');
      ArchiveDiscoveryManager.discover(save, discoveries);
      const lore = new Set(save.progression.loreIds ?? []);
      lore.add('lore-first-signal');
      if (finalizedRun.eliteParentsDefeated > 0) lore.add('lore-elite-architecture');
      if (finalizedRun.bossReached) lore.add('lore-null-architect');
      if (finalizedRun.result === 'victory') lore.add('lore-signal-restored');
      save.progression.loreIds = [...lore];
      save.records.recentRuns = save.records.recentRuns.filter((entry) => entry.runId !== finalizedRun.runId);
      save.records.recentRuns.push(createRecentRunRecord({ ...finalizedRun, completedAt, newUnlockIds: appliedUnlockIds, personalBestIds }));
      const bossRecord = save.statistics.bossRecords['null-architect'] ?? { attempts: 0, defeats: 0, bestTimeMs: null, byDifficulty: {} };
      if (finalizedRun.bossReached) bossRecord.attempts = (bossRecord.attempts ?? 0) + 1;
      bossRecord.byDifficulty ??= {};
      const difficultyRecord = bossRecord.byDifficulty[finalizedRun.difficultyId] ?? { attempts: 0, victories: 0, bestTimeMs: null, totalTimeMs: 0 };
      if (finalizedRun.bossReached) { difficultyRecord.attempts += 1; difficultyRecord.totalTimeMs += finalizedRun.bossDurationMs; }
      if (finalizedRun.result === 'victory') {
        bossRecord.defeats = (bossRecord.defeats ?? 0) + 1;
        bossRecord.bestTimeMs = bossRecord.bestTimeMs === null || bossRecord.bestTimeMs === undefined ? finalizedRun.bossDurationMs : Math.min(bossRecord.bestTimeMs, finalizedRun.bossDurationMs);
        difficultyRecord.victories += 1;
        difficultyRecord.bestTimeMs = difficultyRecord.bestTimeMs === null || difficultyRecord.bestTimeMs === undefined ? finalizedRun.bossDurationMs : Math.min(difficultyRecord.bestTimeMs, finalizedRun.bossDurationMs);
      }
      bossRecord.byDifficulty[finalizedRun.difficultyId] = difficultyRecord;
      save.statistics.bossRecords['null-architect'] = bossRecord;
    }, { immediate: true });
    if (!write.ok) return Object.freeze({ committed: false, reason: 'save-write-failed', error: write.error });
    this.finalizedRunIds.add(run.runId);
    const enrichedResult = Object.freeze({
      ...structuredClone(result), runId: run.runId, score: scoreFinalization, finalScore: scoreFinalization.finalScore,
      scoreBreakdown: scoreFinalization.breakdown, combo: scoreFinalization.combo, personalBestComparisons: comparisons,
      personalBestIds: Object.freeze([...personalBestIds]), unlocks: Object.freeze(unlockDefinitions.map((entry) => structuredClone(entry))),
      appliedUnlockIds: Object.freeze([...appliedUnlockIds]), finalizedRun,
    });
    return Object.freeze({ committed: true, result: enrichedResult, scoreFinalization, finalizedRun, unlockDefinitions, comparisons, write });
  }
}
