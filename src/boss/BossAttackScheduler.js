import { BOSS_ATTACK_DEFINITIONS } from '../data/bossAttackDefinitions.js';
import { BOSS_BALANCE } from '../data/bossBalance.js';
export class BossAttackScheduler {
  constructor({ rng, attackDefinitions = BOSS_ATTACK_DEFINITIONS, telemetry = null } = {}) { this.rng = rng; this.definitions = attackDefinitions; this.telemetry = telemetry; this.reset(); }
  reset() { this.elapsedMs = 0; this.nextSelectionMs = 1000; this.cooldowns = new Map(); this.history = []; this.firstUse = new Set(); this.activeMajor = new Map(); this.fallbackCount = 0; this.rejections = {}; this.frozen = false; this.longFight = false; }
  setFrozen(value) { this.frozen = Boolean(value); }
  completeAttack(id) { this.activeMajor.delete(id); }
  update(deltaMs, context = {}) {
    if (this.frozen || context.paused || context.transitioning || context.destroyed) return null;
    const delta = Math.max(0, Number(deltaMs) || 0);
    this.elapsedMs += delta;
    this.longFight = this.elapsedMs >= BOSS_BALANCE.longFightThresholdMs;
    for (const [id, remaining] of this.cooldowns) this.cooldowns.set(id, Math.max(0, remaining - delta));
    this.nextSelectionMs -= delta;
    if (this.nextSelectionMs > 0) return null;
    const candidates = this.definitions.filter((definition) => this.#eligible(definition, context));
    let selected = null;
    if (candidates.length) {
      const lastId = this.history.at(-1)?.id;
      const alternatives = candidates.filter((item) => item.id !== lastId);
      const pool = alternatives.length ? alternatives : candidates;
      selected = pool[this.rng.integer(0, pool.length - 1)];
    }
    if (!selected) {
      selected = this.definitions.find((item) => item.id === 'rotating-fan');
      this.fallbackCount += 1;
      this.#reject('fallback');
    }
    const firstUse = !this.firstUse.has(selected.id);
    this.firstUse.add(selected.id);
    const baseCooldown = selected.cooldownMs[context.phase] ?? 4200;
    const recoveryScalar = Number(context.recoveryScalar) || 1;
    this.cooldowns.set(selected.id, baseCooldown * recoveryScalar * (this.longFight ? BOSS_BALANCE.longFightRecoveryScalar : 1));
    this.nextSelectionMs = (firstUse ? 1250 : 700) * Math.max(0.75, recoveryScalar);
    if (selected.major) this.activeMajor.set(selected.id, this.elapsedMs);
    const entry = Object.freeze({ id: selected.id, phase: context.phase, category: selected.category, firstUse, selectedAtMs: this.elapsedMs, fallback: !candidates.length });
    this.history.push(entry);
    if (this.history.length > 64) this.history.shift();
    this.telemetry?.recordAttackSelected?.(selected.id);
    return entry;
  }
  #eligible(definition, context) {
    const reject = (reason) => { this.#reject(reason); return false; };
    if (!definition.phases.includes(context.phase)) return reject('phase-invalid');
    if ((this.cooldowns.get(definition.id) ?? 0) > 0) return reject('cooldown');
    if (definition.major && this.activeMajor.size >= (context.maximumMajor ?? 1)) return reject('major-concurrency');
    if (definition.id === 'drifter-summon' && (context.summonThreat ?? 0) >= BOSS_BALANCE.addThreatCap) return reject('add-cap');
    if (definition.id === 'hostile-echo' && (context.hostileEchoes ?? 0) >= (context.hostileEchoCap ?? 1)) return reject('hostile-echo-cap');
    if (definition.id === 'sector-deletion' && context.sectorActive) return reject('sector-active');
    if (definition.id === 'rear-panel-exposure' && context.panelsActive) return reject('panels-active');
    if (context.poolUnavailable?.(definition.id)) return reject('pool-unavailable');
    return true;
  }
  #reject(reason) { this.rejections[reason] = (this.rejections[reason] ?? 0) + 1; this.telemetry?.recordAttackRejected?.(reason); }
  snapshot() { return Object.freeze({ elapsedMs: this.elapsedMs, nextSelectionMs: Math.max(0,this.nextSelectionMs), cooldowns: Object.freeze(Object.fromEntries(this.cooldowns)), history: Object.freeze([...this.history]), firstUse: Object.freeze([...this.firstUse]), activeMajor: Object.freeze([...this.activeMajor.keys()]), fallbackCount: this.fallbackCount, rejections: Object.freeze({ ...this.rejections }), frozen: this.frozen, longFight: this.longFight }); }
}
