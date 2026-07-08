import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSaveData } from '../src/state/defaultSaveData.js';
import { validateSaveData } from '../src/state/SaveSchema.js';
import { UNLOCK_DEFINITIONS } from '../src/data/progressionDefinitions.js';
import { PALETTE_DEFINITIONS, TRAIL_DEFINITIONS } from '../src/data/cosmeticDefinitions.js';
import { UnlockEvaluator } from '../src/progression/UnlockEvaluator.js';
import { applyUnlocksToSave } from '../src/progression/UnlockTransaction.js';
import { validateCosmeticSelection } from '../src/progression/CosmeticSelection.js';
import { PersonalBestManager } from '../src/statistics/PersonalBestManager.js';
import { AggregateStatisticsManager } from '../src/statistics/AggregateStatisticsManager.js';
import { createRecentRunRecord } from '../src/statistics/RecentRunRecord.js';

const baseRun=()=>({runId:'r',seed:7,difficultyId:'standard',result:'defeat',debug:false,finalScore:1000,durationMs:100000,bossDurationMs:0,bossReached:false,bossPhaseReached:null,damageTaken:20,highestCombo:5,crossfireEvents:0,echoDamageShare:0,playerShotsFired:60,playerAccuracy:.5,eliteParentsDefeated:0,damageFreeStandardSegments:0,efficientDashSegments:0,defensiveInteractions:0,lastFrameUses:0,cleanVectorSegments:0,totalEnemiesDefeated:10,killsByEnemyType:{drifter:10},playerDamage:100,echoDamage:0,criticalHits:0,playerDashes:0,echoDeployments:0,echoShotsFired:0,echoProjectileHits:0,echoKills:0,scoreBreakdown:{crossfireScore:0,nearMissScore:0,avoidanceBonus:1000,timeBonus:100,enemyScore:1000},eliteModifiersDefeated:[]});
const conditionRuns={
 'unlock-twin-recall':{crossfireEvents:1},'unlock-vector-reversal':{eliteParentsDefeated:1},'unlock-null-absorption':{damageFreeStandardSegments:1},'unlock-memory-burst':{bossReached:true},'unlock-afterburn':{efficientDashSegments:1},'unlock-deflection-pulse':{result:'victory',defensiveInteractions:12},'unlock-overclocked':{result:'victory'},'unlock-signal-restored':{result:'victory'},'unlock-memory-violet':{result:'victory',echoDamageShare:.35},'unlock-architect-fracture':{result:'victory',lastFrameUses:0},'unlock-resonant-wave':{result:'victory',echoDamageShare:.35},'unlock-clean-vector':{cleanVectorSegments:1},'unlock-station-cyan':{difficultyId:'overclocked',result:'victory'},
};
for(const definition of UNLOCK_DEFINITIONS){
 test(`Unlock evaluator grants ${definition.id}`,()=>{const run={...baseRun(),...conditionRuns[definition.id]};const ids=new UnlockEvaluator().evaluate({finalizedRun:run,save:createDefaultSaveData()}).map(x=>x.id);assert.ok(ids.includes(definition.id));});
 test(`Unlock transaction is idempotent for ${definition.id}`,()=>{const save=createDefaultSaveData();assert.deepEqual([...applyUnlocksToSave(save,[definition])],[definition.id]);assert.deepEqual([...applyUnlocksToSave(save,[definition])],[]);});
}
for(const definition of UNLOCK_DEFINITIONS){
 test(`Debug run cannot grant ${definition.id}`,()=>{const run={...baseRun(),...conditionRuns[definition.id],debug:true};assert.ok(!new UnlockEvaluator().evaluate({finalizedRun:run,save:createDefaultSaveData()}).some(x=>x.id===definition.id));});
}
for(const palette of PALETTE_DEFINITIONS)test(`Palette definition ${palette.id} is non-power data`,()=>{assert.equal(palette.type,'palette');assert.ok(Number.isInteger(palette.playerColor));assert.ok(Number.isInteger(palette.echoColor));});
for(const trail of TRAIL_DEFINITIONS)test(`Trail definition ${trail.id} is non-power data`,()=>{assert.equal(trail.type,'trail');assert.ok(Number.isInteger(trail.trailColor));assert.ok(typeof trail.trailStyle==='string');});

test('Cosmetic selection falls back to defaults',()=>{const save=createDefaultSaveData();save.progression.selectedPaletteId='locked';save.progression.selectedTrailId='locked';const r=validateCosmeticSelection(save);assert.equal(r.palette.id,'default');assert.equal(r.trail.id,'default');});
test('Cosmetic selection accepts unlocked values',()=>{const save=createDefaultSaveData();save.progression.unlockedPaletteIds.push('memory-violet');save.progression.unlockedTrailIds.push('clean-vector');save.progression.selectedPaletteId='memory-violet';save.progression.selectedTrailId='clean-vector';const r=validateCosmeticSelection(save);assert.equal(r.palette.id,'memory-violet');assert.equal(r.trail.id,'clean-vector');});

for(let index=0;index<20;index++)test(`Phase 8 save migration defaults Phase 9 fields ${index}`,()=>{const legacy={schemaVersion:1,createdAt:'x',updatedAt:'x',settings:createDefaultSaveData().settings,progression:{unlockedUpgradeIds:createDefaultSaveData().progression.unlockedUpgradeIds,unlockedDifficultyIds:['relaxed','standard']},statistics:{aggregateCounters:{runsStarted:index}},records:{recentRuns:[]},meta:{}};const v=validateSaveData(legacy).data;assert.equal(v.statistics.aggregateCounters.runsStarted,index);assert.equal(v.progression.selectedPaletteId,'default');assert.equal(v.progression.selectedTrailId,'default');assert.deepEqual(v.progression.unlockedPaletteIds,['default']);});
for(let index=0;index<10;index++)test(`Save validation deduplicates progression arrays ${index}`,()=>{const save=createDefaultSaveData();save.progression.unlockedPaletteIds=['default','default'];save.progression.unlockedTrailIds=['default','default'];save.progression.unlockedDifficultyIds=['standard','standard'];const v=validateSaveData(save).data;assert.equal(v.progression.unlockedPaletteIds.length,1);assert.equal(v.progression.unlockedTrailIds.length,1);assert.equal(new Set(v.progression.unlockedDifficultyIds).size,v.progression.unlockedDifficultyIds.length);});

const metrics=['highestScore','victoryScore','fastestVictoryMs','fastestBossMs','highestCombo','crossfireEvents','echoDamageShare','lowestDamageTaken','playerAccuracy'];
for(const metric of metrics)test(`Personal best creates ${metric}`,()=>{const manager=new PersonalBestManager();const save=createDefaultSaveData();const run={...baseRun(),result:'victory',bossDurationMs:1000};const comparisons=manager.compare({save,run});const item=comparisons.find(x=>x.metric===metric);assert.ok(item);assert.equal(item.label,'FIRST_RECORD');manager.apply(save,run,comparisons);assert.equal(save.statistics.personalBests.standard[metric].value,item.newValue);});
test('Personal best excludes debug runs',()=>{const manager=new PersonalBestManager();assert.deepEqual([...manager.compare({save:createDefaultSaveData(),run:{...baseRun(),debug:true}})],[]);});

for(let index=0;index<10;index++)test(`Aggregate statistics update deterministically ${index}`,()=>{const save=createDefaultSaveData();const run={...baseRun(),runId:`r${index}`,finalScore:100+index,scoreBreakdown:{crossfireScore:index,nearMissScore:index,avoidanceBonus:100,timeBonus:20,enemyScore:100},killsByEnemyType:{drifter:index},eliteModifiersDefeated:[]};new AggregateStatisticsManager().apply(save,run);assert.equal(save.statistics.aggregateCounters.runsCompleted,1);assert.equal(save.statistics.aggregateCounters.totalScore,100+index);assert.equal(save.statistics.combatCounters['kills:drifter'],index);});
for(let index=0;index<10;index++)test(`Recent run normalization ${index}`,()=>{const r=createRecentRunRecord({runId:`r${index}`,result:index%2?'victory':'defeat',seed:index,finalScore:index+.6,difficultyId:'bad',selectedUpgradeHistory:Array(50).fill({id:'x'}),arenaSequence:Array(50).fill('a')});assert.equal(r.finalScore,index+1);assert.equal(r.difficultyId,'standard');assert.equal(r.selectedUpgradeHistory.length,32);assert.equal(r.arenaSequence.length,16);assert.ok(Object.isFrozen(r));});

test('ProgressionManager accepts only unlocked known cosmetics', async () => {
  const { ProgressionManager } = await import('../src/progression/ProgressionManager.js');
  const save = createDefaultSaveData();
  const manager = new ProgressionManager();
  assert.equal(manager.selectCosmetic(save, 'palette', 'memory-violet').accepted, false);
  save.progression.unlockedPaletteIds.push('memory-violet');
  assert.equal(manager.selectCosmetic(save, 'palette', 'memory-violet').accepted, true);
  assert.equal(save.progression.selectedPaletteId, 'memory-violet');
  assert.equal(manager.selectCosmetic(save, 'trail', 'unknown').accepted, false);
});
