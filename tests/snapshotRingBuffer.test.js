import test from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotRingBuffer } from '../src/buffers/SnapshotRingBuffer.js';

function snapshot(timestampMs, x = timestampMs) {
  return {
    timestampMs,
    x,
    y: 0,
    aimX: 1,
    aimY: 0,
    aimRotation: 0,
    velocityX: 0,
    velocityY: 0,
    movementState: 'ACTIVE',
    dashVisualState: false,
  };
}

test('SnapshotRingBuffer starts empty and appends in order', () => {
  const buffer = new SnapshotRingBuffer(3);
  assert.equal(buffer.count, 0);
  buffer.append(snapshot(10));
  buffer.append(snapshot(20));
  assert.equal(buffer.oldestTimestampMs, 10);
  assert.equal(buffer.newestTimestampMs, 20);
  assert.equal(buffer.at(1).timestampMs, 20);
});

test('SnapshotRingBuffer wraps while preserving logical order', () => {
  const buffer = new SnapshotRingBuffer(3);
  [10, 20, 30, 40].forEach((time) => buffer.append(snapshot(time)));
  assert.equal(buffer.count, 3);
  assert.equal(buffer.wrapCount, 1);
  assert.deepEqual([0, 1, 2].map((index) => buffer.at(index).timestampMs), [20, 30, 40]);
});

test('SnapshotRingBuffer finds surrounding samples and handles boundaries', () => {
  const buffer = new SnapshotRingBuffer(5);
  [10, 20, 30].forEach((time) => buffer.append(snapshot(time)));
  assert.equal(buffer.findSurrounding(5).before.timestampMs, 10);
  const middle = buffer.findSurrounding(25);
  assert.equal(middle.before.timestampMs, 20);
  assert.equal(middle.after.timestampMs, 30);
  assert.equal(buffer.findSurrounding(35).after.timestampMs, 30);
});

test('SnapshotRingBuffer handles one sample, duplicate timestamps, range extraction, and clear', () => {
  const buffer = new SnapshotRingBuffer(5);
  buffer.append(snapshot(10));
  assert.equal(buffer.findSurrounding(10).before, buffer.findSurrounding(10).after);
  buffer.append(snapshot(10, 2));
  buffer.append(snapshot(20));
  const range = buffer.extractRange(10, 10);
  assert.ok(range.length >= 2);
  buffer.clear();
  assert.equal(buffer.count, 0);
  assert.equal(buffer.oldestTimestampMs, null);
});
