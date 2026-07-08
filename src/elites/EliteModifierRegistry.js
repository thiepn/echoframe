import { ELITE_MODIFIER_DEFINITIONS } from '../data/eliteModifierDefinitions.js';

export class EliteModifierRegistry {
  constructor(definitions = ELITE_MODIFIER_DEFINITIONS) { this.definitions = definitions; }
  get(id) { return this.definitions[id] ?? null; }
  has(id) { return Boolean(this.get(id)); }
  list() { return Object.values(this.definitions); }
}
