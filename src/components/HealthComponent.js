export class HealthComponent {
  constructor(maximumHealth = 100) { this.reset(maximumHealth); }
  reset(maximumHealth = this.maximumHealth ?? 100) { this.maximumHealth = Math.max(1, Number(maximumHealth) || 1); this.currentHealth = this.maximumHealth; this.defeatReported = false; }
  damage(amount) { const before=this.currentHealth; this.currentHealth=Math.max(0,before-Math.max(0,Number(amount)||0)); const defeated=this.currentHealth<=0&&!this.defeatReported; if(defeated)this.defeatReported=true; return { applied:before-this.currentHealth, defeated }; }
  heal(amount) { const before=this.currentHealth; this.currentHealth=Math.min(this.maximumHealth,before+Math.max(0,Number(amount)||0)); return this.currentHealth-before; }
  setCurrent(value) { this.currentHealth=Math.max(0,Math.min(this.maximumHealth,Number(value)||0)); this.defeatReported=this.currentHealth<=0; return this.currentHealth; }
  setMaximum(value,{preserveRatio=false}={}) { const old=this.maximumHealth; const ratio=old>0?this.currentHealth/old:1; this.maximumHealth=Math.max(1,Number(value)||1); this.currentHealth=Math.min(this.maximumHealth,preserveRatio?this.maximumHealth*ratio:this.currentHealth); this.defeatReported=this.currentHealth<=0; }
  get defeated(){return this.currentHealth<=0;}
  snapshot(){return {currentHealth:this.currentHealth,maximumHealth:this.maximumHealth,defeated:this.defeated};}
}
