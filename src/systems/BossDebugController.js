export class BossDebugController {
  constructor(scene){this.scene=scene;this.schedulerFrozen=false;}
  forcePhase(phase){return this.scene.forcePhase?.(phase);}
  setHealth(value){return this.scene.bossController?.forceHealth(value);}
  setVulnerable(value){this.scene.bossController?.vulnerability.force(value);return this.scene.snapshot?.();}
  forceAttack(id){return this.scene.executeAttack?.({id,phase:this.scene.bossController.phase,firstUse:false,selectedAtMs:this.scene.run.elapsedSimulationMs});}
  freezeScheduler(value=true){this.schedulerFrozen=Boolean(value);this.scene.bossController?.scheduler?.setFrozen(this.schedulerFrozen);return this.schedulerFrozen;}
  stepScheduler(){const scheduler=this.scene.bossController?.scheduler;if(!scheduler)return null;scheduler.setFrozen(false);scheduler.nextSelectionMs=0;const result=scheduler.update(0,{phase:this.scene.bossController.phase,hostileEchoes:this.scene.hostileEchoManager?.activeCount??0,hostileEchoCap:2,summonThreat:this.scene.bossSummonController?.activeThreat??0,sectorActive:this.scene.bossSectorManager?.state!=='SAFE',panelsActive:this.scene.openPanelIds?.size>0,recoveryScalar:1});scheduler.setFrozen(this.schedulerFrozen);return result;}
  snapshot(){return this.scene.snapshot?.();}
}
