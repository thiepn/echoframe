import { RUN_SEGMENT_TYPES } from '../run/RunSegmentType.js';

const segment = (value) => Object.freeze({
  ...value,
  allowedEnemyTypes: Object.freeze([...(value.allowedEnemyTypes ?? [])]),
  threatRange: Object.freeze([...(value.threatRange ?? [0, 0])]),
  tags: Object.freeze([...(value.tags ?? [])]),
});

export const PHASE8_RUN_SEGMENTS = Object.freeze([
  segment({ segmentId: 'combat-1', segmentIndex: 0, segmentType: RUN_SEGMENT_TYPES.combat, label: 'Combat 1', chamberIndex: 1, allowedEnemyTypes: ['drifter','sentry'], threatRange: [5,7], activeThreatCap: 6, requiresElite: false, offerUpgradeAfter: true, tags: ['opening','legacy-roster'] }),
  segment({ segmentId: 'combat-2', segmentIndex: 1, segmentType: RUN_SEGMENT_TYPES.combat, label: 'Combat 2', chamberIndex: 2, allowedEnemyTypes: ['drifter','sentry','lancer'], threatRange: [7,10], activeThreatCap: 8, requiresElite: false, offerUpgradeAfter: true, introductionEnemyTypes: ['lancer'], tags: ['lancer-introduction'] }),
  segment({ segmentId: 'elite-1', segmentIndex: 2, segmentType: RUN_SEGMENT_TYPES.elite, label: 'Elite 1', chamberIndex: 3, allowedEnemyTypes: ['drifter','sentry','lancer'], threatRange: [8,11], activeThreatCap: 8, requiresElite: true, offerUpgradeAfter: true, tags: ['first-elite'] }),
  segment({ segmentId: 'combat-3', segmentIndex: 3, segmentType: RUN_SEGMENT_TYPES.combat, label: 'Combat 3', chamberIndex: 4, allowedEnemyTypes: ['drifter','sentry','lancer','shard-carrier','bulwark'], threatRange: [10,13], activeThreatCap: 10, requiresElite: false, offerUpgradeAfter: true, introductionEnemyTypes: ['shard-carrier','bulwark'], tags: ['carrier-bulwark-introduction'] }),
  segment({ segmentId: 'combat-4', segmentIndex: 4, segmentType: RUN_SEGMENT_TYPES.combat, label: 'Combat 4', chamberIndex: 5, allowedEnemyTypes: ['drifter','sentry','lancer','shard-carrier','bulwark','suppressor'], threatRange: [12,16], activeThreatCap: 12, requiresElite: false, offerUpgradeAfter: true, introductionEnemyTypes: ['suppressor'], tags: ['suppressor-introduction','full-roster'] }),
  segment({ segmentId: 'elite-2', segmentIndex: 5, segmentType: RUN_SEGMENT_TYPES.elite, label: 'Elite 2', chamberIndex: 6, allowedEnemyTypes: ['drifter','sentry','lancer','shard-carrier','bulwark','suppressor'], threatRange: [13,17], activeThreatCap: 12, requiresElite: true, offerUpgradeAfter: true, tags: ['second-elite','full-roster'] }),
  segment({ segmentId: 'recovery', segmentIndex: 6, segmentType: RUN_SEGMENT_TYPES.recovery, label: 'Recovery Chamber', chamberIndex: 7, allowedEnemyTypes: [], threatRange: [0,0], activeThreatCap: 0, requiresElite: false, offerUpgradeAfter: true, tags: ['recovery','safe','no-hazard'] }),
  segment({ segmentId: 'null-architect', segmentIndex: 7, segmentType: RUN_SEGMENT_TYPES.boss, label: 'Null Architect', chamberIndex: 8, allowedEnemyTypes: ['drifter'], threatRange: [0,8], activeThreatCap: 8, requiresElite: false, offerUpgradeAfter: false, tags: ['boss','null-architect','fixed-arena'] }),
]);
