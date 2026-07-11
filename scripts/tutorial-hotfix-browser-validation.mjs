import path from 'node:path';
import {
  ROOT,
  activateButton,
  diagnostics,
  launchBrowser,
  resetToMenu,
  sleep,
  startStaticServer,
  waitForGame,
  waitForScene,
  waitUntil,
  writeJson,
} from './phase10-browser-helpers.mjs';

const dist = path.join(ROOT, 'dist-validation');
const server = await startStaticServer({ directory: dist, base: '/' });
const runtime = await launchBrowser({ engine: 'chromium', viewport: { width: 1600, height: 900 } });
const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
const checks = {};
const observations = {};

async function clickDesignPoint(x, y) {
  const canvas = page.locator('canvas').first();
  await canvas.waitFor({ state: 'visible' });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounding box');
  const gameSize = await page.evaluate(() => ({
    width: globalThis.__ECHOFRAME__.game.scale.gameSize.width,
    height: globalThis.__ECHOFRAME__.game.scale.gameSize.height,
  }));
  await page.mouse.click(
    box.x + (x * box.width) / gameSize.width,
    box.y + (y * box.height) / gameSize.height,
  );
}

try {
  await page.goto(`${server.url}?debug=1`, { waitUntil: 'networkidle' });
  await waitForGame(page);
  await waitForScene(page, 'MainMenuScene');

  await resetToMenu(page, { clearSave: true });
  await activateButton(page, 'MainMenuScene', 0);
  await waitForScene(page, 'TutorialScene');
  await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('DEPLOY_ECHO'));
  const prepared = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.prepareLockedEcho());
  await page.keyboard.press('Space');
  await waitUntil(page, () => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__?.snapshot().state === 'ENTER_SIGNAL_GATE');
  const afterDeploy = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.snapshot());
  checks.firstDeployAdvances = prepared.locked === true
    && afterDeploy.state === 'ENTER_SIGNAL_GATE'
    && afterDeploy.recordingLockState === 'deployed'
    && afterDeploy.pathCheckpointIndex === 4
    && afterDeploy.hasLockedReplay === false;

  await page.keyboard.press('Space');
  await sleep(220);
  const afterSecondSpace = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.snapshot());
  checks.secondDeployCannotRewind = afterSecondSpace.state === 'ENTER_SIGNAL_GATE'
    && afterSecondSpace.pathCheckpointIndex === 4
    && afterSecondSpace.hasLockedReplay === false;
  observations.deployment = { prepared, afterDeploy, afterSecondSpace };

  await resetToMenu(page, { clearSave: true });
  await activateButton(page, 'MainMenuScene', 0);
  await waitForScene(page, 'TutorialScene');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'PauseScene');
  await clickDesignPoint(800, 484);
  await sleep(120);
  await clickDesignPoint(640, 550);
  await waitForScene(page, 'MainMenuScene');
  const afterPointerExit = await diagnostics(page);
  checks.pauseExitPointerClickable = afterPointerExit.save.meta.tutorialCompleted === false
    && afterPointerExit.runActive === false;

  await activateButton(page, 'MainMenuScene', 0);
  await waitForScene(page, 'TutorialScene');
  await clickDesignPoint(1372, 72);
  await waitForScene(page, 'MainMenuScene');
  const afterDirectExit = await diagnostics(page);
  checks.directExitPointerClickable = afterDirectExit.save.meta.tutorialCompleted === false
    && afterDirectExit.runActive === false;

  await activateButton(page, 'MainMenuScene', 0);
  await waitForScene(page, 'TutorialScene');
  await clickDesignPoint(1510, 72);
  await waitForScene(page, 'RunScene', 30000);
  const afterSkip = await diagnostics(page);
  checks.skipPointerStartsRun = afterSkip.save.meta.tutorialCompleted === true
    && afterSkip.runActive === true
    && afterSkip.save.statistics.aggregateCounters.runsStarted === 1;
  observations.navigation = {
    pointerExitTutorialCompleted: afterPointerExit.save.meta.tutorialCompleted,
    directExitTutorialCompleted: afterDirectExit.save.meta.tutorialCompleted,
    skipTutorialCompleted: afterSkip.save.meta.tutorialCompleted,
    skipRunActive: afterSkip.runActive,
  };

  checks.zeroExceptions = exceptions.length === 0;
  checks.zeroConsoleErrors = errors.length === 0;
  checks.zeroFailedRequests = failedRequests.length === 0;
  checks.warningsExplained = warnings.every((item) => /AudioContext|WebGL|GPU/i.test(item.text));
} finally {
  await browser.close();
  await server.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  scope: 'Tutorial progression, pointer exit, and skip hotfix',
  checks,
  observations,
  exceptions,
  consoleErrors: errors,
  consoleWarnings: warnings,
  failedRequests,
  passed: Object.values(checks).every(Boolean),
};
await writeJson('TUTORIAL_HOTFIX_BROWSER_VALIDATION.json', report);
console.log(JSON.stringify({ passed: report.passed, checks }, null, 2));
if (!report.passed) process.exitCode = 1;
