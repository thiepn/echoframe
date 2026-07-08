import path from 'node:path';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const sourcePath = path.join(ROOT, 'scripts', 'phase10-browser-validation.mjs');
const targetPath = path.join(ROOT, 'scripts', `.phase13-chromium-harness-${process.pid}.mjs`);

const before = `    scene.player.setPosition(scene.stationaryTarget.x - 320, scene.stationaryTarget.y);\n    scene.player.bodySprite?.setVelocity?.(0, 0);\n    scene.stationaryTargetHealth = 1;`;
const after = `    scene.player.bodySprite?.setVelocity?.(0, 0);\n    scene.stationaryTarget.setPosition(scene.player.x + 96, scene.player.y);\n    scene.stationaryTarget.body?.updateFromGameObject?.();\n    scene.stationaryTargetHealth = 1;`;

let source = await readFile(sourcePath, 'utf8');
const count = source.split(before).length - 1;
if (count !== 1) throw new Error(`Phase 13 Chromium harness expected exactly one deterministic firing-lane source block, found ${count}.`);
source = source.replace(before, after);
await writeFile(targetPath, source);
try {
  await import(`${pathToFileURL(targetPath).href}?run=${Date.now()}`);
} finally {
  await rm(targetPath, { force: true });
}
