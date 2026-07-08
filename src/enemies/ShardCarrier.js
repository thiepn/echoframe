import { BaseEnemy } from './BaseEnemy.js';
import { ShardCarrierRenderer } from '../graphics/ShardCarrierRenderer.js';
import { ShardCarrierBrain } from '../enemy-ai/ShardCarrierBrain.js';

export class ShardCarrier extends BaseEnemy {
  constructor(scene, settings) { super(scene, { type: 'shard-carrier', renderer: new ShardCarrierRenderer(scene, settings), radius: 30 }); this.brain = new ShardCarrierBrain(this); this.shardsReleased = false; }
  activate(data) { super.activate(data); Object.assign(this, { preferredRangeMin: data.preferredRangeMin, preferredRangeMax: data.preferredRangeMax, shardCount: data.shardCount, hazardDamage: data.hazardDamage, activationDelayMs: data.activationDelayMs, hazardDurationMs: data.hazardDurationMs, hazardRadius: data.hazardRadius }); this.shardsReleased = false; this.brain.reset(); }
  releaseShards(manager) { if (this.shardsReleased) return false; this.shardsReleased = true; manager.releaseFromCarrier(this); return true; }
  update(delta, context) { this.brain.update(delta, context); this.updateRenderer(delta); this.renderer.setState(this.state.value); }
  deactivate() { this.shardsReleased = false; this.brain.reset(); return super.deactivate(); }
}
