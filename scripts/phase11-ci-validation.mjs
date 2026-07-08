import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { ROOT, packageMetadata, sourceManifest, writeJson } from './phase11-utils.mjs';
const ciPath = path.join(ROOT, '.github/workflows/ci.yml');
const deployPath = path.join(ROOT, '.github/workflows/deploy.yml');
const ci = await readFile(ciPath, 'utf8'); const deploy = await readFile(deployPath, 'utf8');
const source = await sourceManifest(); const pkg = await packageMetadata();
const ciTerms = [
  'core-validation:', 'chromium-production:', 'firefox-production:', 'static-deployment:', 'release-audit:',
  'npm ci', 'playwright install --with-deps chromium', 'playwright install --with-deps firefox',
  'validate:browser:phase11', 'validate:browser:firefox:phase11', 'validate:deployment:phase11',
  'actions/upload-artifact@v4', 'continue-on-error: false',
];
const deployTerms = [
  'workflow_run:', 'ECHOFRAME CI', "github.event.workflow_run.conclusion == 'success'",
  'actions/configure-pages@v5', 'actions/upload-pages-artifact@v3', 'actions/deploy-pages@v4', 'VITE_BASE_PATH',
  'npm run validate:core:phase10',
];
const checks = {
  ciWorkflowPresent: ci.length > 0,
  ciRequiredStructure: ciTerms.every((term) => ci.includes(term)),
  deployWorkflowPresent: deploy.length > 0,
  deployRequiresCertification: deployTerms.every((term) => deploy.includes(term)),
  minimalCiPermissions: /permissions:\s*\n\s*contents:\s*read/.test(ci),
  explicitDeployPermissions: ['contents: read', 'pages: write', 'id-token: write'].every((term) => deploy.includes(term)),
  noContinueOnErrorTrue: !/continue-on-error:\s*true/.test(ci + deploy),
};
const report = {
  generatedAt: new Date().toISOString(), phase: 11, packageVersion: pkg.version, sourceManifestDigest: source.digest,
  checks, structurePassed: Object.values(checks).every(Boolean), actualGitHubExecutionAvailable: false,
  status: 'structure-validated-execution-unavailable',
  passed: false,
  note: 'Workflow structure is locally validated. No connected repository or GitHub Actions run was provided, so CI execution cannot be marked passed.',
};
await writeJson('PHASE11_CI_VALIDATION.json', report);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.passed ? 0 : 1;
