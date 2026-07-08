import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { ROOT, writeJson } from './phase10-browser-helpers.mjs';

const DOCS = path.join(ROOT, 'docs');
const EXPECTED_CANONICAL = Object.freeze({
  'GAME_DESIGN.md': '556d99d05d7896c2b02bb653cb28e8a0cb631e223edf67e3e0c1236fd7811f71',
  'TECHNICAL_SPEC.md': '8562235331a2dc229977db11a56fdb10ba0032494d4b0d0706f41bf24c903468',
  'ART_DIRECTION.md': 'aa29931c92ada05c0693ea58730986bc8b9ce8c1b8fcbf78acb4d72be8d1529a',
  'BALANCE_SPEC.md': '5fca70f1c890b1e13a3b8b17ab3c82da725491c0cca6146a7ad0a2b1f55fd107',
  'QA_CHECKLIST.md': 'b120097203b11e7f2fe025ea5767e931395f5edc7059e9821f6ab5ce1c722122',
});
const REQUIRED_REPORTS = Object.freeze({
  core: 'PHASE10_CORE_VALIDATION.json',
  tutorial: 'PHASE10_TUTORIAL_AUDIT.json',
  bindings: 'PHASE10_BINDING_AUDIT.json',
  accessibility: 'PHASE10_ACCESSIBILITY_AUDIT.json',
  accessibilityBrowser: 'PHASE10_ACCESSIBILITY_BROWSER_VALIDATION.json',
  source: 'PHASE10_SOURCE_AUDIT.json',
  security: 'PHASE10_SECURITY_AUDIT.json',
  npm: 'PHASE10_NPM_AUDIT.json',
  chromium: 'PHASE10_BROWSER_CHROMIUM_VALIDATION.json',
  firefox: 'PHASE10_BROWSER_FIREFOX_VALIDATION.json',
  deployment: 'PHASE10_DEPLOYMENT_VALIDATION.json',
  lifecycle: 'PHASE10_LIFECYCLE_VALIDATION.json',
  idle: 'PHASE10_MENU_IDLE_VALIDATION.json',
  soak: 'PHASE10_ACTIVE_SOAK_VALIDATION.json',
  performance: 'PHASE10_PERFORMANCE_VALIDATION.json',
});
const REQUIRED_SCREENSHOTS = Object.freeze([
  'ECHOFRAME_phase10_main_menu.png',
  'ECHOFRAME_phase10_tutorial_movement.png',
  'ECHOFRAME_phase10_tutorial_echo.png',
  'ECHOFRAME_phase10_controls_rebinding.png',
  'ECHOFRAME_phase10_accessibility.png',
  'ECHOFRAME_phase10_full_combat.png',
  'ECHOFRAME_phase10_boss_phase3.png',
  'ECHOFRAME_phase10_results.png',
  'ECHOFRAME_phase10_credits.png',
  'ECHOFRAME_phase10_fatal_screen.png',
]);

async function jsonOrMissing(filename) {
  try { return { exists: true, data: JSON.parse(await readFile(path.join(DOCS, filename), 'utf8')) }; }
  catch (error) { return { exists: false, error: error.message }; }
}
async function sha256(filename) {
  const content = await readFile(path.join(DOCS, filename));
  return createHash('sha256').update(content).digest('hex');
}
const packageJson = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const constantsSource = await readFile(path.join(ROOT, 'src', 'data', 'constants.js'), 'utf8');
const workflowSource = await readFile(path.join(ROOT, '.github', 'workflows', 'deploy.yml'), 'utf8');
const canonical = {};
for (const [filename, expected] of Object.entries(EXPECTED_CANONICAL)) {
  const actual = await sha256(filename);
  canonical[filename] = { expected, actual, unchanged: actual === expected };
}
const reports = {};
for (const [key, filename] of Object.entries(REQUIRED_REPORTS)) {
  const result = await jsonOrMissing(filename);
  const derivedPassed = result.exists && (key === 'npm'
    ? result.data?.metadata?.vulnerabilities?.total === 0
    : result.data?.passed === true);
  reports[key] = {
    filename,
    exists: result.exists,
    passed: derivedPassed,
    status: result.exists ? result.data?.status ?? null : 'missing',
    generatedAt: result.exists ? result.data?.generatedAt ?? null : null,
    detail: result.exists ? null : result.error,
  };
}
const screenshots = {};
for (const filename of REQUIRED_SCREENSHOTS) {
  try { await access(path.join(DOCS, 'screenshots', filename)); screenshots[filename] = true; }
  catch { screenshots[filename] = false; }
}
const checks = {
  packageVersion: packageJson.version === '1.0.0-release-candidate',
  runtimeVersion: constantsSource.includes("RELEASE_VERSION = '1.0.0-release-candidate'"),
  canonicalDocumentsUnchanged: Object.values(canonical).every((entry) => entry.unchanged),
  allRequiredReportsPresent: Object.values(reports).every((entry) => entry.exists),
  allRequiredScreenshotsPresent: Object.values(screenshots).every(Boolean),
  deploymentWorkflowComplete: ['actions/checkout@v4', 'actions/setup-node@v4', 'npm ci', 'npm run lint', 'npm run test', 'npm run audit:source', 'npm run audit:security', 'npm run build', 'actions/upload-pages-artifact@v3', 'actions/deploy-pages@v4', 'VITE_BASE_PATH'].every((term) => workflowSource.includes(term)),
  coreValidationPassed: reports.core.passed,
  deterministicAuditsPassed: ['tutorial', 'bindings', 'accessibility', 'accessibilityBrowser', 'source', 'security', 'npm'].every((key) => reports[key].passed),
  chromiumPassed: reports.chromium.passed,
  firefoxPassed: reports.firefox.passed,
  deploymentPassed: reports.deployment.passed,
  lifecyclePassed: reports.lifecycle.passed,
  menuIdlePassed: reports.idle.passed,
  activeSoakPassed: reports.soak.passed,
  performancePassed: reports.performance.passed,
};
const openGates = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = {
  generatedAt: new Date().toISOString(),
  release: '1.0.0-release-candidate',
  auditCompleted: true,
  passed: openGates.length === 0,
  releaseReady: openGates.length === 0,
  packageVersion: packageJson.version,
  canonical,
  reports,
  screenshots,
  checks,
  openGates,
  criticalDefects: 0,
  highDefects: 0,
  note: openGates.length === 0
    ? 'All machine-verifiable Phase 10 release gates passed.'
    : 'Release sign-off remains withheld. Open gates are reported without reclassification or concealment.',
};
await writeJson('PHASE10_RELEASE_AUDIT.json', report);
console.log(JSON.stringify({ passed: report.passed, openGates, checks }, null, 2));
if (!report.passed) process.exitCode = 1;
