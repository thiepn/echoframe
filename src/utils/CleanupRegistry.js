/**
 * Idempotent registry for scene-owned cleanup work.
 */
export class CleanupRegistry {
  constructor(label = 'anonymous') {
    this.label = label;
    this.cleanups = [];
    this.cleaned = false;
  }

  add(cleanup) {
    if (typeof cleanup !== 'function') {
      throw new TypeError(`CleanupRegistry(${this.label}) requires a function.`);
    }

    if (this.cleaned) {
      cleanup();
      return cleanup;
    }

    this.cleanups.push(cleanup);
    return cleanup;
  }

  trackEvent(emitter, eventName, handler, context) {
    emitter.on(eventName, handler, context);
    this.add(() => emitter.off(eventName, handler, context));
    return handler;
  }

  trackOnce(emitter, eventName, handler, context) {
    emitter.once(eventName, handler, context);
    this.add(() => emitter.off(eventName, handler, context));
    return handler;
  }

  trackDom(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    this.add(() => target.removeEventListener(eventName, handler, options));
    return handler;
  }

  trackSubscription(unsubscribe) {
    this.add(unsubscribe);
    return unsubscribe;
  }

  trackTimer(timer) {
    this.add(() => {
      if (timer && typeof timer.remove === 'function') {
        timer.remove(false);
      }
    });
    return timer;
  }

  trackTween(tween) {
    this.add(() => {
      if (tween && typeof tween.stop === 'function') {
        tween.stop();
      }
      if (tween && typeof tween.remove === 'function') {
        tween.remove();
      }
    });
    return tween;
  }

  cleanup() {
    if (this.cleaned) {
      return;
    }

    this.cleaned = true;
    const callbacks = this.cleanups.splice(0).reverse();
    for (const cleanup of callbacks) {
      try {
        cleanup();
      } catch (error) {
        console.error(`Cleanup failed in ${this.label}.`, error);
      }
    }
  }

  get size() {
    return this.cleanups.length;
  }
}
