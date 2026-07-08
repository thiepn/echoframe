export const DIFFICULTIES = Object.freeze({
  relaxed: Object.freeze({
    id: 'relaxed',
    label: 'Relaxed',
    description: 'Longer warnings and lower pressure. The same mechanics and content.',
    unlockedByDefault: true,
  }),
  standard: Object.freeze({
    id: 'standard',
    label: 'Standard',
    description: 'The intended ECHOFRAME experience.',
    unlockedByDefault: true,
  }),
  overclocked: Object.freeze({
    id: 'overclocked',
    label: 'Overclocked',
    description: 'Higher pressure and faster escalation. Unlocks after a Standard victory.',
    unlockedByDefault: false,
  }),
});

export const DIFFICULTY_ORDER = Object.freeze([
  DIFFICULTIES.relaxed.id,
  DIFFICULTIES.standard.id,
  DIFFICULTIES.overclocked.id,
]);
