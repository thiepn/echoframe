import Phaser from 'phaser';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  PALETTE,
} from './data/constants.js';
import { ArchiveScene } from './scenes/ArchiveScene.js';
import { BootScene } from './scenes/BootScene.js';
import { BossScene } from './scenes/BossScene.js';
import { CreditsScene } from './scenes/CreditsScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { ResultsScene } from './scenes/ResultsScene.js';
import { RecoveryScene } from './scenes/RecoveryScene.js';
import { RunScene } from './scenes/RunScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { StatisticsScene } from './scenes/StatisticsScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { UpgradeScene } from './scenes/UpgradeScene.js';

export function createGameConfig(services) {
  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    backgroundColor: PALETTE.void,
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: 'high-performance',
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DESIGN_WIDTH,
      height: DESIGN_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { x: 0, y: 0 },
      },
    },
    input: {
      keyboard: true,
      mouse: true,
      touch: false,
    },
    scene: [
      new BootScene(services),
      new PreloadScene(services),
      new MainMenuScene(services),
      new TutorialScene(services),
      new RunScene(services),
      new BossScene(services),
      new HUDScene(services),
      new UpgradeScene(services),
      new RecoveryScene(services),
      new PauseScene(services),
      new ResultsScene(services),
      new ArchiveScene(services),
      new StatisticsScene(services),
      new SettingsScene(services),
      new CreditsScene(services),
    ],
  };
}
