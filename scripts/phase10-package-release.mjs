import path from 'node:path';
import { cp, rm, stat, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ROOT } from './phase10-browser-helpers.mjs';

const output = process.env.PHASE10_RELEASE_ZIP || '/mnt/data/ECHOFRAME_phase10_release_candidate.zip';
const staging = process.env.PHASE10_RELEASE_STAGING || '/mnt/data/ECHOFRAME_phase10_release_staging';
const excludedDirectories = ['node_modules', '.git', '.phase10-final-logs', 'test-results', 'playwright-report'];
const excludedTopLevelPrefixes = ['dist'];
const excludedFiles = [];
function include(source) {
  const rel = path.relative(ROOT, source).replaceAll(path.sep, '/');
  if (!rel) return true;
  const parts = rel.split('/');
  if (excludedDirectories.includes(parts[0])) { excludedFiles.push(rel); return false; }
  if (excludedTopLevelPrefixes.some((prefix) => parts.length === 1 ? parts[0].startsWith(prefix) : parts[0].startsWith(`${prefix}-`) || parts[0] === prefix)) { excludedFiles.push(rel); return false; }
  if (rel.endsWith('.zip') || rel.endsWith('.dmp') || rel.endsWith('.log')) { excludedFiles.push(rel); return false; }
  if (rel.startsWith('docs/screenshots/') && !path.basename(rel).startsWith('ECHOFRAME_phase10_')) { excludedFiles.push(rel); return false; }
  return true;
}
async function filesRecursive(directory, base = directory) {
  const out = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await filesRecursive(target, base));
    else out.push(path.relative(base, target).replaceAll(path.sep, '/'));
  }
  return out;
}
await rm(staging, { recursive: true, force: true });
await rm(output, { force: true });
await cp(ROOT, staging, { recursive: true, filter: include, preserveTimestamps: true });
execFileSync('zip', ['-q', '-r', output, '.'], { cwd: staging, stdio: 'inherit' });
const archive = await readFile(output);
const files = await filesRecursive(staging);
const report = {
  generatedAt: new Date().toISOString(),
  archive: path.basename(output),
  sha256: createHash('sha256').update(archive).digest('hex'),
  archiveBytes: (await stat(output)).size,
  archiveFileCount: files.length,
  repositoryRootDirectlyContained: true,
  excludedDirectories,
  excludedTopLevelPrefixes,
  excludedEntryCount: excludedFiles.length,
  includedFiles: files,
};
await writeFile(`${output}.package.json`, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(`${output}.sha256`, `${report.sha256}  ${path.basename(output)}\n`);
console.log(JSON.stringify({ archive: output, sha256: report.sha256, archiveBytes: report.archiveBytes, archiveFileCount: report.archiveFileCount }, null, 2));
