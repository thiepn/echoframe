export function safeParseJson(serialized) {
  if (typeof serialized !== 'string') {
    return { ok: false, value: null, error: new TypeError('Expected serialized JSON.') };
  }

  try {
    return { ok: true, value: JSON.parse(serialized), error: null };
  } catch (error) {
    return { ok: false, value: null, error };
  }
}

export function safeRead(storage, key) {
  try {
    return { ok: true, value: storage.getItem(key), error: null };
  } catch (error) {
    return { ok: false, value: null, error };
  }
}

export function safeWrite(storage, key, value) {
  try {
    storage.setItem(key, value);
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error };
  }
}

export function safeRemove(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error };
  }
}

export function createMemoryStorage(initialEntries = {}) {
  const values = new Map(Object.entries(initialEntries));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
    dump() {
      return Object.fromEntries(values.entries());
    },
  };
}
