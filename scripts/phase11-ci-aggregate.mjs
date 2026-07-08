import path from 'node:path';
import { DOCS, packageMetadata, readJson, sourceManifest, writeJson } from './phase11-utils.mjs';
const pkg = await packageMetadata(); const source = await sourceManifest();
const files = {
  core: 'PHASE10_CORE_VALIDATION.json',
  chromium: 'PHASE11_BROWSER_CHROMIUM_VALIDATION.json',
  firefox: 'PHASE11_BROWSER_FIREFOX_VALIDATION.json',
  deployment: 'PHASE11_DEPLOYMENT_VALIDATION.json',
  determinism: 'PHASE11_CROSS_BROWSER_DETERMINISM.json',
};
const evidence = {};
for (const [key, filename] of Object.entries(files)) evidence[key] = await readJson(path.join(DOCS, filename));
const checks = {
  core: evidence.core?.passed === true,
  chromium: evidence.chromium?.passed === true,
  firefox: evidence.firefox?.passed === true && evidence.firefox?.gameCodeExecuted === true,
  deployment: evidence.deployment?.passed === true,
  determinism: evidence.determinism?.passed === true,
};
const report = {
  generatedAt: new Date().toISOString(), phase: 11, scope: 'GitHub Actions certification aggregate',
  packageVersion: pkg.version, sourceManifestDigest: source.digest,
  evidenceFiles: files, checks, passed: Object.values(checks).every(Boolean),
};
await writeJson('PHASE11_CI_AGGREGATE.json', report);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
