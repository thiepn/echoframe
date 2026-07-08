import { ELITE_MODIFIER_TYPE_LIST } from './EliteModifierType.js';
import { eligibleHosts, isEliteEligible } from './EliteEligibility.js';
import { EliteThreatModel } from './EliteThreatModel.js';
import { SeededRandom, deriveSeed } from '../utils/SeededRandom.js';

export class EliteSelectionPlanner {
  select({ seed, segment, previousElitePlans = [] } = {}) {
    const modifierRandom = new SeededRandom(deriveSeed(seed, `elite-modifier-${segment.segmentId}`));
    const hostRandom = new SeededRandom(deriveSeed(seed, `elite-host-${segment.segmentId}`));
    const priorModifiers = new Set(previousElitePlans.map((plan) => plan.modifierId));
    const priorPairs = new Set(previousElitePlans.map((plan) => `${plan.hostEnemyType}:${plan.modifierId}`));
    const modifierCandidates = ELITE_MODIFIER_TYPE_LIST.filter((modifierId) =>
      eligibleHosts(modifierId, segment.allowedEnemyTypes).length > 0 &&
      (!priorModifiers.has(modifierId) || ELITE_MODIFIER_TYPE_LIST.every((id) => priorModifiers.has(id))),
    );
    const orderedModifiers = modifierCandidates.length ? modifierCandidates : ELITE_MODIFIER_TYPE_LIST;
    const start = modifierRandom.integer(0, orderedModifiers.length - 1);
    const diagnostics = { rejectionReasons: {}, fallbackUsed: false };
    for (let offset = 0; offset < orderedModifiers.length; offset += 1) {
      const modifierId = orderedModifiers[(start + offset) % orderedModifiers.length];
      const hosts = eligibleHosts(modifierId, segment.allowedEnemyTypes);
      const hostStart = hostRandom.integer(0, Math.max(0, hosts.length - 1));
      for (let hostOffset = 0; hostOffset < hosts.length; hostOffset += 1) {
        const hostEnemyType = hosts[(hostStart + hostOffset) % hosts.length];
        if (!isEliteEligible({ enemyType: hostEnemyType, modifierId })) continue;
        if (priorPairs.has(`${hostEnemyType}:${modifierId}`) && hosts.length > 1) {
          diagnostics.rejectionReasons['repeated-host-modifier-pair'] = (diagnostics.rejectionReasons['repeated-host-modifier-pair'] ?? 0) + 1;
          continue;
        }
        const threat = EliteThreatModel.calculate(hostEnemyType, modifierId);
        return Object.freeze({
          modifierId,
          eliteInstanceId: `${segment.segmentId}-${modifierId}-${hostEnemyType}-${Number(seed >>> 0).toString(16)}`,
          hostEnemyType,
          ...threat,
          selectionSeed: deriveSeed(seed, `elite-selection-${segment.segmentId}`),
          supportCompositionSeed: deriveSeed(seed, `elite-support-${segment.segmentId}`),
          spawnSelectionSeed: deriveSeed(seed, `elite-spawn-${segment.segmentId}`),
          spawnOrderSeed: deriveSeed(seed, `elite-order-${segment.segmentId}`),
          cosmeticSeed: deriveSeed(seed, `elite-cosmetic-${segment.segmentId}`),
          reservedEnemySlots: modifierId === 'replicating' ? 1 : 0,
          reservedSubordinateSlots: 0,
          tags: Object.freeze(['primary-elite', segment.segmentId]),
          generationDiagnostics: Object.freeze(diagnostics),
        });
      }
    }
    diagnostics.fallbackUsed = true;
    const modifierId = 'overclocked';
    const hostEnemyType = segment.allowedEnemyTypes[0] ?? 'drifter';
    const threat = EliteThreatModel.calculate(hostEnemyType, modifierId);
    return Object.freeze({
      modifierId,
      eliteInstanceId: `${segment.segmentId}-fallback-${Number(seed >>> 0).toString(16)}`,
      hostEnemyType,
      ...threat,
      selectionSeed: deriveSeed(seed, `elite-fallback-${segment.segmentId}`),
      supportCompositionSeed: deriveSeed(seed, `elite-support-fallback-${segment.segmentId}`),
      spawnSelectionSeed: deriveSeed(seed, `elite-spawn-fallback-${segment.segmentId}`),
      spawnOrderSeed: deriveSeed(seed, `elite-order-fallback-${segment.segmentId}`),
      cosmeticSeed: deriveSeed(seed, `elite-cosmetic-fallback-${segment.segmentId}`),
      reservedEnemySlots: 0,
      reservedSubordinateSlots: 0,
      tags: Object.freeze(['primary-elite', 'fallback']),
      generationDiagnostics: Object.freeze(diagnostics),
    });
  }
}
