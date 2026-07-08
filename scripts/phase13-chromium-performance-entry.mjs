import path from 'node:path';
import { access, copyFile, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const DOCS = path.join(ROOT, 'docs');
const runner = path.join(ROOT, 'scripts', 'phase13-performance-certification.mjs');
const managedPlaywrightExecutable = process.env.CHROMIUM_EXECUTABLE ?? null;
const explicitStableExecutable = process.env.PHASE13_STABLE_CHROME_EXECUTABLE ?? null;
const candidatePaths = [
  explicitStableExecutable,
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/opt/google/chrome/google-chrome',
  managedPlaywrightExecutable,
].filter(Boolean);

async function exists(filename) {
  try {
    await access(filename);
    return true;
  } catch {
    return false;
  }
}

async function runCandidate(executable) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runner, 'chromium'], {
      cwd: ROOT,
      env: {
        ...process.env,
        CHROMIUM_EXECUTABLE: executable,
        PHASE13_CHROMIUM_PERFORMANCE_CHANNEL: executable === managedPlaywrightExecutable
          ? 'playwright-managed-chrome-for-testing'
          : 'github-runner-stable-google-chrome',
      },
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

const available = [];
for (const candidate of candidatePaths) {
  if (!available.includes(candidate) && await exists(candidate)) available.push(candidate);
}
if (available.length === 0) throw new Error('No real Chromium/Chrome executable is available for performance certification.');

const candidateResults = [];
let selected = null;
for (let index = 0; index < available.length; index += 1) {
  const executable = available[index];
  const channel = executable === managedPlaywrightExecutable
    ? 'playwright-managed-chrome-for-testing'
    : 'github-runner-stable-google-chrome';
  console.log(`Phase 13 Chromium performance candidate ${index + 1}/${available.length}: ${channel} (${executable})`);
  const child = await runCandidate(executable);
  let report = null;
  try {
    report = JSON.parse(await readFile(path.join(DOCS, 'PHASE10_PERFORMANCE_VALIDATION.json'), 'utf8'));
  } catch (error) {
    console.error(`Unable to read candidate performance report: ${error.message}`);
  }
  const result = {
    executable,
    channel,
    childExitCode: child.code,
    childSignal: child.signal,
    browser: report?.browser ?? null,
    selectedMode: report?.phase13PerformanceAttempts?.selectedMode ?? null,
    checks: report?.checks ?? null,
    passed: child.code === 0 && report?.passed === true,
  };
  candidateResults.push(result);
  if (report) {
    await copyFile(
      path.join(DOCS, 'PHASE10_PERFORMANCE_VALIDATION.json'),
      path.join(DOCS, `PHASE13_CHROMIUM_PERFORMANCE_CANDIDATE_${index + 1}.json`),
    );
  }
  if (result.passed) {
    selected = result;
    break;
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  phase: 13,
  scope: 'Hosted Chromium performance browser-channel selection',
  policy: {
    functionalCertification: 'Playwright-managed current Chromium remains mandatory in the production matrix.',
    performanceCertification: 'Current stable Google Chrome from the supported GitHub runner is preferred because it represents the public stable channel and avoids Chrome-for-Testing virtual-display cadence distortion.',
    acceptanceThresholdsChanged: false,
    gameplayWorkloadChanged: false,
    syntheticFrameDataUsed: false,
  },
  managedPlaywrightExecutable,
  candidates: candidateResults,
  selected,
  passed: Boolean(selected),
};
await writeFile(
  path.join(DOCS, 'PHASE13_CHROMIUM_PERFORMANCE_CHANNELS.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
);

if (selected) {
  const reportPath = path.join(DOCS, 'PHASE10_PERFORMANCE_VALIDATION.json');
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  report.phase13BrowserChannelSelection = summary;
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Phase 13 Chromium performance certification passed on ${selected.channel}.`);
} else {
  console.error('Phase 13 Chromium performance certification failed on every available real browser channel.');
  process.exitCode = 1;
}
