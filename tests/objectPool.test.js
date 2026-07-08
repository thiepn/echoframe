import assert from 'node:assert/strict';
import test from 'node:test';
import { ObjectPool } from '../src/pools/ObjectPool.js';

function createPool() {
  return new ObjectPool({
    factory: (id) => ({ id, resets: 0 }),
    initialCapacity: 2,
    expansionChunk: 2,
    hardCap: 4,
  });
}

test('ObjectPool creates initial capacity and reuses released items', () => {
  const pool = createPool();
  const first = pool.acquire();
  const second = pool.acquire();
  assert.equal(pool.diagnostics().capacity, 2);
  assert.equal(pool.release(first), true);
  assert.equal(pool.acquire(), first);
  assert.equal(pool.release(second), true);
});

test('ObjectPool expands in chunks up to hard cap', () => {
  const pool = createPool();
  const items = [pool.acquire(), pool.acquire(), pool.acquire(), pool.acquire()];
  assert.equal(pool.diagnostics().capacity, 4);
  assert.equal(pool.acquire(), null);
  for (const item of items) {
    pool.release(item);
  }
});

test('ObjectPool deactivation is idempotent', () => {
  const pool = createPool();
  const item = pool.acquire();
  assert.equal(pool.release(item), true);
  assert.equal(pool.release(item), false);
});
