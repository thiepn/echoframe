export const FACTIONS = Object.freeze({ player: 'PLAYER', echo: 'ECHO', enemy: 'ENEMY', neutral: 'NEUTRAL' });
export function canDamage(source, target) {
  return (source === FACTIONS.player || source === FACTIONS.echo) ? target === FACTIONS.enemy : source === FACTIONS.enemy && target === FACTIONS.player;
}
