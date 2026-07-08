import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const reportPath = path.join(ROOT, 'docs', 'PHASE6_SOAK_VALIDATION.json');
const durationMs = Number(process.env.SOAK_DURATION_MS || 1_200_000);
const cdpPort = Number(process.env.CDP_PORT || 9222);
const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = targets.find((entry) => entry.type === 'page');
if (!target) throw new Error('No Chromium page target.');

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 1;
const pending = new Map();
const exceptions = [];
const consoleErrors = [];
const warnings = [];
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const item = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) item.reject(new Error(JSON.stringify(message.error)));
    else item.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (message.method === 'Runtime.consoleAPICalled') {
    if (message.params.type === 'error') consoleErrors.push(message.params);
    if (message.params.type === 'warning') warnings.push(message.params);
  }
};
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
function send(method, params = {}) {
  const requestId = id++;
  ws.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || 'Evaluation failed.');
  return response.result?.value;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Page.reload', { ignoreCache: true });

const heapStart = await send('Runtime.getHeapUsage').catch(() => null);
const soakExpression = `(async () => {
  const durationMs = ${JSON.stringify(durationMs)};
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const activeScene = (key) => globalThis.__ECHOFRAME__?.game?.scene?.getScenes(true)?.find((scene) => scene.scene.key === key) ?? null;
  const stateSummary = () => ({ scenes:globalThis.__ECHOFRAME__?.game?.scene?.getScenes(true)?.map(s=>s.scene.key)??[], hook:Boolean(globalThis.__ECHOFRAME_PHASE6__), segment:globalThis.__ECHOFRAME_PHASE6__?.getSnapshot?.().segmentIndex??null });
  const waitFor = async (predicate, label, timeoutMs = 12000) => {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
      try { if (predicate()) return; } catch {}
      await sleep(10);
    }
    throw new Error('Soak timeout: ' + label + ' ' + JSON.stringify(stateSummary()));
  };
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const diagnostics = (scene) => ({
    listeners:scene.services.eventBus.listenerCount(),
    cleanup:scene.services.debugManager.getCleanupCount(),
    inputContexts:scene.services.inputManager.contexts.size,
    audioContexts:scene.services.audioManager.getDiagnostics().contextCount,
  });
  const patchFlow = (scene) => {
    const flow=scene.services.sceneFlow;
    if(!flow.__phase6SoakOriginalReplace){
      flow.__phase6SoakOriginalReplace=flow.replace.bind(flow);
      flow.replace=(input)=>flow.__phase6SoakOriginalReplace({...input,fadeMs:0});
    }
  };
  await waitFor(()=>Boolean(globalThis.__ECHOFRAME__),'game boot',15000);
  await waitFor(()=>Boolean(activeScene('MainMenuScene')),'main menu');
  const menu=activeScene('MainMenuScene');
  patchFlow(menu);
  menu.services.debugManager.setEnabled(true);
  const menuBaseline=diagnostics(menu);
  const run=menu.services.gameState.createRun({seed:0xE6F60006,difficultyId:'overclocked'});
  menu.services.sceneFlow.replace({sourceKeys:['MainMenuScene'],targetKey:'RunScene',payload:{runId:run.runId},launch:[{key:'HUDScene',payload:{runId:run.runId}}],token:'phase6-soak-'+run.runId,fadeMs:0});
  await waitFor(()=>Boolean(activeScene('RunScene')&&globalThis.__ECHOFRAME_PHASE6__),'run start');

  const cumulativeTelemetry={overclockedAttacks:0,replicationTriggers:0,copiesSpawned:0,copiesDefeated:0,resonantTriggers:0,shieldGranted:0,shieldAbsorbed:0,shieldExpiries:0,shieldBreaks:0,hostsSpawned:0};
  const accumulateTelemetry=(scene)=>{const t=scene.eliteTelemetry.snapshot();for(const key of Object.keys(cumulativeTelemetry))cumulativeTelemetry[key]+=Number(t[key]||0);};
  const actionCounts={echoRequests:0,echoDeployments:0,carrierReleases:0,suppressionActivations:0,bulwarkChecks:0,overclockedCycles:0,replicationCycles:0,resonantCycles:0,pauseEvents:0,resizeEvents:0,projectileStressEvents:0,poolStressEvents:0,forceClearEvents:0,upgradeTransitions:0,segmentTransitions:0};
  const observedEnemyTypes=new Set();
  const observedLancerStates=new Set();
  const observedModifiers=new Set();
  const samples=[];
  const memorySamples=[];
  const modifierOrder=['overclocked','replicating','resonant'];
  let modifierIndex=0;
  let activeModifier=modifierOrder[0];

  const setup=(modifierId)=>{
    const scene=activeScene('RunScene');
    scene.services.debugManager.setEnabled(true);
    scene.encounterDirector.update=()=>{};
    scene.encounterDirector.completed=false;
    scene.encounterDirector.directorState='PHASE6_SOAK_HOLD';
    scene.enemyManager.clear('phase6-soak-reset');
    scene.eliteManager.clear('phase6-soak-reset');
    scene.carrierShardManager.clear('phase6-soak-reset');
    scene.enemyProjectileManager.clear('phase6-soak-reset');
    scene.projectileManager.clear('phase6-soak-reset');
    scene.echoProjectileManager.clear('phase6-soak-reset');
    scene.echoPlaybackSystem.clear('phase6-soak-reset');
    scene.playerHealth.setCurrent(scene.playerHealth.maximumHealth);
    scene.hitInvulnerability.start(10000);
    scene.player.setPosition(800,735); scene.player.bodySprite?.setPosition?.(800,735);
    const positions={drifter:[230,180],sentry:[1370,180],lancer:[250,690],'shard-carrier':[1350,690],bulwark:[300,450],suppressor:[1300,450]};
    for(const [type,[x,y]] of Object.entries(positions))scene.enemyManager.spawn(type,{x,y});
    const host={overclocked:'sentry',replicating:'drifter',resonant:'bulwark'}[modifierId];
    const elite=globalThis.__ECHOFRAME_PHASE6__.spawnElite(host,modifierId);
    if(modifierId==='replicating'){
      const amount=elite.health.currentHealth*0.55;
      const packet={damageId:'soak-repl-'+scene.run.elapsedSimulationMs,sourceFaction:'PLAYER',sourceType:'player-projectile',sourceId:'soak-player',targetId:elite.enemyId,finalAmount:amount,baseAmount:amount,critical:false,direction:{x:1,y:0},timestampMs:scene.run.elapsedSimulationMs};
      const result=scene.damageService.resolve(packet,elite,{absorbDamage:(value)=>scene.enemyManager.absorbTemporaryShield(elite,value)});
      scene.eliteManager.onDamageResolved(elite,result,packet);
    }
    if(modifierId==='resonant'){
      const support=scene.enemyManager.spawn('drifter',{x:elite.x+90,y:elite.y});
      support.activateFromSpawn?.();
      scene.enemyManager.beginDeath(support,'player');
      const hit=(sourceFaction,id)=>{const packet={damageId:id+'-'+scene.run.elapsedSimulationMs,sourceFaction,sourceType:sourceFaction==='PLAYER'?'player-projectile':'echo-projectile',sourceId:id,targetId:elite.enemyId,finalAmount:8,baseAmount:8,critical:false,direction:{x:1,y:0},timestampMs:scene.run.elapsedSimulationMs};const result=scene.damageService.resolve(packet,elite,{absorbDamage:(value)=>scene.enemyManager.absorbTemporaryShield(elite,value)});scene.eliteManager.onDamageResolved(elite,result,packet);return result;};
      hit('PLAYER','soak-res-player'); hit('ECHO','soak-res-echo');
    }
    observedModifiers.add(modifierId);
    if(modifierId==='overclocked')actionCounts.overclockedCycles+=1;
    if(modifierId==='replicating')actionCounts.replicationCycles+=1;
    if(modifierId==='resonant')actionCounts.resonantCycles+=1;
    return elite?.enemyId??null;
  };

  const waitForRunSegment=async(index,oldHook=null)=>{
    await waitFor(()=>{const scene=activeScene('RunScene');return Boolean(scene&&globalThis.__ECHOFRAME_PHASE6__&&globalThis.__ECHOFRAME_PHASE6__!==oldHook&&globalThis.__ECHOFRAME_PHASE6__.getSnapshot().segmentIndex===index&&!scene.services.sceneFlow.currentTransition);},'run segment '+index);
    return activeScene('RunScene');
  };
  const transitionToNextSegment=async(expectedIndex)=>{
    const scene=activeScene('RunScene');
    accumulateTelemetry(scene);
    const oldHook=globalThis.__ECHOFRAME_PHASE6__;
    oldHook.completeCurrentChamber();
    await waitFor(()=>Boolean(activeScene('UpgradeScene')),'upgrade '+expectedIndex);
    const upgrade=activeScene('UpgradeScene');
    upgrade.time.timeScale=80;
    upgrade.buttons[0].activate();
    await waitForRunSegment(expectedIndex,oldHook);
    actionCounts.upgradeTransitions+=1;
    actionCounts.segmentTransitions+=1;
    setup(activeModifier);
  };

  setup(activeModifier);
  await sleep(500);
  const runBaseline={...diagnostics(activeScene('RunScene')),collisionHandles:globalThis.__ECHOFRAME_PHASE6__.getSnapshot().collisionHandles};
  const startedAt=performance.now();
  const transitionSchedule=[0.15,0.30,0.45,0.60,0.75].map(r=>durationMs*r);
  const pauseSchedule=[0.20,0.50,0.80].map(r=>durationMs*r);
  let transitionIndex=0;
  let pauseIndex=0;
  let nextElite=12000;
  let nextEcho=0;
  let nextCarrier=8000;
  let nextSuppression=5000;
  let nextBulwark=7000;
  let nextProjectile=20000;
  let nextPool=durationMs<120000?30000:75000;
  let nextClear=durationMs<120000?40000:90000;
  let nextMemory=0;
  let nextSample=0;
  let nextProgress=60000;

  while(performance.now()-startedAt<durationMs){
    const elapsed=performance.now()-startedAt;
    const actions=[];
    globalThis.__PHASE6_SOAK_PROGRESS={elapsedMs:Math.round(elapsed),durationMs,stage:'loop',segmentIndex:activeScene('RunScene')?.run?.currentSegmentIndex??null,transitionIndex,actions:{...actionCounts}};
    if(!activeScene('RunScene')||!globalThis.__ECHOFRAME_PHASE6__||!activeScene('RunScene').playerHealth){await sleep(20);continue;}
    if(transitionIndex<transitionSchedule.length&&elapsed>=transitionSchedule[transitionIndex]){globalThis.__PHASE6_SOAK_PROGRESS.stage='transition-'+(transitionIndex+1);await transitionToNextSegment(transitionIndex+1);transitionIndex+=1;actions.push('upgrade-transition');}
    if(elapsed>=nextElite){modifierIndex=(modifierIndex+1)%modifierOrder.length;activeModifier=modifierOrder[modifierIndex];setup(activeModifier);nextElite+=18000;actions.push('elite-'+activeModifier);}
    if(elapsed>=nextEcho){actionCounts.echoRequests+=1;globalThis.__ECHOFRAME_PHASE6__.forceRecordingReady();globalThis.__ECHOFRAME_PHASE6__.forceCooldownReady();if(globalThis.__ECHOFRAME_PHASE6__.deployEcho())actionCounts.echoDeployments+=1;nextEcho+=12000;actions.push('echo');}
    if(elapsed>=nextCarrier){const scene=activeScene('RunScene');let carrier=scene.enemyManager.activeEnemies.find(e=>e.type==='shard-carrier'&&!e.state.is('DYING'));if(!carrier)carrier=scene.enemyManager.spawn('shard-carrier',{x:1350,y:690});if(scene.enemyManager.beginDeath(carrier,'player'))actionCounts.carrierReleases+=1;scene.enemyManager.spawn('shard-carrier',{x:1350,y:690});nextCarrier+=15000;actions.push('carrier');}
    if(elapsed>=nextSuppression){const scene=activeScene('RunScene');let enemy=scene.enemyManager.activeEnemies.find(e=>e.type==='suppressor'&&!e.state.is('DYING'));if(enemy)scene.enemyManager.deactivate(enemy,'soak-suppression-reset');enemy=scene.enemyManager.spawn('suppressor',{x:Math.min(1430,scene.player.x+120),y:scene.player.y});enemy.activateFromSpawn?.();enemy.setPosition(Math.min(1430,scene.player.x+120),scene.player.y);enemy.beginAnticipation?.();enemy.beginField?.();scene.suppressionService.update(scene.enemyManager.activeSuppressors,scene.player);const suppression=scene.suppressionService.snapshot();assert(suppression.active&&suppression.scalar<1,'Suppression did not activate');actionCounts.suppressionActivations+=1;nextSuppression+=20000;actions.push('suppression');}
    if(elapsed>=nextBulwark){const scene=activeScene('RunScene');let enemy=scene.enemyManager.activeEnemies.find(e=>e.type==='bulwark'&&!e.state.is('DYING'));if(!enemy)enemy=scene.enemyManager.spawn('bulwark',{x:300,y:450});enemy.activateFromSpawn?.();enemy.shieldAngle=0;const packet=(direction,id)=>Object.freeze({finalAmount:20,direction,timestampMs:scene.run.elapsedSimulationMs,damageId:id});const front=enemy.modifyIncomingDamage(packet({x:-1,y:0},'front-'+elapsed));const rear=enemy.modifyIncomingDamage(packet({x:1,y:0},'rear-'+elapsed));assert(front.packet.finalAmount>0&&front.packet.finalAmount<rear.packet.finalAmount,'Bulwark mitigation failed');actionCounts.bulwarkChecks+=1;nextBulwark+=18000;actions.push('bulwark');}
    if(elapsed>=nextProjectile){globalThis.__ECHOFRAME_PHASE6__.stressHostileProjectiles();actionCounts.projectileStressEvents+=1;nextProjectile+=30000;actions.push('projectile-cap');}
    if(elapsed>=nextPool){globalThis.__ECHOFRAME_PHASE6__.stressEnemyPools();actionCounts.poolStressEvents+=1;nextPool+=120000;actions.push('enemy-pool-cap');}
    if(elapsed>=nextClear){globalThis.__ECHOFRAME_PHASE6__.clearCombatObjects();setup(activeModifier);actionCounts.forceClearEvents+=1;nextClear+=120000;actions.push('force-clear');}
    if(pauseIndex<pauseSchedule.length&&elapsed>=pauseSchedule[pauseIndex]){const scene=activeScene('RunScene');const before=scene.run.elapsedSimulationMs;scene.scene.pause();await sleep(1000);assert(Math.abs(scene.run.elapsedSimulationMs-before)<1,'Simulation advanced during pause');scene.scene.resume();actionCounts.pauseEvents+=1;pauseIndex+=1;actions.push('pause');}
    if(elapsed>=nextMemory){if(performance.memory)memorySamples.push({elapsedMs:Math.round(elapsed),usedSize:performance.memory.usedJSHeapSize,totalSize:performance.memory.totalJSHeapSize});nextMemory+=30000;}
    if(elapsed>=nextSample){const scene=activeScene('RunScene');if(!scene?.playerHealth){await sleep(20);continue;}scene.playerHealth.setCurrent(scene.playerHealth.maximumHealth);scene.hitInvulnerability.start(5000);const snap=globalThis.__ECHOFRAME_PHASE6__.getSnapshot();const enemies=scene.enemyManager.getActiveSnapshots();const shards=[...scene.carrierShardManager.pool.activeItems].map(s=>({x:s.x,y:s.y,targetX:s.target?.x,targetY:s.target?.y,state:s.state}));const elite=scene.eliteManager.snapshot();for(const e of enemies){observedEnemyTypes.add(e.type);if(e.type==='lancer')observedLancerStates.add(e.state);}assert(enemies.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)),'Non-finite enemy coordinate');assert(shards.every(s=>[s.x,s.y,s.targetX,s.targetY].every(Number.isFinite)),'Non-finite shard coordinate');samples.push({wallClockElapsedMs:Math.round(elapsed),actions,segmentIndex:scene.run.currentSegmentIndex,fps:scene.game.loop.actualFps,...diagnostics(scene),collisionHandles:snap.collisionHandles,enemyCount:enemies.length,enemyTypes:enemies.map(e=>e.type),hostileActive:scene.enemyProjectileManager.getDiagnostics().active,shardsActive:scene.carrierShardManager.getDiagnostics().active,echoesActive:scene.echoPlaybackSystem.getDiagnostics().activeCount,suppressionActive:scene.suppressionService.snapshot().active,eliteActive:elite.active,pendingCopies:elite.elites.filter(e=>e.pendingCopyMs>0).length,resonantShields:elite.elites.filter(e=>e.shieldAmount>0).length,eliteTelemetry:elite.telemetry});nextSample+=2000;}
    if(elapsed>=nextProgress){globalThis.__PHASE6_SOAK_PROGRESS={elapsedMs:Math.round(elapsed),durationMs,segmentIndex:activeScene('RunScene')?.run?.currentSegmentIndex??null,actions:{...actionCounts}};nextProgress+=60000;}
    await sleep(20);
  }

  globalThis.__PHASE6_SOAK_PROGRESS={elapsedMs:Math.round(performance.now()-startedAt),durationMs,stage:'cleanup',segmentIndex:activeScene('RunScene')?.run?.currentSegmentIndex??null,transitionIndex,actions:{...actionCounts}};
  const finalRun=activeScene('RunScene');
  accumulateTelemetry(finalRun);
  const runtimeEnd={...diagnostics(finalRun),collisionHandles:globalThis.__ECHOFRAME_PHASE6__.getSnapshot().collisionHandles};
  finalRun.services.gameState.disposeRun();
  finalRun.services.sceneFlow.replace({sourceKeys:['RunScene','HUDScene'],targetKey:'MainMenuScene',token:'phase6-soak-return',fadeMs:0});
  await waitFor(()=>Boolean(activeScene('MainMenuScene')),'cleanup menu');
  const finalMenuScene=activeScene('MainMenuScene');
  const finalMenu={...diagnostics(finalMenuScene),hookPresent:Boolean(globalThis.__ECHOFRAME_PHASE6__),activeScenes:globalThis.__ECHOFRAME__.game.scene.getScenes(true).map(s=>s.scene.key)};
  return {requestedDurationMs:durationMs,actualWallClockDurationMs:Math.round(performance.now()-startedAt),bootstrap:{runId:run.runId,seed:run.seed,difficultyId:run.difficultyId,segments:run.runPlan.segments.map(s=>s.segmentId)},menuBaseline,runBaseline,runtimeEnd,finalMenu,actionCounts,cumulativeTelemetry,observedEnemyTypes:[...observedEnemyTypes].sort(),observedLancerStates:[...observedLancerStates].sort(),observedModifiers:[...observedModifiers].sort(),samples,memorySamples};
})()`;

let runnerDone = false;
const runnerPromise = evaluate(soakExpression).finally(() => { runnerDone = true; });
const resizeFractions = [0.25, 0.55, 0.85];
const resizePromise = (async () => {
  const started = Date.now();
  let resizeEvents = 0;
  for (let index = 0; index < resizeFractions.length; index += 1) {
    const due = started + durationMs * resizeFractions[index];
    while (!runnerDone && Date.now() < due) await sleep(Math.min(1000, due - Date.now()));
    if (runnerDone) break;
    const sizes = [[1280,720],[1920,1080],[1366,768]];
    const [width,height] = sizes[index];
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await sleep(500);
    await send('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1,mobile:false});
    resizeEvents += 1;
  }
  return resizeEvents;
})();
const progressPromise = (async () => {
  const started = Date.now();
  let nextMinute = 1;
  while (!runnerDone) {
    await sleep(5_000);
    const elapsedMinutes = Math.floor((Date.now() - started) / 60_000);
    if (!runnerDone && elapsedMinutes >= nextMinute) {
      console.log(`Phase 6 soak progress: ${nextMinute}/${Math.ceil(durationMs/60_000)} minutes`);
      nextMinute += 1;
    }
  }
})();

const [browserResult, resizeEvents] = await Promise.all([runnerPromise, resizePromise]);
await progressPromise;
const heapEnd = await send('Runtime.getHeapUsage').catch(() => null);
const samples = browserResult.samples;
const fpsValues = samples.map((sample) => sample.fps).filter(Number.isFinite);
const listeners = samples.map((sample) => sample.listeners);
const cleanup = samples.map((sample) => sample.cleanup);
const collisions = samples.map((sample) => sample.collisionHandles);
const usedMemory = browserResult.memorySamples.map((sample) => sample.usedSize);
const report = {
  generatedAt:new Date().toISOString(),
  browser:'Chromium headless via Chrome DevTools Protocol',
  ...browserResult,
  actionCounts:{...browserResult.actionCounts,resizeEvents},
  observations:{
    fps:{minimum:Number(Math.min(...fpsValues).toFixed(2)),maximum:Number(Math.max(...fpsValues).toFixed(2)),average:Number((fpsValues.reduce((sum,value)=>sum+value,0)/fpsValues.length).toFixed(2))},
    maximumActiveEnemies:Math.max(...samples.map(s=>s.enemyCount)),
    maximumHostileProjectiles:Math.max(...samples.map(s=>s.hostileActive)),
    maximumCarrierShards:Math.max(...samples.map(s=>s.shardsActive)),
    maximumEchoes:Math.max(...samples.map(s=>s.echoesActive)),
    maximumEliteHosts:Math.max(...samples.map(s=>s.eliteActive)),
    maximumPendingCopies:Math.max(...samples.map(s=>s.pendingCopies)),
    maximumResonantShields:Math.max(...samples.map(s=>s.resonantShields)),
    listenerRange:{minimum:Math.min(...listeners),maximum:Math.max(...listeners)},
    cleanupRange:{minimum:Math.min(...cleanup),maximum:Math.max(...cleanup)},
    collisionRange:{minimum:Math.min(...collisions),maximum:Math.max(...collisions)},
  },
  memory:{cdpStart:heapStart,cdpEnd:heapEnd,samples:browserResult.memorySamples,usedMinimum:usedMemory.length?Math.min(...usedMemory):null,usedMaximum:usedMemory.length?Math.max(...usedMemory):null,usedDelta:usedMemory.length?usedMemory.at(-1)-usedMemory[0]:null},
  leakChecks:{
    menuListenersStable:browserResult.finalMenu.listeners===browserResult.menuBaseline.listeners,
    menuCleanupStable:browserResult.finalMenu.cleanup===browserResult.menuBaseline.cleanup,
    menuInputContextsStable:browserResult.finalMenu.inputContexts===browserResult.menuBaseline.inputContexts,
    audioContextsStable:browserResult.finalMenu.audioContexts===browserResult.menuBaseline.audioContexts,
    runtimeHookCleared:!browserResult.finalMenu.hookPresent,
    runListenerRangeStable:Math.max(...listeners)===Math.min(...listeners),
    runCleanupRangeStable:Math.max(...cleanup)===Math.min(...cleanup),
    collisionRangeStable:Math.max(...collisions)===Math.min(...collisions),
  },
  browserErrors:{exceptions:exceptions.map(e=>({text:e.text,description:e.exception?.description??null,url:e.url,lineNumber:e.lineNumber,columnNumber:e.columnNumber})),consoleErrors:consoleErrors.map(e=>e.args?.map(a=>a.value??a.description??a.type).join(' ')??'console error')},
  warnings:warnings.map(e=>e.args?.map(a=>a.value??a.description??a.type).join(' ')??'warning'),
};
report.passed = report.actualWallClockDurationMs >= durationMs
  && ['drifter','sentry','lancer','shard-carrier','bulwark','suppressor'].every(type=>report.observedEnemyTypes.includes(type))
  && ['overclocked','replicating','resonant'].every(type=>report.observedModifiers.includes(type))
  && report.observations.maximumCarrierShards>0
  && report.observations.maximumEchoes>0
  && report.cumulativeTelemetry.overclockedAttacks>0
  && report.cumulativeTelemetry.replicationTriggers>0
  && report.cumulativeTelemetry.copiesSpawned>0
  && report.cumulativeTelemetry.resonantTriggers>0
  && report.cumulativeTelemetry.shieldAbsorbed>0
  && report.actionCounts.pauseEvents===3
  && report.actionCounts.resizeEvents===3
  && report.actionCounts.upgradeTransitions===5
  && Object.values(report.leakChecks).every(Boolean)
  && exceptions.length===0
  && consoleErrors.length===0;
await writeFile(reportPath, `${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify({reportPath,passed:report.passed,durationMs:report.actualWallClockDurationMs,sampleCount:report.samples.length,actionCounts:report.actionCounts,cumulativeTelemetry:report.cumulativeTelemetry,observations:report.observations,memory:{usedDelta:report.memory.usedDelta,usedMinimum:report.memory.usedMinimum,usedMaximum:report.memory.usedMaximum},leakChecks:report.leakChecks,exceptions:exceptions.length,consoleErrors:consoleErrors.length,warnings:warnings.length},null,2));
ws.close();
if(!report.passed)process.exitCode=1;
