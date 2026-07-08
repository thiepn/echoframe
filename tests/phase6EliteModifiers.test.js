import test from 'node:test';
import assert from 'node:assert/strict';
import { CORE_ENEMY_DEFINITIONS, CORE_ENEMY_TYPE_LIST } from '../src/data/coreEnemyDefinitions.js';
import { getDifficultyCombatProfile } from '../src/data/combatBalance.js';
import { ELITE_MODIFIER_DEFINITIONS } from '../src/data/eliteModifierDefinitions.js';
import { createEliteActivationProfile, applyEliteAnticipation, applyEliteRecovery } from '../src/elites/EliteActivationProfile.js';
import { isEliteEligible, eligibleHosts } from '../src/elites/EliteEligibility.js';
import { EliteThreatModel } from '../src/elites/EliteThreatModel.js';
import { ReplicatingModifier } from '../src/elites/modifiers/ReplicatingModifier.js';
import { ResonantModifier } from '../src/elites/modifiers/ResonantModifier.js';
import { OverclockedModifier } from '../src/elites/modifiers/OverclockedModifier.js';
import { ReplicationSpawnService } from '../src/systems/ReplicationSpawnService.js';
import { MajorExecutionCoordinator } from '../src/systems/MajorExecutionCoordinator.js';
import { DamageService } from '../src/combat/DamageService.js';
import { createDamagePacket } from '../src/combat/DamagePacket.js';
import { FACTIONS } from '../src/combat/Faction.js';
import { HealthComponent } from '../src/components/HealthComponent.js';

const standard = getDifficultyCombatProfile('standard');
const elite = (modifierId, hostEnemyType = 'drifter') => ({ modifierId, eliteInstanceId: `test-${modifierId}`, hostEnemyType, threatSurcharge: ELITE_MODIFIER_DEFINITIONS[modifierId].threatSurcharge });
const profile = (enemyType, modifierId, difficulty = standard, copyProfile = null) => createEliteActivationProfile({ enemyType, enemyDefinition: CORE_ENEMY_DEFINITIONS[enemyType], difficultyProfile: difficulty, elite: modifierId ? elite(modifierId, enemyType) : null, copyProfile });

test('Overclocked definition contains canonical scalars', () => assert.deepEqual({ health: ELITE_MODIFIER_DEFINITIONS.overclocked.healthScalar, movement: ELITE_MODIFIER_DEFINITIONS.overclocked.movementScalar, anticipation: ELITE_MODIFIER_DEFINITIONS.overclocked.anticipationScalar, recovery: ELITE_MODIFIER_DEFINITIONS.overclocked.recoveryScalar, threat: ELITE_MODIFIER_DEFINITIONS.overclocked.threatSurcharge }, { health: 1.3, movement: 1.15, anticipation: 0.85, recovery: 0.8, threat: 3 }));

test('Replicating definition contains canonical scalars', () => assert.deepEqual({ health: ELITE_MODIFIER_DEFINITIONS.replicating.healthScalar, threshold: ELITE_MODIFIER_DEFINITIONS.replicating.triggerHealthRatio, copyHealth: ELITE_MODIFIER_DEFINITIONS.replicating.copyHealthRatio, copyDamage: ELITE_MODIFIER_DEFINITIONS.replicating.copyDamageScalar, copySpeed: ELITE_MODIFIER_DEFINITIONS.replicating.copySpeedScalar, threat: ELITE_MODIFIER_DEFINITIONS.replicating.threatSurcharge }, { health: 1.15, threshold: 0.5, copyHealth: 0.5, copyDamage: 0.8, copySpeed: 0.95, threat: 4 }));

test('Resonant definition contains canonical values', () => assert.deepEqual({ health: ELITE_MODIFIER_DEFINITIONS.resonant.healthScalar, shield: ELITE_MODIFIER_DEFINITIONS.resonant.shieldRatio, duration: ELITE_MODIFIER_DEFINITIONS.resonant.shieldDurationMs, radius: ELITE_MODIFIER_DEFINITIONS.resonant.triggerRadius, cooldown: ELITE_MODIFIER_DEFINITIONS.resonant.internalCooldownMs, threat: ELITE_MODIFIER_DEFINITIONS.resonant.threatSurcharge }, { health: 1.2, shield: 0.24, duration: 3500, radius: 300, cooldown: 2500, threat: 4 }));

test('Overclocked health and movement apply exactly once', () => {
  const value = profile('drifter', 'overclocked');
  assert.equal(value.maximumHealth, Math.round(32 * 1.3));
  assert.equal(value.moveSpeed, 145 * 1.15);
});

test('Overclocked does not alter damage', () => assert.equal(profile('lancer', 'overclocked').damageScalar, 1));

test('Overclocked Sentry anticipation respects 500 ms floor', () => {
  const value = profile('sentry', 'overclocked', getDifficultyCombatProfile('overclocked'));
  assert.equal(applyEliteAnticipation(value, 500), 500);
});

test('Overclocked Lancer anticipation respects 550 ms floor', () => {
  const value = profile('lancer', 'overclocked', getDifficultyCombatProfile('overclocked'));
  assert.equal(applyEliteAnticipation(value, 550), 550);
});

test('Overclocked recovery applies modifier and difficulty once', () => {
  const value = profile('drifter', 'overclocked', getDifficultyCombatProfile('overclocked'));
  assert.ok(Math.abs(applyEliteRecovery(value, 1000) - 720) < 1e-9);
});

test('normal activation profile preserves base Standard values', () => {
  const value = profile('drifter', null);
  assert.equal(value.maximumHealth, 32);
  assert.equal(value.moveSpeed, 145);
  assert.equal(value.damageScalar, 1);
});

test('copy activation profile uses explicit modified maximum health without double difficulty', () => {
  const value = profile('sentry', null, getDifficultyCombatProfile('overclocked'), { maximumHealth: 31, healthScalar: 0.5, movementScalar: 0.95, damageScalar: 0.8, copyOfEliteInstanceId: 'parent' });
  assert.equal(value.maximumHealth, 31);
  assert.equal(value.moveSpeed, 105 * 0.95 * 1.08);
  assert.equal(value.damageScalar, 0.8);
  assert.equal(value.copyOfEliteInstanceId, 'parent');
});

test('activation profile is deeply serializable without functions', () => {
  const value = profile('bulwark', 'resonant');
  assert.equal(Object.values(value).some((entry) => typeof entry === 'function'), false);
  assert.deepEqual(JSON.parse(JSON.stringify(value)), structuredClone(value));
});

test('Overclocked and Resonant accept all six standard enemies', () => {
  assert.deepEqual(eligibleHosts('overclocked', CORE_ENEMY_TYPE_LIST), CORE_ENEMY_TYPE_LIST);
  assert.deepEqual(eligibleHosts('resonant', CORE_ENEMY_TYPE_LIST), CORE_ENEMY_TYPE_LIST);
});

test('Replicating excludes Suppressor', () => {
  assert.equal(isEliteEligible({ enemyType: 'suppressor', modifierId: 'replicating' }), false);
  assert.equal(eligibleHosts('replicating', CORE_ENEMY_TYPE_LIST).includes('suppressor'), false);
});

test('elite copies are ineligible for every modifier', () => {
  for (const modifierId of Object.keys(ELITE_MODIFIER_DEFINITIONS)) assert.equal(isEliteEligible({ enemyType: 'drifter', modifierId, isCopy: true }), false);
});

test('bosses are ineligible for every modifier', () => {
  for (const modifierId of Object.keys(ELITE_MODIFIER_DEFINITIONS)) assert.equal(isEliteEligible({ enemyType: 'drifter', modifierId, isBoss: true }), false);
});

test('elite threat model adds canonical surcharge once', () => {
  assert.deepEqual(EliteThreatModel.calculate('lancer', 'overclocked'), { baseThreat: 3, threatSurcharge: 3, totalThreat: 6 });
  assert.deepEqual(EliteThreatModel.calculate('bulwark', 'replicating'), { baseThreat: 4, threatSurcharge: 4, totalThreat: 8 });
});

test('Overclocked modifier counts attacks and resets', () => {
  const modifier = new OverclockedModifier({ definition: ELITE_MODIFIER_DEFINITIONS.overclocked });
  modifier.onAttackExecution(); modifier.onAttackExecution(); modifier.update(1400);
  assert.equal(modifier.attackCount, 2);
  assert.equal(modifier.heatPulseMs, 400);
  modifier.reset();
  assert.deepEqual(modifier.snapshot(), { heatPulseMs: 0, attackCount: 0 });
});

test('Replicating triggers only when accepted health crosses threshold', () => {
  const modifier = new ReplicatingModifier({ definition: ELITE_MODIFIER_DEFINITIONS.replicating });
  assert.equal(modifier.onAcceptedDamage({ damageApplied: 10, remainingHealth: 51, maximumHealth: 100, targetDefeated: false }), false);
  assert.equal(modifier.onAcceptedDamage({ damageApplied: 1, remainingHealth: 50, maximumHealth: 100, targetDefeated: false }), true);
});

test('Replicating does not trigger from zero damage', () => {
  const modifier = new ReplicatingModifier({ definition: ELITE_MODIFIER_DEFINITIONS.replicating });
  assert.equal(modifier.onAcceptedDamage({ damageApplied: 0, remainingHealth: 40, maximumHealth: 100, targetDefeated: false }), false);
});

test('Replicating does not trigger from lethal damage', () => {
  const modifier = new ReplicatingModifier({ definition: ELITE_MODIFIER_DEFINITIONS.replicating });
  assert.equal(modifier.onAcceptedDamage({ damageApplied: 100, remainingHealth: 0, maximumHealth: 100, targetDefeated: true }), false);
});

test('Replicating triggers at most once', () => {
  const modifier = new ReplicatingModifier({ definition: ELITE_MODIFIER_DEFINITIONS.replicating });
  assert.equal(modifier.onAcceptedDamage({ damageApplied: 50, remainingHealth: 50, maximumHealth: 100, targetDefeated: false }), true);
  assert.equal(modifier.onAcceptedDamage({ damageApplied: 1, remainingHealth: 49, maximumHealth: 100, targetDefeated: false }), false);
});

test('Replicating warning is pause-safe when update is not called', () => {
  const modifier = new ReplicatingModifier({ definition: ELITE_MODIFIER_DEFINITIONS.replicating });
  modifier.onAcceptedDamage({ damageApplied: 50, remainingHealth: 50, maximumHealth: 100, targetDefeated: false });
  const before = modifier.pendingMs;
  assert.equal(modifier.pendingMs, before);
});

test('Replicating becomes ready after warning duration', () => {
  const modifier = new ReplicatingModifier({ definition: ELITE_MODIFIER_DEFINITIONS.replicating });
  modifier.onAcceptedDamage({ damageApplied: 50, remainingHealth: 50, maximumHealth: 100, targetDefeated: false });
  modifier.update(899);
  assert.equal(modifier.readyToSpawn, false);
  modifier.update(1);
  assert.equal(modifier.readyToSpawn, true);
});

test('Replicating cancellation prevents copy spawn', () => {
  const modifier = new ReplicatingModifier({ definition: ELITE_MODIFIER_DEFINITIONS.replicating });
  modifier.onAcceptedDamage({ damageApplied: 50, remainingHealth: 50, maximumHealth: 100, targetDefeated: false });
  modifier.cancel('cancelled-parent-death');
  assert.equal(modifier.readyToSpawn, false);
  assert.equal(modifier.outcome, 'cancelled-parent-death');
});

test('Replicating records successful and rejected outcomes', () => {
  const success = new ReplicatingModifier({ definition: ELITE_MODIFIER_DEFINITIONS.replicating });
  success.onAcceptedDamage({ damageApplied: 50, remainingHealth: 50, maximumHealth: 100, targetDefeated: false }); success.update(900); success.markSpawned('copy-1');
  assert.equal(success.outcome, 'copy-spawned');
  const rejected = new ReplicatingModifier({ definition: ELITE_MODIFIER_DEFINITIONS.replicating });
  rejected.onAcceptedDamage({ damageApplied: 50, remainingHealth: 50, maximumHealth: 100, targetDefeated: false }); rejected.markRejected();
  assert.equal(rejected.outcome, 'copy-spawn-rejected');
});

test('Resonant grants canonical finite shield from nearby ally death', () => {
  const modifier = new ResonantModifier({ definition: ELITE_MODIFIER_DEFINITIONS.resonant, maximumHealth: 120 });
  assert.equal(modifier.onAlliedDeath({ x: 1, y: 2, distance: 299, deathEventId: 'a' }), true);
  assert.ok(Math.abs(modifier.shieldAmount - 28.8) < 1e-9);
  assert.equal(modifier.shieldRemainingMs, 3500);
});

test('Resonant rejects out-of-radius ally death', () => {
  const modifier = new ResonantModifier({ definition: ELITE_MODIFIER_DEFINITIONS.resonant, maximumHealth: 120 });
  assert.equal(modifier.onAlliedDeath({ x: 1, y: 2, distance: 301, deathEventId: 'a' }), false);
});

test('Resonant deduplicates one death event', () => {
  const modifier = new ResonantModifier({ definition: ELITE_MODIFIER_DEFINITIONS.resonant, maximumHealth: 100 });
  assert.equal(modifier.onAlliedDeath({ x: 1, y: 2, distance: 10, deathEventId: 'same' }), true);
  modifier.shieldAmount = 0; modifier.shieldRemainingMs = 0; modifier.cooldownRemainingMs = 0;
  assert.equal(modifier.onAlliedDeath({ x: 1, y: 2, distance: 10, deathEventId: 'same' }), false);
});

test('Resonant simultaneous deaths do not stack shield amount', () => {
  const modifier = new ResonantModifier({ definition: ELITE_MODIFIER_DEFINITIONS.resonant, maximumHealth: 100 });
  modifier.onAlliedDeath({ x: 1, y: 2, distance: 10, deathEventId: 'a' });
  assert.equal(modifier.onAlliedDeath({ x: 2, y: 3, distance: 10, deathEventId: 'b' }), false);
  assert.equal(modifier.shieldAmount, 24);
});

test('Resonant shield absorbs damage without going negative', () => {
  const modifier = new ResonantModifier({ definition: ELITE_MODIFIER_DEFINITIONS.resonant, maximumHealth: 100 });
  modifier.onAlliedDeath({ x: 1, y: 2, distance: 10, deathEventId: 'a' });
  assert.deepEqual(modifier.absorb(10).absorbed, 10);
  const result = modifier.absorb(100);
  assert.equal(result.absorbed, 14);
  assert.equal(result.remaining, 86);
  assert.equal(modifier.shieldAmount, 0);
  assert.equal(modifier.consumeEndEvent(), 'broken');
});

test('Resonant shield expires after 3.5 seconds of simulation updates', () => {
  const modifier = new ResonantModifier({ definition: ELITE_MODIFIER_DEFINITIONS.resonant, maximumHealth: 100 });
  modifier.onAlliedDeath({ x: 1, y: 2, distance: 10, deathEventId: 'a' });
  modifier.update(3499); assert.ok(modifier.shieldAmount > 0);
  modifier.update(1); assert.equal(modifier.shieldAmount, 0); assert.equal(modifier.consumeEndEvent(), 'expired');
});

test('Resonant cooldown freezes when update is not called', () => {
  const modifier = new ResonantModifier({ definition: ELITE_MODIFIER_DEFINITIONS.resonant, maximumHealth: 100 });
  modifier.onAlliedDeath({ x: 1, y: 2, distance: 10, deathEventId: 'a' });
  assert.equal(modifier.cooldownRemainingMs, 2500);
});

test('DamageService consumes Resonant shield before health', () => {
  const health = new HealthComponent(100);
  const target = { active: true, faction: FACTIONS.enemy, health };
  const packet = createDamagePacket({ damageId: 'shield-hit', sourceFaction: FACTIONS.player, sourceType: 'player-projectile', sourceId: 'player', targetType: 'drifter', targetId: 'elite', baseAmount: 30, finalAmount: 30 });
  const service = new DamageService();
  const result = service.resolve(packet, target, { absorbDamage: (amount) => ({ absorbed: 24, remaining: amount - 24, diagnostics: { modifierId: 'resonant' } }) });
  assert.equal(result.shieldAbsorbed, 24);
  assert.equal(result.damageApplied, 6);
  assert.equal(health.currentHealth, 94);
  assert.equal(result.modifierDiagnostics.modifierId, 'resonant');
});

test('DamageService reports pre- and post-mitigation amounts', () => {
  const health = new HealthComponent(100);
  const target = { active: true, faction: FACTIONS.enemy, health };
  const packet = createDamagePacket({ damageId: 'mitigation-hit', sourceFaction: FACTIONS.player, sourceType: 'player-projectile', sourceId: 'player', targetType: 'bulwark', targetId: 'elite', baseAmount: 20, finalAmount: 20 });
  const result = new DamageService().resolve(packet, target, { damageReduction: 0.5 });
  assert.equal(result.amountBeforeMitigation, 20);
  assert.equal(result.amountAfterMitigation, 10);
  assert.equal(result.damageApplied, 10);
});

test('MajorExecutionCoordinator permits only two executions per 300 ms window', () => {
  const coordinator = new MajorExecutionCoordinator();
  assert.equal(coordinator.request('a'), true);
  assert.equal(coordinator.request('b'), true);
  assert.equal(coordinator.request('c'), false);
  coordinator.update(300);
  assert.equal(coordinator.request('c'), true);
});

test('MajorExecutionCoordinator freezes while update is not called', () => {
  const coordinator = new MajorExecutionCoordinator();
  coordinator.request('a'); coordinator.request('b');
  assert.equal(coordinator.request('c'), false);
  assert.equal(coordinator.snapshot().elapsedMs, 0);
});

test('Replication placement is deterministic and finite', () => {
  const service = new ReplicationSpawnService();
  const parent = { enemyId: 'parent', x: 800, y: 450, active: true, bodySprite: { body: { radius: 22 } } };
  const args = { parent, player: { x: 800, y: 720 }, activeEnemies: [parent], seed: 123 };
  assert.deepEqual(service.findPlacement(args), service.findPlacement(args));
  const result = service.findPlacement(args);
  assert.equal(result.valid, true);
  assert.equal(Number.isFinite(result.x) && Number.isFinite(result.y), true);
});

test('Replication placement avoids the player clearance radius', () => {
  const service = new ReplicationSpawnService();
  const parent = { enemyId: 'parent', x: 800, y: 450, active: true, bodySprite: { body: { radius: 22 } } };
  const player = { x: 800, y: 450 };
  const result = service.findPlacement({ parent, player, activeEnemies: [parent], seed: 222 });
  assert.equal(result.valid, true);
  assert.ok(Math.hypot(result.x - player.x, result.y - player.y) >= 230);
});
