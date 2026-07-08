export class UIFocusManager {
  constructor({ inputContext, audioManager, onCancel = null }) {
    this.inputContext = inputContext;
    this.audioManager = audioManager;
    this.defaultOnCancel = onCancel;
    this.controls = [];
    this.focusedControl = null;
    this.modalStack = [];
  }

  register(control) {
    this.controls.push(control);
    control.setFocusManager(this);
    if (!this.focusedControl && control.enabled) {
      this.focus(control, { playSound: false });
    }
    return control;
  }

  unregister(control) {
    this.controls = this.controls.filter((entry) => entry !== control);
    if (this.focusedControl === control) {
      this.focusedControl = null;
      this.focusFirstAvailable({ playSound: false });
    }
  }

  focus(control, { playSound = true } = {}) {
    if (!control?.enabled || !this.#activeControls().includes(control)) {
      return false;
    }

    if (this.focusedControl === control) {
      return true;
    }

    this.focusedControl?.setFocused(false);
    this.focusedControl = control;
    this.focusedControl.setFocused(true);
    if (playSound) {
      this.audioManager.ensureStarted().then(() => this.audioManager.playNavigation());
    }
    return true;
  }

  focusFirstAvailable(options = {}) {
    const control = this.#activeControls().find((entry) => entry.enabled);
    return control ? this.focus(control, options) : false;
  }

  move(delta) {
    const active = this.#activeControls().filter((control) => control.enabled);
    if (active.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, active.indexOf(this.focusedControl));
    const nextIndex = (currentIndex + delta + active.length) % active.length;
    this.focus(active[nextIndex]);
  }

  update() {
    if (this.inputContext.justPressed('uiUp') || this.inputContext.justPressed('uiLeft')) {
      this.move(-1);
    } else if (this.inputContext.justPressed('uiDown') || this.inputContext.justPressed('uiRight')) {
      this.move(1);
    }

    if (this.inputContext.justPressed('confirm')) {
      this.activateFocused();
    }

    if (this.inputContext.justPressed('cancel')) {
      this.cancel();
    }
  }

  activateFocused() {
    if (!this.focusedControl?.enabled) {
      return false;
    }
    this.audioManager.ensureStarted().then(() => this.audioManager.playConfirm());
    this.focusedControl.activate();
    return true;
  }

  pushModal(controls, onCancel) {
    this.modalStack.push({
      controls,
      onCancel,
      previousFocus: this.focusedControl,
    });
    this.focusedControl?.setFocused(false);
    this.focusedControl = null;
    this.focusFirstAvailable({ playSound: false });
  }

  popModal() {
    const modal = this.modalStack.pop();
    if (!modal) {
      return;
    }

    this.focusedControl?.setFocused(false);
    this.focusedControl = null;
    if (modal.previousFocus?.enabled) {
      this.focus(modal.previousFocus, { playSound: false });
    } else {
      this.focusFirstAvailable({ playSound: false });
    }
  }

  cancel() {
    const modal = this.modalStack.at(-1);
    if (modal) {
      modal.onCancel?.();
      return;
    }
    this.defaultOnCancel?.();
  }

  destroy() {
    this.focusedControl?.setFocused(false);
    this.controls = [];
    this.focusedControl = null;
    this.modalStack = [];
  }

  #activeControls() {
    return this.modalStack.at(-1)?.controls ?? this.controls;
  }
}
