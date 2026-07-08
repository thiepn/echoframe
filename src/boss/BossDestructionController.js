import { BOSS_BALANCE } from '../data/bossBalance.js';
export class BossDestructionController {
  constructor({ firstVictory = true, renderer = null, onComplete = null, telemetry = null } = {}) { Object.assign(this,{firstVictory,renderer,onComplete,telemetry}); this.reset(); }
  reset(){this.active=false;this.completed=false;this.skipped=false;this.elapsedMs=0;this.totalMs=BOSS_BALANCE.destruction.freezeMs+BOSS_BALANCE.destruction.destabilizeMs+BOSS_BALANCE.destruction.fractureStageMs*3+BOSS_BALANCE.destruction.settleMs;}
  start(){if(this.active||this.completed)return false;this.active=true;this.elapsedMs=0;return true;}
  get canSkip(){return this.active&&!this.firstVictory;}
  skip(){if(!this.canSkip)return false;this.skipped=true;this.elapsedMs=this.totalMs;this.#finish();return true;}
  update(deltaMs){if(!this.active||this.completed)return;this.elapsedMs+=Math.max(0,Number(deltaMs)||0);this.renderer?.beginDestruction?.(Math.min(1,this.elapsedMs/this.totalMs));if(this.elapsedMs>=this.totalMs)this.#finish();}
  snapshot(){return Object.freeze({active:this.active,completed:this.completed,skipped:this.skipped,elapsedMs:this.elapsedMs,totalMs:this.totalMs,canSkip:this.canSkip});}
  #finish(){if(this.completed)return;this.active=false;this.completed=true;if(this.skipped)this.telemetry?.increment('destructionSkipped');this.onComplete?.({skipped:this.skipped,durationMs:this.elapsedMs});}
}
