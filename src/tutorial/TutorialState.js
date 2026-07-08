export const TUTORIAL_STATES = Object.freeze({
  intro: 'INTRO',
  moveCheckpoints: 'MOVE_CHECKPOINTS',
  aimAndFire: 'AIM_AND_FIRE',
  dashGate: 'DASH_GATE',
  recordPath: 'RECORD_PATH',
  deployEcho: 'DEPLOY_ECHO',
  enterSignalGate: 'ENTER_SIGNAL_GATE',
  complete: 'COMPLETE',
  exiting: 'EXITING',
});

export const TUTORIAL_SEQUENCE = Object.freeze([
  TUTORIAL_STATES.intro,
  TUTORIAL_STATES.moveCheckpoints,
  TUTORIAL_STATES.aimAndFire,
  TUTORIAL_STATES.dashGate,
  TUTORIAL_STATES.recordPath,
  TUTORIAL_STATES.deployEcho,
  TUTORIAL_STATES.enterSignalGate,
  TUTORIAL_STATES.complete,
]);
