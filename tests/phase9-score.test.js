import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENEMY_BASE_SCORES, ELITE_SCORE_SCALARS, CHAMBER_SCORES,
  DIFFICULTY_SCORE_MULTIPLIERS, COMBO_DEFINITIONS, SCORE_LEDGER_CAPACITY,
} from '../src/data/scoreDefinitions.js';
import { createScoreEvent } from '../src/scoring/ScoreEvent.js';
import { ScoreEventLedger } from '../src/scoring/ScoreEventLedger.js';
import { ComboController } from '../src/scoring/ComboController.js';
import { MultiKillTracker } from '../src/scoring/MultiKillTracker.js';
import { calculateAvoidanceBonus } from '../src/scoring/AvoidanceBonusCalculator.js';
import { calculateTimeBonus } from '../src/scoring/TimeBonusCalculator.js';
import { createScoreBreakdown } from '../src/scoring/ScoreBreakdown.js';
import { ScoreManager } from '../src/scoring/ScoreManager.js';

const context = (simulationMs = 1000, segmentId = 'combat-1') => ({ simulationMs, segmentId, segmentType: segmentId.startsWith('elite') ? 'ELITE' : 'COMBAT' });

for (const [id, expected] of Object.entries({ drifter:100, sentry:180, lancer:280, 'shard-carrier':300, bulwark:450, suppressor:520 })) {
  test(`Phase 9 canonical enemy score ${id}`, () => assert.equal(ENEMY_BASE_SCORES[id], expected));
}
for (const [id, expected] of Object.entries({ overclocked:2, replicating:1.5, resonant:1.9, 'replicating-copy':.5 })) {
  test(`Phase 9 canonical elite scalar ${id}`, () => assert.equal(ELITE_SCORE_SCALARS[id], expected));
}
for (const [id, expected] of Object.entries({ 'combat-1':500,'combat-2':650,'elite-1':900,'combat-3':750,'combat-4':900,'elite-2':1200,'null-architect-boss':5000,boss:5000 })) {
  test(`Phase 9 canonical segment score ${id}`, () => assert.equal(CHAMBER_SCORES[id], expected));
}
for (const [id, expected] of Object.entries({ relaxed:.75, standard:1, overclocked:1.35 })) {
  test(`Phase 9 canonical difficulty multiplier ${id}`, () => assert.equal(DIFFICULTY_SCORE_MULTIPLIERS[id], expected));
}

for (let index = 0; index < 12; index += 1) {
  test(`Score event is immutable and integer rounded ${index}`, () => {
    const event = createScoreEvent({ scoreEventId:`e${index}`, runId:'r', sequenceNumber:index+1, simulationMs:index*10, eventType:'enemy-defeat', category:'enemyScore', dedupeKey:`d${index}`, basePoints:10.4+index, stageScalar:1, comboBefore:0, comboGain:1, comboAfter:1, comboMultiplier:1, awardedPoints:10.6+index, metadata:{ nested:{ value:index } } });
    assert.equal(event.awardedPoints, Math.round(10.6 + index));
    assert.ok(Object.isFrozen(event)); assert.ok(Object.isFrozen(event.metadata)); assert.ok(Object.isFrozen(event.metadata.nested));
  });
}

for (let index = 0; index < 12; index += 1) {
  test(`Score ledger monotonic acceptance ${index}`, () => {
    const ledger = new ScoreEventLedger({ runId:'run', capacity:20 });
    for (let i=0;i<=index;i++) {
      const result = ledger.accept({ runId:'run', simulationMs:i, eventType:'x', category:'enemyScore', dedupeKey:`${i}`, awardedPoints:i+1, basePoints:i+1 });
      assert.equal(result.accepted,true); assert.equal(result.event.sequenceNumber,i+1);
    }
    assert.equal(ledger.recomputeTotal(), (index+1)*(index+2)/2);
  });
}

const ledgerRejections = [
  ['duplicate', (l) => { const e={runId:'run',simulationMs:0,eventType:'x',category:'enemyScore',dedupeKey:'d',awardedPoints:1}; l.accept(e); return l.accept(e); }],
  ['cross-run', (l) => l.accept({runId:'other',simulationMs:0,eventType:'x',category:'enemyScore',dedupeKey:'d',awardedPoints:1})],
  ['missing-fields', (l) => l.accept({runId:'run',simulationMs:0,eventType:'x',dedupeKey:'d',awardedPoints:1})],
  ['non-finite-points', (l) => l.accept({runId:'run',simulationMs:0,eventType:'x',category:'enemyScore',dedupeKey:'d',awardedPoints:NaN})],
  ['negative-points', (l) => l.accept({runId:'run',simulationMs:0,eventType:'x',category:'enemyScore',dedupeKey:'d',awardedPoints:-1})],
  ['invalid-time', (l) => l.accept({runId:'run',simulationMs:-1,eventType:'x',category:'enemyScore',dedupeKey:'d',awardedPoints:1})],
  ['post-outcome', (l) => { l.lock(); return l.accept({runId:'run',simulationMs:0,eventType:'x',category:'enemyScore',dedupeKey:'d',awardedPoints:1}); }],
  ['ledger-capacity', (l) => { l.accept({runId:'run',simulationMs:0,eventType:'x',category:'enemyScore',dedupeKey:'a',awardedPoints:1}); return l.accept({runId:'run',simulationMs:1,eventType:'x',category:'enemyScore',dedupeKey:'b',awardedPoints:1}); }, 1],
];
for (const [reason, action, capacity=10] of ledgerRejections) test(`Score ledger rejects ${reason}`, () => assert.equal(action(new ScoreEventLedger({runId:'run',capacity})).reason, reason));

test('Score ledger canonical cap is 4096', () => assert.equal(SCORE_LEDGER_CAPACITY,4096));

for (let combo = 0; combo <= 24; combo += 1) {
  test(`Combo multiplier formula at ${combo}`, () => {
    const controller = new ComboController(); controller.gain(combo,0,'test');
    assert.equal(controller.multiplier, Math.min(1.6, 1 + Math.min(combo,20)*.03));
  });
}
for (const damageCombo of [0,1,2,3,4,5,8,12,20,30]) {
  test(`Accepted damage halves combo ${damageCombo}`, () => { const c=new ComboController();c.gain(damageCombo,0);const r=c.applyAcceptedDamage(10);assert.equal(r.after,damageCombo/2); });
}
for (const elapsed of [0,500,1500,1999,2000,2250,2500,3000]) {
  test(`Combo decay timing at ${elapsed}ms`, () => { const c=new ComboController();c.gain(10,0);c.update(elapsed,elapsed);const expected=elapsed<2000?10:Math.max(0,10-elapsed/1000);assert.equal(Number(c.combo.toFixed(3)),Number(expected.toFixed(3))); });
}
test('Combo pause freezes decay',()=>{const c=new ComboController();c.gain(5,0);c.update(5000,5000,{paused:true});assert.equal(c.combo,5);});
test('Combo segment reset clears current but retains highest',()=>{const c=new ComboController();c.gain(7,0);c.resetSegment();assert.equal(c.combo,0);assert.equal(c.highestCombo,7);});

for (const damage of [0,1,30,60,90,120,150,179,180,250]) {
  test(`Avoidance formula at ${damage} damage`, () => { const r=calculateAvoidanceBonus(damage); assert.equal(r.bonus,Math.round(1500*Math.max(0,1-damage/180))); });
}

const timeCases = [
  ['combat-1',75000,1],['combat-1',92500,.5],['combat-1',110000,0],['elite-1',60000,1],['elite-1',75000,.5],['elite-1',90000,0],['boss',210000,1],['boss',255000,.5],['boss',300000,0],['boss',500000,0],
];
for (const [id,duration,efficiency] of timeCases) {
  test(`Time bonus efficiency ${id} ${duration}`,()=>{const r=calculateTimeBonus({eligibleCombatScore:1000,segmentDurations:{[id]:duration},segmentScores:{[id]:1000},difficultyId:'standard'});assert.equal(Number(r.weightedEfficiency.toFixed(3)),efficiency);assert.ok(r.bonus<=120);});
}

for (const [enemyType, base] of Object.entries(ENEMY_BASE_SCORES)) {
  test(`ScoreManager awards ${enemyType} once`,()=>{const m=new ScoreManager({runId:'r'});const a=m.recordEnemyDefeat({enemyType,enemyId:'e1',source:'player'},context());const b=m.recordEnemyDefeat({enemyType,enemyId:'e1',source:'player'},context());assert.equal(a.event.awardedPoints,base);assert.equal(b.accepted,false);});
  test(`ScoreManager applies combo-before for ${enemyType}`,()=>{const m=new ScoreManager({runId:'r'});m.combo.gain(10,0);const a=m.recordEnemyDefeat({enemyType,enemyId:'e1',source:'player'},context());assert.equal(a.event.awardedPoints,Math.round(base*1.3));assert.equal(a.event.comboBefore,10);});
}
for (const modifier of ['overclocked','replicating','resonant']) {
  test(`ScoreManager elite scalar ${modifier}`,()=>{const m=new ScoreManager({runId:'r'});const r=m.recordEnemyDefeat({enemyType:'drifter',enemyId:'elite',eliteModifierId:modifier,source:'player'},context());assert.equal(r.event.awardedPoints,Math.round(100*ELITE_SCORE_SCALARS[modifier]));assert.equal(m.combo.combo,3);});
}
test('ScoreManager replicating copy is normal combo gain',()=>{const m=new ScoreManager({runId:'r'});const r=m.recordEnemyDefeat({enemyType:'drifter',enemyId:'copy',eliteModifierId:'replicating',isEliteCopy:true},context());assert.equal(r.event.awardedPoints,50);assert.equal(m.combo.combo,1);});

for (let i=0;i<6;i++) test(`Multi-kill deterministic chain ${i}`,()=>{const t=new MultiKillTracker();for(let n=0;n<=i;n++)assert.equal(t.register({targetId:`e${n}`,simulationMs:n*100}).chainLength,n+1);assert.equal(t.maximumChain,i+1);});
test('Multi-kill window expires',()=>{const t=new MultiKillTracker();t.register({targetId:'a',simulationMs:0});assert.equal(t.register({targetId:'b',simulationMs:601}).extra,false);});
test('Multi-kill duplicate rejected',()=>{const t=new MultiKillTracker();t.register({targetId:'a',simulationMs:0});assert.equal(t.register({targetId:'a',simulationMs:1}).reason,'duplicate-kill');});

for (const segmentId of Object.keys(CHAMBER_SCORES)) {
  test(`ScoreManager segment clear ${segmentId}`,()=>{const m=new ScoreManager({runId:'r'});m.combo.gain(8,0);const r=m.recordSegmentClear(segmentId,context(100,segmentId));assert.equal(r.event.awardedPoints,CHAMBER_SCORES[segmentId]);assert.equal(m.combo.combo,0);});
}

for (const difficultyId of Object.keys(DIFFICULTY_SCORE_MULTIPLIERS)) {
  test(`ScoreManager final multiplier once ${difficultyId}`,()=>{const m=new ScoreManager({runId:'r',difficultyId});m.recordSegmentClear('combat-1',context());const f=m.finalize({result:'defeat',damageTaken:180,segmentDurations:{'combat-1':200000},durationMs:110000});assert.equal(f.finalScore,Math.round(500*DIFFICULTY_SCORE_MULTIPLIERS[difficultyId]));assert.equal(f.reconciliationMatches,true);});
}
for (let seed=1;seed<=20;seed++) {
  test(`Deterministic score stream ${seed}`,()=>{const build=()=>{const m=new ScoreManager({runId:`r${seed}`,difficultyId:['relaxed','standard','overclocked'][seed%3]});for(let i=0;i<12;i++)m.recordEnemyDefeat({enemyType:Object.keys(ENEMY_BASE_SCORES)[(seed+i)%6],enemyId:`e${i}`,source:i%2?'echo':'player'},context(i*120,'combat-1'));m.recordCrossfire({crossfireEventId:`c${seed}`,targetId:'e1'},context(1500,'combat-1'));m.recordSegmentClear('combat-1',context(2000,'combat-1'));return m.finalize({result:'defeat',damageTaken:seed%181,segmentDurations:{'combat-1':75000+seed*500},durationMs:80000});};assert.deepEqual(build(),build());});
}

for (const subtotal of [0,1,99,100,999,1000,9999]) test(`Score breakdown explicit zero/final ${subtotal}`,()=>{const b=createScoreBreakdown({enemyScore:subtotal,subtotal,finalScore:0,difficultyMultiplier:1.35});assert.equal(b.subtotal,subtotal);assert.equal(b.finalScore,0);});
assert.equal(COMBO_DEFINITIONS.maximumMultiplier,1.6);

test('debug score events are excluded from normal persisted finalization totals', () => {
  const manager = new ScoreManager({ runId: 'debug-exclusion', difficultyId: 'standard' });
  manager.recordNearMiss({ projectileId: 'normal' }, { simulationMs: 10, segmentId: 'combat-1' });
  manager.recordNearMiss({ projectileId: 'debug' }, { simulationMs: 20, segmentId: 'combat-1', debug: true });
  assert.equal(manager.currentScore > 15, true);
  const final = manager.finalize({ result: 'defeat', segmentDurations: {}, damageTaken: 180, debug: false });
  assert.equal(final.breakdown.nearMissScore, 15);
  assert.equal(final.reconciliationMatches, true);
});
