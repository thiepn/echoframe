import { COSMETIC_IDS } from '../data/cosmeticDefinitions.js';
import { UnlockEvaluator } from './UnlockEvaluator.js';
import { applyUnlocksToSave } from './UnlockTransaction.js';

export class ProgressionManager {
  constructor({ evaluator = new UnlockEvaluator() } = {}) { this.evaluator = evaluator; }
  evaluate(input) { return this.evaluator.evaluate(input); }
  apply(save, definitions, completedAt) { return applyUnlocksToSave(save, definitions, completedAt); }
  selectCosmetic(save, type, id) {
    const progression = save?.progression;
    if (!progression) return Object.freeze({ accepted: false, reason: 'missing-progression' });
    if (type === 'palette') {
      if (!COSMETIC_IDS.palettes.includes(id)) return Object.freeze({ accepted: false, reason: 'unknown-palette' });
      if (!progression.unlockedPaletteIds.includes(id)) return Object.freeze({ accepted: false, reason: 'locked-palette' });
      progression.selectedPaletteId = id;
      return Object.freeze({ accepted: true, type, id });
    }
    if (type === 'trail') {
      if (!COSMETIC_IDS.trails.includes(id)) return Object.freeze({ accepted: false, reason: 'unknown-trail' });
      if (!progression.unlockedTrailIds.includes(id)) return Object.freeze({ accepted: false, reason: 'locked-trail' });
      progression.selectedTrailId = id;
      return Object.freeze({ accepted: true, type, id });
    }
    return Object.freeze({ accepted: false, reason: 'unknown-cosmetic-type' });
  }
}
