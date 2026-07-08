import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (name) => readFileSync(new URL(`../src/scenes/${name}`, import.meta.url), 'utf8');

test('Phase 9 score and combo HUD text uses explicit CSS colors', () => {
  const hud = source('HUDScene.js');
  assert.match(hud, /COMBO 0\.0 · 1\.00×/);
  assert.match(hud, /color: '#9a82ff'/);
  assert.doesNotMatch(hud, /color: PALETTE\.(?:playerCyan|echoViolet|successMint|warningYellow)/);
});

test('Phase 9 Results final score uses readable CSS colors', () => {
  const results = source('ResultsScene.js');
  assert.match(results, /victory \? '#72f1b8' : '#ffd166'/);
  assert.doesNotMatch(results, /color: victory \? PALETTE/);
});

test('Phase 9 unlock reveal uses readable warning text', () => {
  const results = source('ResultsScene.js');
  assert.match(results, /this\.unlockText = this\.add\.text[\s\S]*color: '#ffd166'/);
});

test('Phase 9 Archive locked-state text uses a CSS color string', () => {
  const archive = source('ArchiveScene.js');
  assert.match(archive, /selected\.subtitle[\s\S]*color: '#ffd166'/);
});

test('Phase 9 Results presents multiple unlocks through a deterministic navigable queue', () => {
  const results = source('ResultsScene.js');
  assert.match(results, /NEW UNLOCK \$\{this\.unlockIndex \+ 1\}\/\$\{this\.unlockEntries\.length\}/);
  assert.match(results, /Previous Reward/);
  assert.match(results, /Next Reward/);
});

test('Phase 9 Results bounds personal-best presentation to six compact rows', () => {
  const results = source('ResultsScene.js');
  assert.match(results, /bests\.slice\(0, 6\)/);
  assert.doesNotMatch(results, /bests\.slice\(0, 8\)/);
});
