import assert from 'node:assert/strict';
import test from 'node:test';
import { WeaponClock } from '../src/systems/WeaponClock.js';

test('first held update fires immediately', () => {
  const clock = new WeaponClock(200);
  assert.equal(clock.update(0, { held: true, canFire: true }), true);
  assert.equal(clock.cooldownRemainingMs, 200);
});

test('held fire respects interval', () => {
  const clock = new WeaponClock(200);
  clock.update(0, { held: true, canFire: true });
  assert.equal(clock.update(100, { held: true, canFire: true }), false);
  assert.equal(clock.update(100, { held: true, canFire: true }), true);
});

test('dash or transition rejection does not fire', () => {
  const clock = new WeaponClock(200);
  assert.equal(clock.update(0, { held: true, canFire: false }), false);
  assert.equal(clock.update(200, { held: true, canFire: false }), false);
});

test('release and fresh press fires without phantom queue', () => {
  const clock = new WeaponClock(200);
  clock.update(0, { held: true, canFire: true });
  clock.update(10, { held: false, canFire: true });
  assert.equal(clock.update(0, { held: true, canFire: true }), true);
  clock.reset();
  assert.equal(clock.snapshot().cooldownRemainingMs, 0);
});
