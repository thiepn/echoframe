export class ContactDamageComponent {
  constructor({damage=0,cooldownMs=650}={}){this.damage=Math.max(0,Number(damage)||0);this.cooldownMs=Math.max(0,Number(cooldownMs)||0);this.remainingMs=0;}
  update(deltaMs,{paused=false}={}){if(!paused)this.remainingMs=Math.max(0,this.remainingMs-Math.max(0,Number(deltaMs)||0));}
  canTrigger(){return this.remainingMs<=0;}
  consume(){if(!this.canTrigger())return false;this.remainingMs=this.cooldownMs;return true;}
  reset(){this.remainingMs=0;}
}
