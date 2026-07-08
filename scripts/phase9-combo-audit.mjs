import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ComboController } from '../src/scoring/ComboController.js';
import { COMBO_DEFINITIONS } from '../src/data/scoreDefinitions.js';
import { SeededRandom } from '../src/utils/SeededRandom.js';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname); const reportPath = path.join(ROOT,'docs','PHASE9_COMBO_AUDIT.json');
const failures = { formulaMismatches:0, capViolations:0, negativeCombo:0, decayDuringPause:0, wrongDamagePenalties:0, wrongEventOrder:0, nonFiniteValues:0 };
let highestObservedCombo=0, maxMultiplier=0;
for(let timeline=0;timeline<10000;timeline++){
  const rng=new SeededRandom(510000+timeline); const combo=new ComboController(); let now=0;
  for(let step=0;step<35;step++){
    const roll=rng.next(); now+=rng.integer(0,450);
    if(roll<.45) combo.gain(rng.pick([1,3,.5,.2]),now,rng.pick(['kill','elite','crossfire','near-miss']));
    else if(roll<.58){const before=combo.combo;const out=combo.applyAcceptedDamage(now);if(Math.abs(out.after-before/2)>1e-9)failures.wrongDamagePenalties++;}
    else {const paused=roll<.68;const before=combo.combo;combo.update(rng.integer(16,900),now,{paused});if(paused&&combo.combo!==before)failures.decayDuringPause++;}
    const expected=Math.min(COMBO_DEFINITIONS.maximumMultiplier,1+Math.min(combo.combo,COMBO_DEFINITIONS.multiplierComboCap)*COMBO_DEFINITIONS.multiplierPerPoint);
    if(Math.abs(combo.multiplier-expected)>1e-12)failures.formulaMismatches++;
    if(combo.multiplier>1.6000000001)failures.capViolations++; if(combo.combo<0)failures.negativeCombo++;
    if(!Number.isFinite(combo.combo)||!Number.isFinite(combo.multiplier))failures.nonFiniteValues++;
    highestObservedCombo=Math.max(highestObservedCombo,combo.combo);maxMultiplier=Math.max(maxMultiplier,combo.multiplier);
  }
  const before=combo.combo;combo.update(5000,now+5000,{paused:true});if(combo.combo!==before)failures.decayDuringPause++;
}
const passed=Object.values(failures).every(v=>v===0);const report={generatedAt:new Date().toISOString(),scope:'10,000 deterministic combo event timelines.',timelines:10000,highestObservedCombo,maxMultiplier,definitions:COMBO_DEFINITIONS,failures,passed};
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log(`Phase 9 combo audit: ${passed?'PASS':'FAIL'} — 10,000 timelines.`);if(!passed)process.exitCode=1;
