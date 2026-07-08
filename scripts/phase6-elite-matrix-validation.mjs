import fs from 'node:fs';
import path from 'node:path';
import { ELITE_MODIFIER_DEFINITIONS } from '../src/data/eliteModifierDefinitions.js';
import { CORE_ENEMY_DEFINITIONS } from '../src/data/coreEnemyDefinitions.js';
import { isEliteEligible } from '../src/elites/EliteEligibility.js';
import { createEliteActivationProfile, applyEliteAnticipation, applyEliteRecovery } from '../src/elites/EliteActivationProfile.js';
import { getDifficultyCombatProfile } from '../src/data/combatBalance.js';
import { OverclockedModifier } from '../src/elites/modifiers/OverclockedModifier.js';
import { ReplicatingModifier } from '../src/elites/modifiers/ReplicatingModifier.js';
import { ResonantModifier } from '../src/elites/modifiers/ResonantModifier.js';

const difficulties = ['relaxed', 'standard', 'overclocked'];
const rows = [];
for (const difficultyId of difficulties) {
  const difficulty = getDifficultyCombatProfile(difficultyId);
  for (const enemyType of Object.keys(CORE_ENEMY_DEFINITIONS)) {
    for (const modifierId of Object.keys(ELITE_MODIFIER_DEFINITIONS).filter((candidate) => isEliteEligible({ enemyType, modifierId: candidate }))) {
      const definition = ELITE_MODIFIER_DEFINITIONS[modifierId];
      const base = CORE_ENEMY_DEFINITIONS[enemyType];
      const elite = { modifierId, eliteInstanceId: `matrix-${difficultyId}-${enemyType}-${modifierId}`, threatSurcharge: definition.threatSurcharge };
      const profile = createEliteActivationProfile({ enemyType, enemyDefinition: base, difficultyProfile: difficulty, elite });
      const checks = {
        serializable: (() => { try { JSON.stringify(profile); return true; } catch { return false; } })(),
        finiteHealth: Number.isFinite(profile.maximumHealth) && profile.maximumHealth > 0,
        finiteMovement: Number.isFinite(profile.moveSpeed) && profile.moveSpeed > 0,
        finiteAnticipation: Number.isFinite(applyEliteAnticipation(profile, base.attackTiming?.anticipationMs ?? 600)),
        finiteRecovery: Number.isFinite(applyEliteRecovery(profile, base.attackTiming?.recoveryMs ?? 700)),
        threatSurcharge: profile.threatSurcharge === definition.threatSurcharge,
        damageScalar: profile.damageScalar === definition.damageScalar,
        modifierIdentity: profile.modifierId === modifierId && profile.isElite === true,
      };
      const behavioral = {};
      if (modifierId === 'overclocked') {
        const modifier = new OverclockedModifier({ definition }); modifier.onAttackExecution(); modifier.onAttackExecution();
        behavioral.attackCount = modifier.attackCount === 2;
        behavioral.reset = (modifier.reset(), modifier.attackCount === 0);
      } else if (modifierId === 'replicating') {
        const modifier = new ReplicatingModifier({ definition });
        const triggered = modifier.onAcceptedDamage({ damageApplied: 1, remainingHealth: 49, maximumHealth: 100, targetDefeated: false });
        modifier.update(definition.splitWarningMs);
        behavioral.threshold = triggered && modifier.readyToSpawn;
        modifier.markSpawned(); behavioral.copyStats = definition.copyHealthRatio === 0.5 && definition.copyDamageScalar === 0.8 && definition.copySpeedScalar === 0.95;
        modifier.reset(); behavioral.reset = !modifier.triggered && modifier.outcome === null;
      } else {
        const modifier = new ResonantModifier({ definition, maximumHealth: profile.maximumHealth });
        const granted = modifier.onAlliedDeath({ x: 0, y: 0, distance: definition.triggerRadius - 1, deathEventId: 'matrix-death' });
        const absorbed = modifier.absorb(modifier.shieldAmount / 2);
        modifier.update(definition.shieldDurationMs);
        behavioral.trigger = granted; behavioral.absorption = absorbed.absorbed > 0; behavioral.expiry = modifier.shieldAmount === 0;
        modifier.reset(); behavioral.reset = modifier.shieldAmount === 0 && modifier.cooldownRemainingMs === 0;
      }
      const passed = Object.values(checks).every(Boolean) && Object.values(behavioral).every(Boolean);
      rows.push({ difficultyId, enemyType, modifierId, profile, checks, behavioral, passed });
    }
  }
}
const report = {
  generatedAt: new Date().toISOString(),
  eligiblePairsPerDifficulty: rows.length / difficulties.length,
  totalMatrixCases: rows.length,
  passedCases: rows.filter((row) => row.passed).length,
  failedCases: rows.filter((row) => !row.passed).length,
  rows,
};
report.passed = report.failedCases === 0;
const outputPath = path.resolve('docs/PHASE6_ELITE_MATRIX_VALIDATION.json');
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, eligiblePairsPerDifficulty: report.eligiblePairsPerDifficulty, totalMatrixCases: report.totalMatrixCases, passedCases: report.passedCases, failedCases: report.failedCases }, null, 2));
if (!report.passed) process.exitCode = 1;
