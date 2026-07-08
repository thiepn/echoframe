import test from 'node:test';
import assert from 'node:assert/strict';
import { EchoCooldownModel } from '../src/systems/EchoCooldownModel.js';

test('EchoCooldownModel starts ready and consumes once', () => {
  const cooldown = new EchoCooldownModel(7000);
  assert.equal(cooldown.isReady, true);
  assert.equal(cooldown.consume(), true);
  assert.equal(cooldown.consume(), false);
  assert.equal(cooldown.remainingMs, 7000);
});

test('EchoCooldownModel counts down, clamps, recovers, and resets', () => {
  const cooldown = new EchoCooldownModel(1000);
  cooldown.consume();
  cooldown.update(400);
  assert.equal(cooldown.remainingMs, 600);
  cooldown.recover(1000);
  assert.equal(cooldown.remainingMs, 0);
  cooldown.consume();
  cooldown.setDuration(500);
  assert.equal(cooldown.remainingMs, 500);
  cooldown.reset();
  assert.equal(cooldown.isReady, true);
});
