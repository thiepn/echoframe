import path from 'node:path';
import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ROOT, writeJson } from './phase11-utils.mjs';

const sourceZip = process.env.PHASE11_CANDIDATE_SOURCE_ZIP || '/mnt/data/ECHOFRAME_phase11_certification_candidate.zip';
const webZip = process.env.PHASE11_CANDIDATE_WEB_ZIP || '/mnt/data/ECHOFRAME_phase11_certification_candidate_web.zip';
const sourceDir = '/mnt/data/ECHOFRAME_phase11_candidate_clean_source';
const webDir = '/mnt/data/ECHOFRAME_phase11_candidate_clean_web';
async function hash(filename) { return createHash('sha256').update(await readFile(filename)).digest('hex'); }
async function contains(directory, name) { try { return (await readdir(directory)).includes(name); } catch { return false; } }
await rm(sourceDir, { recursive: true, force: true }); await rm(webDir, { recursive: true, force: true });
await mkdir(sourceDir, { recursive: true }); await mkdir(webDir, { recursive: true });
execFileSync('unzip', ['-q', sourceZip, '-d', sourceDir]); execFileSync('unzip', ['-q', webZip, '-d', webDir]);
const sourceChecks = {
  rootPackage: await contains(sourceDir, 'package.json'), rootIndex: await contains(sourceDir, 'index.html'), rootSrc: await contains(sourceDir, 'src'),
  excludesNodeModules: !(await contains(sourceDir, 'node_modules')), excludesDist: !(await contains(sourceDir, 'dist')), excludesGit: !(await contains(sourceDir, '.git')),
};
let sourceValidation = { npmCi: false, lint: false, tests: false, build: false };
try { execFileSync('npm', ['ci'], { cwd: sourceDir, stdio: 'inherit' }); sourceValidation.npmCi = true; } catch {}
try { execFileSync('npm', ['run', 'lint'], { cwd: sourceDir, stdio: 'inherit' }); sourceValidation.lint = true; } catch {}
try { execFileSync('npm', ['run', 'test'], { cwd: sourceDir, stdio: 'inherit' }); sourceValidation.tests = true; } catch {}
try { execFileSync('npm', ['run', 'build'], { cwd: sourceDir, stdio: 'inherit' }); sourceValidation.build = true; } catch {}
const webChecks = {
  rootIndex: await contains(webDir, 'index.html'), assets: await contains(webDir, 'assets'), noSource: !(await contains(webDir, 'src')), noTests: !(await contains(webDir, 'tests')),
};
const report = {
  generatedAt: new Date().toISOString(), phase: 11, status: 'certification-candidate-clean-extraction',
  sourceArchive: { path: sourceZip, sha256: await hash(sourceZip), bytes: (await stat(sourceZip)).size, checks: sourceChecks, validation: sourceValidation },
  webArchive: { path: webZip, sha256: await hash(webZip), bytes: (await stat(webZip)).size, checks: webChecks },
  passed: Object.values(sourceChecks).every(Boolean) && Object.values(sourceValidation).every(Boolean) && Object.values(webChecks).every(Boolean),
  note: 'This validates certification-candidate archives only. It is not Version 1.0 final archive evidence.',
};
await writeJson('PHASE11_CANDIDATE_ARCHIVE_VALIDATION.json', report);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
