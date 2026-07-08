import path from 'node:path';
import { rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import {
  ROOT, startStaticServer, launchBrowser, waitForGame, waitForScene, activateButton,
  diagnostics, resetToMenu, installFrameSampler, readFrameSampler, writeJson, sleep,
} from './phase10-browser-helpers.mjs';

const durationMs = Number(process.env.PHASE10_IDLE_DURATION_MS || 1_800_000);
const operationIntervalMs = Number(process.env.PHASE10_IDLE_OPERATION_INTERVAL_MS || 15_000);
const sampleIntervalMs = Number(process.env.PHASE10_IDLE_SAMPLE_INTERVAL_MS || 10_000);
const dist = path.join(ROOT, 'dist-idle');
await rm(dist, { recursive: true, force: true });
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', 'dist-idle'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
});
const server = await startStaticServer({ directory: dist, base: '/' });
const runtime = await launchBrowser({ engine: 'chromium', viewport: { width: 1600, height: 900 } });
const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
const samples = []; const operations = { archive: 0, statistics: 0, settings: 0, credits: 0, captureCancel: 0, resize: 0, focus: 0, audioToggle: 0 };
let idleStartedAt = null;

async function detailedSample(label) {
  const base = await diagnostics(page);
  const extra = await page.evaluate(() => {
    const scenes = globalThis.__ECHOFRAME__.game.scene.getScenes(true);
    return {
      heapBytes: performance.memory?.usedJSHeapSize ?? null,
      sceneCount: scenes.length,
      timers: scenes.reduce((sum, scene) => sum + (scene.time?.getAllEvents?.().length ?? 0), 0),
      tweens: scenes.reduce((sum, scene) => sum + (scene.tweens?.getTweens?.().length ?? 0), 0),
      domFileInputs: document.querySelectorAll('input[type="file"]').length,
      canvasCount: document.querySelectorAll('canvas').length,
      audioMuted: scenes[0]?.services?.settingsManager?.get('audio.muted') ?? null,
    };
  });
  const sample = {
    label, elapsedMs: idleStartedAt === null ? 0 : Date.now() - idleStartedAt,
    fps: base.debug.fps, frameMs: base.debug.frameMs,
    listeners: base.listenerCount, cleanup: base.cleanupCount,
    inputContexts: base.input.contextCount, keyObjects: base.input.keyObjectCount,
    audioContexts: base.audio.contextCount, activeVoices: base.audio.activeVoices,
    activeScenes: base.activeScenes, ...extra,
  };
  samples.push(sample); return sample;
}

async function openAndBack(sceneKey, buttonIndex) {
  await resetToMenu(page);
  await activateButton(page, 'MainMenuScene', buttonIndex);
  await waitForScene(page, sceneKey);
  await sleep(180);
  await page.keyboard.press('Escape');
  await waitForScene(page, 'MainMenuScene');
}

try {
  await page.goto(server.url, { waitUntil: 'networkidle' });
  await waitForGame(page); await waitForScene(page, 'MainMenuScene');
  await page.locator('canvas').click({ position: { x: 800, y: 450 } });
  await resetToMenu(page, { clearSave: false });
  await installFrameSampler(page);
  const baseline = await detailedSample('baseline');
  idleStartedAt = Date.now();
  let nextOperation = idleStartedAt; let nextSample = idleStartedAt + sampleIntervalMs; let operationIndex = 0;
  while (Date.now() - idleStartedAt < durationMs) {
    const now = Date.now();
    if (now >= nextOperation) {
      switch (operationIndex % 8) {
        case 0: await openAndBack('ArchiveScene', 3); operations.archive += 1; break;
        case 1: await openAndBack('StatisticsScene', 4); operations.statistics += 1; break;
        case 2: {
          await resetToMenu(page); await activateButton(page, 'MainMenuScene', 5); await waitForScene(page, 'SettingsScene');
          await sleep(180); await page.keyboard.press('Escape'); await waitForScene(page, 'MainMenuScene'); operations.settings += 1; break;
        }
        case 3: await openAndBack('CreditsScene', 6); operations.credits += 1; break;
        case 4: {
          await resetToMenu(page); await activateButton(page, 'MainMenuScene', 5); await waitForScene(page, 'SettingsScene');
          await activateButton(page, 'SettingsScene', 3); await sleep(60); await activateButton(page, 'SettingsScene', 0); await sleep(180);
          await page.keyboard.press('Escape'); await sleep(80); await resetToMenu(page); operations.captureCancel += 1; break;
        }
        case 5: {
          await page.setViewportSize(operationIndex % 16 === 5 ? { width: 1280, height: 720 } : { width: 1600, height: 900 });
          operations.resize += 1; break;
        }
        case 6: {
          await page.evaluate(() => { globalThis.dispatchEvent(new Event('blur')); document.dispatchEvent(new Event('visibilitychange')); });
          await page.bringToFront(); operations.focus += 1; break;
        }
        case 7: {
          await resetToMenu(page);
          await page.evaluate(() => {
            const services = globalThis.__ECHOFRAME__.game.scene.getScene('MainMenuScene').services;
            services.settingsManager.set('audio.muted', !services.settingsManager.get('audio.muted'));
          });
          operations.audioToggle += 1; break;
        }
      }
      operationIndex += 1; nextOperation += operationIntervalMs;
    }
    if (now >= nextSample) { await detailedSample(`sample-${samples.length}`); nextSample += sampleIntervalMs; }
    await sleep(Math.min(500, Math.max(50, Math.min(nextOperation, nextSample) - Date.now())));
  }
  await resetToMenu(page); await page.setViewportSize({ width: 1600, height: 900 });
  const end = await detailedSample('end');
  const frames = await readFrameSampler(page);
  const heapSamples = samples.filter((sample) => Number.isFinite(sample.heapBytes));
  const heapTrendBytes = heapSamples.length > 1 ? heapSamples.at(-1).heapBytes - heapSamples[0].heapBytes : null;
  const growth = {
    listeners: end.listeners - baseline.listeners,
    cleanup: end.cleanup - baseline.cleanup,
    inputContexts: end.inputContexts - baseline.inputContexts,
    keyObjects: end.keyObjects - baseline.keyObjects,
    audioContexts: end.audioContexts - baseline.audioContexts,
    timers: end.timers - baseline.timers,
    tweens: end.tweens - baseline.tweens,
    scenes: end.sceneCount - baseline.sceneCount,
    canvases: end.canvasCount - baseline.canvasCount,
    domFileInputs: end.domFileInputs - baseline.domFileInputs,
  };
  const actualDurationMs = Date.now() - idleStartedAt;
  const checks = {
    requiredWallClock: actualDurationMs >= durationMs,
    noListenerGrowth: growth.listeners === 0,
    noCleanupGrowth: growth.cleanup === 0,
    noInputContextGrowth: growth.inputContexts === 0,
    noKeyObjectGrowth: growth.keyObjects === 0,
    noTimerGrowth: growth.timers === 0,
    noTweenGrowth: growth.tweens === 0,
    noSceneGrowth: growth.scenes === 0,
    noCanvasGrowth: growth.canvases === 0,
    noDomInputGrowth: growth.domFileInputs === 0,
    oneAudioContextMaximum: end.audioContexts <= 1,
    noExceptions: exceptions.length === 0,
    noConsoleErrors: errors.length === 0,
    noFailedRequests: failedRequests.length === 0,
  };
  const report = {
    generatedAt: new Date().toISOString(), requestedDurationMs: durationMs, actualDurationMs,
    sampleCount: samples.length, operationIntervalMs, sampleIntervalMs, operations,
    baseline, end, growth, heapTrendBytes, frames, samples,
    exceptions, consoleErrors: errors, consoleWarnings: warnings, failedRequests,
    checks, passed: Object.values(checks).every(Boolean),
  };
  await writeJson('PHASE10_MENU_IDLE_VALIDATION.json', report);
  console.log(JSON.stringify({ passed: report.passed, actualDurationMs, sampleCount: samples.length, operations, growth, frames, errors: errors.length, exceptions: exceptions.length }, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser.close(); await server.close();
}
