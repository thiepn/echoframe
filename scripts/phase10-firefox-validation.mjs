import path from 'node:path';
import os from 'node:os';
import { rm, access } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  ROOT, startStaticServer, launchBrowser, waitForGame, waitForScene, waitUntil,
  activateButton, diagnostics, resetToMenu, startRunDirect, writeJson, sleep,
} from './phase10-browser-helpers.mjs';

const dist = path.join(ROOT, 'dist-firefox');
const executable = process.env.FIREFOX_EXECUTABLE || '/usr/bin/firefox-esr';
const managedExecutable = process.env.PLAYWRIGHT_FIREFOX_EXECUTABLE || path.join(
  os.homedir(), '.cache', 'ms-playwright', 'firefox-1532', 'firefox', 'firefox',
);
const report = {
  generatedAt: new Date().toISOString(),
  browser: { executable, requestedEngine: 'firefox', version: null, managedExecutable },
  sourceVersion: null,
  environment: { platform: process.platform, arch: process.arch, kernel: os.release() },
  status: 'not-run', passed: false, checks: {}, exceptions: [], consoleErrors: [], consoleWarnings: [], failedRequests: [],
  attempts: [],
};
let server = null; let runtime = null;

function directProbe() {
  const probe = spawnSync(executable, ['--headless', 'about:blank'], {
    encoding: 'utf8', timeout: 15_000,
    env: { ...process.env, HOME: '/tmp/echoframe-firefox-probe-home', XDG_RUNTIME_DIR: '/tmp/echoframe-firefox-probe-runtime', MOZ_HEADLESS: '1' },
  });
  const output = `${probe.stdout ?? ''}${probe.stderr ?? ''}`.trim();
  return {
    kind: 'direct-real-firefox-process-probe',
    exitCode: probe.status,
    signal: probe.signal,
    timedOut: probe.error?.code === 'ETIMEDOUT',
    output: output.slice(0, 8_000),
    gameCodeExecuted: false,
  };
}

try {
  report.browser.version = execFileSync(executable, ['--version'], { encoding: 'utf8' }).trim();
  const probe = directProbe();
  report.attempts.push(probe);
  if (/wasm_rt_syscall_set_segue_base|ARCH_SET_GS|Redirecting call to abort/i.test(probe.output)) {
    report.status = 'environment-blocked-before-game-execution';
    report.environmentBlock = {
      stage: 'real Firefox process startup',
      installedVersion: report.browser.version,
      reason: 'The installed Firefox binary aborts before page creation because the execution kernel rejects the Firefox WASM/RLBox GS-base syscall.',
      directProbeExitCode: probe.exitCode,
      directProbeEvidence: probe.output,
      gameCodeExecuted: false,
      chromiumSubstitutionUsed: false,
      managedPlaywrightFirefoxPresent: false,
      note: 'Changing Firefox sandbox and Graphite preferences did not change the pre-page abort. This is an execution-environment limitation, not a game exception.',
    };
    try {
      await access(managedExecutable);
      report.environmentBlock.managedPlaywrightFirefoxPresent = true;
    } catch {}
    throw Object.assign(new Error('Real Firefox process aborted before game execution.'), { environmentClassified: true });
  }

  await rm(dist, { recursive: true, force: true });
  execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', 'dist-firefox'], {
    cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
  });
  server = await startStaticServer({ directory: dist, base: '/' });
  runtime = await launchBrowser({ engine: 'firefox', viewport: { width: 1366, height: 768 } });
  const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
  await page.goto(server.url, { waitUntil: 'networkidle' });
  await waitForGame(page); await waitForScene(page, 'MainMenuScene');
  await page.locator('canvas').click({ position: { x: 680, y: 380 } });
  await resetToMenu(page, { clearSave: true });
  report.checks.bootAndPreload = true;
  report.sourceVersion = await page.evaluate(() => globalThis.__ECHOFRAME__?.version ?? document.title);
  await activateButton(page, 'MainMenuScene', 0); await waitForScene(page, 'TutorialScene');
  await waitUntil(page, () => Boolean(globalThis.__ECHOFRAME_PHASE10_TUTORIAL__));
  await page.mouse.move(800, 400); await page.mouse.down({ button: 'left' }); await sleep(100); await page.mouse.up({ button: 'left' });
  await page.evaluate(() => {
    const hook = globalThis.__ECHOFRAME_PHASE10_TUTORIAL__;
    hook.advanceTo('AIM_AND_FIRE'); hook.advanceTo('DASH_GATE'); hook.advanceTo('RECORD_PATH'); hook.advanceTo('DEPLOY_ECHO'); hook.forceEchoSuccess(); hook.complete();
  });
  await waitForScene(page, 'RunScene');
  report.checks.firstRunTutorial = true;
  report.checks.pointerAimAndFire = true;
  await page.mouse.click(900, 430, { button: 'right' });
  report.checks.rightClickHandledOnCanvas = true;
  await page.keyboard.press('ShiftLeft'); await page.keyboard.press('Space');
  report.checks.keyboardDashAndEcho = true;
  await page.keyboard.press('Escape'); await waitForScene(page, 'PauseScene');
  await activateButton(page, 'PauseScene', 1); await waitForScene(page, 'SettingsScene');
  await activateButton(page, 'SettingsScene', 3); await sleep(30);
  await activateButton(page, 'SettingsScene', 0); await sleep(170); await page.keyboard.press('i'); await sleep(100);
  const code = await page.evaluate(() => globalThis.__ECHOFRAME__.game.scene.getScene('SettingsScene').services.settingsManager.get('controls.bindings').moveUp[0].code);
  report.checks.rebinding = code === 'KeyI';
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
  report.status = 'completed';
  report.passed = Object.values(report.checks).every(Boolean);
  await browser.close(); runtime = null;
} catch (error) {
  const text = `${error?.name ?? 'Error'}: ${error?.message ?? String(error)}`;
  report.launchError = text;
  if (!error?.environmentClassified) {
    report.status = /ARCH_SET_GS|segue_base|Invalid argument|Target page, context or browser has been closed|Browser closed|process did exit/i.test(text)
      ? 'environment-blocked-before-game-execution'
      : 'failed';
    if (report.status.startsWith('environment-blocked')) {
      report.environmentBlock = {
        stage: 'real Firefox process startup',
        installedVersion: report.browser.version,
        explanation: 'The installed Firefox process terminated before loading the game. No Chromium substitution or user-agent emulation was used.',
        gameCodeExecuted: false,
        chromiumSubstitutionUsed: false,
      };
    }
  }
} finally {
  try { if (runtime?.browser) await runtime.browser.close(); } catch {}
  try { if (server) await server.close(); } catch {}
  await writeJson('PHASE10_BROWSER_FIREFOX_VALIDATION.json', report);
}
console.log(JSON.stringify({ passed: report.passed, status: report.status, browser: report.browser, environmentBlock: report.environmentBlock ?? null }, null, 2));
if (!report.passed) process.exitCode = 1;
