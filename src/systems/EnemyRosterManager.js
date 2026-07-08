export class EnemyRosterManager {
  constructor(enemyManager) { this.enemyManager = enemyManager; }
  spawn(type, point, metadata) { return this.enemyManager.spawn(type, point, metadata); }
  clearType(type, reason = 'roster-clear') { for (const enemy of [...this.enemyManager.activeEnemies]) if (enemy.type === type) this.enemyManager.deactivate(enemy, reason); }
  countsByType() { return this.enemyManager.countsByType(); }
  countsByRole() { return this.enemyManager.countsByRole(); }
  snapshot() { return { active: this.enemyManager.activeCount, countsByType: this.countsByType(), countsByRole: this.countsByRole() }; }
}
