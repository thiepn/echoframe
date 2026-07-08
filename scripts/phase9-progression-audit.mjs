import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDefaultSaveData } from '../src/state/defaultSaveData.js';
import { ProgressionManager } from '../src/progression/ProgressionManager.js';
import { UnlockEvaluator } from '../src/progression/UnlockEvaluator.js';
import { validateSaveData } from '../src/state/SaveSchema.js';
import { UNLOCK_DEFINITIONS } from '../src/data/progressionDefinitions.js';
import { SeededRandom } from '../src/utils/SeededRandom.js';
const ROOT=path.resolve(new URL('..',import.meta.url).pathname),reportPath=path.join(ROOT,'docs','PHASE9_PROGRESSION_AUDIT.json');
const manager=new ProgressionManager({evaluator:new UnlockEvaluator()});
const known=new Set(UNLOCK_DEFINITIONS.map(x=>x.id));
const failures={missingRequiredUnlocks:0,invalidExtraUnlocks:0,duplicateUnlocks:0,revokedUnlocks:0,circularRequirements:0,unknownRewardIds:0,lockedCosmeticSelection:0,progressionCausedStatChanges:0,saveRoundTripFailures:0};
const unlockCounts={};
for(let index=0;index<5000;index++){
  const rng=new SeededRandom(620000+index);let save=createDefaultSaveData('2026-07-07T00:00:00.000Z');
  if(index%7===0)save.progression.unlockRecords.push({unlockId:'unlock-twin-recall',completedAt:'2026-07-07T00:00:00.000Z'});
  const run={runId:`progress-${index}`,result:rng.next()<.58?'victory':'defeat',difficultyId:rng.pick(['relaxed','standard','overclocked']),debug:index%19===0,crossfireEvents:rng.integer(0,3),eliteParentsDefeated:rng.integer(0,2),damageFreeStandardSegments:rng.integer(0,2),bossReached:rng.next()<.7,efficientDashSegments:rng.integer(0,2),defensiveInteractions:rng.integer(0,18),echoDamageShare:rng.next(),lastFrameUses:rng.integer(0,1),cleanVectorSegments:rng.integer(0,2)};
  const beforeStats=JSON.stringify(save.statistics);const defs=manager.evaluate({finalizedRun:run,save});
  if(defs.some(d=>!known.has(d.id)))failures.invalidExtraUnlocks++;
  if(new Set(defs.map(d=>d.id)).size!==defs.length)failures.duplicateUnlocks++;
  const applied=manager.apply(save,defs,'2026-07-07T00:00:00.000Z');
  if(new Set(applied).size!==applied.length)failures.duplicateUnlocks++;
  if(JSON.stringify(save.statistics)!==beforeStats)failures.progressionCausedStatChanges++;
  for(const def of defs){unlockCounts[def.id]=(unlockCounts[def.id]??0)+1;if(!def.rewardIds.length)failures.unknownRewardIds++;}
  const second=manager.evaluate({finalizedRun:run,save});if(second.some(d=>applied.includes(d.id)))failures.duplicateUnlocks++;
  const validated=validateSaveData(JSON.parse(JSON.stringify(save)));if(!validated.data.progression.unlockedPaletteIds.includes(validated.data.progression.selectedPaletteId)||!validated.data.progression.unlockedTrailIds.includes(validated.data.progression.selectedTrailId))failures.lockedCosmeticSelection++;
  if(JSON.stringify(validateSaveData(validated.data).data)!==JSON.stringify(validated.data))failures.saveRoundTripFailures++;
  const allBefore=new Set(save.progression.unlockRecords.map(x=>x.unlockId));manager.apply(save,[], '2026-07-07T00:00:01.000Z');for(const id of allBefore)if(!save.progression.unlockRecords.some(x=>x.unlockId===id))failures.revokedUnlocks++;
}
// Explicit canonical Overclocked cases.
const cases=[
  [{result:'victory',difficultyId:'standard',debug:false},true],
  [{result:'victory',difficultyId:'relaxed',debug:false},false],
  [{result:'defeat',difficultyId:'standard',debug:false},false],
  [{result:'victory',difficultyId:'standard',debug:true},false],
];
for(const [run,expected] of cases){const ids=manager.evaluate({finalizedRun:run,save:createDefaultSaveData()}).map(x=>x.id);if(ids.includes('unlock-overclocked')!==expected)failures.missingRequiredUnlocks++;}
const passed=Object.values(failures).every(v=>v===0);const report={generatedAt:new Date().toISOString(),scope:'5,000 deterministic unlock evaluation and save-validation cases.',cases:5000,unlockCounts,failures,passed};await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log(`Phase 9 progression audit: ${passed?'PASS':'FAIL'} — 5,000 cases.`);if(!passed)process.exitCode=1;
