import path from 'node:path';
import { rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import {
  ROOT, assert, startStaticServer, launchBrowser, waitForGame, waitForScene, waitUntil,
  activateButton, capture, diagnostics, resetToMenu, startRunDirect, completeAcceleratedRun,
  writeJson, sleep,
} from './phase10-browser-helpers.mjs';

const dist = path.join(ROOT, 'dist-validation');
await rm(dist, { recursive: true, force: true });
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'validation', '--outDir', 'dist-validation'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
});
const server = await startStaticServer({ directory: dist, base: '/' });
const runtime = await launchBrowser({ engine: 'chromium', viewport: { width: 1600, height: 900 } });
const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
const checks = {}; const observations = {};

async function installTrustedInputProbe(page) {
  await page.evaluate(() => {
    if (globalThis.__PHASE13_TRUSTED_INPUT_PROBE__) return;
    const state = { keydowns: [], pointerdowns: [] };
    globalThis.__PHASE13_TRUSTED_INPUT_PROBE__ = state;
    globalThis.addEventListener('keydown', (event) => {
      state.keydowns.push({ code: event.code, key: event.key, trusted: event.isTrusted, repeat: event.repeat, at: performance.now() });
      if (state.keydowns.length > 32) state.keydowns.shift();
    }, true);
    globalThis.addEventListener('pointerdown', (event) => {
      state.pointerdowns.push({ button: event.button, trusted: event.isTrusted, x: event.clientX, y: event.clientY, at: performance.now() });
      if (state.pointerdowns.length > 32) state.pointerdowns.shift();
    }, true);
  });
}

async function clearTrustedInputProbe(page) {
  await page.evaluate(() => {
    const state = globalThis.__PHASE13_TRUSTED_INPUT_PROBE__;
    if (state) { state.keydowns.length = 0; state.pointerdowns.length = 0; }
  });
}

async function waitForCaptureListeners(page) {
  await waitUntil(page, () => {
    const active = globalThis.__ECHOFRAME__?.game?.scene?.getScenes(true) ?? [];
    const services = active[0]?.services;
    return services?.inputManager?.getDiagnostics?.()?.captureActive === true;
  });
  // SettingsScene intentionally delays global capture listeners by 140 ms to
  // prevent click-through. Wait beyond that production debounce before input.
  await sleep(190);
}

async function currentBindings(page) {
  return page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').services.settingsManager.get('controls.bindings'));
}

async function clickCanvasAtDesignPoint(page, designPoint, button = 'left') {
  const locator = page.locator('canvas').first();
  await locator.waitFor({ state: 'visible' });
  const box = await locator.boundingBox();
  assert(box, 'Canvas did not expose a bounding box');
  const gameSize = await page.evaluate(() => {
    const game = globalThis.__ECHOFRAME__.game;
    return { width: game.scale.gameSize.width, height: game.scale.gameSize.height };
  });
  const x = Math.max(1, Math.min(box.width - 1, designPoint.x * box.width / gameSize.width));
  const y = Math.max(1, Math.min(box.height - 1, designPoint.y * box.height / gameSize.height));
  await page.mouse.click(box.x + x, box.y + y, { button });
  return { box, gameSize, click: { x: box.x + x, y: box.y + y, button } };
}

async function worldToCanvasPoint(page, sceneKey, worldPoint) {
  const screen = await page.evaluate(({ sceneKey, worldPoint }) => {
    const scene = globalThis.__ECHOFRAME__.game.scene.getScene(sceneKey);
    const camera = scene.cameras.main;
    // Phaser's camera worldView gives the authoritative visible world origin.
    return {
      x: (worldPoint.x - camera.worldView.x) * camera.zoom,
      y: (worldPoint.y - camera.worldView.y) * camera.zoom,
      gameWidth: scene.scale.gameSize.width,
      gameHeight: scene.scale.gameSize.height,
      camera: { x: camera.worldView.x, y: camera.worldView.y, zoom: camera.zoom },
    };
  }, { sceneKey, worldPoint });
  const locator = page.locator('canvas').first();
  await locator.waitFor({ state: 'visible' });
  const box = await locator.boundingBox();
  assert(box, 'Canvas did not expose a bounding box');
  return {
    x: box.x + screen.x * box.width / screen.gameWidth,
    y: box.y + screen.y * box.height / screen.gameHeight,
    box,
    screen,
  };
}
try {
  const response = await page.goto(`${server.url}?debug=1`, { waitUntil: 'networkidle' });
  checks.http200 = response?.status() === 200;
  await waitForGame(page); await waitForScene(page, 'MainMenuScene');
  checks.title = await page.title() === 'ECHOFRAME: LAST SIGNAL';
  checks.releaseMode = (await page.evaluate(() => globalThis.__ECHOFRAME__.getReleaseSnapshot().mode)) === 'validation';
  await resetToMenu(page, { clearSave: true });
  const fresh = await diagnostics(page);
  checks.freshTutorialIncomplete = fresh.save.meta.tutorialCompleted === false;
  checks.freshRunCountZero = fresh.save.statistics.aggregateCounters.runsStarted === 0;
  await capture(page, 'ECHOFRAME_phase10_main_menu.png');

  await activateButton(page, 'MainMenuScene', 0); await waitForScene(page, 'TutorialScene');
  checks.freshRoutesTutorial = true;
  checks.noRunCreatedBeforeTutorial = !(await diagnostics(page)).runActive;
  await page.keyboard.down('d'); await sleep(90); await page.keyboard.up('d');
  await waitUntil(page, () => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__?.snapshot().state === 'MOVE_CHECKPOINTS');
  await capture(page, 'ECHOFRAME_phase10_tutorial_movement.png');

  await page.keyboard.press('Escape'); await waitForScene(page, 'PauseScene');
  checks.tutorialPause = true; await activateButton(page, 'PauseScene', 0); await waitForScene(page, 'TutorialScene');
  checks.tutorialResume = true;

  await installTrustedInputProbe(page);
  await clearTrustedInputProbe(page);
  await page.evaluate(() => {
    globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('AIM_AND_FIRE');
    const scene = globalThis.__ECHOFRAME__.game.scene.getScene('TutorialScene');
    // Use a deterministic firing lane while retaining real browser pointer
    // movement, trusted mouse input, WeaponSystem execution, projectile flight,
    // physics overlap, and TutorialController acceptance.
    scene.player.setPosition(scene.stationaryTarget.x - 320, scene.stationaryTarget.y);
    scene.player.bodySprite?.setVelocity?.(0, 0);
    scene.stationaryTargetHealth = 1;
  });
  const target = await page.evaluate(() => { const scene = globalThis.__ECHOFRAME__.game.scene.getScene('TutorialScene'); return { x: scene.stationaryTarget.x, y: scene.stationaryTarget.y }; });
  const targetPoint = await worldToCanvasPoint(page, 'TutorialScene', target);
  await page.mouse.move(targetPoint.x, targetPoint.y);
  await page.mouse.down({ button: 'left' });
  await sleep(220);
  await page.mouse.up({ button: 'left' });
  try {
    await waitUntil(page, () => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__?.snapshot().state === 'DASH_GATE', null, 4000);
  } catch {}
  const pointerFireObservation = await page.evaluate(() => ({
    state: globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.snapshot().state,
    probe: structuredClone(globalThis.__PHASE13_TRUSTED_INPUT_PROBE__),
    activeProjectiles: globalThis.__ECHOFRAME__.game.scene.getScene('TutorialScene').projectileManager.group.countActive(true),
  }));
  observations.pointerFire = { target, targetPoint, ...pointerFireObservation };
  checks.realPointerFireAccepted = pointerFireObservation.state === 'DASH_GATE'
    && pointerFireObservation.probe.pointerdowns.some((event) => event.button === 0 && event.trusted === true);
  if (!checks.realPointerFireAccepted) await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('DASH_GATE'));

  await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('DEPLOY_ECHO'));
  await page.keyboard.press('Space');
  await sleep(180);
  const failedDeployState = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.snapshot());
  checks.failedEchoDeployStaysLessonFive = failedDeployState.state === 'DEPLOY_ECHO'
    && failedDeployState.hasLockedReplay === false;

  const preparedEcho = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.prepareLockedEcho());
  await sleep(4000);
  const lockedAfterDelay = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.snapshot());
  checks.lockedEchoSurvivesLessonDelay = preparedEcho.locked
    && preparedEcho.fireEvents >= 4
    && lockedAfterDelay.state === 'DEPLOY_ECHO'
    && lockedAfterDelay.recordingLockState === 'locked'
    && lockedAfterDelay.hasLockedReplay === true;

  await page.keyboard.press('Space');
  await waitUntil(page, () => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__?.snapshot().recordingLockState === 'deployed');
  const deployedEcho = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.snapshot());
  checks.productionEchoDeployed = deployedEcho.state === 'DEPLOY_ECHO'
    && deployedEcho.recordingLockState === 'deployed'
    && deployedEcho.hasLockedReplay === false;
  await sleep(250); await capture(page, 'ECHOFRAME_phase10_tutorial_echo.png');
  await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.forceEchoSuccess());
  await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.complete());
  await waitForScene(page, 'RunScene', 30000);
  const postTutorial = await diagnostics(page);
  checks.completionPersisted = postTutorial.save.meta.tutorialCompleted === true;
  checks.oneRunStarted = postTutorial.save.statistics.aggregateCounters.runsStarted === 1;
  checks.tutorialScoreExcluded = postTutorial.save.records.recentRuns.length === 0 && postTutorial.save.statistics.aggregateCounters.totalScore === 0;
  checks.combatOneStarts = postTutorial.activeScenes.includes('RunScene');

  await resetToMenu(page);
  await activateButton(page, 'MainMenuScene', 0); await waitForScene(page, 'RunScene');
  checks.returningBypassesTutorial = !(await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScenes(true).some((s) => s.scene.key === 'TutorialScene')));
  await resetToMenu(page);
  const recordsBeforeReplay = (await diagnostics(page)).save.records.recentRuns.length;
  await activateButton(page, 'MainMenuScene', 3); await waitForScene(page, 'ArchiveScene');
  const archiveButtonCount = await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('ArchiveScene').buttons.length);
  await activateButton(page, 'ArchiveScene', archiveButtonCount - 2); await waitForScene(page, 'TutorialScene');
  checks.archiveReplayEntry = true;
  await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.complete()); await waitForScene(page, 'ArchiveScene');
  const recordsAfterReplay = (await diagnostics(page)).save.records.recentRuns.length;
  checks.archiveReplayNoRunRecord = recordsAfterReplay === recordsBeforeReplay;

  await resetToMenu(page); await activateButton(page, 'MainMenuScene', 5); await waitForScene(page, 'SettingsScene');
  await activateButton(page, 'SettingsScene', 3); await sleep(100);
  await installTrustedInputProbe(page);
  await capture(page, 'ECHOFRAME_phase10_controls_rebinding.png');
  const revisionBefore = (await diagnostics(page)).input.bindingRevision;

  await clearTrustedInputProbe(page);
  await activateButton(page, 'SettingsScene', 0);
  await waitForCaptureListeners(page);
  await page.bringToFront();
  await page.keyboard.press('i');
  try { await waitUntil(page, () => globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').services.settingsManager.get('controls.bindings').moveUp[0].code === 'KeyI', null, 3000); } catch {}
  let bindings = await currentBindings(page);
  const keyboardObservation = await page.evaluate(() => structuredClone(globalThis.__PHASE13_TRUSTED_INPUT_PROBE__));
  const revisionAfterKeyboard = (await diagnostics(page)).input.bindingRevision;
  observations.keyboardRebind = { revisionBefore, revisionAfterKeyboard, probe: keyboardObservation, binding: bindings.moveUp[0] };
  checks.keyboardRebind = bindings.moveUp[0].code === 'KeyI'
    && keyboardObservation.keydowns.some((event) => event.code === 'KeyI' && event.trusted === true);
  checks.immediateContextRebuild = revisionAfterKeyboard > revisionBefore;

  await clearTrustedInputProbe(page);
  await activateButton(page, 'SettingsScene', 2);
  await waitForCaptureListeners(page);
  await page.keyboard.press('i');
  await waitUntil(page, () => {
    const scene = globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene');
    return scene.services.inputManager.getDiagnostics().captureActive === false;
  });
  bindings = await currentBindings(page);
  const conflictObservation = await page.evaluate(() => structuredClone(globalThis.__PHASE13_TRUSTED_INPUT_PROBE__));
  observations.conflictRebind = { probe: conflictObservation, binding: bindings.moveDown[0] };
  checks.conflictRejected = bindings.moveDown[0].code === 'KeyS'
    && conflictObservation.keydowns.some((event) => event.code === 'KeyI' && event.trusted === true);

  await clearTrustedInputProbe(page);
  await activateButton(page, 'SettingsScene', 8);
  await waitForCaptureListeners(page);
  const middleClick = await clickCanvasAtDesignPoint(page, { x: 800, y: 450 }, 'middle');
  try { await waitUntil(page, () => {
    const binding = globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').services.settingsManager.get('controls.bindings').fire[0];
    return binding.device === 'pointer' && binding.button === 1;
  }, null, 3000); } catch {}
  bindings = await currentBindings(page);
  const pointerObservation = await page.evaluate(() => structuredClone(globalThis.__PHASE13_TRUSTED_INPUT_PROBE__));
  observations.pointerRebind = { click: middleClick.click, probe: pointerObservation, binding: bindings.fire[0] };
  checks.pointerRebind = bindings.fire[0].device === 'pointer' && bindings.fire[0].button === 1
    && pointerObservation.pointerdowns.some((event) => event.button === 1 && event.trusted === true);

  await clearTrustedInputProbe(page);
  await activateButton(page, 'SettingsScene', 0);
  await waitForCaptureListeners(page);
  await page.keyboard.press('Escape');
  await waitUntil(page, () => {
    const active = globalThis.__ECHOFRAME__.game.scene.getScenes(true);
    return active[0]?.services?.inputManager?.getDiagnostics?.()?.captureActive === false;
  });
  const escapeObservation = await page.evaluate(() => structuredClone(globalThis.__PHASE13_TRUSTED_INPUT_PROBE__));
  observations.escapeCapture = escapeObservation;
  checks.escapeCancelsCapture = !(await diagnostics(page)).input.captureActive
    && escapeObservation.keydowns.some((event) => event.code === 'Escape' && event.trusted === true);
  await activateButton(page, 'SettingsScene', 16); await sleep(120);
  bindings = await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').services.settingsManager.get('controls.bindings'));
  checks.restoreDefaults = bindings.moveUp[0].code === 'KeyW' && bindings.fire[0].button === 0 && bindings.dash[1].button === 2;

  await page.reload({ waitUntil: 'networkidle' }); await waitForGame(page); await waitForScene(page, 'MainMenuScene');
  const reloaded = await diagnostics(page);
  checks.reloadPersistence = reloaded.save.meta.tutorialCompleted === true && reloaded.save.settings.controls.bindings.moveUp[0].code === 'KeyW';

  await activateButton(page, 'MainMenuScene', 5); await waitForScene(page, 'SettingsScene'); await activateButton(page, 'SettingsScene', 2); await sleep(120);
  await capture(page, 'ECHOFRAME_phase10_accessibility.png');
  checks.accessibilityPage = (await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').section)) === 'accessibility';
  await resetToMenu(page); await activateButton(page, 'MainMenuScene', 6); await waitForScene(page, 'CreditsScene'); await capture(page, 'ECHOFRAME_phase10_credits.png');
  checks.credits = true;

  await startRunDirect(page, 'standard', 40101);
  await page.evaluate(() => { globalThis.__ECHOFRAME_PHASE9__.setCombo(12); globalThis.__ECHOFRAME_PHASE9__.spawnFullRoster(); globalThis.__ECHOFRAME_PHASE9__.forceRecordingReady(); globalThis.__ECHOFRAME_PHASE9__.forceCooldownReady(); globalThis.__ECHOFRAME_PHASE9__.deployEcho(); });
  await sleep(500); await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('RunScene').services.debugManager.setEnabled(false)); await sleep(60); await capture(page, 'ECHOFRAME_phase10_full_combat.png');
  await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('RunScene').services.debugManager.setEnabled(true));
  checks.combatRegression = true;
  const route = await completeAcceleratedRun(page, {
    difficultyId: 'standard', seed: 40102, result: 'victory',
    screenshotCallback: async (currentPage, stage) => {
      if (stage === 'boss') {
        await currentPage.evaluate(() => { globalThis.__ECHOFRAME_PHASE9__.forcePhase('DELETE'); const scene = globalThis.__ECHOFRAME__.game.scene.getScene('BossScene'); scene.services.debugManager.setEnabled(false); });
        await sleep(220); await capture(currentPage, 'ECHOFRAME_phase10_boss_phase3.png');
        await currentPage.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('BossScene').services.debugManager.setEnabled(true));
      }
      if (stage === 'results') await capture(currentPage, 'ECHOFRAME_phase10_results.png');
    },
  });
  checks.fullRouteVictory = route.result === 'victory' && route.recentRuns > 0;
  observations.route = route;

  await resetToMenu(page); await page.evaluate(() => globalThis.__ECHOFRAME__.triggerFatal('EF-VALIDATION-FATAL')); await page.waitForSelector('#fatal-error-screen');
  await capture(page, 'ECHOFRAME_phase10_fatal_screen.png');
  const fatal = await page.evaluate(() => ({ text: document.querySelector('#fatal-error-screen')?.innerText ?? '', stack: document.querySelector('#fatal-error-screen')?.innerText?.includes(' at ') ?? false }));
  checks.fatalScreen = fatal.text.includes('EF-VALIDATION-FATAL') && fatal.text.includes('Reload') && fatal.text.includes('Clear Local Data') && !fatal.stack;

  observations.finalDiagnostics = await page.evaluate(() => ({ title: document.title, fatalVisible: Boolean(document.querySelector('#fatal-error-screen')) }));
  checks.zeroExceptions = exceptions.length === 0;
  checks.zeroConsoleErrors = errors.length === 0;
  checks.zeroFailedRequests = failedRequests.length === 0;
  checks.warningsExplained = warnings.every((item) => /AudioContext|WebGL|GPU/i.test(item.text));
} finally {
  await browser.close(); await server.close();
}
const report = {
  generatedAt: new Date().toISOString(), browser: 'Chromium', engineExecutable: process.env.CHROMIUM_EXECUTABLE ?? 'Playwright-managed',
  base: '/', checks, observations, exceptions, consoleErrors: errors, consoleWarnings: warnings, failedRequests,
  requestCount: server.requests.length, passed: Object.values(checks).every(Boolean),
};
await writeJson('PHASE10_BROWSER_CHROMIUM_VALIDATION.json', report);
console.log(JSON.stringify({ passed: report.passed, checks, exceptions: exceptions.length, consoleErrors: errors.length, warnings: warnings.length, failedRequests: failedRequests.length }, null, 2));
if (!report.passed) process.exitCode = 1;
