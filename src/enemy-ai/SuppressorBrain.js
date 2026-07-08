import { ENEMY_STATES } from './EnemyStateMachine.js';
import { orbitVelocity } from './enemySteering.js';

export class SuppressorBrain {
  constructor(enemy) { this.enemy = enemy; this.reset(); }
  reset() { this.relocationRemainingMs = 0; }
  update(delta, context) {
    const enemy = this.enemy;
    enemy.state.update(delta);
    if (enemy.state.is(ENEMY_STATES.spawning)) {
      enemy.setVelocity(0, 0);
      if (enemy.state.elapsedMs >= enemy.spawnDurationMs) enemy.activateFromSpawn();
      return;
    }
    if (enemy.state.is(ENEMY_STATES.active)) {
      enemy.setVelocity(0, 0);
      enemy.beginAnticipation();
      context.anticipate?.(enemy);
      return;
    }
    if (enemy.state.is(ENEMY_STATES.anticipation)) {
      enemy.setVelocity(0, 0);
      if (enemy.state.elapsedMs >= enemy.fieldSetupMs) {
        if (context.requestMajorExecution && !context.requestMajorExecution(enemy, 'suppressor-field')) return;
        enemy.beginField();
        this.relocationRemainingMs = enemy.relocationIntervalMs;
        context.fieldStarted?.(enemy);
      }
      return;
    }
    if (enemy.state.is(ENEMY_STATES.execution)) {
      const velocity = orbitVelocity(enemy, context.player, 300, 470, enemy.moveSpeed, -1);
      enemy.setVelocity(velocity.x, velocity.y);
      this.relocationRemainingMs -= delta;
      if (this.relocationRemainingMs <= 0) {
        enemy.endField();
        context.fieldEnded?.(enemy);
      }
      return;
    }
    if (enemy.state.is(ENEMY_STATES.recovery)) {
      const velocity = orbitVelocity(enemy, context.player, 360, 520, enemy.moveSpeed, 1);
      enemy.setVelocity(velocity.x, velocity.y);
      if (enemy.state.elapsedMs >= 700) enemy.finishRecovery();
      return;
    }
    enemy.setVelocity(0, 0);
  }
}
