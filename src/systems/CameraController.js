export class CameraController {
  constructor({ camera, settingsManager }) {
    this.camera = camera;
    this.settingsManager = settingsManager;
  }

  impulse(baseIntensity, durationMs = 55) {
    const scale = this.settingsManager.get('visual.screenShake', 0.7);
    const intensity = Math.max(0, baseIntensity * scale);
    if (intensity <= 0) {
      return;
    }
    this.camera.shake(durationMs, intensity, true);
  }

  completion() {
    this.impulse(0.0045, 120);
  }
}
