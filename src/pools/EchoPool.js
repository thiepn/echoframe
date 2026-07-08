import { ECHO_BALANCE } from '../data/echoBalance.js';
import { Echo } from '../entities/Echo.js';
import { ObjectPool } from './ObjectPool.js';

export class EchoPool {
  constructor({ scene, settingsManager }) {
    this.pool = new ObjectPool({
      factory: (index) => new Echo(scene, settingsManager, index),
      initialCapacity: ECHO_BALANCE.playback.maximumFutureActiveCap,
      expansionChunk: 1,
      hardCap: ECHO_BALANCE.playback.maximumFutureActiveCap,
    });
  }

  acquire(data) {
    const echo = this.pool.acquire();
    if (!echo) {
      return null;
    }
    echo.activate(data);
    return echo;
  }

  release(echo) {
    if (!this.pool.active.has(echo)) {
      return false;
    }
    echo.forceDeactivate();
    return this.pool.release(echo);
  }

  releaseAll() {
    this.pool.releaseAll((echo) => echo.forceDeactivate());
  }

  destroy() {
    this.pool.destroy((echo) => echo.destroy());
  }

  get activeItems() {
    return this.pool.active;
  }

  diagnostics() {
    return this.pool.diagnostics();
  }
}
