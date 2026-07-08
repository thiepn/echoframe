export const TUTORIAL_ARENA = Object.freeze({
  id: 'first-signal-tutorial',
  bounds: Object.freeze({ left: 80, right: 1520, top: 150, bottom: 840 }),
  playerSpawn: Object.freeze({ x: 220, y: 720 }),
  movementCheckpoints: Object.freeze([
    Object.freeze({ x: 420, y: 720 }), Object.freeze({ x: 650, y: 640 }), Object.freeze({ x: 850, y: 540 }),
  ]),
  stationaryTarget: Object.freeze({ x: 1120, y: 540 }),
  dashGate: Object.freeze({ x: 1320, y: 540, width: 80, height: 190 }),
  recordingPath: Object.freeze([
    Object.freeze({ x: 980, y: 740 }), Object.freeze({ x: 1240, y: 720 }),
    Object.freeze({ x: 1370, y: 520 }), Object.freeze({ x: 1370, y: 310 }),
  ]),
  shieldTarget: Object.freeze({ x: 1080, y: 310, frontDirection: Object.freeze({ x: -1, y: 0 }) }),
  signalGate: Object.freeze({ x: 230, y: 250, radius: 64 }),
});
