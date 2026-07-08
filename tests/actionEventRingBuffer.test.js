import test from 'node:test';
import assert from 'node:assert/strict';
import { ActionEventRingBuffer } from '../src/buffers/ActionEventRingBuffer.js';

test('ActionEventRingBuffer stores chronological events and same-time order', () => {
  const buffer = new ActionEventRingBuffer(5);
  buffer.append({ timestampMs: 20, id: 'b' });
  buffer.append({ timestampMs: 10, id: 'a' });
  buffer.append({ timestampMs: 20, id: 'c' });
  assert.deepEqual(buffer.eventsInRange(0, 30).map((event) => event.id), ['a', 'b', 'c']);
});

test('ActionEventRingBuffer wraps at bounded capacity', () => {
  const buffer = new ActionEventRingBuffer(2);
  buffer.append({ timestampMs: 10, id: 1 });
  buffer.append({ timestampMs: 20, id: 2 });
  buffer.append({ timestampMs: 30, id: 3 });
  assert.equal(buffer.count, 2);
  assert.equal(buffer.wrapCount, 1);
  assert.deepEqual(buffer.eventsInRange(0, 100).map((event) => event.id), [2, 3]);
});

test('ActionEventCursor consumes events once through timestamp', () => {
  const buffer = new ActionEventRingBuffer(5);
  [10, 20, 30].forEach((timestampMs) => buffer.append({ timestampMs }));
  const cursor = buffer.createCursor(0, 30);
  assert.deepEqual(cursor.takeThrough(20).map((event) => event.timestampMs), [10, 20]);
  assert.deepEqual(cursor.takeThrough(30).map((event) => event.timestampMs), [30]);
  assert.equal(cursor.remaining, 0);
});

test('ActionEventRingBuffer clear removes stale events', () => {
  const buffer = new ActionEventRingBuffer(2);
  buffer.append({ timestampMs: 1, metadata: { value: 2 } });
  buffer.clear();
  assert.equal(buffer.count, 0);
  assert.deepEqual(buffer.eventsInRange(0, 2), []);
});
