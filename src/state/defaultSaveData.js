import { ACCESSIBILITY_DEFAULTS, VISUAL_DEFAULTS } from '../data/accessibility.js';
import { SAVE_SCHEMA_VERSION } from '../data/constants.js';
import { DEFAULT_BINDINGS as DESCRIPTOR_DEFAULT_BINDINGS, defaultBindingsSnapshot } from '../input/BindingCatalog.js';

// Compatibility export for existing imports. Values are now serializable descriptors.
export const DEFAULT_BINDINGS = DESCRIPTOR_DEFAULT_BINDINGS;

const INITIAL_UPGRADES = Object.freeze([
  'split-lens', 'piercing-signal', 'arc-relay', 'fracture-round', 'compression-coil', 'ricochet-matrix',
  'extended-memory', 'resonant-damage', 'phantom-shield', 'stable-projection', 'dash-wake', 'phase-recovery',
  'kinetic-charge', 'slipstream', 'emergency-repair', 'reactive-shell', 'last-frame', 'regenerative-circuit',
]);

export function createDefaultSaveData(now = new Date().toISOString()) {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    settings: {
      audio: { masterVolume: 0.8, musicVolume: 0.6, effectsVolume: 0.8, muted: false },
      visual: { ...VISUAL_DEFAULTS },
      accessibility: { ...ACCESSIBILITY_DEFAULTS },
      controls: { bindings: defaultBindingsSnapshot() },
      gameplay: { lastDifficulty: 'standard' },
    },
    progression: {
      unlockedUpgradeIds: [...INITIAL_UPGRADES],
      unlockedPaletteIds: ['default'],
      unlockedTrailIds: ['default'],
      unlockedDifficultyIds: ['relaxed', 'standard'],
      loreIds: [], archiveDiscoveryIds: [], unlockRecords: [], unseenUnlockIds: [],
      selectedPaletteId: 'default', selectedTrailId: 'default',
    },
    statistics: {
      aggregateCounters: {
        runsStarted: 0, runsCompleted: 0, victories: 0, defeats: 0,
        totalSimulationMs: 0, totalScore: 0, highestScore: 0,
        totalEnemiesDefeated: 0, totalElitesDefeated: 0, totalBossesDefeated: 0,
      },
      combatCounters: {}, echoCounters: {}, scoreCounters: {}, difficultyRecords: {}, personalBests: {}, bossRecords: {},
    },
    records: { recentRuns: [] },
    meta: {
      lastSelectedDifficulty: 'standard', tutorialCompleted: false,
      seenIntroductions: [], seenUnlockIds: [],
    },
  };
}
