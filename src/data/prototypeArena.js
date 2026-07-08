import {
  COMBAT_SAFE_HEIGHT,
  COMBAT_SAFE_WIDTH,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
} from './constants.js';

const centerX = DESIGN_WIDTH / 2;
const centerY = DESIGN_HEIGHT / 2;
const left = centerX - COMBAT_SAFE_WIDTH / 2;
const right = centerX + COMBAT_SAFE_WIDTH / 2;
const top = centerY - COMBAT_SAFE_HEIGHT / 2;
const bottom = centerY + COMBAT_SAFE_HEIGHT / 2;
const wallThickness = 48;

export const PROTOTYPE_ARENA = Object.freeze({
  id: 'echo-prototype-arena',
  bounds: Object.freeze({ left, right, top, bottom }),
  spawn: Object.freeze({ x: centerX, y: 735 }),
  terminal: Object.freeze({ x: centerX, y: 125 }),
  walls: Object.freeze([
    Object.freeze({ id: 'outer-top', x: centerX, y: top + wallThickness / 2, width: COMBAT_SAFE_WIDTH, height: wallThickness }),
    Object.freeze({ id: 'outer-bottom', x: centerX, y: bottom - wallThickness / 2, width: COMBAT_SAFE_WIDTH, height: wallThickness }),
    Object.freeze({ id: 'outer-left', x: left + wallThickness / 2, y: centerY, width: wallThickness, height: COMBAT_SAFE_HEIGHT - wallThickness * 2 }),
    Object.freeze({ id: 'outer-right', x: right - wallThickness / 2, y: centerY, width: wallThickness, height: COMBAT_SAFE_HEIGHT - wallThickness * 2 }),
    Object.freeze({ id: 'north-west', x: 410, y: 300, width: 220, height: 52 }),
    Object.freeze({ id: 'north-east', x: 1190, y: 300, width: 220, height: 52 }),
    Object.freeze({ id: 'south-west', x: 410, y: 610, width: 220, height: 52 }),
    Object.freeze({ id: 'south-east', x: 1190, y: 610, width: 220, height: 52 }),
    Object.freeze({ id: 'center-north', x: 800, y: 350, width: 52, height: 190 }),
    Object.freeze({ id: 'center-south', x: 800, y: 565, width: 52, height: 150 }),
  ]),
  targets: Object.freeze([
    Object.freeze({ id: 'target-1', x: 235, y: 150 }),
    Object.freeze({ id: 'target-2', x: 500, y: 165 }),
    Object.freeze({ id: 'target-3', x: 1100, y: 165 }),
    Object.freeze({ id: 'target-4', x: 1365, y: 150 }),
    Object.freeze({ id: 'target-5', x: 250, y: 742 }),
    Object.freeze({ id: 'target-6', x: 520, y: 720 }),
    Object.freeze({ id: 'target-7', x: 1080, y: 720 }),
    Object.freeze({ id: 'target-8', x: 1350, y: 742 }),
  ]),
});
