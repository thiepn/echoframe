import { ECHO_BALANCE } from '../data/echoBalance.js';
import { EchoProjectile } from '../entities/EchoProjectile.js';
import { ProjectilePool } from '../pools/ProjectilePool.js';

export class EchoProjectileManager {
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
        const projectile = new EchoProjectile(scene);
        this.group.add(projectile);
        return projectile;
      },
      initialCapacity: ECHO_BALANCE.projectilePool.initialCapacity,
      expansionChunk: ECHO_BALANCE.projectilePool.expansionChunk,
      hardCap: ECHO_BALANCE.projectilePool.hardCap,
      onExhausted: (diagnostics) => console.warn('Echo projectile pool exhausted.', diagnostics),
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
    this.statistics.recordEchoPoolUsage(diagnostics.active);
    this.eventBus.emit('echo:projectile:activated', {
      activationId: projectile.activationId,
      ownerId: projectile.ownerId,
      sourceEventId: projectile.sourceEventId,
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
    const payload = {
      activationId: projectile.activationId,
      ownerId: projectile.ownerId,
      sourceEventId: projectile.sourceEventId,
      reason,
    };
    const released = this.pool.release(projectile, reason);
    if (released) {
      this.eventBus.emit('echo:projectile:deactivated', payload);
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
