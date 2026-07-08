class PhaserSceneAdapter {
  constructor(game) {
    this.game = game;
  }

  execute(descriptor, done) {
    const apply = () => {
      try {
        const manager = this.game.scene;
        if (descriptor.type === 'replace') {
        const [primarySourceKey, ...additionalSourceKeys] = descriptor.sourceKeys;
        for (const key of additionalSourceKeys) {
          manager.stop(key);
        }

        const primarySource = primarySourceKey
          ? manager.getScene(primarySourceKey)
          : null;
        if (primarySource?.scene) {
          primarySource.scene.start(descriptor.targetKey, descriptor.payload);
        } else {
          manager.start(descriptor.targetKey, descriptor.payload);
        }

        for (const launchEntry of descriptor.launch) {
          manager.start(launchEntry.key, launchEntry.payload ?? descriptor.payload);
        }
      } else if (descriptor.type === 'overlay') {
        for (const key of descriptor.pauseKeys) {
          if (manager.isActive(key)) {
            manager.pause(key);
          }
        }
        manager.start(descriptor.targetKey, descriptor.payload);
      } else if (descriptor.type === 'close-overlay') {
        manager.stop(descriptor.overlayKey);
        for (const key of descriptor.resumeKeys) {
          if (manager.isPaused(key)) {
            manager.resume(key);
          }
        }
        }

        queueMicrotask(() => done(true));
      } catch (error) {
        console.error('Scene transition failed.', error);
        queueMicrotask(() => done(false));
      }
    };

    const sourceScene = descriptor.sourceKeys
      .map((key) => this.game.scene.getScene(key))
      .find((scene) => scene?.scene?.isActive());

    if (descriptor.fadeMs > 0 && sourceScene?.cameras?.main) {
      sourceScene.cameras.main.once('camerafadeoutcomplete', apply);
      sourceScene.cameras.main.fadeOut(descriptor.fadeMs, 0, 0, 0);
    } else {
      apply();
    }
  }
}

function normalizedDescriptor(input) {
  return {
    type: input.type,
    sourceKeys: [...(input.sourceKeys ?? [])],
    targetKey: input.targetKey ?? null,
    overlayKey: input.overlayKey ?? null,
    launch: [...(input.launch ?? [])],
    pauseKeys: [...(input.pauseKeys ?? [])],
    resumeKeys: [...(input.resumeKeys ?? [])],
    payload: structuredClone(input.payload ?? {}),
    fadeMs: Math.max(0, Number(input.fadeMs) || 0),
    token: input.token ?? `transition-${Date.now()}-${Math.random()}`,
  };
}

export class SceneFlowController {
  constructor({ eventBus, inputManager, debugManager, adapter = null }) {
    this.eventBus = eventBus;
    this.inputManager = inputManager;
    this.debugManager = debugManager;
    this.adapter = adapter;
    this.currentTransition = null;
    this.transitionCount = 0;
    this.consumedTokens = new Set();
    this.maxRememberedTokens = 200;
  }

  attachGame(game) {
    if (!this.adapter) {
      this.adapter = new PhaserSceneAdapter(game);
    }
  }

  request(input) {
    const descriptor = normalizedDescriptor(input);
    const claim = this.claim(descriptor);
    if (!claim.accepted) {
      return claim;
    }

    if (!this.adapter) {
      this.complete(descriptor.token, false);
      return { accepted: false, reason: 'adapter-unavailable' };
    }

    this.adapter.execute(descriptor, (succeeded = true) =>
      this.complete(descriptor.token, succeeded),
    );
    return { accepted: true, token: descriptor.token };
  }

  claim(descriptor) {
    if (this.currentTransition) {
      return { accepted: false, reason: 'transition-in-progress' };
    }
    if (this.consumedTokens.has(descriptor.token)) {
      return { accepted: false, reason: 'duplicate-token' };
    }

    this.currentTransition = descriptor;
    this.consumedTokens.add(descriptor.token);
    this.#trimTokenHistory();
    this.transitionCount += 1;
    this.inputManager.setLocked(true);
    this.debugManager.recordTransition({
      token: descriptor.token,
      type: descriptor.type,
      targetKey: descriptor.targetKey,
      status: 'started',
    });
    this.eventBus.emit('scene:transition:started', descriptor);
    return { accepted: true, token: descriptor.token };
  }

  complete(token, succeeded) {
    if (!this.currentTransition || this.currentTransition.token !== token) {
      return false;
    }

    const completed = this.currentTransition;
    this.currentTransition = null;
    this.inputManager.setLocked(false);
    this.debugManager.recordTransition({
      token,
      type: completed.type,
      targetKey: completed.targetKey,
      status: succeeded ? 'completed' : 'failed',
    });
    this.eventBus.emit('scene:transition:completed', {
      descriptor: completed,
      succeeded,
    });
    return true;
  }

  replace({ sourceKeys, targetKey, payload = {}, launch = [], fadeMs = 180, token }) {
    return this.request({
      type: 'replace',
      sourceKeys,
      targetKey,
      payload,
      launch,
      fadeMs,
      token,
    });
  }

  openOverlay({ pauseKeys, overlayKey, payload = {}, token }) {
    return this.request({
      type: 'overlay',
      sourceKeys: pauseKeys,
      pauseKeys,
      targetKey: overlayKey,
      payload,
      fadeMs: 0,
      token,
    });
  }

  closeOverlay({ overlayKey, resumeKeys, token }) {
    return this.request({
      type: 'close-overlay',
      sourceKeys: [overlayKey],
      overlayKey,
      resumeKeys,
      fadeMs: 0,
      token,
    });
  }

  #trimTokenHistory() {
    if (this.consumedTokens.size <= this.maxRememberedTokens) {
      return;
    }
    const oldest = this.consumedTokens.values().next().value;
    this.consumedTokens.delete(oldest);
  }
}
