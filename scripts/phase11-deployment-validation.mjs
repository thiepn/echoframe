import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { ROOT, DOCS, fileExists, packageMetadata, readJson, sourceManifest, writeJson } from './phase11-utils.mjs';
const env = { ...process.env };
if (!env.CHROMIUM_EXECUTABLE && await fileExists('/usr/bin/chromium')) env.CHROMIUM_EXECUTABLE = '/usr/bin/chromium';
let commandError = null;
try { execFileSync('npm', ['run', 'validate:deployment:phase10'], { cwd: ROOT, env, stdio: 'inherit' }); }
catch (error) { commandError = error.message; }
const base = await readJson(path.join(DOCS, 'PHASE10_DEPLOYMENT_VALIDATION.json'));
const source = await sourceManifest(); const pkg = await packageMetadata();
const runtimeVersion = (await readFile(path.join(ROOT, 'src/utils/version.js'), 'utf8')).match(/BUILD_VERSION\s*=\s*'([^']+)'/)?.[1] ?? null;
const report = {
  generatedAt: new Date().toISOString(), phase: 11, scope: 'Local production root/subpath deployment',
  packageVersion: pkg.version, runtimeVersion, sourceManifestDigest: source.digest,
  browser: { engine: 'chromium', executable: env.CHROMIUM_EXECUTABLE ?? 'playwright-managed' },
  bases: base?.roots ?? base?.bases ?? [], commandError,
  passed: commandError == null && base?.passed === true,
  publicDeploymentEvidence: false,
  note: 'This report validates local static production output only. It is not evidence of a public GitHub Pages deployment.',
};
await writeJson('PHASE11_DEPLOYMENT_VALIDATION.json', report);
console.log(JSON.stringify({ passed: report.passed, bases: report.bases.map(({ base, passed }) => ({ base, passed })) }, null, 2));
if (!report.passed) process.exitCode = 1;
