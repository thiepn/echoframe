import { BOSS_PHASES } from './bossBalance.js';
export const BOSS_PHASE_DEFINITIONS = Object.freeze({
  [BOSS_PHASES.observe]: Object.freeze({ id: BOSS_PHASES.observe, label: 'Observe', minimumHealthRatio: 0.70, requiredMechanics: Object.freeze(['rotating-fan','targeted-line-volley','vulnerability']) }),
  [BOSS_PHASES.imitate]: Object.freeze({ id: BOSS_PHASES.imitate, label: 'Imitate', minimumHealthRatio: 0.35, requiredMechanics: Object.freeze(['hostile-echo','vulnerability']) }),
  [BOSS_PHASES.delete]: Object.freeze({ id: BOSS_PHASES.delete, label: 'Delete', minimumHealthRatio: 0, requiredMechanics: Object.freeze(['sector-deletion','rear-panel-exposure']) }),
});
