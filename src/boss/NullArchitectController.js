import { HealthComponent } from '../components/HealthComponent.js';
import { createDamagePacket } from '../combat/DamagePacket.js';
import { FACTIONS } from '../combat/Faction.js';
import { BOSS_BALANCE, BOSS_PHASES } from '../data/bossBalance.js';
import { getBossDifficultyRules } from '../data/bossDifficultyRules.js';
import { phaseGateSatisfied, thresholdHealth } from './BossCompletionRules.js';
import { nextBossPhase } from './NullArchitectPhase.js';
import { BossVulnerabilityController } from './BossVulnerabilityController.js';

export class NullArchitectController {
  constructor({ damageService, scheduler, telemetry, eventBus = null, difficultyId = 'standard' } = {}) {
    this.damageService = damageService;
    this.scheduler = scheduler;
    this.telemetry = telemetry;
    this.eventBus = eventBus;
    this.difficulty = getBossDifficultyRules(difficultyId);
    this.maximumHealth = Math.round(BOSS_BALANCE.health * this.difficulty.healthScalar);
    this.health = new HealthComponent(this.maximumHealth);
    this.target = { faction: FACTIONS.enemy, health: this.health, active: true };
    this.vulnerability = new BossVulnerabilityController();
    this.reset();
  }
  reset() {
    this.health.reset(this.maximumHealth);
    this.phase = BOSS_PHASES.observe;
    this.elapsedMs = 0;
    this.phaseElapsedMs = 0;
    this.phaseDurations = {};
    this.transitioning = false;
    this.transitionRemainingMs = 0;
    this.destroyed = false;
    this.mechanics = new Set();
    this.thresholdClampCount = 0;
    this.vulnerability.reset();
    this.scheduler?.reset();
  }
  start() { this.telemetry?.increment('bossStarted'); this.telemetry?.incrementMap('phaseEntries', this.phase); this.eventBus?.emit('boss:phase:entered', { phase: this.phase }); }
  markMechanic(id) { this.mechanics.add(id); }
  canDamage(hitZone = 'core') { return !this.destroyed && !this.transitioning && (this.vulnerability.vulnerable || (this.phase === BOSS_PHASES.delete && hitZone.startsWith('panel:'))); }
  receiveDamage(packet, { hitZone = 'core', source = 'player', crossfireBonus = 0 } = {}) {
    if (this.destroyed) return this.#rejected(packet, 'destruction-lock');
    if (this.transitioning) return this.#rejected(packet, 'phase-transition');
    if (!this.canDamage(hitZone)) return this.#rejected(packet, hitZone.startsWith('panel:') ? 'panel-closed' : 'boss-closed');
    const next = nextBossPhase(this.phase);
    const gateComplete = phaseGateSatisfied(this.phase, this.mechanics);
    let finalAmount = packet.finalAmount;
    if (next && !gateComplete) {
      const floor = thresholdHealth(this.phase, this.maximumHealth);
      finalAmount = Math.min(finalAmount, Math.max(0, this.health.currentHealth - floor));
      if (finalAmount < packet.finalAmount) { this.thresholdClampCount += 1; this.telemetry?.increment('thresholdClamps'); }
    }
    const normalized = createDamagePacket({ ...packet, targetType: 'boss', targetId: 'null-architect', finalAmount });
    const result = this.damageService.resolve(normalized, this.target);
    if (result.accepted) {
      this.telemetry?.recordDamage(source, result.damageApplied, crossfireBonus);
      this.eventBus?.emit('boss:health:changed', { health: this.health.currentHealth, maximumHealth: this.maximumHealth, phase: this.phase, hitZone, source, damage: result.damageApplied });
      this.#checkTransition();
      if (result.targetDefeated && phaseGateSatisfied(BOSS_PHASES.delete, this.mechanics)) this.destroyed = true;
    }
    return Object.freeze({ ...result, targetKind: 'boss', bossPhase: this.phase, hitZoneId: hitZone, vulnerable: this.canDamage(hitZone), phaseThresholdReached: this.transitioning, bossDefeated: this.destroyed });
  }
  update(deltaMs, context = {}) {
    if (this.destroyed || context.paused) return { vulnerabilityEvents: [], attack: null, transitionCompleted: false };
    const delta = Math.max(0, Number(deltaMs) || 0);
    this.elapsedMs += delta;
    this.phaseElapsedMs += delta;
    if (this.transitioning) {
      this.transitionRemainingMs -= delta;
      if (this.transitionRemainingMs <= 0) { this.#completeTransition(); return { vulnerabilityEvents: [], attack: null, transitionCompleted: true }; }
      return { vulnerabilityEvents: [], attack: null, transitionCompleted: false };
    }
    const vulnerabilityEvents = this.vulnerability.update(delta, { paused: false, transitioning: false });
    for (const event of vulnerabilityEvents) {
      if (event === 'opened') { this.markMechanic('vulnerability'); this.telemetry?.increment('vulnerabilityOpened'); }
      if (event === 'closed') this.telemetry?.increment('vulnerabilityClosed');
      this.eventBus?.emit('boss:vulnerability:changed', this.vulnerability.snapshot());
    }
    const attack = this.scheduler?.update(delta, {
      phase: this.phase,
      paused: false,
      transitioning: false,
      destroyed: false,
      recoveryScalar: this.difficulty.recoveryScalar,
      ...context,
    }) ?? null;
    return { vulnerabilityEvents, attack, transitionCompleted: false };
  }
  forcePhase(phase) { if (!Object.values(BOSS_PHASES).includes(phase)) return false; this.phase = phase; this.phaseElapsedMs = 0; this.transitioning = false; this.transitionRemainingMs = 0; this.mechanics.clear(); this.vulnerability.reset(); this.telemetry?.incrementMap('phaseEntries', phase); return true; }
  forceHealth(value) { this.health.setCurrent(value); this.#checkTransition(); return this.health.currentHealth; }
  beginTransition(nextPhase) {
    if (this.transitioning || !nextPhase) return false;
    this.phaseDurations[this.phase] = (this.phaseDurations[this.phase] ?? 0) + this.phaseElapsedMs;
    this.transitioning = true;
    this.transitionRemainingMs = BOSS_BALANCE.phaseTransitionMs;
    this.pendingPhase = nextPhase;
    this.scheduler?.setFrozen(true);
    this.vulnerability.force(false);
    this.eventBus?.emit('boss:phase:transition', { from: this.phase, to: nextPhase, durationMs: BOSS_BALANCE.phaseTransitionMs });
    return true;
  }
  #checkTransition() {
    const next = nextBossPhase(this.phase);
    if (!next || !phaseGateSatisfied(this.phase, this.mechanics)) return;
    const floor = thresholdHealth(this.phase, this.maximumHealth);
    if (this.health.currentHealth <= floor + 0.001) this.beginTransition(next);
  }
  #completeTransition() {
    this.phase = this.pendingPhase;
    this.pendingPhase = null;
    this.phaseElapsedMs = 0;
    this.transitioning = false;
    this.transitionRemainingMs = 0;
    this.mechanics.clear();
    this.vulnerability.reset();
    this.scheduler?.setFrozen(false);
    this.telemetry?.incrementMap('phaseEntries', this.phase);
    this.eventBus?.emit('boss:phase:entered', { phase: this.phase });
  }
  #rejected(packet, reason) {
    return Object.freeze({ accepted: false, rejectedReason: reason, amountBeforeMitigation: packet.finalAmount, amountAfterMitigation: 0, shieldAbsorbed: 0, damageApplied: 0, remainingHealth: this.health.currentHealth, targetDefeated: false, critical: packet.critical, damageId: packet.damageId, modifierDiagnostics: null, targetKind: 'boss', bossPhase: this.phase, hitZoneId: null, vulnerable: false, phaseThresholdReached: false, bossDefeated: false });
  }
  snapshot() { return Object.freeze({ id: BOSS_BALANCE.id, maximumHealth: this.maximumHealth, health: this.health.currentHealth, phase: this.phase, transitioning: this.transitioning, transitionRemainingMs: Math.max(0,this.transitionRemainingMs), destroyed: this.destroyed, elapsedMs: this.elapsedMs, phaseElapsedMs: this.phaseElapsedMs, phaseDurations: Object.freeze({ ...this.phaseDurations }), thresholdClampCount: this.thresholdClampCount, mechanics: Object.freeze([...this.mechanics]), vulnerability: this.vulnerability.snapshot(), scheduler: this.scheduler?.snapshot?.() ?? null }); }
}
