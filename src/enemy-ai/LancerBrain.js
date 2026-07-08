import { ENEMY_STATES } from './EnemyStateMachine.js';
import { combinedSteering } from './enemySteering.js';

export class LancerBrain {
  constructor(enemy) { this.enemy = enemy; this.reset(); }
  reset() { this.lockedDirection = { x: 1, y: 0 }; this.chargeStart = { x: 0, y: 0 }; this.attackEventId = 0; }
  update(delta, context) {
    const enemy = this.enemy;
    enemy.state.update(delta);
    if (enemy.state.is(ENEMY_STATES.spawning)) {
      enemy.setVelocity(0, 0);
      if (enemy.state.elapsedMs >= enemy.spawnDurationMs) enemy.activateFromSpawn();
      return;
    }
    if (enemy.state.is(ENEMY_STATES.active)) {
      const distance = Math.hypot(context.player.x - enemy.x, context.player.y - enemy.y);
      if (distance <= enemy.maximumCharge * 1.1) {
        const direction = enemy.directionTo(context.player);
        const validation = enemy.endpointValidator(enemy, context.player, direction);
        const valid = typeof validation === 'boolean' ? validation : validation?.valid;
        if (valid) {
          this.lockedDirection = direction;
          enemy.setVelocity(0, 0);
          enemy.beginAnticipation(this.lockedDirection, validation?.maximumDistance ?? enemy.maximumCharge);
          context.telegraph?.(enemy, this.lockedDirection, validation);
          return;
        }
      }
      const velocity = combinedSteering(enemy, context.player, context.neighbours, enemy.moveSpeed, 82, 72);
      enemy.setVelocity(velocity.x, velocity.y);
      enemy.renderer.setRotation(Math.atan2(velocity.y, velocity.x));
      return;
    }
    if (enemy.state.is(ENEMY_STATES.anticipation)) {
      enemy.setVelocity(0, 0);
      this.lockedDirection = enemy.directionTo(context.player);
      const validation = enemy.endpointValidator(enemy, context.player, this.lockedDirection);
      const valid = typeof validation === 'boolean' ? validation : validation?.valid;
      if (!valid) {
        enemy.cancelAnticipation();
        return;
      }
      enemy.currentChargeDistance = Math.max(0, Math.min(enemy.maximumCharge, validation?.maximumDistance ?? enemy.maximumCharge));
      enemy.renderer.setLaneLength?.(enemy.currentChargeDistance);
      enemy.renderer.setRotation(Math.atan2(this.lockedDirection.y, this.lockedDirection.x));
      if (enemy.state.elapsedMs >= enemy.telegraphMs) enemy.beginLock();
      return;
    }
    if (enemy.state.is(ENEMY_STATES.lock)) {
      enemy.setVelocity(0, 0);
      if (enemy.state.elapsedMs >= enemy.lockMs) {
        if (context.requestMajorExecution && !context.requestMajorExecution(enemy, 'lancer-charge')) return;
        this.chargeStart = { x: enemy.x, y: enemy.y };
        this.attackEventId += 1;
        enemy.beginExecution();
        context.commit?.(enemy, this.lockedDirection, this.attackEventId);
      }
      return;
    }
    if (enemy.state.is(ENEMY_STATES.execution)) {
      enemy.setVelocity(this.lockedDirection.x * enemy.chargeSpeed, this.lockedDirection.y * enemy.chargeSpeed);
      const travelled = Math.hypot(enemy.x - this.chargeStart.x, enemy.y - this.chargeStart.y);
      if (travelled >= enemy.currentChargeDistance || enemy.bodySprite.body.blocked.left || enemy.bodySprite.body.blocked.right || enemy.bodySprite.body.blocked.up || enemy.bodySprite.body.blocked.down) {
        enemy.setVelocity(0, 0);
        enemy.beginRecovery();
      }
      return;
    }
    if (enemy.state.is(ENEMY_STATES.recovery)) {
      enemy.setVelocity(0, 0);
      if (enemy.state.elapsedMs >= enemy.recoveryMs) enemy.finishRecovery();
      return;
    }
    enemy.setVelocity(0, 0);
  }
}
