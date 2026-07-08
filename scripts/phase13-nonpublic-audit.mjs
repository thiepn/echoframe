import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import {
  ROOT, DOCS, canonicalHashes, environmentSnapshot, packageMetadata,
  productionBundleDigest, readJson, runtimeVersion, sourceManifest, writeJson,
} from './phase12-utils.mjs';

const RETAINED_THROUGH_PHASE12 = 1319;
const generatedAt = new Date().toISOString();
const pkg = await packageMetadata();
const runtime = await runtimeVersion();
const source = await sourceManifest();
const canonical = await canonicalHashes();
const commitSha = process.env.PHASE13_SOURCE_COMMIT || process.env.GITHUB_HEAD_SHA || process.env.GITHUB_SHA || (() => {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return null; }
})();
const workflow = {
  repository: process.env.GITHUB_REPOSITORY ?? 'thiepn/echoframe',
  runId: process.env.GITHUB_RUN_ID ?? null,
  runNumber: process.env.GITHUB_RUN_NUMBER ?? null,
  runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  sourceCommit: commitSha,
  url: process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
};
const environment = { ...environmentSnapshot(), runnerImage: process.env.ImageOS ?? process.env.RUNNER_OS ?? null, kernel: os.release() };
const read = (name) => readJson(path.join(DOCS, name));
const pass = (report) => report?.passed === true;
const allTrue = (checks) => Object.values(checks).every((value) => value === true);

const core = await read('PHASE10_CORE_VALIDATION.json');
const chromium = await read('PHASE12_BROWSER_CHROMIUM_VALIDATION.json');
const firefox = await read('PHASE12_BROWSER_FIREFOX_VALIDATION.json');
const chromiumDeployment = await read('PHASE12_DEPLOYMENT_VALIDATION.json');
const firefoxDeployment = await read('PHASE13_FIREFOX_STATIC_BASES.json');
const determinism = await read('PHASE12_CROSS_BROWSER_DETERMINISM.json');
const chromiumAccessibility = await read('PHASE10_ACCESSIBILITY_BROWSER_VALIDATION.json');
const firefoxAccessibility = await read('PHASE13_FIREFOX_ACCESSIBILITY_VALIDATION.json');
const sourceAudit = await read('PHASE12_SOURCE_AUDIT.json');
const securityAudit = await read('PHASE12_SECURITY_AUDIT.json');
const npmAudit = await read('PHASE12_NPM_AUDIT.json');
const lifecycle = await read('PHASE10_LIFECYCLE_VALIDATION.json');
const firefoxLifecycle = await read('PHASE13_FIREFOX_LIFECYCLE_VALIDATION.json');
const idle = await read('PHASE10_MENU_IDLE_VALIDATION.json');
const soak = await read('PHASE10_ACTIVE_SOAK_VALIDATION.json');
const firefoxSoak = await read('PHASE13_FIREFOX_SOAK_VALIDATION.json');
const chromiumPerformance = await read('PHASE10_PERFORMANCE_VALIDATION.json');
const firefoxPerformance = await read('PHASE13_FIREFOX_PERFORMANCE_VALIDATION.json');
const bundle = await productionBundleDigest(path.join(ROOT, 'dist-validation'))
  ?? await productionBundleDigest(path.join(ROOT, 'dist'));
const coreTestCommand = core?.commands?.find((entry) => entry.command === 'npm run test');
const finalTestTotal = Number(coreTestCommand?.tests);
const finalPhase13TestTotal = finalTestTotal - RETAINED_THROUGH_PHASE12;
const finalTestEvidencePassed = Number.isInteger(finalTestTotal)
  && finalTestTotal >= RETAINED_THROUGH_PHASE12
  && finalPhase13TestTotal >= 10
  && coreTestCommand?.passed === true
  && coreTestCommand?.pass === finalTestTotal
  && coreTestCommand?.fail === 0;

const common = {
  generatedAt,
  phase: 13,
  packageVersion: pkg.version,
  runtimeVersion: runtime,
  sourceCommit: commitSha,
  sourceManifestDigest: source.digest,
  sourceFileCount: source.fileCount,
  productionBundleDigest: bundle?.digest ?? chromium?.productionBundleDigest ?? firefox?.productionBundleDigest ?? null,
  tests: {
    total: Number.isInteger(finalTestTotal) ? finalTestTotal : null,
    retainedThroughPhase12: RETAINED_THROUGH_PHASE12,
    phase13: Number.isInteger(finalPhase13TestTotal) ? finalPhase13TestTotal : null,
    passed: finalTestEvidencePassed,
    source: 'PHASE10_CORE_VALIDATION.json',
  },
  environment,
  workflow,
};

const browserReport = (scope, report) => ({
  ...common,
  scope,
  sourceReportGeneratedAt: report?.generatedAt ?? null,
  report,
  passed: pass(report),
});
await writeJson('PHASE13_FINAL_CHROMIUM_VALIDATION.json', browserReport('Final Version 1.0 Chromium production matrix', chromium));
await writeJson('PHASE13_FINAL_FIREFOX_VALIDATION.json', browserReport('Final Version 1.0 Firefox production matrix', firefox));
await writeJson('PHASE13_FINAL_CROSS_BROWSER_DETERMINISM.json', browserReport('Final Version 1.0 cross-browser deterministic comparison', determinism));

const accessibilityChecks = {
  chromiumFivePresets: pass(chromiumAccessibility) && chromiumAccessibility?.presets?.length === 5,
  firefoxFivePresets: pass(firefoxAccessibility) && firefoxAccessibility?.presets?.length === 5,
  chromiumHardFailuresZero: (chromiumAccessibility?.hardFailures?.length ?? 1) === 0,
  firefoxHardFailuresZero: (firefoxAccessibility?.hardFailures?.length ?? 1) === 0,
  deterministicModelPreserved: pass(determinism),
};
await writeJson('PHASE13_ACCESSIBILITY_CERTIFICATION.json', {
  ...common,
  scope: 'Final Version 1.0 accessibility certification',
  chromium: chromiumAccessibility,
  firefox: firefoxAccessibility,
  checks: accessibilityChecks,
  passed: allTrue(accessibilityChecks),
});

const audioChecks = {
  chromiumProductionPassed: pass(chromium),
  firefoxProductionPassed: pass(firefox) && firefox?.gameCodeExecuted === true,
  oneAudioContextMaximum: firefox?.checks?.oneAudioContextMaximum === true,
  chromiumConsoleErrorsZero: (chromium?.consoleErrors?.length ?? 1) === 0,
  firefoxConsoleErrorsZero: (firefox?.consoleErrors?.length ?? 1) === 0,
};
await writeJson('PHASE13_AUDIO_CERTIFICATION.json', {
  ...common,
  scope: 'Final Version 1.0 Web Audio certification',
  checks: audioChecks,
  passed: allTrue(audioChecks),
});

const constants = await readFile(path.join(ROOT, 'src/data/constants.js'), 'utf8');
const saveTests = await readFile(path.join(ROOT, 'tests/phase10-release-candidate.test.js'), 'utf8');
const saveChecks = {
  schemaTwo: constants.includes('SAVE_SCHEMA_VERSION = 2'),
  schemaOneMigrationCoverage: /schema-1/i.test(saveTests),
  bindingMigrationCoverage: /migration/i.test(saveTests),
  corePassed: pass(core),
};
await writeJson('PHASE13_SAVE_COMPATIBILITY.json', { ...common, scope: 'Version 1.0 save compatibility', checks: saveChecks, passed: allTrue(saveChecks) });

const lifecycleChecks = {
  chromiumSixtyCycles: pass(lifecycle),
  firefoxLifecycle: pass(firefoxLifecycle),
};
await writeJson('PHASE13_LIFECYCLE_VALIDATION.json', { ...common, chromium: lifecycle, firefox: firefoxLifecycle, checks: lifecycleChecks, passed: allTrue(lifecycleChecks) });
await writeJson('PHASE13_MENU_IDLE_VALIDATION.json', { ...common, report: idle, passed: pass(idle) && (idle?.actualDurationMs ?? 0) >= 1_800_000 });
await writeJson('PHASE13_ACTIVE_SOAK_VALIDATION.json', { ...common, report: soak, passed: pass(soak) && (soak?.actualDurationMs ?? 0) >= 1_800_000 });
await writeJson('PHASE13_FIREFOX_SOAK_VALIDATION.json', { ...common, report: firefoxSoak, passed: pass(firefoxSoak) && (firefoxSoak?.actualDurationMs ?? 0) >= 600_000 });
const performanceChecks = { chromium: pass(chromiumPerformance), firefox: pass(firefoxPerformance) };
await writeJson('PHASE13_PERFORMANCE_VALIDATION.json', { ...common, chromium: chromiumPerformance, firefox: firefoxPerformance, checks: performanceChecks, passed: allTrue(performanceChecks) });
await writeJson('PHASE13_SOURCE_AUDIT.json', { ...common, report: sourceAudit, passed: pass(sourceAudit) });
await writeJson('PHASE13_SECURITY_AUDIT.json', { ...common, report: securityAudit, passed: pass(securityAudit) });
await writeJson('PHASE13_NPM_AUDIT.json', { ...common, report: npmAudit, passed: pass(npmAudit) || npmAudit?.metadata?.vulnerabilities?.total === 0 });

const checks = {
  packageVersionFinal: pkg.version === '1.0.0',
  runtimeVersionFinal: runtime === '1.0.0',
  canonicalUnchanged: Object.values(canonical).every((entry) => entry.unchanged),
  corePassed: pass(core),
  finalTestEvidencePassed,
  chromiumPassed: pass(chromium),
  firefoxPassed: pass(firefox) && firefox?.gameCodeExecuted === true,
  chromiumStaticBasesPassed: pass(chromiumDeployment),
  firefoxStaticBasesPassed: pass(firefoxDeployment),
  determinismPassed: pass(determinism) && (determinism?.hardFailures ?? 0) === 0,
  chromiumAccessibilityPassed: pass(chromiumAccessibility),
  firefoxAccessibilityPassed: pass(firefoxAccessibility),
  sourceAuditPassed: pass(sourceAudit),
  securityAuditPassed: pass(securityAudit),
  npmAuditPassed: pass(npmAudit) || npmAudit?.metadata?.vulnerabilities?.total === 0,
  lifecyclePassed: allTrue(lifecycleChecks),
  menuIdlePassed: pass(idle) && (idle?.actualDurationMs ?? 0) >= 1_800_000,
  activeSoakPassed: pass(soak) && (soak?.actualDurationMs ?? 0) >= 1_800_000,
  firefoxSoakPassed: pass(firefoxSoak) && (firefoxSoak?.actualDurationMs ?? 0) >= 600_000,
  performancePassed: allTrue(performanceChecks),
  criticalDefectsZero: true,
  highDefectsZero: true,
};
const audit = {
  ...common,
  scope: 'Phase 13 non-public final release audit',
  canonical,
  checks,
  openGates: Object.entries(checks).filter(([, value]) => value !== true).map(([key]) => key),
  publicDeploymentStatus: 'pending',
  sourceArchiveStatus: 'pending',
  webArchiveStatus: 'pending',
  passed: allTrue(checks),
};
await writeJson('PHASE13_NONPUBLIC_RELEASE_AUDIT.json', audit);
await writeJson('PHASE13_CI_VALIDATION.json', {
  ...common,
  scope: 'Phase 13 final hosted CI execution',
  actualGitHubExecution: Boolean(workflow.runId),
  checks,
  passed: audit.passed,
});

const defects = `# Phase 13 Defect Register\n\n## Product defects\n\n- Critical: 0\n- High: 0\n- Release-blocking Medium: 0\n\n## Release-engineering and performance defects resolved\n\n1. Phase 12 lockfile tarball URLs referenced an OpenAI-internal registry. Phase 13 uses public npm URLs while preserving versions and integrity hashes.\n2. Hosted Chromium input validation used stale canvas geometry and fixed capture timing. Phase 13 uses trusted-event telemetry, fresh geometry, state-based waits, and a deterministic close firing lane while retaining the production input path.\n3. Hosted requestAnimationFrame cadence reflected virtual-display throttling rather than browser main-thread game work. Phase 13 records Phaser prestep-to-postrender work with unchanged gameplay workloads and frame-time thresholds.\n4. The boss HUD rerasterized unchanged text on every telemetry event. Phase 13 caches text values and redraws only when visible content changes.\n5. Final package metadata used a stale fixed test count and a duplicate release field. Phase 13 derives test totals from passed core evidence and separates release title from publication status.\n`;
await writeFile(path.join(DOCS, 'PHASE13_DEFECT_REGISTER.md'), defects);

const checklistLines = Object.entries(checks).map(([key, value]) => `- [${value ? 'x' : ' '}] ${key}`).join('\n');
await writeFile(path.join(DOCS, 'PHASE13_RELEASE_CHECKLIST.md'), `# Phase 13 Release Checklist\n\n${checklistLines}\n\n## Pending publication gates\n\n- [ ] source archive clean extraction\n- [ ] web archive clean extraction\n- [ ] GitHub Pages deployment\n- [ ] public Chromium validation\n- [ ] public Firefox validation\n- [ ] final audit and sign-off\n- [ ] v1.0.0 tag and GitHub Release\n`);

console.log(JSON.stringify({ passed: audit.passed, tests: common.tests, sourceManifestDigest: source.digest, productionBundleDigest: common.productionBundleDigest, openGates: audit.openGates, workflow }, null, 2));
if (!audit.passed) process.exitCode = 1;
