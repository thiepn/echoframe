import { BOSS_PHASES } from '../data/bossBalance.js';
export const NULL_ARCHITECT_PHASE_ORDER = Object.freeze([BOSS_PHASES.observe, BOSS_PHASES.imitate, BOSS_PHASES.delete]);
export function phaseForHealth(health, maximumHealth) {
  const ratio = Math.max(0, Number(health) || 0) / Math.max(1, Number(maximumHealth) || 1);
  if (ratio > 0.70) return BOSS_PHASES.observe;
  if (ratio > 0.35) return BOSS_PHASES.imitate;
  return BOSS_PHASES.delete;
}
export function nextBossPhase(phase) {
  const index = NULL_ARCHITECT_PHASE_ORDER.indexOf(phase);
  return index >= 0 && index < NULL_ARCHITECT_PHASE_ORDER.length - 1 ? NULL_ARCHITECT_PHASE_ORDER[index + 1] : null;
}
