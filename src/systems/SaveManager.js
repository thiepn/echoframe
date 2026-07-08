import { RECENT_RUN_LIMIT, SAVE_KEYS, SAVE_SCHEMA_VERSION } from '../data/constants.js';
import { validateSaveData } from '../state/SaveSchema.js';
import { createDefaultSaveData } from '../state/defaultSaveData.js';
import { createMemoryStorage, safeParseJson, safeRead, safeRemove, safeWrite } from '../utils/storage.js';

function clone(value) { return structuredClone(value); }
function resolveDefaultStorage() {
  try { const storage = globalThis.localStorage; if (storage) return storage; } catch { /* denied */ }
  return createMemoryStorage();
}

export class SaveManager {
  constructor({ storage = null, eventBus = null, keys = SAVE_KEYS, throttleMs = 250 } = {}) {
    this.storage = storage ?? resolveDefaultStorage();
    this.eventBus = eventBus;
    this.keys = keys;
    this.throttleMs = throttleMs;
    this.current = createDefaultSaveData();
    this.pendingTimer = null;
    this.pendingData = null;
    this.lastLoadSource = 'defaults';
    this.lastMigration = null;
  }

  load() {
    const primary = this.#readValidated(this.keys.primary);
    if (primary.ok) {
      this.current = primary.data;
      this.lastLoadSource = 'primary';
      if (primary.migrated) this.#commitMigration(primary, this.keys.primary);
      this.eventBus?.emit('save:loaded', { source: 'primary', issues: primary.issues, migrationNotes: primary.migrationNotes });
      return clone(this.current);
    }

    const backup = this.#readValidated(this.keys.backup);
    if (backup.ok) {
      this.current = backup.data;
      this.lastLoadSource = 'backup';
      this.#writePrimaryWithoutBackup(this.current);
      this.eventBus?.emit('save:loaded', { source: 'backup', issues: backup.issues, migrationNotes: backup.migrationNotes });
      return clone(this.current);
    }

    this.current = createDefaultSaveData();
    this.lastLoadSource = 'defaults';
    this.#writePrimaryWithoutBackup(this.current);
    this.eventBus?.emit('save:loaded', { source: 'defaults', issues: [...primary.issues, ...backup.issues] });
    return clone(this.current);
  }

  getSnapshot() { return clone(this.current); }

  update(mutator, { immediate = false } = {}) {
    const draft = clone(this.current);
    mutator(draft);
    const normalized = validateSaveData(draft).data;
    if (JSON.stringify(normalized) === JSON.stringify(this.current)) return { ok: true, skipped: true, reason: 'no-meaningful-change' };
    normalized.updatedAt = new Date().toISOString();
    this.current = normalized;
    if (immediate) return this.saveNow();
    this.queueSave();
    return { ok: true, queued: true };
  }

  queueSave() {
    this.pendingData = clone(this.current);
    if (this.pendingTimer !== null) return;
    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = null;
      const data = this.pendingData;
      this.pendingData = null;
      this.saveNow(data);
    }, this.throttleMs);
  }

  flush() {
    if (this.pendingTimer !== null) { clearTimeout(this.pendingTimer); this.pendingTimer = null; }
    if (this.pendingData !== null) { const data = this.pendingData; this.pendingData = null; return this.saveNow(data); }
    return { ok: true, skipped: true };
  }

  saveNow(data = this.current) {
    const normalized = validateSaveData(data).data;
    normalized.updatedAt = new Date().toISOString();
    normalized.records.recentRuns = normalized.records.recentRuns.slice(-RECENT_RUN_LIMIT);
    const existing = this.#readValidated(this.keys.primary);
    if (existing.ok) {
      const backupWrite = safeWrite(this.storage, this.keys.backup, existing.serialized ?? JSON.stringify(existing.data));
      if (!backupWrite.ok) return { ok: false, error: backupWrite.error, stage: 'backup' };
    }
    const primaryWrite = safeWrite(this.storage, this.keys.primary, JSON.stringify(normalized));
    if (!primaryWrite.ok) return { ok: false, error: primaryWrite.error, stage: 'primary' };
    this.current = normalized;
    this.eventBus?.emit('save:written', { updatedAt: normalized.updatedAt });
    return { ok: true, data: clone(normalized) };
  }

  exportJson() { return JSON.stringify(this.current, null, 2); }

  importJson(serialized) {
    const parsed = safeParseJson(serialized);
    if (!parsed.ok) return { ok: false, error: parsed.error, issues: ['Invalid JSON.'] };
    const sourceVersion = parsed.value?.schemaVersion ?? 1;
    if (![1, SAVE_SCHEMA_VERSION].includes(sourceVersion)) {
      return { ok: false, error: new Error('Unsupported save schema version.'), issues: [`Unsupported schema version: ${String(sourceVersion)}.`] };
    }
    const validated = validateSaveData(parsed.value);
    if (!validated.valid) return { ok: false, error: new Error('Save validation failed.'), issues: validated.issues };
    const previous = this.current;
    this.current = validated.data;
    const result = this.saveNow();
    if (!result.ok) this.current = previous;
    else {
      this.lastMigration = validated.migrated ? { from: sourceVersion, to: SAVE_SCHEMA_VERSION, notes: validated.migrationNotes } : null;
      this.eventBus?.emit('save:imported', { issues: validated.issues, migration: this.lastMigration });
    }
    return { ...result, issues: validated.issues, migrationNotes: validated.migrationNotes, migrated: validated.migrated };
  }

  clear() {
    if (this.pendingTimer !== null) { clearTimeout(this.pendingTimer); this.pendingTimer = null; this.pendingData = null; }
    safeRemove(this.storage, this.keys.primary);
    safeRemove(this.storage, this.keys.backup);
    this.current = createDefaultSaveData();
    const result = this.#writePrimaryWithoutBackup(this.current);
    this.eventBus?.emit('save:cleared', {});
    return result;
  }

  dispose() { this.flush(); }

  #readValidated(key) {
    const read = safeRead(this.storage, key);
    if (!read.ok || read.value === null) return { ok: false, data: null, issues: [read.error?.message ?? `No data at ${key}.`] };
    const parsed = safeParseJson(read.value);
    if (!parsed.ok) return { ok: false, data: null, issues: [parsed.error.message] };
    const sourceVersion = parsed.value?.schemaVersion ?? 1;
    if (![1, SAVE_SCHEMA_VERSION].includes(sourceVersion)) return { ok: false, data: null, issues: ['Unsupported schema version.'] };
    const validated = validateSaveData(parsed.value);
    if (!validated.valid) return { ok: false, data: null, issues: validated.issues };
    return { ok: true, data: validated.data, issues: validated.issues, migrationNotes: validated.migrationNotes, migrated: validated.migrated, sourceVersion, serialized: read.value };
  }

  #commitMigration(result, sourceKey) {
    const backupWrite = safeWrite(this.storage, this.keys.backup, result.serialized);
    const primaryWrite = safeWrite(this.storage, sourceKey, JSON.stringify(result.data));
    this.lastMigration = { from: result.sourceVersion, to: SAVE_SCHEMA_VERSION, notes: result.migrationNotes, backupWritten: backupWrite.ok, primaryWritten: primaryWrite.ok };
    this.eventBus?.emit('save:migrated', this.lastMigration);
  }

  #writePrimaryWithoutBackup(data) {
    const normalized = validateSaveData(data).data;
    const write = safeWrite(this.storage, this.keys.primary, JSON.stringify(normalized));
    return write.ok ? { ok: true, data: clone(normalized) } : { ok: false, error: write.error };
  }
}
