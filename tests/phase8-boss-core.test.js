import test from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_BALANCE, BOSS_PHASES, BOSS_VULNERABILITY_STATES } from '../src/data/bossBalance.js';
import { getBossDifficultyRules } from '../src/data/bossDifficultyRules.js';
import { BossVulnerabilityController } from '../src/boss/BossVulnerabilityController.js';
import { BossRandomStreams } from '../src/boss/BossRandomStreams.js';
import { BossAttackScheduler } from '../src/boss/BossAttackScheduler.js';
import { NullArchitectController } from '../src/boss/NullArchitectController.js';
import { BossTelemetry } from '../src/systems/BossTelemetry.js';
import { BossOutcomeResolver } from '../src/boss/BossOutcomeResolver.js';
import { BossDestructionController } from '../src/boss/BossDestructionController.js';
import { DamageService } from '../src/combat/DamageService.js';
import { createDamagePacket } from '../src/combat/DamagePacket.js';
import { FACTIONS } from '../src/combat/Faction.js';
import { EventBus } from '../src/utils/EventBus.js';

function createController(difficultyId = 'standard') {
  const telemetry = new BossTelemetry();
  const streams = new BossRandomStreams(12345, difficultyId, 1);
  const scheduler = new BossAttackScheduler({ rng: streams.attackSelection, telemetry });
  const damageService = new DamageService({ eventBus: new EventBus(), runStateProvider: () => true });
  const controller = new NullArchitectController({ damageService, scheduler, telemetry, difficultyId });
  return { controller, scheduler, telemetry };
}
function packet(id, amount = 100) { return createDamagePacket({ damageId: id, sourceFaction: FACTIONS.player, sourceType: 'player-projectile', sourceId: 'player', targetType: 'boss', targetId: 'null-architect', baseAmount: amount, finalAmount: amount, hitPosition: { x: 800, y: 450 }, direction: { x: 1, y: 0 } }); }

test('boss health is canonical', () => assert.equal(BOSS_BALANCE.health, 3600));
test('boss contact damage is canonical', () => assert.equal(BOSS_BALANCE.contactDamage, 20));
test('boss add threat cap is canonical', () => assert.equal(BOSS_BALANCE.addThreatCap, 8));
test('boss maximum invulnerable interval is canonical', () => assert.equal(BOSS_BALANCE.maximumInvulnerableMs, 2800));
test('boss minimum vulnerable interval is canonical', () => assert.equal(BOSS_BALANCE.minimumVulnerableMs, 3500));
test('boss target duration lower bound is canonical', () => assert.equal(BOSS_BALANCE.targetFightDurationMs[0], 210000));
test('boss target duration upper bound is canonical', () => assert.equal(BOSS_BALANCE.targetFightDurationMs[1], 300000));
for (const id of ['relaxed','standard','overclocked']) test(`difficulty ${id} maps boss scaling exactly once`, () => { const rules = getBossDifficultyRules(id); assert.ok(rules.healthScalar > 0); assert.ok(rules.projectileSpeedScalar > 0); assert.ok(rules.playerInvulnerabilityScalar > 0); });
for (let index = 0; index < 7; index += 1) test(`vulnerability cycle sample ${index + 1} respects closed/open bounds`, () => { const value = new BossVulnerabilityController(); value.update(2800); assert.equal(value.state, BOSS_VULNERABILITY_STATES.opening); value.update(850); assert.equal(value.vulnerable, true); assert.ok(value.remainingMs >= 3500); value.update(4200); assert.equal(value.state, BOSS_VULNERABILITY_STATES.closing); value.update(650); assert.equal(value.state, BOSS_VULNERABILITY_STATES.closed); });
for (let seed = 1; seed <= 8; seed += 1) test(`scheduler deterministic sequence for seed ${seed}`, () => { const a = new BossAttackScheduler({ rng: new BossRandomStreams(seed).attackSelection }); const b = new BossAttackScheduler({ rng: new BossRandomStreams(seed).attackSelection }); const left = [], right = []; for (let i=0;i<80;i+=1) { const context = { phase: BOSS_PHASES.observe, summonThreat: 0, hostileEchoes: 0, hostileEchoCap: 1, sectorActive: false, panelsActive: false, maximumMajor: 1 }; const x=a.update(250,context), y=b.update(250,context); if(x){left.push(x);a.completeAttack(x.id);} if(y){right.push(y);b.completeAttack(y.id);} } assert.deepEqual(left,right); });
test('controller starts in Observe with scaled maximum health', () => { const { controller } = createController(); assert.equal(controller.phase, BOSS_PHASES.observe); assert.equal(controller.health.currentHealth, controller.maximumHealth); });
test('closed core rejects damage structurally', () => { const { controller } = createController(); const result = controller.receiveDamage(packet('closed')); assert.equal(result.accepted, false); assert.equal(result.rejectedReason, 'boss-closed'); });
test('vulnerable core accepts player damage', () => { const { controller } = createController(); controller.vulnerability.force(true); const result = controller.receiveDamage(packet('open')); assert.equal(result.accepted, true); assert.equal(result.damageApplied, 100); });
test('phase threshold clamps before Observe mechanics are complete', () => { const { controller } = createController(); controller.vulnerability.force(true); const result = controller.receiveDamage(packet('clamp', 2000)); assert.equal(result.accepted, true); assert.equal(controller.health.currentHealth, Math.round(controller.maximumHealth * .70)); assert.equal(controller.thresholdClampCount, 1); });
test('Observe transition begins after all signature mechanics', () => { const { controller } = createController(); for (const id of ['rotating-fan','targeted-line-volley','vulnerability']) controller.markMechanic(id); controller.vulnerability.force(true); controller.receiveDamage(packet('observe-transition', 2000)); assert.equal(controller.transitioning, true); });
test('Observe transition completes into Imitate once', () => { const { controller } = createController(); for (const id of ['rotating-fan','targeted-line-volley','vulnerability']) controller.markMechanic(id); controller.vulnerability.force(true); controller.receiveDamage(packet('observe-transition-complete', 2000)); controller.update(BOSS_BALANCE.phaseTransitionMs + 1); assert.equal(controller.phase, BOSS_PHASES.imitate); assert.equal(controller.transitioning, false); });
test('Imitate transition requires hostile Echo and vulnerability', () => { const { controller } = createController(); controller.forcePhase(BOSS_PHASES.imitate); controller.vulnerability.force(true); controller.receiveDamage(packet('imitate-clamp', 3000)); assert.equal(controller.health.currentHealth, Math.round(controller.maximumHealth * .35)); assert.equal(controller.transitioning, false); });
test('Delete defeat requires sector and rear-panel mechanics', () => { const { controller } = createController(); controller.forcePhase(BOSS_PHASES.delete); controller.vulnerability.force(true); controller.receiveDamage(packet('delete-clamp', 5000)); assert.equal(controller.destroyed, false); assert.equal(controller.health.currentHealth, 0); });
test('Delete defeat becomes final after signature mechanics', () => { const { controller } = createController(); controller.forcePhase(BOSS_PHASES.delete); controller.markMechanic('sector-deletion'); controller.markMechanic('rear-panel-exposure'); controller.vulnerability.force(true); const result = controller.receiveDamage(packet('delete-final', 5000)); assert.equal(controller.destroyed, true); assert.equal(result.bossDefeated, true); });
test('boss health never becomes negative', () => { const { controller } = createController(); controller.forcePhase(BOSS_PHASES.delete); controller.markMechanic('sector-deletion'); controller.markMechanic('rear-panel-exposure'); controller.vulnerability.force(true); controller.receiveDamage(packet('nonnegative', 999999)); assert.equal(controller.health.currentHealth, 0); });
test('damage during transition is rejected', () => { const { controller } = createController(); controller.beginTransition(BOSS_PHASES.imitate); const result = controller.receiveDamage(packet('transition-reject')); assert.equal(result.rejectedReason, 'phase-transition'); });
test('outcome resolver locks the first accepted outcome', () => { const resolver = new BossOutcomeResolver(); assert.equal(resolver.submit('victory').accepted, true); assert.equal(resolver.submit('defeat').accepted, false); });
test('same-tick boss-first sequence resolves victory', () => { const resolver = new BossOutcomeResolver(); const result = resolver.resolveSameTick([{kind:'victory',tick:1,sequence:2},{kind:'defeat',tick:1,sequence:3}]); assert.equal(result.kind,'victory'); });
test('same-tick player-first sequence resolves defeat', () => { const resolver = new BossOutcomeResolver(); const result = resolver.resolveSameTick([{kind:'victory',tick:1,sequence:4},{kind:'defeat',tick:1,sequence:3}]); assert.equal(result.kind,'defeat'); });
test('first-victory destruction cannot be skipped', () => { const destruction = new BossDestructionController({ firstVictory: true }); destruction.start(); assert.equal(destruction.skip(), false); });
test('repeat-victory destruction can be skipped once', () => { let completions=0; const destruction = new BossDestructionController({ firstVictory: false, onComplete:()=>completions++ }); destruction.start(); assert.equal(destruction.skip(), true); assert.equal(completions,1); assert.equal(destruction.skip(),false); });
