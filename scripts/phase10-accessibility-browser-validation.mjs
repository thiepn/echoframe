import path from 'node:path';
import { rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import {
  ROOT, assert, startStaticServer, launchBrowser, waitForGame, waitForScene, waitUntil,
  activateButton, resetToMenu, startRunDirect, diagnostics, writeJson, sleep,
} from './phase10-browser-helpers.mjs';

const PRESETS = Object.freeze([
  Object.freeze({
    name: 'Default',
    visual: { screenShake: 0.7, reducedFlashes: false, reducedParticles: false, highContrast: false, damageNumbers: true, aimLine: true, hudOpacity: 0.9 },
    accessibility: { pauseOnFocusLoss: true, persistentPlayerLocator: false, largerTelegraphOutlines: false },
  }),
  Object.freeze({
    name: 'No shake + reduced flashes + reduced particles',
    visual: { screenShake: 0, reducedFlashes: true, reducedParticles: true, highContrast: false, damageNumbers: true, aimLine: true, hudOpacity: 0.9 },
    accessibility: { pauseOnFocusLoss: true, persistentPlayerLocator: false, largerTelegraphOutlines: false },
  }),
  Object.freeze({
    name: 'High contrast + larger outlines + persistent locator',
    visual: { screenShake: 0.7, reducedFlashes: false, reducedParticles: false, highContrast: true, damageNumbers: true, aimLine: true, hudOpacity: 0.9 },
    accessibility: { pauseOnFocusLoss: true, persistentPlayerLocator: true, largerTelegraphOutlines: true },
  }),
  Object.freeze({
    name: 'Damage numbers off + aim line off + minimum HUD opacity',
    visual: { screenShake: 0.7, reducedFlashes: false, reducedParticles: false, highContrast: false, damageNumbers: false, aimLine: false, hudOpacity: 0.5 },
    accessibility: { pauseOnFocusLoss: true, persistentPlayerLocator: false, largerTelegraphOutlines: false },
  }),
  Object.freeze({
    name: 'All accessibility aids enabled',
    visual: { screenShake: 0, reducedFlashes: true, reducedParticles: true, highContrast: true, damageNumbers: false, aimLine: false, hudOpacity: 0.5 },
    accessibility: { pauseOnFocusLoss: true, persistentPlayerLocator: true, largerTelegraphOutlines: true },
  }),
]);

async function applyPreset(page, preset) {
  await page.evaluate((settings) => {
    const active = globalThis.__ECHOFRAME__.game.scene.getScenes(true);
    const manager = active[0].services.settingsManager;
    for (const [group, values] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(values)) manager.set(`${group}.${key}`, value, { immediate: true });
    }
  }, { visual: preset.visual, accessibility: preset.accessibility });
}

async function startTutorialReplay(page) {
  await page.evaluate(() => {
    const game = globalThis.__ECHOFRAME__.game;
    const active = game.scene.getScenes(true);
    const services = active[0].services;
    services.sceneFlow.currentTransition = null;
    services.inputManager.setLocked(false);
    for (const scene of active) if (scene.scene.key !== 'BootScene') game.scene.stop(scene.scene.key);
    services.gameState.disposeRun();
    game.scene.start('TutorialScene', { mode: 'replay', returnTo: 'MainMenuScene' });
  });
  await waitForScene(page, 'TutorialScene');
  await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE10_TUTORIAL__));
  await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('MOVE_CHECKPOINTS'));
  await sleep(120);
}

function expectedOutline(preset, base, highIncrement = 2, largeIncrement = 3) {
  if (preset.accessibility.largerTelegraphOutlines) return base + largeIncrement;
  if (preset.visual.highContrast) return base + highIncrement;
  return base;
}

const dist = path.join(ROOT, 'dist-accessibility-validation');
await rm(dist, { recursive: true, force: true });
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'validation', '--outDir', 'dist-accessibility-validation'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, VITE_BASE_PATH: '/' },
});

const server = await startStaticServer({ directory: dist, base: '/' });
const runtime = await launchBrowser({ engine: 'chromium', viewport: { width: 1600, height: 900 } });
const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
const rows = [];
let referenceRunPlan = null;
let referenceCollision = null;

try {
  const response = await page.goto(`${server.url}?debug=1`, { waitUntil: 'networkidle' });
  assert(response?.status() === 200, 'Accessibility validation production build did not return HTTP 200.');
  await waitForGame(page);
  await waitForScene(page, 'MainMenuScene');

  for (let index = 0; index < PRESETS.length; index += 1) {
    const preset = PRESETS[index];
    await resetToMenu(page, { clearSave: true });
    await applyPreset(page, preset);
    const normalizedSettings = (await diagnostics(page)).save.settings;

    await startTutorialReplay(page);
    const tutorial = await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('TutorialScene');
      scene.player.updateVisuals(16, { x: 1, y: 0 }, { dashing: false, invulnerable: false });
      return {
        state: globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.snapshot().state,
        objectiveAlpha: scene.objectivePanel.alpha,
        objectiveStrokeWidth: scene.objectivePanel.lineWidth,
        markerStrokeWidth: scene.movementMarkers[0].getData('ring').lineWidth,
        dashGateStrokeWidth: scene.dashGateVisual.lineWidth,
        shieldArcLineWidth: scene.shieldArc._lineWidth,
        aimLineVisible: scene.player.renderer.aimLine.visible,
        locatorAlpha: scene.player.renderer.locator.alpha,
        playerOutlineWidth: scene.player.renderer.outer.lineWidth,
        shapeAndTextAlternatives: scene.children.list.filter((item) => typeof item.text === 'string').map((item) => item.text).filter(Boolean),
      };
    });

    await resetToMenu(page);
    await startRunDirect(page, 'standard', 742019);
    const earlyCombat = await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('RunScene');
      scene.player.updateVisuals(16, { x: 1, y: 0 }, { dashing: false, invulnerable: false });
      const elite = globalThis.__ECHOFRAME_PHASE9__.spawnElite('drifter', 'overclocked');
      elite?.activateFromSpawn?.();
      elite?.renderer?.setState?.('ATTACK_ANTICIPATION', 0.5);
      return {
        runPlan: globalThis.__ECHOFRAME_PHASE9__.printRunPlan(),
        collisionRadius: scene.player.bodySprite.body.radius,
        worldBounds: { x: scene.physics.world.bounds.x, y: scene.physics.world.bounds.y, width: scene.physics.world.bounds.width, height: scene.physics.world.bounds.height },
        aimLineVisible: scene.player.renderer.aimLine.visible,
        locatorAlpha: scene.player.renderer.locator.alpha,
        playerOutlineWidth: scene.player.renderer.outer.lineWidth,
        eliteActive: scene.eliteManager.snapshot().active,
        eliteTelegraphWidth: elite?.renderer?.wedge?.lineWidth ?? null,
        damageNumbersEnabled: scene.services.settingsManager.get('visual.damageNumbers'),
        cameraShakeScale: scene.services.settingsManager.get('visual.screenShake'),
      };
    });

    const hazardSegment = earlyCombat.runPlan.segments.findIndex((segment) => segment.arenaDescriptor?.hazardConfigurationId && segment.arenaDescriptor.hazardConfigurationId !== 'none');
    let hazard = { exercised: false, configurationId: 'none', count: 0, warningStrokeWidth: null };
    if (hazardSegment >= 0) {
      const expectedSegmentId = earlyCombat.runPlan.segments[hazardSegment].segmentId;
      await page.evaluate((segmentIndex) => globalThis.__ECHOFRAME_PHASE9__.jumpToSegment(segmentIndex), hazardSegment);
      await waitUntil(page, (segmentId) => globalThis.__ECHOFRAME_PHASE9__?.printCurrentSegment?.().segmentId === segmentId, expectedSegmentId);
      await sleep(100);
      hazard = await page.evaluate(() => {
        const scene = globalThis.__ECHOFRAME__.game.scene.getScene('RunScene');
        const manager = scene.arenaHazardManager;
        if (manager.items[0]) { manager.items[0].remainingMs = 0; manager.update(1); }
        return {
          exercised: manager.items.length > 0,
          configurationId: manager.definition.id,
          count: manager.items.length,
          warningStrokeWidth: manager.items[0]?.visual?.lineWidth ?? null,
        };
      });
    }

    await resetToMenu(page);
    const bossSamples = {};
    await page.evaluate(() => {
      const game = globalThis.__ECHOFRAME__.game;
      const services = game.scene.getScene('MainMenuScene').services;
      const save = services.saveManager.getSnapshot();
      const run = services.gameState.createRun({ seed: 742020, difficultyId: 'standard', unlockedUpgradeIds: save.progression.unlockedUpgradeIds });
      run.currentSegmentIndex = 7;
      run.currentSegmentId = run.runPlan.segments[7].segmentId;
      run.currentSegmentType = run.runPlan.segments[7].segmentType;
      run.upgradeOfferIndex = 7;
      run.bossStarted = true;
      game.scene.stop('MainMenuScene');
      game.scene.start('BossScene', { runId: run.runId });
      game.scene.start('HUDScene', { runId: run.runId });
    });
    await waitForScene(page, 'BossScene');
    await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE8__));
    await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('BossScene');
      scene.introRemainingMs = 1;
      scene.hitInvulnerability.start(600000);
    });
    await waitUntil(page, () => globalThis.__ECHOFRAME_PHASE8__.snapshot().combatStatus === 'BOSS_ACTIVE');
    bossSamples.phase2 = await page.evaluate(() => {
      globalThis.__ECHOFRAME_PHASE9__.forcePhase('IMITATE');
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('BossScene');
      scene.renderer.setOpenPanels(['north']);
      return {
        phase: scene.bossController.phase,
        outerOutlineWidth: scene.renderer.visualOutlineWidths?.outer ?? null,
        coreOutlineWidth: scene.renderer.visualOutlineWidths?.core ?? null,
        panelOutlineWidth: scene.renderer.panels.get('north')?.lineWidth ?? null,
        hostileEchoOutlineWidth: scene.hostileEchoManager.pool.items[0]?.visualOutlineWidth ?? null,
      };
    });
    bossSamples.phase3 = await page.evaluate(() => {
      globalThis.__ECHOFRAME_PHASE9__.forcePhase('DELETE');
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('BossScene');
      scene.sectorManager.activate();
      scene.renderer.setOpenPanels(['north', 'east']);
      return {
        phase: scene.bossController.phase,
        sectorState: scene.sectorManager.state,
        sectorOutlineWidth: scene.sectorManager.lastOutlineWidth,
        panelOutlineWidth: scene.renderer.panels.get('north')?.lineWidth ?? null,
        vulnerabilityTextAlternative: scene.children.list.some((item) => typeof item.text === 'string' && /NULL ARCHITECT|DELETE/i.test(item.text)),
      };
    });
    await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('BossScene');
      scene.destruction.firstVictory = false;
      globalThis.__ECHOFRAME_PHASE8__.forceVictory();
      scene.destruction.skip();
    });
    await waitForScene(page, 'ResultsScene');
    const route = { result: 'victory' };
    const results = await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('ResultsScene');
      return { active: scene.scene.isActive(), buttonCount: scene.buttons.length, focused: scene.buttons.some((button) => button.focused) };
    });

    await resetToMenu(page);
    await page.evaluate(() => {
      const services = globalThis.__ECHOFRAME__.game.scene.getScene('MainMenuScene').services;
      services.saveManager.update((save) => {
        save.progression.unlockedPaletteIds = ['default'];
        save.progression.unlockedTrailIds = ['default'];
        save.progression.loreIds = [];
      }, { immediate: true });
    });
    await activateButton(page, 'MainMenuScene', 3);
    await waitForScene(page, 'ArchiveScene');
    await activateButton(page, 'ArchiveScene', 7);
    await sleep(80);
    await activateButton(page, 'ArchiveScene', 9);
    await sleep(80);
    const archive = await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('ArchiveScene');
      const texts = [
        ...scene.viewObjects.filter((item) => typeof item.text === 'string').map((item) => item.text),
        ...scene.buttons.map((button) => button.labelText?.text ?? ''),
      ];
      return {
        active: scene.scene.isActive(),
        categoryIndex: scene.categoryIndex,
        buttonCount: scene.buttons.length,
        lockTextPresent: texts.some((text) => /LOCKED|UNLOCKED|Locked/i.test(text)),
        disabledLockedControl: scene.buttons.some((button) => !button.enabled && /Locked/i.test(button.labelText?.text ?? '')),
      };
    });

    await resetToMenu(page);
    await activateButton(page, 'MainMenuScene', 4);
    await waitForScene(page, 'StatisticsScene');
    const statistics = await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('StatisticsScene');
      return { active: scene.scene.isActive(), buttonCount: scene.buttons.length, focused: scene.buttons.some((button) => button.focused) };
    });

    await resetToMenu(page);
    await activateButton(page, 'MainMenuScene', 5);
    await waitForScene(page, 'SettingsScene');
    const settingsScene = await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene');
      const focused = scene.buttons.find((button) => button.focused);
      return {
        active: scene.scene.isActive(),
        categoryCount: scene.buttons.length - 1,
        focusedStrokeWidth: focused?.background?.lineWidth ?? null,
        focusedMarkerVisible: focused?.marker?.visible ?? false,
      };
    });
    await page.setViewportSize({ width: 1024, height: 576 });
    await sleep(160);
    const minimumViewport = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const rect = canvas?.getBoundingClientRect();
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene');
      return {
        canvasVisible: Boolean(rect && rect.width > 0 && rect.height > 0),
        canvasWithinViewport: Boolean(rect && rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1),
        focusedControlVisible: scene.buttons.some((button) => button.focused && button.container.visible),
      };
    });
    await page.setViewportSize({ width: 1600, height: 900 });

    const runPlanJson = JSON.stringify(earlyCombat.runPlan);
    const collisionJson = JSON.stringify({ radius: earlyCombat.collisionRadius, bounds: earlyCombat.worldBounds });
    if (referenceRunPlan === null) referenceRunPlan = runPlanJson;
    if (referenceCollision === null) referenceCollision = collisionJson;

    const checks = {
      normalizedSettingsMatch: JSON.stringify(normalizedSettings.visual) === JSON.stringify(preset.visual)
        && JSON.stringify(normalizedSettings.accessibility) === JSON.stringify(preset.accessibility),
      tutorialStateExercised: tutorial.state === 'MOVE_CHECKPOINTS',
      tutorialHudOpacity: Math.abs(tutorial.objectiveAlpha - preset.visual.hudOpacity) < 0.001,
      tutorialHighContrast: tutorial.objectiveStrokeWidth === (preset.visual.highContrast ? 4 : 2),
      tutorialMarkerOutline: tutorial.markerStrokeWidth === (preset.accessibility.largerTelegraphOutlines ? 7 : preset.visual.highContrast ? 5 : 4),
      tutorialGateOutline: tutorial.dashGateStrokeWidth === expectedOutline(preset, 5, 1, 2),
      tutorialShieldOutline: tutorial.shieldArcLineWidth === (preset.accessibility.largerTelegraphOutlines ? 11 : preset.visual.highContrast ? 9 : 8),
      tutorialAimLine: tutorial.aimLineVisible === preset.visual.aimLine,
      tutorialLocator: Math.abs(tutorial.locatorAlpha - (preset.accessibility.persistentPlayerLocator ? 0.9 : 0.5)) < 0.001,
      tutorialPlayerContrast: tutorial.playerOutlineWidth === (preset.visual.highContrast ? 4 : 2),
      tutorialShapeTextAlternatives: tutorial.shapeAndTextAlternatives.some((text) => /PROTECTED FRONT/i.test(text)) && tutorial.shapeAndTextAlternatives.some((text) => /^REAR$/i.test(text)),
      earlyCombatAimLine: earlyCombat.aimLineVisible === preset.visual.aimLine,
      earlyCombatLocator: Math.abs(earlyCombat.locatorAlpha - (preset.accessibility.persistentPlayerLocator ? 0.9 : 0.5)) < 0.001,
      earlyCombatPlayerContrast: earlyCombat.playerOutlineWidth === (preset.visual.highContrast ? 4 : 2),
      damageNumberSettingApplied: earlyCombat.damageNumbersEnabled === preset.visual.damageNumbers,
      shakeSettingApplied: earlyCombat.cameraShakeScale === preset.visual.screenShake,
      eliteExercised: earlyCombat.eliteActive >= 1,
      eliteOutlineApplied: earlyCombat.eliteTelegraphWidth === (preset.accessibility.largerTelegraphOutlines ? 4 : preset.visual.highContrast ? 3 : 2),
      hazardExercised: hazard.exercised && hazard.configurationId !== 'none' && hazard.count > 0,
      hazardOutlineApplied: hazard.warningStrokeWidth === expectedOutline(preset, 3),
      bossPhase2Exercised: bossSamples.phase2?.phase === 'IMITATE',
      hostileEchoOutlineApplied: bossSamples.phase2?.hostileEchoOutlineWidth === expectedOutline(preset, 4),
      bossCoreOutlineApplied: bossSamples.phase2?.coreOutlineWidth === (preset.accessibility.largerTelegraphOutlines ? 9 : preset.visual.highContrast ? 7 : 5),
      bossPanelOutlineApplied: bossSamples.phase2?.panelOutlineWidth === expectedOutline(preset, 5),
      bossPhase3Exercised: bossSamples.phase3?.phase === 'DELETE' && bossSamples.phase3?.sectorState === 'WARNING',
      bossSectorOutlineApplied: bossSamples.phase3?.sectorOutlineWidth === expectedOutline(preset, 6),
      bossShapeTextAlternative: bossSamples.phase3?.vulnerabilityTextAlternative === true,
      resultsExercised: route.result === 'victory' && results.active && results.buttonCount > 0 && results.focused,
      archiveExercised: archive.active && archive.categoryIndex === 7 && archive.buttonCount > 0 && archive.lockTextPresent && archive.disabledLockedControl,
      statisticsExercised: statistics.active && statistics.buttonCount > 0 && statistics.focused,
      settingsExercised: settingsScene.active && settingsScene.categoryCount === 6 && settingsScene.focusedStrokeWidth === 3 && settingsScene.focusedMarkerVisible,
      minimumViewportUsable: minimumViewport.canvasVisible && minimumViewport.canvasWithinViewport && minimumViewport.focusedControlVisible,
      deterministicRunPlanUnchanged: runPlanJson === referenceRunPlan,
      collisionUnchanged: collisionJson === referenceCollision,
    };

    rows.push({ name: preset.name, preset, normalizedSettings: { visual: normalizedSettings.visual, accessibility: normalizedSettings.accessibility }, tutorial, earlyCombat, hazard, boss: bossSamples, results, archive, statistics, settingsScene, minimumViewport, checks, passed: Object.values(checks).every(Boolean) });
  }
} finally {
  await browser.close();
  await server.close();
}

const hardFailures = rows.flatMap((row) => Object.entries(row.checks).filter(([, passed]) => !passed).map(([check]) => ({ preset: row.name, check })));
const report = {
  generatedAt: new Date().toISOString(),
  browser: 'Chromium',
  engineExecutable: process.env.CHROMIUM_EXECUTABLE ?? 'Playwright-managed',
  productionBuild: 'dist-accessibility-validation',
  presets: rows,
  deterministicReference: { runPlanBytes: referenceRunPlan?.length ?? 0, collision: JSON.parse(referenceCollision ?? '{}') },
  browserExceptions: exceptions,
  consoleErrors: errors,
  consoleWarnings: warnings,
  failedRequests,
  hardFailures,
  passed: hardFailures.length === 0 && exceptions.length === 0 && errors.length === 0 && failedRequests.length === 0,
};
await writeJson('PHASE10_ACCESSIBILITY_BROWSER_VALIDATION.json', report);
console.log(JSON.stringify({ passed: report.passed, presets: rows.map((row) => ({ name: row.name, passed: row.passed })), hardFailures, exceptions: exceptions.length, consoleErrors: errors.length, warnings: warnings.length, failedRequests: failedRequests.length }, null, 2));
if (!report.passed) process.exitCode = 1;
