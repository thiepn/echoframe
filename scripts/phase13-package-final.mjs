import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import {
  ROOT, DOCS, canonicalHashes, environmentSnapshot, packageMetadata,
  productionBundleDigest, readJson, runtimeVersion, sourceManifest, writeJson,
} from './phase12-utils.mjs';

const RELEASE = path.join(ROOT, 'release');
const DIST = path.resolve(process.env.PHASE13_DIST_DIR || path.join(ROOT, 'dist-phase13-final'));
const SOURCE_ZIP = path.join(RELEASE, 'ECHOFRAME_v1.0.0_final_source.zip');
const WEB_ZIP = path.join(RELEASE, 'ECHOFRAME_v1.0.0_web.zip');
const CHECKSUMS = path.join(RELEASE, 'ECHOFRAME_v1.0.0_SHA256SUMS.txt');
const MANIFEST = path.join(RELEASE, 'ECHOFRAME_v1.0.0_RELEASE_MANIFEST.json');

const sha256 = async (filename) => createHash('sha256').update(await readFile(filename)).digest('hex');
const exists = async (filename) => { try { await access(filename); return true; } catch { return false; } };
const lines = (command, args, options = {}) => execFileSync(command, args, { cwd: ROOT, encoding: 'utf8', ...options }).trim().split(/\r?\n/).filter(Boolean);

const previousManifest = await readJson(MANIFEST);
const audit = await readJson(path.join(DOCS, 'PHASE13_NONPUBLIC_RELEASE_AUDIT.json'));
if (!audit?.passed) throw new Error('Phase 13 non-public release audit is not passed.');
const pkg = await packageMetadata();
const runtime = await runtimeVersion();
if (pkg.version !== '1.0.0' || runtime !== '1.0.0') throw new Error(`Final identity mismatch: package=${pkg.version} runtime=${runtime}`);
const source = await sourceManifest();
if (audit.sourceManifestDigest !== source.digest) throw new Error(`Source digest mismatch: audit=${audit.sourceManifestDigest} current=${source.digest}`);

await mkdir(RELEASE, { recursive: true });
await rm(DIST, { recursive: true, force: true });
if (!process.env.PHASE13_DIST_DIR) {
  execFileSync('npm', ['run', 'build', '--', '--outDir', path.basename(DIST)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, VITE_BASE_PATH: '/echoframe/' },
  });
}
if (!(await exists(path.join(DIST, 'index.html')))) throw new Error(`Production dist is missing: ${DIST}`);
const bundle = await productionBundleDigest(DIST);

await rm(SOURCE_ZIP, { force: true });
await rm(WEB_ZIP, { force: true });
const sourceExclude = [
  '.git/*', 'node_modules/*', 'dist/*', 'dist-*/*', '.phase*/*', 'playwright-report/*', 'test-results/*',
  'release/*', '*.zip', '*.log', 'candidate/*',
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
  release: 'ECHOFRAME: LAST SIGNAL — Version 1.0',
  version: '1.0.0',
  sourceCommit: process.env.PHASE13_SOURCE_COMMIT || process.env.GITHUB_SHA || null,
  sourceManifestDigest: source.digest,
  sourceFileCount: source.fileCount,
  productionBundleDigest: bundle?.digest ?? null,
  productionFileCount: bundle?.fileCount ?? null,
  canonical,
  environment: environmentSnapshot(),
  browsers: {
    chromium: process.env.CHROMIUM_EXECUTABLE ? lines(process.env.CHROMIUM_EXECUTABLE, ['--version'])[0] : null,
    firefox: process.env.FIREFOX_EXECUTABLE ? lines(process.env.FIREFOX_EXECUTABLE, ['--version'], { env: { ...process.env, MOZ_HEADLESS: '1' } })[0] : null,
  },
  tests: { total: 1328, retainedThroughPhase12: 1319, phase13: 9 },
  archives: {
    source: { filename: path.basename(SOURCE_ZIP), ...sourceArchive },
    web: { filename: path.basename(WEB_ZIP), ...webArchive },
  },
  ci: { runId: process.env.GITHUB_RUN_ID ?? null, runUrl: process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null },
  publicDeployment: previousManifest?.publicDeployment ?? { status: 'pending', url: null },
  signoff: previousManifest?.signoff ?? { status: 'pending-public-validation', passed: false },
  tag: previousManifest?.tag ?? null,
  releaseUrl: previousManifest?.releaseUrl ?? null,
};
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(CHECKSUMS, `${sourceArchive.sha256}  ${path.basename(SOURCE_ZIP)}\n${webArchive.sha256}  ${path.basename(WEB_ZIP)}\n`);
await writeJson('PHASE13_PACKAGE_BUILD.json', {
  generatedAt: manifest.generatedAt,
  sourceManifestDigest: source.digest,
  productionBundleDigest: bundle?.digest ?? null,
  sourceArchive,
  webArchive,
  manifest: path.relative(ROOT, MANIFEST),
  checksums: path.relative(ROOT, CHECKSUMS),
  passed: true,
});
console.log(JSON.stringify({ passed: true, sourceArchive, webArchive, sourceManifestDigest: source.digest, productionBundleDigest: bundle?.digest }, null, 2));
