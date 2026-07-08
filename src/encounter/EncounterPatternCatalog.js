import { ENCOUNTER_PATTERN_LIST } from '../data/encounterPatterns.js';

export class EncounterPatternCatalog {
  constructor(patterns = ENCOUNTER_PATTERN_LIST) { this.patterns = new Map(patterns.map((pattern) => [pattern.id, pattern])); }
  get(id) { return this.patterns.get(id) ?? null; }
  forPhase(phase) { return [...this.patterns.values()].filter((pattern) => pattern.phases.includes(phase)); }
  snapshot() { return [...this.patterns.keys()]; }
}
