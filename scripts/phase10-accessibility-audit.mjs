import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDefaultSaveData } from '../src/state/defaultSaveData.js';
import { validateSaveData } from '../src/state/SaveSchema.js';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const reportPath = path.join(ROOT, 'docs', 'PHASE10_ACCESSIBILITY_AUDIT.json');
const presets = [
  { name: 'Default', mutate: () => {} },
  { name: 'Reduced motion', mutate: (s) => { s.visual.screenShake=0;s.visual.reducedFlashes=true;s.visual.reducedParticles=true; } },
  { name: 'Visibility aids', mutate: (s) => { s.visual.highContrast=true;s.accessibility.largerTelegraphOutlines=true;s.accessibility.persistentPlayerLocator=true; } },
  { name: 'Minimal HUD effects', mutate: (s) => { s.visual.damageNumbers=false;s.visual.aimLine=false;s.visual.hudOpacity=0.5; } },
  { name: 'All aids', mutate: (s) => { s.visual.screenShake=0;s.visual.reducedFlashes=true;s.visual.reducedParticles=true;s.visual.highContrast=true;s.visual.damageNumbers=false;s.visual.aimLine=false;s.visual.hudOpacity=0.5;s.accessibility.pauseOnFocusLoss=true;s.accessibility.persistentPlayerLocator=true;s.accessibility.largerTelegraphOutlines=true; } },
];
const normalizedPresets = presets.map(({name,mutate})=>{const save=createDefaultSaveData();mutate(save.settings);return {name,settings:validateSaveData(save).data.settings};});
const files = ['src/scenes/TutorialScene.js','src/scenes/RunScene.js','src/scenes/BossScene.js','src/scenes/HUDScene.js','src/systems/CameraController.js','src/systems/PlayerFeedbackSystem.js','src/graphics/PlayerRenderer.js','src/graphics/DrifterRenderer.js','src/graphics/SentryRenderer.js','src/graphics/LancerRenderer.js','src/graphics/NullArchitectRenderer.js','src/systems/ArenaHazardManager.js','src/systems/BossSectorManager.js','src/hostile-echo/HostileEcho.js'];
const source = Object.fromEntries(await Promise.all(files.map(async f=>[f,await readFile(path.join(ROOT,f),'utf8')])));
const checks = {
  presetCount: normalizedPresets.length===5,
  zeroShakePreserved: normalizedPresets[1].settings.visual.screenShake===0,
  hudMinimumPreserved: normalizedPresets[3].settings.visual.hudOpacity===0.5,
  tutorialReadsSettings: /settingsManager/.test(source['src/scenes/TutorialScene.js']),
  runUsesCameraAuthority: /CameraController/.test(source['src/scenes/RunScene.js']) && !/cameras\.main\.shake/.test(source['src/scenes/RunScene.js']),
  bossUsesCameraAuthority: /CameraController/.test(source['src/scenes/BossScene.js']),
  hudOpacityConnected: /hudOpacity|--hud-opacity/.test(source['src/scenes/HUDScene.js']),
  locatorConnected: /persistentPlayerLocator/.test(Object.values(source).join('\n')),
  largerOutlinesConnected: ['src/scenes/TutorialScene.js','src/systems/ArenaHazardManager.js','src/systems/BossSectorManager.js','src/hostile-echo/HostileEcho.js','src/graphics/NullArchitectRenderer.js'].every((file)=>/largerTelegraphOutlines/.test(source[file])),
  noGameplayRngMutation: normalizedPresets.every(p=>!JSON.stringify(p.settings).includes('seed')),
};
const findings=[];for(const [name,ok] of Object.entries(checks))if(!ok)findings.push({severity:'High',check:name});
const report={generatedAt:new Date().toISOString(),presets:normalizedPresets,scenesPlannedForBrowserMatrix:['Tutorial','Early combat','Elite combat','Hazard arena','Boss Phase 2','Boss Phase 3','Results','Archive','Statistics','Settings'],checks,findings,passed:findings.length===0};
await writeFile(reportPath,`${JSON.stringify(report,null,2)}\n`);console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
