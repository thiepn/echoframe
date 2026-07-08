import { BOSS_BALANCE } from '../data/bossBalance.js';
import { createDrifterSummonPlan } from '../boss/attacks/DrifterSummonAttack.js';
export class BossSummonController {
  constructor({ enemyManager, rng, telemetry, eventBus, sockets = [] }){Object.assign(this,{enemyManager,rng,telemetry,eventBus,sockets});this.pending=[];}
  summon(phase,player){const plan=createDrifterSummonPlan({rng:this.rng,phase,sockets:this.sockets.filter(s=>Math.hypot(s.x-player.x,s.y-player.y)>=260),activeThreat:this.activeThreat,threatCap:BOSS_BALANCE.addThreatCap});for(const socket of plan.sockets)this.pending.push({remainingMs:plan.spawnMs,socket});this.telemetry?.increment('summons',plan.count);this.telemetry?.observeMaximum('maximumSummons',this.activeThreat+plan.count);this.eventBus?.emit('boss:summon:warning',{plan});return plan;}
  update(deltaMs){for(let i=this.pending.length-1;i>=0;i--){const item=this.pending[i];item.remainingMs-=deltaMs;if(item.remainingMs<=0){const enemy=this.enemyManager.spawn('drifter',item.socket,{descriptorId:'boss-summon'});if(enemy){enemy.bossOwned=true;enemy.spawnAttackLockoutMs=700;}this.pending.splice(i,1);}}}
  clear(reason='boss-clear'){this.pending=[];for(const enemy of [...this.enemyManager.activeEnemies])if(enemy.bossOwned)this.enemyManager.deactivate(enemy,reason);}
  get activeThreat(){return this.enemyManager.activeEnemies.filter(e=>e.bossOwned).reduce((sum,e)=>sum+(e.threatCost||1),0);}
  snapshot(){return Object.freeze({activeThreat:this.activeThreat,activeCount:this.enemyManager.activeEnemies.filter(e=>e.bossOwned).length,pendingCount:this.pending.length});}
}
