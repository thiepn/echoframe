import test from 'node:test';
import assert from 'node:assert/strict';
import { DamageService } from '../src/combat/DamageService.js';
import { createDamagePacket } from '../src/combat/DamagePacket.js';
import { FACTIONS } from '../src/combat/Faction.js';
import { HealthComponent } from '../src/components/HealthComponent.js';

const target = (faction, health = 50) => ({ faction, active: true, health: new HealthComponent(health) });
const packet = (overrides = {}) => createDamagePacket({ damageId: 'd1', sourceFaction: FACTIONS.player, targetId: 'enemy-1', baseAmount: 10, finalAmount: 10, ...overrides });

test('DamageService accepts player and Echo damage against enemies', () => {
  const service = new DamageService();
  const enemy = target(FACTIONS.enemy);
  assert.equal(service.resolve(packet(), enemy).damageApplied, 10);
  assert.equal(service.resolve(packet({ damageId: 'd2', sourceFaction: FACTIONS.echo }), enemy).accepted, true);
  assert.equal(enemy.health.currentHealth, 30);
});

test('DamageService accepts enemy damage against player', () => {
  const service = new DamageService();
  const player = target(FACTIONS.player, 100);
  const result = service.resolve(packet({ damageId: 'hostile', sourceFaction: FACTIONS.enemy, targetId: 'player', finalAmount: 11 }), player);
  assert.equal(result.accepted, true);
  assert.equal(player.health.currentHealth, 89);
});

test('DamageService rejects friendly fire', () => {
  const service = new DamageService();
  const enemy = target(FACTIONS.enemy);
  const result = service.resolve(packet({ sourceFaction: FACTIONS.enemy }), enemy);
  assert.equal(result.rejectedReason, 'friendly-fire');
});

test('DamageService rejects invulnerable and duplicate damage', () => {
  const service = new DamageService();
  const enemy = target(FACTIONS.enemy);
  assert.equal(service.resolve(packet(), enemy, { hitInvulnerable: true }).rejectedReason, 'invulnerable');
  assert.equal(service.resolve(packet(), enemy).accepted, true);
  assert.equal(service.resolve(packet(), enemy).rejectedReason, 'duplicate-damage');
});

test('DamageService applies reduction and reports critical defeat', () => {
  const service = new DamageService();
  const enemy = target(FACTIONS.enemy, 10);
  const reduced = service.resolve(packet({ finalAmount: 10, critical: true }), enemy, { damageReduction: 0.2 });
  assert.equal(reduced.damageApplied, 8);
  const defeated = service.resolve(packet({ damageId: 'd2', finalAmount: 2, critical: true }), enemy);
  assert.equal(defeated.targetDefeated, true);
  assert.equal(defeated.critical, true);
});

test('DamageService supports once-only lethal prevention', () => {
  const service = new DamageService();
  const player = target(FACTIONS.player, 10);
  let consumed = 0;
  const result = service.resolve(packet({ sourceFaction: FACTIONS.enemy, targetId: 'player', finalAmount: 50 }), player, { preventLethal: true, consumePreventLethal: () => { consumed += 1; } });
  assert.equal(result.remainingHealth, 1);
  assert.equal(consumed, 1);
});
