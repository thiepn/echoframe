import { PALETTE } from '../data/constants.js';

export const TEXTURE_KEYS = Object.freeze({
  playerEmblem: 'foundation-player-emblem',
  echoEmblem: 'foundation-echo-emblem',
  panel: 'foundation-panel',
  focusMarker: 'foundation-focus-marker',
  particle: 'foundation-particle',
  grid: 'foundation-grid',
  physicsBody: 'prototype-physics-body',
  projectile: 'prototype-player-projectile',
  targetDummy: 'prototype-target-dummy',
  completionTerminal: 'prototype-completion-terminal',
  wall: 'prototype-wall',
});

export class TextureFactory {
  static generate(scene) {
    this.#player(scene);
    this.#echo(scene);
    this.#panel(scene);
    this.#focusMarker(scene);
    this.#particle(scene);
    this.#grid(scene);
    this.#physicsBody(scene);
    this.#projectile(scene);
    this.#targetDummy(scene);
    this.#completionTerminal(scene);
    this.#wall(scene);
  }

  static #player(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.playerEmblem)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.fillStyle(PALETTE.playerCyan, 0.25);
    graphics.fillPoints([
      { x: 32, y: 2 }, { x: 46, y: 18 }, { x: 62, y: 32 },
      { x: 46, y: 46 }, { x: 32, y: 62 }, { x: 18, y: 46 },
      { x: 2, y: 32 }, { x: 18, y: 18 },
    ], true);
    graphics.lineStyle(3, 0xedf7ff, 1);
    graphics.strokeCircle(32, 32, 20);
    graphics.fillStyle(PALETTE.playerCyan, 1);
    graphics.fillCircle(32, 32, 7);
    graphics.generateTexture(TEXTURE_KEYS.playerEmblem, 64, 64);
    graphics.destroy();
  }

  static #echo(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.echoEmblem)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.lineStyle(4, PALETTE.echoViolet, 0.9);
    graphics.beginPath();
    graphics.moveTo(32, 4); graphics.lineTo(48, 20);
    graphics.moveTo(60, 32); graphics.lineTo(44, 48);
    graphics.moveTo(32, 60); graphics.lineTo(16, 44);
    graphics.moveTo(4, 32); graphics.lineTo(20, 16);
    graphics.strokePath();
    graphics.fillStyle(PALETTE.echoViolet, 0.7);
    graphics.fillCircle(32, 32, 6);
    graphics.generateTexture(TEXTURE_KEYS.echoEmblem, 64, 64);
    graphics.destroy();
  }

  static #panel(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.panel)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.fillStyle(PALETTE.surface, 1);
    graphics.fillRoundedRect(0, 0, 256, 96, 10);
    graphics.lineStyle(2, PALETTE.surfaceHighlight, 1);
    graphics.strokeRoundedRect(1, 1, 254, 94, 10);
    graphics.generateTexture(TEXTURE_KEYS.panel, 256, 96);
    graphics.destroy();
  }

  static #focusMarker(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.focusMarker)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.fillStyle(PALETTE.playerCyan, 1);
    graphics.fillTriangle(0, 8, 16, 0, 16, 16);
    graphics.generateTexture(TEXTURE_KEYS.focusMarker, 16, 16);
    graphics.destroy();
  }

  static #particle(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.particle)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.fillStyle(PALETTE.playerCyan, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture(TEXTURE_KEYS.particle, 8, 8);
    graphics.destroy();
  }

  static #grid(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.grid)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.fillStyle(PALETTE.void, 1);
    graphics.fillRect(0, 0, 128, 128);
    graphics.lineStyle(1, PALETTE.surfaceHighlight, 0.32);
    graphics.strokeRect(0, 0, 128, 128);
    graphics.lineBetween(64, 0, 64, 128);
    graphics.lineBetween(0, 64, 128, 64);
    graphics.generateTexture(TEXTURE_KEYS.grid, 128, 128);
    graphics.destroy();
  }

  static #physicsBody(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.physicsBody)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(18, 18, 18);
    graphics.generateTexture(TEXTURE_KEYS.physicsBody, 36, 36);
    graphics.destroy();
  }

  static #projectile(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.projectile)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.fillStyle(PALETTE.playerCyan, 0.22);
    graphics.fillRoundedRect(0, 2, 22, 8, 4);
    graphics.fillStyle(PALETTE.playerCyan, 0.9);
    graphics.fillRoundedRect(4, 3, 14, 6, 3);
    graphics.fillStyle(0xedf7ff, 1);
    graphics.fillTriangle(18, 2, 24, 6, 18, 10);
    graphics.generateTexture(TEXTURE_KEYS.projectile, 24, 12);
    graphics.destroy();
  }

  static #targetDummy(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.targetDummy)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.fillStyle(PALETTE.surface, 1);
    graphics.fillCircle(34, 34, 30);
    graphics.lineStyle(4, PALETTE.warningYellow, 0.95);
    graphics.strokeCircle(34, 34, 28);
    graphics.lineStyle(2, PALETTE.warningYellow, 0.55);
    graphics.strokeCircle(34, 34, 16);
    graphics.fillStyle(PALETTE.warningYellow, 1);
    graphics.fillCircle(34, 34, 6);
    graphics.generateTexture(TEXTURE_KEYS.targetDummy, 68, 68);
    graphics.destroy();
  }

  static #completionTerminal(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.completionTerminal)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.fillStyle(PALETTE.surface, 1);
    graphics.fillPoints([
      { x: 40, y: 2 }, { x: 70, y: 18 }, { x: 78, y: 40 },
      { x: 70, y: 62 }, { x: 40, y: 78 }, { x: 10, y: 62 },
      { x: 2, y: 40 }, { x: 10, y: 18 },
    ], true);
    graphics.lineStyle(4, PALETTE.successMint, 0.8);
    graphics.strokeCircle(40, 40, 27);
    graphics.fillStyle(PALETTE.successMint, 0.8);
    graphics.fillCircle(40, 40, 7);
    graphics.generateTexture(TEXTURE_KEYS.completionTerminal, 80, 80);
    graphics.destroy();
  }

  static #wall(scene) {
    if (scene.textures.exists(TEXTURE_KEYS.wall)) {
      return;
    }
    const graphics = scene.make.graphics({ add: false });
    graphics.fillStyle(PALETTE.surface, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.lineStyle(2, PALETTE.surfaceHighlight, 1);
    graphics.strokeRect(1, 1, 30, 30);
    graphics.lineStyle(1, PALETTE.playerCyan, 0.16);
    graphics.lineBetween(0, 16, 32, 16);
    graphics.generateTexture(TEXTURE_KEYS.wall, 32, 32);
    graphics.destroy();
  }
}
