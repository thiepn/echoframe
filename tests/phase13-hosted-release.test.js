import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relative) => readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const json = (relative) => JSON.parse(read(relative));

const pkg = json('package.json');
const lock = json('package-lock.json');
const runtime = read('src/utils/version.js').match(/BUILD_VERSION\s*=\s*'([^']+)'/)?.[1];
const releaseConstant = read('src/data/constants.js').match(/RELEASE_VERSION\s*=\s*'([^']+)'/)?.[1];
const browserHarness = read('scripts/phase10-browser-validation.mjs');
const hudScene = read('src/scenes/HUDScene.js');

test('Phase 13 keeps package and runtime identity coherent', () => {
  assert.ok(['1.0.0-release-candidate', '1.0.0'].includes(pkg.version));
  assert.equal(runtime, pkg.version);
  assert.equal(releaseConstant, pkg.version);
});

test('Phase 13 lockfile root identities match package identity', () => {
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
});

test('Phase 13 lockfile is portable outside the OpenAI build environment', () => {
  const source = read('package-lock.json');
  assert.doesNotMatch(source, /packages\.applied-caas-gateway1\.internal\.api\.openai\.org/);
  assert.match(source, /https:\/\/registry\.npmjs\.org\//);
});

test('Phase 13 Chromium harness waits for production capture debounce', () => {
  assert.match(browserHarness, /waitForCaptureListeners/);
  assert.match(browserHarness, /await sleep\(190\)/);
});

test('Phase 13 Chromium harness records trusted keyboard and pointer events', () => {
  assert.match(browserHarness, /__PHASE13_TRUSTED_INPUT_PROBE__/);
  assert.match(browserHarness, /event\.isTrusted/);
  assert.match(browserHarness, /event\.code === 'KeyI'/);
  assert.match(browserHarness, /event\.button === 1/);
});

test('Phase 13 Chromium pointer validation uses fresh canvas geometry', () => {
  assert.match(browserHarness, /worldToCanvasPoint/);
  assert.match(browserHarness, /locator\.boundingBox\(\)/);
  assert.doesNotMatch(browserHarness, /if \(canvas\) await page\.mouse\.click/);
});

test('Phase 13 transformed runner supports required hosted Firefox gates', () => {
  const source = read('scripts/phase13-transformed-runner.mjs');
  for (const mode of ['firefox-static', 'firefox-accessibility', 'firefox-lifecycle', 'firefox-soak', 'firefox-performance']) assert.match(source, new RegExp(`'${mode}'`));
});

test('Phase 13 evidence is source, version, commit, and workflow bound', () => {
  const source = read('scripts/phase13-evidence.mjs');
  for (const field of ['sourceManifestDigest', 'productionBundleDigest', 'commitSha', 'GITHUB_RUN_ID']) assert.match(source, new RegExp(field));
  const packager = read('scripts/phase13-package-final.mjs');
  assert.match(packager, /const actualTestTotal = Number\(testCommand\?\.tests\)/);
  assert.match(packager, /releaseTitle: 'ECHOFRAME: LAST SIGNAL — Version 1\.0'/);
  assert.doesNotMatch(packager, /tests: \{ total: 1328/);
});

test('Phase 13 final identity removes candidate wording from production UI', () => {
  if (pkg.version !== '1.0.0') return;
  assert.doesNotMatch(read('src/scenes/MainMenuScene.js'), /Release Candidate/);
  assert.doesNotMatch(read('src/utils/version.js'), /release-candidate/);
  assert.doesNotMatch(read('src/data/constants.js'), /release-candidate/);
});

test('Phase 13 HUD avoids redundant dynamic text rerasterization', () => {
  assert.match(hudScene, /#setText\(target, value\)/);
  assert.match(hudScene, /if \(target\.text !== normalized\) target\.setText\(normalized\)/);
  assert.match(hudScene, /this\.#setText\(this\.bossText/);
  assert.match(hudScene, /this\.#setText\(this\.encounterText/);
});
