export const ARENA_TRANSFORMS = Object.freeze({
  identity: Object.freeze({ id: 'identity', rotationDegrees: 0, mirrorX: false, mirrorY: false }),
  'rotate-180': Object.freeze({ id: 'rotate-180', rotationDegrees: 180, mirrorX: false, mirrorY: false }),
  'mirror-x': Object.freeze({ id: 'mirror-x', rotationDegrees: 0, mirrorX: true, mirrorY: false }),
  'mirror-y': Object.freeze({ id: 'mirror-y', rotationDegrees: 0, mirrorX: false, mirrorY: true }),
  'rotate-90': Object.freeze({ id: 'rotate-90', rotationDegrees: 90, mirrorX: false, mirrorY: false }),
  'rotate-270': Object.freeze({ id: 'rotate-270', rotationDegrees: 270, mirrorX: false, mirrorY: false }),
});
