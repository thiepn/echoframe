import path from 'node:path';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ROOT, canonicalHashes, packageMetadata, productionBundleDigest, sourceManifest } from './phase11-utils.mjs';

const sourceOutput = process.env.PHASE11_CANDIDATE_SOURCE_ZIP || '/mnt/data/ECHOFRAME_phase11_certification_candidate.zip';
const webOutput = process.env.PHASE11_CANDIDATE_WEB_ZIP || '/mnt/data/ECHOFRAME_phase11_certification_candidate_web.zip';
const staging = '/mnt/data/ECHOFRAME_phase11_candidate_staging';
const webStaging = '/mnt/data/ECHOFRAME_phase11_candidate_web_staging';
const dist = path.join(ROOT, 'dist-phase11-candidate');
const excludedDirectories = new Set(['node_modules', '.git', 'test-results', 'playwright-report', '.phase11-ci-artifacts']);
const excludedTopLevelPrefixes = ['dist'];

function include(source) {
  const relative = path.relative(ROOT, source).replaceAll(path.sep, '/');
  if (!relative) return true;
  const parts = relative.split('/');
  if (excludedDirectories.has(parts[0])) return false;
  if (excludedTopLevelPrefixes.some((prefix) => parts[0] === prefix || parts[0].startsWith(`${prefix}-`))) return false;
  if (relative.endsWith('.zip') || relative.endsWith('.dmp') || relative.endsWith('.log')) return false;
  return true;
}
async function regularFiles(directory, base = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await regularFiles(absolute, base));
    else files.push(path.relative(base, absolute).replaceAll(path.sep, '/'));
  }
  return files.sort();
}
async function metrics(filename) {
  const listing = execFileSync('zipinfo', ['-1', filename], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const buffer = await readFile(filename);
  return {
    name: path.basename(filename), sha256: createHash('sha256').update(buffer).digest('hex'), bytes: (await stat(filename)).size,
    rawZipEntryCount: listing.length, regularFileCount: listing.filter((entry) => !entry.endsWith('/')).length,
    directoryEntryCount: listing.filter((entry) => entry.endsWith('/')).length,
  };
}

const pkg = await packageMetadata();
if (pkg.version === '1.0.0') throw new Error('Candidate packaging is not used after final promotion.');
await rm(staging, { recursive: true, force: true }); await rm(webStaging, { recursive: true, force: true });
await rm(sourceOutput, { force: true }); await rm(webOutput, { force: true }); await rm(dist, { recursive: true, force: true });
await cp(ROOT, staging, { recursive: true, filter: include, preserveTimestamps: true });
execFileSync('zip', ['-q', '-r', sourceOutput, '.'], { cwd: staging, stdio: 'inherit' });
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', 'dist-phase11-candidate'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
});
await cp(dist, webStaging, { recursive: true, preserveTimestamps: true });
execFileSync('zip', ['-q', '-r', webOutput, '.'], { cwd: webStaging, stdio: 'inherit' });
const sourceInfo = await metrics(sourceOutput); const webInfo = await metrics(webOutput);
const source = await sourceManifest(); const bundle = await productionBundleDigest(dist); const canonical = await canonicalHashes();
const manifest = {
  generatedAt: new Date().toISOString(), phase: 11, status: 'certification-candidate-not-final',
  packageVersion: pkg.version, sourceManifestDigest: source.digest, productionBundleDigest: bundle?.digest ?? null,
  archives: [sourceInfo, webInfo], canonical,
  finalReleaseSignoff: false,
  blockers: ['Real Firefox game execution and certification', 'Final 1.0 promotion and final-source long-session reruns', 'Actual public deployment validation'],
  archiveMetricDefinitions: {
    rawZipEntryCount: 'All ZIP central-directory entries, including directories.',
    regularFileCount: 'Non-directory ZIP entries.',
    directoryEntryCount: 'Explicit directory ZIP entries.',
  },
};
const manifestPath = '/mnt/data/ECHOFRAME_phase11_CERTIFICATION_MANIFEST.json';
const sumsPath = '/mnt/data/ECHOFRAME_phase11_SHA256SUMS.txt';
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(sumsPath, `${sourceInfo.sha256}  ${sourceInfo.name}\n${webInfo.sha256}  ${webInfo.name}\n`);
console.log(JSON.stringify({ source: sourceInfo, web: webInfo, manifestPath, sumsPath }, null, 2));
