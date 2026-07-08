import { DESIGN_HEIGHT, DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { TextureFactory } from '../graphics/TextureFactory.js';
import { BaseScene } from './BaseScene.js';

export class PreloadScene extends BaseScene {
  constructor(services) {
    super(SCENE_KEYS.preload, services);
  }

  create() {
    this.beginScene({ input: false });
    this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, 'INITIALIZING ECHOFRAME', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: PALETTE.primaryText,
    }).setOrigin(0.5);
    TextureFactory.generate(this);
    const timer = this.time.delayedCall(80, () => {
      this.services.sceneFlow.replace({
        sourceKeys: [SCENE_KEYS.preload],
        targetKey: SCENE_KEYS.mainMenu,
        fadeMs: 120,
        token: 'preload-to-menu',
      });
    });
    this.cleanup.trackTimer(timer);
  }
}
