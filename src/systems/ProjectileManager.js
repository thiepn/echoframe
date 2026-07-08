import { PLAYER_BALANCE } from '../data/playerBalance.js';
import { PlayerProjectile } from '../entities/PlayerProjectile.js';
import { ProjectilePool } from '../pools/ProjectilePool.js';

export class ProjectileManager {
  constructor({ scene, eventBus, settingsManager, statistics, arenaBounds }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.settingsManager = settingsManager;
    this.statistics = statistics;
    this.arenaBounds = arenaBounds;
    this.group = scene.physics.add.group({ allowGravity: false, immovable: false });
    this.nextActivationId = 1;
    this.pool = new ProjectilePool({
      factory: () => {
        const projectile = new PlayerProjectile(scene);
        this.group.add(projectile);
        return projectile;
      },
      initialCapacity: PLAYER_BALANCE.projectilePool.initialCapacity,
      expansionChunk: PLAYER_BALANCE.projectilePool.expansionChunk,
      hardCap: PLAYER_BALANCE.projectilePool.hardCap,
      onExhausted: (diagnostics) => {
        console.warn('Player projectile pool exhausted.', diagnostics);
      },
    });
  }

  activate(data) {
    const projectile = this.pool.acquire({
      ...data,
      activationId: this.nextActivationId,
      highContrast: this.settingsManager.get('visual.highContrast', false),
    });
    if (!projectile) {
      return null;
    }
    this.nextActivationId += 1;
    const diagnostics = this.pool.diagnostics();
    if (this.statistics.recordPlayerPoolUsage) {
      this.statistics.recordPlayerPoolUsage(diagnostics.active);
    } else {
      this.statistics.recordPoolUsage(diagnostics.active);
    }
    this.eventBus.emit('projectile:activated', {
      activationId: projectile.activationId,
      x: projectile.x,
      y: projectile.y,
    });
    return projectile;
  }

  update(deltaMs) {
    const margin = 80;
    for (const projectile of this.pool.activeItems) {
      const lifetimeValid = projectile.updateLifetime(deltaMs);
      const inside =
        projectile.x >= this.arenaBounds.left - margin &&
        projectile.x <= this.arenaBounds.right + margin &&
        projectile.y >= this.arenaBounds.top - margin &&
        projectile.y <= this.arenaBounds.bottom + margin;
      if (!lifetimeValid) {
        this.deactivate(projectile, 'lifetime');
      } else if (!inside) {
        this.deactivate(projectile, 'outside-arena');
      }
    }
  }

  deactivate(projectile, reason) {
    if (!projectile?.active) {
      return false;
    }
    const activationId = projectile.activationId;
    const released = this.pool.release(projectile, reason);
    if (released) {
      this.eventBus.emit('projectile:deactivated', { activationId, reason });
    }
    return released;
  }

  clear(reason = 'clear') {
    for (const projectile of [...this.pool.activeItems]) {
      this.deactivate(projectile, reason);
    }
  }

  getDiagnostics() {
    return this.pool.diagnostics();
  }

  setArenaBounds(bounds) { this.arenaBounds = bounds; }

  destroy() {
    this.clear('destroy');
    this.pool.destroy();
    this.group.destroy(true);
  }
}
