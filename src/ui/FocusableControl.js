export class FocusableControl {
  constructor() {
    this.enabled = true;
    this.focused = false;
    this.focusManager = null;
  }

  setFocusManager(manager) {
    this.focusManager = manager;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled && this.focused) {
      this.setFocused(false);
    }
  }

  setFocused(focused) {
    this.focused = Boolean(focused);
  }

  activate() {}

  destroy() {}
}
