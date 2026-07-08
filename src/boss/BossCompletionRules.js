import { BOSS_PHASE_DEFINITIONS } from '../data/bossPhaseDefinitions.js';
export function phaseGateSatisfied(phase, mechanics = new Set()) { return BOSS_PHASE_DEFINITIONS[phase].requiredMechanics.every((id) => mechanics.has(id)); }
export function thresholdHealth(phase, maximumHealth) { const ratio = BOSS_PHASE_DEFINITIONS[phase]?.minimumHealthRatio ?? 0; return maximumHealth * ratio; }
