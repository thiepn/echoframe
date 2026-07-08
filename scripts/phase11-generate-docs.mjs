import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { ROOT, DOCS, packageMetadata, readJson, sourceManifest } from './phase11-utils.mjs';
const pkg = await packageMetadata(); const source = await sourceManifest();
const recovery = await readJson(path.join(DOCS, 'PHASE11_RECOVERY_REPORT.json'));
const chromium = await readJson(path.join(DOCS, 'PHASE11_BROWSER_CHROMIUM_VALIDATION.json'));
const firefox = await readJson(path.join(DOCS, 'PHASE11_BROWSER_FIREFOX_VALIDATION.json'));
const deployment = await readJson(path.join(DOCS, 'PHASE11_DEPLOYMENT_VALIDATION.json'));
const determinism = await readJson(path.join(DOCS, 'PHASE11_CROSS_BROWSER_DETERMINISM.json'));
const audit = await readJson(path.join(DOCS, 'PHASE11_FINAL_RELEASE_AUDIT.json'));
const core = await readJson(path.join(DOCS, 'PHASE10_CORE_VALIDATION.json'));
const phase10Idle = await readJson(path.join(DOCS, 'PHASE10_MENU_IDLE_VALIDATION.json'));
const phase10Soak = await readJson(path.join(DOCS, 'PHASE10_ACTIVE_SOAK_VALIDATION.json'));

const defects = `# Phase 11 Defect Register\n\n## Product defects\n\n| Severity | Count | Notes |\n|---|---:|---|\n| Critical | 0 | None reproduced. |\n| High | 0 | None reproduced. |\n| Medium | 0 | No product defect is accepted. |\n| Low | 0 | None recorded. |\n\n## Release-blocking validation gap\n\n**Classification:** release gate, not a reproduced product defect.\n\nReal Firefox/Gecko did not execute game code in the current runner. No Firefox compatibility claim, Version 1.0 promotion, or final sign-off is made. The runner lacks an executable Firefox binary, browser download endpoints are unavailable through DNS, and no connected GitHub Actions environment was supplied.\n`;
await writeFile(path.join(DOCS, 'PHASE11_DEFECT_REGISTER.md'), defects);

const checklistItems = [
  ['Phase 10 source archive independently verified', recovery?.passed === true],
  ['canonical documents unchanged', recovery?.passed === true],
  ['all 1272 prior tests retained', (core?.exactTestTotal ?? 0) >= 1272],
  ['all tests pass', core?.passed === true],
  ['Firefox game code actually executed', firefox?.gameCodeExecuted === true],
  ['Firefox fresh tutorial passed', firefox?.checks?.firstRunTutorial === true],
  ['Firefox input/rebinding passed', firefox?.checks?.rebinding === true],
  ['Firefox audio passed', firefox?.checks?.oneAudioContextMaximum === true],
  ['Firefox focus/visibility passed', firefox?.checks?.visibilityEventHandled === true],
  ['Firefox combat/boss/Results passed', firefox?.passed === true],
  ['Chromium final matrix passed', chromium?.passed === true],
  ['cross-browser deterministic comparison passed', determinism?.passed === true],
  ['root static deployment passed', deployment?.bases?.find((entry) => entry.base === '/')?.passed === true],
  ['subpath static deployment passed', deployment?.bases?.find((entry) => entry.base === '/echoframe-test/')?.passed === true],
  ['public URL passed when required', false],
  ['CI Firefox job passed when available', false],
  ['final version is 1.0.0', pkg.version === '1.0.0'],
  ['60-cycle lifecycle passed on final source', false],
  ['Firefox lifecycle subset passed', false],
  ['30-minute menu idle passed on final source', false],
  ['30-minute active soak passed on final source', false],
  ['final performance passed', false],
  ['accessibility certification passed', false],
  ['audio certification passed', false],
  ['source audit passed', (await readJson(path.join(DOCS, 'PHASE11_SOURCE_AUDIT.json')))?.passed === true],
  ['security audit passed', (await readJson(path.join(DOCS, 'PHASE11_SECURITY_AUDIT.json')))?.passed === true],
  ['npm audit reports zero vulnerabilities', (await readJson(path.join(DOCS, 'PHASE11_NPM_AUDIT.json')))?.passed === true],
  ['Critical defects = 0', true], ['High defects = 0', true],
  ['source ZIP clean extraction passed', false], ['web ZIP clean extraction passed', false],
  ['checksums recorded', false], ['archive metrics defined correctly', recovery?.sourceArchive?.rawEntryCount === 585 && recovery?.sourceArchive?.regularFileCount === 547],
  ['final release audit passed', audit?.passed === true], ['final sign-off passed', audit?.passed === true],
];
await writeFile(path.join(DOCS, 'PHASE11_RELEASE_CHECKLIST.md'), `# Phase 11 Release Checklist\n\n${checklistItems.map(([label, value]) => `- [${value ? 'x' : ' '}] ${label}`).join('\n')}\n\nUnchecked items are release gates, not omitted documentation.\n`);

await writeFile(path.join(DOCS, 'PHASE11_CI_ARCHITECTURE.md'), `# Phase 11 CI Architecture\n\nThe repository now defines separate jobs for core validation, Chromium production validation, Firefox production validation, static deployment validation, cross-browser determinism, and release evidence aggregation. Failed jobs preserve their exit codes and upload evidence through \`actions/upload-artifact@v4\`.\n\nThe Pages workflow triggers automatically only after the \`ECHOFRAME CI\` workflow succeeds. Manual deployment requires an explicit certification confirmation and still reruns the mandatory core suite before building the Pages artifact.\n\nActual GitHub Actions execution remains unavailable until this source is placed in a connected repository.\n`);

const validation = `# Phase 11 Validation Report\n\n**Version:** \`${pkg.version}\`  \n**Source manifest:** \`${source.digest}\`  \n**Verdict:** **${audit?.verdict ?? 'release-candidate-signoff-withheld'}**\n\n## Reproduced results\n\n- Phase 10 archive SHA-256 matched: \`${recovery?.sourceArchive?.sha256 ?? 'unknown'}\`\n- Automated tests: ${core?.exactPassTotal ?? 'unknown'}/${core?.exactTestTotal ?? 'unknown'} passed\n- Chromium production matrix: ${chromium?.passed ? 'passed' : 'failed/not run'}\n- Root and subpath deployment: ${deployment?.passed ? 'passed' : 'failed/not run'}\n- Firefox game execution: ${firefox?.gameCodeExecuted === true ? 'completed' : 'not completed'}\n- Cross-browser determinism: ${determinism?.passed ? 'passed' : 'blocked'}\n\n## Historical long-session evidence\n\nPhase 10 menu idle passed for ${phase10Idle?.actualWallClockMs ?? phase10Idle?.durationMs ?? 'the required duration'} ms. Phase 10 active soak passed for ${phase10Soak?.actualWallClockMs ?? phase10Soak?.durationMs ?? 'the required duration'} ms. These remain historical release-candidate evidence and do not replace final Version 1.0 runs.\n\n## Release decision\n\nThe project remains \`1.0.0-release-candidate\`. Real Firefox certification is mandatory and unavailable in this runner. Therefore final identity, final source/web archives, Git tag, GitHub release, and public-launch claims are withheld.\n`;
await writeFile(path.join(DOCS, 'VALIDATION_REPORT.md'), validation);

await writeFile(path.join(DOCS, 'RELEASE_NOTES_v1.0.0.md'), `# ECHOFRAME: LAST SIGNAL — Version 1.0 Release Notes\n\n**Status:** Draft; not released.\n\nThe gameplay-complete release candidate includes the First Signal tutorial, full deterministic run, 24 upgrades, six enemies, three elite modifiers, eight arenas, the Null Architect boss, scoring, progression, Archive, Statistics, input rebinding, accessibility settings, static deployment, and controlled recovery/fatal presentation.\n\nVersion 1.0 final publication is blocked until real Firefox certification and final-version lifecycle, idle, soak, performance, archive, and deployment gates pass.\n`);

const current = await readFile(path.join(DOCS, 'CURRENT_STATE.md'), 'utf8');
if (!current.includes('Phase 11 certification status')) await writeFile(path.join(DOCS, 'CURRENT_STATE.md'), `${current.trim()}\n\n## Phase 11 certification status\n\nCross-browser certification infrastructure is implemented. Chromium and local static deployment pass. Real Firefox remains unavailable in the current runner, so the project remains \`1.0.0-release-candidate\` and final Version 1.0 sign-off is withheld.\n`);
const changelog = await readFile(path.join(DOCS, 'CHANGELOG.md'), 'utf8');
if (!changelog.includes('Phase 11 certification candidate')) await writeFile(path.join(DOCS, 'CHANGELOG.md'), `# Changelog\n\n## Phase 11 certification candidate — unreleased\n\n- Added source-bound Phase 11 recovery and evidence mapping.\n- Added reproducible Chromium, Firefox, deployment, deterministic, CI, certification, audit, and packaging gates.\n- Hardened GitHub Actions so Pages deployment follows successful cross-browser CI.\n- Reconciled Phase 10 archive metrics and package evidence.\n- Withheld Version 1.0 promotion because real Firefox did not execute in this environment.\n\n${changelog.replace(/^# Changelog\s*/,'')}`);
console.log(JSON.stringify({ generated: true, version: pkg.version, sourceManifestDigest: source.digest, verdict: audit?.verdict ?? null }, null, 2));
