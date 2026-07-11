import path from 'node:path';
import { cp, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { ROOT, DOCS, SCREENSHOTS, fileExists, packageMetadata, productionBundleDigest, readJson, sourceManifest, writeJson } from './phase11-utils.mjs';

const env = { ...process.env };
if (!env.CHROMIUM_EXECUTABLE && await fileExists('/usr/bin/chromium')) env.CHROMIUM_EXECUTABLE = '/usr/bin/chromium';
let phase10CommandError = null;
try {
  execFileSync('npm', ['run', 'validate:browser:phase10'], { cwd: ROOT, env, stdio: 'inherit' });
} catch (error) { phase10CommandError = error.message; }
let hotfixCommandError = null;
try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/tutorial-hotfix-browser-validation.mjs')], { cwd: ROOT, env, stdio: 'inherit' });
} catch (error) { hotfixCommandError = error.message; }

const phase10 = await readJson(path.join(DOCS, 'PHASE10_BROWSER_CHROMIUM_VALIDATION.json'));
const hotfix = await readJson(path.join(DOCS, 'TUTORIAL_HOTFIX_BROWSER_VALIDATION.json'));
const source = await sourceManifest();
const bundle = await productionBundleDigest(path.join(ROOT, 'dist-validation'));
const pkg = await packageMetadata();
const runtimeSource = await readFile(path.join(ROOT, 'src/utils/version.js'), 'utf8');
const runtimeVersion = runtimeSource.match(/BUILD_VERSION\s*=\s*'([^']+)'/)?.[1] ?? null;

const failedLegacyChecks = Object.entries(phase10?.checks ?? {})
  .filter(([, passed]) => !passed)
  .map(([name]) => name);
const replacesStaleDeploymentExpectation = phase10CommandError != null
  && failedLegacyChecks.length === 1
  && failedLegacyChecks[0] === 'productionEchoDeployed'
  && hotfixCommandError == null
  && hotfix?.passed === true;
const checks = {
  ...(phase10?.checks ?? {}),
  tutorialFirstDeployAdvances: hotfix?.checks?.firstDeployAdvances === true,
  tutorialSecondDeployCannotRewind: hotfix?.checks?.secondDeployCannotRewind === true,
  tutorialPauseExitPointerClickable: hotfix?.checks?.pauseExitPointerClickable === true,
  tutorialDirectExitPointerClickable: hotfix?.checks?.directExitPointerClickable === true,
  tutorialSkipPointerStartsRun: hotfix?.checks?.skipPointerStartsRun === true,
};
if (replacesStaleDeploymentExpectation) {
  checks.productionEchoDeployed = hotfix.checks.firstDeployAdvances;
}
const commandError = replacesStaleDeploymentExpectation
  ? null
  : phase10CommandError ?? hotfixCommandError;

const screenshotCopies = [
  ['ECHOFRAME_phase10_main_menu.png', 'ECHOFRAME_phase11_rc_main_menu_chromium.png'],
  ['ECHOFRAME_phase10_results.png', 'ECHOFRAME_phase11_rc_results_chromium.png'],
  ['ECHOFRAME_phase10_accessibility.png', 'ECHOFRAME_phase11_rc_accessibility_chromium.png'],
  ['ECHOFRAME_phase10_credits.png', 'ECHOFRAME_phase11_rc_credits_chromium.png'],
];
const copiedScreenshots = [];
for (const [from, to] of screenshotCopies) {
  try { await cp(path.join(SCREENSHOTS, from), path.join(SCREENSHOTS, to)); copiedScreenshots.push(to); } catch {}
}
const report = {
  generatedAt: new Date().toISOString(), phase: 11, scope: 'Chromium release-candidate revalidation',
  packageVersion: pkg.version, runtimeVersion, sourceManifestDigest: source.digest,
  productionBundleDigest: bundle?.digest ?? null,
  browser: { engine: 'chromium', executable: env.CHROMIUM_EXECUTABLE ?? 'playwright-managed', version: phase10?.browser?.version ?? null },
  environment: phase10?.environment ?? { platform: process.platform, arch: process.arch },
  basedOnFreshExecution: commandError == null,
  phase10HarnessReport: 'PHASE10_BROWSER_CHROMIUM_VALIDATION.json',
  tutorialHotfixHarnessReport: 'TUTORIAL_HOTFIX_BROWSER_VALIDATION.json',
  replacedStaleDeploymentExpectation: replacesStaleDeploymentExpectation,
  checks,
  observations: { ...(phase10?.observations ?? {}), tutorialHotfix: hotfix?.observations ?? {} },
  exceptions: [...(phase10?.exceptions ?? []), ...(hotfix?.exceptions ?? [])],
  consoleErrors: [...(phase10?.consoleErrors ?? []), ...(hotfix?.consoleErrors ?? [])],
  consoleWarnings: [...(phase10?.consoleWarnings ?? []), ...(hotfix?.consoleWarnings ?? [])],
  failedRequests: [...(phase10?.failedRequests ?? []), ...(hotfix?.failedRequests ?? [])],
  screenshots: copiedScreenshots,
  commandError,
  passed: commandError == null && Object.values(checks).every(Boolean),
};
await writeJson('PHASE11_BROWSER_CHROMIUM_VALIDATION.json', report);
console.log(JSON.stringify({ passed: report.passed, sourceManifestDigest: report.sourceManifestDigest, productionBundleDigest: report.productionBundleDigest, replacedStaleDeploymentExpectation: report.replacedStaleDeploymentExpectation, checks: report.checks }, null, 2));
if (!report.passed) process.exitCode = 1;
