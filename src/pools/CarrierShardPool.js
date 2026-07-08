import { ObjectPool } from './ObjectPool.js';

export class CarrierShardPool {
  constructor(options) { this.pool = new ObjectPool(options); }
  acquire(data) { const shard = this.pool.acquire(); if (!shard) return null; shard.activate(data); return shard; }
  release(shard, reason = 'released') { if (!this.pool.active.has(shard)) return false; shard.deactivate(reason); return this.pool.release(shard); }
  releaseAll(reason = 'clear') { this.pool.releaseAll((shard) => shard.deactivate(reason)); }
  destroy() { this.pool.destroy((shard) => shard.destroy()); }
  get activeItems() { return this.pool.active; }
  diagnostics() { return this.pool.diagnostics(); }
}
