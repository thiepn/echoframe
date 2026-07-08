import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSaveData } from '../src/state/SaveSchema.js';
import { createDefaultSaveData } from '../src/state/defaultSaveData.js';

test('default save validates without issues', () => {
  const defaults = createDefaultSaveData('2026-07-04T00:00:00.000Z');
  const result = validateSaveData(defaults, '2026-07-04T00:00:00.000Z');
  assert.equal(result.valid, true);
  assert.equal(result.data.schemaVersion, 2);
  assert.equal(result.data.settings.audio.masterVolume, 0.8);
});

test('missing fields receive safe defaults', () => {
  const result = validateSaveData({ schemaVersion: 1 });
  assert.equal(result.data.settings.visual.screenShake, 0.7);
  assert.equal(result.data.meta.lastSelectedDifficulty, 'standard');
  assert.deepEqual(result.data.records.recentRuns, []);
});

test('unknown fields are tolerated but not copied', () => {
  const result = validateSaveData({
    schemaVersion: 1,
    unknownRoot: 'discarded',
    settings: { unknownSetting: true },
  });
  assert.equal('unknownRoot' in result.data, false);
  assert.equal('unknownSetting' in result.data.settings, false);
});

test('invalid numeric settings are clamped or defaulted', () => {
  const result = validateSaveData({
    schemaVersion: 1,
    settings: {
      audio: { masterVolume: 12, musicVolume: -3, effectsVolume: 'bad' },
      visual: { hudOpacity: 0.1 },
    },
  });
  assert.equal(result.data.settings.audio.masterVolume, 1);
  assert.equal(result.data.settings.audio.musicVolume, 0);
  assert.equal(result.data.settings.audio.effectsVolume, 0.8);
  assert.equal(result.data.settings.visual.hudOpacity, 0.5);
});

test('invalid arrays are replaced and valid arrays are de-duplicated', () => {
  const result = validateSaveData({
    schemaVersion: 1,
    progression: {
      unlockedUpgradeIds: ['split-lens', 'split-lens', 4],
      loreIds: 'invalid',
    },
  });
  assert.deepEqual(result.data.progression.unlockedUpgradeIds, ['split-lens']);
  assert.deepEqual(result.data.progression.loreIds, []);
});

test('unsupported schema is reported', () => {
  const result = validateSaveData({ schemaVersion: 99 });
  assert.equal(result.valid, false);
  assert.match(result.issues[0], /Unsupported schema version/);
  assert.equal(result.data.schemaVersion, 2);
});
