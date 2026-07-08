import { RunPlanGenerator, RUN_PLAN_GENERATIONS } from '../run/RunPlanGenerator.js';
import { RunState } from './RunState.js';

export class GameState {
  constructor() {
    this.activeRun = null;
    this.lastResult = null;
  }

  createRun(options = {}) {
    this.disposeRun();
    const resolved = {
      ...options,
      runPlanGenerator: options.runPlanGenerator ?? new RunPlanGenerator({ generationVersion: RUN_PLAN_GENERATIONS.phase8 }),
    };
    this.activeRun = new RunState(resolved);
    this.activeRun.start();
    return this.activeRun;
  }

  completeRun(result) {
    if (this.activeRun) this.activeRun.complete();
    this.lastResult = structuredClone(result);
  }

  disposeRun() {
    this.activeRun?.dispose();
    this.activeRun = null;
  }
}
