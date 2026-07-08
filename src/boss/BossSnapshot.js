function deepFreeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const child of Object.values(value))deepFreeze(child);return Object.freeze(value);}
export function createBossStartSnapshot(run) {
  return deepFreeze({
    runId: run.runId,
    seed: run.seed,
    difficultyId: run.difficultyId,
    playerHealth: run.playerHealth,
    playerMaximumHealth: run.playerMaximumHealth,
    selectedUpgrades: Object.fromEntries(run.selectedUpgrades),
    selectedUpgradeHistory: structuredClone(run.selectedUpgradeHistory),
    arenaSequence: structuredClone(run.arenaSequence),
    eliteModifiersDefeated: [...run.eliteModifiersDefeated],
    eliteHostTypesDefeated: [...run.eliteHostTypesDefeated],
    startedAtSimulationMs: run.elapsedSimulationMs,
  });
}
