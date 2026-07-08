export class DirectorDebugController {
  constructor({ director, generator, enemyManager, carrierShardManager, suppressionService }) { Object.assign(this, { director, generator, enemyManager, carrierShardManager, suppressionService }); }
  descriptor() { return structuredClone(this.director.currentDescriptor); }
  snapshot() { return { director: this.director.snapshot(), enemies: this.enemyManager.getDiagnostics(), carrierShards: this.carrierShardManager?.getDiagnostics?.() ?? null, suppression: this.suppressionService?.snapshot?.() ?? null }; }
  clearEnemies() { this.enemyManager.clear('debug-clear'); }
  forceRecovery() { const descriptor = this.director.currentDescriptor; if (descriptor) this.director.recoveryController.start(2500); }
}
