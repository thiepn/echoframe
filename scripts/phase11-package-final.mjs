import path from 'node:path';
import { cp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  ROOT, DOCS, canonicalHashes, packageMetadata, productionBundleDigest, readJson, sourceManifest,
} from './phase11-utils.mjs';

const pkg = await packageMetadata();
const audit = await readJson(path.join(DOCS, 'PHASE11_FINAL_RELEASE_AUDIT.json'));
const signoff = await readJson(path.join(DOCS, 'PHASE11_RELEASE_SIGNOFF.json'));
if (pkg.version !== '1.0.0' || audit?.passed !== true || signoff?.passed !== true) {
  console.error(JSON.stringify({
    packaged: false,
    reason: 'Final packaging refused: Version 1.0 identity and evidence-derived sign-off are mandatory.',
    packageVersion: pkg.version,
    auditPassed: audit?.passed ?? false,
    signoffPassed: signoff?.passed ?? false,
    openGates: audit?.openGates ?? ['missing-final-audit'],
  }, null, 2));
  process.exit(1);
}

const sourceOutput = '/mnt/data/ECHOFRAME_v1.0.0_final_source.zip';
const webOutput = '/mnt/data/ECHOFRAME_v1.0.0_web.zip';
const staging = '/mnt/data/ECHOFRAME_v1_final_source_staging';
const webStaging = '/mnt/data/ECHOFRAME_v1_web_staging';
const dist = path.join(ROOT, 'dist-phase11-final');
const excludedDirectories = new Set(['node_modules', '.git', 'test-results', 'playwright-report', '.phase11-ci-artifacts']);
function include(source) {
  const relative = path.relative(ROOT, source).replaceAll(path.sep, '/');
  if (!relative) return true;
  const parts = relative.split('/');
  if (excludedDirectories.has(parts[0])) return false;
  if (parts[0] === 'dist' || parts[0].startsWith('dist-')) return false;
  if (relative.endsWith('.zip') || relative.endsWith('.dmp') || relative.endsWith('.log')) return false;
  if (relative.startsWith('docs/screenshots/ECHOFRAME_phase10_')) return false;
  return true;
}
async function zipMetrics(filename) {
  const entries = execFileSync('zipinfo', ['-1', filename], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const body = await readFile(filename);
  return {
    name: path.basename(filename), sha256: createHash('sha256').update(body).digest('hex'), bytes: (await stat(filename)).size,
    rawZipEntryCount: entries.length, regularFileCount: entries.filter((entry) => !entry.endsWith('/')).length,
    directoryEntryCount: entries.filter((entry) => entry.endsWith('/')).length,
  };
}

await rm(staging, { recursive: true, force: true }); await rm(webStaging, { recursive: true, force: true });
await rm(sourceOutput, { force: true }); await rm(webOutput, { force: true }); await rm(dist, { recursive: true, force: true });
await cp(ROOT, staging, { recursive: true, filter: include, preserveTimestamps: true });
execFileSync('zip', ['-q', '-r', sourceOutput, '.'], { cwd: staging, stdio: 'inherit' });
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', 'dist-phase11-final'], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' },
});
await cp(dist, webStaging, { recursive: true, preserveTimestamps: true });
execFileSync('zip', ['-q', '-r', webOutput, '.'], { cwd: webStaging, stdio: 'inherit' });
const sourceInfo = await zipMetrics(sourceOutput); const webInfo = await zipMetrics(webOutput);
const source = await sourceManifest(); const bundle = await productionBundleDigest(dist); const canonical = await canonicalHashes();
const manifest = {
  generatedAt: new Date().toISOString(), phase: 11, status: 'version-1.0-final', packageVersion: pkg.version,
  archives: [sourceInfo, webInfo], sourceManifestDigest: source.digest, productionBundleDigest: bundle?.digest ?? null,
  canonical, finalReleaseSignoff: true, publicDeployment: await readJson(path.join(DOCS, 'PHASE11_PUBLIC_DEPLOYMENT_VALIDATION.json')),
  archiveMetricDefinitions: {
    rawZipEntryCount: 'All ZIP central-directory entries, including directories.',
    regularFileCount: 'Non-directory ZIP entries.',
    directoryEntryCount: 'Explicit directory ZIP entries.',
  },
};
await writeFile('/mnt/data/ECHOFRAME_v1.0.0_RELEASE_MANIFEST.json', `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile('/mnt/data/ECHOFRAME_v1.0.0_SHA256SUMS.txt', `${sourceInfo.sha256}  ${sourceInfo.name}\n${webInfo.sha256}  ${webInfo.name}\n`);
console.log(JSON.stringify(manifest, null, 2));
