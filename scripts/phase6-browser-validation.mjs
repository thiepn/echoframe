import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const screenshotDir = path.join(ROOT, 'docs', 'screenshots');
const reportPath = path.join(ROOT, 'docs', 'PHASE6_BROWSER_VALIDATION.json');
const cdpPort = Number(process.env.CDP_PORT || 9222);
const targetList = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = targetList.find((entry) => entry.type === 'page');
if (!target) throw new Error('No Chromium page target is available.');

const ws = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const exceptions = [];
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
function send(method, params = {}) { const id = nextId++; ws.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => pending.set(id, { resolve, reject })); }
async function evaluate(expression) { let response; try { response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }); } catch (error) { throw new Error(`${error.message} while evaluating: ${String(expression).slice(0,240)}`); } if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || 'Evaluation failed.'); return response.result?.value; }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(expression, label, timeoutMs = 15000) { const start = Date.now(); while (Date.now() - start < timeoutMs) { try { const value = await evaluate(expression); if (value) return value; } catch {} await sleep(40); } throw new Error(`Timed out waiting for ${label}.`); }
function assert(condition, message) { if (!condition) throw new Error(message); }
async function screenshot(filename) { const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true }); await writeFile(path.join(screenshotDir, filename), Buffer.from(result.data, 'base64')); }
async function click(x, y) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); }

async function clickGame(x, y) {
  const rect = await evaluate(`(() => { const r=__ECHOFRAME__.game.canvas.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })()`);
  await click(rect.x + x * rect.width / 1600, rect.y + y * rect.height / 900);
}
async function key(code, keyValue = code) { const vk = keyValue === 'Enter' ? 13 : undefined; await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyValue, windowsVirtualKeyCode: vk }); await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyValue, windowsVirtualKeyCode: vk }); }

await mkdir(screenshotDir, { recursive: true });
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Page.reload', { ignoreCache: true });
await waitFor('Boolean(globalThis.__ECHOFRAME__)', 'game boot');
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'MainMenuScene')", 'main menu');

const bootstrap = await evaluate(`(() => {
  const menu = __ECHOFRAME__.game.scene.getScene('MainMenuScene');
  menu.services.debugManager.setEnabled(true);
  menu.services.settingsManager.set('gameplay.lastDifficulty', 'standard');
  const run = menu.services.gameState.createRun({ difficultyId: 'standard' });
  menu.services.sceneFlow.replace({ sourceKeys:['MainMenuScene'], targetKey:'RunScene', payload:{runId:run.runId}, launch:[{key:'HUDScene',payload:{runId:run.runId}}], token:'phase6-browser-'+run.runId });
  return { runId: run.runId, seed: run.seed, difficultyId: run.difficultyId, plan: run.runPlan };
})()`);
await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE6__)', 'Phase 6 hooks');
await sleep(1300);
await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); scene.encounterDirector.update=()=>{}; scene.encounterDirector.completed=false; scene.encounterDirector.directorState='PHASE6_BROWSER_HOLD'; scene.enemyManager.clear('browser-isolate'); scene.carrierShardManager.clear('browser-isolate'); scene.enemyProjectileManager.clear('browser-isolate'); scene.hitInvulnerability.start(600000); scene.services.debugManager.setEnabled(true); return true; })()`);

const runPlanCheck = await evaluate(`(() => { const run=__ECHOFRAME__.game.scene.getScene('RunScene').run; return { segments:run.runPlan.segments.map(s=>s.segmentId), upgrades:run.runPlan.upgradeOfferCount, elites:run.runPlan.segments.filter(s=>s.requiresElite).map(s=>s.elitePlan), serializable:Boolean(JSON.stringify(run.runPlan)) }; })()`);
assert(runPlanCheck.segments.join(',') === 'combat-1,combat-2,elite-1,combat-3,combat-4,elite-2', 'Run plan did not contain the six canonical segments.');
assert(runPlanCheck.upgrades === 5 && runPlanCheck.elites.length === 2 && runPlanCheck.serializable, 'Run plan metadata was invalid.');

async function ensureEcho() {
  return evaluate(`(() => { const h=__ECHOFRAME_PHASE6__; h.forceRecordingReady(); h.forceCooldownReady(); const existing=__ECHOFRAME__.game.scene.getScene('RunScene').echoPlaybackSystem.getDiagnostics().activeCount; if (!existing) h.deployEcho(); return __ECHOFRAME__.game.scene.getScene('RunScene').echoPlaybackSystem.getDiagnostics().activeCount; })()`);
}

await ensureEcho();
const roster = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); scene.enemyManager.clear('overclocked-shot'); const positions={drifter:[230,180],lancer:[250,690],'shard-carrier':[1350,690],bulwark:[320,450],suppressor:[1290,450]}; for(const [type,[x,y]] of Object.entries(positions)) scene.enemyManager.spawn(type,{x,y}); const elite=__ECHOFRAME_PHASE6__.spawnElite('sentry','overclocked'); scene.player.setPosition(800,700); scene.player.bodySprite?.setPosition?.(800,700); return { eliteId:elite.enemyId, counts:scene.enemyManager.countsByType() }; })()`);
assert(Object.values(roster.counts).reduce((sum, value) => sum + value, 0) === 6, 'Full roster plus Overclocked host did not spawn.');
const overclockedStates = new Set();
for (let index = 0; index < 110; index += 1) {
  const observation = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); const enemy=scene.enemyManager.activeEnemies.find(e=>e.enemyId==='${roster.eliteId}'); const c=scene.eliteManager.controllerForEnemyId('${roster.eliteId}'); return enemy?{state:enemy.state.value,x:enemy.x,y:enemy.y,attacks:c?.modifier?.attackCount??0,telemetry:scene.eliteTelemetry.overclockedAttacks}:null; })()`);
  if (observation?.state) overclockedStates.add(observation.state);
  if ((observation?.attacks ?? 0) >= 2) break;
  await sleep(100);
}
const overclocked = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); const c=scene.eliteManager.controllerForEnemyId('${roster.eliteId}'); return { snapshot:c?.snapshot(), telemetry:scene.eliteTelemetry.snapshot(), finite:scene.enemyManager.getActiveSnapshots().every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)) }; })()`);
assert(overclocked.snapshot?.modifierId === 'overclocked', 'Overclocked controller was missing.');
assert(overclocked.telemetry.overclockedAttacks >= 2, `Overclocked host completed fewer than two attacks (${overclocked.telemetry.overclockedAttacks}).`);
assert(overclocked.finite, 'Overclocked runtime produced non-finite coordinates.');
await screenshot('ECHOFRAME_phase6_overclocked_elite.png');

const damageAgainstOverclocked = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); const enemy=scene.enemyManager.activeEnemies.find(e=>e.enemyId==='${roster.eliteId}'); const hit=(sourceFaction,id)=>{ const packet={damageId:id,sourceFaction,sourceType:sourceFaction==='PLAYER'?'player-projectile':'echo-projectile',sourceId:id,targetId:enemy.enemyId,finalAmount:1,baseAmount:1,critical:false,direction:{x:1,y:0},timestampMs:scene.run.elapsedSimulationMs}; const result=scene.damageService.resolve(packet,enemy,{}); scene.eliteManager.onDamageResolved(enemy,result,packet); return result; }; return {player:hit('PLAYER','browser-over-player'),echo:hit('ECHO','browser-over-echo')}; })()`);
assert(damageAgainstOverclocked.player.accepted && damageAgainstOverclocked.echo.accepted, 'Player/Echo damage did not both affect Overclocked elite.');

const replicating = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); scene.enemyManager.clear('replicating-shot'); const elite=__ECHOFRAME_PHASE6__.spawnElite('drifter','replicating'); const packet={damageId:'browser-repl-player',sourceFaction:'PLAYER',sourceType:'player-projectile',sourceId:'player',targetId:elite.enemyId,finalAmount:elite.health.currentHealth*0.55,baseAmount:elite.health.currentHealth*0.55,critical:false,direction:{x:1,y:0},timestampMs:scene.run.elapsedSimulationMs}; const result=scene.damageService.resolve(packet,elite,{}); scene.eliteManager.onDamageResolved(elite,result,packet); return {enemyId:elite.enemyId,result,controller:scene.eliteManager.controllerForEnemyId(elite.enemyId).snapshot()}; })()`);
assert(replicating.result.accepted && replicating.controller.replicationTriggered && replicating.controller.pendingCopyMs > 0, 'Replicating threshold did not enter split warning.');
await sleep(940);
const copyState = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); const enemies=scene.enemyManager.getActiveSnapshots(); const copy=enemies.find(e=>e.isEliteCopy); return { copy, enemies, elite:scene.eliteManager.snapshot(), finite:enemies.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)) }; })()`);
assert(copyState.copy?.copyOfEliteInstanceId, 'Replicating copy did not assemble.');
assert(copyState.copy.elite === null && copyState.copy.isElite === false, 'Replicating copy incorrectly received an elite modifier.');
assert(copyState.finite, 'Replicating placement produced non-finite coordinates.');
await ensureEcho();
await screenshot('ECHOFRAME_phase6_replicating_elite.png');
const copyDefeat = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); const copy=scene.enemyManager.activeEnemies.find(e=>e.isEliteCopy); scene.enemyManager.beginDeath(copy,'echo'); return {copiesDefeated:scene.eliteTelemetry.copiesDefeated}; })()`);
assert(copyDefeat.copiesDefeated >= 1, 'Replicating copy defeat was not tracked.');

const resonant = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); scene.enemyManager.clear('resonant-shot'); const elite=__ECHOFRAME_PHASE6__.spawnElite('bulwark','resonant'); elite.setPosition(800,350); elite.bodySprite?.setPosition?.(800,350); const ally=scene.enemyManager.spawn('drifter',{x:850,y:350}); scene.enemyManager.beginDeath(ally,'player'); const controller=scene.eliteManager.controllerForEnemyId(elite.enemyId); return {enemyId:elite.enemyId,shield:controller.modifier.shieldAmount,maximumHealth:elite.health.maximumHealth}; })()`);
assert(resonant.shield > 0 && resonant.shield <= resonant.maximumHealth, 'Resonant shield did not activate as a finite amount.');
const shieldDamage = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); const enemy=scene.enemyManager.activeEnemies.find(e=>e.enemyId==='${resonant.enemyId}'); const hit=(sourceFaction,id,amount)=>{ const packet={damageId:id,sourceFaction,sourceType:sourceFaction==='PLAYER'?'player-projectile':'echo-projectile',sourceId:id,targetId:enemy.enemyId,finalAmount:amount,baseAmount:amount,critical:false,direction:{x:1,y:0},timestampMs:scene.run.elapsedSimulationMs}; const result=scene.damageService.resolve(packet,enemy,{absorbDamage:(value)=>scene.eliteManager.absorbDamage(enemy,value)}); scene.eliteManager.onDamageResolved(enemy,result,packet); return result; }; return {player:hit('PLAYER','browser-res-player',8),echo:hit('ECHO','browser-res-echo',8),state:scene.eliteManager.controllerForEnemyId(enemy.enemyId).snapshot()}; })()`);
assert(shieldDamage.player.accepted && shieldDamage.echo.accepted, 'Player/Echo damage did not both resolve against Resonant elite.');
assert(shieldDamage.player.shieldAbsorbed > 0 || shieldDamage.echo.shieldAbsorbed > 0, 'Resonant shield did not absorb damage through DamageService.');
await ensureEcho();
await screenshot('ECHOFRAME_phase6_resonant_elite.png');

const bulwarkDirection = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); const enemy=scene.enemyManager.activeEnemies.find(e=>e.enemyId==='${resonant.enemyId}'); enemy.activateFromSpawn?.(); enemy.shieldAngle=0; const packet=(direction,id)=>Object.freeze({finalAmount:20,direction,timestampMs:scene.run.elapsedSimulationMs,damageId:id}); const front=enemy.modifyIncomingDamage(packet({x:-1,y:0},'front')); const rear=enemy.modifyIncomingDamage(packet({x:1,y:0},'rear')); return {front:front.packet.finalAmount,rear:rear.packet.finalAmount}; })()`);
assert(bulwarkDirection.front > 0 && bulwarkDirection.front < bulwarkDirection.rear, 'Bulwark directional mitigation failed under Resonant composition.');

const pause = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); const controller=scene.eliteManager.controllerForEnemyId('${resonant.enemyId}'); scene.scene.pause(); return {shieldMs:controller.modifier.shieldRemainingMs,simulation:scene.run.elapsedSimulationMs}; })()`);
await sleep(450);
const pauseDuring = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); const controller=scene.eliteManager.controllerForEnemyId('${resonant.enemyId}'); return {shieldMs:controller.modifier.shieldRemainingMs,simulation:scene.run.elapsedSimulationMs}; })()`);
assert(Math.abs(pause.shieldMs - pauseDuring.shieldMs) < 1 && Math.abs(pause.simulation - pauseDuring.simulation) < 1, 'Elite timers advanced while RunScene was paused.');
await evaluate(`(() => { __ECHOFRAME__.game.scene.resume('RunScene'); return true; })()`);
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await sleep(250);
const resized = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); return {width:scene.game.canvas.width,height:scene.game.canvas.height}; })()`);
assert(resized.width > 0 && resized.height > 0, 'Canvas became invalid after resize.');
await send('Emulation.clearDeviceMetricsOverride');

await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('RunScene'); scene.services.debugManager.setEnabled(true); return true; })()`);
await screenshot('ECHOFRAME_phase6_run_debug.png');

const route = [];
for (let offerIndex = 0; offerIndex < 5; offerIndex += 1) {
  await evaluate(`__ECHOFRAME_PHASE6__.completeCurrentChamber()`);
  await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene)=>scene.scene.key==='UpgradeScene')", `Upgrade ${offerIndex + 1}`);
  route.push(`upgrade-${offerIndex + 1}`);
  if (offerIndex === 0) await clickGame(320, 590);
  else if (offerIndex === 1) await key('Enter', 'Enter');
  else await evaluate(`(() => { __ECHOFRAME__.game.scene.getScene('UpgradeScene').buttons[0].activate(); return true; })()`);
  await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE6__)', `Run segment ${offerIndex + 2}`);
  await sleep(400);
}
await evaluate(`__ECHOFRAME_PHASE6__.completeCurrentChamber()`);
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene)=>scene.scene.key==='ResultsScene')", 'pre-boss results');
const results = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('ResultsScene'); return { result:scene.sceneData.result, preBossComplete:scene.sceneData.preBossComplete, segmentCount:scene.sceneData.runPlan?.segments?.length, upgrades:scene.sceneData.selectedUpgradeHistory?.length, texts:scene.children.list.filter(x=>typeof x.text==='string').map(x=>x.text) }; })()`);
assert(results.result === 'victory' && results.preBossComplete === true, 'Complete route did not end in a pre-boss victory.');
assert(results.segmentCount === 6 && results.upgrades === 5, 'Results did not include all segments and upgrades.');
assert(results.texts.some((text) => text.includes('PRE-BOSS RUN COMPLETE')), 'Results did not clearly label the pre-boss completion.');

await evaluate(`(() => { __ECHOFRAME__.game.scene.getScene('ResultsScene').buttons[0].activate(); return true; })()`);
await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE6__)', 'restart from results');
await evaluate(`__ECHOFRAME_PHASE6__.jumpToSegment(2)`);
await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE6__)', 'Elite 1 death segment');
await sleep(300);
const deathResult = await evaluate(`(() => { const h=__ECHOFRAME_PHASE6__; h.setPlayerHealth(5); h.damagePlayer(99); return true; })()`);
assert(deathResult, 'Death setup failed.');
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene)=>scene.scene.key==='ResultsScene')", 'elite death results');
const deathScene = await evaluate(`__ECHOFRAME__.game.scene.getScene('ResultsScene').sceneData.result`);
assert(deathScene === 'death', 'Death in an elite segment did not reach death results.');
await evaluate(`(() => { __ECHOFRAME__.game.scene.getScene('ResultsScene').buttons[1].activate(); return true; })()`);
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene)=>scene.scene.key==='MainMenuScene')", 'return to menu');

const report = {
  generatedAt: new Date().toISOString(),
  bootstrap,
  runPlan: runPlanCheck,
  checks: {
    sixSegmentRoute: true, fiveUpgrades: true, mouseUpgradeSelection: true, keyboardUpgradeSelection: true,
    allSixEnemies: true, overclockedMultipleAttacks: true, replicatingWarningAndCopy: true, copyDefeat: true,
    resonantTriggerAndAbsorption: true, playerAndEchoDamageAgainstModifiers: true, bulwarkEliteInteraction: true,
    pauseSafe: true, resize: resized, eliteDeath: true, restart: true, returnToMenu: true,
  },
  overclocked: { states: [...overclockedStates], telemetry: overclocked.telemetry },
  replicating: copyState,
  resonant: { activation: resonant, damage: shieldDamage },
  results,
  route,
  exceptions: exceptions.length,
  consoleErrors: consoleErrors.length,
  warnings: warnings.length,
  passed: exceptions.length === 0 && consoleErrors.length === 0,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, passed: report.passed, exceptions: report.exceptions, consoleErrors: report.consoleErrors, warnings: report.warnings, results, route }, null, 2));
ws.close();
if (!report.passed) process.exitCode = 1;
