import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import {
  ROOT, DOCS, canonicalHashes, environmentSnapshot, packageMetadata,
  productionBundleDigest, readJson, runtimeVersion, sourceManifest, writeJson,
} from './phase12-utils.mjs';

const RELEASE = path.join(ROOT, 'release');
const EXTERNAL_DIST = Boolean(process.env.PHASE13_DIST_DIR);
const DIST = path.resolve(process.env.PHASE13_DIST_DIR || path.join(ROOT, 'dist-phase13-final'));
const SOURCE_ZIP = path.join(RELEASE, 'ECHOFRAME_v1.0.0_final_source.zip');
const WEB_ZIP = path.join(RELEASE, 'ECHOFRAME_v1.0.0_web.zip');
const CHECKSUMS = path.join(RELEASE, 'ECHOFRAME_v1.0.0_SHA256SUMS.txt');
const MANIFEST = path.join(RELEASE, 'ECHOFRAME_v1.0.0_RELEASE_MANIFEST.json');
const RELEASE_MARKER = path.join(DIST, 'phase13-release.json');
const RELEASE_MARKER_RELATIVE = 'phase13-release.json';
const RETAINED_THROUGH_PHASE12 = 1319;

const sha256 = async (filename) => createHash('sha256').update(await readFile(filename)).digest('hex');
const exists = async (filename) => { try { await access(filename); return true; } catch { return false; } };
const lines = (command, args, options = {}) => execFileSync(command, args, { cwd: ROOT, encoding: 'utf8', ...options }).trim().split(/\r?\n/).filter(Boolean);

const previousManifest = await readJson(MANIFEST);
const audit = await readJson(path.join(DOCS, 'PHASE13_NONPUBLIC_RELEASE_AUDIT.json'));
if (!audit?.passed) throw new Error('Phase 13 non-public release audit is not passed.');
const coreValidation = await readJson(path.join(DOCS, 'PHASE10_CORE_VALIDATION.json'));
const testCommand = coreValidation?.commands?.find((entry) => entry.command === 'npm run test');
const actualTestTotal = Number(testCommand?.tests);
if (!Number.isInteger(actualTestTotal) || actualTestTotal < RETAINED_THROUGH_PHASE12 || testCommand?.passed !== true) {
  throw new Error(`Final core test evidence is invalid: tests=${testCommand?.tests} passed=${testCommand?.passed}`);
}
const phase13TestTotal = actualTestTotal - RETAINED_THROUGH_PHASE12;
const pkg = await packageMetadata();
const runtime = await runtimeVersion();
if (pkg.version !== '1.0.0' || runtime !== '1.0.0') throw new Error(`Final identity mismatch: package=${pkg.version} runtime=${runtime}`);
const source = await sourceManifest();
if (audit.sourceManifestDigest !== source.digest) throw new Error(`Source digest mismatch: audit=${audit.sourceManifestDigest} current=${source.digest}`);
const sourceCommit = process.env.PHASE13_SOURCE_COMMIT || process.env.GITHUB_SHA || null;

await mkdir(RELEASE, { recursive: true });
if (!EXTERNAL_DIST) {
  await rm(DIST, { recursive: true, force: true });
  execFileSync('npm', ['run', 'build', '--', '--outDir', path.basename(DIST)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, VITE_BASE_PATH: '/echoframe/' },
  });
}
if (!(await exists(path.join(DIST, 'index.html')))) throw new Error(`Production dist is missing: ${DIST}`);

// The release marker records the production bundle digest, so the digest definition excludes the marker itself.
// This same definition is used by Pages deployment, public validation, and final web packaging.
const bundle = await productionBundleDigest(DIST, { exclude: [RELEASE_MARKER_RELATIVE] });
let releaseMarker = await readJson(RELEASE_MARKER);
if (releaseMarker) {
  const markerChecks = {
    version: releaseMarker.version === '1.0.0',
    sourceCommit: !sourceCommit || releaseMarker.sourceCommit === sourceCommit,
    sourceManifestDigest: releaseMarker.sourceManifestDigest === source.digest,
    productionBundleDigest: releaseMarker.productionBundleDigest === bundle.digest,
    productionFileCount: releaseMarker.productionFileCount === bundle.fileCount,
  };
  const failed = Object.entries(markerChecks).filter(([, value]) => value !== true).map(([key]) => key);
  if (failed.length > 0) throw new Error(`Existing Phase 13 release marker mismatch: ${failed.join(', ')}`);
} else {
  releaseMarker = {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    sourceCommit,
    sourceManifestDigest: source.digest,
    productionBundleDigest: bundle.digest,
    productionFileCount: bundle.fileCount,
  };
  await writeFile(RELEASE_MARKER, `${JSON.stringify(releaseMarker, null, 2)}\n`);
}

await rm(SOURCE_ZIP, { force: true });
await rm(WEB_ZIP, { force: true });
const sourceExclude = [
  '.git', '.git/*',
  'node_modules', 'node_modules/*',
  'dist', 'dist/*', 'dist-*', 'dist-*/*',
  '.phase*', '.phase*/*',
  'playwright-report', 'playwright-report/*',
  'test-results', 'test-results/*',
  'release', 'release/*',
  'candidate', 'candidate/*',
  '*.zip', '*.log',
  // Generated Phase 13 evidence describes and validates the archive. Excluding it avoids a self-referential
  // archive whose digest changes when its own validation/sign-off report is regenerated. The reports remain
  // committed beside the release and are attached as workflow evidence.
  'docs/PHASE13_*',
];
execFileSync('zip', ['-q', '-r', SOURCE_ZIP, '.', ...sourceExclude.flatMap((pattern) => ['-x', pattern])], { cwd: ROOT, stdio: 'inherit' });
execFileSync('zip', ['-q', '-r', WEB_ZIP, '.'], { cwd: DIST, stdio: 'inherit' });

async function archiveMetrics(filename) {
  const entries = lines('unzip', ['-Z1', filename]);
  const directories = entries.filter((entry) => entry.endsWith('/'));
  return {
    sha256: await sha256(filename),
    bytes: (await stat(filename)).size,
    totalEntries: entries.length,
    regularFiles: entries.length - directories.length,
    directoryEntries: directories.length,
  };
}
const sourceArchive = await archiveMetrics(SOURCE_ZIP);
const webArchive = await archiveMetrics(WEB_ZIP);
const canonical = await canonicalHashes();
const manifest = {
  generatedAt: new Date().toISOString(),
  releaseTitle: 'ECHOFRAME: LAST SIGNAL — Version 1.0',
  version: '1.0.0',
  sourceCommit,
  sourceManifestDigest: source.digest,
  sourceFileCount: source.fileCount,
  productionBundleDigest: bundle?.digest ?? null,
  productionFileCount: bundle?.fileCount ?? null,
  productionDigestExcludes: [RELEASE_MARKER_RELATIVE],
  releaseMarker,
  canonical,
  environment: environmentSnapshot(),
  browsers: {
    chromium: process.env.CHROMIUM_EXECUTABLE ? lines(process.env.CHROMIUM_EXECUTABLE, ['--version'])[0] : null,
    firefox: process.env.FIREFOX_EXECUTABLE ? lines(process.env.FIREFOX_EXECUTABLE, ['--version'], { env: { ...process.env, MOZ_HEADLESS: '1' } })[0] : null,
  },
  tests: {
    total: actualTestTotal,
    retainedThroughPhase12: RETAINED_THROUGH_PHASE12,
    phase13: phase13TestTotal,
    source: 'docs/PHASE10_CORE_VALIDATION.json',
  },
  archives: {
    source: { filename: path.basename(SOURCE_ZIP), ...sourceArchive },
    web: { filename: path.basename(WEB_ZIP), ...webArchive },
  },
  ci: { runId: process.env.GITHUB_RUN_ID ?? null, runUrl: process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null },
  publicDeployment: previousManifest?.publicDeployment ?? { status: 'pending', url: null },
  signoff: previousManifest?.signoff ?? { status: 'pending-public-validation', passed: false },
  tag: previousManifest?.tag ?? null,
  release: previousManifest?.release ?? { status: 'pending' },
};
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(CHECKSUMS, `${sourceArchive.sha256}  ${path.basename(SOURCE_ZIP)}\n${webArchive.sha256}  ${path.basename(WEB_ZIP)}\n`);
await writeJson('PHASE13_PACKAGE_BUILD.json', {
  generatedAt: manifest.generatedAt,
  sourceManifestDigest: source.digest,
  productionBundleDigest: bundle?.digest ?? null,
  productionDigestExcludes: [RELEASE_MARKER_RELATIVE],
  releaseMarker,
  tests: manifest.tests,
  sourceArchive,
  webArchive,
  manifest: path.relative(ROOT, MANIFEST),
  checksums: path.relative(ROOT, CHECKSUMS),
  externalDistPreserved: EXTERNAL_DIST,
  generatedEvidenceExcludedFromSourceArchive: true,
  checks: {
    externalDistNotDeleted: true,
    phase13EvidenceExcludedToPreventSelfReference: true,
    finalTestEvidencePassed: testCommand.passed === true && actualTestTotal === testCommand.pass && testCommand.fail === 0,
    releaseTitlePreservedSeparatelyFromPublicationStatus: manifest.releaseTitle === 'ECHOFRAME: LAST SIGNAL — Version 1.0' && typeof manifest.release === 'object',
    releaseMarkerExcludedFromOwnBundleDigest: bundle?.excluded?.includes(RELEASE_MARKER_RELATIVE) === true,
    releaseMarkerBoundToBundle: releaseMarker.productionBundleDigest === bundle.digest,
  },
  passed: true,
});
console.log(JSON.stringify({ passed: true, tests: manifest.tests, sourceArchive, webArchive, releaseMarker, externalDist: EXTERNAL_DIST, sourceManifestDigest: source.digest, productionBundleDigest: bundle?.digest }, null, 2));
