export function createEliteModifierDefinition(input) {
  if (!input?.id) throw new Error('Elite modifier definition requires an id.');
  return Object.freeze({ ...input, tags: Object.freeze([...(input.tags ?? [])]) });
}
