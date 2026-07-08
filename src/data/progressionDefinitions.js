const unlock = (definition) => Object.freeze({ hiddenUntilProgress: false, predicateVersion: 1, priority: 100, ...definition, rewardIds: Object.freeze([...(definition.rewardIds ?? [])]) });

export const UNLOCK_DEFINITIONS = Object.freeze([
  unlock({ id: 'unlock-twin-recall', type: 'upgrade', displayName: 'Twin Recall', description: 'Two friendly Echoes can overlap their recorded pressure.', requirementText: 'Record the first qualifying crossfire event.', rewardIds: ['twin-recall'], priority: 10 }),
  unlock({ id: 'unlock-vector-reversal', type: 'upgrade', displayName: 'Vector Reversal', description: 'Reverse a dash with a bounded second impulse.', requirementText: 'Defeat the first elite parent.', rewardIds: ['vector-reversal'], priority: 20 }),
  unlock({ id: 'unlock-null-absorption', type: 'upgrade', displayName: 'Null Absorption', description: 'Defensive projectile destruction can restore Echo cooldown.', requirementText: 'Clear a Standard combat or elite segment without accepted health damage.', rewardIds: ['null-absorption'], priority: 30 }),
  unlock({ id: 'unlock-memory-burst', type: 'upgrade', displayName: 'Memory Burst', description: 'Friendly Echo expiration releases a bounded damage pulse.', requirementText: 'Reach the Null Architect in a non-debug run.', rewardIds: ['memory-burst'], priority: 40 }),
  unlock({ id: 'unlock-afterburn', type: 'upgrade', displayName: 'Afterburn', description: 'The first post-dash shot receives a bounded damage bonus.', requirementText: 'Clear a Standard combat or elite segment at the lower target time while using a dash.', rewardIds: ['afterburn'], priority: 50 }),
  unlock({ id: 'unlock-deflection-pulse', type: 'upgrade', displayName: 'Deflection Pulse', description: 'Dash-start displacement controls normal and summoned enemies.', requirementText: 'Complete a Standard victory after twelve defensive projectile or hostile-object interactions.', rewardIds: ['deflection-pulse'], priority: 60 }),
  unlock({ id: 'unlock-overclocked', type: 'difficulty', displayName: 'Overclocked', description: 'Higher pressure with the same mechanics and no exclusive combat content.', requirementText: 'Complete the first Standard victory.', rewardIds: ['overclocked'], priority: 70 }),
  unlock({ id: 'unlock-signal-restored', type: 'palette', displayName: 'Signal Restored', description: 'Mint and cyan restored-station palette.', requirementText: 'Complete the first Standard victory.', rewardIds: ['signal-restored'], priority: 80 }),
  unlock({ id: 'unlock-memory-violet', type: 'palette', displayName: 'Memory Violet', description: 'Violet memory-forward player and Echo palette.', requirementText: 'Win with at least 35% friendly-Echo damage share.', rewardIds: ['memory-violet'], priority: 90 }),
  unlock({ id: 'unlock-architect-fracture', type: 'palette', displayName: 'Architect Fracture', description: 'White-red fracture palette.', requirementText: 'Defeat the Null Architect without consuming Last Frame.', rewardIds: ['architect-fracture'], priority: 100 }),
  unlock({ id: 'unlock-resonant-wave', type: 'trail', displayName: 'Resonant Wave', description: 'Violet delayed waveform trail.', requirementText: 'Win with at least 35% friendly-Echo damage share.', rewardIds: ['resonant-wave'], priority: 110 }),
  unlock({ id: 'unlock-clean-vector', type: 'trail', displayName: 'Clean Vector', description: 'Segmented mint motion trail.', requirementText: 'Clear a Standard combat chamber without damage and with at least three dashes.', rewardIds: ['clean-vector'], priority: 120 }),
  unlock({ id: 'unlock-station-cyan', type: 'trail', displayName: 'Station Cyan', description: 'Restored station-line trail.', requirementText: 'Complete an Overclocked victory.', rewardIds: ['station-cyan'], priority: 130 }),
]);

export const LORE_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'lore-first-signal', title: 'First Signal', requirementText: 'Begin a run.' }),
  Object.freeze({ id: 'lore-elite-architecture', title: 'Adaptive Architecture', requirementText: 'Encounter an elite modifier.' }),
  Object.freeze({ id: 'lore-null-architect', title: 'The Null Architect', requirementText: 'Reach the boss.' }),
  Object.freeze({ id: 'lore-signal-restored', title: 'Signal Restored', requirementText: 'Win a run.' }),
]);

export function getUnlockDefinition(id) { return UNLOCK_DEFINITIONS.find((entry) => entry.id === id) ?? null; }
