export class OverclockedModifier {
  constructor({ definition }) { this.definition = definition; this.heatPulseMs = 0; this.attackCount = 0; }
  update(deltaMs) { this.heatPulseMs = (this.heatPulseMs + Math.max(0, Number(deltaMs) || 0)) % 1000; }
  onAttackExecution() { this.attackCount += 1; }
  reset() { this.heatPulseMs = 0; this.attackCount = 0; }
  snapshot() { return Object.freeze({ heatPulseMs: this.heatPulseMs, attackCount: this.attackCount }); }
}
