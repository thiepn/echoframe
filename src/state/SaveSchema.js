import { RECENT_RUN_LIMIT, SAVE_SCHEMA_VERSION } from '../data/constants.js';
import { DIFFICULTY_ORDER } from '../data/difficulty.js';
import { COSMETIC_IDS } from '../data/cosmeticDefinitions.js';
import { UNLOCK_DEFINITIONS, LORE_DEFINITIONS } from '../data/progressionDefinitions.js';
import { LOCKED_UPGRADE_IDS, UPGRADE_DEFINITIONS } from '../upgrades/UpgradeCatalog.js';
import { normalizeBindings } from '../input/BindingCatalog.js';
import { migrateLegacyBindings } from '../input/BindingMigration.js';
import { clamp } from '../utils/math.js';
import { createDefaultSaveData } from './defaultSaveData.js';
import { createRecentRunRecord } from '../statistics/RecentRunRecord.js';

const ALL_UPGRADE_IDS = new Set(UPGRADE_DEFINITIONS.map((entry) => entry.id));
const UNLOCK_IDS = new Set(UNLOCK_DEFINITIONS.map((entry) => entry.id));
const LORE_IDS = new Set(LORE_DEFINITIONS.map((entry) => entry.id));
const SUPPORTED_SCHEMA_VERSIONS = new Set([1, SAVE_SCHEMA_VERSION]);

function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function bool(value, fallback) { return typeof value === 'boolean' ? value : fallback; }
function number(value, fallback, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) { return Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback; }
function text(value, fallback) { return typeof value === 'string' && value.length > 0 ? value : fallback; }
function strings(value, fallback = [], known = null) { const source = Array.isArray(value) ? value : fallback; return [...new Set(source.filter((entry) => typeof entry === 'string' && (!known || known.has(entry))))]; }
function record(value) { return isRecord(value) ? structuredClone(value) : {}; }
function numericRecord(value) { const out = {}; if (!isRecord(value)) return out; for (const [key, raw] of Object.entries(value)) { if (Number.isFinite(raw)) out[key] = clamp(raw, 0, Number.MAX_SAFE_INTEGER); else if (isRecord(raw)) out[key] = numericRecord(raw); } return out; }
function normalizeUnlockRecords(value) { if (!Array.isArray(value)) return []; const seen = new Set(); return value.filter(isRecord).map((entry) => ({ unlockId: String(entry.unlockId ?? ''), completedAt: text(entry.completedAt, new Date(0).toISOString()) })).filter((entry) => UNLOCK_IDS.has(entry.unlockId) && !seen.has(entry.unlockId) && seen.add(entry.unlockId)); }
function normalizeRecentRuns(value) { if (!Array.isArray(value)) return []; const byId = new Map(); for (const [index, raw] of value.slice(-RECENT_RUN_LIMIT * 2).entries()) { const normalized = createRecentRunRecord({ ...raw, runId: raw?.runId ?? `legacy-run-${index}-${raw?.index ?? ''}` }); byId.set(normalized.runId, normalized); } return [...byId.values()].slice(-RECENT_RUN_LIMIT); }

export function validateSaveData(input, now = new Date().toISOString()) {
  const defaults = createDefaultSaveData(now);
  const issues = [];
  const migrationNotes = [];
  const source = isRecord(input) ? input : {};
  if (!isRecord(input)) issues.push('Save root was not an object.');
  const sourceVersion = source.schemaVersion ?? 1;
  if (!SUPPORTED_SCHEMA_VERSIONS.has(sourceVersion)) issues.push(`Unsupported schema version: ${String(sourceVersion)}.`);

  const settings = isRecord(source.settings) ? source.settings : {};
  const audio = isRecord(settings.audio) ? settings.audio : {};
  const visual = isRecord(settings.visual) ? settings.visual : {};
  const accessibility = isRecord(settings.accessibility) ? settings.accessibility : {};
  const controls = isRecord(settings.controls) ? settings.controls : {};
  const gameplay = isRecord(settings.gameplay) ? settings.gameplay : {};
  const rawBindings = isRecord(controls.bindings) ? controls.bindings : {};
  const bindingResult = sourceVersion === 1
    ? migrateLegacyBindings(rawBindings)
    : normalizeBindings(rawBindings, { repair: true });
  migrationNotes.push(...bindingResult.issues);

  const requestedDifficulty = text(gameplay.lastDifficulty, defaults.settings.gameplay.lastDifficulty);
  const safeDifficulty = DIFFICULTY_ORDER.includes(requestedDifficulty) ? requestedDifficulty : defaults.settings.gameplay.lastDifficulty;
  const progression = isRecord(source.progression) ? source.progression : {};
  const statistics = isRecord(source.statistics) ? source.statistics : {};
  const aggregate = isRecord(statistics.aggregateCounters) ? statistics.aggregateCounters : {};
  const records = isRecord(source.records) ? source.records : {};
  const meta = isRecord(source.meta) ? source.meta : {};

  let unlockedUpgradeIds = strings(progression.unlockedUpgradeIds, defaults.progression.unlockedUpgradeIds, ALL_UPGRADE_IDS);
  if (!unlockedUpgradeIds.length) unlockedUpgradeIds = [...defaults.progression.unlockedUpgradeIds];
  const unlockedPaletteIds = strings(progression.unlockedPaletteIds, defaults.progression.unlockedPaletteIds, new Set(COSMETIC_IDS.palettes));
  if (!unlockedPaletteIds.includes('default')) unlockedPaletteIds.unshift('default');
  const unlockedTrailIds = strings(progression.unlockedTrailIds, defaults.progression.unlockedTrailIds, new Set(COSMETIC_IDS.trails));
  if (!unlockedTrailIds.includes('default')) unlockedTrailIds.unshift('default');
  const unlockedDifficultyIds = strings(progression.unlockedDifficultyIds, defaults.progression.unlockedDifficultyIds, new Set(DIFFICULTY_ORDER));
  for (const id of ['relaxed', 'standard']) if (!unlockedDifficultyIds.includes(id)) unlockedDifficultyIds.push(id);
  const selectedPaletteId = unlockedPaletteIds.includes(progression.selectedPaletteId) ? progression.selectedPaletteId : 'default';
  const selectedTrailId = unlockedTrailIds.includes(progression.selectedTrailId) ? progression.selectedTrailId : 'default';

  const data = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    createdAt: text(source.createdAt, defaults.createdAt),
    updatedAt: text(source.updatedAt, now),
    settings: {
      audio: {
        masterVolume: number(audio.masterVolume, 0.8, 0, 1), musicVolume: number(audio.musicVolume, 0.6, 0, 1),
        effectsVolume: number(audio.effectsVolume, 0.8, 0, 1), muted: bool(audio.muted, false),
      },
      visual: {
        screenShake: number(visual.screenShake, 0.7, 0, 1), reducedFlashes: bool(visual.reducedFlashes, false),
        reducedParticles: bool(visual.reducedParticles, false), highContrast: bool(visual.highContrast, false),
        damageNumbers: bool(visual.damageNumbers, true), aimLine: bool(visual.aimLine, true),
        hudOpacity: number(visual.hudOpacity, 0.9, 0.5, 1),
      },
      accessibility: {
        pauseOnFocusLoss: bool(accessibility.pauseOnFocusLoss, true),
        persistentPlayerLocator: bool(accessibility.persistentPlayerLocator, false),
        largerTelegraphOutlines: bool(accessibility.largerTelegraphOutlines, false),
      },
      controls: { bindings: structuredClone(bindingResult.bindings) },
      gameplay: { lastDifficulty: safeDifficulty },
    },
    progression: {
      unlockedUpgradeIds, unlockedPaletteIds, unlockedTrailIds, unlockedDifficultyIds,
      loreIds: strings(progression.loreIds, [], LORE_IDS), archiveDiscoveryIds: strings(progression.archiveDiscoveryIds),
      unlockRecords: normalizeUnlockRecords(progression.unlockRecords), unseenUnlockIds: strings(progression.unseenUnlockIds, [], UNLOCK_IDS),
      selectedPaletteId, selectedTrailId,
    },
    statistics: {
      aggregateCounters: {
        runsStarted: number(aggregate.runsStarted, 0), runsCompleted: number(aggregate.runsCompleted, 0),
        victories: number(aggregate.victories, 0), defeats: number(aggregate.defeats, 0),
        totalSimulationMs: number(aggregate.totalSimulationMs, 0), totalScore: number(aggregate.totalScore, 0),
        highestScore: number(aggregate.highestScore, 0), totalEnemiesDefeated: number(aggregate.totalEnemiesDefeated, 0),
        totalElitesDefeated: number(aggregate.totalElitesDefeated, 0), totalBossesDefeated: number(aggregate.totalBossesDefeated, 0),
      },
      combatCounters: numericRecord(statistics.combatCounters), echoCounters: numericRecord(statistics.echoCounters),
      scoreCounters: numericRecord(statistics.scoreCounters), difficultyRecords: numericRecord(statistics.difficultyRecords),
      personalBests: record(statistics.personalBests), bossRecords: record(statistics.bossRecords),
    },
    records: { recentRuns: normalizeRecentRuns(records.recentRuns) },
    meta: {
      lastSelectedDifficulty: DIFFICULTY_ORDER.includes(meta.lastSelectedDifficulty) ? meta.lastSelectedDifficulty : safeDifficulty,
      tutorialCompleted: bool(meta.tutorialCompleted, false),
      seenIntroductions: strings(meta.seenIntroductions), seenUnlockIds: strings(meta.seenUnlockIds, [], UNLOCK_IDS),
    },
  };
  for (const lockedId of LOCKED_UPGRADE_IDS) if (defaults.progression.unlockedUpgradeIds.includes(lockedId)) issues.push(`Locked upgrade default conflict: ${lockedId}.`);
  return {
    data, issues, migrationNotes,
    migrated: sourceVersion === 1,
    valid: issues.length === 0,
    sourceSchemaVersion: sourceVersion,
  };
}
