function cloneSnapshot(snapshot) {
  return {
    timestampMs: Number(snapshot.timestampMs) || 0,
    x: Number(snapshot.x) || 0,
    y: Number(snapshot.y) || 0,
    aimX: Number(snapshot.aimX) || 0,
    aimY: Number(snapshot.aimY) || 0,
    aimRotation: Number(snapshot.aimRotation) || 0,
    velocityX: Number(snapshot.velocityX) || 0,
    velocityY: Number(snapshot.velocityY) || 0,
    movementState: String(snapshot.movementState ?? 'ACTIVE'),
    dashVisualState: Boolean(snapshot.dashVisualState),
  };
}

export class SnapshotRingBuffer {
  constructor(capacity) {
    this.capacity = Math.max(1, Math.trunc(capacity) || 1);
    this.storage = new Array(this.capacity);
    this.start = 0;
    this.count = 0;
    this.wrapCount = 0;
  }

  append(snapshot) {
    const value = cloneSnapshot(snapshot);
    let physicalIndex;
    if (this.count < this.capacity) {
      physicalIndex = (this.start + this.count) % this.capacity;
      this.count += 1;
    } else {
      physicalIndex = this.start;
      this.start = (this.start + 1) % this.capacity;
      this.wrapCount += 1;
    }
    this.storage[physicalIndex] = value;
    return value;
  }

  at(logicalIndex) {
    if (!Number.isInteger(logicalIndex) || logicalIndex < 0 || logicalIndex >= this.count) {
      return null;
    }
    return this.storage[(this.start + logicalIndex) % this.capacity] ?? null;
  }

  get oldest() {
    return this.at(0);
  }

  get newest() {
    return this.at(this.count - 1);
  }

  get oldestTimestampMs() {
    return this.oldest?.timestampMs ?? null;
  }

  get newestTimestampMs() {
    return this.newest?.timestampMs ?? null;
  }

  findSurrounding(timestampMs, hintIndex = 0) {
    if (this.count === 0) {
      return { before: null, after: null, beforeIndex: -1, afterIndex: -1 };
    }
    if (this.count === 1) {
      return { before: this.oldest, after: this.oldest, beforeIndex: 0, afterIndex: 0 };
    }

    const time = Number(timestampMs) || 0;
    if (time <= this.oldest.timestampMs) {
      return { before: this.oldest, after: this.oldest, beforeIndex: 0, afterIndex: 0 };
    }
    if (time >= this.newest.timestampMs) {
      const index = this.count - 1;
      return { before: this.newest, after: this.newest, beforeIndex: index, afterIndex: index };
    }

    let index = Math.max(0, Math.min(this.count - 2, Math.trunc(hintIndex) || 0));
    while (index > 0 && this.at(index).timestampMs > time) {
      index -= 1;
    }
    while (index < this.count - 2 && this.at(index + 1).timestampMs < time) {
      index += 1;
    }
    const before = this.at(index);
    const after = this.at(index + 1);
    return { before, after, beforeIndex: index, afterIndex: index + 1 };
  }

  extractRange(startTimestampMs, endTimestampMs, { includeNeighbors = true } = {}) {
    if (this.count === 0) {
      return [];
    }
    const startTime = Math.min(Number(startTimestampMs) || 0, Number(endTimestampMs) || 0);
    const endTime = Math.max(Number(startTimestampMs) || 0, Number(endTimestampMs) || 0);
    let first = 0;
    while (first < this.count && this.at(first).timestampMs < startTime) {
      first += 1;
    }
    let last = first;
    while (last < this.count && this.at(last).timestampMs <= endTime) {
      last += 1;
    }
    if (includeNeighbors) {
      first = Math.max(0, first - 1);
      last = Math.min(this.count, last + 1);
    }
    const result = [];
    for (let index = first; index < last; index += 1) {
      result.push(cloneSnapshot(this.at(index)));
    }
    return result;
  }

  clear() {
    for (let index = 0; index < this.storage.length; index += 1) {
      this.storage[index] = undefined;
    }
    this.start = 0;
    this.count = 0;
    this.wrapCount = 0;
  }

  diagnostics() {
    return {
      capacity: this.capacity,
      count: this.count,
      wrapCount: this.wrapCount,
      oldestTimestampMs: this.oldestTimestampMs,
      newestTimestampMs: this.newestTimestampMs,
    };
  }
}
