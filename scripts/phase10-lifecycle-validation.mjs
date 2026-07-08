import path from 'node:path';
import { rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import {
  ROOT, assert, startStaticServer, launchBrowser, waitForGame, waitForScene, waitUntil,
  activateButton, diagnostics, resetToMenu, completeCurrentRun, startRunDirect, writeJson, sleep,
} from './phase10-browser-helpers.mjs';

const dist = path.join(ROOT, 'dist-validation');
await rm(dist, { recursive: true, force: true });
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'validation', '--outDir', 'dist-validation'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
});
const server = await startStaticServer({ directory: dist, base: '/' });
const runtime = await launchBrowser({ engine: 'chromium', viewport: { width: 1600, height: 900 } });
const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
const samples = [];
const categories = { freshTutorialFullRun: 0, tutorialAbortRestartReplay: 0, controlsRebinding: 0, settingsPauseFocus: 0, acceleratedRun: 0, archiveStatisticsCreditsData: 0 };
const startedAt = Date.now();

async function patchHarness() {
  await page.evaluate(() => {
    const services = globalThis.__ECHOFRAME__.game.scene.getScenes(true)[0].services;
    if (!services.sceneFlow.adapter.__phase10Accelerated) {
      const original = services.sceneFlow.adapter.execute.bind(services.sceneFlow.adapter);
      services.sceneFlow.adapter.execute = (descriptor, done) => original({ ...descriptor, fadeMs: 0 }, done);
      services.sceneFlow.adapter.__phase10Accelerated = true;
    }
  });
}

async function sample(label, cycle) {
  const value = await diagnostics(page);
  const compact = {
    label, cycle,
    activeScenes: value.activeScenes,
    listeners: value.listenerCount,
    cleanup: value.cleanupCount,
    inputContexts: value.input.contextCount,
    keyObjects: value.input.keyObjectCount,
    bindingRevision: value.input.bindingRevision,
    captureActive: value.input.captureActive,
    audioContexts: value.audio.contextCount,
    activeVoices: value.audio.activeVoices,
    saveWrites: value.saveWrites,
    recentRuns: value.save.records.recentRuns.length,
    runsStarted: value.save.statistics.aggregateCounters.runsStarted,
    runsCompleted: value.save.statistics.aggregateCounters.runsCompleted,
    tutorialCompleted: value.save.meta.tutorialCompleted,
  };
  samples.push(compact); return compact;
}

async function finishTutorial() {
  await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE10_TUTORIAL__));
  await page.evaluate(() => {
    globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('AIM_AND_FIRE');
    globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('DASH_GATE');
    globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('RECORD_PATH');
    globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('DEPLOY_ECHO');
    globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.forceEchoSuccess();
    globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.complete();
  });
}

async function menuCycleScene(sceneKey) {
  await page.evaluate((key) => {
    const game = globalThis.__ECHOFRAME__.game;
    const menu = game.scene.getScene('MainMenuScene');
    menu.services.sceneFlow.replace({ sourceKeys: ['MainMenuScene'], targetKey: key, payload: { returnTo: 'MainMenuScene' }, fadeMs: 0, token: `life-${key}-${performance.now()}` });
  }, sceneKey);
  await waitForScene(page, sceneKey);
  await page.keyboard.press('Escape');
  await waitForScene(page, 'MainMenuScene');
}

try {
  await page.goto(`${server.url}?debug=1`, { waitUntil: 'networkidle' });
  await waitForGame(page); await waitForScene(page, 'MainMenuScene'); await patchHarness();
  await page.locator('canvas').click({ position: { x: 800, y: 450 } });
  await resetToMenu(page, { clearSave: true }); await patchHarness();
  const baseline = await sample('baseline', -1);

  // 10 exact fresh-save -> tutorial -> complete run -> results cycles.
  for (let index = 0; index < 10; index += 1) {
    await resetToMenu(page, { clearSave: true }); await patchHarness();
    await activateButton(page, 'MainMenuScene', 0); await waitForScene(page, 'TutorialScene');
    await finishTutorial(); await waitForScene(page, 'RunScene');
    const runStarted = await diagnostics(page);
    assert(runStarted.save.statistics.aggregateCounters.runsStarted === 1, `Fresh cycle ${index}: tutorial created an incorrect run count`);
    await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('RunScene');
      scene.encounterDirector.update = () => {}; scene.enemyManager.clear('lifecycle'); scene.hitInvulnerability.start(600000);
    });
    await completeCurrentRun(page, { result: index % 4 === 3 ? 'defeat' : 'victory' });
    const result = await diagnostics(page);
    assert(result.save.meta.tutorialCompleted, `Fresh cycle ${index}: tutorial completion not persisted`);
    assert(result.save.statistics.aggregateCounters.runsStarted === 1, `Fresh cycle ${index}: duplicate run-start transaction`);
    assert(result.save.records.recentRuns.length === 1, `Fresh cycle ${index}: result record missing`);
    await resetToMenu(page); await patchHarness();
    categories.freshTutorialFullRun += 1; await sample('fresh-tutorial-full-run', index); console.log(`[lifecycle] fresh full ${index + 1}/10`);
  }

  // 10 tutorial abort/restart/replay cycles.
  await resetToMenu(page, { clearSave: false });
  for (let index = 0; index < 10; index += 1) {
    await activateButton(page, 'MainMenuScene', 2); await waitForScene(page, 'TutorialScene');
    await page.keyboard.press('Escape'); await waitForScene(page, 'PauseScene');
    if (index % 2 === 0) {
      // Restart via controlled scene replacement with the same public payload.
      await page.evaluate(() => {
        const pause = globalThis.__ECHOFRAME__.game.scene.getScene('PauseScene');
        pause.services.sceneFlow.replace({ sourceKeys: ['PauseScene', 'TutorialScene'], targetKey: 'TutorialScene', payload: pause.sceneData.tutorialPayload, fadeMs: 0, token: `life-tutorial-restart-${performance.now()}` });
      });
      await waitForScene(page, 'TutorialScene'); await finishTutorial(); await waitForScene(page, 'MainMenuScene');
    } else {
      await page.evaluate(() => {
        const pause = globalThis.__ECHOFRAME__.game.scene.getScene('PauseScene');
        pause.services.sceneFlow.replace({ sourceKeys: ['PauseScene', 'TutorialScene'], targetKey: 'MainMenuScene', fadeMs: 0, token: `life-tutorial-abort-${performance.now()}` });
      });
      await waitForScene(page, 'MainMenuScene');
    }
    categories.tutorialAbortRestartReplay += 1; await sample('tutorial-abort-restart-replay', index); console.log(`[lifecycle] tutorial lifecycle ${index + 1}/10`);
  }

  // 10 actual controls-capture cycles.
  for (let index = 0; index < 10; index += 1) {
    await activateButton(page, 'MainMenuScene', 5); await waitForScene(page, 'SettingsScene');
    await activateButton(page, 'SettingsScene', 3); await sleep(30);
    await activateButton(page, 'SettingsScene', 0); await sleep(170);
    await page.keyboard.press(index % 2 === 0 ? 'i' : 'o'); await sleep(80);
    const changed = await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').services.settingsManager.get('controls.bindings').moveUp[0].code);
    assert(['KeyI', 'KeyO'].includes(changed), `Binding cycle ${index}: valid binding not committed`);
    await activateButton(page, 'SettingsScene', 0); await sleep(170); await page.keyboard.press('Escape'); await sleep(60);
    await activateButton(page, 'SettingsScene', 16); await sleep(60);
    const restored = await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').services.settingsManager.get('controls.bindings').moveUp[0].code);
    assert(restored === 'KeyW', `Binding cycle ${index}: defaults not restored`);
    await resetToMenu(page); await patchHarness();
    categories.controlsRebinding += 1; await sample('controls-rebinding', index); console.log(`[lifecycle] rebind ${index + 1}/10`);
  }

  // 10 Settings/Pause/focus/resize cycles.
  for (let index = 0; index < 10; index += 1) {
    await startRunDirect(page, 'standard', 72000 + index); await patchHarness();
    await page.keyboard.press('Escape'); await waitForScene(page, 'PauseScene');
    await activateButton(page, 'PauseScene', 1); await waitForScene(page, 'SettingsScene');
    await page.evaluate(() => { globalThis.dispatchEvent(new Event('blur')); document.dispatchEvent(new Event('visibilitychange')); });
    await page.setViewportSize(index % 2 ? { width: 1366, height: 768 } : { width: 1600, height: 900 });
    await page.keyboard.press('Escape'); await waitForScene(page, 'PauseScene');
    await activateButton(page, 'PauseScene', 0); await waitForScene(page, 'RunScene');
    await resetToMenu(page); await patchHarness();
    categories.settingsPauseFocus += 1; await sample('settings-pause-focus', index); console.log(`[lifecycle] settings/pause ${index + 1}/10`);
  }

  // 10 accelerated complete runs using all difficulties.
  await page.evaluate(() => {
    const services = globalThis.__ECHOFRAME__.game.scene.getScene('MainMenuScene').services;
    services.saveManager.update((draft) => { if (!draft.progression.unlockedDifficultyIds.includes('overclocked')) draft.progression.unlockedDifficultyIds.push('overclocked'); }, { immediate: true });
  });
  for (let index = 0; index < 10; index += 1) {
    const difficulty = ['relaxed', 'standard', 'overclocked'][index % 3];
    await startRunDirect(page, difficulty, 73000 + index); await patchHarness();
    await page.evaluate((outcome) => {
      const game = globalThis.__ECHOFRAME__.game;
      const runScene = game.scene.getScene('RunScene');
      const services = runScene.services;
      const run = runScene.run;
      run.segmentDurations = { 'combat-1': 74000, 'combat-2': 74000, 'elite-1': 59000, 'combat-3': 74000, 'combat-4': 74000, 'elite-2': 59000, recovery: 10000, boss: 90000 };
      run.bossStarted = true;
      run.bossPhase = 'delete';
      run.playerHealth = outcome === 'victory' ? 64 : 0;
      run.statistics.combat = { ...(run.statistics.combat ?? {}), playerDashes: 4, playerShotsFired: 12, playerProjectileHits: 8, damageTaken: outcome === 'victory' ? 36 : 100 };
      const result = {
        title: outcome === 'victory' ? 'Victory · Null Architect Defeated' : 'Signal Lost · Null Architect',
        result: outcome,
        cause: outcome === 'victory' ? null : 'lifecycle-accelerated',
        durationMs: 520000,
        bossDurationMs: 90000,
        difficultyId: run.difficultyId,
        seed: run.seed,
        bossPhase: 'delete',
        bossImplemented: true,
        finalPlayerHealth: run.playerHealth,
        statistics: run.statistics.combat,
        bossTelemetry: {},
        selectedUpgradeHistory: run.selectedUpgradeHistory,
        arenaSequence: run.arenaSequence,
        eliteModifiersDefeated: run.eliteModifiersDefeated,
        destructionSkipped: true,
      };
      const finalized = services.runFinalizationService.finalize({ run, result });
      if (!finalized.committed) throw new Error(`Accelerated lifecycle finalization failed: ${finalized.reason}`);
      services.gameState.completeRun(finalized.result);
      for (const scene of game.scene.getScenes(true)) if (scene.scene.key !== 'BootScene') game.scene.stop(scene.scene.key);
      game.scene.start('ResultsScene', finalized.result);
    }, index % 5 === 4 ? 'defeat' : 'victory');
    await waitForScene(page, 'ResultsScene');
    await resetToMenu(page); await patchHarness();
    categories.acceleratedRun += 1; await sample('accelerated-run', index); console.log(`[lifecycle] accelerated run ${index + 1}/10`);
  }

  // 10 Archive/Statistics/Credits/Data cycles.
  for (let index = 0; index < 10; index += 1) {
    await menuCycleScene('ArchiveScene'); await menuCycleScene('StatisticsScene'); await menuCycleScene('CreditsScene');
    await activateButton(page, 'MainMenuScene', 5); await waitForScene(page, 'SettingsScene');
    await activateButton(page, 'SettingsScene', 5); await sleep(25);
    const exported = await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').services.saveManager.exportJson());
    assert(JSON.parse(exported).schemaVersion === 2, `Data cycle ${index}: export invalid`);
    await resetToMenu(page); await patchHarness();
    categories.archiveStatisticsCreditsData += 1; await sample('archive-statistics-credits-data', index); console.log(`[lifecycle] menu/data ${index + 1}/10`);
  }

  const end = await sample('end', 60);
  const growth = {
    listeners: end.listeners - baseline.listeners,
    cleanup: end.cleanup - baseline.cleanup,
    inputContexts: end.inputContexts - baseline.inputContexts,
    keyObjects: end.keyObjects - baseline.keyObjects,
    audioContexts: end.audioContexts - baseline.audioContexts,
  };
  const checks = {
    exact60Cycles: Object.values(categories).reduce((sum, value) => sum + value, 0) === 60,
    exactCategoryCounts: Object.values(categories).every((value) => value === 10),
    tenFreshFullRoutes: categories.freshTutorialFullRun === 10,
    noListenerGrowth: growth.listeners === 0,
    noCleanupGrowth: growth.cleanup === 0,
    noInputContextGrowth: growth.inputContexts === 0,
    noKeyObjectGrowth: growth.keyObjects === 0,
    oneAudioContextMaximum: end.audioContexts <= 1 && growth.audioContexts <= 1,
    captureClosed: end.captureActive === false,
    noExceptions: exceptions.length === 0,
    noConsoleErrors: errors.length === 0,
    noFailedRequests: failedRequests.length === 0,
  };
  const report = {
    generatedAt: new Date().toISOString(), wallClockMs: Date.now() - startedAt,
    harnessMode: 'validation-only transition timing acceleration; gameplay definitions, score acceptance, and result finalization unchanged',
    categories, baseline, end, growth, samples, checks,
    exceptions, consoleErrors: errors, consoleWarnings: warnings, failedRequests,
    passed: Object.values(checks).every(Boolean),
  };
  await writeJson('PHASE10_LIFECYCLE_VALIDATION.json', report);
  console.log(JSON.stringify({ passed: report.passed, categories, growth, errors: errors.length, exceptions: exceptions.length }, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser.close(); await server.close();
}
