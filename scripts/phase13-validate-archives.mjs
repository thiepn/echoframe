import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { ROOT, DOCS, EXPECTED_CANONICAL, productionBundleDigest, readJson, sourceManifest, writeJson } from './phase12-utils.mjs';
import { startStaticServer, launchBrowser, waitForGame, waitForScene } from './phase10-browser-helpers.mjs';

const RELEASE = path.join(ROOT, 'release');
const sourceZip = path.join(RELEASE, 'ECHOFRAME_v1.0.0_final_source.zip');
const webZip = path.join(RELEASE, 'ECHOFRAME_v1.0.0_web.zip');
const manifest = await readJson(path.join(RELEASE, 'ECHOFRAME_v1.0.0_RELEASE_MANIFEST.json'));
if (!manifest) throw new Error('Release manifest is missing.');
const work = path.join(ROOT, '.phase13-archive-validation');
const sourceDir = path.join(work, 'source');
const webDir = path.join(work, 'web');
const exists = async (filename) => { try { await access(filename); return true; } catch { return false; } };
const sha256 = async (filename) => createHash('sha256').update(await readFile(filename)).digest('hex');
const archiveEntries = (filename) => execFileSync('unzip', ['-Z1', filename], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);

const sourceEntries = archiveEntries(sourceZip);
const forbiddenEntryPattern = /^(?:\.git(?:\/|$)|node_modules(?:\/|$)|dist(?:\/|$)|dist-[^/]*(?:\/|$)|\.phase[^/]*(?:\/|$)|playwright-report(?:\/|$)|test-results(?:\/|$)|release(?:\/|$)|candidate(?:\/|$))/;
const forbiddenSourceEntries = sourceEntries.filter((entry) => forbiddenEntryPattern.test(entry));
const phase13EvidenceEntries = sourceEntries.filter((entry) => /^docs\/PHASE13_/i.test(entry));

await rm(work, { recursive: true, force: true });
await mkdir(sourceDir, { recursive: true });
await mkdir(webDir, { recursive: true });
execFileSync('unzip', ['-q', sourceZip, '-d', sourceDir], { stdio: 'inherit' });
execFileSync('unzip', ['-q', webZip, '-d', webDir], { stdio: 'inherit' });

const forbidden = ['node_modules', 'dist', '.git', 'release', 'candidate', 'playwright-report', 'test-results'];
const sourceChecks = {
  rootPackage: await exists(path.join(sourceDir, 'package.json')),
  rootSource: await exists(path.join(sourceDir, 'src', 'main.js')),
  rootCanonical: await exists(path.join(sourceDir, 'docs', 'GAME_DESIGN.md')),
  forbiddenAbsent: (await Promise.all(forbidden.map((name) => exists(path.join(sourceDir, name))))).every((value) => !value),
  noForbiddenArchiveEntries: forbiddenSourceEntries.length === 0,
  generatedPhase13EvidenceExcluded: phase13EvidenceEntries.length === 0
    && !(await exists(path.join(sourceDir, 'docs', 'PHASE13_PACKAGE_BUILD.json')))
    && !(await exists(path.join(sourceDir, 'docs', 'PHASE13_FINAL_RELEASE_AUDIT.json'))),
  packageFinal: JSON.parse(await readFile(path.join(sourceDir, 'package.json'), 'utf8')).version === '1.0.0',
};
for (const [name, expected] of Object.entries(EXPECTED_CANONICAL)) {
  sourceChecks[`canonical:${name}`] = await sha256(path.join(sourceDir, 'docs', name)) === expected;
}

execFileSync('npm', ['ci', '--no-audit', '--no-fund', '--prefer-offline'], {
  cwd: sourceDir,
  stdio: 'inherit',
  env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' },
});
execFileSync('npm', ['run', 'lint'], { cwd: sourceDir, stdio: 'inherit' });
execFileSync('npm', ['run', 'test'], { cwd: sourceDir, stdio: 'inherit' });
execFileSync('npm', ['run', 'build'], { cwd: sourceDir, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/echoframe/' } });
sourceChecks.installLintTestsBuild = true;

const allowedWebRoots = new Set(['index.html', 'manifest.webmanifest', 'favicon.svg', 'icon.svg', 'assets', 'phase13-release.json']);
const webRoots = await readdir(webDir);
const releaseMarker = await readJson(path.join(webDir, 'phase13-release.json'));
const extractedBundle = await productionBundleDigest(webDir, { exclude: ['phase13-release.json'] });
const currentSource = await sourceManifest();
const webChecks = {
  index: await exists(path.join(webDir, 'index.html')),
  manifest: await exists(path.join(webDir, 'manifest.webmanifest')),
  favicon: await exists(path.join(webDir, 'favicon.svg')),
  assets: await exists(path.join(webDir, 'assets')),
  releaseIdentityMarker: Boolean(releaseMarker),
  markerVersionFinal: releaseMarker?.version === '1.0.0',
  markerSourceCommit: releaseMarker?.sourceCommit === manifest.sourceCommit,
  markerSourceDigest: releaseMarker?.sourceManifestDigest === currentSource.digest
    && releaseMarker?.sourceManifestDigest === manifest.sourceManifestDigest,
  markerBundleDigest: releaseMarker?.productionBundleDigest === extractedBundle?.digest
    && releaseMarker?.productionBundleDigest === manifest.productionBundleDigest,
  markerFileCount: releaseMarker?.productionFileCount === extractedBundle?.fileCount,
  digestDefinitionExcludesMarker: extractedBundle?.excluded?.includes('phase13-release.json') === true,
  noSource: !(await exists(path.join(webDir, 'src'))) && !(await exists(path.join(webDir, 'tests')),
  onlyStaticRoots: webRoots.every((name) => allowedWebRoots.has(name)),
};

async function smoke(directory, engine, label, base = '/echoframe/') {
  const server = await startStaticServer({ directory, base });
  const runtime = await launchBrowser({ engine, viewport: { width: 1366, height: 768 } });
  const result = { engine, label, base, checks: {}, exceptions: [], consoleErrors: [], failedRequests: [], passed: false };
  try {
    const response = await runtime.page.goto(server.url, { waitUntil: 'networkidle' });
    result.checks.http200 = response?.status() === 200;
    await waitForGame(runtime.page);
    await waitForScene(runtime.page, 'MainMenuScene');
    result.checks.title = await runtime.page.title() === 'ECHOFRAME: LAST SIGNAL';
    result.checks.oneCanvas = await runtime.page.locator('canvas').count() === 1;
    const snapshot = await runtime.page.evaluate(() => globalThis.__ECHOFRAME__?.getReleaseSnapshot?.());
    result.checks.version = snapshot?.version === '1.0.0';
    result.checks.productionMode = snapshot?.mode === 'production';
    result.exceptions = runtime.exceptions;
    result.consoleErrors = runtime.errors;
    result.failedRequests = runtime.failedRequests;
    result.checks.noExceptions = runtime.exceptions.length === 0;
    result.checks.noConsoleErrors = runtime.errors.length === 0;
    result.checks.noFailedRequests = runtime.failedRequests.length === 0;
    result.passed = Object.values(result.checks).every(Boolean);
  } finally {
    await runtime.browser.close();
    await server.close();
  }
  return result;
}

const sourceChromium = await smoke(path.join(sourceDir, 'dist'), 'chromium', 'source archive rebuilt output');
const sourceFirefox = await smoke(path.join(sourceDir, 'dist'), 'firefox', 'source archive rebuilt output');
const webChromium = await smoke(webDir, 'chromium', 'web archive extraction');
const webFirefox = await smoke(webDir, 'firefox', 'web archive extraction');

const sourceReport = {
  generatedAt: new Date().toISOString(),
  archive: path.basename(sourceZip),
  archiveSha256: await sha256(sourceZip),
  archiveBytes: (await stat(sourceZip)).size,
  expectedSha256: manifest.archives?.source?.sha256,
  forbiddenSourceEntries,
  phase13EvidenceEntries,
  checks: sourceChecks,
  browserSmoke: { chromium: sourceChromium, firefox: sourceFirefox },
  passed: Object.values(sourceChecks).every(Boolean) && sourceChromium.passed && sourceFirefox.passed
    && await sha256(sourceZip) === manifest.archives?.source?.sha256,
};
const webReport = {
  generatedAt: new Date().toISOString(),
  archive: path.basename(webZip),
  archiveSha256: await sha256(webZip),
  archiveBytes: (await stat(webZip)).size,
  expectedSha256: manifest.archives?.web?.sha256,
  releaseMarker,
  extractedBundleDigest: extractedBundle?.digest ?? null,
  checks: webChecks,
  browserSmoke: { chromium: webChromium, firefox: webFirefox },
  passed: Object.values(webChecks).every(Boolean) && webChromium.passed && webFirefox.passed
    && await sha256(webZip) === manifest.archives?.web?.sha256,
};
await writeJson('PHASE13_SOURCE_ARCHIVE_VALIDATION.json', sourceReport);
await writeJson('PHASE13_WEB_ARCHIVE_VALIDATION.json', webReport);
console.log(JSON.stringify({ source: { passed: sourceReport.passed, sha256: sourceReport.archiveSha256, forbiddenSourceEntries }, web: { passed: webReport.passed, sha256: webReport.archiveSha256, bundleDigest: extractedBundle?.digest } }, null, 2));
if (!sourceReport.passed || !webReport.passed) process.exitCode = 1;
