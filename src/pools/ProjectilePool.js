import { ObjectPool } from './ObjectPool.js';

export class ProjectilePool {
  constructor(options) {
    this.pool = new ObjectPool(options);
  }

  acquire(activationData) {
    const projectile = this.pool.acquire();
    if (!projectile) {
      return null;
    }
    projectile.activate(activationData);
    return projectile;
  }

  release(projectile, reason = 'released') {
    if (!this.pool.active.has(projectile)) {
      return false;
    }
    projectile.deactivate(reason);
    return this.pool.release(projectile);
  }

  releaseAll(reason = 'release-all') {
    this.pool.releaseAll((projectile) => projectile.deactivate(reason));
  }

  destroy() {
    this.pool.destroy((projectile) => projectile.destroy());
  }

  get activeItems() {
    return this.pool.active;
  }

  diagnostics() {
    return this.pool.diagnostics();
  }
}
