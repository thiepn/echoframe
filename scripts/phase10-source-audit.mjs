import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const ROOT=path.resolve(new URL('..',import.meta.url).pathname),reportPath=path.join(ROOT,'docs','PHASE10_SOURCE_AUDIT.json');
async function walk(dir){const out=[];for(const name of await readdir(dir)){const p=path.join(dir,name),s=await stat(p);if(s.isDirectory()){if(!['node_modules','.git'].includes(name)&&!name.startsWith('dist'))out.push(...await walk(p));}else out.push(p);}return out;}
const files=await walk(ROOT);const sourceFiles=files.filter(f=>/\.(js|mjs|html|json|md|yml|yaml)$/.test(f));const findings=[];let imports=0;
const canonical={};for(const name of ['GAME_DESIGN.md','TECHNICAL_SPEC.md','ART_DIRECTION.md','BALANCE_SPEC.md','QA_CHECKLIST.md']){const b=await readFile(path.join(ROOT,'docs',name));canonical[name]=crypto.createHash('sha256').update(b).digest('hex');}
for(const file of sourceFiles){const rel=path.relative(ROOT,file).replaceAll('\\','/'),text=await readFile(file,'utf8');
 const executable=/\.(?:js|mjs|html)$/.test(rel);
 if(executable&&/\beval\s*\(|new Function\s*\(/.test(text))findings.push({severity:'Critical',file:rel,kind:'dynamic-code'});
 if(/localhost|127\.0\.0\.1/.test(text)&&rel.startsWith('src/'))findings.push({severity:'High',file:rel,kind:'production-localhost'});
 if(/fetch\s*\(|XMLHttpRequest|WebSocket\s*\(/.test(text)&&rel.startsWith('src/'))findings.push({severity:'High',file:rel,kind:'runtime-network'});
 if(executable&&/Math\.random\s*\(/.test(text)&&!['src/systems/AudioManager.js','src/graphics/TextureFactory.js','src/systems/PlayerFeedbackSystem.js','src/systems/SceneFlowController.js','src/state/RunState.js'].includes(rel))findings.push({severity:'High',file:rel,kind:'gameplay-random'});
 if(/\.(?:js|mjs)$/.test(rel))for(const match of text.matchAll(/(?:import|export)\s+(?:[^'\"]+from\s+)?['\"](\.[^'\"]+)['\"]/g)){imports++;const candidate=path.resolve(path.dirname(file),match[1]);let found=false;for(const suffix of ['', '.js','.mjs','/index.js']){try{if((await stat(candidate+suffix)).isFile()){found=true;break;}}catch{}}if(!found)findings.push({severity:'Critical',file:rel,kind:'missing-import',value:match[1]});}
}
const productionFiles=['src/scenes/MainMenuScene.js','src/scenes/TutorialScene.js','src/scenes/SettingsScene.js','src/scenes/PauseScene.js','src/scenes/CreditsScene.js','index.html','public/manifest.webmanifest'];for(const rel of productionFiles){const text=await readFile(path.join(ROOT,rel),'utf8');for(const term of ['foundation milestone','pre-boss run complete','interactive rebinding remains deferred','not implemented','coming soon'])if(text.toLowerCase().includes(term))findings.push({severity:'High',file:rel,kind:'stale-copy',value:term});}
const report={generatedAt:new Date().toISOString(),filesAudited:sourceFiles.length,importEdges:imports,canonicalDocumentHashes:canonical,findings,severityTotals:{Critical:findings.filter(x=>x.severity==='Critical').length,High:findings.filter(x=>x.severity==='High').length,Medium:findings.filter(x=>x.severity==='Medium').length,Low:findings.filter(x=>x.severity==='Low').length},passed:findings.every(x=>!['Critical','High'].includes(x.severity))};await writeFile(reportPath,`${JSON.stringify(report,null,2)}\n`);console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
