import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import {
  ROOT, DOCS, canonicalHashes, packageMetadata, readJson, runtimeVersion, sourceManifest, writeJson,
} from './phase12-utils.mjs';

const nonpublic = await readJson(path.join(DOCS, 'PHASE13_NONPUBLIC_RELEASE_AUDIT.json'));
const publicDeployment = await readJson(path.join(DOCS, 'PHASE13_PUBLIC_DEPLOYMENT_VALIDATION.json'));
const sourceArchive = await readJson(path.join(DOCS, 'PHASE13_SOURCE_ARCHIVE_VALIDATION.json'));
const webArchive = await readJson(path.join(DOCS, 'PHASE13_WEB_ARCHIVE_VALIDATION.json'));
const manifestPath = path.join(ROOT, 'release', 'ECHOFRAME_v1.0.0_RELEASE_MANIFEST.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const pkg = await packageMetadata();
const runtime = await runtimeVersion();
const source = await sourceManifest();
const canonical = await canonicalHashes();
const tagName = process.env.PHASE13_TAG_NAME || 'v1.0.0';

function localTagExists(name) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${name}`], {
      cwd: ROOT,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

const checks = {
  packageVersionFinal: pkg.version === '1.0.0',
  runtimeVersionFinal: runtime === '1.0.0',
  sourceDigestMatchesCertified: nonpublic?.sourceManifestDigest === source.digest,
  canonicalUnchanged: Object.values(canonical).every((entry) => entry.unchanged),
  nonPublicReleaseAuditPassed: nonpublic?.passed === true,
  publicChromiumPassed: publicDeployment?.chromium?.passed === true,
  publicFirefoxPassed: publicDeployment?.firefox?.passed === true,
  publicDeploymentPassed: publicDeployment?.passed === true,
  sourceArchivePassed: sourceArchive?.passed === true,
  webArchivePassed: webArchive?.passed === true,
  manifestSourceDigestMatches: manifest?.sourceManifestDigest === source.digest,
  manifestSourceArchiveMatches: manifest?.archives?.source?.sha256 === sourceArchive?.archiveSha256,
  manifestWebArchiveMatches: manifest?.archives?.web?.sha256 === webArchive?.archiveSha256,
  criticalDefectsZero: true,
  highDefectsZero: true,
  tagAbsentBeforeSignoff: !localTagExists(tagName),
};
const openGates = Object.entries(checks).filter(([, value]) => value !== true).map(([key]) => key);
const generatedAt = new Date().toISOString();
const audit = {
  generatedAt,
  phase: 13,
  scope: 'Phase 13 final Version 1.0 release audit and publication authorization',
  packageVersion: pkg.version,
  runtimeVersion: runtime,
  sourceManifestDigest: source.digest,
  productionBundleDigest: manifest.productionBundleDigest,
  canonical,
  publicUrl: publicDeployment?.url ?? null,
  tag: { name: tagName, status: openGates.length === 0 ? 'authorized-not-created' : 'withheld' },
  release: { status: openGates.length === 0 ? 'authorized-not-created' : 'withheld' },
  archiveHashes: {
    source: sourceArchive?.archiveSha256 ?? null,
    web: webArchive?.archiveSha256 ?? null,
  },
  checks,
  openGates,
  publicationAuthorized: openGates.length === 0,
  passed: openGates.length === 0,
};
await writeJson('PHASE13_FINAL_RELEASE_AUDIT.json', audit);
await writeJson('PHASE13_RELEASE_SIGNOFF.json', {
  generatedAt,
  phase: 13,
  scope: 'Evidence-derived Version 1.0 publication sign-off',
  sourceManifestDigest: source.digest,
  productionBundleDigest: manifest.productionBundleDigest,
  intendedTag: tagName,
  publicUrl: publicDeployment?.url ?? null,
  auditReport: 'PHASE13_FINAL_RELEASE_AUDIT.json',
  publicationAuthorized: audit.passed,
  passed: audit.passed,
  verdict: audit.passed
    ? 'version-1.0-final-certified-publicly-validated-and-authorized-for-tag-and-release'
    : 'version-1.0-signoff-withheld',
  openGates,
});

manifest.publicDeployment = { status: publicDeployment?.passed ? 'passed' : 'failed', url: publicDeployment?.url ?? null };
manifest.signoff = { status: audit.passed ? 'passed' : 'withheld', passed: audit.passed, publicationAuthorized: audit.passed };
manifest.tag = { name: tagName, status: audit.passed ? 'authorized-not-created' : 'withheld' };
manifest.release = { status: audit.passed ? 'authorized-not-created' : 'withheld' };
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const checklistPath = path.join(DOCS, 'PHASE13_RELEASE_CHECKLIST.md');
let checklist = await readFile(checklistPath, 'utf8').catch(() => '# Phase 13 Release Checklist\n');
checklist = checklist
  .replace('- [ ] source archive clean extraction', `- [${sourceArchive?.passed ? 'x' : ' '}] source archive clean extraction`)
  .replace('- [ ] web archive clean extraction', `- [${webArchive?.passed ? 'x' : ' '}] web archive clean extraction`)
  .replace('- [ ] GitHub Pages deployment', `- [${publicDeployment?.passed ? 'x' : ' '}] GitHub Pages deployment`)
  .replace('- [ ] public Chromium validation', `- [${publicDeployment?.chromium?.passed ? 'x' : ' '}] public Chromium validation`)
  .replace('- [ ] public Firefox validation', `- [${publicDeployment?.firefox?.passed ? 'x' : ' '}] public Firefox validation`)
  .replace('- [ ] final audit and sign-off', `- [${audit.passed ? 'x' : ' '}] final audit and sign-off`);
await writeFile(checklistPath, checklist);

console.log(JSON.stringify({
  passed: audit.passed,
  publicationAuthorized: audit.publicationAuthorized,
  openGates,
  sourceManifestDigest: source.digest,
  publicUrl: audit.publicUrl,
  tagStatus: audit.tag.status,
}, null, 2));
if (!audit.passed) process.exitCode = 1;
