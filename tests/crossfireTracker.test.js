import test from 'node:test';
import assert from 'node:assert/strict';
import { CrossfireTracker } from '../src/systems/CrossfireTracker.js';

function tracker() {
  return new CrossfireTracker({ windowMs: 1000, targetCooldownMs: 1250 });
}

test('CrossfireTracker accepts player then Echo and Echo then player', () => {
  const first = tracker();
  assert.equal(first.registerHit({ targetId: 'a', source: 'player', timestampMs: 100 }), null);
  assert.equal(first.registerHit({ targetId: 'a', source: 'echo', timestampMs: 500 }).differenceMs, 400);
  const second = tracker();
  second.registerHit({ targetId: 'b', source: 'echo', timestampMs: 100 });
  assert.equal(second.registerHit({ targetId: 'b', source: 'player', timestampMs: 200 }).targetId, 'b');
});

test('CrossfireTracker rejects outside window, same source, and cooldown duplicates', () => {
  const value = tracker();
  value.registerHit({ targetId: 'a', source: 'player', timestampMs: 0 });
  assert.equal(value.registerHit({ targetId: 'a', source: 'echo', timestampMs: 1200 }), null);
  value.registerHit({ targetId: 'b', source: 'player', timestampMs: 0 });
  assert.equal(value.registerHit({ targetId: 'b', source: 'player', timestampMs: 100 }), null);
  value.registerHit({ targetId: 'c', source: 'player', timestampMs: 0 });
  assert.ok(value.registerHit({ targetId: 'c', source: 'echo', timestampMs: 100 }));
  value.registerHit({ targetId: 'c', source: 'player', timestampMs: 200 });
  assert.equal(value.registerHit({ targetId: 'c', source: 'echo', timestampMs: 300 }), null);
  value.reset();
  value.registerHit({ targetId: 'c', source: 'player', timestampMs: 0 });
  assert.ok(value.registerHit({ targetId: 'c', source: 'echo', timestampMs: 100 }));
});
