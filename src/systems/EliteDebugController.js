export class EliteDebugController {
  constructor(eliteManager) { this.eliteManager = eliteManager; }
  snapshot() { return this.eliteManager.snapshot(); }
  forceReplicationThreshold(enemyId) { const controller = this.eliteManager.controllerForEnemyId(enemyId); if (!controller || controller.modifierId !== 'replicating') return false; return controller.onAcceptedDamage({ remainingHealth: controller.enemy.health.maximumHealth * 0.49, targetDefeated: false }); }
  grantResonantShield(enemyId) { const controller = this.eliteManager.controllerForEnemyId(enemyId); if (!controller || controller.modifierId !== 'resonant') return false; return controller.onAlliedDeath({ x: controller.enemy.x + 10, y: controller.enemy.y, distance: 10, deathEventId: `debug-${Date.now()}` }); }
}
