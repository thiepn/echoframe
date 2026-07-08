function getAtPath(source, path) {
  return path.split('.').reduce((current, key) => current?.[key], source);
}

function setAtPath(target, path, value) {
  const keys = path.split('.');
  let current = target;
  for (let index = 0; index < keys.length - 1; index += 1) {
    current = current[keys[index]];
  }
  current[keys.at(-1)] = value;
}

export class SettingsManager {
  constructor({ saveManager, audioManager, eventBus }) {
    this.saveManager = saveManager;
    this.audioManager = audioManager;
    this.eventBus = eventBus;
    this.settings = null;
  }

  initialize() {
    this.settings = this.saveManager.getSnapshot().settings;
    this.applyAll();
    return this.getSnapshot();
  }

  reloadFromSave() {
    this.settings = this.saveManager.getSnapshot().settings;
    this.applyAll();
  }

  get(path, fallback = undefined) {
    const value = getAtPath(this.settings, path);
    return value === undefined ? fallback : value;
  }

  getSnapshot() {
    return structuredClone(this.settings);
  }

  set(path, value, { immediate = false } = {}) {
    this.saveManager.update(
      (draft) => {
        setAtPath(draft.settings, path, value);
        if (path === 'gameplay.lastDifficulty') {
          draft.meta.lastSelectedDifficulty = value;
        }
      },
      { immediate },
    );
    this.settings = this.saveManager.getSnapshot().settings;
    this.applyAll();
    this.eventBus.emit('settings:changed', { path, value });
  }

  applyAll() {
    if (!this.settings) {
      return;
    }

    this.audioManager.applySettings(this.settings.audio);

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle(
        'high-contrast',
        this.settings.visual.highContrast,
      );
      document.documentElement.style.setProperty(
        '--hud-opacity',
        String(this.settings.visual.hudOpacity),
      );
    }
  }
}
