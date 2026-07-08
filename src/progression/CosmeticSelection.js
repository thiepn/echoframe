import { getPaletteDefinition, getTrailDefinition } from '../data/cosmeticDefinitions.js';
export function validateCosmeticSelection(save) {
  const progression = save.progression;
  if (!progression.unlockedPaletteIds.includes(progression.selectedPaletteId)) progression.selectedPaletteId = 'default';
  if (!progression.unlockedTrailIds.includes(progression.selectedTrailId)) progression.selectedTrailId = 'default';
  return Object.freeze({ palette: getPaletteDefinition(progression.selectedPaletteId), trail: getTrailDefinition(progression.selectedTrailId) });
}
