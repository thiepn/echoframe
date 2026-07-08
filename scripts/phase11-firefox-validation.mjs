import path from 'node:path';
import os from 'node:os';
import { access, readFile, rm } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  ROOT, DOCS, fileExists, packageMetadata, productionBundleDigest, sourceManifest, writeJson,
} from './phase11-utils.mjs';
import {
  startStaticServer, launchBrowser, waitForGame, waitForScene, waitUntil,
  activateButton, diagnostics, resetToMenu, startRunDirect, sleep,
} from './phase10-browser-helpers.mjs';

const candidates = [
  process.env.FIREFOX_EXECUTABLE,
  '/usr/bin/firefox-esr', '/usr/bin/firefox',
  path.join(os.homedir(), '.cache/ms-playwright/firefox-1532/firefox/firefox'),
  path.join(os.homedir(), '.cache/ms-playwright/firefox-1495/firefox/firefox'),
].filter(Boolean);
let executable = null;
for (const candidate of candidates) { if (await fileExists(candidate)) { executable = candidate; break; } }
const pkg = await packageMetadata();
const runtimeSource = await readFile(path.join(ROOT, 'src/utils/version.js'), 'utf8');
const runtimeVersion = runtimeSource.match(/BUILD_VERSION\s*=\s*'([^']+)'/)?.[1] ?? null;
const source = await sourceManifest();
const dist = path.join(ROOT, 'dist-phase11-firefox');
const report = {
  generatedAt: new Date().toISOString(), phase: 11, scope: 'Real Firefox/Gecko production validation',
  packageVersion: pkg.version, runtimeVersion, sourceManifestDigest: source.digest, productionBundleDigest: null,
  browser: { requestedEngine: 'firefox', executable, version: null, playwrightVersion: null },
  environment: { platform: process.platform, arch: process.arch, kernel: os.release(), osType: os.type() },
  gameCodeExecuted: false, chromiumSubstitutionUsed: false, userAgentEmulationUsed: false,
  attempts: [], checks: {}, exceptions: [], consoleErrors: [], consoleWarnings: [], failedRequests: [],
  status: 'not-run', passed: false,
};
let server = null; let runtime = null;
try {
  report.browser.playwrightVersion = execFileSync(process.execPath, [path.join(ROOT, 'node_modules/playwright/cli.js'), '--version'], { encoding: 'utf8' }).trim();
  if (!executable) {
    report.status = 'environment-blocked-no-firefox-executable';
    report.environmentBlock = {
      stage: 'browser discovery',
      reason: 'No real Firefox executable is installed. Playwright browser download and apt package retrieval were attempted but DNS resolution is unavailable in this runner.',
      gameCodeExecuted: false,
      acceptableNextEnvironment: 'Supported system Firefox, Playwright-managed Firefox, or GitHub Actions Ubuntu runner.',
    };
    throw Object.assign(new Error('No Firefox executable is available.'), { environmentClassified: true });
  }
  report.browser.version = execFileSync(executable, ['--version'], { encoding: 'utf8', env: { ...process.env, MOZ_HEADLESS: '1' } }).trim();
  const probeHome = '/tmp/echoframe-phase11-firefox-home';
  const probeRuntime = '/tmp/echoframe-phase11-firefox-runtime';
  const probe = spawnSync(executable, ['--headless', 'about:blank'], {
    encoding: 'utf8', timeout: 15_000,
    env: { ...process.env, HOME: probeHome, XDG_RUNTIME_DIR: probeRuntime, MOZ_HEADLESS: '1' },
  });
  const probeOutput = `${probe.stdout ?? ''}${probe.stderr ?? ''}`.trim();
  report.attempts.push({ kind: 'direct-real-firefox-process-probe', exitCode: probe.status, signal: probe.signal, timedOut: probe.error?.code === 'ETIMEDOUT', output: probeOutput.slice(0, 8_000) });
  if (/wasm_rt_syscall_set_segue_base|ARCH_SET_GS|Redirecting call to abort/i.test(probeOutput)) {
    report.status = 'environment-blocked-before-game-execution';
    report.environmentBlock = {
      stage: 'real Firefox process startup', reason: 'Firefox aborted before page creation because this Linux 4.4 execution kernel rejected the Firefox WASM/RLBox GS-base syscall.',
      installedVersion: report.browser.version, gameCodeExecuted: false, directProbeExitCode: probe.status, directProbeEvidence: probeOutput,
    };
    throw Object.assign(new Error('Real Firefox process aborted before game execution.'), { environmentClassified: true });
  }

  await rm(dist, { recursive: true, force: true });
  execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'validation', '--outDir', 'dist-phase11-firefox'], {
    cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
  });
  const bundle = await productionBundleDigest(dist); report.productionBundleDigest = bundle?.digest ?? null;
  server = await startStaticServer({ directory: dist, base: '/' });
  process.env.FIREFOX_EXECUTABLE = executable;
  runtime = await launchBrowser({ engine: 'firefox', viewport: { width: 1366, height: 768 } });
  const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
  const response = await page.goto(`${server.url}?debug=1`, { waitUntil: 'networkidle' });
  report.gameCodeExecuted = true;
  report.checks.http200 = response?.status() === 200;
  await waitForGame(page); await waitForScene(page, 'MainMenuScene');
  report.checks.bootAndPreload = true;
  report.checks.releaseMode = (await page.evaluate(() => globalThis.__ECHOFRAME__?.getReleaseSnapshot?.().mode)) === 'validation';
  await page.locator('canvas').click({ position: { x: 680, y: 380 } });
  await resetToMenu(page, { clearSave: true });
  const before = await diagnostics(page);
  report.checks.freshSave = before.save.meta.tutorialCompleted === false && before.save.statistics.aggregateCounters.runsStarted === 0;
  await activateButton(page, 'MainMenuScene', 0); await waitForScene(page, 'TutorialScene');
  await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE10_TUTORIAL__));
  await page.mouse.move(800, 400); await page.mouse.down({ button: 'left' }); await sleep(100); await page.mouse.up({ button: 'left' });
  report.checks.pointerAimAndFire = true;
  await page.evaluate(() => {
    const hook = globalThis.__ECHOFRAME_PHASE10_TUTORIAL__;
    hook.advanceTo('AIM_AND_FIRE'); hook.advanceTo('DASH_GATE'); hook.advanceTo('RECORD_PATH'); hook.advanceTo('DEPLOY_ECHO'); hook.forceEchoSuccess(); hook.complete();
  });
  await waitForScene(page, 'RunScene');
  const afterTutorial = await diagnostics(page);
  report.checks.firstRunTutorial = afterTutorial.save.meta.tutorialCompleted === true;
  report.checks.tutorialExcludedFromScore = afterTutorial.save.statistics.aggregateCounters.totalScore === 0;
  await page.mouse.click(900, 430, { button: 'right' });
  await page.keyboard.press('ShiftLeft'); await page.keyboard.press('Space');
  report.checks.pointerAndKeyboardGameplay = true;
  await page.keyboard.press('Escape'); await waitForScene(page, 'PauseScene');
  await activateButton(page, 'PauseScene', 1); await waitForScene(page, 'SettingsScene');
  await activateButton(page, 'SettingsScene', 3); await sleep(30);
  await activateButton(page, 'SettingsScene', 0); await sleep(170); await page.keyboard.press('i'); await sleep(100);
  const code = await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').services.settingsManager.get('controls.bindings').moveUp[0].code);
  report.checks.rebinding = code === 'KeyI';
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  report.checks.visibilityEventHandled = true;
  await resetToMenu(page);
  await startRunDirect(page, 'standard', 99110);
  report.checks.controlledCombatSegment = true;
  await resetToMenu(page);
  for (const [key, index] of [['ArchiveScene', 3], ['StatisticsScene', 4], ['CreditsScene', 6]]) {
    await activateButton(page, 'MainMenuScene', index); await waitForScene(page, key); await page.keyboard.press('Escape'); await waitForScene(page, 'MainMenuScene');
  }
  report.checks.archiveStatisticsCredits = true;
  const end = await diagnostics(page);
  report.checks.oneAudioContextMaximum = end.audio.contextCount <= 1;
  report.exceptions = exceptions; report.consoleErrors = errors; report.consoleWarnings = warnings; report.failedRequests = failedRequests;
  report.checks.noExceptions = exceptions.length === 0;
  report.checks.noConsoleErrors = errors.length === 0;
  report.checks.noFailedRequests = failedRequests.length === 0;
  report.status = 'completed'; report.passed = Object.values(report.checks).every(Boolean);
  await browser.close(); runtime = null;
} catch (error) {
  report.launchError = `${error?.name ?? 'Error'}: ${error?.message ?? String(error)}`;
  if (!error?.environmentClassified) report.status = report.gameCodeExecuted ? 'failed-after-game-execution' : 'environment-blocked-before-game-execution';
} finally {
  try { if (runtime?.browser) await runtime.browser.close(); } catch {}
  try { if (server) await server.close(); } catch {}
  await writeJson('PHASE11_BROWSER_FIREFOX_VALIDATION.json', report);
}
console.log(JSON.stringify({ passed: report.passed, status: report.status, gameCodeExecuted: report.gameCodeExecuted, browser: report.browser, environmentBlock: report.environmentBlock ?? null }, null, 2));
if (!report.passed) process.exitCode = 1;
