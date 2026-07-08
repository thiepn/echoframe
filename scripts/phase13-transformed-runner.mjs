import path from 'node:path';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SCRIPTS = path.join(ROOT, 'scripts');
const mode = process.argv[2];

const specs = {
  'firefox-static': {
    source: 'phase10-deployment-validation.mjs',
    replacements: [
      ["launchBrowser({ engine: 'chromium'", "launchBrowser({ engine: 'firefox'"],
      ["writeJson('PHASE10_DEPLOYMENT_VALIDATION.json'", "writeJson('PHASE13_FIREFOX_STATIC_BASES.json'"],
    ],
  },
  'firefox-accessibility': {
    source: 'phase10-accessibility-browser-validation.mjs',
    replacements: [
      ["launchBrowser({ engine: 'chromium'", "launchBrowser({ engine: 'firefox'"],
      ["browser: 'Chromium'", "browser: 'Firefox'"],
      ["writeJson('PHASE10_ACCESSIBILITY_BROWSER_VALIDATION.json'", "writeJson('PHASE13_FIREFOX_ACCESSIBILITY_VALIDATION.json'"],
    ],
  },
  'firefox-lifecycle': {
    source: 'phase10-lifecycle-validation.mjs',
    replacements: [
      ["launchBrowser({ engine: 'chromium'", "launchBrowser({ engine: 'firefox'"],
      ["writeJson('PHASE10_LIFECYCLE_VALIDATION.json'", "writeJson('PHASE13_FIREFOX_LIFECYCLE_VALIDATION.json'"],
    ],
  },
  'firefox-soak': {
    source: 'phase10-active-soak-validation.mjs',
    replacements: [
      ["launchBrowser({ engine: 'chromium'", "launchBrowser({ engine: 'firefox'"],
      ["writeJson('PHASE10_ACTIVE_SOAK_VALIDATION.json'", "writeJson('PHASE13_FIREFOX_SOAK_VALIDATION.json'"],
    ],
  },
  'firefox-performance': {
    source: 'phase10-performance-validation.mjs',
    replacements: [
      ["launchBrowser({ engine: 'chromium'", "launchBrowser({ engine: 'firefox'"],
      ["writeJson('PHASE10_PERFORMANCE_VALIDATION.json'", "writeJson('PHASE13_FIREFOX_PERFORMANCE_VALIDATION.json'"],
    ],
  },
};

const spec = specs[mode];
if (!spec) throw new Error(`Unsupported Phase 13 transformed runner mode: ${mode ?? '<missing>'}`);
let source = await readFile(path.join(SCRIPTS, spec.source), 'utf8');
for (const [before, after] of spec.replacements) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${mode}: expected one occurrence of ${JSON.stringify(before)}, found ${count}`);
  source = source.replace(before, after);
}
const target = path.join(SCRIPTS, `.phase13-${mode}-${process.pid}.mjs`);
await writeFile(target, source);
try {
  await import(`${pathToFileURL(target).href}?run=${Date.now()}`);
} finally {
  await rm(target, { force: true });
}
