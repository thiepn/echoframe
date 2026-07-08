import assert from 'node:assert/strict';
import test from 'node:test';
import { SAVE_KEYS } from '../src/data/constants.js';
import { SaveManager } from '../src/systems/SaveManager.js';
import { createDefaultSaveData } from '../src/state/defaultSaveData.js';
import { EventBus } from '../src/utils/EventBus.js';
import { createMemoryStorage } from '../src/utils/storage.js';

function createManager(storage) {
  return new SaveManager({
    storage,
    eventBus: new EventBus(),
    throttleMs: 1,
  });
}

test('loads a valid primary save', () => {
  const save = createDefaultSaveData();
  save.meta.tutorialCompleted = true;
  const storage = createMemoryStorage({
    [SAVE_KEYS.primary]: JSON.stringify(save),
  });
  const manager = createManager(storage);
  assert.equal(manager.load().meta.tutorialCompleted, true);
  assert.equal(manager.lastLoadSource, 'primary');
});

test('recovers from corrupt primary using backup', () => {
  const backup = createDefaultSaveData();
  backup.meta.tutorialCompleted = true;
  const storage = createMemoryStorage({
    [SAVE_KEYS.primary]: '{broken',
    [SAVE_KEYS.backup]: JSON.stringify(backup),
  });
  const manager = createManager(storage);
  assert.equal(manager.load().meta.tutorialCompleted, true);
  assert.equal(manager.lastLoadSource, 'backup');
  assert.doesNotThrow(() => JSON.parse(storage.getItem(SAVE_KEYS.primary)));
});

test('falls back to defaults when primary and backup are corrupt', () => {
  const storage = createMemoryStorage({
    [SAVE_KEYS.primary]: '{broken',
    [SAVE_KEYS.backup]: 'also broken',
  });
  const manager = createManager(storage);
  const loaded = manager.load();
  assert.equal(manager.lastLoadSource, 'defaults');
  assert.equal(loaded.schemaVersion, 2);
});

test('backs up the previous valid primary before overwrite', () => {
  const original = createDefaultSaveData();
  original.meta.tutorialCompleted = false;
  const storage = createMemoryStorage({
    [SAVE_KEYS.primary]: JSON.stringify(original),
  });
  const manager = createManager(storage);
  manager.load();
  manager.update((draft) => {
    draft.meta.tutorialCompleted = true;
  }, { immediate: true });

  const backup = JSON.parse(storage.getItem(SAVE_KEYS.backup));
  const primary = JSON.parse(storage.getItem(SAVE_KEYS.primary));
  assert.equal(backup.meta.tutorialCompleted, false);
  assert.equal(primary.meta.tutorialCompleted, true);
});

test('recent run history is capped at fifty records', () => {
  const storage = createMemoryStorage();
  const manager = createManager(storage);
  manager.load();
  manager.update((draft) => {
    draft.records.recentRuns = Array.from({ length: 80 }, (_, index) => ({ index }));
  }, { immediate: true });
  assert.equal(manager.getSnapshot().records.recentRuns.length, 50);
  assert.equal(manager.getSnapshot().records.recentRuns[0].index, 30);
});

test('SaveManager skips writes when an update makes no meaningful change', () => {
  const storage = createMemoryStorage();
  const events = [];
  const manager = new SaveManager({ storage, eventBus: { emit: (...args) => events.push(args) } });
  manager.load();
  const result = manager.update(() => {}, { immediate: true });
  assert.equal(result.ok, true);
  assert.equal(result.skipped, true);
  assert.equal(events.filter(([name]) => name === 'save:written').length, 0);
});
