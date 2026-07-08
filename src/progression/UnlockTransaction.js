function pushUnique(array, value) { if (!array.includes(value)) array.push(value); }
export function applyUnlocksToSave(save, definitions, completedAt = new Date().toISOString()) {
  const progression = save.progression;
  progression.unlockRecords ??= [];
  progression.archiveDiscoveryIds ??= [];
  progression.unseenUnlockIds ??= [];
  const applied = [];
  for (const definition of definitions) {
    if (progression.unlockRecords.some((entry) => entry.unlockId === definition.id)) continue;
    for (const rewardId of definition.rewardIds) {
      if (definition.type === 'upgrade') pushUnique(progression.unlockedUpgradeIds, rewardId);
      if (definition.type === 'difficulty') pushUnique(progression.unlockedDifficultyIds, rewardId);
      if (definition.type === 'palette') pushUnique(progression.unlockedPaletteIds, rewardId);
      if (definition.type === 'trail') pushUnique(progression.unlockedTrailIds, rewardId);
    }
    progression.unlockRecords.push({ unlockId: definition.id, completedAt });
    pushUnique(progression.unseenUnlockIds, definition.id);
    applied.push(definition.id);
  }
  return Object.freeze(applied);
}
