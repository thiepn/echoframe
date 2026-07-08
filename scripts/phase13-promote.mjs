import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { ROOT, DOCS, readJson, sourceManifest } from './phase12-utils.mjs';

const audit = await readJson(path.join(DOCS, 'PHASE13_PREPROMOTION_AUDIT.json'));
if (!audit?.passed) throw new Error('Phase 13 pre-promotion audit is not passed.');
const beforeManifest = await sourceManifest();
if (audit.sourceManifestDigest !== beforeManifest.digest) {
  throw new Error(`Pre-promotion source digest mismatch: audit=${audit.sourceManifestDigest} current=${beforeManifest.digest}`);
}

async function replaceOne(relative, before, after) {
  const target = path.join(ROOT, relative);
  const text = await readFile(target, 'utf8');
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${relative}: expected exactly one ${JSON.stringify(before)}, found ${count}`);
  await writeFile(target, text.replace(before, after));
}

async function replaceOptional(relative, before, after) {
  const target = path.join(ROOT, relative);
  const text = await readFile(target, 'utf8');
  const count = text.split(before).length - 1;
  if (count > 1) throw new Error(`${relative}: expected at most one ${JSON.stringify(before)}, found ${count}`);
  if (count === 1) await writeFile(target, text.replace(before, after));
}

const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
if (pkg.version !== '1.0.0-release-candidate') throw new Error(`Unexpected package version: ${pkg.version}`);
pkg.version = '1.0.0';
await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const lockPath = path.join(ROOT, 'package-lock.json');
const lock = JSON.parse(await readFile(lockPath, 'utf8'));
if (lock.version !== '1.0.0-release-candidate' || lock.packages?.['']?.version !== '1.0.0-release-candidate') {
  throw new Error('Unexpected lockfile identity.');
}
lock.version = '1.0.0';
lock.packages[''].version = '1.0.0';
await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);

await replaceOne('src/utils/version.js', "BUILD_VERSION = '1.0.0-release-candidate'", "BUILD_VERSION = '1.0.0'");
await replaceOne('src/data/constants.js', "RELEASE_VERSION = '1.0.0-release-candidate'", "RELEASE_VERSION = '1.0.0'");
await replaceOne('src/scenes/MainMenuScene.js', 'Version 1.0 Release Candidate · ${BUILD_VERSION}', 'Version 1.0 · ${BUILD_VERSION}');

await replaceOne('tests/phase10-release-candidate.test.js',
  "assert.equal(JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version, '1.0.0-release-candidate')",
  "assert.equal(JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version, '1.0.0')");
await replaceOne('tests/phase10-release-candidate.test.js',
  "assert.match(readFileSync(new URL('../src/utils/version.js', import.meta.url), 'utf8'), /1\\.0\\.0-release-candidate/)",
  "assert.match(readFileSync(new URL('../src/utils/version.js', import.meta.url), 'utf8'), /BUILD_VERSION\\s*=\\s*'1\\.0\\.0'/)");
await replaceOne('tests/phase10-release-candidate.test.js',
  "assert.match(readFileSync(new URL('../src/scenes/MainMenuScene.js', import.meta.url), 'utf8'), /Version 1\\.0 Release Candidate/)",
  "assert.match(readFileSync(new URL('../src/scenes/MainMenuScene.js', import.meta.url), 'utf8'), /Version 1\\.0 ·/)");
await replaceOne('tests/phase11-certification.test.js',
  "['Phase 11 · package remains release candidate before Firefox certification', () => assert.equal(json('package.json').version, '1.0.0-release-candidate')]",
  "['Phase 13 · package is final after hosted Firefox certification', () => assert.equal(json('package.json').version, '1.0.0')]");
await replaceOne('tests/phase11-certification.test.js',
  "['Phase 11 · runtime version remains release candidate before certification', () => assert.match(read('src/utils/version.js'), /1\\.0\\.0-release-candidate/)]",
  "['Phase 13 · runtime version is final after certification', () => assert.match(read('src/utils/version.js'), /BUILD_VERSION\\s*=\\s*'1\\.0\\.0'/)]");
await replaceOne('tests/phase11-certification.test.js',
  "['Phase 11 · release constant remains release candidate before certification', () => assert.match(read('src/data/constants.js'), /1\\.0\\.0-release-candidate/)]",
  "['Phase 13 · release constant is final after certification', () => assert.match(read('src/data/constants.js'), /RELEASE_VERSION\\s*=\\s*'1\\.0\\.0'/)]");
await replaceOne('tests/phase12-release-closure.test.js',
  "test('Phase 12 retains release-candidate identity before supported Firefox certification',()=>assert.equal(pkg.version,'1.0.0-release-candidate'));",
  "test('Phase 13 promotes final identity after supported Firefox certification',()=>assert.equal(pkg.version,'1.0.0'));");
await replaceOne('tests/phase7-run-tail.test.js',
  "assert.equal(packageJson.version, '1.0.0-release-candidate');",
  "assert.equal(packageJson.version, '1.0.0');");

await replaceOne('README.md',
  '**Version:** `1.0.0-release-candidate`  \n**Release label:** Version 1.0 Release Candidate',
  '**Version:** `1.0.0`  \n**Release label:** Version 1.0');
await replaceOptional('README.md',
  'Real Firefox/Gecko execution remains a mandatory open gate. This runner contains no Firefox executable, and browser/package downloads are unavailable through DNS. No Chromium emulation is accepted as Firefox evidence. The project therefore remains `1.0.0-release-candidate`; Version 1.0 final promotion, final-source long-session reruns, and public-launch claims are withheld. See `docs/PHASE11_RELEASE_CHECKLIST.md` and `docs/BROWSER_SUPPORT.md`.',
  'Phase 13 executed the production game in Playwright-managed Chromium and real Firefox on GitHub-hosted Ubuntu 24.04. The hosted pre-promotion browser, static-base, accessibility, audio, and deterministic gates passed before Version 1.0 identity was applied. Final publication remains evidence-gated until long-session, packaging, Pages, and public-site validation complete.');
await replaceOptional('README.md',
  '- Firefox/Gecko: targeted, but final certification remains pending real execution',
  '- Firefox/Gecko desktop: certified through the hosted Phase 13 release workflow');

await replaceOne('docs/CURRENT_STATE.md',
  '- Package/runtime: `1.0.0-release-candidate` / `1.0.0-release-candidate`',
  '- Package/runtime: `1.0.0` / `1.0.0`');
await replaceOne('docs/VALIDATION_REPORT.md',
  '- Package/runtime: `1.0.0-release-candidate` / `1.0.0-release-candidate`',
  '- Package/runtime: `1.0.0` / `1.0.0`');
await replaceOptional('docs/BROWSER_SUPPORT.md',
  '## Certified\n\n- Chromium desktop Linux: Phase 12 production revalidation passed.\n\n## Required before final Version 1.0\n\n- Current supported Firefox/Gecko: environment-blocked-before-game-execution. Game execution: false.',
  '## Certified\n\n- Chromium desktop Linux: hosted Phase 13 production validation passed.\n- Firefox/Gecko desktop Linux: hosted Phase 13 production validation passed with real game execution.');
await replaceOptional('docs/BROWSER_SUPPORT.md',
  'The product remains `1.0.0-release-candidate`.',
  'The product identity is `1.0.0`. Public-site support claims remain gated on final Pages validation.');

const currentStatePath = path.join(DOCS, 'CURRENT_STATE.md');
const currentState = await readFile(currentStatePath, 'utf8');
await writeFile(currentStatePath, `${currentState.trim()}\n\n## Phase 13 Version 1.0 promotion\n\nThe hosted pre-promotion gate passed in real Chromium and real Firefox on Ubuntu 24.04. Package and runtime identity are now \`1.0.0\`. Final-version browser, lifecycle, long-session, packaging, Pages, and public-site evidence must still match the promoted source before publication sign-off.\n`);

const validationPath = path.join(DOCS, 'VALIDATION_REPORT.md');
const validation = await readFile(validationPath, 'utf8');
await writeFile(validationPath, `${validation.trim()}\n\n## Phase 13 hosted certification\n\nThe release candidate passed hosted Chromium, real Firefox, root/subpath, accessibility, audio, save-compatibility, and cross-browser deterministic pre-promotion gates. Version 1.0 identity was applied only after the evidence-derived pre-promotion audit passed. Final sign-off remains dependent on the promoted-source lifecycle, long-session, archive, Pages, and public-site reports.\n`);

const changelogPath = path.join(DOCS, 'CHANGELOG.md');
const changelog = await readFile(changelogPath, 'utf8');
await writeFile(changelogPath, `# Changelog\n\n## 1.0.0 — Phase 13\n\n- Certified the release candidate in real Playwright-managed Chromium and Firefox on GitHub-hosted Ubuntu 24.04.\n- Replaced internal package-registry lockfile URLs with portable public npm URLs while preserving versions and integrity hashes.\n- Hardened trusted pointer and rebinding validation with fresh canvas geometry and state-based capture waits.\n- Promoted package, runtime, release constant, and production UI identity to Version 1.0.\n- Preserved save schema 2, deterministic gameplay, balance, progression, and canonical design documents.\n\n${changelog.replace(/^# Changelog\s*/, '')}`);

const releaseNotes = `# ECHOFRAME: LAST SIGNAL — Version 1.0\n\nECHOFRAME: LAST SIGNAL is a deterministic desktop keyboard-and-mouse Phaser 3 action game built around recording and replaying the Warden's recent actions as friendly Echoes.\n\n## Version 1.0 includes\n\n- Complete six-combat/elite run structure, recovery chamber, seven upgrade choices, and the three-phase Null Architect boss.\n- First Signal production tutorial with persistent completion and Archive replay.\n- Twenty-four canonical upgrades, deterministic arenas and encounters, immutable score ledger, combo system, progression, Archive, Statistics, Settings, Credits, and Results.\n- Keyboard and pointer rebinding with primary/secondary bindings, conflict rejection, persistence, and immediate runtime refresh.\n- Accessibility presets covering motion, flashes, particles, contrast, outlines, locator, HUD opacity, damage numbers, and aim line.\n- Local-only schema-2 save data with Phase 9 migration, validated import/export, no analytics, and no telemetry.\n\n## Supported release target\n\n- Desktop Chromium and Firefox\n- Keyboard and mouse\n- Minimum CSS viewport 1024 × 576\n- Static hosting at a root path or repository subpath\n\nMobile, touch, gamepad, localization, online services, cloud saves, leaderboards, and endless mode are outside Version 1.0.\n`;
await writeFile(path.join(DOCS, 'RELEASE_NOTES_v1.0.0.md'), releaseNotes);

console.log(JSON.stringify({
  promoted: true,
  from: '1.0.0-release-candidate',
  to: '1.0.0',
  prePromotionSourceManifestDigest: beforeManifest.digest,
}, null, 2));
