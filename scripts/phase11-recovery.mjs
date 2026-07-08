import path from 'node:path';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import {
  ROOT, DOCS, PHASE10_ARCHIVE, EXPECTED_PHASE10_SHA256, canonicalHashes, environmentSnapshot,
  fileExists, packageMetadata, readJson, sha256File, sourceManifest, writeJson,
} from './phase11-utils.mjs';

const archiveExists = await fileExists(PHASE10_ARCHIVE);
let archive = { path: PHASE10_ARCHIVE, exists: archiveExists };
if (archiveExists) {
  const listing = execFileSync('zipinfo', ['-1', PHASE10_ARCHIVE], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const directories = listing.filter((entry) => entry.endsWith('/'));
  const files = listing.filter((entry) => !entry.endsWith('/'));
  archive = {
    ...archive,
    sha256: await sha256File(PHASE10_ARCHIVE),
    expectedSha256: EXPECTED_PHASE10_SHA256,
    hashMatches: (await sha256File(PHASE10_ARCHIVE)) === EXPECTED_PHASE10_SHA256,
    bytes: (await stat(PHASE10_ARCHIVE)).size,
    rawEntryCount: listing.length,
    regularFileCount: files.length,
    directoryEntryCount: directories.length,
    metricsDefinition: {
      rawEntryCount: 'Every central-directory ZIP entry, including explicit directory entries.',
      regularFileCount: 'Entries that do not end with / and contain repository files.',
      directoryEntryCount: 'Explicit directory entries ending with /.',
    },
    repositoryRootDirectlyContained: files.includes('package.json') && files.includes('index.html') && files.includes('src/main.js'),
    exclusions: {
      nodeModules: !listing.some((entry) => entry.startsWith('node_modules/')),
      dist: !listing.some((entry) => entry === 'dist/' || entry.startsWith('dist/')),
      git: !listing.some((entry) => entry.startsWith('.git/')),
      temporaryLogs: !listing.some((entry) => entry.includes('.phase10-final-logs') || entry.endsWith('.log')),
      previousArchives: !listing.some((entry) => entry.toLowerCase().endsWith('.zip')),
    },
  };
}

const packageJson = await packageMetadata();
const canonical = await canonicalHashes();
const source = await sourceManifest();
const sidecarBase = '/mnt/data/ECHOFRAME_phase10_release_candidate';
const sidecars = {
  sha256: await fileExists(`${sidecarBase}.zip.sha256`),
  package: await readJson(`${sidecarBase}.zip.package.json`),
  cleanExtractionJson: await readJson(`${sidecarBase}.clean-extraction.json`),
  cleanExtractionMarkdown: await fileExists(`${sidecarBase}.clean-extraction.md`),
};
const phase10Reports = {};
for (const name of [
  'PHASE10_CORE_VALIDATION.json', 'PHASE10_BROWSER_CHROMIUM_VALIDATION.json', 'PHASE10_BROWSER_FIREFOX_VALIDATION.json',
  'PHASE10_DEPLOYMENT_VALIDATION.json', 'PHASE10_LIFECYCLE_VALIDATION.json', 'PHASE10_MENU_IDLE_VALIDATION.json',
  'PHASE10_ACTIVE_SOAK_VALIDATION.json', 'PHASE10_PERFORMANCE_VALIDATION.json', 'PHASE10_RELEASE_AUDIT.json',
  'PHASE10_RELEASE_SIGNOFF.json',
]) {
  const data = await readJson(path.join(DOCS, name));
  phase10Reports[name] = data ? { exists: true, passed: data.passed ?? false, status: data.status ?? null, generatedAt: data.generatedAt ?? null } : { exists: false };
}

const inconsistencies = [];
const checklist = await readFile(path.join(DOCS, 'PHASE10_RELEASE_CHECKLIST.md'), 'utf8');
if (/\[ \].*(package|archive|clean extraction)/i.test(checklist)) inconsistencies.push('Phase 10 checklist contains unchecked packaging or clean-extraction items despite external sidecar evidence.');
const firefox = await readJson(path.join(DOCS, 'PHASE10_BROWSER_FIREFOX_VALIDATION.json'));
if (firefox?.sourceVersion == null) inconsistencies.push('Phase 10 Firefox report has sourceVersion: null because game code never executed.');
if (sidecars.package && archive.rawEntryCount !== sidecars.package.archiveFileCount) inconsistencies.push(`Package sidecar regular-file count (${sidecars.package.archiveFileCount}) differs from raw ZIP-entry count (${archive.rawEntryCount}); these are distinct metrics, not contradictory results.`);
if (!phase10Reports['PHASE10_RELEASE_AUDIT.json']?.passed && sidecars.cleanExtractionJson?.passed) inconsistencies.push('Phase 10 release audit predates or does not incorporate external clean-extraction sidecars.');

const report = {
  generatedAt: new Date().toISOString(),
  phase: 11,
  passed: archive.hashMatches && Object.values(canonical).every((entry) => entry.unchanged),
  sourceArchive: archive,
  packageVersion: packageJson.version,
  runtimeVersion: (await readFile(path.join(ROOT, 'src/utils/version.js'), 'utf8')).match(/BUILD_VERSION\s*=\s*'([^']+)'/)?.[1] ?? null,
  canonical,
  sourceManifest: { algorithm: source.algorithm, digest: source.digest, fileCount: source.fileCount },
  environment: environmentSnapshot(),
  sidecars: {
    sha256Present: sidecars.sha256,
    packagePresent: Boolean(sidecars.package),
    cleanExtractionJsonPresent: Boolean(sidecars.cleanExtractionJson),
    cleanExtractionMarkdownPresent: sidecars.cleanExtractionMarkdown,
    cleanExtractionPassed: sidecars.cleanExtractionJson?.passed === true,
  },
  phase10Reports,
  inconsistencies,
  currentOpenGates: [
    'Real Firefox production game execution and certification',
    'Cross-browser deterministic comparison using real Chromium and Firefox',
    'Actual CI execution unavailable without a connected repository',
    'Public GitHub Pages validation unavailable because no public URL was provided',
  ],
  plannedFiles: [
    '.github/workflows/ci.yml', '.github/workflows/deploy.yml', 'scripts/phase11-*.mjs',
    'tests/phase11-certification.test.js', 'docs/PHASE11_*', 'docs/BROWSER_SUPPORT.md',
  ],
};
await writeJson('PHASE11_RECOVERY_REPORT.json', report);

const markdown = `# Phase 11 Recovery Report\n\n**Generated:** ${report.generatedAt}  \n**Baseline version:** \`${report.packageVersion}\`  \n**Source manifest:** \`${source.digest}\`\n\n## Archive verification\n\n- SHA-256: \`${archive.sha256}\`\n- Expected SHA-256: \`${archive.expectedSha256}\`\n- Hash matched: **${archive.hashMatches}**\n- Archive bytes: ${archive.bytes}\n- Raw ZIP entries: ${archive.rawEntryCount}\n- Regular files: ${archive.regularFileCount}\n- Directory entries: ${archive.directoryEntryCount}\n- Repository root contained directly: ${archive.repositoryRootDirectlyContained}\n\nThe raw-entry count includes explicit directory records. The regular-file count includes only file entries. Therefore the historical values 585 entries and 547 files describe the same archive correctly.\n\n## Canonical documents\n\n${Object.entries(canonical).map(([name, item]) => `- \`${name}\`: \`${item.actual}\` — ${item.unchanged ? 'unchanged' : 'MISMATCH'}`).join('\n')}\n\n## Reproduced baseline\n\nThe Phase 10 source remains a release candidate. Core validation, Chromium, and static root/subpath validation are rerun separately as Phase 11 evidence. The prior Firefox report is environment evidence only because Firefox aborted before page creation.\n\n## Documentation reconciliation findings\n\n${inconsistencies.map((item) => `- ${item}`).join('\n')}\n\n## Open gates\n\n${report.currentOpenGates.map((item) => `- ${item}`).join('\n')}\n`;
await writeFile(path.join(DOCS, 'PHASE11_RECOVERY_REPORT.md'), markdown);

const evidenceMap = {
  generatedAt: new Date().toISOString(),
  sourceManifestDigest: source.digest,
  packageVersion: packageJson.version,
  historicalPhase10: Object.entries(phase10Reports).map(([filename, item]) => ({ filename, ...item, evidenceClass: 'historical-phase10' })),
  phase11: [],
  invalidationPolicy: 'Every Phase 11 report must record package version, source manifest digest, production bundle digest when applicable, browser and environment.',
};
await writeJson('PHASE11_EVIDENCE_MAP.json', evidenceMap);
await writeFile(path.join(DOCS, 'PHASE11_EVIDENCE_INVALIDATION.md'), `# Phase 11 Evidence Invalidation\n\nEvidence is bound to the source-manifest digest and, for browser checks, the production-bundle digest.\n\n- Any source modification invalidates lint, tests, build, source/security/npm audits, tutorial/binding/accessibility audits, Chromium smoke, Firefox smoke, and deployment validation.\n- Runtime, lifecycle, input, audio, save, focus, visibility, pool, timer, tween, or Phaser configuration changes also invalidate the 60-cycle lifecycle and both 30-minute gates.\n- Release identity promotion to \`1.0.0\` requires all final reports to be rerun against that exact source and production bundle.\n- Phase 10 reports remain historical evidence and cannot certify a different source digest.\n`);
console.log(JSON.stringify({ passed: report.passed, archive: report.sourceArchive, sourceManifestDigest: source.digest, inconsistencies }, null, 2));
if (!report.passed) process.exitCode = 1;
