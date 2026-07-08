/**
 * Small owner-aware event bus for cross-system notifications.
 */
export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.nextId = 1;
  }

  subscribe(eventName, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new TypeError('EventBus handler must be a function.');
    }

    const entry = {
      id: this.nextId,
      handler,
      owner: options.owner ?? null,
      token: options.token ?? null,
      once: false,
    };
    this.nextId += 1;

    const eventListeners = this.listeners.get(eventName) ?? new Map();
    eventListeners.set(entry.id, entry);
    this.listeners.set(eventName, eventListeners);

    let active = true;
    return () => {
      if (!active) {
        return;
      }
      active = false;
      this.unsubscribe(eventName, entry.id);
    };
  }

  subscribeOnce(eventName, handler, options = {}) {
    const unsubscribe = this.subscribe(
      eventName,
      (...args) => {
        unsubscribe();
        handler(...args);
      },
      options,
    );
    return unsubscribe;
  }

  unsubscribe(eventName, listenerId) {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      return false;
    }

    const removed = eventListeners.delete(listenerId);
    if (eventListeners.size === 0) {
      this.listeners.delete(eventName);
    }
    return removed;
  }

  emit(eventName, payload) {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      return 0;
    }

    const snapshot = [...eventListeners.values()];
    for (const entry of snapshot) {
      entry.handler(payload);
    }
    return snapshot.length;
  }

  clearByOwner(owner) {
    return this.#clearMatching((entry) => entry.owner === owner);
  }

  clearByToken(token) {
    return this.#clearMatching((entry) => entry.token === token);
  }

  clearAll() {
    const count = this.listenerCount();
    this.listeners.clear();
    return count;
  }

  listenerCount(eventName = null) {
    if (eventName !== null) {
      return this.listeners.get(eventName)?.size ?? 0;
    }

    let total = 0;
    for (const eventListeners of this.listeners.values()) {
      total += eventListeners.size;
    }
    return total;
  }

  #clearMatching(predicate) {
    let removed = 0;
    for (const [eventName, eventListeners] of this.listeners.entries()) {
      for (const [listenerId, entry] of eventListeners.entries()) {
        if (predicate(entry)) {
          eventListeners.delete(listenerId);
          removed += 1;
        }
      }
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
    return removed;
  }
}
