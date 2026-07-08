const ORANGE = 0xff9d45;

export class EliteOverlayRenderer {
  constructor(scene, settingsManager) {
    this.scene = scene;
    this.settingsManager = settingsManager;
    this.container = scene.add.container(-1000, -1000).setDepth(38).setVisible(false);
    this.graphics = scene.add.graphics();
    this.label = scene.add.text(0, -48, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffb574', backgroundColor: '#080b14cc', padding: { x: 5, y: 2 } }).setOrigin(0.5);
    this.container.add([this.graphics, this.label]);
  }
  activate(enemy, controller) { this.enemy = enemy; this.controller = controller; this.container.setVisible(true); this.label.setText(controller.definition.displayName.toUpperCase()); }
  update(_deltaMs) {
    if (!this.enemy?.active || !this.controller) { this.container.setVisible(false); return; }
    this.container.setPosition(this.enemy.x, this.enemy.y);
    const reduced = Boolean(this.settingsManager?.get('visual.reducedFlashes'));
    const t = this.scene?.run?.elapsedSimulationMs ?? 0;
    const pulse = reduced ? 0.55 : 0.55 + Math.sin(t / 110) * 0.18;
    this.graphics.clear();
    this.graphics.lineStyle(2, ORANGE, Math.max(0.25, pulse));
    if (this.controller.modifierId === 'overclocked') {
      this.graphics.strokeCircle(0, 0, 34 + Math.sin(t / 90) * 3);
      for (let i = 0; i < 3; i += 1) { const a = i * Math.PI * 2 / 3 + t / 500; this.graphics.beginPath(); this.graphics.moveTo(Math.cos(a) * 38, Math.sin(a) * 38); this.graphics.lineTo(Math.cos(a) * 49, Math.sin(a) * 49); this.graphics.strokePath(); }
    } else if (this.controller.modifierId === 'replicating') {
      this.graphics.beginPath(); this.graphics.moveTo(-34, -30); this.graphics.lineTo(34, 30); this.graphics.moveTo(-34, 30); this.graphics.lineTo(34, -30); this.graphics.strokePath();
      if (this.controller.modifier.pendingMs > 0) this.graphics.strokeCircle(0, 0, 42 - this.controller.modifier.pendingMs / 40);
    } else {
      const shield = this.controller.modifier.shieldAmount;
      const max = this.controller.enemy.health.maximumHealth * this.controller.definition.shieldRatio;
      const ratio = max > 0 ? shield / max : 0;
      const trigger = this.controller.modifier.lastTrigger;
      if (trigger && shield > 0) {
        this.graphics.beginPath();
        this.graphics.moveTo(0, 0);
        this.graphics.lineTo(trigger.x - this.enemy.x, trigger.y - this.enemy.y);
        this.graphics.strokePath();
      }
      for (let i = 0; i < 6; i += 1) { const a = i * Math.PI / 3 + t / 900; this.graphics.beginPath(); this.graphics.arc(0, 0, 40, a, a + Math.PI / 5 * Math.max(0.15, ratio)); this.graphics.strokePath(); }
    }
  }
  deactivate() { this.enemy = null; this.controller = null; this.container.setVisible(false).setPosition(-1000, -1000); this.graphics.clear(); this.label.setText(''); }
  destroy() { this.container.destroy(true); this.enemy = null; this.controller = null; }
}
