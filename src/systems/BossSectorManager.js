import { BOSS_SECTOR_STATES, BOSS_SECTOR_RULES } from '../data/bossSectorDefinitions.js';
import { createSectorDeletionPlan } from '../boss/attacks/SectorDeletionAttack.js';

const CELL_ORDER = Object.freeze(['nw','n','ne','w','c','e','sw','s','se']);
export class BossSectorManager {
  constructor({ scene, rng, arenaBounds, telemetry, eventBus, damagePlayer, settingsManager }) {
    Object.assign(this,{scene,rng,arenaBounds,telemetry,eventBus,damagePlayer,settingsManager});
    this.graphics = scene.add.graphics().setDepth(12);
    this.lastOutlineWidth = 0;
    this.previousPatternId = null;
    this.reset();
  }
  reset(){this.state=BOSS_SECTOR_STATES.safe;this.remainingMs=0;this.plan=null;this.tickRemainingMs=BOSS_SECTOR_RULES.tickMs;this.playerEntryGraceMs=0;this.graphics?.clear();}
  activate(){if(this.state!==BOSS_SECTOR_STATES.safe)return null;this.plan=createSectorDeletionPlan({rng:this.rng,previousPatternId:this.previousPatternId});if(!this.plan.validation.valid)return null;this.previousPatternId=this.plan.id;this.state=BOSS_SECTOR_STATES.warning;this.remainingMs=this.plan.warningMs;this.tickRemainingMs=this.plan.tickMs;this.playerEntryGraceMs=this.plan.entryGraceMs;this.telemetry?.increment('sectorPatterns');this.eventBus?.emit('boss:sector:warning',{plan:this.plan});this.#draw();return this.plan;}
  update(deltaMs, player, {paused=false}={}){
    if(paused||this.state===BOSS_SECTOR_STATES.safe)return;
    const delta=Math.max(0,Number(deltaMs)||0);this.remainingMs-=delta;this.playerEntryGraceMs=Math.max(0,this.playerEntryGraceMs-delta);
    if(this.state===BOSS_SECTOR_STATES.warning&&this.remainingMs<=0){this.state=BOSS_SECTOR_STATES.disabled;this.remainingMs=this.plan.disabledMs;this.tickRemainingMs=this.plan.tickMs;this.playerEntryGraceMs=this.plan.entryGraceMs;this.eventBus?.emit('boss:sector:disabled',{plan:this.plan});this.#draw();}
    else if(this.state===BOSS_SECTOR_STATES.disabled){this.tickRemainingMs-=delta;if(this.tickRemainingMs<=0){this.tickRemainingMs+=this.plan.tickMs;if(this.playerEntryGraceMs<=0&&this.isPointDisabled(player)){this.damagePlayer?.({damageId:`boss-sector-${this.plan.id}-${Math.floor(this.remainingMs)}`,sourceType:'boss-sector',sourceId:this.plan.id,amount:this.plan.damage,direction:{x:0,y:-1},hitPosition:{x:player.x,y:player.y}});this.telemetry?.increment('sectorDamageTicks');}}if(this.remainingMs<=0){this.state=BOSS_SECTOR_STATES.restoring;this.remainingMs=600;this.eventBus?.emit('boss:sector:restoring',{plan:this.plan});this.#draw();}}
    else if(this.state===BOSS_SECTOR_STATES.restoring&&this.remainingMs<=0){this.state=BOSS_SECTOR_STATES.safe;this.remainingMs=0;this.eventBus?.emit('boss:sector:safe',{patternId:this.plan?.id});this.plan=null;this.graphics.clear();}
  }
  isPointDisabled(point){if(!this.plan||this.state!==BOSS_SECTOR_STATES.disabled)return false;return this.plan.disabled.includes(this.cellAt(point));}
  cellAt(point){const width=(this.arenaBounds.right-this.arenaBounds.left)/3,height=(this.arenaBounds.bottom-this.arenaBounds.top)/3;const col=Math.max(0,Math.min(2,Math.floor((point.x-this.arenaBounds.left)/width))),row=Math.max(0,Math.min(2,Math.floor((point.y-this.arenaBounds.top)/height)));return CELL_ORDER[row*3+col];}
  disabledPanelIds(){if(!this.plan||this.state===BOSS_SECTOR_STATES.safe)return[];const ids=[];if(this.plan.disabled.some(x=>x.includes('n')||x==='n'))ids.push('north');if(this.plan.disabled.some(x=>x.includes('s')||x==='s'))ids.push('south');if(this.plan.disabled.some(x=>x.includes('w')||x==='w'))ids.push('west');if(this.plan.disabled.some(x=>x.includes('e')||x==='e'))ids.push('east');return [...new Set(ids)];}
  snapshot(){return Object.freeze({state:this.state,remainingMs:Math.max(0,this.remainingMs),patternId:this.plan?.id??null,disabledCells:Object.freeze([...(this.plan?.disabled??[])]),safeRatio:this.plan?.validation?.safeRatio??1,connected:this.plan?.validation?.connected??true});}
  destroy(){this.reset();this.graphics?.destroy();}
  #draw(){this.graphics.clear();if(!this.plan)return;const width=(this.arenaBounds.right-this.arenaBounds.left)/3,height=(this.arenaBounds.bottom-this.arenaBounds.top)/3;for(const id of this.plan.disabled){const index=CELL_ORDER.indexOf(id),row=Math.floor(index/3),col=index%3,x=this.arenaBounds.left+col*width,y=this.arenaBounds.top+row*height;const warning=this.state===BOSS_SECTOR_STATES.warning;this.graphics.fillStyle(warning?0x6f1f2b:0x13070b,warning?.28:.72).fillRect(x,y,width,height);const larger=this.settingsManager?.get('accessibility.largerTelegraphOutlines',false),high=this.settingsManager?.get('visual.highContrast',false),base=warning?6:4,lineWidth=larger?base+3:high?base+2:base;this.lastOutlineWidth=lineWidth;this.graphics.lineStyle(lineWidth,warning?0xffd264:0xef3150,.9).strokeRect(x+3,y+3,width-6,height-6);}}
}
