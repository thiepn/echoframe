export class EncounterHistory {
  constructor(limit = 8) { this.limit = Math.max(2, Number(limit) || 8); this.reset(); }
  reset() { this.entries = []; this.typeAppearances = new Map(); }
  add(descriptor) {
    const types = [...new Set(descriptor.enemyEntries.map((entry) => entry.enemyType))].sort();
    const signature = types.map((type) => `${type}:${descriptor.enemyEntries.filter((entry) => entry.enemyType === type).length}`).join('|');
    const entry = { pattern: descriptor.pattern, dominantRole: descriptor.generationDiagnostics?.dominantRole ?? null, types, signature, topology: descriptor.generationDiagnostics?.spawnTopology ?? 'mixed', recoveryAfterMs: descriptor.recoveryAfterMs };
    this.entries.push(entry);
    if (this.entries.length > this.limit) this.entries.shift();
    for (const type of types) this.typeAppearances.set(type, (this.typeAppearances.get(type) ?? 0) + 1);
  }
  exactRepeat(signature) { const previous = [...this.entries].reverse().find((entry) => entry.signature); return previous?.signature === signature; }
  dominantRoleRepeats(role, maximum = 2) { let count = 0; for (let index = this.entries.length - 1; index >= 0; index -= 1) { if (this.entries[index].dominantRole !== role) break; count += 1; } return count >= maximum; }
  previousPattern() { return [...this.entries].reverse().find((entry) => entry.signature)?.pattern ?? null; }
  snapshot() { return { entries: structuredClone(this.entries), typeAppearances: Object.fromEntries(this.typeAppearances) }; }
}
