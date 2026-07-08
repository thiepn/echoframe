function cloneEvent(event) {
  return structuredClone(event);
}

export class ActionEventCursor {
  constructor(events) {
    this.events = events;
    this.index = 0;
  }

  peek() {
    return this.events[this.index] ?? null;
  }

  takeThrough(timestampMs) {
    const taken = [];
    const endTime = Number(timestampMs) || 0;
    while (this.index < this.events.length) {
      const event = this.events[this.index];
      if (event.timestampMs > endTime) {
        break;
      }
      taken.push(event);
      this.index += 1;
    }
    return taken;
  }

  reset() {
    this.index = 0;
  }

  get remaining() {
    return Math.max(0, this.events.length - this.index);
  }
}

export class ActionEventRingBuffer {
  constructor(capacity) {
    this.capacity = Math.max(1, Math.trunc(capacity) || 1);
    this.storage = new Array(this.capacity);
    this.start = 0;
    this.count = 0;
    this.wrapCount = 0;
    this.sequence = 0;
  }

  append(event) {
    const value = cloneEvent({ ...event, sequence: this.sequence });
    this.sequence += 1;
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

  eventsInRange(startTimestampMs, endTimestampMs) {
    const startTime = Math.min(Number(startTimestampMs) || 0, Number(endTimestampMs) || 0);
    const endTime = Math.max(Number(startTimestampMs) || 0, Number(endTimestampMs) || 0);
    const events = [];
    for (let index = 0; index < this.count; index += 1) {
      const event = this.at(index);
      if (event.timestampMs >= startTime && event.timestampMs <= endTime) {
        events.push(cloneEvent(event));
      }
    }
    events.sort((a, b) => a.timestampMs - b.timestampMs || a.sequence - b.sequence);
    return events;
  }

  createCursor(startTimestampMs, endTimestampMs) {
    return new ActionEventCursor(this.eventsInRange(startTimestampMs, endTimestampMs));
  }

  clear() {
    for (let index = 0; index < this.storage.length; index += 1) {
      this.storage[index] = undefined;
    }
    this.start = 0;
    this.count = 0;
    this.wrapCount = 0;
    this.sequence = 0;
  }

  diagnostics() {
    return {
      capacity: this.capacity,
      count: this.count,
      wrapCount: this.wrapCount,
    };
  }
}
