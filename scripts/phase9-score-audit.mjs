import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DIFFICULTIES, runScoreSimulation } from './phase9-audit-helpers.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const reportPath = path.join(ROOT, 'docs', 'PHASE9_SCORE_AUDIT.json');
const summaries = [];
const failures = { nondeterministicMatches: 0, recomputationMismatches: 0, nonIntegerEventScores: 0, unknownEventTypes: 0, unboundedLedgerViolations: 0, nonFiniteValues: 0, negativeFinalScores: 0, duplicateAcceptedEvents: 0, scoreAfterOutcomeAccepted: 0 };
const byDifficulty = {};
for (const difficultyId of DIFFICULTIES) {
  const scores = [], eventCounts = [], combos = [], categories = {};
  for (let index = 0; index < 100; index += 1) {
    const seed = 900000 + index * 17 + DIFFICULTIES.indexOf(difficultyId) * 10000;
    const first = runScoreSimulation({ seed, difficultyId });
    const second = runScoreSimulation({ seed, difficultyId });
    if (JSON.stringify(first.finalized) !== JSON.stringify(second.finalized)) failures.nondeterministicMatches += 1;
    if (!first.finalized.reconciliationMatches || first.finalized.currentScore !== first.finalized.ledger.total) failures.recomputationMismatches += 1;
    if (first.finalized.finalScore < 0) failures.negativeFinalScores += 1;
    if (!Number.isFinite(first.finalized.finalScore)) failures.nonFiniteValues += 1;
    if (first.finalized.ledger.size > first.finalized.ledger.capacity) failures.unboundedLedgerViolations += 1;
    failures.duplicateAcceptedEvents += first.duplicateAccepted;
    failures.scoreAfterOutcomeAccepted += first.scoreAfterOutcomeAccepted;
    for (const event of first.finalized.ledger.events) {
      if (!Number.isInteger(event.awardedPoints)) failures.nonIntegerEventScores += 1;
      if (!event.eventType) failures.unknownEventTypes += 1;
      if (![event.awardedPoints, event.comboBefore, event.comboAfter, event.comboMultiplier, event.simulationMs].every(Number.isFinite)) failures.nonFiniteValues += 1;
    }
    scores.push(first.finalized.finalScore); eventCounts.push(first.finalized.ledger.size); combos.push(first.finalized.combo.highestCombo);
    for (const [key, value] of Object.entries(first.finalized.breakdown)) if (Number.isFinite(value)) categories[key] = (categories[key] ?? 0) + value;
    summaries.push({ seed, difficultyId, finalScore: first.finalized.finalScore, eventCount: first.finalized.ledger.size, highestCombo: first.finalized.combo.highestCombo });
  }
  byDifficulty[difficultyId] = { simulations: 100, minimumScore: Math.min(...scores), maximumScore: Math.max(...scores), averageScore: scores.reduce((a,b)=>a+b,0)/scores.length, averageEvents: eventCounts.reduce((a,b)=>a+b,0)/eventCounts.length, maximumLedgerSize: Math.max(...eventCounts), highestCombo: Math.max(...combos), categoryTotals: categories };
}
const passed = Object.values(failures).every((value) => value === 0);
const report = { generatedAt: new Date().toISOString(), scope: '300 complete deterministic score simulations: 100 per difficulty.', simulations: summaries.length, exactDeterministicMatches: summaries.length - failures.nondeterministicMatches, byDifficulty, failures, passed };
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 9 score audit: ${passed ? 'PASS' : 'FAIL'} — ${report.simulations} simulations.`);
if (!passed) process.exitCode = 1;
