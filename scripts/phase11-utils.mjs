import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DOCS = path.join(ROOT, 'docs');
export const SCREENSHOTS = path.join(DOCS, 'screenshots');
export const PHASE10_ARCHIVE = process.env.PHASE10_ARCHIVE || '/mnt/data/ECHOFRAME_phase10_release_candidate.zip';
export const EXPECTED_PHASE10_SHA256 = 'b95fa2753649d7c57071f2b3b56140cca3553cdd3fea05e56a859f89a245b2e2';
export const EXPECTED_CANONICAL = Object.freeze({
  'GAME_DESIGN.md': '556d99d05d7896c2b02bb653cb28e8a0cb631e223edf67e3e0c1236fd7811f71',
  'TECHNICAL_SPEC.md': '8562235331a2dc229977db11a56fdb10ba0032494d4b0d0706f41bf24c903468',
  'ART_DIRECTION.md': 'aa29931c92ada05c0693ea58730986bc8b9ce8c1b8fcbf78acb4d72be8d1529a',
  'BALANCE_SPEC.md': '5fca70f1c890b1e13a3b8b17ab3c82da725491c0cca6146a7ad0a2b1f55fd107',
  'QA_CHECKLIST.md': 'b120097203b11e7f2fe025ea5767e931395f5edc7059e9821f6ab5ce1c722122',
});

const SOURCE_ROOT_FILES = new Set([
  '.editorconfig', '.gitignore', 'LICENSE', 'index.html', 'package.json', 'package-lock.json',
  'vite.config.js', 'eslint.config.js',
]);
const SOURCE_DIRECTORIES = new Set(['src', 'tests', 'scripts', 'public', '.github']);
const CANONICAL_PATHS = new Set(Object.keys(EXPECTED_CANONICAL).map((name) => `docs/${name}`));

export function sha256Buffer(value) {
  return createHash('sha256').update(value).digest('hex');
}
export async function sha256File(filename) {
  return sha256Buffer(await readFile(filename));
}
export async function fileExists(filename) {
  try { await access(filename); return true; } catch { return false; }
}
export async function writeJson(filename, value) {
  await mkdir(DOCS, { recursive: true });
  const target = path.isAbsolute(filename) ? filename : path.join(DOCS, filename);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
  return target;
}
export async function readJson(filename, fallback = null) {
  try { return JSON.parse(await readFile(filename, 'utf8')); } catch { return fallback; }
}

async function walk(directory, base = ROOT) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(base, absolute).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'test-results', 'playwright-report'].includes(entry.name) || entry.name.startsWith('dist-')) continue;
      files.push(...await walk(absolute, base));
    } else files.push(relative);
  }
  return files;
}

export async function sourceManifest() {
  const all = await walk(ROOT);
  const included = all.filter((relative) => {
    if (SOURCE_ROOT_FILES.has(relative)) return true;
    if (CANONICAL_PATHS.has(relative)) return true;
    const top = relative.split('/')[0];
    return SOURCE_DIRECTORIES.has(top);
  }).sort();
  const entries = [];
  for (const relative of included) {
    const absolute = path.join(ROOT, relative);
    const info = await stat(absolute);
    entries.push({ path: relative, bytes: info.size, sha256: await sha256File(absolute) });
  }
  const digestInput = entries.map((entry) => `${entry.sha256} ${entry.bytes} ${entry.path}`).join('\n');
  return { algorithm: 'sha256(path+size+content)', digest: sha256Buffer(digestInput), fileCount: entries.length, entries };
}

export async function canonicalHashes() {
  const result = {};
  for (const [name, expected] of Object.entries(EXPECTED_CANONICAL)) {
    const actual = await sha256File(path.join(DOCS, name));
    result[name] = { expected, actual, unchanged: expected === actual };
  }
  return result;
}

export function commandVersion(command, args = ['--version']) {
  try { return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch (error) { return null; }
}

export function environmentSnapshot() {
  return {
    platform: process.platform,
    arch: process.arch,
    osRelease: os.release(),
    osType: os.type(),
    node: process.version,
    npm: commandVersion('npm'),
    playwright: commandVersion(process.execPath, [path.join(ROOT, 'node_modules/playwright/cli.js'), '--version']),
    chromium: commandVersion(process.env.CHROMIUM_EXECUTABLE || '/usr/bin/chromium'),
    firefox: commandVersion(process.env.FIREFOX_EXECUTABLE || '/usr/bin/firefox-esr'),
  };
}

export async function packageVersion() {
  return (await packageMetadata()).version;
}

export async function packageMetadata() {
  return JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
}

export async function productionBundleDigest(directory = path.join(ROOT, 'dist')) {
  if (!(await fileExists(directory))) return null;
  const files = (await walk(directory, directory)).sort();
  const entries = [];
  for (const relative of files) {
    const absolute = path.join(directory, relative);
    const info = await stat(absolute);
    entries.push({ path: relative, bytes: info.size, sha256: await sha256File(absolute) });
  }
  return { digest: sha256Buffer(entries.map((entry) => `${entry.sha256} ${entry.bytes} ${entry.path}`).join('\n')), fileCount: entries.length, entries };
}

export function reportMetadata({ scope, browser = null, bundleDigest = null, source = null, status = 'completed' } = {}) {
  return {
    generatedAt: new Date().toISOString(),
    phase: 11,
    scope,
    status,
    packageVersion: null,
    runtimeVersion: null,
    sourceManifestDigest: source?.digest ?? null,
    productionBundleDigest: bundleDigest?.digest ?? bundleDigest ?? null,
    browser,
    environment: environmentSnapshot(),
  };
}
