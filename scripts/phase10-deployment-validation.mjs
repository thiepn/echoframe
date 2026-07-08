import path from 'node:path';
import { rm, readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import {
  ROOT, startStaticServer, launchBrowser, waitForGame, waitForScene, activateButton,
  diagnostics, resetToMenu, writeJson,
} from './phase10-browser-helpers.mjs';

async function walk(directory) {
  const out = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full)); else out.push(full);
  }
  return out;
}

async function validateBase(base, name) {
  const outDirName = `dist-deployment-${name}`; const outDir = path.join(ROOT, outDirName);
  await rm(outDir, { recursive: true, force: true });
  execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'production', '--outDir', outDirName], {
    cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: base },
  });
  const files = await walk(outDir); const totalBytes = (await Promise.all(files.map((f) => stat(f)))).reduce((sum, x) => sum + x.size, 0);
  const textFiles = files.filter((f) => /\.(?:html|js|css|json|webmanifest)$/i.test(f));
  const contents = (await Promise.all(textFiles.map((f) => readFile(f, 'utf8')))).join('\n');
  const server = await startStaticServer({ directory: outDir, base });
  const runtime = await launchBrowser({ engine: 'chromium', viewport: { width: 1366, height: 768 } });
  const { browser, page, errors, warnings, exceptions, failedRequests } = runtime;
  const checks = {};
  try {
    let response = await page.goto(`${server.url}?debug=1`, { waitUntil: 'networkidle' });
    checks.directLoad = response?.status() === 200;
    await waitForGame(page); await waitForScene(page, 'MainMenuScene');
    checks.productionMode = (await page.evaluate(() => globalThis.__ECHOFRAME__.getReleaseSnapshot().mode)) === 'production';
    checks.debugInert = await page.evaluate(() => !('triggerFatal' in globalThis.__ECHOFRAME__) && !globalThis.__ECHOFRAME__.getDebugSnapshot().enabled);
    checks.correctBase = (await page.evaluate(() => globalThis.__ECHOFRAME__.getReleaseSnapshot().deploymentBase)) === base;
    await resetToMenu(page, { clearSave: true });
    await activateButton(page, 'MainMenuScene', 0); await waitForScene(page, 'TutorialScene'); checks.tutorialEntry = true;
    await page.evaluate(() => {
      const scene = globalThis.__ECHOFRAME__.game.scene.getScene('TutorialScene'); const services = scene.services;
      services.saveManager.update((draft) => { draft.meta.tutorialCompleted = true; }, { immediate: true });
    });
    await resetToMenu(page); await activateButton(page, 'MainMenuScene', 0); await waitForScene(page, 'RunScene'); checks.gameplayEntry = true;
    await page.reload({ waitUntil: 'networkidle' }); await waitForGame(page); checks.hardRefresh = true;
    const persisted = await diagnostics(page); checks.savePersists = persisted.save.meta.tutorialCompleted === true;
    const manifestResponse = await page.request.get(new URL('manifest.webmanifest', server.url).href);
    const faviconResponse = await page.request.get(new URL('favicon.svg', server.url).href);
    checks.manifest = manifestResponse.status() === 200 && /manifest\+json|application\/json/.test(manifestResponse.headers()['content-type'] ?? '');
    checks.favicon = faviconResponse.status() === 200 && /image\/svg/.test(faviconResponse.headers()['content-type'] ?? '');
    checks.noSourceRequests = !server.requests.some((r) => r.pathname.includes('/src/'));
    checks.noAbsoluteRootBreakage = !server.requests.some((r) => r.status >= 400);
    checks.noLocalhostReferences = !/localhost|127\.0\.0\.1/.test(contents);
    checks.caseSensitiveAssets = server.requests.filter((r) => /assets\//.test(r.pathname)).every((r) => r.status === 200);
    checks.zeroExceptions = exceptions.length === 0; checks.zeroConsoleErrors = errors.length === 0;
    checks.zeroFailedRequests = failedRequests.length === 0;
  } finally { await browser.close(); await server.close(); }
  return {
    base, outDir: outDirName, fileCount: files.length, totalBytes, checks, requests: server.requests,
    exceptions, consoleErrors: errors, consoleWarnings: warnings, failedRequests,
    passed: Object.values(checks).every(Boolean),
  };
}

const roots = [await validateBase('/', 'root'), await validateBase('/echoframe-test/', 'subpath')];
const report = { generatedAt: new Date().toISOString(), roots, passed: roots.every((entry) => entry.passed) };
await writeJson('PHASE10_DEPLOYMENT_VALIDATION.json', report);
console.log(JSON.stringify({ passed: report.passed, bases: roots.map((entry) => ({ base: entry.base, passed: entry.passed, checks: entry.checks })) }, null, 2));
if (!report.passed) process.exitCode = 1;
