import path from 'node:path';
import { rm, readdir, readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import {
  ROOT, startStaticServer, launchBrowser, waitForGame, waitForScene, waitUntil, activateButton,
  resetToMenu, installFrameSampler, readFrameSampler, diagnostics, writeJson, sleep,
} from './phase10-browser-helpers.mjs';
import { normalizeBindings, defaultBindingsSnapshot } from '../src/input/BindingCatalog.js';
import { migrateLegacyBindings } from '../src/input/BindingMigration.js';
import { validateSaveData } from '../src/state/SaveSchema.js';
import { createDefaultSaveData } from '../src/state/defaultSaveData.js';

const productionDist = path.join(ROOT, 'dist-performance');
const validationDist = path.join(ROOT, 'dist-performance-validation');
for (const directory of [productionDist, validationDist]) await rm(directory, { recursive: true, force: true });
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', 'dist-performance'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
});
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'validation', '--outDir', 'dist-performance-validation'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
});

async function filesRecursive(directory, base = directory) {
  const out = [];
  for (const name of await readdir(directory)) {
    const target = path.join(directory, name); const info = await stat(target);
    if (info.isDirectory()) out.push(...await filesRecursive(target, base));
    else out.push({ filename: path.relative(base, target).replaceAll(path.sep, '/'), path: target, bytes: info.size });
  }
  return out;
}
const files = await filesRecursive(productionDist);
for (const file of files) file.gzipBytes = gzipSync(await readFile(file.path)).length;
const jsAssets = files.filter((file) => file.filename.endsWith('.js'));
const bundle = {
  files: files.map(({ filename, bytes, gzipBytes }) => ({ filename, bytes, gzipBytes })),
  fileCount: files.length,
  totalDistBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  totalDistGzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
  totalJavaScriptBytes: jsAssets.reduce((sum, file) => sum + file.bytes, 0),
  totalJavaScriptGzipBytes: jsAssets.reduce((sum, file) => sum + file.gzipBytes, 0),
  largestAsset: files.toSorted((a, b) => b.bytes - a.bytes)[0] ? (({ filename, bytes, gzipBytes }) => ({ filename, bytes, gzipBytes }))(files.toSorted((a, b) => b.bytes - a.bytes)[0]) : null,
};
const phase9 = JSON.parse(await readFile(path.join(ROOT, 'docs', 'PHASE9_PERFORMANCE_VALIDATION.json'), 'utf8'));
bundle.phase9JavaScriptBytes = phase9.bundle.totalJavaScriptBytes;
bundle.phase9JavaScriptGzipBytes = phase9.bundle.totalJavaScriptGzipBytes;
bundle.changeBytes = bundle.totalJavaScriptBytes - bundle.phase9JavaScriptBytes;
bundle.gzipChangeBytes = bundle.totalJavaScriptGzipBytes - bundle.phase9JavaScriptGzipBytes;
bundle.changePercent = bundle.changeBytes / bundle.phase9JavaScriptBytes * 100;
bundle.gzipChangePercent = bundle.gzipChangeBytes / bundle.phase9JavaScriptGzipBytes * 100;

function bench(iterations, operation) {
  const started = performance.now(); let value;
  for (let i = 0; i < iterations; i += 1) value = operation(i);
  const totalMs = performance.now() - started;
  return { iterations, totalMs, averageMicroseconds: totalMs * 1000 / iterations, lastValueType: typeof value };
}
const defaults = defaultBindingsSnapshot();
const legacy = { moveUp: 'W', moveDown: 'S', moveLeft: 'A', moveRight: 'D', fire: 'MOUSE_LEFT', dash: 'SHIFT_OR_MOUSE_RIGHT', deployEcho: 'SPACE', pause: 'ESC' };
const save = createDefaultSaveData();
const microbenchmarks = {
  bindingNormalization: bench(25_000, () => normalizeBindings(defaults).bindings),
  legacyBindingMigration: bench(10_000, () => migrateLegacyBindings(legacy)),
  saveNormalization: bench(5_000, () => validateSaveData(save).data),
  saveSerialization: bench(10_000, () => JSON.stringify(save)),
};
const saveSerializationBytes = Buffer.byteLength(JSON.stringify(save));

const server = await startStaticServer({ directory: validationDist, base: '/' });
const runtime = await launchBrowser({ engine: 'chromium', viewport: { width: 1600, height: 900 } });
const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
const startup = {}; const frames = {}; const runtimePeaks = { listeners: 0, inputContexts: 0, keyObjects: 0, audioContexts: 0 };
async function timeAction(name, action, wait) {
  const started = performance.now(); await action(); await wait(); startup[name] = performance.now() - started; return startup[name];
}
async function peak() {
  const value = await diagnostics(page);
  runtimePeaks.listeners = Math.max(runtimePeaks.listeners, value.listenerCount ?? 0);
  runtimePeaks.inputContexts = Math.max(runtimePeaks.inputContexts, value.input.contextCount ?? 0);
  runtimePeaks.keyObjects = Math.max(runtimePeaks.keyObjects, value.input.keyObjectCount ?? 0);
  runtimePeaks.audioContexts = Math.max(runtimePeaks.audioContexts, value.audio.contextCount ?? 0);
  return value;
}
async function patchTransitions() {
  await page.evaluate(() => {
    const services = globalThis.__ECHOFRAME__.game.scene.getScenes(true)[0].services;
    if (!services.sceneFlow.adapter.__performancePatched) {
      const original = services.sceneFlow.adapter.execute.bind(services.sceneFlow.adapter);
      services.sceneFlow.adapter.execute = (descriptor, done) => original({ ...descriptor, fadeMs: 0 }, done);
      services.sceneFlow.adapter.__performancePatched = true;
    }
  });
}
try {
  const navigationStarted = performance.now();
  await page.goto(`${server.url}?debug=1`, { waitUntil: 'networkidle' }); await waitForGame(page); await waitForScene(page, 'MainMenuScene');
  startup.bootToMenuMs = performance.now() - navigationStarted;
  await page.locator('canvas').click({ position: { x: 800, y: 450 } }); await patchTransitions(); await peak();

  await resetToMenu(page, { clearSave: true }); await patchTransitions();
  await timeAction('firstTutorialStartupMs', () => activateButton(page, 'MainMenuScene', 0), () => waitForScene(page, 'TutorialScene'));
  await peak();
  await installFrameSampler(page); await sleep(3000); frames.tutorial = await readFrameSampler(page, { reset: true });
  await resetToMenu(page); await patchTransitions();
  await page.evaluate(() => { const services = globalThis.__ECHOFRAME__.game.scene.getScene('MainMenuScene').services; services.saveManager.update((draft) => { draft.meta.tutorialCompleted = true; }, { immediate: true }); });
  await timeAction('repeatTutorialStartupMs', () => activateButton(page, 'MainMenuScene', 2), () => waitForScene(page, 'TutorialScene'));
  await resetToMenu(page); await patchTransitions();

  await timeAction('settingsStartupMs', () => activateButton(page, 'MainMenuScene', 5), () => waitForScene(page, 'SettingsScene'));
  const bindingTiming = await page.evaluate(() => {
    const scene = globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene');
    const started = performance.now();
    for (let i = 0; i < 1000; i += 1) scene.services.inputManager.refreshContexts(`performance-${i}`);
    return { totalMs: performance.now() - started, iterations: 1000, diagnostics: scene.services.inputManager.getDiagnostics() };
  });
  startup.bindingContextRebuildAverageMs = bindingTiming.totalMs / bindingTiming.iterations;
  await resetToMenu(page); await patchTransitions();
  await timeAction('archiveStartupMs', () => activateButton(page, 'MainMenuScene', 3), () => waitForScene(page, 'ArchiveScene'));
  await resetToMenu(page); await patchTransitions();
  await timeAction('statisticsStartupMs', () => activateButton(page, 'MainMenuScene', 4), () => waitForScene(page, 'StatisticsScene'));
  await resetToMenu(page); await patchTransitions();

  const combatStart = performance.now();
  await page.evaluate(() => {
    const game = globalThis.__ECHOFRAME__.game; const services = game.scene.getScene('MainMenuScene').services; const save = services.saveManager.getSnapshot();
    const run = services.gameState.createRun({ seed: 505050, difficultyId: 'standard', unlockedUpgradeIds: save.progression.unlockedUpgradeIds });
    services.saveManager.update((draft) => { draft.statistics.aggregateCounters.runsStarted += 1; }, { immediate: true });
    game.scene.stop('MainMenuScene'); game.scene.start('RunScene', { runId: run.runId }); game.scene.start('HUDScene', { runId: run.runId });
  });
  await waitForScene(page, 'RunScene'); await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE9__));
  startup.combatOneStartupMs = performance.now() - combatStart;
  await page.evaluate(() => {
    const hook = globalThis.__ECHOFRAME_PHASE9__; hook.makePlayerInvulnerable(600000); hook.spawnFullRoster(); hook.forceRecordingReady(); hook.forceCooldownReady(); hook.deployEcho();
  });
  await installFrameSampler(page); await page.keyboard.down('KeyD'); await page.mouse.move(1050, 450); await page.mouse.down({ button: 'left' }); await sleep(8000); await page.mouse.up({ button: 'left' }); await page.keyboard.up('KeyD');
  frames.normalCombat = await readFrameSampler(page, { reset: true }); await peak();
  const spawnStarted = performance.now(); await page.evaluate(() => globalThis.__ECHOFRAME_PHASE9__.stressEnemyPools()); await sleep(1200);
  frames.spawnStress = { wallClockMs: performance.now() - spawnStarted, ...(await readFrameSampler(page, { reset: true })) };
  await resetToMenu(page); await patchTransitions();

  const bossStart = performance.now();
  await page.evaluate(() => {
    const game = globalThis.__ECHOFRAME__.game; const services = game.scene.getScene('MainMenuScene').services; const save = services.saveManager.getSnapshot();
    delete globalThis.__ECHOFRAME_PHASE8__;
    delete globalThis.__ECHOFRAME_PHASE9__;
    const run = services.gameState.createRun({ seed: 606060, difficultyId: 'standard', unlockedUpgradeIds: save.progression.unlockedUpgradeIds });
    run.currentSegmentIndex = 7; run.currentSegmentId = run.runPlan.segments[7].segmentId; run.currentSegmentType = run.runPlan.segments[7].segmentType; run.upgradeOfferIndex = 7; run.bossStarted = true;
    game.scene.stop('MainMenuScene'); game.scene.start('BossScene', { runId: run.runId }); game.scene.start('HUDScene', { runId: run.runId });
  });
  await waitForScene(page, 'BossScene'); await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE8__) && globalThis.__ECHOFRAME__.game.scene.isActive('BossScene'));
  await page.evaluate(() => { const scene = globalThis.__ECHOFRAME__.game.scene.getScene('BossScene'); scene.introRemainingMs = 1; scene.hitInvulnerability.start(600000); });
  await waitUntil(page, () => globalThis.__ECHOFRAME_PHASE8__.snapshot().combatStatus === 'BOSS_ACTIVE');
  startup.bossStartupMs = performance.now() - bossStart;
  await page.evaluate(() => { const hook = globalThis.__ECHOFRAME_PHASE8__; hook.forcePhase('DELETE'); hook.forceSector(); hook.forcePanel(); hook.forceEchoReady(); hook.deployEcho(); });
  await installFrameSampler(page); await sleep(8000); frames.boss = await readFrameSampler(page, { reset: true }); await peak();

  const resultsStart = performance.now();
  await page.evaluate(() => {
    const scene = globalThis.__ECHOFRAME__.game.scene.getScene('BossScene'); scene.destruction.firstVictory = false; globalThis.__ECHOFRAME_PHASE8__.forceVictory(); scene.destruction.skip();
  });
  await waitForScene(page, 'ResultsScene'); startup.resultsStartupMs = performance.now() - resultsStart; await peak();

  const currentSave = await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('ResultsScene').services.saveManager.getSnapshot());
  startup.saveSerializationBytesBrowser = new TextEncoder().encode(JSON.stringify(currentSave)).length;
  startup.saveMigrationAverageMs = (microbenchmarks.legacyBindingMigration.averageMicroseconds
    + microbenchmarks.saveNormalization.averageMicroseconds) / 1000;

  const checks = {
    bootToMenuBounded: startup.bootToMenuMs < 10_000,
    tutorialStartupBounded: startup.firstTutorialStartupMs < 3_000 && startup.repeatTutorialStartupMs < 3_000,
    sceneStartupsBounded: ['combatOneStartupMs','bossStartupMs','settingsStartupMs','archiveStartupMs','statisticsStartupMs','resultsStartupMs'].every((key) => startup[key] < 3_000),
    bindingRebuildBounded: startup.bindingContextRebuildAverageMs < 5,
    migrationBounded: startup.saveMigrationAverageMs < 5,
    normalCombatP95Under20Ms: frames.normalCombat.p95FrameMs < 20,
    bossP95Under20Ms: frames.boss.p95FrameMs < 20,
    tutorialP95Under20Ms: frames.tutorial.p95FrameMs < 20,
    noRecurringSpawnHitchOver50Ms: frames.spawnStress.framesOver50Ms <= 1,
    transferUnder15MB: bundle.totalDistBytes < 15 * 1024 * 1024,
    oneAudioContextMaximum: runtimePeaks.audioContexts <= 1,
    noExceptions: exceptions.length === 0,
    noConsoleErrors: errors.length === 0,
    noFailedRequests: failedRequests.length === 0,
  };
  const report = {
    generatedAt: new Date().toISOString(), measurementBuild: 'validation instrumentation over release-candidate gameplay code; production bundle measured separately',
    startup, microbenchmarks, saveSerializationBytes, bundle, frames, runtimePeaks,
    browser: await page.evaluate(() => navigator.userAgent),
    exceptions, consoleErrors: errors, consoleWarnings: warnings, failedRequests,
    checks, passed: Object.values(checks).every(Boolean),
  };
  await writeJson('PHASE10_PERFORMANCE_VALIDATION.json', report);
  console.log(JSON.stringify({ passed: report.passed, startup, bundle, frames, runtimePeaks, errors: errors.length, exceptions: exceptions.length }, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser.close(); await server.close();
}
