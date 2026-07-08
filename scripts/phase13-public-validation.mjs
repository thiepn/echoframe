import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { ROOT, SCREENSHOTS, writeJson } from './phase12-utils.mjs';
import { launchBrowser, waitForGame, waitForScene, activateButton, sleep } from './phase10-browser-helpers.mjs';

const publicUrl = process.env.PHASE13_PUBLIC_URL;
if (!publicUrl) throw new Error('PHASE13_PUBLIC_URL is required.');
const parsed = new URL(publicUrl);
if (parsed.protocol !== 'https:') throw new Error(`Public URL must use HTTPS: ${publicUrl}`);
await mkdir(SCREENSHOTS, { recursive: true });

const expectedSourceDigest = process.env.PHASE13_SOURCE_DIGEST || null;
const expectedCommit = process.env.PHASE13_SOURCE_COMMIT || process.env.GITHUB_SHA || null;
const expectedBundleDigest = process.env.PHASE13_DEPLOYED_BUNDLE_DIGEST || null;

async function validateEngine(engine) {
  const runtime = await launchBrowser({ engine, viewport: { width: 1366, height: 768 } });
  const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
  const checks = {};
  const observations = {};
  const requestUrls = [];
  page.on('request', (request) => requestUrls.push(request.url()));
  const suffix = engine === 'firefox' ? 'firefox' : 'chromium';
  try {
    let response = await page.goto(publicUrl, { waitUntil: 'networkidle' });
    checks.initialHttp200 = response?.status() === 200;
    await waitForGame(page);
    await waitForScene(page, 'MainMenuScene');
    checks.title = await page.title() === 'ECHOFRAME: LAST SIGNAL';
    checks.oneCanvas = await page.locator('canvas').count() === 1;
    let snapshot = await page.evaluate(() => globalThis.__ECHOFRAME__?.getReleaseSnapshot?.());
    checks.versionFinal = snapshot?.version === '1.0.0';
    checks.productionMode = snapshot?.mode === 'production';
    checks.debugInert = await page.evaluate(() => !globalThis.__ECHOFRAME_PHASE10_TUTORIAL__);
    await page.screenshot({ path: path.join(SCREENSHOTS, `ECHOFRAME_v1_public_deployment_${suffix}.png`), fullPage: true });
    if (engine === 'chromium') await page.screenshot({ path: path.join(SCREENSHOTS, 'ECHOFRAME_v1_main_menu_chromium.png'), fullPage: true });
    if (engine === 'firefox') await page.screenshot({ path: path.join(SCREENSHOTS, 'ECHOFRAME_v1_main_menu_firefox.png'), fullPage: true });

    response = await page.reload({ waitUntil: 'networkidle' });
    checks.hardRefresh = response?.status() === 200;
    await waitForGame(page);
    await waitForScene(page, 'MainMenuScene');

    const manifestResponse = await page.request.get(new URL('manifest.webmanifest', publicUrl).href);
    const faviconResponse = await page.request.get(new URL('favicon.svg', publicUrl).href);
    checks.manifest200 = manifestResponse.ok();
    checks.manifestMime = /manifest|json/i.test(manifestResponse.headers()['content-type'] ?? '');
    checks.favicon200 = faviconResponse.ok();
    checks.faviconMime = /svg|image/i.test(faviconResponse.headers()['content-type'] ?? '');

    const markerResponse = await page.request.get(new URL('phase13-release.json', publicUrl).href);
    checks.releaseMarker200 = markerResponse.ok();
    const marker = markerResponse.ok() ? await markerResponse.json() : null;
    observations.releaseMarker = marker;
    checks.markerVersion = marker?.version === '1.0.0';
    checks.markerSourceDigest = !expectedSourceDigest || marker?.sourceManifestDigest === expectedSourceDigest;
    checks.markerCommit = !expectedCommit || marker?.sourceCommit === expectedCommit;
    checks.markerBundleDigest = !expectedBundleDigest || marker?.productionBundleDigest === expectedBundleDigest;

    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await waitForGame(page);
    await waitForScene(page, 'MainMenuScene');
    const fresh = await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('MainMenuScene');
      return scene.services.saveManager.getSnapshot();
    });
    checks.freshSave = fresh.meta.tutorialCompleted === false && fresh.statistics.aggregateCounters.runsStarted === 0;
    await activateButton(page, 'MainMenuScene', 0);
    await waitForScene(page, 'TutorialScene');
    checks.freshTutorialLoads = true;
    if (engine === 'firefox') await page.screenshot({ path: path.join(SCREENSHOTS, 'ECHOFRAME_v1_tutorial_firefox.png'), fullPage: true });

    await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('TutorialScene');
      scene.services.settingsManager.set('visual.highContrast', true, { immediate: true });
      scene.services.settingsManager.set('controls.bindings.moveUp.0', { device: 'keyboard', code: 'KeyI' }, { immediate: true });
    });
    await page.reload({ waitUntil: 'networkidle' });
    await waitForGame(page);
    await waitForScene(page, 'MainMenuScene');
    const persisted = await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('MainMenuScene');
      const save = scene.services.saveManager.getSnapshot();
      return { highContrast: save.settings.visual.highContrast, moveUp: save.settings.controls.bindings.moveUp[0] };
    });
    checks.settingsPersist = persisted.highContrast === true;
    checks.bindingsPersist = persisted.moveUp?.device === 'keyboard' && persisted.moveUp?.code === 'KeyI';

    await activateButton(page, 'MainMenuScene', 5);
    await waitForScene(page, 'SettingsScene');
    await activateButton(page, 'SettingsScene', 3);
    await sleep(150);
    if (engine === 'firefox') await page.screenshot({ path: path.join(SCREENSHOTS, 'ECHOFRAME_v1_controls_firefox.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await waitForScene(page, 'MainMenuScene');

    await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('MainMenuScene');
      scene.services.saveManager.update((draft) => { draft.meta.tutorialCompleted = true; }, { immediate: true });
    });
    await page.reload({ waitUntil: 'networkidle' });
    await waitForGame(page);
    await waitForScene(page, 'MainMenuScene');
    await activateButton(page, 'MainMenuScene', 0);
    await waitForScene(page, 'RunScene');
    checks.combatEntry = true;
    if (engine === 'firefox') await page.screenshot({ path: path.join(SCREENSHOTS, 'ECHOFRAME_v1_combat_firefox.png'), fullPage: true });

    for (const [sceneKey, buttonIndex, key] of [['ArchiveScene', 3, 'archive'], ['StatisticsScene', 4, 'statistics'], ['CreditsScene', 6, 'credits']]) {
      await page.reload({ waitUntil: 'networkidle' });
      await waitForGame(page);
      await waitForScene(page, 'MainMenuScene');
      await activateButton(page, 'MainMenuScene', buttonIndex);
      await waitForScene(page, sceneKey);
      checks[`${key}Loads`] = true;
      if (key === 'credits' && engine === 'chromium') await page.screenshot({ path: path.join(SCREENSHOTS, 'ECHOFRAME_v1_credits.png'), fullPage: true });
    }

    const unexpected = requestUrls.filter((url) => {
      const protocol = new URL(url).protocol;
      if (['data:', 'blob:'].includes(protocol)) return false;
      return new URL(url).origin !== parsed.origin;
    });
    const mixedContent = requestUrls.filter((url) => parsed.protocol === 'https:' && new URL(url).protocol === 'http:');
    observations.requestCount = requestUrls.length;
    observations.unexpectedRequests = [...new Set(unexpected)];
    observations.mixedContentRequests = [...new Set(mixedContent)];
    checks.noUnexpectedNetwork = unexpected.length === 0;
    checks.noAnalyticsOrTelemetry = unexpected.length === 0;
    checks.noMixedContent = mixedContent.length === 0;
    checks.noSourceRequests = !requestUrls.some((url) => /\/src\//.test(url));
    checks.noLocalhost = !requestUrls.some((url) => /localhost|127\.0\.0\.1/.test(url));
    checks.noExceptions = exceptions.length === 0;
    checks.noConsoleErrors = errors.length === 0;
    checks.noFailedRequests = failedRequests.length === 0;
    return {
      engine,
      browserVersion: await browser.version(),
      checks,
      observations,
      exceptions,
      consoleErrors: errors,
      consoleWarnings: warnings,
      failedRequests,
      passed: Object.values(checks).every(Boolean),
    };
  } finally {
    await browser.close();
  }
}

const chromium = await validateEngine('chromium');
const firefox = await validateEngine('firefox');
const report = {
  generatedAt: new Date().toISOString(),
  phase: 13,
  scope: 'Public GitHub Pages validation',
  url: publicUrl,
  sourceCommit: expectedCommit,
  sourceManifestDigest: expectedSourceDigest,
  productionBundleDigest: expectedBundleDigest,
  chromium,
  firefox,
  passed: chromium.passed && firefox.passed,
};
await writeJson('PHASE13_PUBLIC_DEPLOYMENT_VALIDATION.json', report);
console.log(JSON.stringify({ passed: report.passed, url: publicUrl, chromium: chromium.passed, firefox: firefox.passed }, null, 2));
if (!report.passed) process.exitCode = 1;
