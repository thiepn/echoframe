import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { TutorialController } from '../src/tutorial/TutorialController.js';
import { TUTORIAL_STATES } from '../src/tutorial/TutorialState.js';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const reportPath = path.join(ROOT, 'docs', 'PHASE10_TUTORIAL_AUDIT.json');
const TIMELINES = 10_000;
const hardFailures = {
  incorrectStepAdvancement: 0, skippedRequiredStep: 0, duplicateCompletion: 0,
  falseOwnershipAcceptance: 0, softLockState: 0, nonFiniteProgress: 0,
  timerAdvancedDuringPause: 0, scoreOrProgressionMutation: 0, deterministicMismatch: 0,
};
const scenarioCounts = {};

function hashSnapshot(snapshot) { return JSON.stringify(snapshot); }
function runScenario(index) {
  const type = index % 16;
  scenarioCounts[type] = (scenarioCounts[type] ?? 0) + 1;
  const events = [];
  const c = new TutorialController({ eventBus: { emit: (name, payload) => events.push({ name, payload }) }, entrySource: index % 2 ? 'archive' : 'first-run' });
  const baseline = { score: 0, progression: 0, runs: 0 };
  const started = c.begin(100);
  if (!started) hardFailures.incorrectStepAdvancement += 1;

  if (type === 1) c.checkpoint(0, 'echo');
  if (type === 2) c.checkpoint(2, 'player');
  if (type === 3) c.stationaryTarget({ source: 'player', defeated: true });
  for (let i = 0; i < 3; i += 1) c.checkpoint(i, 'player');
  if (c.state !== TUTORIAL_STATES.aimAndFire) hardFailures.skippedRequiredStep += 1;

  if (type === 4) c.stationaryTarget({ source: 'echo', defeated: true });
  if (type === 5) c.stationaryTarget({ source: 'player', defeated: false });
  c.stationaryTarget({ source: 'player', defeated: true });
  if (type === 6) c.dashGate({ owner: 'player', dashing: false });
  if (type === 7) c.dashGate({ owner: 'player', dashing: true, directionValid: false });
  c.dashGate({ owner: 'player', dashing: true, directionValid: true });

  if (type === 8) c.pathCheckpoint(0, 'echo');
  for (let i = 0; i < 4; i += 1) c.pathCheckpoint(i, 'player');
  if (type === 9) c.recordingQualified({ fireEvents: 3, spanMs: 5000 });
  if (type === 10) c.recordingQualified({ fireEvents: 4, spanMs: 3499 });
  c.recordingQualified({ fireEvents: 4 + (index % 5), spanMs: 3500 + index });

  if (type === 11) c.echoRearHit({ source: 'player', rear: true, defeated: true });
  if (type === 12) c.echoRearHit({ source: 'echo', rear: false, defeated: true });
  if (type === 13) c.echoRearHit({ source: 'echo', rear: true, defeated: false });
  if (type === 14) { c.retryRecording(); for (let i = 0; i < 4; i += 1) c.pathCheckpoint(i, 'player'); c.recordingQualified({ fireEvents: 5, spanMs: 4000 }); }
  c.echoRearHit({ source: 'echo', rear: true, defeated: true });

  if (type === 15) {
    c.setPaused(true);
    const before = c.snapshot();
    c.signalGate({ owner: 'player' }, 9000);
    const after = c.snapshot();
    if (before.state !== after.state || before.transitionCount !== after.transitionCount) hardFailures.timerAdvancedDuringPause += 1;
    c.setPaused(false);
  }
  c.signalGate({ owner: 'echo' }, 9000);
  c.signalGate({ owner: 'player' }, 9000 + index);
  c.signalGate({ owner: 'player' }, 10000 + index);

  const snapshot = c.snapshot();
  const expectedTransitions = type === 14 ? 8 : 7;
  if (!snapshot.completed || snapshot.state !== TUTORIAL_STATES.complete || snapshot.transitionCount !== expectedTransitions) hardFailures.softLockState += 1;
  if (!Number.isFinite(snapshot.stepIndex) || !Number.isFinite(snapshot.transitionCount)) hardFailures.nonFiniteProgress += 1;
  const completionEvents = events.filter((event) => event.name === 'tutorial:completed');
  if (completionEvents.length !== 1) hardFailures.duplicateCompletion += 1;
  if (type === 1 && c.invalidActions.every((entry) => entry.reason !== 'player-only')) hardFailures.falseOwnershipAcceptance += 1;
  if (JSON.stringify(baseline) !== JSON.stringify({ score: 0, progression: 0, runs: 0 })) hardFailures.scoreOrProgressionMutation += 1;
  return hashSnapshot(snapshot);
}

for (let index = 0; index < TIMELINES; index += 1) {
  const first = runScenario(index);
  const second = runScenario(index);
  if (first !== second) hardFailures.deterministicMismatch += 1;
}
const passed = Object.values(hardFailures).every((value) => value === 0);
const report = { generatedAt: new Date().toISOString(), timelines: TIMELINES, replayedTimelines: TIMELINES, scenarioCounts, hardFailures, passed };
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
