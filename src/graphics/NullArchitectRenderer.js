import { BOSS_PHASES, BOSS_VULNERABILITY_STATES } from '../data/bossBalance.js';

const PANEL_ANGLES = Object.freeze({ north: -Math.PI/2, east: 0, south: Math.PI/2, west: Math.PI });
export class NullArchitectRenderer {
  constructor(scene, { x = 800, y = 450, settingsManager }) {
    this.scene = scene; this.x = x; this.y = y; this.settingsManager = settingsManager;
    this.container = scene.add.container(x,y).setDepth(22);
    this.floorLinks = scene.add.graphics().setDepth(6);
    this.outerRing = scene.add.graphics();
    this.core = scene.add.graphics();
    this.panels = new Map();
    this.apertures = scene.add.graphics();
    this.container.add([this.outerRing,this.core,this.apertures]);
    for(const id of Object.keys(PANEL_ANGLES)){const panelWidth=this.#outlineWidth(4);const panel=scene.add.rectangle(Math.cos(PANEL_ANGLES[id])*128,Math.sin(PANEL_ANGLES[id])*128,78,48,0x17090e,1).setStrokeStyle(panelWidth,0x8e2639,.9).setRotation(PANEL_ANGLES[id]);this.container.add(panel);this.panels.set(id,panel);}
    this.phase = BOSS_PHASES.observe; this.vulnerabilityState = BOSS_VULNERABILITY_STATES.closed; this.openPanels = new Set(); this.rotation = 0; this.destroyProgress = 0;
    this.#drawFloor(); this.#redraw();
  }
  setPhase(phase){this.phase=phase;this.#redraw();}
  setVulnerability(state){this.vulnerabilityState=state;this.#redraw();}
  setOpenPanels(ids=[]){this.openPanels=new Set(ids);for(const [id,panel] of this.panels){const open=this.openPanels.has(id);panel.setFillStyle(open?0x27070a:0x17090e,1).setStrokeStyle(this.#outlineWidth(open?5:4),open?0xffffff:0x8e2639,open?1:.9).setScale(open?1.14:1);}}
  setAttackApertures(angles=[]){this.apertures.clear();for(const angle of angles){this.apertures.fillStyle(0xffffff,.9).fillCircle(Math.cos(angle)*108,Math.sin(angle)*108,7);}}
  update(deltaMs){const speed=this.phase===BOSS_PHASES.delete?.00075:this.phase===BOSS_PHASES.imitate?.00052:.00035;this.rotation+=deltaMs*speed;this.outerRing.rotation=this.rotation;for(const panel of this.panels.values())if(this.phase===BOSS_PHASES.delete)panel.rotation+=Math.sin(this.rotation)*0.001;}
  drawLineTelegraphs(plan, stage='tracking'){this.lineGraphics?.destroy();this.lineGraphics=this.scene.add.graphics().setDepth(18);const color=stage==='execution'?0xffffff:stage==='lock'?0xffd264:0xef3150;const alpha=stage==='execution'?.95:.58;this.lineGraphics.lineStyle(this.#outlineWidth(plan.width),color,alpha);for(const position of plan.positions){if(plan.orientation==='vertical')this.lineGraphics.lineBetween(position,45,position,855);else this.lineGraphics.lineBetween(80,position,1520,position);}}
  clearLineTelegraphs(){this.lineGraphics?.destroy();this.lineGraphics=null;}
  beginDestruction(progress){this.destroyProgress=Math.max(0,Math.min(1,progress));this.container.setAlpha(1-this.destroyProgress*.65).setScale(1+this.destroyProgress*.15);this.core.clear().fillStyle(this.destroyProgress>.55?0xffffff:0x9c132d,1).fillCircle(0,0,58*(1-this.destroyProgress*.3));}
  snapshot(){return{phase:this.phase,vulnerabilityState:this.vulnerabilityState,openPanels:[...this.openPanels],rotation:this.rotation,destroyProgress:this.destroyProgress};}
  destroy(){this.lineGraphics?.destroy();this.floorLinks.destroy();this.container.destroy(true);}
  #outlineWidth(base){const larger=this.settingsManager?.get('accessibility.largerTelegraphOutlines',false);const high=this.settingsManager?.get('visual.highContrast',false);return larger?base+3:high?base+2:base;}
  #drawFloor(){this.floorLinks.clear().lineStyle(4,0x2bd7e8,.35);for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5])this.floorLinks.lineBetween(this.x+Math.cos(angle)*155,this.y+Math.sin(angle)*155,this.x+Math.cos(angle)*390,this.y+Math.sin(angle)*390);}
  #redraw(){const high=this.settingsManager?.get('visual.highContrast',false);const larger=this.settingsManager?.get('accessibility.largerTelegraphOutlines',false);this.visualOutlineWidths={outer:larger?10:high?8:6,core:larger?9:high?7:5,panel:this.#outlineWidth(4)};this.outerRing.clear().lineStyle(this.visualOutlineWidths.outer,this.phase===BOSS_PHASES.observe?0xa61f38:this.phase===BOSS_PHASES.imitate?0xb31b65:0xef3150,1).strokeCircle(0,0,145).lineStyle(3,0x23070d,.9).strokeCircle(0,0,112);this.core.clear();const open=this.vulnerabilityState===BOSS_VULNERABILITY_STATES.vulnerable||this.vulnerabilityState===BOSS_VULNERABILITY_STATES.opening;this.core.fillStyle(open?0xffffff:0x0f0508,1).fillCircle(0,0,open?58:68).lineStyle(this.visualOutlineWidths.core,open?0xff5369:0x7a172a,1).strokeCircle(0,0,open?58:68);for(const [id,panel] of this.panels){const panelOpen=this.openPanels.has(id);panel.setStrokeStyle(this.#outlineWidth(panelOpen?5:4),panelOpen?0xffffff:0x8e2639,panelOpen?1:.9);}}
}
