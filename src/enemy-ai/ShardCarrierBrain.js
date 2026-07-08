import { ENEMY_STATES } from './EnemyStateMachine.js';
import { orbitVelocity } from './enemySteering.js';

export class ShardCarrierBrain {
  constructor(enemy) { this.enemy = enemy; this.reset(); }
  reset() { this.clockwise = 1; }
  update(delta, context) {
    const enemy = this.enemy;
    enemy.state.update(delta);
    if (enemy.state.is(ENEMY_STATES.spawning)) {
      enemy.setVelocity(0, 0);
      if (enemy.state.elapsedMs >= enemy.spawnDurationMs) enemy.activateFromSpawn();
      return;
    }
    if (enemy.state.is(ENEMY_STATES.active)) {
      const velocity = orbitVelocity(enemy, context.player, enemy.preferredRangeMin, enemy.preferredRangeMax, enemy.moveSpeed, this.clockwise);
      enemy.setVelocity(velocity.x, velocity.y);
      return;
    }
    enemy.setVelocity(0, 0);
  }
}
