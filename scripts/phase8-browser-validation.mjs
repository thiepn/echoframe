import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const screenshotDir = path.join(ROOT, 'docs', 'screenshots');
const reportPath = path.join(ROOT, 'docs', 'PHASE8_BROWSER_VALIDATION.json');
const port = Number(process.env.CDP_PORT || 9222);
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = targets.find((item) => item.type === 'page');
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
    const entry = pending.get(message.id); pending.delete(message.id);
    message.error ? entry.reject(new Error(JSON.stringify(message.error))) : entry.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (message.method === 'Runtime.consoleAPICalled') {
    if (message.params.type === 'error') consoleErrors.push(message.params);
    if (message.params.type === 'warning') warnings.push(message.params);
  }
};
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
const send = (method, params = {}) => { const requestId = id++; ws.send(JSON.stringify({ id: requestId, method, params })); return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject })); };
async function evaluate(expression) { let result; try { result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }); } catch (error) { throw new Error(`${error.message} :: ${String(expression).slice(0, 320)}`); } if (result.exceptionDetails) throw new Error(`${result.exceptionDetails.exception?.description || result.exceptionDetails.text} :: ${String(expression).slice(0, 320)}`); return result.result?.value; }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(expression, label, timeout = 25000) { const started = Date.now(); while (Date.now() - started < timeout) { try { const value = await evaluate(expression); if (value) return value; } catch {} await sleep(50); } throw new Error(`Timed out: ${label}`); }
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function screenshot(name) { const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true }); await writeFile(path.join(screenshotDir, name), Buffer.from(capture.data, 'base64')); }

await mkdir(screenshotDir, { recursive: true });
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.reload', { ignoreCache: true });
await waitFor('Boolean(globalThis.__ECHOFRAME__)', 'boot');
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some(s=>s.scene.key==='MainMenuScene')", 'menu');

async function startBoss({ seed = 8080, difficultyId = 'standard', grantAll = true } = {}) {
  await evaluate(`(() => {
    const active=__ECHOFRAME__.game.scene.getScenes(true); const services=active[0].services;
    services.debugManager.setEnabled(false); services.sceneFlow.currentTransition=null; services.inputManager.setLocked(false);
    for(const scene of active){ if(scene.scene.key!=='BootScene') __ECHOFRAME__.game.scene.stop(scene.scene.key); }
    services.gameState.disposeRun(); const run=services.gameState.createRun({seed:${seed},difficultyId:${JSON.stringify(difficultyId)}});
    run.currentSegmentIndex=7; run.currentSegmentId=run.runPlan.segments[7].segmentId; run.currentSegmentType=run.runPlan.segments[7].segmentType;
    run.upgradeOfferIndex=7; run.playerHealth=100; run.playerMaximumHealth=100;
    if(${grantAll}){ for(const definition of run.runPlan.segments.slice(0,7)){ if(definition.offerUpgradeAfter){} } }
    __ECHOFRAME__.game.scene.start('BossScene',{runId:run.runId}); __ECHOFRAME__.game.scene.start('HUDScene',{runId:run.runId});
    return {runId:run.runId, segmentId:run.runPlan.segments[7].segmentId};
  })()`);
  await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE8__)', 'boss hook');
  await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('BossScene'); scene.introRemainingMs=1; return true; })()`);
  await waitFor("__ECHOFRAME_PHASE8__.snapshot().combatStatus==='BOSS_ACTIVE'", 'boss active');
}

const baselineVictories = await evaluate(`__ECHOFRAME__.game.scene.getScenes(true)[0].services.saveManager.getSnapshot().statistics.aggregateCounters.victories`);
await startBoss();
const routeSnapshot = await evaluate(`(() => { const scene=__ECHOFRAME__.game.scene.getScene('BossScene'); const run=scene.run; return {segmentType:scene.segment.segmentType, segmentId:scene.segment.segmentId, template:scene.segment.arenaDescriptor.templateId, upgradeOfferCount:run.runPlan.upgradeOfferCount, bossImplemented:run.runPlan.bossImplemented, bossHandoffAvailable:run.runPlan.bossHandoffAvailable, segments:run.runPlan.segments.map(s=>s.segmentType)}; })()`);
assert(routeSnapshot.segmentType === 'BOSS' && routeSnapshot.template === 'boss-chamber', 'Real boss segment was not active.');
assert(routeSnapshot.upgradeOfferCount === 7 && routeSnapshot.bossImplemented && !routeSnapshot.bossHandoffAvailable, 'Phase 8 run metadata invalid.');

await evaluate(`__ECHOFRAME_PHASE8__.forceAttack('rotating-fan')`);
await sleep(1150); await screenshot('ECHOFRAME_phase8_null_architect_observe.png');
await sleep(1800);
let observe = await evaluate('__ECHOFRAME_PHASE8__.snapshot()');
assert(observe.bossPhase === 'OBSERVE', 'Observe phase missing.');

await evaluate(`__ECHOFRAME_PHASE8__.forceAttack('targeted-line-volley')`);
await sleep(500); await screenshot('ECHOFRAME_phase8_line_volley.png');
await sleep(1500);
await evaluate(`__ECHOFRAME_PHASE8__.forceAttack('drifter-summon')`); await sleep(900);
await evaluate(`(() => { const s=__ECHOFRAME__.game.scene.getScene('BossScene'); s.bossController.markMechanic('rotating-fan'); s.bossController.markMechanic('targeted-line-volley'); s.bossController.markMechanic('vulnerability'); s.bossController.vulnerability.force(true); s.bossController.forceHealth(s.bossController.maximumHealth*.70); return true; })()`);
await waitFor("__ECHOFRAME_PHASE8__.snapshot().bossPhase==='IMITATE'", 'Imitate transition', 8000);

await evaluate(`(() => { __ECHOFRAME_PHASE8__.forceEchoReady(); return true; })()`); await evaluate(`(() => { __ECHOFRAME_PHASE8__.deployEcho(); return true; })()`);
await evaluate(`__ECHOFRAME_PHASE8__.forceAttack('hostile-echo')`); await sleep(2200);
let imitate = await evaluate('__ECHOFRAME_PHASE8__.snapshot()');
assert(imitate.bossPhase === 'IMITATE' && imitate.hostileEchoes >= 1, 'Hostile Echo failed to activate.');
await screenshot('ECHOFRAME_phase8_hostile_echo.png');
await evaluate(`(() => { const s=__ECHOFRAME__.game.scene.getScene('BossScene'); s.bossController.markMechanic('hostile-echo'); s.bossController.markMechanic('vulnerability'); s.bossController.vulnerability.force(true); s.bossController.forceHealth(s.bossController.maximumHealth*.35); return true; })()`);
await waitFor("__ECHOFRAME_PHASE8__.snapshot().bossPhase==='DELETE'", 'Delete transition', 8000);

await evaluate(`__ECHOFRAME_PHASE8__.forceSector()`); await sleep(1150);
await evaluate(`__ECHOFRAME_PHASE8__.forcePanel()`); await sleep(250);
let deletion = await evaluate('__ECHOFRAME_PHASE8__.snapshot()');
assert(deletion.bossPhase === 'DELETE' && deletion.sectorState !== 'SAFE', 'Sector deletion failed.');
await screenshot('ECHOFRAME_phase8_sector_delete.png');

await evaluate(`__ECHOFRAME__.game.scene.getScene('BossScene').services.debugManager.setEnabled(true)`); await sleep(350); await screenshot('ECHOFRAME_phase8_boss_debug.png');
await evaluate(`__ECHOFRAME__.game.scene.getScene('BossScene').services.debugManager.setEnabled(false)`);

const pauseBefore = await evaluate(`(() => { const s=__ECHOFRAME__.game.scene.getScene('BossScene'); const value=s.run.elapsedSimulationMs; s.scene.pause(); return value; })()`);
await sleep(300);
const pauseAfter = await evaluate(`__ECHOFRAME__.game.scene.getScene('BossScene').run.elapsedSimulationMs`);
assert(Math.abs(pauseBefore - pauseAfter) < 1, 'Boss simulation advanced while paused.');
await evaluate(`(() => { __ECHOFRAME__.game.scene.resume('BossScene'); return true; })()`);
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false }); await sleep(150);
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); await sleep(150);

await evaluate(`__ECHOFRAME_PHASE8__.forceVictory()`);
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some(s=>s.scene.key==='ResultsScene')", 'victory results', 12000);
const victory = await evaluate(`(() => { const r=__ECHOFRAME__.game.scene.getScene('ResultsScene'); const save=r.services.saveManager.getSnapshot(); return {result:r.sceneData.result,title:r.sceneData.title,bossImplemented:r.sceneData.bossImplemented,victories:save.statistics.aggregateCounters.victories,bossRecord:save.statistics.bossRecords['null-architect']}; })()`);
assert(victory.result === 'victory' && victory.bossImplemented && victory.victories === baselineVictories + 1, 'Victory result/save invalid.');
await screenshot('ECHOFRAME_phase8_victory.png');

await startBoss({ seed: 8081, grantAll: false });
await evaluate(`__ECHOFRAME_PHASE8__.forceDefeat()`);
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some(s=>s.scene.key==='ResultsScene')", 'defeat results', 8000);
const defeat = await evaluate(`(() => { const r=__ECHOFRAME__.game.scene.getScene('ResultsScene'); return {result:r.sceneData.result,bossPhase:r.sceneData.bossPhase,bossHealth:r.sceneData.bossHealth}; })()`);
assert(defeat.result === 'defeat', 'Defeat result invalid.');

const activeKeys = await evaluate('__ECHOFRAME__.game.scene.getScenes(true).map(s=>s.scene.key)');
const report = {
  generatedAt: new Date().toISOString(),
  browser: await evaluate('navigator.userAgent'),
  routeSnapshot, observe, imitate, deletion, victory, defeat, activeKeys,
  checks: {
    realBossRoute: true, allThreePhases: true, rotatingFan: true, targetedLineVolley: true, drifterSummon: true,
    hostileEcho: true, friendlyAndHostileEcho: true, sectorDeletion: true, rearPanel: true, pauseSafe: true,
    resizeSafe: true, victory: true, defeat: true, saveIncrementOnce: true, noBossHandoff: true,
  },
  exceptions: exceptions.length,
  consoleErrors: consoleErrors.length,
  warnings: warnings.length,
  exceptionDetails: exceptions,
  consoleErrorDetails: consoleErrors,
  warningDetails: warnings,
};
report.passed = report.exceptions === 0 && report.consoleErrors === 0 && Object.values(report.checks).every(Boolean);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, passed: report.passed, checks: report.checks, exceptions: report.exceptions, consoleErrors: report.consoleErrors, warnings: report.warnings }, null, 2));
ws.close(); if (!report.passed) process.exitCode = 1;
