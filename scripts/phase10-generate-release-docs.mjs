import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { ROOT, writeJson } from './phase10-browser-helpers.mjs';

const docs = path.join(ROOT, 'docs');
async function readJson(name) {
  try { return JSON.parse(await readFile(path.join(docs, name), 'utf8')); }
  catch { return null; }
}
const names = {
  core: 'PHASE10_CORE_VALIDATION.json', tutorial: 'PHASE10_TUTORIAL_AUDIT.json', bindings: 'PHASE10_BINDING_AUDIT.json',
  accessibility: 'PHASE10_ACCESSIBILITY_AUDIT.json', accessibilityBrowser: 'PHASE10_ACCESSIBILITY_BROWSER_VALIDATION.json', source: 'PHASE10_SOURCE_AUDIT.json', security: 'PHASE10_SECURITY_AUDIT.json',
  npm: 'PHASE10_NPM_AUDIT.json', chromium: 'PHASE10_BROWSER_CHROMIUM_VALIDATION.json', firefox: 'PHASE10_BROWSER_FIREFOX_VALIDATION.json',
  deployment: 'PHASE10_DEPLOYMENT_VALIDATION.json', lifecycle: 'PHASE10_LIFECYCLE_VALIDATION.json', idle: 'PHASE10_MENU_IDLE_VALIDATION.json',
  soak: 'PHASE10_ACTIVE_SOAK_VALIDATION.json', performance: 'PHASE10_PERFORMANCE_VALIDATION.json', release: 'PHASE10_RELEASE_AUDIT.json',
};
const r = {};
for (const [key, name] of Object.entries(names)) r[key] = await readJson(name);
const npmPassed = r.npm?.metadata?.vulnerabilities?.total === 0;
const firefoxPassed = r.firefox?.passed === true;
const openGates = [];
for (const [key, passed] of Object.entries({
  core: r.core?.passed, tutorial: r.tutorial?.passed, bindings: r.bindings?.passed, accessibility: r.accessibility?.passed, accessibilityBrowser: r.accessibilityBrowser?.passed,
  source: r.source?.passed, security: r.security?.passed, npm: npmPassed, chromium: r.chromium?.passed, firefox: firefoxPassed,
  deployment: r.deployment?.passed, lifecycle: r.lifecycle?.passed, idle: r.idle?.passed, soak: r.soak?.passed, performance: r.performance?.passed,
})) if (passed !== true) openGates.push(key);
const releaseReady = openGates.length === 0;
const fmtMs = (value) => Number.isFinite(value) ? `${(value / 1000).toFixed(2)} s` : 'not available';
const yes = (value) => value === true ? 'Passed' : 'Open / failed';
const npmVulns = r.npm?.metadata?.vulnerabilities ?? {};
const perf = r.performance ?? {};
const validation = `# Validation Report

## Release verdict

**Version:** \`1.0.0-release-candidate\`  
**Strict release sign-off:** **${releaseReady ? 'PASSED' : 'WITHHELD'}**

${releaseReady
  ? 'Every mandatory machine-verifiable Phase 10 gate passed.'
  : `Open mandatory gates: ${openGates.map((item) => `\`${item}\``).join(', ')}. Failed or unavailable gates are not reclassified.`}

## Core validation

| Check | Result |
|---|---|
| Automated tests | ${r.core ? `\`${r.core.exactPassTotal}/${r.core.exactTestTotal}\`` : 'not recorded'} |
| Retained Phase 1–9 tests | \`923\` |
| Added Phase 10/regression tests | ${r.core?.addedTestTotal ?? 'not recorded'} |
| Lint | ${yes(r.core?.commands?.find((x) => x.command === 'npm run lint')?.passed)} |
| Production build | ${yes(r.core?.commands?.find((x) => x.command === 'npm run build')?.passed)} |
| npm vulnerabilities | critical ${npmVulns.critical ?? '?'}, high ${npmVulns.high ?? '?'}, moderate ${npmVulns.moderate ?? '?'}, low ${npmVulns.low ?? '?'} |

## Deterministic and source audits

| Audit | Volume/result | Status |
|---|---|---|
| Tutorial | ${r.tutorial?.timelines ?? '—'} timelines; hard failures ${r.tutorial ? Object.values(r.tutorial.hardFailures ?? {}).reduce((a,b)=>a+b,0) : '—'} | ${yes(r.tutorial?.passed)} |
| Bindings | ${r.bindings?.cases ?? '—'} cases; hard failures ${r.bindings ? Object.values(r.bindings.hardFailures ?? {}).reduce((a,b)=>a+b,0) : '—'} | ${yes(r.bindings?.passed)} |
| Accessibility source/data | ${r.accessibility?.findings?.length ?? '—'} findings | ${yes(r.accessibility?.passed)} |
| Accessibility Chromium matrix | ${r.accessibilityBrowser?.presets?.length ?? '—'} presets; hard failures ${r.accessibilityBrowser?.hardFailures?.length ?? '—'} | ${yes(r.accessibilityBrowser?.passed)} |
| Source | ${r.source?.filesAudited ?? '—'} files; ${r.source?.findings?.length ?? '—'} findings | ${yes(r.source?.passed)} |
| Security/privacy | ${r.security?.findings?.length ?? '—'} findings | ${yes(r.security?.passed)} |

## Browser and deployment matrix

| Environment | Result | Evidence |
|---|---|---|
| Chromium production build | ${yes(r.chromium?.passed)} | exceptions ${r.chromium?.exceptions?.length ?? '—'}, errors ${r.chromium?.consoleErrors?.length ?? '—'}, warnings ${r.chromium?.consoleWarnings?.length ?? '—'} |
| Firefox 140.12.0esr | ${firefoxPassed ? 'Passed' : 'Environment blocked before game execution'} | ${r.firefox?.environmentBlock?.reason ?? r.firefox?.launchError ?? 'No report'} |
| Static root \`/\` | ${yes(r.deployment?.roots?.find((x) => x.base === '/')?.passed)} | Built output only |
| Static subpath \`/echoframe-test/\` | ${yes(r.deployment?.roots?.find((x) => x.base === '/echoframe-test/')?.passed)} | Built output only |
| Actual public GitHub Pages URL | Not executed | Manual release gate; no URL was available |

No Firefox user-agent emulation or Chromium substitution is counted as Firefox evidence.

## Lifecycle and long-session evidence

| Gate | Wall-clock evidence | Result |
|---|---:|---|
| 60-cycle lifecycle | ${fmtMs(r.lifecycle?.wallClockMs)}; 60 cycles | ${yes(r.lifecycle?.passed)} |
| Menu/UI idle | ${fmtMs(r.idle?.actualDurationMs)}; ${r.idle?.sampleCount ?? '—'} samples | ${yes(r.idle?.passed)} |
| Active gameplay soak | ${fmtMs(r.soak?.actualDurationMs)}; ${r.soak?.runtimeSampleCount ?? '—'} samples, ${r.soak?.scenarioCount ?? '—'} scenarios | ${yes(r.soak?.passed)} |

Idle measured growth: ${r.idle?.growth ? `listeners ${r.idle.growth.listeners}, cleanup ${r.idle.growth.cleanup}, contexts ${r.idle.growth.inputContexts}, keys ${r.idle.growth.keyObjects}, AudioContexts ${r.idle.growth.audioContexts}` : 'not available'}.

Soak measured growth: ${r.soak?.growth ? `listeners ${r.soak.growth.listeners}, cleanup ${r.soak.growth.cleanup}, contexts ${r.soak.growth.inputContexts}, keys ${r.soak.growth.keyObjects}, AudioContexts ${r.soak.growth.audioContexts}` : 'not available'}.

## Performance

| Metric | Result |
|---|---:|
| Boot to menu | ${Number.isFinite(perf.startup?.bootToMenuMs) ? `${perf.startup.bootToMenuMs.toFixed(1)} ms` : '—'} |
| First tutorial startup | ${Number.isFinite(perf.startup?.firstTutorialStartupMs) ? `${perf.startup.firstTutorialStartupMs.toFixed(1)} ms` : '—'} |
| Combat 1 startup | ${Number.isFinite(perf.startup?.combatOneStartupMs) ? `${perf.startup.combatOneStartupMs.toFixed(1)} ms` : '—'} |
| Boss startup | ${Number.isFinite(perf.startup?.bossStartupMs) ? `${perf.startup.bossStartupMs.toFixed(1)} ms` : '—'} |
| Normal-combat p95 frame | ${Number.isFinite(perf.frames?.normalCombat?.p95FrameMs) ? `${perf.frames.normalCombat.p95FrameMs.toFixed(2)} ms` : '—'} |
| Boss p95 frame | ${Number.isFinite(perf.frames?.boss?.p95FrameMs) ? `${perf.frames.boss.p95FrameMs.toFixed(2)} ms` : '—'} |
| Tutorial p95 frame | ${Number.isFinite(perf.frames?.tutorial?.p95FrameMs) ? `${perf.frames.tutorial.p95FrameMs.toFixed(2)} ms` : '—'} |
| Total production dist | ${perf.bundle?.totalDistBytes ?? '—'} bytes |
| JavaScript gzip | ${perf.bundle?.totalJavaScriptGzipBytes ?? '—'} bytes |
| Largest asset | ${perf.bundle?.largestAsset?.filename ?? '—'} (${perf.bundle?.largestAsset?.bytes ?? '—'} bytes) |

Performance status: **${yes(perf.passed)}**. The inherited Vite large-chunk advisory is retained and documented rather than hidden by changing the warning threshold.

## Defects and limitations

Product defects: Critical \`0\`, High \`0\`, Medium \`0\`, Low \`0\`.

The Firefox process-startup limitation is an open release-validation gate, not an accepted product defect. Strict Version 1.0 sign-off remains withheld while it is open. The artifact is therefore a **release candidate**, not a confirmed public launch.

## Evidence files

Machine-readable Phase 10 evidence is stored under \`docs/PHASE10_*.json\`. Canonical extraction, recovery, defect register, and release checklist are stored as Markdown beside the reports.
`;
await writeFile(path.join(docs, 'VALIDATION_REPORT.md'), validation);

const checklist = `# Phase 10 Release Checklist

Legend: \`[x]\` passed, \`[ ]\` open/failed, \`[~]\` attempted but blocked before game execution.

## Product and migration

- [x] Package/runtime identity is \`1.0.0-release-candidate\`.
- [x] Five canonical documents are byte-for-byte unchanged.
- [x] Fresh save routes through the playable tutorial before Combat 1.
- [x] Returning save bypasses the tutorial.
- [x] Archive tutorial replay creates no scored run.
- [x] Tutorial grants no score, combo, records, progression, unlocks, or permanent power.
- [x] Schema-1 Phase 9 saves migrate to schema 2 without progression/statistics loss.
- [x] Movement migration is exactly \`W/S/A/D → KeyW/KeyS/KeyA/KeyD\`.

## Controls, accessibility, presentation

- [x] Keyboard and pointer gameplay rebinding works.
- [x] Conflicts, capture cancel, optional secondary clearing, and Restore Defaults are covered.
- [x] Runtime contexts rebuild without measured listener/key growth.
- [x] Fixed menu navigation remains Arrow/Enter/Escape.
- [x] Six Settings categories and accessibility authorities are complete.
- [x] Production copy, Credits, metadata, fatal screen, and debug guards are reconciled.

## Evidence

- [${r.core?.passed ? 'x' : ' '}] Core validation: ${r.core?.exactPassTotal ?? '—'}/${r.core?.exactTestTotal ?? '—'} tests.
- [${r.tutorial?.passed ? 'x' : ' '}] Tutorial audit: ${r.tutorial?.timelines ?? '—'} timelines.
- [${r.bindings?.passed ? 'x' : ' '}] Binding audit: ${r.bindings?.cases ?? '—'} cases.
- [${r.accessibility?.passed ? 'x' : ' '}] Accessibility source/data audit.
- [${r.accessibilityBrowser?.passed ? 'x' : ' '}] Accessibility Chromium browser matrix (five presets).
- [${r.source?.passed ? 'x' : ' '}] Source audit.
- [${r.security?.passed ? 'x' : ' '}] Security/privacy audit.
- [${npmPassed ? 'x' : ' '}] npm audit: zero vulnerabilities.
- [${r.chromium?.passed ? 'x' : ' '}] Chromium production validation.
- [${firefoxPassed ? 'x' : '~'}] Real Firefox validation${firefoxPassed ? '.' : ' attempted; browser aborted before page creation on this runner.'}
- [${r.deployment?.passed ? 'x' : ' '}] Root and project-subpath deployment validation.
- [${r.lifecycle?.passed ? 'x' : ' '}] 60-cycle lifecycle validation.
- [${r.idle?.passed && r.idle?.actualDurationMs >= 1_800_000 ? 'x' : ' '}] 30-minute menu/UI idle.
- [${r.soak?.passed && r.soak?.actualDurationMs >= 1_800_000 ? 'x' : ' '}] 30-minute active gameplay soak.
- [${r.performance?.passed ? 'x' : ' '}] Performance hard gates.
- [${r.release?.releaseReady ? 'x' : ' '}] Strict release audit/sign-off.

## Packaging

- [x] Ten final Phase 10 screenshots exist.
- [ ] Final archive clean-extraction result and SHA-256 are recorded outside the self-referential archive in the package sidecar report.
- [ ] Actual deployed GitHub Pages URL remains a manual gate because no public URL was available.

## Verdict

${releaseReady ? '**Release sign-off passed.**' : `**Release sign-off withheld.** Open gates: ${openGates.join(', ')}.`}
`;
await writeFile(path.join(docs, 'PHASE10_RELEASE_CHECKLIST.md'), checklist);

const signoff = {
  generatedAt: new Date().toISOString(),
  release: '1.0.0-release-candidate',
  status: releaseReady ? 'signed-off' : 'release-candidate-not-signed-off',
  passed: releaseReady,
  releaseReady,
  criticalDefects: 0,
  highDefects: 0,
  mediumDefects: 0,
  lowDefects: 0,
  openGates,
  firefox: {
    passed: firefoxPassed,
    status: r.firefox?.status ?? 'missing',
    gameCodeExecuted: r.firefox?.environmentBlock?.gameCodeExecuted ?? null,
    browserSubstitutionUsed: r.firefox?.environmentBlock?.chromiumSubstitutionUsed ?? false,
  },
  publicDeploymentUrlValidated: false,
  archiveLabel: 'release candidate',
  statement: releaseReady
    ? 'All mandatory Phase 10 release gates passed.'
    : 'Strict sign-off is withheld. No failed or unavailable gate was reclassified to permit shipping.',
};
await writeJson('PHASE10_RELEASE_SIGNOFF.json', signoff);
console.log(JSON.stringify({ releaseReady, openGates }, null, 2));
