export class BossOutcomeResolver {
  constructor() { this.reset(); }
  reset() { this.sequence = 0; this.finalized = null; }
  submit(kind, data = {}) {
    const event = Object.freeze({ kind, sequence: Number.isInteger(data.sequence) ? data.sequence : this.sequence++, tick: Number(data.tick) || 0, ...data });
    if (this.finalized) return Object.freeze({ accepted: false, outcome: this.finalized, reason: 'outcome-locked' });
    this.finalized = event;
    return Object.freeze({ accepted: true, outcome: event, reason: null });
  }
  resolveSameTick(events = []) {
    if (this.finalized) return this.finalized;
    const ordered = [...events].sort((a,b) => (a.tick-b.tick) || (a.sequence-b.sequence));
    if (!ordered.length) return null;
    const first = ordered[0];
    const sameTick = ordered.filter((event) => event.tick === first.tick);
    const bossDefeat = sameTick.find((event) => event.kind === 'victory');
    const playerDefeat = sameTick.find((event) => event.kind === 'defeat');
    if (bossDefeat && playerDefeat) this.finalized = bossDefeat.sequence <= playerDefeat.sequence ? bossDefeat : playerDefeat;
    else this.finalized = first;
    return this.finalized;
  }
  snapshot() { return this.finalized ? Object.freeze({ ...this.finalized }) : null; }
}
