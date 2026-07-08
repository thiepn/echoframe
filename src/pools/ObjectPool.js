export class ObjectPool {
  constructor({ factory, initialCapacity, expansionChunk, hardCap, onExhausted = null }) {
    if (typeof factory !== 'function') {
      throw new TypeError('ObjectPool requires a factory function.');
    }
    this.factory = factory;
    this.expansionChunk = Math.max(1, Math.trunc(expansionChunk));
    this.hardCap = Math.max(1, Math.trunc(hardCap));
    this.onExhausted = onExhausted;
    this.items = [];
    this.available = [];
    this.active = new Set();
    this.peakActive = 0;
    this.#expand(Math.min(this.hardCap, Math.max(0, Math.trunc(initialCapacity))));
  }

  acquire() {
    if (this.available.length === 0 && this.items.length < this.hardCap) {
      this.#expand(Math.min(this.expansionChunk, this.hardCap - this.items.length));
    }
    const item = this.available.pop();
    if (!item) {
      this.onExhausted?.(this.diagnostics());
      return null;
    }
    this.active.add(item);
    this.peakActive = Math.max(this.peakActive, this.active.size);
    return item;
  }

  release(item) {
    if (!this.active.has(item)) {
      return false;
    }
    this.active.delete(item);
    this.available.push(item);
    return true;
  }

  releaseAll(onRelease = null) {
    for (const item of [...this.active]) {
      onRelease?.(item);
      this.release(item);
    }
  }

  destroy(onDestroy = null) {
    this.releaseAll();
    for (const item of this.items) {
      onDestroy?.(item);
    }
    this.items = [];
    this.available = [];
    this.active.clear();
  }

  diagnostics() {
    return {
      capacity: this.items.length,
      active: this.active.size,
      available: this.available.length,
      hardCap: this.hardCap,
      peakActive: this.peakActive,
    };
  }

  #expand(count) {
    for (let index = 0; index < count; index += 1) {
      const item = this.factory(this.items.length);
      this.items.push(item);
      this.available.push(item);
    }
  }
}
