import test from 'node:test';
import assert from 'node:assert/strict';
import { EncounterDirector } from '../src/systems/EncounterDirector.js';
import { COMBAT_BALANCE, getDifficultyCombatProfile } from '../src/data/combatBalance.js';
import { generateUpgradeOffers } from '../src/upgrades/UpgradeOfferGenerator.js';
import { UpgradeApplier } from '../src/upgrades/UpgradeApplier.js';
import { UpgradeManager } from '../src/systems/UpgradeManager.js';
import { CombatStatistics } from '../src/systems/CombatStatistics.js';

function createEnemyManager() {
  return { activeCount: 0, spawned: [], spawn(type, point) { this.spawned.push({ type, point }); return {}; }, clear() { this.activeCount = 0; } };
}

test('EncounterDirector follows deterministic authored order and completes once', () => {
  const enemies = createEnemyManager();
  const director = new EncounterDirector({ chamberIndex: 1, difficultyProfile: getDifficultyCombatProfile('standard'), enemyManager: enemies, playerProvider: () => ({ x: 800, y: 735 }) });
  director.start();
  for (let i = 0; i < 200 && !director.completed; i += 1) director.update(100);
  assert.equal(director.completed, true);
  assert.deepEqual(enemies.spawned.map((entry) => entry.type), ['drifter', 'drifter', 'drifter', 'sentry', 'drifter', 'drifter', 'drifter', 'sentry']);
  director.update(1000);
  assert.equal(director.completed, true);
});

test('EncounterDirector pause is achieved by not advancing update', () => {
  const director = new EncounterDirector({ chamberIndex: 1, difficultyProfile: getDifficultyCombatProfile('standard'), enemyManager: createEnemyManager(), playerProvider: () => null });
  director.start();
  const before = director.snapshot();
  const after = director.snapshot();
  assert.deepEqual(after, before);
});

test('difficulty combat profiles contain canonical multipliers', () => {
  assert.equal(getDifficultyCombatProfile('relaxed').enemyHealth, 0.9);
  assert.equal(getDifficultyCombatProfile('standard').projectileSpeed, 1);
  assert.equal(getDifficultyCombatProfile('overclocked').anticipation, 0.9);
  assert.equal(COMBAT_BALANCE.player.maximumHealth, 100);
});

test('upgrade offers are deterministic, unique, and exactly three', () => {
  const a = generateUpgradeOffers({ seed: 1234, offerIndex: 0 });
  const b = generateUpgradeOffers({ seed: 1234, offerIndex: 0 });
  assert.deepEqual(a.map((entry) => entry.id), b.map((entry) => entry.id));
  assert.equal(a.length, 3);
  assert.equal(new Set(a.map((entry) => entry.id)).size, 3);
});

test('upgrade offers exclude capped upgrades', () => {
  const levels = new Map([['last-frame', 1], ['split-lens', 2]]);
  const offers = generateUpgradeOffers({ seed: 42, levels, count: 8 });
  assert.equal(offers.some((entry) => entry.id === 'last-frame'), false);
  assert.equal(offers.some((entry) => entry.id === 'split-lens'), false);
});

test('UpgradeApplier increments once and rejects caps', () => {
  const levels = new Map();
  const applier = new UpgradeApplier();
  assert.equal(applier.apply('last-frame', levels).applied, true);
  assert.equal(applier.apply('last-frame', levels).reason, 'level-cap');
  assert.equal(applier.apply('missing', levels).reason, 'invalid-upgrade');
});

test('UpgradeManager exposes canonical weapon and Echo effects', () => {
  const run = { seed: 2, selectedUpgrades: new Map() };
  const manager = new UpgradeManager({ run });
  manager.apply('stable-projection');
  manager.apply('piercing-signal');
  assert.equal(manager.echoScalar(), 0.65);
  assert.equal(manager.projectileProfile(0).pierce, 1);
});

test('CombatStatistics tracks combat contributions and reset', () => {
  const stats = new CombatStatistics();
  stats.recordProjectileHit('player', 10, true);
  stats.recordProjectileHit('echo', 5.5, false);
  stats.recordKill('echo', 'sentry');
  stats.recordBlocked('dash');
  const snapshot = stats.snapshot();
  assert.equal(snapshot.playerDamageDealt, 10);
  assert.equal(snapshot.echoDamageDealt, 5.5);
  assert.equal(snapshot.echoKills, 1);
  assert.equal(snapshot.sentriesDefeated, 1);
  assert.equal(snapshot.damageBlockedByDash, 1);
  stats.reset();
  assert.equal(stats.echoKills, 0);
});
