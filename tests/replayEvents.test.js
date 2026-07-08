import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeEventsThrough } from '../src/utils/replayEvents.js';

test('event playback dispatches one or multiple crossed events once in order', () => {
  const events = [
    { timestampMs: 10, id: 1 },
    { timestampMs: 20, id: 2 },
    { timestampMs: 30, id: 3 },
  ];
  const dispatched = [];
  let cursor = consumeEventsThrough(events, 0, 20, (event) => dispatched.push(event.id));
  assert.equal(cursor, 2);
  cursor = consumeEventsThrough(events, cursor, 100, (event) => dispatched.push(event.id));
  assert.equal(cursor, 3);
  consumeEventsThrough(events, cursor, 100, (event) => dispatched.push(event.id));
  assert.deepEqual(dispatched, [1, 2, 3]);
});
