import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const reportPath = path.join(ROOT, 'docs', 'PHASE5_SOAK_VALIDATION.json');
const durationMs = Number(process.env.SOAK_DURATION_MS || 900000);
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
    const item = pending.get(message.id); pending.delete(message.id);
    if (message.error) item.reject(new Error(JSON.stringify(message.error))); else item.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (message.method === 'Runtime.consoleAPICalled') {
    if (message.params.type === 'error') consoleErrors.push(message.params);
    if (message.params.type === 'warning') warnings.push(message.params);
  }
};
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
function send(method, params = {}) { const requestId = id++; ws.send(JSON.stringify({ id: requestId, method, params })); return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject })); }
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || 'Evaluation failed.');
  return response.result?.value;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(expression, label, timeoutMs = 15000) { const start = Date.now(); while (Date.now() - start < timeoutMs) { try { if (await evaluate(expression)) return; } catch {} await sleep(50); } throw new Error(`Timed out waiting for ${label}.`); }
function assert(value, message) { if (!value) throw new Error(message); }

await send('Page.enable'); await send('Runtime.enable');
await send('Page.reload', { ignoreCache: true });
await sleep(500);
await waitFor('Boolean(globalThis.__ECHOFRAME__)', 'game boot');
await waitFor("Boolean(globalThis.__ECHOFRAME__?.game.scene.getScenes(true).some((scene) => scene.scene.key === 'MainMenuScene'))", 'main menu');
const bootstrap = await evaluate(`(() => {
  const menu = __ECHOFRAME__.game.scene.getScene('MainMenuScene');
  menu.services.debugManager.setEnabled(true);
  const run = menu.services.gameState.createRun({ difficultyId: 'overclocked' });
  menu.services.sceneFlow.replace({
    sourceKeys: ['MainMenuScene'], targetKey: 'RunScene', payload: { runId: run.runId },
    launch: [{ key: 'HUDScene', payload: { runId: run.runId } }], token: 'phase5-soak-' + run.runId,
  });
  return { runId: run.runId, seed: run.seed, difficultyId: run.difficultyId };
})()`);
await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE5__)', 'run debug hooks');
await evaluate(`(() => {
  const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
  scene.encounterDirector.update = () => {};
  scene.encounterDirector.completed = false;
  scene.encounterDirector.directorState = 'SOAK_HOLD';
  scene.enemyManager.clear('soak-reset');
  scene.carrierShardManager.clear('soak-reset');
  scene.enemyProjectileManager.clear('soak-reset');
  scene.services.debugManager.setEnabled(false);
  scene.hitInvulnerability.start(${durationMs + 120000});
  const positions = { drifter:[240,180], sentry:[1360,180], lancer:[250,700], 'shard-carrier':[1350,700], bulwark:[300,450], suppressor:[1300,450] };
  for (const [type,[x,y]] of Object.entries(positions)) scene.enemyManager.spawn(type,{x,y});
  return true;
})()`);
await sleep(1200);

const baseline = await evaluate(`(() => {
  const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
  return {
    listenerCount: scene.services.eventBus.listenerCount(),
    cleanupCount: scene.services.debugManager.getCleanupCount(),
    inputContexts: scene.services.inputManager.contexts.size,
    collisionHandles: __ECHOFRAME_PHASE5__.getSnapshot().collisionHandles,
    enemyPools: scene.enemyManager.getDiagnostics().pools,
    projectilePool: scene.enemyProjectileManager.getDiagnostics(),
    shardPool: scene.carrierShardManager.getDiagnostics(),
  };
})()`);

const startedAt = Date.now();
const samples = [];
const observedLancerStates = new Set();
const observedShardStates = new Set();
let echoDeploymentsRequested = 0;
let carrierReleases = 0;
let suppressionActivations = 0;
let bulwarkChecks = 0;
let pauseEvents = 0;
let resizeEvents = 0;
let projectileStressEvents = 0;
let nextProgress = 60000;
let nextEchoAt = 0;
let nextCarrierAt = 15000;
let nextSuppressionAt = 0;
let nextBulwarkAt = 18000;
let nextProjectileStressAt = 30000;
const pauseSchedule = [180000, 420000, 660000].filter((value) => value < durationMs);
const resizeSchedule = [300000, 600000].filter((value) => value < durationMs);
let pauseScheduleIndex = 0;
let resizeScheduleIndex = 0;

while (Date.now() - startedAt < durationMs) {
  const elapsed = Date.now() - startedAt;
  const second = Math.floor(elapsed / 1000);
  const actionsThisSample = [];

  if (elapsed >= nextEchoAt) {
    await evaluate(`(() => { __ECHOFRAME_PHASE5__.forceRecordingReady(); __ECHOFRAME_PHASE5__.forceCooldownReady(); return Boolean(__ECHOFRAME_PHASE5__.deployEcho()); })()`);
    echoDeploymentsRequested += 1;
    actionsThisSample.push('echo');
    nextEchoAt += 12000;
  }
  if (elapsed >= nextCarrierAt) {
    const released = await evaluate(`(() => {
      const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
      let carrier = scene.enemyManager.activeEnemies.find((enemy) => enemy.type === 'shard-carrier' && !enemy.state.is('DYING'));
      if (!carrier) carrier = scene.enemyManager.spawn('shard-carrier', {x:1350,y:700});
      const accepted = scene.enemyManager.beginDeath(carrier, 'player');
      scene.enemyManager.spawn('shard-carrier', {x:1350,y:700});
      return { accepted, activeShards: scene.carrierShardManager.getDiagnostics().active };
    })()`);
    if (released.accepted) carrierReleases += 1;
    actionsThisSample.push('carrier');
    nextCarrierAt += 15000;
  }
  if (elapsed >= nextSuppressionAt) {
    const suppression = await evaluate(`(() => {
      const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
      let enemy = scene.enemyManager.activeEnemies.find((item) => item.type === 'suppressor' && !item.state.is('DYING'));
      if (enemy) scene.enemyManager.deactivate(enemy, 'soak-suppression-reset');
      enemy = scene.enemyManager.spawn('suppressor',{x:Math.min(1430,scene.player.x+120),y:scene.player.y});
      enemy.activateFromSpawn?.();
      enemy.setPosition(Math.min(1430, scene.player.x + 120), scene.player.y);
      enemy.beginAnticipation?.(); enemy.beginField?.();
      scene.suppressionService.update(scene.enemyManager.activeSuppressors, scene.player);
      return scene.suppressionService.snapshot();
    })()`);
    assert(suppression.active && suppression.scalar < 1, 'Suppression activation failed during soak.');
    suppressionActivations += 1;
    actionsThisSample.push('suppress');
    nextSuppressionAt += 20000;
  }
  if (elapsed >= nextBulwarkAt) {
    const result = await evaluate(`(() => {
      const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
      let enemy = scene.enemyManager.activeEnemies.find((item) => item.type === 'bulwark' && !item.state.is('DYING'));
      if (!enemy) enemy = scene.enemyManager.spawn('bulwark',{x:300,y:450});
      enemy.activateFromSpawn?.(); enemy.shieldAngle = 0;
      const packet = (direction,id) => Object.freeze({finalAmount:20,direction,timestampMs:scene.run.elapsedSimulationMs,damageId:id});
      const front = enemy.modifyIncomingDamage(packet({x:-1,y:0},'soak-front-${second}'));
      const rear = enemy.modifyIncomingDamage(packet({x:1,y:0},'soak-rear-${second}'));
      return {front:front.packet.finalAmount,rear:rear.packet.finalAmount};
    })()`);
    assert(result.front > 0 && result.front < result.rear, 'Bulwark mitigation failed during soak.');
    bulwarkChecks += 1;
    actionsThisSample.push('bulwark');
    nextBulwarkAt += 18000;
  }
  if (elapsed >= nextProjectileStressAt) {
    await evaluate('__ECHOFRAME_PHASE5__.stressHostileProjectiles()');
    projectileStressEvents += 1;
    actionsThisSample.push('projectiles');
    nextProjectileStressAt += 30000;
  }
  if (pauseScheduleIndex < pauseSchedule.length && elapsed >= pauseSchedule[pauseScheduleIndex]) {
    const before = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); scene.scene.pause(); return scene.run.elapsedSimulationMs; })()`);
    await sleep(1000);
    const during = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); return scene.run.elapsedSimulationMs; })()`);
    assert(Math.abs(during - before) < 1, 'Simulation advanced during soak pause.');
    await evaluate(`(() => { __ECHOFRAME__.game.scene.getScene('RunScene').scene.resume(); return true; })()`);
    pauseEvents += 1;
    actionsThisSample.push('pause');
    pauseScheduleIndex += 1;
  }
  if (resizeScheduleIndex < resizeSchedule.length && elapsed >= resizeSchedule[resizeScheduleIndex]) {
    const resizeWidth = resizeScheduleIndex === 0 ? 1280 : 1920;
    const resizeHeight = resizeScheduleIndex === 0 ? 720 : 1080;
    await send('Emulation.setDeviceMetricsOverride', { width: resizeWidth, height: resizeHeight, deviceScaleFactor: 1, mobile: false });
    await sleep(500);
    await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
    resizeEvents += 1;
    actionsThisSample.push('resize');
    resizeScheduleIndex += 1;
  }

  const sample = await evaluate(`(() => {
    const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
    const snap = __ECHOFRAME_PHASE5__.getSnapshot();
    const enemyDiagnostics = scene.enemyManager.getDiagnostics();
    const positions = scene.enemyManager.activeEnemies.map((enemy) => ({type:enemy.type,state:enemy.state.value,x:enemy.x,y:enemy.y}));
    const shards = [...scene.carrierShardManager.pool.activeItems].map((shard) => ({state:shard.state,x:shard.x,y:shard.y,targetX:shard.target?.x,targetY:shard.target?.y}));
    return {
      elapsedSimulationMs: scene.run.elapsedSimulationMs,
      fps: scene.game.loop.actualFps,
      listenerCount: scene.services.eventBus.listenerCount(),
      cleanupCount: scene.services.debugManager.getCleanupCount(),
      inputContexts: scene.services.inputManager.contexts.size,
      collisionHandles: snap.collisionHandles,
      playerHealth: scene.playerHealth.currentHealth,
      enemyCounts: enemyDiagnostics.countsByType,
      enemyPoolCapacities: Object.fromEntries(Object.entries(enemyDiagnostics.pools).map(([type,pool])=>[type,pool.capacity])),
      hostile: scene.enemyProjectileManager.getDiagnostics(),
      shards: scene.carrierShardManager.getDiagnostics(),
      suppression: scene.suppressionService.snapshot(),
      echo: scene.echoPlaybackSystem.getDiagnostics(),
      positions,
      shardPositions: shards,
    };
  })()`);
  for (const enemy of sample.positions) if (enemy.type === 'lancer') observedLancerStates.add(enemy.state);
  for (const shard of sample.shardPositions) observedShardStates.add(shard.state);
  const finiteEnemies = sample.positions.every((item) => Number.isFinite(item.x) && Number.isFinite(item.y));
  const finiteShards = sample.shardPositions.every((item) => [item.x,item.y,item.targetX,item.targetY].every(Number.isFinite));
  assert(finiteEnemies, 'Non-finite enemy position during soak.');
  assert(finiteShards, 'Non-finite Carrier shard position during soak.');
  assert(sample.playerHealth > 0, 'Player died during protected soak.');
  samples.push({
    wallClockElapsedMs: elapsed,
    actionSecond: second,
    action: actionsThisSample.length ? actionsThisSample.join('+') : null,
    ...sample,
  });
  if (elapsed >= nextProgress) { console.log(`Soak progress: ${Math.round(elapsed / 60000)}/${Math.round(durationMs / 60000)} minutes`); nextProgress += 60000; }
  await sleep(2000);
}

await evaluate(`(() => {
  const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
  scene.services.debugManager.setEnabled(true);
  scene.services.gameState.disposeRun();
  scene.services.sceneFlow.replace({sourceKeys:['RunScene','HUDScene'],targetKey:'MainMenuScene',token:'soak-return-menu'});
  return true;
})()`);
await waitFor("Boolean(__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'MainMenuScene'))", 'soak cleanup menu');
const final = await evaluate(`(() => {
  const scene=__ECHOFRAME__.game.scene.getScene('MainMenuScene');
  return {listenerCount:scene.services.eventBus.listenerCount(),cleanupCount:scene.services.debugManager.getCleanupCount(),inputContexts:scene.services.inputManager.contexts.size,audioContexts:scene.services.audioManager.getDiagnostics().contextCount,hookPresent:Boolean(globalThis.__ECHOFRAME_PHASE5__),activeScenes:__ECHOFRAME__.game.scene.getScenes(true).map((item)=>item.scene.key)};
})()`);

const listenerValues = samples.map((sample) => sample.listenerCount);
const cleanupValues = samples.map((sample) => sample.cleanupCount);
const collisionValues = samples.map((sample) => sample.collisionHandles);
const fpsValues = samples.map((sample) => sample.fps).filter(Number.isFinite);
const report = {
  generatedAt: new Date().toISOString(),
  browser: 'Chromium headless via Chrome DevTools Protocol',
  requestedDurationMs: durationMs,
  actualWallClockDurationMs: Date.now() - startedAt,
  bootstrap,
  sampleCount: samples.length,
  actions: { echoDeploymentsRequested, carrierReleases, suppressionActivations, bulwarkChecks, pauseEvents, resizeEvents, projectileStressEvents },
  observations: {
    lancerStates: [...observedLancerStates],
    shardStates: [...observedShardStates],
    listenerRange: {min:Math.min(...listenerValues),max:Math.max(...listenerValues)},
    cleanupRange: {min:Math.min(...cleanupValues),max:Math.max(...cleanupValues)},
    collisionRange: {min:Math.min(...collisionValues),max:Math.max(...collisionValues)},
    fps: {min:Number(Math.min(...fpsValues).toFixed(2)),max:Number(Math.max(...fpsValues).toFixed(2)),average:Number((fpsValues.reduce((a,b)=>a+b,0)/fpsValues.length).toFixed(2))},
    maximumHostileProjectiles: Math.max(...samples.map((sample)=>sample.hostile.active)),
    maximumCarrierShards: Math.max(...samples.map((sample)=>sample.shards.active)),
    maximumEchoes: Math.max(...samples.map((sample)=>sample.echo.activeCount)),
    suppressionObserved: samples.some((sample)=>sample.suppression.active),
    allEnemyTypesObserved: ['drifter','sentry','lancer','shard-carrier','bulwark','suppressor'].every((type)=>samples.some((sample)=>(sample.enemyCounts[type]??0)>0)),
  },
  baseline,
  final,
  leakChecks: {
    listenersStable: listenerValues.every((value)=>value===baseline.listenerCount),
    cleanupStable: cleanupValues.every((value)=>value===baseline.cleanupCount),
    inputContextsStable: samples.every((sample)=>sample.inputContexts===baseline.inputContexts),
    collisionHandlesStable: collisionValues.every((value)=>value===baseline.collisionHandles),
    runtimeHookCleared: final.hookPresent===false,
    browserExceptions: exceptions.length,
    consoleErrors: consoleErrors.length,
  },
  browserErrors: {
    exceptions: exceptions.map((entry) => ({
      text: entry.text,
      exception: entry.exception?.description ?? entry.exception?.value ?? null,
      url: entry.url,
      lineNumber: entry.lineNumber,
      columnNumber: entry.columnNumber,
      stackTrace: entry.stackTrace ?? null,
    })),
    consoleErrors: consoleErrors.map((entry) => ({
      text: entry.args?.map((arg) => arg.value ?? arg.description ?? arg.type).join(' ') ?? 'console error',
      stackTrace: entry.stackTrace ?? null,
    })),
  },
  warnings: warnings.map((entry)=>entry.args?.map((arg)=>arg.value||arg.description).join(' ')||'warning'),
  samples,
};
await writeFile(reportPath, `${JSON.stringify(report,null,2)}
`);
assert(report.actualWallClockDurationMs >= durationMs, 'Soak ended before requested duration.');
assert(report.observations.allEnemyTypesObserved, 'Not all enemy types were observed during soak.');
assert(report.observations.suppressionObserved, 'Suppression was not observed during soak.');
assert(report.observations.maximumCarrierShards > 0, 'Carrier shards were not observed during soak.');
assert(report.observations.maximumEchoes > 0, 'Friendly Echo was not observed during soak.');
assert(pauseEvents === pauseSchedule.length, `Expected ${pauseSchedule.length} pause events, observed ${pauseEvents}.`);
assert(resizeEvents === resizeSchedule.length, `Expected ${resizeSchedule.length} resize events, observed ${resizeEvents}.`);
assert(echoDeploymentsRequested >= Math.max(1, Math.floor(durationMs / 12000) - 1), `Expected repeated Echo deployments, observed ${echoDeploymentsRequested}.`);
assert(carrierReleases >= Math.max(1, Math.floor(durationMs / 15000) - 1), `Expected repeated Carrier releases, observed ${carrierReleases}.`);
assert(suppressionActivations >= Math.max(1, Math.floor(durationMs / 20000) - 1), `Expected repeated suppression activations, observed ${suppressionActivations}.`);
assert(bulwarkChecks >= Math.max(1, Math.floor(durationMs / 18000) - 1), `Expected repeated Bulwark checks, observed ${bulwarkChecks}.`);
assert(projectileStressEvents >= Math.max(1, Math.floor(durationMs / 30000) - 1), `Expected repeated projectile stress events, observed ${projectileStressEvents}.`);
assert(report.leakChecks.listenersStable && report.leakChecks.cleanupStable && report.leakChecks.inputContextsStable && report.leakChecks.collisionHandlesStable && report.leakChecks.runtimeHookCleared, 'Soak leak invariant failed.');
assert(exceptions.length===0 && consoleErrors.length===0, 'Browser errors occurred during soak.');
console.log(JSON.stringify({reportPath,durationMs:report.actualWallClockDurationMs,sampleCount:report.sampleCount,actions:report.actions,observations:report.observations,leakChecks:report.leakChecks},null,2));
ws.close();
setTimeout(()=>process.exit(0),50);
