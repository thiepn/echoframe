export class BossTelemetry {
  constructor(initial = {}) { this.data = { bossStarted:0, phaseEntries:{}, phaseDurations:{}, thresholdClamps:0, vulnerabilityOpened:0, vulnerabilityClosed:0, attacksSelected:{}, attacksExecuted:{}, attackRejections:{}, fallbackAttacks:0, fanProjectiles:0, fanEmissions:0, lineVolleys:0, lineHits:0, summons:0, summonDefeats:0, hostileEchoesScheduled:0, hostileEchoesSpawned:0, hostileEchoesRejected:0, hostileEchoShots:0, hostileEchoHits:0, hostileEchoesDestroyed:0, sectorPatterns:0, sectorDamageTicks:0, rearPanelExposures:0, bossDamageByPlayer:0, bossDamageByEcho:0, crossfireDamage:0, bossProjectileInterceptions:0, lastFrameUses:0, playerDamageBySource:{}, bossDefeated:0, destructionSkipped:0, maximumProjectiles:0, maximumHostileEchoes:0, maximumSummons:0, fightDurationMs:0, ...structuredClone(initial) }; }
  increment(field, amount = 1) { this.data[field] = (Number(this.data[field]) || 0) + amount; }
  incrementMap(field, key, amount = 1) { this.data[field] ??= {}; this.data[field][key] = (Number(this.data[field][key]) || 0) + amount; }
  recordAttackSelected(id){this.incrementMap('attacksSelected',id);} recordAttackRejected(reason){this.incrementMap('attackRejections',reason);} recordAttackExecuted(id){this.incrementMap('attacksExecuted',id);}
  recordDamage(source, amount, crossfire = 0){ if(source==='echo')this.increment('bossDamageByEcho',amount);else this.increment('bossDamageByPlayer',amount); if(crossfire)this.increment('crossfireDamage',crossfire); }
  observeMaximum(field, value) { this.data[field] = Math.max(Number(this.data[field]) || 0, Number(value) || 0); }
  snapshot() { return structuredClone(this.data); }
}
