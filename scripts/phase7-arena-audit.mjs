import fs from 'node:fs';
import path from 'node:path';
import { RunPlanGenerator, RUN_PLAN_GENERATIONS } from '../src/run/RunPlanGenerator.js';
import { ArenaValidator } from '../src/arena/ArenaValidator.js';

const difficulties=['relaxed','standard','overclocked'];
const stable=v=>JSON.stringify(v);
const inc=(o,k,n=1)=>{o[k]=(o[k]??0)+n;};
const report={generatedAt:new Date().toISOString(),scope:'3,000 complete deterministic Phase 7 arena sequences (1,000 per difficulty).',difficulties:{},totals:{sequences:0,descriptors:0,deterministicComparisons:0,deterministicMatches:0,templateFrequency:{},transformFrequency:{},hazardFrequency:{},decorationFrequency:{},consecutiveLayoutViolations:0,hazardRepetitionViolations:0,fallbackCount:0,generationAttempts:0,maximumGenerationAttempts:0,rejectionReasons:{},playerSpawnViolations:0,navigationFailures:0,routeWidthFailures:0,safeAreaFailures:0,eliteSocketFailures:0,lancerLaneFailures:0,rangedLaneFailures:0,largeClearanceFailures:0,copyPlacementFailures:0,cameraBoundFailures:0,nonFiniteCoordinateCount:0,bossChamberMisselectionCount:0,recoveryHazardCount:0,errors:[]}};
const generator=new RunPlanGenerator({generationVersion:RUN_PLAN_GENERATIONS.phase7});
const validator=new ArenaValidator();
for(const difficultyId of difficulties){
 const m={sequences:0,descriptors:0,deterministicMatches:0,templateFrequency:{},transformFrequency:{},hazardFrequency:{},decorationFrequency:{},fallbackCount:0,maximumGenerationAttempts:0,errors:[]};
 for(let seed=1;seed<=1000;seed++){
  const a=generator.generate({seed,difficultyId});const b=generator.generate({seed,difficultyId});
  report.totals.sequences++;report.totals.deterministicComparisons++;m.sequences++;
  if(stable(a.arenaSequence)===stable(b.arenaSequence)){report.totals.deterministicMatches++;m.deterministicMatches++;}else{m.errors.push({seed,reason:'arena-sequence-nondeterministic'});}
  let previous=null;const hazardCounts={};
  for(const segment of a.segments){const d=segment.arenaDescriptor;report.totals.descriptors++;m.descriptors++;
   inc(report.totals.templateFrequency,d.templateId);inc(report.totals.transformFrequency,d.transformId);inc(report.totals.hazardFrequency,d.hazardConfigurationId);inc(report.totals.decorationFrequency,d.decorationVariantId);
   inc(m.templateFrequency,d.templateId);inc(m.transformFrequency,d.transformId);inc(m.hazardFrequency,d.hazardConfigurationId);inc(m.decorationFrequency,d.decorationVariantId);
   const attempts=d.generationDiagnostics?.generationAttempts??1;report.totals.generationAttempts+=attempts;report.totals.maximumGenerationAttempts=Math.max(report.totals.maximumGenerationAttempts,attempts);m.maximumGenerationAttempts=Math.max(m.maximumGenerationAttempts,attempts);
   if(d.generationDiagnostics?.fallbackUsed){report.totals.fallbackCount++;m.fallbackCount++;}
   for(const [r,n] of Object.entries(d.generationDiagnostics?.rejectionReasons??{}))inc(report.totals.rejectionReasons,r,n);
   if(previous===d.templateId&& !['recovery','boss-handoff'].includes(segment.segmentId)){report.totals.consecutiveLayoutViolations++;m.errors.push({seed,segmentId:segment.segmentId,reason:'consecutive-layout'});} previous=d.templateId;
   if(d.hazardConfigurationId!=='none'){inc(hazardCounts,d.hazardConfigurationId);if(hazardCounts[d.hazardConfigurationId]>2){report.totals.hazardRepetitionViolations++;m.errors.push({seed,segmentId:segment.segmentId,reason:'hazard-repeat'});}}
   if(segment.segmentId==='recovery'&&d.hazardConfigurationId!=='none')report.totals.recoveryHazardCount++;
   if(segment.segmentId!=='boss-handoff'&&d.templateId==='boss-chamber')report.totals.bossChamberMisselectionCount++;
   if(segment.segmentId==='boss-handoff'&&d.templateId!=='boss-chamber')report.totals.bossChamberMisselectionCount++;
   const v=validator.validate(d);if(!v.valid){for(const reason of v.reasons){
    if(reason==='arena-player-spawn-blocked')report.totals.playerSpawnViolations++;
    if(reason==='arena-navigation-disconnected')report.totals.navigationFailures++;
    if(reason==='arena-route-too-narrow')report.totals.routeWidthFailures++;
    if(reason==='arena-safe-area-insufficient'||reason==='arena-hazard-route-blocked')report.totals.safeAreaFailures++;
    if(reason==='arena-elite-socket-invalid')report.totals.eliteSocketFailures++;
    if(reason==='arena-lancer-lane-invalid')report.totals.lancerLaneFailures++;
    if(reason==='arena-ranged-lane-invalid')report.totals.rangedLaneFailures++;
    if(reason==='arena-large-clearance-invalid')report.totals.largeClearanceFailures++;
    if(reason==='arena-copy-placement-invalid')report.totals.copyPlacementFailures++;
    if(reason==='arena-camera-bounds-invalid')report.totals.cameraBoundFailures++;
    if(reason==='arena-non-finite-coordinate')report.totals.nonFiniteCoordinateCount++;
    m.errors.push({seed,segmentId:segment.segmentId,reason});
   }}
  }
 }
 report.difficulties[difficultyId]=m;report.totals.errors.push(...m.errors.map(e=>({difficultyId,...e})));
}
report.totals.averageGenerationAttempts=report.totals.descriptors?report.totals.generationAttempts/report.totals.descriptors:0;
report.totals.passed=report.totals.deterministicMatches===report.totals.deterministicComparisons&&['consecutiveLayoutViolations','hazardRepetitionViolations','playerSpawnViolations','navigationFailures','routeWidthFailures','safeAreaFailures','eliteSocketFailures','lancerLaneFailures','rangedLaneFailures','largeClearanceFailures','copyPlacementFailures','cameraBoundFailures','nonFiniteCoordinateCount','bossChamberMisselectionCount','recoveryHazardCount'].every(k=>report.totals[k]===0)&&report.totals.errors.length===0;
const outputPath=path.resolve('docs/PHASE7_ARENA_AUDIT.json');fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({outputPath,totals:report.totals},null,2));if(!report.totals.passed)process.exitCode=1;
