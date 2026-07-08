import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { ROOT, DOCS, EXPECTED_CANONICAL, canonicalHashes, packageMetadata, readJson, sourceManifest, writeJson } from './phase11-utils.mjs';
const pkg = await packageMetadata(); const source = await sourceManifest();
const runtimeVersion = (await readFile(path.join(ROOT, 'src/utils/version.js'), 'utf8')).match(/BUILD_VERSION\s*=\s*'([^']+)'/)?.[1] ?? null;
const reports = {
  recovery: 'PHASE11_RECOVERY_REPORT.json', chromium: 'PHASE11_BROWSER_CHROMIUM_VALIDATION.json', firefox: 'PHASE11_BROWSER_FIREFOX_VALIDATION.json',
  deployment: 'PHASE11_DEPLOYMENT_VALIDATION.json', determinism: 'PHASE11_CROSS_BROWSER_DETERMINISM.json', accessibility: 'PHASE11_ACCESSIBILITY_CERTIFICATION.json',
  audio: 'PHASE11_AUDIO_CERTIFICATION.json', ci: 'PHASE11_CI_VALIDATION.json', publicDeployment: 'PHASE11_PUBLIC_DEPLOYMENT_VALIDATION.json',
  lifecycle: 'PHASE11_LIFECYCLE_VALIDATION.json', idle: 'PHASE11_MENU_IDLE_VALIDATION.json', soak: 'PHASE11_ACTIVE_SOAK_VALIDATION.json',
  performance: 'PHASE11_PERFORMANCE_VALIDATION.json', source: 'PHASE11_SOURCE_AUDIT.json', security: 'PHASE11_SECURITY_AUDIT.json', npm: 'PHASE11_NPM_AUDIT.json',
};
const evidence = {};
for (const [key, filename] of Object.entries(reports)) evidence[key] = await readJson(path.join(DOCS, filename));
const canonical = await canonicalHashes();
const checks = {
  packageVersionFinal: pkg.version === '1.0.0',
  runtimeVersionFinal: runtimeVersion === '1.0.0',
  canonicalDocumentsUnchanged: Object.values(canonical).every((entry) => entry.unchanged),
  recoveryPassed: evidence.recovery?.passed === true,
  chromiumPassed: evidence.chromium?.passed === true,
  firefoxGameCodeExecuted: evidence.firefox?.gameCodeExecuted === true,
  firefoxPassed: evidence.firefox?.passed === true,
  deploymentPassed: evidence.deployment?.passed === true,
  crossBrowserDeterminismPassed: evidence.determinism?.passed === true,
  accessibilityPassed: evidence.accessibility?.passed === true,
  audioPassed: evidence.audio?.passed === true,
  ciExecutedAndPassed: evidence.ci?.passed === true,
  publicDeploymentPassed: evidence.publicDeployment?.passed === true,
  lifecyclePassed: evidence.lifecycle?.passed === true,
  menuIdlePassed: evidence.idle?.passed === true,
  activeSoakPassed: evidence.soak?.passed === true,
  performancePassed: evidence.performance?.passed === true,
  sourceAuditPassed: evidence.source?.passed === true,
  securityAuditPassed: evidence.security?.passed === true,
  npmAuditPassed: evidence.npm?.passed === true,
};
const openGates = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = {
  generatedAt: new Date().toISOString(), phase: 11, release: pkg.version,
  packageVersion: pkg.version, runtimeVersion, sourceManifestDigest: source.digest,
  canonical, evidenceFiles: reports, checks, openGates,
  criticalDefects: 0, highDefects: 0, releaseBlockingMediumDefects: openGates.length > 0 ? 1 : 0,
  passed: openGates.length === 0,
  releaseReady: openGates.length === 0,
  verdict: openGates.length === 0 ? 'version-1.0-final-certified' : 'release-candidate-signoff-withheld',
  note: openGates.length === 0 ? 'All Phase 11 final-release gates passed.' : 'Promotion and final sign-off are withheld. Open gates are preserved without reclassification.',
};
await writeJson('PHASE11_FINAL_RELEASE_AUDIT.json', report);
const signoff = {
  generatedAt: report.generatedAt, phase: 11, packageVersion: pkg.version, runtimeVersion,
  sourceManifestDigest: source.digest, passed: report.passed, verdict: report.verdict, openGates,
  signedOffAsVersion1: report.passed && pkg.version === '1.0.0', publicLaunchConfirmed: report.passed && evidence.publicDeployment?.passed === true,
};
await writeJson('PHASE11_RELEASE_SIGNOFF.json', signoff);
console.log(JSON.stringify({ passed: report.passed, verdict: report.verdict, openGates }, null, 2));
if (!report.passed) process.exitCode = 1;
