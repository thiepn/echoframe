import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const reportPath = path.resolve(ROOT, process.env.LIFECYCLE_REPORT_PATH || path.join('docs', 'PHASE5_LIFECYCLE_VALIDATION.json'));
const partialPath = path.resolve(ROOT, process.env.LIFECYCLE_PARTIAL_PATH || path.join('docs', 'PHASE5_LIFECYCLE_PARTIAL.json'));
const cycleTarget = Number(process.env.LIFECYCLE_CYCLES || 50);
const cdpPort = Number(process.env.CDP_PORT || 9222);
const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = targets.find((entry) => entry.type === 'page');
if (!target) throw new Error('No Chromium page target.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 1;
const pending = new Map();
const exceptions = [];
const consoleErrors = [];
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const item = pending.get(message.id); pending.delete(message.id);
    if (message.error) item.reject(new Error(JSON.stringify(message.error))); else item.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') consoleErrors.push(message.params);
};
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
function send(method, params = {}) { const requestId = id++; ws.send(JSON.stringify({ id: requestId, method, params })); return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject })); }
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || 'Evaluation failed.');
  return response.result?.value;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(expression, label, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await evaluate(expression)) return;
    await sleep(20);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}
function assert(value, message) { if (!value) throw new Error(message); }

await send('Page.enable'); await send('Runtime.enable');
await send('Page.reload', { ignoreCache: true });
await waitFor('Boolean(globalThis.__ECHOFRAME__)', 'game boot', 15000);
await waitFor("Boolean(globalThis.__ECHOFRAME__?.game.scene.getScenes(true).some((scene) => scene.scene.key === 'MainMenuScene'))", 'main menu');

const difficulties = ['relaxed', 'standard', 'overclocked'];
const cycles = [];
const menuDiagnostics = [];
const resultDiagnostics = [];
let restartedIntoRun = false;
let inheritedDifficulty = null;
let mouseControlSelections = 0;
let keyboardFocusSelections = 0;
let restarts = 0;
let victories = 0;
let deaths = 0;

async function diagnostics(sceneKey) {
  return evaluate(`(() => {
    const game = __ECHOFRAME__.game;
    const scene = game.scene.getScene('${sceneKey}');
    return {
      activeScenes: game.scene.getScenes(true).map((item) => item.scene.key),
      listenerCount: scene.services.eventBus.listenerCount(),
      cleanupCount: scene.services.debugManager.getCleanupCount(),
      inputContexts: scene.services.inputManager.contexts.size,
      audioContexts: scene.services.audioManager.getDiagnostics().contextCount,
      transitionCount: scene.services.sceneFlow.transitionCount,
      hookPresent: Boolean(globalThis.__ECHOFRAME_PHASE5__),
    };
  })()`);
}
menuDiagnostics.push(await diagnostics('MainMenuScene'));
await waitFor("(() => { const scene = __ECHOFRAME__.game.scene.getScene('MainMenuScene'); return !scene.services.sceneFlow.currentTransition && !scene.services.inputManager.locked; })()", 'initial transition idle');

for (let cycleIndex = 0; cycleIndex < cycleTarget; cycleIndex += 1) {
  let difficultyId;
  if (!restartedIntoRun) {
    difficultyId = difficulties[cycleIndex % difficulties.length];
    await waitFor("(() => { const scene = __ECHOFRAME__.game.scene.getScene('MainMenuScene'); return !scene.services.sceneFlow.currentTransition && !scene.services.inputManager.locked; })()", `menu transition idle ${cycleIndex + 1}`);
    await evaluate(`(() => {
      const menu = __ECHOFRAME__.game.scene.getScene('MainMenuScene');
      menu.services.settingsManager.set('gameplay.lastDifficulty', '${difficultyId}');
      menu.services.debugManager.setEnabled(true);
      menu.buttons[0].activate();
      return true;
    })()`);
    await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE5__)', `RunScene ${cycleIndex + 1}`, 8000);
  } else {
    difficultyId = inheritedDifficulty;
    restartedIntoRun = false;
    await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE5__)', `restarted RunScene ${cycleIndex + 1}`, 8000);
  }

  await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('RunScene'); scene.services.debugManager.setEnabled(false); return true; })()`);
  const runStart = await evaluate(`(() => {
    const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
    return {
      runId: scene.run.runId, seed: scene.run.seed, difficultyId: scene.run.difficultyId,
      listenerCount: scene.services.eventBus.listenerCount(), cleanupCount: scene.services.debugManager.getCleanupCount(),
      collisionHandles: __ECHOFRAME_PHASE5__.getSnapshot().collisionHandles,
    };
  })()`);
  difficultyId = runStart.difficultyId;

  if (cycleIndex % 10 === 0) {
    await evaluate(`(() => {
      __ECHOFRAME_PHASE5__.clearEnemies();
      __ECHOFRAME_PHASE5__.spawnFullRoster();
      __ECHOFRAME_PHASE5__.makePlayerInvulnerable(5000);
      __ECHOFRAME_PHASE5__.forceRecordingReady();
      __ECHOFRAME_PHASE5__.forceCooldownReady();
      __ECHOFRAME_PHASE5__.deployEcho();
      __ECHOFRAME_PHASE5__.forceSuppressorState();
      const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
      const carrier = scene.enemyManager.activeEnemies.find((enemy) => enemy.type === 'shard-carrier');
      if (carrier) scene.enemyManager.beginDeath(carrier, 'player');
      return true;
    })()`);
  }

  const shouldWin = cycleIndex % 2 === 0;
  let upgradeControl = null;
  if (shouldWin) {
    victories += 1;
    await evaluate('__ECHOFRAME_PHASE5__.completeCurrentChamber()');
    await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'UpgradeScene')", `UpgradeScene ${cycleIndex + 1}`, 8000);
    await waitFor("(() => { const scene = __ECHOFRAME__.game.scene.getScene('UpgradeScene'); return !scene.services.sceneFlow.currentTransition && !scene.services.inputManager.locked; })()", `upgrade transition idle ${cycleIndex + 1}`, 8000);
    await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('UpgradeScene'); scene.services.debugManager.setEnabled(true); return true; })()`);
    if (cycleIndex % 4 === 0) {
      await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('UpgradeScene'); scene.buttons[0].activate(); return true; })()`);
      upgradeControl = 'mouse-button-control-path';
      mouseControlSelections += 1;
    } else {
      await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('UpgradeScene'); return scene.focusManager.activateFocused(); })()`);
      upgradeControl = 'keyboard-focus-control-path';
      keyboardFocusSelections += 1;
    }
    await waitFor("Boolean(globalThis.__ECHOFRAME_PHASE5__) && __ECHOFRAME_PHASE5__.getSnapshot().chamberIndex === 2", `Chamber 2 ${cycleIndex + 1}`, 8000);
    await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('RunScene'); scene.services.debugManager.setEnabled(false); return true; })()`);
    await evaluate('__ECHOFRAME_PHASE5__.completeCurrentChamber()');
  } else {
    deaths += 1;
    await evaluate(`(() => { __ECHOFRAME_PHASE5__.setPlayerHealth(1); return __ECHOFRAME_PHASE5__.damagePlayer(25); })()`);
  }

  await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'ResultsScene')", `ResultsScene ${cycleIndex + 1}`, 8000);
  await waitFor("(() => { const scene = __ECHOFRAME__.game.scene.getScene('ResultsScene'); return !scene.services.sceneFlow.currentTransition && !scene.services.inputManager.locked; })()", `results transition idle ${cycleIndex + 1}`, 8000);
  const result = await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('ResultsScene'); return { result: scene.sceneData.result, seed: scene.sceneData.seed, difficultyId: scene.sceneData.difficultyId }; })()`);
  assert(result.result === (shouldWin ? 'victory' : 'death'), `Cycle ${cycleIndex + 1}: expected ${shouldWin ? 'victory' : 'death'}, got ${result.result}.`);
  const resultDiagnostic = await diagnostics('ResultsScene');
  resultDiagnostics.push(resultDiagnostic);
  cycles.push({ cycle: cycleIndex + 1, ...runStart, intendedResult: shouldWin ? 'victory' : 'death', actualResult: result.result, upgradeControl, resultDiagnostics: resultDiagnostic });

  const shouldRestart = cycleIndex < cycleTarget - 1 && cycleIndex % 10 === 4;
  if (shouldRestart) {
    restarts += 1;
    inheritedDifficulty = difficultyId;
    await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('ResultsScene'); scene.services.debugManager.setEnabled(true); return true; })()`);
    await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('ResultsScene'); scene.buttons[0].activate(); return true; })()`);
    await waitFor('Boolean(globalThis.__ECHOFRAME_PHASE5__)', `restart ${cycleIndex + 1}`, 8000);
    await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('RunScene'); scene.services.debugManager.setEnabled(false); return true; })()`);
    restartedIntoRun = true;
  } else {
    await evaluate(`(() => { const scene = __ECHOFRAME__.game.scene.getScene('ResultsScene'); scene.buttons[1].activate(); return true; })()`);
    await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'MainMenuScene')", `main menu ${cycleIndex + 1}`, 8000);
    await waitFor("(() => { const scene = __ECHOFRAME__.game.scene.getScene('MainMenuScene'); return !scene.services.sceneFlow.currentTransition && !scene.services.inputManager.locked; })()", `menu idle after ${cycleIndex + 1}`, 8000);
    menuDiagnostics.push(await diagnostics('MainMenuScene'));
  }
  await writeFile(partialPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), completedCycles: cycles.length, targetCycles: cycleTarget, victories, deaths, restarts, mouseControlSelections, keyboardFocusSelections, cycles }, null, 2)}\n`);
  if ((cycleIndex + 1) % 10 === 0 || cycleIndex + 1 === cycleTarget) console.log(`Lifecycle progress: ${cycleIndex + 1}/${cycleTarget}`);
}

if (restartedIntoRun) {
  await evaluate(`(() => {
    const scene = __ECHOFRAME__.game.scene.getScene('RunScene');
    scene.services.gameState.disposeRun();
    scene.services.sceneFlow.replace({ sourceKeys: ['RunScene','HUDScene'], targetKey: 'MainMenuScene', token: 'lifecycle-final-menu' });
    return true;
  })()`);
  await waitFor("__ECHOFRAME__.game.scene.getScenes(true).some((scene) => scene.scene.key === 'MainMenuScene')", 'final main menu', 8000);
  await waitFor("(() => { const scene = __ECHOFRAME__.game.scene.getScene('MainMenuScene'); return !scene.services.sceneFlow.currentTransition && !scene.services.inputManager.locked; })()", 'final transition idle');
  menuDiagnostics.push(await diagnostics('MainMenuScene'));
}

const final = await diagnostics('MainMenuScene');
const baseline = menuDiagnostics[0];
const listenerCounts = menuDiagnostics.map((entry) => entry.listenerCount);
const cleanupCounts = menuDiagnostics.map((entry) => entry.cleanupCount);
const inputContextCounts = menuDiagnostics.map((entry) => entry.inputContexts);
const usedDifficulties = [...new Set(cycles.map((entry) => entry.difficultyId))].sort();
const uniqueSeeds = new Set(cycles.map((entry) => entry.seed)).size;
assert(cycles.length === cycleTarget, `Expected ${cycleTarget} cycles, got ${cycles.length}.`);
assert(usedDifficulties.length === 3, `Not all difficulties were covered: ${usedDifficulties.join(', ')}`);
assert(mouseControlSelections > 0 && keyboardFocusSelections > 0, 'Both upgrade control paths were not covered.');
assert(listenerCounts.every((value) => value === baseline.listenerCount), `Listener growth detected: ${listenerCounts.join(', ')}`);
assert(cleanupCounts.every((value) => value === baseline.cleanupCount), `Cleanup growth detected: ${cleanupCounts.join(', ')}`);
assert(inputContextCounts.every((value) => value === baseline.inputContexts), `Input context growth detected: ${inputContextCounts.join(', ')}`);
assert(final.hookPresent === false, 'Runtime debug hook leaked after returning to menu.');
assert(exceptions.length === 0, `Browser exceptions: ${exceptions.map((entry) => entry.text).join('; ')}`);
assert(consoleErrors.length === 0, 'Browser console errors occurred.');

const report = {
  generatedAt: new Date().toISOString(),
  browser: 'Chromium headless via Chrome DevTools Protocol',
  totalCycles: cycles.length,
  victories,
  deaths,
  restarts,
  returnsToMenu: cycleTarget - restarts,
  mouseControlSelections,
  keyboardFocusSelections,
  difficulties: usedDifficulties,
  uniqueSeeds,
  diagnostics: {
    baseline,
    mainMenuSamples: menuDiagnostics.length,
    listenerRange: { min: Math.min(...listenerCounts), max: Math.max(...listenerCounts) },
    cleanupRange: { min: Math.min(...cleanupCounts), max: Math.max(...cleanupCounts) },
    inputContextRange: { min: Math.min(...inputContextCounts), max: Math.max(...inputContextCounts) },
    resultListenerRange: { min: Math.min(...resultDiagnostics.map((entry) => entry.listenerCount)), max: Math.max(...resultDiagnostics.map((entry) => entry.listenerCount)) },
    resultCleanupRange: { min: Math.min(...resultDiagnostics.map((entry) => entry.cleanupCount)), max: Math.max(...resultDiagnostics.map((entry) => entry.cleanupCount)) },
    final,
  },
  leakChecks: { listenersStable: true, cleanupStable: true, inputContextsStable: true, runtimeHookCleared: true, browserExceptions: 0, consoleErrors: 0 },
  cycles,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, totalCycles: report.totalCycles, victories, deaths, restarts, mouseControlSelections, keyboardFocusSelections, difficulties: usedDifficulties, uniqueSeeds, diagnostics: report.diagnostics, leakChecks: report.leakChecks }, null, 2));
ws.close();
setTimeout(() => process.exit(0), 50);
