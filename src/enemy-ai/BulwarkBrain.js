import { ENEMY_STATES } from './EnemyStateMachine.js';
import { combinedSteering, rotateToward } from './enemySteering.js';

export class BulwarkBrain {
  constructor(enemy) { this.enemy = enemy; }
  reset() {}
  update(delta, context) {
    const enemy = this.enemy;
    enemy.state.update(delta);
    if (enemy.state.is(ENEMY_STATES.spawning)) {
      enemy.setVelocity(0, 0);
      if (enemy.state.elapsedMs >= enemy.spawnDurationMs) enemy.activateFromSpawn();
      return;
    }
    const targetAngle = Math.atan2(context.player.y - enemy.y, context.player.x - enemy.x);
    const maximumTurn = enemy.turnSpeedRadiansPerSecond * delta / 1000;
    enemy.shieldAngle = rotateToward(enemy.shieldAngle, targetAngle, maximumTurn);
    enemy.renderer.setRotation(enemy.shieldAngle);
    enemy.updateRearPressure(delta);
    if (enemy.state.is(ENEMY_STATES.staggered)) {
      enemy.setVelocity(0, 0);
      if (enemy.state.elapsedMs >= enemy.staggerMs) enemy.finishStagger();
      return;
    }
    if (enemy.state.is(ENEMY_STATES.active)) {
      const velocity = combinedSteering(enemy, context.player, context.neighbours, enemy.moveSpeed, 92, 55);
      enemy.setVelocity(velocity.x, velocity.y);
      return;
    }
    enemy.setVelocity(0, 0);
  }
}
