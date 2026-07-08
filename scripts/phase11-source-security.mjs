import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { ROOT, DOCS, packageMetadata, readJson, sourceManifest, writeJson } from './phase11-utils.mjs';
const commands = [
  ['npm', ['run', 'audit:source']],
  ['npm', ['run', 'audit:security']],
];
const commandResults = [];
for (const [command, args] of commands) {
  try { execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' }); commandResults.push({ command: `${command} ${args.join(' ')}`, passed: true }); }
  catch (error) { commandResults.push({ command: `${command} ${args.join(' ')}`, passed: false, error: error.message }); }
}
let npmAudit = null;
try { npmAudit = JSON.parse(execFileSync('npm', ['audit', '--json'], { cwd: ROOT, encoding: 'utf8' })); }
catch (error) { try { npmAudit = JSON.parse(error.stdout); } catch { npmAudit = { error: error.message }; } }
const source10 = await readJson(path.join(DOCS, 'PHASE10_SOURCE_AUDIT.json'));
const security10 = await readJson(path.join(DOCS, 'PHASE10_SECURITY_AUDIT.json'));
const source = await sourceManifest(); const pkg = await packageMetadata();
const runtimeVersion = (await readFile(path.join(ROOT, 'src/utils/version.js'), 'utf8')).match(/BUILD_VERSION\s*=\s*'([^']+)'/)?.[1] ?? null;
const sourceReport = {
  generatedAt: new Date().toISOString(), phase: 11, packageVersion: pkg.version, runtimeVersion,
  sourceManifestDigest: source.digest, inheritedAudit: 'PHASE10_SOURCE_AUDIT.json', findings: source10?.findings ?? source10?.results ?? null,
  phase10Passed: source10?.passed === true, commandPassed: commandResults[0]?.passed === true,
  passed: source10?.passed === true && commandResults[0]?.passed === true,
};
const securityReport = {
  generatedAt: new Date().toISOString(), phase: 11, packageVersion: pkg.version, runtimeVersion,
  sourceManifestDigest: source.digest, inheritedAudit: 'PHASE10_SECURITY_AUDIT.json', findings: security10?.findings ?? security10?.results ?? null,
  phase10Passed: security10?.passed === true, commandPassed: commandResults[1]?.passed === true,
  passed: security10?.passed === true && commandResults[1]?.passed === true,
};
const npmReport = {
  generatedAt: new Date().toISOString(), phase: 11, packageVersion: pkg.version, sourceManifestDigest: source.digest,
  metadata: npmAudit?.metadata ?? null, vulnerabilities: npmAudit?.vulnerabilities ?? null,
  passed: npmAudit?.metadata?.vulnerabilities?.total === 0,
};
await writeJson('PHASE11_SOURCE_AUDIT.json', sourceReport);
await writeJson('PHASE11_SECURITY_AUDIT.json', securityReport);
await writeJson('PHASE11_NPM_AUDIT.json', npmReport);
console.log(JSON.stringify({ source: sourceReport.passed, security: securityReport.passed, npm: npmReport.passed, sourceManifestDigest: source.digest }, null, 2));
if (![sourceReport.passed, securityReport.passed, npmReport.passed].every(Boolean)) process.exitCode = 1;
