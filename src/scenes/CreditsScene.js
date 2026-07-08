import { DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { BUILD_VERSION } from '../utils/version.js';
import { MenuSceneBase } from './MenuSceneBase.js';

export class CreditsScene extends MenuSceneBase {
  constructor(services) {
    super(SCENE_KEYS.credits, services);
  }

  create() {
    const returnTo = this.sceneData.returnTo ?? SCENE_KEYS.mainMenu;
    this.setupMenu({
      title: 'Credits',
      subtitle: `ECHOFRAME: LAST SIGNAL · ${BUILD_VERSION}`,
      onCancel: () => this.#back(returnTo),
    });

    const lines = [
      'Game design and production direction — Project author',
      'Architecture and implementation assistance — ChatGPT',
      '',
      'Framework — Phaser 3.90.0',
      'Build system — Vite',
      'Browser audio — Web Audio API',
      'Static deployment — GitHub Pages compatible',
      '',
      'Visuals and sound are generated procedurally in-engine.',
      'No external contributor, artwork, or audio claim is made.',
      'Project licensing follows the repository license information.',
    ];

    this.add.text(DESIGN_WIDTH / 2, 405, lines, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: PALETTE.primaryText,
      align: 'center',
      lineSpacing: 11,
    }).setOrigin(0.5);

    this.addButton('Back', () => this.#back(returnTo), { y: 735, width: 320 });
  }

  #back(returnTo) {
    this.services.sceneFlow.replace({
      sourceKeys: [SCENE_KEYS.credits],
      targetKey: returnTo,
      payload: { focusId: 'credits' },
      token: `credits-back-${performance.now()}`,
    });
  }
}
