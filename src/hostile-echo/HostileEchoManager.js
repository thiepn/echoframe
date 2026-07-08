import { ObjectPool } from '../pools/ObjectPool.js';
import { HostileEcho } from './HostileEcho.js';
import { HOSTILE_ECHO_DEFINITION } from '../data/hostileEchoDefinitions.js';

export class HostileEchoManager {
  constructor({ scene, eventBus, projectileManager, telemetry, settingsManager }) {
    Object.assign(this, { scene, eventBus, projectileManager, telemetry, settingsManager });
    this.nextInstanceId = 1;
    this.pool = new ObjectPool({ factory: () => new HostileEcho(scene, settingsManager), initialCapacity: 2, expansionChunk: 1, hardCap: HOSTILE_ECHO_DEFINITION.maximumCopies, onExhausted: (diagnostics) => this.eventBus?.emit('boss:hostile-echo:pool-exhausted', diagnostics) });
  }
  spawn(descriptor) {
    const echo = this.pool.acquire();
    if (!echo) { this.telemetry?.increment('hostileEchoesRejected'); return null; }
    echo.activate({ instanceId: `hostile-echo-${this.nextInstanceId++}`, descriptor });
    this.telemetry?.increment('hostileEchoesSpawned');
    this.telemetry?.observeMaximum('maximumHostileEchoes', this.pool.active.size);
    this.eventBus?.emit('boss:hostile-echo:spawned', { instanceId: echo.instanceId, x: echo.x, y: echo.y, phase: descriptor.phase });
    return echo;
  }
  update(deltaMs) {
    for (const echo of [...this.pool.active]) if (!echo.update(deltaMs, (entity,event) => this.#fire(entity,event))) this.deactivate(echo,'lifetime');
  }
  deactivate(echo, reason = 'deactivate') {
    if (!this.pool.active.has(echo)) return false;
    const payload = { instanceId: echo.instanceId, reason };
    echo.deactivate(reason);
    const released = this.pool.release(echo);
    if (released) { this.telemetry?.increment('hostileEchoesDestroyed'); this.eventBus?.emit('boss:hostile-echo:deactivated', payload); }
    return released;
  }
  clear(reason='clear'){for(const echo of [...this.pool.active])this.deactivate(echo,reason);}
  get activeEchoes(){return [...this.pool.active];}
  get activeCount(){return this.pool.active.size;}
  getDiagnostics(){return{...this.pool.diagnostics(),echoes:this.activeEchoes.map(e=>({instanceId:e.instanceId,x:e.x,y:e.y,remainingMs:e.remainingMs}))};}
  destroy(){this.clear('destroy');this.pool.destroy((echo)=>echo.destroy());}
  #fire(echo,event){const length=Math.hypot(event.aimX,event.aimY)||1;const direction={x:event.aimX/length,y:event.aimY/length};const profileId=echo.descriptor.phase==='DELETE'?'hostileEcho3':'hostileEcho2';const projectile=this.projectileManager.activate({profileId,x:echo.x+direction.x*30,y:echo.y+direction.y*30,direction,ownerId:echo.instanceId,sourceType:'hostile-echo-projectile'});if(projectile){this.telemetry?.increment('hostileEchoShots');this.eventBus?.emit('boss:hostile-echo:fired',{instanceId:echo.instanceId,activationId:projectile.activationId});}}
}
