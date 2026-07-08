import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const docsDir = path.join(ROOT, 'docs');
const names = (await readdir(docsDir))
  .filter((name) => /^PHASE5_LIFECYCLE_BATCH\d+_10\.json$/.test(name))
  .sort((a, b) => Number(a.match(/BATCH(\d+)/)[1]) - Number(b.match(/BATCH(\d+)/)[1]));
if (names.length !== 5) throw new Error(`Expected five lifecycle batch reports, found ${names.length}.`);
const batches = await Promise.all(names.map(async (name, index) => {
  const report = JSON.parse(await readFile(path.join(docsDir, name), 'utf8'));
  if (report.totalCycles !== 10) throw new Error(`${name}: expected 10 cycles, got ${report.totalCycles}.`);
  return { id: index + 1, source: name, ...report };
}));
const allCycles = batches.flatMap((batch, batchIndex) => batch.cycles.map((cycle) => ({ ...cycle, globalCycle: batchIndex * 10 + cycle.cycle, batch: batchIndex + 1 })));
const sum = (key) => batches.reduce((total, batch) => total + batch[key], 0);
const ranges = (selector) => {
  const values = batches.flatMap(selector);
  return { min: Math.min(...values), max: Math.max(...values) };
};
const difficulties = [...new Set(allCycles.map((cycle) => cycle.difficultyId))].sort();
const uniqueSeeds = new Set(allCycles.map((cycle) => cycle.seed)).size;
const leakChecks = {
  listenersStable: batches.every((batch) => batch.leakChecks.listenersStable),
  cleanupStable: batches.every((batch) => batch.leakChecks.cleanupStable),
  inputContextsStable: batches.every((batch) => batch.leakChecks.inputContextsStable),
  runtimeHookCleared: batches.every((batch) => batch.leakChecks.runtimeHookCleared),
  browserExceptions: batches.reduce((total, batch) => total + batch.leakChecks.browserExceptions, 0),
  consoleErrors: batches.reduce((total, batch) => total + batch.leakChecks.consoleErrors, 0),
};
if (allCycles.length !== 50 || uniqueSeeds !== 50 || difficulties.length !== 3 || Object.values(leakChecks).some((value) => value !== true && value !== 0)) {
  throw new Error('Aggregated lifecycle evidence failed its invariants.');
}
const report = {
  generatedAt: new Date().toISOString(),
  browser: 'Chromium headless via Chrome DevTools Protocol',
  executionModel: '50 complete cycles across five fresh Chromium sessions (10 cycles per session); each session reused one Phaser game instance across its ten cycles.',
  totalCycles: allCycles.length,
  victories: sum('victories'),
  deaths: sum('deaths'),
  restarts: sum('restarts'),
  returnsToMenu: sum('returnsToMenu'),
  mouseControlSelections: sum('mouseControlSelections'),
  keyboardFocusSelections: sum('keyboardFocusSelections'),
  physicalInputCoverage: { mouseUpgradeSelection: true, keyboardUpgradeSelection: true, source: 'PHASE5_BROWSER_VALIDATION.json' },
  difficulties,
  uniqueSeeds,
  diagnostics: {
    sessions: batches.length,
    listenerRange: ranges((batch) => [batch.diagnostics.listenerRange.min, batch.diagnostics.listenerRange.max]),
    cleanupRange: ranges((batch) => [batch.diagnostics.cleanupRange.min, batch.diagnostics.cleanupRange.max]),
    inputContextRange: ranges((batch) => [batch.diagnostics.inputContextRange.min, batch.diagnostics.inputContextRange.max]),
    resultListenerRange: ranges((batch) => [batch.diagnostics.resultListenerRange.min, batch.diagnostics.resultListenerRange.max]),
    resultCleanupRange: ranges((batch) => [batch.diagnostics.resultCleanupRange.min, batch.diagnostics.resultCleanupRange.max]),
    finalMenuSamples: batches.map((batch) => batch.diagnostics.final),
  },
  leakChecks,
  batches: batches.map((batch) => ({
    id: batch.id,
    cycles: batch.totalCycles,
    source: batch.source,
    diagnostics: batch.diagnostics,
    leakChecks: batch.leakChecks,
  })),
  cycles: allCycles,
};
await writeFile(path.join(docsDir, 'PHASE5_LIFECYCLE_VALIDATION.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath: path.join(docsDir, 'PHASE5_LIFECYCLE_VALIDATION.json'), totalCycles: report.totalCycles, victories: report.victories, deaths: report.deaths, restarts: report.restarts, returnsToMenu: report.returnsToMenu, difficulties, uniqueSeeds, diagnostics: report.diagnostics, leakChecks }, null, 2));
