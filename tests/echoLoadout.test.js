import test from 'node:test';
import assert from 'node:assert/strict';
import { createEchoLoadoutSnapshot } from '../src/systems/EchoLoadoutSnapshot.js';

test('Echo loadout snapshot is deeply immutable and detached from source', () => {
  const source = {
    echoDamageScalar: 0.55,
    projectileSpeed: 850,
    projectileLifetimeMs: 1400,
    projectileRadius: 5,
    spawnOffset: 26,
    projectileCount: 1,
    spreadAngles: [0],
    baseDamage: 10,
    criticalChance: 0.05,
    criticalMultiplier: 1.6,
    sourceUpgradeLevels: { test: 1 },
  };
  const snapshot = createEchoLoadoutSnapshot(source);
  source.spreadAngles[0] = 9;
  source.sourceUpgradeLevels.test = 4;
  assert.equal(snapshot.spreadAngles[0], 0);
  assert.equal(snapshot.sourceUpgradeLevels.test, 1);
  assert.equal(snapshot.echoDamageScalar, 0.55);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.spreadAngles), true);
});
