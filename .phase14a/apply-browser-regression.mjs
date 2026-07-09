import { readFile, writeFile } from 'node:fs/promises';

async function replaceExactlyOnce(path, before, after) {
  const source = await readFile(path, 'utf8');
  const occurrences = source.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${path}: expected one target block, found ${occurrences}`);
  }
  await writeFile(path, source.replace(before, after));
}

await replaceExactlyOnce(
  'src/scenes/TutorialScene.js',
  `      forceEchoVisual: () => {
        advanceTo(TUTORIAL_STATES.deployEcho);
        this.player.setPosition(TUTORIAL_ARENA.shieldTarget.x + 230, TUTORIAL_ARENA.shieldTarget.y);
        this.simulationTimeMs = Math.max(this.simulationTimeMs, 6000);
        const snapshot = this.playerController.getSnapshot();
        this.echoRecorder.forceReady(snapshot, this.simulationTimeMs);
        for (let index = 0; index < 4; index += 1) this.services.eventBus.emit('weapon:fired', { direction: { x: -1, y: 0 }, projectileMetadata: { damage: 1, speed: 850, lifetimeMs: 1200, radius: 4, critical: false }, weaponEventId: \`tutorial-debug-\${index}\` });
        const descriptor = this.echoRecorder.createReplayDescriptor(this.simulationTimeMs, createEchoLoadoutSnapshot({ ...this.weaponSystem.getEchoLoadoutSource(), echoDamageScalar: 1 }));
        const fireEvents = descriptor?.fireEvents.length ?? 0;
        if (descriptor) {
          this.lockedReplayDescriptor = descriptor;
          this.recordingLockState = 'locked';
          this.#deployEcho();
        }
        return { deployed: this.recordingLockState === 'deployed', fireEvents };
      },
`,
  `      prepareLockedEcho: () => {
        advanceTo(TUTORIAL_STATES.deployEcho);
        this.player.setPosition(TUTORIAL_ARENA.shieldTarget.x + 230, TUTORIAL_ARENA.shieldTarget.y);
        this.simulationTimeMs = Math.max(this.simulationTimeMs, 6000);
        const snapshot = this.playerController.getSnapshot();
        this.echoRecorder.forceReady(snapshot, this.simulationTimeMs);
        for (let index = 0; index < 4; index += 1) this.services.eventBus.emit('weapon:fired', { direction: { x: -1, y: 0 }, projectileMetadata: { damage: 1, speed: 850, lifetimeMs: 1200, radius: 4, critical: false }, weaponEventId: \`tutorial-debug-\${index}\` });
        const descriptor = this.echoRecorder.createReplayDescriptor(this.simulationTimeMs, createEchoLoadoutSnapshot({ ...this.weaponSystem.getEchoLoadoutSource(), echoDamageScalar: 1 }));
        if (descriptor) {
          this.lockedReplayDescriptor = descriptor;
          this.recordingLockState = 'locked';
          this.echoRecorder.setEnabled(false);
          this.inputContext.suppressHeldActions();
          this.#updatePresentation();
        }
        return { locked: Boolean(descriptor), fireEvents: descriptor?.fireEvents.length ?? 0, descriptorDurationMs: descriptor?.durationMs ?? 0 };
      },
      forceEchoVisual: () => {
        const prepared = hooks.prepareLockedEcho();
        if (prepared.locked) this.#deployEcho();
        return { deployed: this.recordingLockState === 'deployed', fireEvents: prepared.fireEvents };
      },
`,
);

await replaceExactlyOnce(
  'scripts/phase10-browser-validation.mjs',
  `  await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('DEPLOY_ECHO'));
  const echoVisual = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.forceEchoVisual());
  checks.productionEchoDeployed = echoVisual.deployed && echoVisual.fireEvents >= 4;
  await sleep(250); await capture(page, 'ECHOFRAME_phase10_tutorial_echo.png');
`,
  `  await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.advanceTo('DEPLOY_ECHO'));
  await page.keyboard.press('Space');
  await sleep(180);
  const failedDeployState = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.snapshot());
  checks.failedEchoDeployStaysLessonFive = failedDeployState.state === 'DEPLOY_ECHO'
    && failedDeployState.recordingLockState !== 'recording';

  const preparedEcho = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.prepareLockedEcho());
  await sleep(4000);
  const lockedAfterDelay = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.snapshot());
  checks.lockedEchoSurvivesLessonDelay = preparedEcho.locked
    && preparedEcho.fireEvents >= 4
    && lockedAfterDelay.state === 'DEPLOY_ECHO'
    && lockedAfterDelay.recordingLockState === 'locked'
    && lockedAfterDelay.hasLockedReplay === true;

  await page.keyboard.press('Space');
  await waitUntil(page, () => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__?.snapshot().recordingLockState === 'deployed');
  const deployedEcho = await page.evaluate(() => globalThis.__ECHOFRAME_PHASE10_TUTORIAL__.snapshot());
  checks.productionEchoDeployed = deployedEcho.state === 'DEPLOY_ECHO'
    && deployedEcho.recordingLockState === 'deployed'
    && deployedEcho.hasLockedReplay === false;
  await sleep(250); await capture(page, 'ECHOFRAME_phase10_tutorial_echo.png');
`,
);

console.log('Applied Phase 14A trusted Space-input browser regression coverage.');
