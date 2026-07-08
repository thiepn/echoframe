import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { ROOT, fileExists, packageMetadata, productionBundleDigest, readJson, sourceManifest, writeJson } from './phase11-utils.mjs';
import { startStaticServer, launchBrowser, waitForGame } from './phase10-browser-helpers.mjs';

const dist = path.join(ROOT, 'dist-phase11-determinism');
await rm(dist, { recursive: true, force: true });
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'validation', '--outDir', 'dist-phase11-determinism'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
});
const source = await sourceManifest(); const bundle = await productionBundleDigest(dist); const pkg = await packageMetadata();
const runtimeVersion = (await readFile(path.join(ROOT, 'src/utils/version.js'), 'utf8')).match(/BUILD_VERSION\s*=\s*'([^']+)'/)?.[1] ?? null;
const firefoxReport = await readJson(path.join(ROOT, 'docs/PHASE11_BROWSER_FIREFOX_VALIDATION.json'));
const server = await startStaticServer({ directory: dist, base: '/' });

async function collect(engine, executablePath) {
  const previous = process.env[engine === 'firefox' ? 'FIREFOX_EXECUTABLE' : 'CHROMIUM_EXECUTABLE'];
  if (executablePath) process.env[engine === 'firefox' ? 'FIREFOX_EXECUTABLE' : 'CHROMIUM_EXECUTABLE'] = executablePath;
  let runtime;
  try {
    runtime = await launchBrowser({ engine, viewport: { width: 1280, height: 720 } });
    await runtime.page.goto(`${server.url}?debug=1`, { waitUntil: 'networkidle' });
    await waitForGame(runtime.page);
    const snapshots = await runtime.page.evaluate(() => {
      const game = globalThis.__ECHOFRAME__.game;
      const services = game.scene.getScenes(true)[0].services;
      const output = [];
      for (const difficultyId of ['relaxed', 'standard', 'overclocked']) {
        for (const seed of [1, 42, 99110, 3735928559]) {
          const runId = `cross-browser-${difficultyId}-${seed}`;
          const run = services.gameState.createRun({ runId, seed, difficultyId });
          const context = { simulationMs: 1000, segmentId: 'combat-1', segmentType: 'combat' };
          run.scoreManager.recordEnemyDefeat({ enemyType: 'drifter', enemyId: 'drifter-1', source: 'player' }, context);
          run.scoreManager.recordNearMiss({ projectileId: 'projectile-1' }, { ...context, simulationMs: 1250 });
          run.scoreManager.recordCrossfire({ crossfireEventId: 'crossfire-1', targetId: 'drifter-2' }, { ...context, simulationMs: 1500 });
          run.scoreManager.recordSegmentClear('combat-1', { ...context, simulationMs: 2000 });
          const finalized = run.scoreManager.finalize({ result: 'victory', segmentDurations: { 'combat-1': 60000 }, damageTaken: 0, durationMs: 60000 });
          output.push({
            difficultyId, seed,
            runPlan: structuredClone(run.runPlan),
            score: { finalScore: finalized.finalScore, breakdown: finalized.breakdown, events: finalized.ledger.events },
          });
          services.gameState.disposeRun();
        }
      }
      return output;
    });
    return { executed: true, snapshots, exceptions: runtime.exceptions, errors: runtime.errors, warnings: runtime.warnings, failedRequests: runtime.failedRequests };
  } catch (error) {
    return { executed: false, error: `${error.name}: ${error.message}`, snapshots: [] };
  } finally {
    try { await runtime?.browser?.close(); } catch {}
    if (previous === undefined) delete process.env[engine === 'firefox' ? 'FIREFOX_EXECUTABLE' : 'CHROMIUM_EXECUTABLE'];
    else process.env[engine === 'firefox' ? 'FIREFOX_EXECUTABLE' : 'CHROMIUM_EXECUTABLE'] = previous;
  }
}

const chromiumExecutable = process.env.CHROMIUM_EXECUTABLE || (await fileExists('/usr/bin/chromium') ? '/usr/bin/chromium' : null);
const chromium = await collect('chromium', chromiumExecutable);
let firefox = { executed: false, snapshots: [], error: 'Phase 11 Firefox validation did not execute game code.' };
if (firefoxReport?.passed && firefoxReport?.gameCodeExecuted && firefoxReport?.browser?.executable) firefox = await collect('firefox', firefoxReport.browser.executable);
const comparisons = [];
if (chromium.executed && firefox.executed) {
  for (let index = 0; index < chromium.snapshots.length; index += 1) {
    const left = chromium.snapshots[index]; const right = firefox.snapshots[index];
    comparisons.push({ difficultyId: left.difficultyId, seed: left.seed, runPlanMatch: JSON.stringify(left.runPlan) === JSON.stringify(right.runPlan), scoreEventSequenceMatch: JSON.stringify(left.score) === JSON.stringify(right.score) });
  }
}
const report = {
  generatedAt: new Date().toISOString(), phase: 11, scope: 'Authoritative deterministic run-plan and controlled score-event comparison',
  packageVersion: pkg.version, runtimeVersion, sourceManifestDigest: source.digest, productionBundleDigest: bundle?.digest ?? null,
  chromium: { executed: chromium.executed, snapshotCount: chromium.snapshots.length, errors: chromium.errors ?? [], exceptions: chromium.exceptions ?? [], failedRequests: chromium.failedRequests ?? [], error: chromium.error ?? null },
  firefox: { executed: firefox.executed, snapshotCount: firefox.snapshots.length, errors: firefox.errors ?? [], exceptions: firefox.exceptions ?? [], failedRequests: firefox.failedRequests ?? [], error: firefox.error ?? null },
  comparisons,
  hardFailures: comparisons.filter((entry) => !entry.runPlanMatch || !entry.scoreEventSequenceMatch).length,
  status: chromium.executed && firefox.executed ? 'completed' : 'blocked-real-firefox-required',
  passed: chromium.executed && firefox.executed && comparisons.length === 12 && comparisons.every((entry) => entry.runPlanMatch && entry.scoreEventSequenceMatch),
  note: 'Frame-perfect unscripted physics is intentionally outside this comparison. Authoritative seeded models and a controlled ledger event sequence are compared.',
};
await server.close();
await writeJson('PHASE11_CROSS_BROWSER_DETERMINISM.json', report);
console.log(JSON.stringify({ passed: report.passed, status: report.status, chromiumSnapshots: report.chromium.snapshotCount, firefoxSnapshots: report.firefox.snapshotCount, hardFailures: report.hardFailures }, null, 2));
if (!report.passed) process.exitCode = 1;
