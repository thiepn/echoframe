export class ThreatBudgetModel {
  constructor({ targetThreat = 0, toleranceBelow = 0.15, toleranceAbove = 0.08 } = {}) {
    this.targetThreat = Math.max(0, Number(targetThreat) || 0);
    this.toleranceBelow = Math.max(0, Number(toleranceBelow) || 0);
    this.toleranceAbove = Math.max(0, Number(toleranceAbove) || 0);
    this.spentThreat = 0;
  }
  reset(targetThreat = this.targetThreat) { this.targetThreat = Math.max(0, Number(targetThreat) || 0); this.spentThreat = 0; }
  canConsume(cost) { return this.spentThreat + Math.max(0, Number(cost) || 0) <= this.maximumThreat; }
  consume(cost) { const value = Math.max(0, Number(cost) || 0); if (!this.canConsume(value)) return false; this.spentThreat += value; return true; }
  get minimumThreat() { return Math.max(0, this.targetThreat * (1 - this.toleranceBelow)); }
  get maximumThreat() { return this.targetThreat * (1 + this.toleranceAbove); }
  get remainingThreat() { return Math.max(0, this.targetThreat - this.spentThreat); }
  get withinTolerance() { return this.spentThreat >= this.minimumThreat && this.spentThreat <= this.maximumThreat; }
  snapshot() { return { targetThreat: this.targetThreat, spentThreat: this.spentThreat, remainingThreat: this.remainingThreat, minimumThreat: this.minimumThreat, maximumThreat: this.maximumThreat, withinTolerance: this.withinTolerance }; }
}
