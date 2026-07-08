import path from 'node:path';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ROOT, SCREENSHOTS } from './phase12-utils.mjs';

const sourcePath = path.join(ROOT, 'scripts', 'phase10-browser-validation.mjs');
const targetPath = path.join(ROOT, 'scripts', `.phase13-firefox-screenshots-${process.pid}.mjs`);
let source = await readFile(sourcePath, 'utf8');
const replacements = [
  ["launchBrowser({ engine: 'chromium'", "launchBrowser({ engine: 'firefox'"],
  ["browser: 'Chromium'", "browser: 'Firefox'"],
  ["writeJson('PHASE10_BROWSER_CHROMIUM_VALIDATION.json'", "writeJson('PHASE13_FIREFOX_SCREENSHOT_VALIDATION.json'"],
  [
    `    scene.player.setPosition(scene.stationaryTarget.x - 320, scene.stationaryTarget.y);\n    scene.player.bodySprite?.setVelocity?.(0, 0);\n    scene.stationaryTargetHealth = 1;`,
    `    scene.player.bodySprite?.setVelocity?.(0, 0);\n    scene.stationaryTarget.setPosition(scene.player.x + 96, scene.player.y);\n    scene.stationaryTarget.body?.updateFromGameObject?.();\n    scene.stationaryTargetHealth = 1;`,
  ],
];
for (const [before, after] of replacements) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`Firefox screenshot runner expected one occurrence of ${JSON.stringify(before)}, found ${count}.`);
  source = source.replace(before, after);
}
await writeFile(targetPath, source);
try {
  await import(`${pathToFileURL(targetPath).href}?run=${Date.now()}`);
  await mkdir(SCREENSHOTS, { recursive: true });
  const copies = {
    'ECHOFRAME_phase10_main_menu.png': 'ECHOFRAME_v1_main_menu_firefox.png',
    'ECHOFRAME_phase10_tutorial_movement.png': 'ECHOFRAME_v1_tutorial_firefox.png',
    'ECHOFRAME_phase10_controls_rebinding.png': 'ECHOFRAME_v1_controls_firefox.png',
    'ECHOFRAME_phase10_full_combat.png': 'ECHOFRAME_v1_combat_firefox.png',
    'ECHOFRAME_phase10_boss_phase3.png': 'ECHOFRAME_v1_boss_firefox.png',
  };
  for (const [from, to] of Object.entries(copies)) await copyFile(path.join(SCREENSHOTS, from), path.join(SCREENSHOTS, to));
} finally {
  await rm(targetPath, { force: true });
}
