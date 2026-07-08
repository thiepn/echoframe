import { SCENE_KEYS } from '../data/sceneKeys.js';
import { BaseScene } from './BaseScene.js';

export class BootScene extends BaseScene {
  constructor(services) {
    super(SCENE_KEYS.boot, services);
  }

  create() {
    this.beginScene({ input: false });
    this.services.saveManager.load();
    this.services.settingsManager.initialize();
    this.services.sceneFlow.replace({
      sourceKeys: [SCENE_KEYS.boot],
      targetKey: SCENE_KEYS.preload,
      fadeMs: 0,
      token: 'boot-to-preload',
    });
  }
}
