import Phaser from 'phaser';
import { DESIGN_HEIGHT, DESIGN_WIDTH, SAVE_SCHEMA_VERSION } from '../data/constants.js';
import { BUILD_MODE, BUILD_VERSION } from '../utils/version.js';

export class DebugManager {
  constructor({ eventBus }) {
    this.eventBus = eventBus;
    this.enabled = this.#readInitialEnabled();
    this.registries = new Set();
    this.transitionLog = [];
    this.services = null;
    this.gameplayProvider = null;
    this.gameplayProviderOwner = null;
  }

  configure(services) {
    this.services = services;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.eventBus.emit('debug:visibility:changed', { enabled: this.enabled });
  }

  registerCleanupRegistry(registry) {
    this.registries.add(registry);
  }

  unregisterCleanupRegistry(registry) {
    this.registries.delete(registry);
  }

  setGameplayProvider(provider, owner) {
    this.gameplayProvider = typeof provider === 'function' ? provider : null;
    this.gameplayProviderOwner = owner ?? null;
  }

  clearGameplayProvider(owner) {
    if (this.gameplayProviderOwner !== owner) {
      return false;
    }
    this.gameplayProvider = null;
    this.gameplayProviderOwner = null;
    return true;
  }

  recordTransition(entry) {
    this.transitionLog.push({ ...entry, recordedAt: performance.now() });
    if (this.transitionLog.length > 50) {
      this.transitionLog.shift();
    }
  }

  getCleanupCount() {
    let count = 0;
    for (const registry of this.registries) {
      count += registry.size;
    }
    return count;
  }

  getSnapshot(game) {
    const activeScenes = game?.scene
      ?.getScenes(true)
      .map((scene) => scene.scene.key) ?? [];
    const renderer = game?.loop;
    const audio = this.services?.audioManager.getDiagnostics();

    return {
      enabled: this.enabled,
      fps: Math.round(renderer?.actualFps ?? 0),
      frameMs: Number(renderer?.delta?.toFixed?.(2) ?? 0),
      activeScenes,
      viewport: `${globalThis.innerWidth ?? 0}×${globalThis.innerHeight ?? 0}`,
      logical: `${DESIGN_WIDTH}×${DESIGN_HEIGHT}`,
      listenerCount: this.services?.eventBus.listenerCount() ?? 0,
      cleanupCount: this.getCleanupCount(),
      schemaVersion: SAVE_SCHEMA_VERSION,
      currentTransition: this.services?.sceneFlow.currentTransition?.token ?? 'none',
      transitionCount: this.services?.sceneFlow.transitionCount ?? 0,
      buildVersion: BUILD_VERSION,
      buildMode: BUILD_MODE,
      phaserVersion: Phaser.VERSION,
      audioContexts: audio?.contextCount ?? 0,
      gameplay: this.gameplayProvider?.() ?? null,
    };
  }

  #readInitialEnabled() {
    const debugBuild = import.meta.env.DEV || import.meta.env.MODE === 'validation';
    if (!debugBuild) return false;
    if (globalThis.__ECHOFRAME_DEBUG__ === true) return true;
    if (typeof location === 'undefined') return false;
    const params = new URLSearchParams(location.search);
    return params.get('debug') === '1';
  }
}
