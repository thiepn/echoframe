import { normalizeUint32 } from './math.js';

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export class SeededRandom {
  constructor(seed = 0) { this.initialSeed = normalizeUint32(seed); this.state = this.initialSeed || 0x6d2b79f5; this.calls = 0; }
  nextUint32() {
    let value = this.state += 0x6d2b79f5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    this.state = (value ^ (value >>> 14)) >>> 0;
    this.calls += 1;
    return this.state;
  }
  next() { return this.nextUint32() / 4294967296; }
  integer(minimum, maximumInclusive) {
    const min = Math.ceil(minimum);
    const max = Math.floor(maximumInclusive);
    if (max < min) return min;
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick(items) { return items.length ? items[Math.floor(this.next() * items.length)] : null; }
  derive(name) { return new SeededRandom((this.initialSeed ^ hashText(String(name))) >>> 0); }
  reset() { this.state = this.initialSeed || 0x6d2b79f5; this.calls = 0; }
  snapshot() { return { initialSeed: this.initialSeed, state: this.state >>> 0, calls: this.calls }; }
}

export const deriveSeed = (seed, name) => (normalizeUint32(seed) ^ hashText(String(name))) >>> 0;
