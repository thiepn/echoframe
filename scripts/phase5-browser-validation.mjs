import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const screenshotDir = path.join(ROOT, 'docs', 'screenshots');
const reportPath = path.join(ROOT, 'docs', 'PHASE5_BROWSER_VALIDATION.json');
const cdpPort = Number(process.env.CDP_PORT || 9222);
const targetList = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = targetList.find((entry) => entry.type === 'page');
if (!target) throw new Error('No Chromium page target is available.');

const ws = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const exceptions = [];
const severeLogs = [];

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') consoleErrors.push(message.params);
  if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) severeLogs.push(message.params.entry);
};
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  let response;
  try {
    response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  } catch (error) {
    throw new Error(`${error.message} while evaluating: ${String(expression).slice(0, 220)}`);
  }
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || 'Runtime evaluation failed.');
  return response.result?.value;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(expression, { timeoutMs = 10000, intervalMs = 50, label = expression } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await evaluate(expression);
    if (result) return result;
    await sleep(intervalMs);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}
function assert(condition, message) { if (!condition) throw new Error(message); }
async function screenshot(filename) {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(screenshotDir, filename), Buffer.from(result.data, 'base64'));
}
async function key(code, keyValue = code) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyValue, windowsVirtualKeyCode: keyValue === 'Enter' ? 13 : undefined });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyValue, windowsVirtualKeyCode: keyValue === 'Enter' ? 13 : undefined });
}
async function click(x, y) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

await mkdir(screenshotDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Page.reload', { ignoreCache: true });
await sleep(500);
await waitFor('Boolean(globalThis.__ECHOFRAME__)', { timeoutMs: 15000, label: 'ECHOFRAME bootstrap' });
await waitFor("Boolean(globalThis.__ECHOFRAME__?.game.scene.getScenes(true).some((scene) => scene.scene.key === 'MainMenuScene'))", { label: 'main menu' });

const bootstrap = await evaluate(`(() => {
  const game = globalThis.__ECHOFRAME__.game;
  const menu = game.scene.getScene('MainMenuScene');
  menu.services.settingsManager.set('gameplay.lastDifficulty', 'standard');
  const run = menu.services.gameState.createRun({ difficultyId: 'standard' });
  menu.services.sceneFlow.replace({
    sourceKeys: ['MainMenuScene'], targetKey: 'RunScene', payload: { runId: run.runId },
    launch: [{ key: 'HUDScene', payload: { runId: run.runId } }], token: 'phase5-browser-validation-' + run.runId,
  });
  return { runId: run.runId, seed: run.seed, difficultyId: run.difficultyId };
})()`);
await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE5__)', { timeoutMs: 15000, label: 'Phase 5 debug hooks' });
await sleep(1200);

const initial = await evaluate(`(() => {
  const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
  return {
    activeScenes: __ECHOFRAME__.game.scene.getScenes(true).map((item) => item.scene.key),
    canvas: { width: scene.game.canvas.width, height: scene.game.canvas.height },
    snapshot: __ECHOFRAME_PHASE5__.getSnapshot(),
    listenerCount: scene.services.eventBus.listenerCount(),
    cleanupCount: scene.services.debugManager.getCleanupCount(),
  };
})()`);
assert(initial.activeScenes.includes('RunScene') && initial.activeScenes.includes('HUDScene'), 'RunScene and HUDScene did not launch together.');
assert(initial.canvas.width > 0 && initial.canvas.height > 0, 'Canvas did not initialize.');

await evaluate(`(() => {
  const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
  scene.encounterDirector.update = () => {};
  scene.encounterDirector.completed = false;
  scene.encounterDirector.directorState = 'VALIDATION_HOLD';
  scene.enemyManager.clear('browser-validation-isolation');
  scene.carrierShardManager.clear('browser-validation-isolation');
  scene.enemyProjectileManager.clear?.('browser-validation-isolation');
  scene.hitInvulnerability.start(600000);
  scene.services.debugManager.setEnabled(false);
  return true;
})()`);

const fullRoster = await evaluate(`(() => {
  const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
  const positions = {
    drifter: { x: 250, y: 180 }, sentry: { x: 1350, y: 180 }, lancer: { x: 250, y: 700 },
    'shard-carrier': { x: 1350, y: 700 }, bulwark: { x: 300, y: 450 }, suppressor: { x: 1300, y: 450 },
  };
  const enemies = Object.entries(positions).map(([type, point]) => scene.enemyManager.spawn(type, point));
  return enemies.map((enemy) => ({ id: enemy?.enemyId, type: enemy?.type }));
})()`);
assert(fullRoster.length === 6 && fullRoster.every((entry) => entry.id), 'The full six-enemy roster did not spawn.');
await sleep(1100);

const rosterSnapshot = await evaluate('__ECHOFRAME_PHASE5__.getSnapshot()');
const rosterCounts = JSON.parse(rosterSnapshot.enemyCountsByType);
for (const type of ['drifter', 'sentry', 'lancer', 'shard-carrier', 'bulwark', 'suppressor']) assert(rosterCounts[type] >= 1, `${type} was missing from the runtime roster.`);

const echoResult = await evaluate(`(() => {
  __ECHOFRAME_PHASE5__.forceRecordingReady();
  __ECHOFRAME_PHASE5__.forceCooldownReady();
  const echo = __ECHOFRAME_PHASE5__.deployEcho();
  return { accepted: Boolean(echo), reason: echo ? null : 'deployment-returned-null' };
})()`);
await sleep(250);
const echoSnapshot = await evaluate('__ECHOFRAME_PHASE5__.getSnapshot()');
assert(echoResult?.accepted !== false, `Echo deployment was rejected: ${echoResult?.reason ?? 'unknown'}`);
assert(echoSnapshot.activeEchoCount === 1, 'Friendly Echo did not become active.');

const carrierRuntime = await evaluate(`(() => {
  const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
  const carrier = scene.enemyManager.activeEnemies.find((enemy) => enemy.type === 'shard-carrier');
  scene.enemyManager.beginDeath(carrier, 'player');
  scene.enemyManager.spawn('shard-carrier', { x: 1370, y: 690 });
  const shards = [...scene.carrierShardManager.pool.activeItems].map((shard) => ({
    x: shard.x, y: shard.y, targetX: shard.target.x, targetY: shard.target.y, state: shard.state,
  }));
  return { shards, placement: scene.carrierShardManager.getDiagnostics().placement };
})()`);
assert(carrierRuntime.shards.length > 0 && carrierRuntime.shards.length <= 3, 'Carrier did not release a bounded shard payload.');
assert(carrierRuntime.shards.every((shard) => [shard.x, shard.y, shard.targetX, shard.targetY].every(Number.isFinite)), 'Carrier shard coordinates contained a non-finite value.');
assert(carrierRuntime.placement.valid, `Carrier placement was invalid: ${JSON.stringify(carrierRuntime.placement.rejectionReasons)}`);

const suppression = await evaluate('__ECHOFRAME_PHASE5__.forceSuppressorState()');
assert(suppression.suppression.active === true, 'Suppressor field did not activate.');
assert(suppression.suppression.scalar > 0 && suppression.suppression.scalar < 1, 'Suppressor scalar was outside the expected slowing range.');
await evaluate('__ECHOFRAME_PHASE5__.stressHostileProjectiles()');
await sleep(500);
await screenshot('ECHOFRAME_phase5_core_roster.png');

const bulwark = await evaluate(`(() => {
  const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
  const enemy = scene.enemyManager.activeEnemies.find((item) => item.type === 'bulwark');
  enemy.activateFromSpawn?.();
  enemy.shieldAngle = 0;
  const packet = (direction, id) => Object.freeze({ finalAmount: 20, direction, timestampMs: scene.run.elapsedSimulationMs, damageId: id });
  const protectedHit = enemy.modifyIncomingDamage(packet({ x: -1, y: 0 }, 'front'));
  const vulnerableHit = enemy.modifyIncomingDamage(packet({ x: 1, y: 0 }, 'rear'));
  return {
    protectedZone: protectedHit.zone, protectedDamage: protectedHit.packet.finalAmount,
    vulnerableZone: vulnerableHit.zone, vulnerableDamage: vulnerableHit.packet.finalAmount,
  };
})()`);
assert(bulwark.protectedDamage > 0 && bulwark.protectedDamage < bulwark.vulnerableDamage, 'Bulwark protection did not reduce damage without granting immunity.');

await evaluate(`(() => {
  const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
  scene.enemyManager.clear('lancer-runtime-test');
  scene.carrierShardManager.clear('lancer-runtime-test');
  scene.player.setPosition(800, 735);
  scene.player.bodySprite?.setPosition?.(800, 735);
  scene.enemyManager.spawn('lancer', { x: 250, y: 700 });
  return true;
})()`);
const lancerStates = [];
const lancerPositions = [];
for (let index = 0; index < 45; index += 1) {
  const observation = await evaluate(`(() => {
    const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
    const lancer = scene.enemyManager.activeEnemies.find((enemy) => enemy.type === 'lancer');
    return lancer ? { state: lancer.state.value, x: lancer.x, y: lancer.y, maximumDistance: lancer.currentChargeDistance } : null;
  })()`);
  if (observation) {
    if (!lancerStates.includes(observation.state)) lancerStates.push(observation.state);
    lancerPositions.push(observation);
  }
  if (lancerStates.includes('ATTACK_EXECUTION') && lancerStates.includes('RECOVERY')) break;
  await sleep(100);
}
for (const state of ['SPAWNING', 'ATTACK_ANTICIPATION', 'ATTACK_LOCK', 'ATTACK_EXECUTION', 'RECOVERY']) assert(lancerStates.includes(state), `Lancer never reached ${state}; observed ${lancerStates.join(', ')}.`);
const lancerTravel = Math.max(...lancerPositions.map((point) => point.x)) - Math.min(...lancerPositions.map((point) => point.x));
assert(lancerTravel > 80, `Lancer execution did not produce meaningful movement (${lancerTravel.toFixed(1)} px).`);
assert(lancerPositions.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.maximumDistance)), 'Lancer runtime values contained NaN/Infinity.');

await waitFor(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('RunScene'); const lancer = scene.enemyManager.activeEnemies.find((enemy) => enemy.type === 'lancer'); return lancer?.state.value === 'ATTACK_ANTICIPATION'; })()`, { timeoutMs: 7000, label: 'Lancer anticipation for pause test' });
const pauseBefore = await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('RunScene'); const lancer = scene.enemyManager.activeEnemies.find((enemy) => enemy.type === 'lancer'); scene.scene.pause(); return { elapsed: lancer.state.elapsedMs, simulation: scene.run.elapsedSimulationMs }; })()`);
await sleep(550);
const pauseDuring = await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('RunScene'); const lancer = scene.enemyManager.activeEnemies.find((enemy) => enemy.type === 'lancer'); return { elapsed: lancer.state.elapsedMs, simulation: scene.run.elapsedSimulationMs }; })()`);
assert(Math.abs(pauseDuring.elapsed - pauseBefore.elapsed) < 1, 'Lancer timer advanced while RunScene was paused.');
assert(Math.abs(pauseDuring.simulation - pauseBefore.simulation) < 1, 'Simulation time advanced while RunScene was paused.');
await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('RunScene'); scene.scene.resume(); return true; })()`);

await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await sleep(300);
const resized = await evaluate(`({ innerWidth, innerHeight, canvasWidth: __ECHOFRAME__.game.canvas.clientWidth, canvasHeight: __ECHOFRAME__.game.canvas.clientHeight })`);
assert(resized.innerWidth === 1280 && resized.innerHeight === 720, 'Chromium viewport resize did not apply.');
assert(resized.canvasWidth > 0 && resized.canvasHeight > 0, 'Canvas collapsed after resize.');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await sleep(300);

await evaluate(`(() => {
  const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
  scene.services.debugManager.setEnabled(true);
  scene.enemyManager.clear('debug-screenshot');
  const positions = { drifter:[230,180], sentry:[1370,180], lancer:[250,700], 'shard-carrier':[1350,700], bulwark:[320,450], suppressor:[1280,450] };
  for (const [type, [x,y]] of Object.entries(positions)) scene.enemyManager.spawn(type,{x,y});
  scene.enemyProjectileManager.clear?.('debug-screenshot');
  return true;
})()`);
await sleep(900);
await screenshot('ECHOFRAME_phase5_director_debug.png');

await evaluate('__ECHOFRAME_PHASE5__.completeCurrentChamber()');
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'UpgradeScene')", { timeoutMs: 5000, label: 'upgrade scene' });
await click(320, 590);
await waitFor("Boolean(globalThis.__ECHOFRAME_PHASE5__) && __ECHOFRAME_PHASE5__.getSnapshot().chamberIndex === 2", { timeoutMs: 6000, label: 'Chamber 2 after mouse upgrade selection' });
const chamber2 = await evaluate('__ECHOFRAME_PHASE5__.getSnapshot()');
assert(chamber2.chamberIndex === 2, 'Upgrade selection did not advance to Chamber 2.');

await evaluate('__ECHOFRAME_PHASE5__.completeCurrentChamber()');
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'ResultsScene')", { timeoutMs: 5000, label: 'victory results' });
const results = await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('ResultsScene'); return { result: scene.sceneData.result, activeScenes: __ECHOFRAME__.game.scene.getScenes(true).map((item) => item.scene.key) }; })()`);
assert(results.result === 'victory', 'Chamber 2 completion did not produce a victory result.');
await click(800, 765);
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'MainMenuScene')", { timeoutMs: 5000, label: 'return to main menu' });

// Independently exercise the physical keyboard upgrade-selection path.
await evaluate(`(() => {
  const menu = __ECHOFRAME__.game.scene.getScene('MainMenuScene');
  menu.services.debugManager.setEnabled(true);
  const run = menu.services.gameState.createRun({ difficultyId: 'standard' });
  menu.services.sceneFlow.replace({
    sourceKeys: ['MainMenuScene'], targetKey: 'RunScene', payload: { runId: run.runId },
    launch: [{ key: 'HUDScene', payload: { runId: run.runId } }], token: 'keyboard-upgrade-validation-' + run.runId,
  });
  return true;
})()`);
await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE5__)', { timeoutMs: 8000, label: 'keyboard validation run' });
await evaluate('__ECHOFRAME_PHASE5__.completeCurrentChamber()');
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'UpgradeScene')", { timeoutMs: 5000, label: 'keyboard upgrade scene' });
await waitFor(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('UpgradeScene'); return !scene.services.sceneFlow.currentTransition && !scene.services.inputManager.locked; })()`, { timeoutMs: 5000, label: 'keyboard upgrade transition idle' });
await key('Enter', 'Enter');
await waitFor("Boolean(globalThis.__ECHOFRAME_PHASE5__) && __ECHOFRAME_PHASE5__.getSnapshot().chamberIndex === 2", { timeoutMs: 6000, label: 'Chamber 2 after keyboard upgrade selection' });
await evaluate('__ECHOFRAME_PHASE5__.completeCurrentChamber()');
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'ResultsScene')", { timeoutMs: 5000, label: 'keyboard validation results' });
await click(800, 765);
await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'MainMenuScene')", { timeoutMs: 5000, label: 'keyboard validation return to menu' });
await sleep(1000);

const finalDiagnostics = await evaluate(`(() => {
  const game = __ECHOFRAME__.game;
  const scene = game.scene.getScene('MainMenuScene');
  return {
    activeScenes: game.scene.getScenes(true).map((item) => item.scene.key),
    listenerCount: scene.services.eventBus.listenerCount(),
    cleanupCount: scene.services.debugManager.getCleanupCount(),
    audio: scene.services.audioManager.getDiagnostics(),
    transitionCount: scene.services.sceneFlow.transitionCount,
  };
})()`);

const report = {
  generatedAt: new Date().toISOString(),
  browser: 'Chromium headless via Chrome DevTools Protocol',
  viewport: '1600x900; resize validation at 1280x720',
  bootstrap,
  checks: {
    mainMenuBoot: true,
    runAndHudLaunch: true,
    sixEnemyRoster: true,
    friendlyEcho: true,
    carrierShardRelease: true,
    carrierFiniteCoordinates: true,
    carrierWallSafePlacement: true,
    suppressorField: true,
    bulwarkDirectionalMitigation: true,
    lancerStateCycle: lancerStates,
    lancerTravelPixels: Number(lancerTravel.toFixed(2)),
    pauseSafeTimers: true,
    resize: resized,
    mouseUpgradeSelection: true,
    keyboardUpgradeSelection: true,
    chamber2: true,
    victoryResults: true,
    returnToMenu: true,
  },
  snapshots: {
    initial: { activeScenes: initial.activeScenes, listenerCount: initial.listenerCount, cleanupCount: initial.cleanupCount },
    fullRosterCounts: rosterCounts,
    echoState: echoSnapshot.echoState,
    carrier: carrierRuntime,
    suppression: suppression.suppression,
    bulwark,
    chamber2: { chamberIndex: chamber2.chamberIndex, selectedUpgradeLevels: chamber2.selectedUpgradeLevels },
    results,
    finalDiagnostics,
  },
  browserErrors: {
    exceptions: exceptions.map((item) => item.text || item.exception?.description || 'unknown'),
    consoleErrors: consoleErrors.map((item) => item.args?.map((arg) => arg.value || arg.description).join(' ') || 'console error'),
    severeLogs: severeLogs.map((item) => ({ level: item.level, text: item.text, source: item.source })),
  },
};
assert(report.browserErrors.exceptions.length === 0, `Browser exceptions occurred: ${report.browserErrors.exceptions.join('; ')}`);
assert(report.browserErrors.consoleErrors.length === 0, `Console errors occurred: ${report.browserErrors.consoleErrors.join('; ')}`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, screenshots: ['ECHOFRAME_phase5_core_roster.png', 'ECHOFRAME_phase5_director_debug.png'], checks: report.checks, browserErrors: report.browserErrors }, null, 2));
ws.close();
