import { TUTORIAL_SEQUENCE, TUTORIAL_STATES } from './TutorialState.js';
import { validateCheckpoint, validateDashGate, validateEchoDeployment, validateEchoRearHit, validateRecording, validateSignalGate, validateStationaryTarget } from './TutorialObjectiveValidator.js';

export class TutorialController {
  constructor({ eventBus = null, entrySource = 'menu' } = {}) {
    this.eventBus = eventBus;
    this.entrySource = entrySource;
    this.reset();
  }
  reset() {
    this.state = TUTORIAL_STATES.intro;
    this.stepIndex = 0;
    this.moveCheckpointIndex = 0;
    this.pathCheckpointIndex = 0;
    this.completed = false;
    this.paused = false;
    this.transitionCount = 0;
    this.invalidActions = [];
    this.startedAtMs = null;
    this.completedAtMs = null;
    this.eventBus?.emit('tutorial:started', { entrySource: this.entrySource });
  }
  begin(timeMs = 0) {
    if (this.state !== TUTORIAL_STATES.intro || this.paused) return false;
    this.startedAtMs = Number(timeMs) || 0;
    return this.#advance(TUTORIAL_STATES.moveCheckpoints);
  }
  setPaused(value) { this.paused = Boolean(value); }
  checkpoint(index, owner = 'player') {
    if (this.state !== TUTORIAL_STATES.moveCheckpoints || this.paused) return this.#reject('wrong-step');
    const result = validateCheckpoint({ owner, index, expectedIndex: this.moveCheckpointIndex });
    if (!result.accepted) return this.#reject(result.reason);
    this.moveCheckpointIndex += 1;
    if (this.moveCheckpointIndex >= 3) this.#advance(TUTORIAL_STATES.aimAndFire);
    return true;
  }
  stationaryTarget(payload) {
    if (this.state !== TUTORIAL_STATES.aimAndFire || this.paused) return this.#reject('wrong-step');
    const result = validateStationaryTarget(payload);
    return result.accepted ? this.#advance(TUTORIAL_STATES.dashGate) : this.#reject(result.reason);
  }
  dashGate(payload) {
    if (this.state !== TUTORIAL_STATES.dashGate || this.paused) return this.#reject('wrong-step');
    const result = validateDashGate(payload);
    return result.accepted ? this.#advance(TUTORIAL_STATES.recordPath) : this.#reject(result.reason);
  }
  pathCheckpoint(index, owner = 'player') {
    if (this.state !== TUTORIAL_STATES.recordPath || this.paused) return this.#reject('wrong-step');
    const result = validateCheckpoint({ owner, index, expectedIndex: this.pathCheckpointIndex });
    if (!result.accepted) return this.#reject(result.reason);
    this.pathCheckpointIndex += 1;
    return true;
  }
  recordingQualified({ fireEvents, spanMs }) {
    if (this.state !== TUTORIAL_STATES.recordPath || this.paused) return this.#reject('wrong-step');
    const result = validateRecording({ pathCount: this.pathCheckpointIndex, fireEvents, spanMs });
    return result.accepted ? this.#advance(TUTORIAL_STATES.deployEcho) : this.#reject(result.reason);
  }
  echoDeployed(payload) {
    if (this.state !== TUTORIAL_STATES.deployEcho || this.paused) return this.#reject('wrong-step');
    const result = validateEchoDeployment(payload);
    return result.accepted ? this.#advance(TUTORIAL_STATES.enterSignalGate) : this.#reject(result.reason);
  }
  echoRearHit(payload) {
    if (this.state !== TUTORIAL_STATES.deployEcho || this.paused) return this.#reject('wrong-step');
    const result = validateEchoRearHit(payload);
    return result.accepted ? this.#advance(TUTORIAL_STATES.enterSignalGate) : this.#reject(result.reason);
  }
  signalGate(payload, timeMs = 0) {
    if (this.state !== TUTORIAL_STATES.enterSignalGate || this.paused) return this.#reject('wrong-step');
    const result = validateSignalGate(payload);
    if (!result.accepted) return this.#reject(result.reason);
    this.completed = true;
    this.completedAtMs = Number(timeMs) || 0;
    this.#advance(TUTORIAL_STATES.complete);
    this.eventBus?.emit('tutorial:completed', { durationMs: Math.max(0, this.completedAtMs - (this.startedAtMs ?? this.completedAtMs)), entrySource: this.entrySource });
    return true;
  }
  retryRecording() {
    if (![TUTORIAL_STATES.recordPath, TUTORIAL_STATES.deployEcho].includes(this.state)) return false;
    this.pathCheckpointIndex = 0;
    this.state = TUTORIAL_STATES.recordPath;
    this.stepIndex = TUTORIAL_SEQUENCE.indexOf(this.state);
    this.eventBus?.emit('tutorial:retry', { state: this.state });
    return true;
  }
  skip(timeMs = 0) {
    if (this.completed || this.state === TUTORIAL_STATES.exiting) return false;
    const previous = this.state;
    this.completed = true;
    this.completedAtMs = Number(timeMs) || 0;
    this.state = TUTORIAL_STATES.complete;
    this.stepIndex = TUTORIAL_SEQUENCE.indexOf(this.state);
    this.transitionCount += 1;
    this.eventBus?.emit('tutorial:step:completed', { state: previous, skipped: true });
    this.eventBus?.emit('tutorial:step:entered', { state: this.state, stepIndex: this.stepIndex, skipped: true });
    this.eventBus?.emit('tutorial:skipped', { entrySource: this.entrySource });
    this.eventBus?.emit('tutorial:completed', {
      durationMs: Math.max(0, this.completedAtMs - (this.startedAtMs ?? this.completedAtMs)),
      entrySource: this.entrySource,
      skipped: true,
    });
    return true;
  }
  markExiting() { if (this.completed) this.state = TUTORIAL_STATES.exiting; }
  snapshot() {
    return Object.freeze({ state: this.state, stepIndex: this.stepIndex, moveCheckpointIndex: this.moveCheckpointIndex, pathCheckpointIndex: this.pathCheckpointIndex, completed: this.completed, paused: this.paused, transitionCount: this.transitionCount, invalidActionCount: this.invalidActions.length });
  }
  #advance(next) {
    const currentIndex = TUTORIAL_SEQUENCE.indexOf(this.state);
    const nextIndex = TUTORIAL_SEQUENCE.indexOf(next);
    if (nextIndex !== currentIndex + 1) return this.#reject('invalid-transition');
    const previous = this.state;
    this.state = next;
    this.stepIndex = nextIndex;
    this.transitionCount += 1;
    this.eventBus?.emit('tutorial:step:completed', { state: previous });
    this.eventBus?.emit('tutorial:step:entered', { state: next, stepIndex: nextIndex });
    return true;
  }
  #reject(reason) {
    this.invalidActions.push({ state: this.state, reason });
    if (this.invalidActions.length > 100) this.invalidActions.shift();
    this.eventBus?.emit('tutorial:invalid-action', { state: this.state, reason });
    return false;
  }
}
