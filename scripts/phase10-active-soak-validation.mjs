import path from 'node:path';
import { rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import {
  ROOT, startStaticServer, launchBrowser, waitForGame, waitForScene, waitUntil, activateButton,
  diagnostics, resetToMenu, startRunDirect, installFrameSampler, readFrameSampler, writeJson, sleep,
} from './phase10-browser-helpers.mjs';

const durationMs = Number(process.env.PHASE10_SOAK_DURATION_MS || 1_800_000);
const sampleIntervalMs = Number(process.env.PHASE10_SOAK_SAMPLE_INTERVAL_MS || 5_000);
const dist = path.join(ROOT, 'dist-soak');
await rm(dist, { recursive: true, force: true });
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'validation', '--outDir', 'dist-soak'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
});
const server = await startStaticServer({ directory: dist, base: '/' });
const runtime = await launchBrowser({ engine: 'chromium', viewport: { width: 1600, height: 900 } });
const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
let soakStartedAt = null; let nextSampleAt = 0;
const samples = [];
const operations = {
  tutorialSessions: 0, tutorialCompletions: 0, tutorialAborts: 0,
  normalRuns: 0, eliteSegments: 0, hazardSegments: 0, upgradesApplied: 0,
  friendlyEchoes: 0, hostileEchoes: 0, bossSessions: 0, bossPhase2: 0, bossPhase3: 0,
  scoreBursts: 0, results: 0, archiveOpens: 0, statisticsOpens: 0,
  rebindOperations: 0, settingsOperations: 0, pauseResume: 0, focusLoss: 0, resize: 0,
  poolStress: 0, forceClears: 0, victories: 0, defeats: 0,
};
const peaks = { enemies: 0, hostileProjectiles: 0, friendlyEchoes: 0, hostileEchoes: 0, listeners: 0, cleanup: 0, inputContexts: 0, audioContexts: 0, heapBytes: 0 };

async function sample(label) {
  const base = await diagnostics(page);
  const extra = await page.evaluate(() => {
    const game = globalThis.__ECHOFRAME__.game;
    const scenes = game.scene.getScenes(true);
    const run = game.scene.getScene('RunScene'); const boss = game.scene.getScene('BossScene');
    return {
      heapBytes: performance.memory?.usedJSHeapSize ?? null,
      timers: scenes.reduce((sum, scene) => sum + (scene.time?.getAllEvents?.().length ?? 0), 0),
      tweens: scenes.reduce((sum, scene) => sum + (scene.tweens?.getTweens?.().length ?? 0), 0),
      sceneCount: scenes.length,
      enemies: run?.enemyManager?.getDiagnostics?.().active ?? 0,
      hostileProjectiles: run?.enemyProjectileManager?.getDiagnostics?.().active ?? boss?.bossProjectileManager?.getDiagnostics?.().active ?? 0,
      friendlyEchoes: run?.echoPlaybackSystem?.getDiagnostics?.().active ?? boss?.echoPlaybackSystem?.getDiagnostics?.().active ?? 0,
      hostileEchoes: boss?.hostileEchoManager?.activeCount ?? 0,
      score: run?.run?.scoreManager?.snapshot?.().currentScore ?? boss?.run?.scoreManager?.snapshot?.().currentScore ?? 0,
      recentRuns: scenes[0]?.services?.saveManager?.getSnapshot?.().records?.recentRuns?.length ?? 0,
    };
  });
  const value = {
    label, elapsedMs: soakStartedAt === null ? 0 : Date.now() - soakStartedAt,
    fps: base.debug.fps, frameMs: base.debug.frameMs, activeScenes: base.activeScenes,
    listeners: base.listenerCount, cleanup: base.cleanupCount,
    inputContexts: base.input.contextCount, keyObjects: base.input.keyObjectCount,
    audioContexts: base.audio.contextCount, activeVoices: base.audio.activeVoices,
    ...extra,
  };
  samples.push(value);
  for (const key of Object.keys(peaks)) if (Number.isFinite(value[key])) peaks[key] = Math.max(peaks[key], value[key]);
  return value;
}
async function maybeSample(label = 'periodic') {
  if (Date.now() >= nextSampleAt) { await sample(`${label}-${samples.length}`); nextSampleAt += sampleIntervalMs; }
}
async function accelerateTransitions() {
  await page.evaluate(() => {
    const services = globalThis.__ECHOFRAME__.game.scene.getScenes(true)[0]?.services;
    if (services && !services.sceneFlow.adapter.__phase10SoakAccelerated) {
      const original = services.sceneFlow.adapter.execute.bind(services.sceneFlow.adapter);
      services.sceneFlow.adapter.execute = (descriptor, done) => original({ ...descriptor, fadeMs: 0 }, done);
      services.sceneFlow.adapter.__phase10SoakAccelerated = true;
    }
  });
}
async function finaliseActiveRun(outcome, { bossImplemented = false } = {}) {
  await page.evaluate(({ outcome, bossImplemented }) => {
    const game = globalThis.__ECHOFRAME__.game;
    const scene = game.scene.getScenes(true).find((entry) => entry.scene.key === 'RunScene' || entry.scene.key === 'BossScene');
    const services = scene.services; const run = scene.run;
    run.segmentDurations = { ...(run.segmentDurations ?? {}), 'combat-1': 74000, 'elite-1': 59000, boss: bossImplemented ? 90000 : 0 };
    run.segmentHealthStart = { ...(run.segmentHealthStart ?? {}), 'combat-1': 100, 'elite-1': 100 };
    run.segmentHealthEnd = { ...(run.segmentHealthEnd ?? {}), 'combat-1': outcome === 'victory' ? 70 : 0, 'elite-1': outcome === 'victory' ? 70 : 0 };
    run.bossStarted = bossImplemented;
    const statistics = scene.statistics?.snapshot?.() ?? run.statistics?.combat ?? {};
    const result = {
      result: outcome, title: outcome === 'victory' ? 'Victory · Soak' : 'Signal Lost · Soak',
      cause: outcome === 'victory' ? null : 'soak', durationMs: 320000, bossDurationMs: bossImplemented ? 90000 : 0,
      difficultyId: run.difficultyId, seed: run.seed, bossPhase: bossImplemented ? 'DELETE' : null,
      bossImplemented, finalPlayerHealth: outcome === 'victory' ? 70 : 0, statistics,
      bossTelemetry: bossImplemented ? (scene.bossTelemetry?.snapshot?.() ?? {}) : {},
      selectedUpgradeHistory: run.selectedUpgradeHistory, arenaSequence: run.arenaSequence,
      eliteModifiersDefeated: run.eliteModifiersDefeated, destructionSkipped: bossImplemented,
    };
    const finalized = services.runFinalizationService.finalize({ run, result });
    if (!finalized.committed) throw new Error(`Soak finalization failed: ${finalized.reason}`);
    services.gameState.completeRun(finalized.result);
    for (const active of game.scene.getScenes(true)) if (active.scene.key !== 'BootScene') game.scene.stop(active.scene.key);
    game.scene.start('ResultsScene', finalized.result);
  }, { outcome, bossImplemented });
  await waitForScene(page, 'ResultsScene'); operations.results += 1;
  outcome === 'victory' ? operations.victories += 1 : operations.defeats += 1;
}
async function tutorialScenario(index) {
  const scenarioStarted = Date.now(); console.log(`[soak] tutorial ${index} start`);
  await resetToMenu(page); await accelerateTransitions();
  await activateButton(page, 'MainMenuScene', 2); await waitForScene(page, 'TutorialScene');
  await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE10_TUTORIAL__));
  operations.tutorialSessions += 1;
  await page.evaluate(() => {
    const hook = globalThis.__ECHOFRAME_PHASE10_TUTORIAL__;
    hook.advanceTo('AIM_AND_FIRE'); hook.advanceTo('DASH_GATE'); hook.advanceTo('RECORD_PATH'); hook.forceEchoVisual();
  });
  operations.friendlyEchoes += 1;
  if (index % 3 === 2) {
    await page.keyboard.press('Escape'); await waitForScene(page, 'PauseScene');
    await page.evaluate(() => {
      const pause = globalThis.__ECHOFRAME__.game.scene.getScene('PauseScene');
      pause.services.sceneFlow.replace({ sourceKeys: ['PauseScene', 'TutorialScene'], targetKey: 'MainMenuScene', fadeMs: 0, token: `soak-tutorial-abort-${performance.now()}` });
    });
    await waitForScene(page, 'MainMenuScene'); operations.tutorialAborts += 1;
  } else {
    await page.evaluate(() => { const hook = globalThis.__ECHOFRAME_PHASE10_TUTORIAL__; hook.forceEchoSuccess(); hook.complete(); });
    await waitForScene(page, 'MainMenuScene'); operations.tutorialCompletions += 1;
  }
  console.log(`[soak] tutorial ${index} end ${Date.now() - scenarioStarted}ms`);
}
async function runScenario(index) {
  const scenarioStarted = Date.now(); console.log(`[soak] run ${index} start`);
  const difficulty = ['relaxed', 'standard', 'overclocked'][index % 3];
  await startRunDirect(page, difficulty, 88000 + index); await accelerateTransitions();
  operations.normalRuns += 1;
  const stress = await page.evaluate((modifier) => {
    const hook = globalThis.__ECHOFRAME_PHASE9__;
    hook.makePlayerInvulnerable(600000); hook.spawnFullRoster(); const elite = hook.spawnElite('drifter', modifier);
    hook.forceSuppressorState(); const projectile = hook.stressHostileProjectiles(); hook.stressEnemyPools();
    hook.forceRecordingReady(); hook.forceCooldownReady(); const echo = hook.deployEcho();
    hook.applyUpgrade('ricochet-matrix'); hook.setCombo(15); hook.addScoreEvent('crossfire'); hook.addScoreEvent('near-miss');
    return { eliteId: elite?.enemyId ?? null, projectile, echo: Boolean(echo), arena: hook.printArenaState(), snapshot: hook.getSnapshot() };
  }, ['overclocked', 'replicating', 'resonant'][index % 3]);
  operations.eliteSegments += 1; operations.hazardSegments += stress.arena?.hazards ? 1 : 0; operations.upgradesApplied += 1;
  operations.friendlyEchoes += stress.echo ? 1 : 0; operations.scoreBursts += 2; operations.poolStress += 1;
  await page.keyboard.down('KeyD'); await page.mouse.move(1050, 430); await page.mouse.down({ button: 'left' }); await sleep(700); await page.mouse.up({ button: 'left' }); await page.keyboard.up('KeyD');
  await page.keyboard.press('Escape'); await waitForScene(page, 'PauseScene'); operations.pauseResume += 1;
  await activateButton(page, 'PauseScene', 0); await waitForScene(page, 'RunScene');
  await page.evaluate(() => { globalThis.dispatchEvent(new Event('blur')); document.dispatchEvent(new Event('visibilitychange')); }); operations.focusLoss += 1;
  await page.setViewportSize(index % 2 ? { width: 1366, height: 768 } : { width: 1280, height: 720 }); operations.resize += 1;
  await page.evaluate(() => { globalThis.__ECHOFRAME_PHASE9__?.clearCombatObjects(); }); operations.forceClears += 1;
  await finaliseActiveRun(index % 4 === 3 ? 'defeat' : 'victory');
  await sleep(150);
  console.log(`[soak] run ${index} end ${Date.now() - scenarioStarted}ms`);
}
async function bossScenario(index) {
  const scenarioStarted = Date.now(); console.log(`[soak] boss ${index} start`);
  await resetToMenu(page); await accelerateTransitions();
  await page.evaluate((seed) => {
    const game = globalThis.__ECHOFRAME__.game; const services = game.scene.getScene('MainMenuScene').services;
    for (const scene of game.scene.getScenes(true)) if (scene.scene.key !== 'BootScene') game.scene.stop(scene.scene.key);
    // A stopped validation scene removes its hook during shutdown. Clear any hook
    // left in the same Phaser tick so the wait below can only observe this boss.
    delete globalThis.__ECHOFRAME_PHASE8__;
    delete globalThis.__ECHOFRAME_PHASE9__;
    services.gameState.disposeRun();
    const run = services.gameState.createRun({ seed, difficultyId: 'standard', unlockedUpgradeIds: services.saveManager.getSnapshot().progression.unlockedUpgradeIds });
    run.currentSegmentIndex = 7; run.currentSegmentId = run.runPlan.segments[7].segmentId; run.currentSegmentType = run.runPlan.segments[7].segmentType;
    run.upgradeOfferIndex = 7; run.playerHealth = 100; run.playerMaximumHealth = 100; run.bossStarted = true;
    services.saveManager.update((draft) => { draft.statistics.aggregateCounters.runsStarted += 1; }, { immediate: true });
    game.scene.start('BossScene', { runId: run.runId }); game.scene.start('HUDScene', { runId: run.runId });
  }, 99000 + index);
  await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE8__)
    && globalThis.__ECHOFRAME__.game.scene.isActive('BossScene'));
  await page.evaluate(() => { const scene = globalThis.__ECHOFRAME__.game.scene.getScene('BossScene'); scene.introRemainingMs = 1; scene.hitInvulnerability.start(600000); });
  await waitUntil(page, () => globalThis.__ECHOFRAME_PHASE8__.snapshot().combatStatus === 'BOSS_ACTIVE');
  await page.evaluate(() => {
    const hook = globalThis.__ECHOFRAME_PHASE8__;
    hook.forcePhase('IMITATE'); hook.forceEchoReady(); hook.deployEcho(); hook.forceAttack('hostile-echo'); hook.addScoreEvent('crossfire');
  });
  await sleep(500); operations.bossPhase2 += 1; operations.friendlyEchoes += 1; operations.hostileEchoes += 1; operations.scoreBursts += 1;
  await page.evaluate(() => { const hook = globalThis.__ECHOFRAME_PHASE8__; hook.forcePhase('DELETE'); hook.forceSector(); hook.forcePanel(); });
  await sleep(500); operations.bossPhase3 += 1; operations.bossSessions += 1;
  await finaliseActiveRun(index % 4 === 2 ? 'defeat' : 'victory', { bossImplemented: true });
  console.log(`[soak] boss ${index} end ${Date.now() - scenarioStarted}ms`);
}
async function settingsAndDataScenario(index) {
  const scenarioStarted = Date.now(); console.log(`[soak] settings ${index} start`);
  await resetToMenu(page); await accelerateTransitions();
  await activateButton(page, 'MainMenuScene', 5); await waitForScene(page, 'SettingsScene');
  await activateButton(page, 'SettingsScene', 3); await sleep(50); await activateButton(page, 'SettingsScene', 0); await sleep(170);
  await page.keyboard.press(index % 2 ? 'i' : 'o'); await sleep(100); operations.rebindOperations += 1;
  await activateButton(page, 'SettingsScene', 16); await sleep(80);
  await page.evaluate(() => {
    const services = globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').services;
    const enabled = !services.settingsManager.get('visual.highContrast');
    services.settingsManager.set('visual.screenShake', enabled ? 0 : 1);
    services.settingsManager.set('visual.reducedFlashes', enabled);
    services.settingsManager.set('visual.reducedParticles', enabled);
    services.settingsManager.set('visual.highContrast', enabled);
    services.settingsManager.set('accessibility.largerTelegraphOutlines', enabled);
    services.settingsManager.set('accessibility.persistentPlayerLocator', enabled);
  });
  operations.settingsOperations += 1;
  await resetToMenu(page); await activateButton(page, 'MainMenuScene', 3); await waitForScene(page, 'ArchiveScene'); operations.archiveOpens += 1;
  await page.keyboard.press('Escape'); await waitForScene(page, 'MainMenuScene');
  await activateButton(page, 'MainMenuScene', 4); await waitForScene(page, 'StatisticsScene'); operations.statisticsOpens += 1;
  await page.keyboard.press('Escape'); await waitForScene(page, 'MainMenuScene');
  console.log(`[soak] settings ${index} end ${Date.now() - scenarioStarted}ms`);
}

try {
  await page.goto(`${server.url}?debug=1`, { waitUntil: 'networkidle' });
  await waitForGame(page); await waitForScene(page, 'MainMenuScene'); await page.locator('canvas').click({ position: { x: 800, y: 450 } });
  await resetToMenu(page, { clearSave: true }); await accelerateTransitions();
  await page.evaluate(() => {
    const services = globalThis.__ECHOFRAME__.game.scene.getScene('MainMenuScene').services;
    services.saveManager.update((draft) => {
      draft.meta.tutorialCompleted = true;
      if (!draft.progression.unlockedDifficultyIds.includes('overclocked')) draft.progression.unlockedDifficultyIds.push('overclocked');
    }, { immediate: true });
  });
  await installFrameSampler(page);
  const baseline = await sample('baseline');
  soakStartedAt = Date.now(); nextSampleAt = soakStartedAt + sampleIntervalMs;
  let scenarioIndex = 0;
  while (Date.now() - soakStartedAt < durationMs) {
    const type = scenarioIndex % 4;
    if (type === 0) await runScenario(scenarioIndex);
    else if (type === 1) await tutorialScenario(scenarioIndex);
    else if (type === 2) await bossScenario(scenarioIndex);
    else await settingsAndDataScenario(scenarioIndex);
    await maybeSample(`scenario-${scenarioIndex}`);
    scenarioIndex += 1;
  }
  await resetToMenu(page); await page.setViewportSize({ width: 1600, height: 900 });
  const end = await sample('end'); const frames = await readFrameSampler(page);
  const heapValues = samples.map((entry) => entry.heapBytes).filter(Number.isFinite);
  const heapTrendBytes = heapValues.length > 1 ? heapValues.at(-1) - heapValues[0] : null;
  const growth = {
    listeners: end.listeners - baseline.listeners, cleanup: end.cleanup - baseline.cleanup,
    inputContexts: end.inputContexts - baseline.inputContexts, keyObjects: end.keyObjects - baseline.keyObjects,
    audioContexts: end.audioContexts - baseline.audioContexts, timers: end.timers - baseline.timers,
    tweens: end.tweens - baseline.tweens, scenes: end.sceneCount - baseline.sceneCount,
  };
  const actualDurationMs = Date.now() - soakStartedAt;
  const checks = {
    requiredWallClock: actualDurationMs >= durationMs,
    tutorialCovered: operations.tutorialSessions > 0 && operations.tutorialCompletions > 0 && operations.tutorialAborts > 0,
    combatCovered: operations.normalRuns > 0 && operations.eliteSegments > 0 && operations.hazardSegments > 0 && operations.upgradesApplied > 0,
    echoesCovered: operations.friendlyEchoes > 0 && operations.hostileEchoes > 0,
    bossCovered: operations.bossSessions > 0 && operations.bossPhase2 > 0 && operations.bossPhase3 > 0,
    scoreAndResultsCovered: operations.scoreBursts > 0 && operations.results > 0,
    menusAndSettingsCovered: operations.archiveOpens > 0 && operations.statisticsOpens > 0 && operations.rebindOperations > 0 && operations.settingsOperations > 0,
    lifecycleCovered: operations.pauseResume > 0 && operations.focusLoss > 0 && operations.resize > 0 && operations.forceClears > 0,
    noListenerGrowth: growth.listeners === 0, noCleanupGrowth: growth.cleanup === 0,
    noInputContextGrowth: growth.inputContexts === 0, noKeyObjectGrowth: growth.keyObjects === 0,
    noTimerGrowth: growth.timers === 0, noTweenGrowth: growth.tweens === 0, noSceneGrowth: growth.scenes === 0,
    oneAudioContextMaximum: end.audioContexts <= 1,
    recentRunCap: end.recentRuns <= 50,
    boundedHeapTrend: heapTrendBytes === null || heapTrendBytes < 64 * 1024 * 1024,
    noExceptions: exceptions.length === 0, noConsoleErrors: errors.length === 0, noFailedRequests: failedRequests.length === 0,
  };
  const report = {
    generatedAt: new Date().toISOString(), requestedDurationMs: durationMs, actualDurationMs,
    runtimeSampleCount: samples.length, scenarioCount: scenarioIndex, sampleIntervalMs,
    operations, peaks, baseline, end, growth, heapTrendBytes, frames, samples,
    exceptions, consoleErrors: errors, consoleWarnings: warnings, failedRequests,
    checks, passed: Object.values(checks).every(Boolean),
  };
  await writeJson('PHASE10_ACTIVE_SOAK_VALIDATION.json', report);
  console.log(JSON.stringify({ passed: report.passed, actualDurationMs, scenarioCount: scenarioIndex, operations, peaks, growth, heapTrendBytes, frames, errors: errors.length, exceptions: exceptions.length }, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser.close(); await server.close();
}
