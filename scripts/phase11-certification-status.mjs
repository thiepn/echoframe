import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { ROOT, DOCS, packageMetadata, readJson, sourceManifest, writeJson } from './phase11-utils.mjs';
const source = await sourceManifest(); const pkg = await packageMetadata();
const chromium = await readJson(path.join(DOCS, 'PHASE11_BROWSER_CHROMIUM_VALIDATION.json'));
const firefox = await readJson(path.join(DOCS, 'PHASE11_BROWSER_FIREFOX_VALIDATION.json'));
const phase10Accessibility = await readJson(path.join(DOCS, 'PHASE10_ACCESSIBILITY_BROWSER_VALIDATION.json'));
const phase10Performance = await readJson(path.join(DOCS, 'PHASE10_PERFORMANCE_VALIDATION.json'));
const phase10Lifecycle = await readJson(path.join(DOCS, 'PHASE10_LIFECYCLE_VALIDATION.json'));
const phase10Idle = await readJson(path.join(DOCS, 'PHASE10_MENU_IDLE_VALIDATION.json'));
const phase10Soak = await readJson(path.join(DOCS, 'PHASE10_ACTIVE_SOAK_VALIDATION.json'));

const realFirefox = firefox?.passed === true && firefox?.gameCodeExecuted === true;
const accessibility = {
  generatedAt: new Date().toISOString(), phase: 11, packageVersion: pkg.version, sourceManifestDigest: source.digest,
  chromiumPassed: chromium?.passed === true && phase10Accessibility?.passed === true,
  firefoxPassed: realFirefox,
  presets: ['default', 'reduced-motion', 'high-contrast-locator', 'minimal-hud', 'all-aids'],
  status: realFirefox ? 'completed' : 'blocked-real-firefox-required',
  passed: chromium?.passed === true && phase10Accessibility?.passed === true && realFirefox,
};
await writeJson('PHASE11_ACCESSIBILITY_CERTIFICATION.json', accessibility);
const audio = {
  generatedAt: new Date().toISOString(), phase: 11, packageVersion: pkg.version, sourceManifestDigest: source.digest,
  chromiumPassed: chromium?.passed === true,
  firefoxPassed: realFirefox && firefox?.checks?.oneAudioContextMaximum === true,
  oneAudioContextMaximum: chromium?.passed === true && (!realFirefox || firefox?.checks?.oneAudioContextMaximum === true),
  status: realFirefox ? 'completed' : 'blocked-real-firefox-required',
  passed: chromium?.passed === true && realFirefox && firefox?.checks?.oneAudioContextMaximum === true,
};
await writeJson('PHASE11_AUDIO_CERTIFICATION.json', audio);
const historical = {
  phase10Lifecycle: { passed: phase10Lifecycle?.passed === true, generatedAt: phase10Lifecycle?.generatedAt ?? null },
  phase10MenuIdle: { passed: phase10Idle?.passed === true, durationMs: phase10Idle?.durationMs ?? phase10Idle?.actualDurationMs ?? null },
  phase10ActiveSoak: { passed: phase10Soak?.passed === true, durationMs: phase10Soak?.durationMs ?? phase10Soak?.actualDurationMs ?? null },
  phase10Performance: { passed: phase10Performance?.passed === true, generatedAt: phase10Performance?.generatedAt ?? null },
};
for (const [filename, scope] of [
  ['PHASE11_LIFECYCLE_VALIDATION.json', 'Final 1.0 lifecycle validation'],
  ['PHASE11_MENU_IDLE_VALIDATION.json', 'Final 1.0 30-minute menu idle'],
  ['PHASE11_ACTIVE_SOAK_VALIDATION.json', 'Final 1.0 30-minute active soak'],
  ['PHASE11_PERFORMANCE_VALIDATION.json', 'Final 1.0 Chromium and Firefox performance'],
]) {
  await writeJson(filename, {
    generatedAt: new Date().toISOString(), phase: 11, scope, packageVersion: pkg.version, sourceManifestDigest: source.digest,
    status: 'not-run-release-promotion-blocked', passed: false, historicalPhase10Evidence: historical,
    reason: 'The mandatory real Firefox pre-promotion gate has not passed. Final 1.0 identity was not committed, so final-version lifecycle, idle, soak, and performance evidence would be premature.',
  });
}
const publicUrl = process.env.PUBLIC_PAGES_URL ?? null;
await writeJson('PHASE11_PUBLIC_DEPLOYMENT_VALIDATION.json', {
  generatedAt: new Date().toISOString(), phase: 11, packageVersion: pkg.version, sourceManifestDigest: source.digest,
  url: publicUrl, status: publicUrl ? 'not-executed' : 'unavailable-no-public-url', passed: false,
  chromiumPassed: false, firefoxPassed: false,
  note: publicUrl ? 'A public URL was supplied but the dedicated public deployment matrix was not completed.' : 'No repository URL or public GitHub Pages URL was provided. No public-launch claim is made.',
});
await writeFile(path.join(DOCS, 'PHASE11_FIREFOX_COMPATIBILITY_NOTES.md'), `# Phase 11 Firefox Compatibility Notes\n\n- Required engine: real Firefox/Gecko.\n- Chromium user-agent substitution is prohibited and was not used.\n- Current runner kernel: ${process.platform} ${process.arch}.\n- Phase 11 status: **${firefox?.status ?? 'not run'}**.\n- Game code executed in Firefox: **${firefox?.gameCodeExecuted === true}**.\n- Current blocker: ${firefox?.environmentBlock?.reason ?? firefox?.launchError ?? 'No Firefox report available.'}\n\nThe project remains \`1.0.0-release-candidate\` until game code executes and the Firefox matrix passes on a supported environment.\n`);
await writeFile(path.join(DOCS, 'BROWSER_SUPPORT.md'), `# Browser Support\n\n## Certified\n\n- Chromium 144 on desktop Linux: production validation passed for the Phase 11 release-candidate source.\n\n## Required before Version 1.0 final\n\n- Firefox/Gecko: real execution remains mandatory and is not yet certified in this environment.\n\n## Not claimed\n\n- Safari/WebKit\n- Mobile browsers\n- Touch controls\n- Gamepad controls\n\nThe game targets desktop keyboard and mouse input.\n`);
console.log(JSON.stringify({ accessibility, audio, historical }, null, 2));
if (!accessibility.passed || !audio.passed) process.exitCode = 1;
