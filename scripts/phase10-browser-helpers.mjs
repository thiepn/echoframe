import http from 'node:http';
import path from 'node:path';
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { chromium, firefox } from 'playwright';

export const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
export const DOCS = path.join(ROOT, 'docs');
export const SCREENSHOTS = path.join(DOCS, 'screenshots');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.map': 'application/json; charset=utf-8',
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function assert(condition, message) { if (!condition) throw new Error(message); }

export async function startStaticServer({ directory, base = '/', port = 0 }) {
  const normalizedBase = `/${String(base).replace(/^\/+|\/+$/g, '')}${base === '/' ? '' : '/'}`.replace('//', '/');
  const requests = [];
  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(requestUrl.pathname);
    const entry = { method: request.method, pathname, status: 0, contentType: '' };
    requests.push(entry);
    try {
      if (!pathname.startsWith(normalizedBase)) {
        entry.status = 404; response.writeHead(404); response.end('Not found'); return;
      }
      let relative = pathname.slice(normalizedBase.length);
      if (!relative || relative.endsWith('/')) relative += 'index.html';
      const resolved = path.resolve(directory, relative);
      if (!resolved.startsWith(path.resolve(directory))) {
        entry.status = 403; response.writeHead(403); response.end('Forbidden'); return;
      }
      const info = await stat(resolved);
      if (!info.isFile()) throw new Error('not-file');
      const body = await readFile(resolved);
      const contentType = MIME[path.extname(resolved).toLowerCase()] ?? 'application/octet-stream';
      entry.status = 200; entry.contentType = contentType;
      response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' }); response.end(body);
    } catch {
      entry.status = 404; response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found');
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  const address = server.address();
  return {
    base: normalizedBase,
    requests,
    url: `http://127.0.0.1:${address.port}${normalizedBase}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export async function launchBrowser({ engine = 'chromium', headless = true, viewport = { width: 1600, height: 900 } } = {}) {
  const type = engine === 'firefox' ? firefox : chromium;
  const executablePath = engine === 'firefox' ? process.env.FIREFOX_EXECUTABLE : process.env.CHROMIUM_EXECUTABLE;
  if (executablePath) await access(executablePath);
  const browser = await type.launch({
    headless,
    executablePath: executablePath || undefined,
    args: engine === 'chromium' ? [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ] : [],
  });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await context.newPage();
  const errors = []; const warnings = []; const exceptions = []; const failedRequests = [];
  page.on('console', (message) => {
    const item = { type: message.type(), text: message.text() };
    if (message.type() === 'error') errors.push(item);
    if (message.type() === 'warning') warnings.push(item);
  });
  page.on('pageerror', (error) => exceptions.push({ name: error.name, message: error.message, stack: error.stack }));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' }));
  return { browser, context, page, errors, warnings, exceptions, failedRequests };
}

export async function waitForGame(page, timeout = 30000) {
  await page.waitForFunction(() => Boolean(globalThis.__ECHOFRAME__?.game), null, { timeout });
}
export async function waitForScene(page, key, timeout = 30000) {
  await page.waitForFunction((sceneKey) => globalThis.__ECHOFRAME__?.game?.scene?.getScenes(true)?.some((scene) => scene.scene.key === sceneKey), key, { timeout });
}
export async function waitUntil(page, predicate, argument = null, timeout = 30000) {
  await page.waitForFunction(predicate, argument, { timeout });
}
export async function activeSceneKeys(page) {
  return page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScenes(true).map((scene) => scene.scene.key));
}
export async function activateButton(page, sceneKey, index) {
  return page.evaluate(({ sceneKey, index }) => {
    const scene = globalThis.__ECHOFRAME__.game.scene.getScene(sceneKey);
    const button = scene?.buttons?.[index];
    if (!button) throw new Error(`Missing button ${index} in ${sceneKey}`);
    button.activate(); return true;
  }, { sceneKey, index });
}
export async function capture(page, filename) {
  await mkdir(SCREENSHOTS, { recursive: true });
  const target = path.join(SCREENSHOTS, filename);
  await page.screenshot({ path: target, type: 'png' });
  return target;
}

export async function diagnostics(page) {
  return page.evaluate(() => {
    const active = globalThis.__ECHOFRAME__.game.scene.getScenes(true);
    const services = active[0]?.services;
    const debug = services?.debugManager?.getSnapshot(globalThis.__ECHOFRAME__.game) ?? {};
    const input = services?.inputManager?.getDiagnostics?.() ?? {};
    const audio = services?.audioManager?.getDiagnostics?.() ?? {};
    return {
      activeScenes: active.map((scene) => scene.scene.key),
      listenerCount: services?.eventBus?.listenerCount?.() ?? null,
      cleanupCount: services?.debugManager?.getCleanupCount?.() ?? null,
      input, audio, debug,
      saveWrites: services?.saveManager?.getDiagnostics?.()?.writeCount ?? null,
      save: services?.saveManager?.getSnapshot?.() ?? null,
      runActive: Boolean(services?.gameState?.activeRun),
    };
  });
}

export async function resetToMenu(page, { clearSave = false } = {}) {
  await page.evaluate(({ clearSave }) => {
    const game = globalThis.__ECHOFRAME__.game;
    const active = game.scene.getScenes(true);
    const services = active[0]?.services;
    services.sceneFlow.currentTransition = null;
    services.inputManager.setLocked(false);
    for (const scene of active) if (scene.scene.key !== 'BootScene') game.scene.stop(scene.scene.key);
    services.gameState.disposeRun();
    if (clearSave) { services.saveManager.clear(); services.settingsManager.reloadFromSave(); services.inputManager.refreshContexts('validation-clear'); }
    game.scene.start('MainMenuScene');
    return true;
  }, { clearSave });
  await waitForScene(page, 'MainMenuScene');
}

export async function startRunDirect(page, difficultyId = 'standard', seed = 10101) {
  await page.evaluate(({ difficultyId, seed }) => {
    const game = globalThis.__ECHOFRAME__.game;
    const active = game.scene.getScenes(true); const services = active[0].services;
    services.sceneFlow.currentTransition = null; services.inputManager.setLocked(false);
    services.debugManager?.setEnabled?.(true);
    for (const scene of active) if (scene.scene.key !== 'BootScene') game.scene.stop(scene.scene.key);
    delete globalThis.__ECHOFRAME_PHASE8__;
    delete globalThis.__ECHOFRAME_PHASE9__;
    services.gameState.disposeRun();
    const save = services.saveManager.getSnapshot();
    const run = services.gameState.createRun({ seed, difficultyId, unlockedUpgradeIds: save.progression.unlockedUpgradeIds });
    services.saveManager.update((draft) => { draft.statistics.aggregateCounters.runsStarted = (draft.statistics.aggregateCounters.runsStarted ?? 0) + 1; }, { immediate: true });
    game.scene.start('RunScene', { runId: run.runId }); game.scene.start('HUDScene', { runId: run.runId });
    return run.runId;
  }, { difficultyId, seed });
  await waitForScene(page, 'RunScene');
  await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE9__), null, 20000);
  await page.evaluate(() => { const scene = globalThis.__ECHOFRAME__.game.scene.getScene('RunScene'); scene.encounterDirector.update = () => {}; scene.enemyManager.clear('phase10-validation'); scene.hitInvulnerability.start(600000); });
}

export async function completeCurrentRun(page, { result = 'victory', screenshotCallback = null } = {}) {
  for (let segmentIndex = 0; segmentIndex < 6; segmentIndex += 1) {
    await page.evaluate((index) => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('RunScene');
      scene.run.segmentHealthStart[scene.segment.segmentId] = 100; scene.run.segmentHealthEnd[scene.segment.segmentId] = 100;
      scene.run.segmentDurations[scene.segment.segmentId] = index % 2 ? 60000 : 74000;
      scene.statistics.playerDashes = 4; if (index >= 2) scene.run.eliteModifiersDefeated = ['overclocked'];
      globalThis.__ECHOFRAME_PHASE9__.completeCurrentChamber();
    }, segmentIndex);
    await waitForScene(page, 'UpgradeScene');
    await page.evaluate(() => { const scene = globalThis.__ECHOFRAME__.game.scene.getScene('UpgradeScene'); if (scene?.time) scene.time.timeScale = 50; if (scene?.tweens) scene.tweens.timeScale = 50; });
    await activateButton(page, 'UpgradeScene', 0);
    if (segmentIndex < 5) {
      await waitForScene(page, 'RunScene');
      await waitUntil(page, (expected) => globalThis.__ECHOFRAME__.game.scene.getScene('RunScene')?.run?.currentSegmentIndex === expected, segmentIndex + 1);
      await page.evaluate(() => { const scene = globalThis.__ECHOFRAME__.game.scene.getScene('RunScene'); scene.encounterDirector.update = () => {}; scene.enemyManager.clear('phase10-route'); scene.hitInvulnerability.start(600000); });
    } else await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE7_RECOVERY__), null, 20000);
  }
  await page.evaluate(() => { globalThis.__ECHOFRAME_PHASE7_RECOVERY__.forceReady(); globalThis.__ECHOFRAME_PHASE7_RECOVERY__.complete(); });
  await waitForScene(page, 'UpgradeScene'); await page.evaluate(() => { const scene = globalThis.__ECHOFRAME__.game.scene.getScene('UpgradeScene'); if (scene?.time) scene.time.timeScale = 50; if (scene?.tweens) scene.tweens.timeScale = 50; }); await activateButton(page, 'UpgradeScene', 0);
  await waitForScene(page, 'BossScene'); await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE9__), null, 20000);
  await page.evaluate(() => { const scene = globalThis.__ECHOFRAME__.game.scene.getScene('BossScene'); scene.introRemainingMs = 1; scene.hitInvulnerability.start(600000); });
  await waitUntil(page, () => globalThis.__ECHOFRAME_PHASE9__.snapshot().combatStatus === 'BOSS_ACTIVE', null, 20000);
  if (screenshotCallback) await screenshotCallback(page, 'boss');
  await page.evaluate((outcome) => {
    const scene = globalThis.__ECHOFRAME__.game.scene.getScene('BossScene');
    if (scene?.time) scene.time.timeScale = 50;
    if (outcome === 'victory') {
      scene.destruction.firstVictory = false;
      globalThis.__ECHOFRAME_PHASE9__.forceVictory();
      scene.destruction.skip();
    } else globalThis.__ECHOFRAME_PHASE9__.forceDefeat();
  }, result);
  await waitForScene(page, 'ResultsScene', 30000);
  if (screenshotCallback) await screenshotCallback(page, 'results');
  return page.evaluate(() => {
    const scene = globalThis.__ECHOFRAME__.game.scene.getScene('ResultsScene');
    const save = scene.services.saveManager.getSnapshot();
    return { result: scene.sceneData.result, finalScore: scene.sceneData.finalScore, recentRuns: save.records.recentRuns.length, aggregate: save.statistics.aggregateCounters };
  });
}

export async function completeAcceleratedRun(page, { difficultyId = 'standard', seed = 10101, result = 'victory', screenshotCallback = null } = {}) {
  await startRunDirect(page, difficultyId, seed);
  return completeCurrentRun(page, { result, screenshotCallback });
}

export async function installFrameSampler(page) {
  await page.evaluate(() => {
    if (globalThis.__ECHOFRAME_FRAME_SAMPLER__?.running) return;
    const state = { running: true, last: performance.now(), deltas: [], longFrames: 0, max: 0, count: 0 };
    const tick = (now) => {
      if (!state.running) return;
      const delta = now - state.last; state.last = now;
      if (delta > 0 && delta < 1000) { state.deltas.push(delta); if (state.deltas.length > 120000) state.deltas.shift(); state.max = Math.max(state.max, delta); state.count += 1; if (delta > 50) state.longFrames += 1; }
      requestAnimationFrame(tick);
    };
    globalThis.__ECHOFRAME_FRAME_SAMPLER__ = state; requestAnimationFrame(tick);
  });
}

export async function readFrameSampler(page, { reset = false } = {}) {
  return page.evaluate(({ reset }) => {
    const state = globalThis.__ECHOFRAME_FRAME_SAMPLER__;
    if (!state) return null;
    const sorted = [...state.deltas].sort((a, b) => a - b);
    const percentile = (p) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] : 0;
    const value = { samples: sorted.length, averageFrameMs: sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0, minimumFps: state.max > 0 ? 1000 / state.max : 0, averageFps: sorted.length ? 1000 / (sorted.reduce((a, b) => a + b, 0) / sorted.length) : 0, p95FrameMs: percentile(0.95), p99FrameMs: percentile(0.99), maximumFrameMs: state.max, framesOver50Ms: state.longFrames };
    if (reset) { state.deltas = []; state.max = 0; state.longFrames = 0; state.count = 0; state.last = performance.now(); }
    return value;
  }, { reset });
}

export async function writeJson(filename, value) {
  await mkdir(DOCS, { recursive: true });
  const target = path.join(DOCS, filename); await writeFile(target, `${JSON.stringify(value, null, 2)}\n`); return target;
}
