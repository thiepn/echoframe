import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UPGRADE_DEFINITIONS,
  UPGRADE_IDS,
  INITIAL_UNLOCKED_UPGRADE_IDS,
  LOCKED_UPGRADE_IDS,
  getUpgrade,
} from '../src/upgrades/UpgradeCatalog.js';
import { generateUpgradeOffers } from '../src/upgrades/UpgradeOfferGenerator.js';
import { UpgradeStatPipeline } from '../src/upgrades/UpgradeStatPipeline.js';
import { ArcRelayBehavior } from '../src/upgrades/behaviors/ArcRelayBehavior.js';
import { FractureRoundBehavior } from '../src/upgrades/behaviors/FractureRoundBehavior.js';
import { PhaseRecoveryBehavior } from '../src/upgrades/behaviors/PhaseRecoveryBehavior.js';
import { VectorReversalBehavior } from '../src/upgrades/behaviors/VectorReversalBehavior.js';
import { NullAbsorptionBehavior } from '../src/upgrades/behaviors/NullAbsorptionBehavior.js';

const expected = {
  'split-lens': [{ count: 2, angles: [0, 8], scalar: .72, fragmentGuardMs: 80 }, { count: 3, angles: [-9, 0, 9], scalar: .62, fragmentGuardMs: 80 }],
  'piercing-signal': [1, 2, 3].map((pierce) => ({ pierce, decay: .82, floor: .45 })),
  'arc-relay': [{ hitCadence: 6, targetCount: 1, scalar: .45, range: 220 }, { hitCadence: 6, targetCount: 2, scalar: .42, range: 220 }, { hitCadence: 6, targetCount: 3, scalar: .40, range: 220 }],
  'fracture-round': [{ count: 2, scalar: .35, speedScalar: .7, lifetimeMs: 500 }, { count: 3, scalar: .33, speedScalar: .7, lifetimeMs: 500 }, { count: 4, scalar: .30, speedScalar: .7, lifetimeMs: 500 }],
  'compression-coil': [{ speed: 1.12, damage: 1.08, chargeMs: 1200, decayMs: 350, dashRetention: .5 }, { speed: 1.18, damage: 1.12, chargeMs: 1200, decayMs: 350, dashRetention: .5 }, { speed: 1.24, damage: 1.16, chargeMs: 1200, decayMs: 350, dashRetention: .5 }],
  'ricochet-matrix': [{ bounces: 1, decay: .82, sameTargetGuardMs: 120 }, { bounces: 2, decay: .82, sameTargetGuardMs: 120 }],
  'extended-memory': [{ durationBonusMs: 600, maximumDurationMs: 5300, cooldownBonusMs: 250 }, { durationBonusMs: 1200, maximumDurationMs: 5300, cooldownBonusMs: 500 }, { durationBonusMs: 1800, maximumDurationMs: 5300, cooldownBonusMs: 750 }],
  'twin-recall': [{ delayMs: 650, secondaryScalar: .75, cooldownBonusMs: 1000, activeCap: 2 }],
  'resonant-damage': [{ bonus: .12, windowMs: 1000, targetCooldownMs: 650 }, { bonus: .18, windowMs: 1000, targetCooldownMs: 650 }, { bonus: .24, windowMs: 1000, targetCooldownMs: 650 }],
  'phantom-shield': [{ capacity: 1 }, { capacity: 3 }, { capacity: 5 }],
  'stable-projection': [{ scalar: .65, cap: .9 }, { scalar: .75, cap: .9 }, { scalar: .85, cap: .9 }],
  'memory-burst': [{ radius: 90, damage: 24 }, { radius: 110, damage: 36 }, { radius: 130, damage: 48 }],
  'dash-wake': [{ damage: 18, lifetimeMs: 450, width: 28, echoScalar: .55 }, { damage: 27, lifetimeMs: 450, width: 28, echoScalar: .55 }, { damage: 36, lifetimeMs: 450, width: 28, echoScalar: .55 }],
  'phase-recovery': [{ radiusBonus: 28, reductionMs: 120, internalCooldownMs: 500 }, { radiusBonus: 28, reductionMs: 180, internalCooldownMs: 500 }, { radiusBonus: 28, reductionMs: 240, internalCooldownMs: 500 }],
  'kinetic-charge': [{ bonus: .08, threshold: .7, chargeMs: 1500, decayMs: 600 }, { bonus: .13, threshold: .7, chargeMs: 1500, decayMs: 600 }, { bonus: .18, threshold: .7, chargeMs: 1500, decayMs: 600 }],
  'vector-reversal': [{ windowMs: 450, distanceScalar: .7, minimumAngleDegrees: 120 }, { windowMs: 600, distanceScalar: .85, minimumAngleDegrees: 120 }],
  slipstream: [{ bonus: .12, distance: 46, durationMs: 1200, perEchoCooldownMs: 1500, movementCap: 440 }, { bonus: .18, distance: 46, durationMs: 1200, perEchoCooldownMs: 1500, movementCap: 440 }, { bonus: .24, distance: 46, durationMs: 1200, perEchoCooldownMs: 1500, movementCap: 440 }],
  afterburn: [{ bonus: .35, windowMs: 300, sideShotScalar: .5 }, { bonus: .55, windowMs: 300, sideShotScalar: .5 }, { bonus: .75, windowMs: 300, sideShotScalar: .5 }],
  'emergency-repair': [{ heal: 6 }, { heal: 10 }, { heal: 14 }],
  'reactive-shell': [{ reduction: .15, durationMs: 2000 }, { reduction: .22, durationMs: 2000 }, { reduction: .30, durationMs: 2000 }],
  'null-absorption': [{ chance: .15, reductionMs: 150, internalCooldownMs: 180 }, { chance: .22, reductionMs: 180, internalCooldownMs: 180 }, { chance: .30, reductionMs: 220, internalCooldownMs: 180 }],
  'last-frame': [{ invulnerabilityMs: 1200 }],
  'regenerative-circuit': [{ delayMs: 8000, tickMs: 1600, cap: 8 }, { delayMs: 7000, tickMs: 1400, cap: 12 }, { delayMs: 6000, tickMs: 1200, cap: 16 }],
  'deflection-pulse': [{ radius: 110, push: 55, eliteScalar: .5 }, { radius: 135, push: 75, eliteScalar: .5 }, { radius: 160, push: 95, eliteScalar: .5 }],
};

test('upgrade catalog contains exactly 24 unique definitions', () => {
  assert.equal(UPGRADE_DEFINITIONS.length, 24);
  assert.equal(UPGRADE_IDS.length, 24);
  assert.equal(new Set(UPGRADE_IDS).size, 24);
  assert.deepEqual(Object.keys(expected).sort(), [...UPGRADE_IDS].sort());
});

test('fresh save exposes 18 upgrades and retains six implemented locked upgrades', () => {
  assert.equal(INITIAL_UNLOCKED_UPGRADE_IDS.length, 18);
  assert.equal(LOCKED_UPGRADE_IDS.length, 6);
  assert.deepEqual(LOCKED_UPGRADE_IDS, ['twin-recall', 'memory-burst', 'vector-reversal', 'afterburn', 'null-absorption', 'deflection-pulse']);
});

for (const definition of UPGRADE_DEFINITIONS) {
  test(`${definition.id} definition is immutable, categorized, and internally complete`, () => {
    assert.ok(Object.isFrozen(definition));
    assert.ok(['Weapon', 'Echo', 'Mobility', 'Defense'].includes(definition.category));
    assert.equal(definition.levels.length, definition.maxLevel);
    assert.ok(definition.name.length > 0);
    assert.ok(definition.tags.length > 0);
    assert.equal(Boolean(definition.initiallyUnlocked), INITIAL_UNLOCKED_UPGRADE_IDS.includes(definition.id));
  });

  definition.levels.forEach((actual, index) => {
    test(`${definition.id} level ${index + 1} matches canonical gameplay values`, () => {
      assert.equal(actual.level, index + 1);
      assert.ok(actual.description.length > 0);
      for (const [key, value] of Object.entries(expected[definition.id][index])) {
        if (typeof value === 'number') assert.ok(Math.abs(actual[key] - value) < 1e-9, `${key}: ${actual[key]} !== ${value}`);
        else assert.deepEqual(actual[key], value);
      }
      for (const value of Object.values(actual)) {
        if (typeof value === 'number') assert.ok(Number.isFinite(value));
      }
    });
  });
}

test('seven deterministic offers can be generated without duplicate cards', () => {
  const levels = new Map();
  for (let offerIndex = 0; offerIndex < 7; offerIndex += 1) {
    const first = generateUpgradeOffers({ seed: 8128, offerIndex, levels, unlockedIds: INITIAL_UNLOCKED_UPGRADE_IDS, healthRatio: 1 });
    const second = generateUpgradeOffers({ seed: 8128, offerIndex, levels, unlockedIds: INITIAL_UNLOCKED_UPGRADE_IDS, healthRatio: 1 });
    assert.deepEqual(first.map((x) => x.id), second.map((x) => x.id));
    assert.equal(first.length, 3);
    assert.equal(new Set(first.map((x) => x.id)).size, 3);
    const pick = first[0];
    levels.set(pick.id, (levels.get(pick.id) ?? 0) + 1);
  }
});

test('locked and maxed upgrades are excluded from normal offers', () => {
  const levels = new Map(INITIAL_UNLOCKED_UPGRADE_IDS.map((id) => [id, getUpgrade(id).maxLevel]));
  const offers = generateUpgradeOffers({ seed: 3, offerIndex: 0, levels, unlockedIds: UPGRADE_IDS });
  assert.equal(offers.every((offer) => LOCKED_UPGRADE_IDS.includes(offer.id)), true);
});

test('UpgradeStatPipeline derives canonical frozen Echo and projectile values', () => {
  const levels = new Map([['split-lens', 2], ['piercing-signal', 3], ['ricochet-matrix', 2], ['stable-projection', 3], ['extended-memory', 3], ['twin-recall', 1]]);
  const derived = new UpgradeStatPipeline(levels).derive({ echoDamageScalar: .55, projectileCount: 1, spreadAngles: [0] });
  assert.equal(derived.projectileCount, 3);
  assert.deepEqual(derived.spreadAngles, [-9, 0, 9]);
  assert.equal(derived.projectileDamageScalar, .62);
  assert.equal(derived.pierceCount, 3);
  assert.equal(derived.ricochetCount, 2);
  assert.ok(Math.abs(derived.echoDamageScalar - .85) < 1e-9);
  assert.equal(derived.echoDurationBonusMs, 1800);
  assert.equal(derived.echoCooldownBonusMs, 1750);
  assert.equal(derived.echoActiveCap, 2);
});

test('Arc Relay triggers exactly every sixth qualifying hit per source', () => {
  const behavior = new ArcRelayBehavior();
  const profile = expected['arc-relay'][0];
  for (let index = 1; index < 6; index += 1) assert.equal(behavior.registerHit('player', profile), null);
  assert.equal(behavior.registerHit('player', profile).targetCount, 1);
  assert.equal(behavior.registerHit('echo-1', profile), null);
});

test('Fracture Round creates bounded non-recursive fragment descriptors', () => {
  const fragments = new FractureRoundBehavior().create({ profile: expected['fracture-round'][2], damage: 100, origin: { x: 10, y: 20 }, direction: { x: 1, y: 0 }, sourceId: 'player' });
  assert.equal(fragments.length, 4);
  assert.equal(fragments.every((fragment) => fragment.damage === 30 && fragment.canCrit === false && fragment.canTriggerChain === false && fragment.canTriggerFragments === false), true);
});

test('Phase Recovery accepts one bounded near miss and rejects repeats/collisions', () => {
  const behavior = new PhaseRecoveryBehavior();
  const profile = expected['phase-recovery'][0];
  assert.equal(behavior.register({ projectileId: 1, distance: 45, playerRadius: 20, nowMs: 1000, profile }), 120);
  assert.equal(behavior.register({ projectileId: 1, distance: 45, playerRadius: 20, nowMs: 2000, profile }), 0);
  assert.equal(behavior.register({ projectileId: 2, distance: 19, playerRadius: 20, nowMs: 2000, profile }), 0);
});

test('Vector Reversal permits one opposing secondary dash and no recursive third dash', () => {
  const behavior = new VectorReversalBehavior();
  const profile = expected['vector-reversal'][1];
  behavior.onPrimary({ x: 1, y: 0 }, profile);
  assert.equal(behavior.trySecondary({ x: -1, y: 0 }, profile), .85);
  assert.equal(Boolean(behavior.trySecondary({ x: 1, y: 0 }, profile)), false);
});

test('Null Absorption is deterministic for equal seeds and projectile IDs', () => {
  const profile = { chance: .3, reductionMs: 220, internalCooldownMs: 0 };
  const a = new NullAbsorptionBehavior(17);
  const b = new NullAbsorptionBehavior(17);
  const left = [], right = [];
  for (let id = 1; id <= 20; id += 1) { left.push(a.try(id, profile)); right.push(b.try(id, profile)); a.update(1); b.update(1); }
  assert.deepEqual(left, right);
});
