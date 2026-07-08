import path from 'node:path';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SCRIPTS = path.join(ROOT, 'scripts');
const engine = process.argv[2] ?? 'chromium';
if (!['chromium', 'firefox'].includes(engine)) throw new Error(`Unsupported performance engine: ${engine}`);

let xvfb = null;
if (process.env.CI && !process.env.DISPLAY) {
  const display = `:${90 + (process.pid % 9)}`;
  xvfb = spawn('Xvfb', [display, '-screen', '0', '1920x1080x24', '-nolisten', 'tcp'], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  process.env.DISPLAY = display;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 1200);
    xvfb.once('error', (error) => { clearTimeout(timer); reject(error); });
    xvfb.once('exit', (code) => {
      if (code !== null && code !== 0) { clearTimeout(timer); reject(new Error(`Xvfb exited before browser launch with code ${code}`)); }
    });
  });
}

let source = await readFile(path.join(SCRIPTS, 'phase10-performance-validation.mjs'), 'utf8');
const launchNeedle = "launchBrowser({ engine: 'chromium', viewport";
const launchReplacement = `launchBrowser({ engine: '${engine}', headless: false, viewport`;
if ((source.split(launchNeedle).length - 1) !== 1) throw new Error('Expected exactly one Chromium performance launch call.');
source = source.replace(launchNeedle, launchReplacement);
if (engine === 'firefox') {
  const reportNeedle = "writeJson('PHASE10_PERFORMANCE_VALIDATION.json'";
  if ((source.split(reportNeedle).length - 1) !== 1) throw new Error('Expected exactly one performance report write.');
  source = source.replace(reportNeedle, "writeJson('PHASE13_FIREFOX_PERFORMANCE_VALIDATION.json'");
}

const target = path.join(SCRIPTS, `.phase13-xvfb-${engine}-performance-${process.pid}.mjs`);
await writeFile(target, source);
try {
  await import(`${pathToFileURL(target).href}?run=${Date.now()}`);
} finally {
  await rm(target, { force: true });
  if (xvfb && xvfb.exitCode === null) {
    xvfb.kill('SIGTERM');
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 1000);
      xvfb.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }
}
