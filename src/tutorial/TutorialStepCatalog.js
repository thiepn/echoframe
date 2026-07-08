import { TUTORIAL_STATES } from './TutorialState.js';

export const TUTORIAL_THRESHOLDS = Object.freeze({
  checkpointRadius: 50,
  recordingMinimumMs: 3500,
  recordingPathCheckpoints: 4,
  recordingFireEvents: 4,
});

export const TUTORIAL_STEPS = Object.freeze({
  [TUTORIAL_STATES.intro]: { number: 0, title: 'First Signal', objective: 'Move or press Enter to begin.' },
  [TUTORIAL_STATES.moveCheckpoints]: { number: 1, title: 'Movement', objective: 'Move through the three signal markers in order.' },
  [TUTORIAL_STATES.aimAndFire]: { number: 2, title: 'Aim and fire', objective: 'Aim with the pointer and destroy the stationary target.' },
  [TUTORIAL_STATES.dashGate]: { number: 3, title: 'Dash', objective: 'Dash through the striped gate. Walking does not count.' },
  [TUTORIAL_STATES.recordPath]: { number: 4, title: 'Record a path', objective: 'Follow the marked path while firing. Build at least 3.5 seconds of history.' },
  [TUTORIAL_STATES.deployEcho]: { number: 5, title: 'Deploy an Echo', objective: 'Deploy your Echo. Its replay must strike the shield target from behind.' },
  [TUTORIAL_STATES.enterSignalGate]: { number: 6, title: 'Enter combat', objective: 'Enter the open signal gate.' },
  [TUTORIAL_STATES.complete]: { number: 6, title: 'Signal restored', objective: 'Tutorial complete.' },
});
