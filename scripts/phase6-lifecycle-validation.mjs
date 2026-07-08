import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const reportPath = process.env.LIFECYCLE_REPORT_PATH || path.join(ROOT, 'docs', 'PHASE6_LIFECYCLE_VALIDATION.json');
const cycleTarget = Number(process.env.LIFECYCLE_CYCLES || 50);
const seedOffset = Number(process.env.LIFECYCLE_SEED_OFFSET || 0);
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
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Evaluation failed');
  return result.result?.value;
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.reload', { ignoreCache: true });

const browserResult = await evaluate(`(async () => {
  const cycleTarget = ${JSON.stringify(cycleTarget)};
  const seedOffset = ${JSON.stringify(seedOffset)};
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const activeScene = (key) => globalThis.__ECHOFRAME__?.game?.scene?.getScenes(true)?.find((scene) => scene.scene.key === key) ?? null;
  const stateSummary = () => ({
    scenes: globalThis.__ECHOFRAME__?.game?.scene?.getScenes(true)?.map((scene) => scene.scene.key) ?? [],
    hook: Boolean(globalThis.__ECHOFRAME_PHASE6__),
    segment: globalThis.__ECHOFRAME_PHASE6__?.getSnapshot?.().segmentIndex ?? null,
    transition: activeScene('RunScene')?.services?.sceneFlow?.currentTransition?.token ?? activeScene('UpgradeScene')?.services?.sceneFlow?.currentTransition?.token ?? activeScene('ResultsScene')?.services?.sceneFlow?.currentTransition?.token ?? activeScene('MainMenuScene')?.services?.sceneFlow?.currentTransition?.token ?? null,
    locked: activeScene('RunScene')?.services?.inputManager?.locked ?? activeScene('UpgradeScene')?.services?.inputManager?.locked ?? activeScene('ResultsScene')?.services?.inputManager?.locked ?? activeScene('MainMenuScene')?.services?.inputManager?.locked ?? null,
  });
  const waitFor = async (predicate, label, timeoutMs = 8000) => {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
      try { if (predicate()) return; } catch {}
      await sleep(8);
    }
    throw new Error('Lifecycle timeout: ' + label + ' ' + JSON.stringify(stateSummary()));
  };
  const diagnostics = (sceneKey) => {
    const scene = activeScene(sceneKey) ?? globalThis.__ECHOFRAME__.game.scene.getScene(sceneKey);
    const audio = scene.services.audioManager.getDiagnostics();
    return {
      activeScenes: globalThis.__ECHOFRAME__.game.scene.getScenes(true).map((item) => item.scene.key),
      listeners: scene.services.eventBus.listenerCount(),
      cleanup: scene.services.debugManager.getCleanupCount(),
      inputContexts: scene.services.inputManager.contexts.size,
      audioContexts: audio.contextCount,
      transitionActive: Boolean(scene.services.sceneFlow.currentTransition),
      inputLocked: scene.services.inputManager.locked,
      hookPresent: Boolean(globalThis.__ECHOFRAME_PHASE6__),
    };
  };
  const patchFlow = (scene) => {
    const flow = scene.services.sceneFlow;
    if (!flow.__phase6LifecycleOriginalReplace) {
      flow.__phase6LifecycleOriginalReplace = flow.replace.bind(flow);
      flow.replace = (input) => flow.__phase6LifecycleOriginalReplace({ ...input, fadeMs: 0 });
    }
  };
  const waitForMenu = async () => {
    await waitFor(() => {
      const scene = activeScene('MainMenuScene');
      return Boolean(scene && !scene.services.sceneFlow.currentTransition && !scene.services.inputManager.locked);
    }, 'main menu idle');
    const scene = activeScene('MainMenuScene');
    patchFlow(scene);
    scene.time.timeScale = 1;
    return scene;
  };
  const waitForRun = async (index, label = 'run segment', previousHook = null) => {
    await waitFor(() => {
      const run = activeScene('RunScene');
      return Boolean(run && globalThis.__ECHOFRAME_PHASE6__ !== previousHook && !activeScene('UpgradeScene') && globalThis.__ECHOFRAME_PHASE6__
        && globalThis.__ECHOFRAME_PHASE6__.getSnapshot().segmentIndex === index
        && !run.services.sceneFlow.currentTransition && !run.services.inputManager.locked);
    }, label);
    const run = activeScene('RunScene');
    run.time.timeScale = 1;
    globalThis.__ECHOFRAME_PHASE6__.makePlayerInvulnerable(600000);
    return run;
  };
  const waitForUpgrade = async () => {
    await waitFor(() => {
      const scene = activeScene('UpgradeScene');
      return Boolean(scene && !scene.services.sceneFlow.currentTransition && !scene.services.inputManager.locked);
    }, 'upgrade idle');
    const scene = activeScene('UpgradeScene');
    scene.time.timeScale = 80;
    return scene;
  };
  const waitForResults = async (expected) => {
    await waitFor(() => activeScene('ResultsScene')?.sceneData?.result === expected, expected + ' results', 12000);
    const scene = activeScene('ResultsScene');
    scene.time.timeScale = 1;
    return scene;
  };

  await waitFor(() => Boolean(globalThis.__ECHOFRAME__), 'game boot', 15000);
  const menu = await waitForMenu();
  menu.services.debugManager.setEnabled(true);
  const baseline = diagnostics('MainMenuScene');
  const cycles = [];
  const difficulties = ['relaxed', 'standard', 'overclocked'];
  const hosts = new Set();
  const modifiers = new Set();
  const pairs = new Set();
  let victories = 0;
  let deaths = 0;
  let restarts = 0;
  let mouseSelections = 0;
  let keyboardSelections = 0;
  const restartCycles = new Set([9, 19, 29, 39, 49]);

  const startRun = async (seed, difficultyId) => {
    const menuScene = await waitForMenu();
    menuScene.services.debugManager.setEnabled(true);
    const run = menuScene.services.gameState.createRun({ seed, difficultyId });
    menuScene.services.sceneFlow.replace({ sourceKeys: ['MainMenuScene'], targetKey: 'RunScene', payload: { runId: run.runId }, launch: [{ key: 'HUDScene', payload: { runId: run.runId } }], token: 'lifecycle-' + seed + '-' + run.runId, fadeMs: 0 });
    return waitForRun(0, 'run start ' + seed);
  };

  const selectUpgrade = async (mode, nextIndex) => {
    const scene = await waitForUpgrade();
    if (mode === 'keyboard') {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
      keyboardSelections += 1;
      if (!scene.selected) scene.buttons[0].activate();
    } else {
      scene.buttons[0].activate();
      mouseSelections += 1;
    }
    return waitForRun(nextIndex, 'segment ' + nextIndex + ' after upgrade');
  };

  const completeVictory = async (globalCycleIndex) => {
    for (let segmentIndex = 0; segmentIndex < 5; segmentIndex += 1) {
      globalThis.__ECHOFRAME_PHASE6__.completeCurrentChamber();
      await selectUpgrade((globalCycleIndex + segmentIndex) % 2 ? 'keyboard' : 'mouse', segmentIndex + 1);
    }
    globalThis.__ECHOFRAME_PHASE6__.completeCurrentChamber();
    return waitForResults('victory');
  };

  const completeDeath = async (segmentIndex) => {
    if (segmentIndex > 0) {
      const previousHook = globalThis.__ECHOFRAME_PHASE6__;
      globalThis.__ECHOFRAME_PHASE6__.jumpToSegment(segmentIndex);
      await waitForRun(segmentIndex, 'death segment ' + segmentIndex, previousHook);
    }
    const run = activeScene('RunScene');
    run.time.timeScale = 1;
    globalThis.__ECHOFRAME_PHASE6__.setPlayerHealth(5);
    const damage = globalThis.__ECHOFRAME_PHASE6__.damagePlayer(99);
    if (!damage?.accepted || !damage?.targetDefeated) throw new Error('Death injection rejected: ' + JSON.stringify(damage));
    return waitForResults('death');
  };

  for (let localIndex = 0; localIndex < cycleTarget; localIndex += 1) {
    const globalIndex = seedOffset + localIndex;
    globalThis.__PHASE6_LIFECYCLE_PROGRESS = { localIndex, globalIndex, stage: 'start' };
    const seed = globalIndex + 1;
    const difficultyId = difficulties[globalIndex % difficulties.length];
    const startedAt = performance.now();
    const runScene = await startRun(seed, difficultyId);
    globalThis.__PHASE6_LIFECYCLE_PROGRESS = { localIndex, globalIndex, seed, difficultyId, stage: 'run-started' };
    const elitePlans = runScene.run.runPlan.segments.filter((segment) => segment.elitePlan).map((segment) => segment.elitePlan);
    for (const elite of elitePlans) {
      hosts.add(elite.hostEnemyType);
      modifiers.add(elite.modifierId);
      pairs.add(elite.hostEnemyType + ':' + elite.modifierId);
    }
    const victory = globalIndex % 5 < 3;
    globalThis.__PHASE6_LIFECYCLE_PROGRESS.stage = victory ? 'victory-route' : 'death-route';
    const resultsScene = victory ? await completeVictory(globalIndex) : await completeDeath(globalIndex % 6);
    globalThis.__PHASE6_LIFECYCLE_PROGRESS.stage = 'results';
    if (victory) victories += 1; else deaths += 1;
    const result = {
      result: resultsScene.sceneData.result,
      seed: resultsScene.sceneData.seed,
      difficultyId: resultsScene.sceneData.difficultyId,
      preBossComplete: resultsScene.sceneData.preBossComplete,
      segmentCount: resultsScene.sceneData.runPlan?.segments?.length ?? 0,
      upgrades: resultsScene.sceneData.selectedUpgradeHistory?.length ?? 0,
      hookPresent: Boolean(globalThis.__ECHOFRAME_PHASE6__),
    };
    if (result.result !== (victory ? 'victory' : 'death')) throw new Error('Cycle result mismatch ' + (globalIndex + 1));
    if (result.hookPresent) throw new Error('Run hook survived into results ' + (globalIndex + 1));
    cycles.push({ cycle: globalIndex + 1, expected: victory ? 'victory' : 'death', seed, difficultyId, elitePlans, result, durationMs: Math.round(performance.now() - startedAt) });

    if (restartCycles.has(globalIndex)) {
      globalThis.__PHASE6_LIFECYCLE_PROGRESS.stage = 'restart';
      resultsScene.buttons[0].activate();
      await waitForRun(0, 'restart run');
      restarts += 1;
      globalThis.__PHASE6_LIFECYCLE_PROGRESS.stage = 'restart-death';
      await completeDeath((globalIndex + 2) % 6);
      activeScene('ResultsScene').buttons[1].activate();
    } else {
      resultsScene.buttons[1].activate();
    }
    await waitForMenu();
    globalThis.__PHASE6_LIFECYCLE_PROGRESS.stage = 'cycle-complete';
  }

  const final = diagnostics('MainMenuScene');
  const invariantFields = ['listeners', 'cleanup', 'inputContexts', 'audioContexts'];
  const growth = Object.fromEntries(invariantFields.map((field) => [field, final[field] - baseline[field]]));
  return {
    generatedAt: new Date().toISOString(),
    cycleTarget,
    seedOffset,
    cyclesCompleted: cycles.length,
    victories,
    deaths,
    restarts,
    difficultiesCovered: [...new Set(cycles.map((entry) => entry.difficultyId))],
    uniqueSeeds: new Set(cycles.map((entry) => entry.seed)).size,
    mouseSelections,
    keyboardSelections,
    eliteHostsCovered: [...hosts].sort(),
    eliteModifiersCovered: [...modifiers].sort(),
    hostModifierPairsCovered: [...pairs].sort(),
    baseline,
    final,
    growth,
    cycles,
  };
})()`);

const report = {
  ...browserResult,
  exceptions: exceptions.length,
  consoleErrors: consoleErrors.length,
  warnings: warnings.length,
  exceptionDetails: exceptions,
  consoleErrorDetails: consoleErrors,
  warningDetails: warnings,
};
report.passed = report.cyclesCompleted >= cycleTarget
  && report.victories > 0
  && report.deaths > 0
  && report.uniqueSeeds >= cycleTarget
  && report.mouseSelections > 0
  && report.keyboardSelections > 0
  && Object.values(report.growth).every((value) => value === 0)
  && report.exceptions === 0
  && report.consoleErrors === 0
  && !report.final.hookPresent;
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  reportPath,
  passed: report.passed,
  cycles: report.cyclesCompleted,
  victories: report.victories,
  deaths: report.deaths,
  restarts: report.restarts,
  uniqueSeeds: report.uniqueSeeds,
  hosts: report.eliteHostsCovered,
  modifiers: report.eliteModifiersCovered,
  pairs: report.hostModifierPairsCovered.length,
  growth: report.growth,
  exceptions: report.exceptions,
  consoleErrors: report.consoleErrors,
  warnings: report.warnings,
  durationMs: report.cycles.reduce((sum, cycle) => sum + cycle.durationMs, 0),
}, null, 2));
ws.close();
if (!report.passed) process.exitCode = 1;
