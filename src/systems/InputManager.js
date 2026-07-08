import Phaser from 'phaser';
import { FIXED_MENU_BINDINGS, normalizeBindings } from '../input/BindingCatalog.js';

function phaserKeyCode(code) {
  const named = {
    Space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    Enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    Escape: Phaser.Input.Keyboard.KeyCodes.ESC,
    Backspace: Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
    ShiftLeft: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    ShiftRight: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    ArrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
    ArrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
    ArrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
    ArrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    Comma: Phaser.Input.Keyboard.KeyCodes.COMMA,
    Period: Phaser.Input.Keyboard.KeyCodes.PERIOD,
    Slash: Phaser.Input.Keyboard.KeyCodes.FORWARD_SLASH,
    Semicolon: Phaser.Input.Keyboard.KeyCodes.SEMICOLON,
    Quote: Phaser.Input.Keyboard.KeyCodes.QUOTES,
    BracketLeft: Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET,
    BracketRight: Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET,
    Backslash: Phaser.Input.Keyboard.KeyCodes.BACK_SLASH,
    Minus: Phaser.Input.Keyboard.KeyCodes.MINUS,
    Equal: Phaser.Input.Keyboard.KeyCodes.PLUS,
    Backquote: Phaser.Input.Keyboard.KeyCodes.BACKTICK,
  };
  if (named[code] !== undefined) return named[code];
  if (/^Key[A-Z]$/.test(code)) return Phaser.Input.Keyboard.KeyCodes[code.slice(3)];
  if (/^Digit[0-9]$/.test(code)) return Phaser.Input.Keyboard.KeyCodes[code.slice(5)];
  if (/^Numpad[0-9]$/.test(code)) return Phaser.Input.Keyboard.KeyCodes[`NUMPAD_${code.slice(6)}`];
  return null;
}

function mergeBindings(gameplay) {
  return Object.freeze({ ...structuredClone(gameplay), ...structuredClone(FIXED_MENU_BINDINGS) });
}

class InputContext {
  constructor(scene, bindings, manager, onDispose) {
    this.scene = scene;
    this.manager = manager;
    this.onDispose = onDispose;
    this.keysByAction = new Map();
    this.codesByAction = new Map();
    this.pointerButtonsByAction = new Map();
    this.blockedUntilRelease = new Set();
    this.blockedPointerUntilRelease = new Set();
    this.pointerDown = new Set();
    this.pointerPressed = new Set();
    this.pointerReleased = new Set();
    this.pointerWorld = new Phaser.Math.Vector2();
    this.keyboardPressed = new Set();
    this.keyboardReleased = new Set();
    this.disposed = false;
    this.bindingRevision = 0;

    this.onKeyDown = (event) => {
      if (event.repeat || this.manager.captureActive) return;
      for (const [action, codes] of this.codesByAction.entries()) {
        if (codes.has(event.code)) { this.keyboardPressed.add(action); this.keyboardReleased.delete(action); }
      }
    };
    this.onKeyUp = (event) => {
      for (const [action, codes] of this.codesByAction.entries()) {
        if (codes.has(event.code)) { this.keyboardReleased.add(action); this.blockedUntilRelease.delete(action); }
      }
    };
    this.onPointerDown = (pointer) => {
      if (this.manager.captureActive) return;
      const button = pointer.button;
      this.pointerDown.add(button); this.pointerPressed.add(button); this.pointerReleased.delete(button);
    };
    this.onPointerUp = (pointer) => {
      const button = pointer.button;
      this.pointerDown.delete(button); this.pointerReleased.add(button); this.blockedPointerUntilRelease.delete(button);
    };
    this.onPostUpdate = () => {
      this.pointerPressed.clear(); this.pointerReleased.clear(); this.keyboardPressed.clear(); this.keyboardReleased.clear();
    };

    scene.input.keyboard.on('keydown', this.onKeyDown);
    scene.input.keyboard.on('keyup', this.onKeyUp);
    scene.input.on('pointerdown', this.onPointerDown);
    scene.input.on('pointerup', this.onPointerUp);
    scene.input.on('pointerupoutside', this.onPointerUp);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.onPostUpdate);
    this.rebind(bindings);
  }

  rebind(bindings) {
    this.suppressHeldActions();
    for (const keys of this.keysByAction.values()) for (const key of keys) this.scene.input.keyboard.removeKey(key);
    this.keysByAction.clear(); this.codesByAction.clear(); this.pointerButtonsByAction.clear();
    for (const [action, descriptors] of Object.entries(bindings)) {
      const keys = []; const codes = new Set(); const buttons = new Set();
      for (const descriptor of descriptors ?? []) {
        if (descriptor.device === 'keyboard') {
          const keyCode = phaserKeyCode(descriptor.code);
          if (keyCode !== null && keyCode !== undefined) { keys.push(this.scene.input.keyboard.addKey(keyCode)); codes.add(descriptor.code); }
        } else if (descriptor.device === 'pointer') buttons.add(descriptor.button);
      }
      this.keysByAction.set(action, keys); this.codesByAction.set(action, codes); this.pointerButtonsByAction.set(action, buttons);
    }
    this.bindingRevision += 1;
    this.suppressHeldActions();
  }

  #available() { return !this.disposed && !this.manager.locked && !this.manager.captureActive; }

  justPressed(action) {
    if (!this.#available()) return false;
    const keys = this.keysByAction.get(action) ?? [];
    if (this.blockedUntilRelease.has(action)) {
      if (keys.every((key) => !key.isDown)) this.blockedUntilRelease.delete(action);
    } else if (this.keyboardPressed.has(action)) return true;
    for (const button of this.pointerButtonsByAction.get(action) ?? []) {
      if (this.blockedPointerUntilRelease.has(button)) {
        if (!this.pointerDown.has(button)) this.blockedPointerUntilRelease.delete(button);
      } else if (this.pointerPressed.has(button)) return true;
    }
    return false;
  }

  justReleased(action) {
    if (!this.#available()) return false;
    if (this.keyboardReleased.has(action)) return true;
    for (const button of this.pointerButtonsByAction.get(action) ?? []) if (this.pointerReleased.has(button)) return true;
    return false;
  }

  isDown(action) {
    if (!this.#available()) return false;
    const keyDown = !this.blockedUntilRelease.has(action) && (this.keysByAction.get(action) ?? []).some((key) => key.isDown);
    if (keyDown) return true;
    for (const button of this.pointerButtonsByAction.get(action) ?? []) {
      if (!this.blockedPointerUntilRelease.has(button) && this.pointerDown.has(button)) return true;
    }
    return false;
  }

  getMovementVector() {
    return { x: Number(this.isDown('moveRight')) - Number(this.isDown('moveLeft')), y: Number(this.isDown('moveDown')) - Number(this.isDown('moveUp')) };
  }

  getPointerWorldPosition(camera, output = this.pointerWorld) {
    const pointer = this.scene.input.activePointer;
    if (!pointer || !camera || !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) return null;
    camera.getWorldPoint(pointer.x, pointer.y, output);
    return output;
  }

  suppressHeldActions() {
    for (const [action, keys] of this.keysByAction.entries()) if (keys.some((key) => key.isDown)) this.blockedUntilRelease.add(action);
    for (const button of this.pointerDown) this.blockedPointerUntilRelease.add(button);
    this.pointerPressed.clear(); this.pointerReleased.clear(); this.keyboardPressed.clear(); this.keyboardReleased.clear();
  }

  diagnostics() {
    return { bindingRevision: this.bindingRevision, actionCount: this.keysByAction.size, keyObjectCount: [...this.keysByAction.values()].reduce((sum, keys) => sum + keys.length, 0), pointerBindingCount: [...this.pointerButtonsByAction.values()].reduce((sum, buttons) => sum + buttons.size, 0) };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const keys of this.keysByAction.values()) for (const key of keys) this.scene.input.keyboard.removeKey(key);
    this.scene.input.keyboard.off('keydown', this.onKeyDown);
    this.scene.input.keyboard.off('keyup', this.onKeyUp);
    this.scene.input.off('pointerdown', this.onPointerDown);
    this.scene.input.off('pointerup', this.onPointerUp);
    this.scene.input.off('pointerupoutside', this.onPointerUp);
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.onPostUpdate);
    this.keysByAction.clear(); this.codesByAction.clear(); this.pointerButtonsByAction.clear();
    this.pointerDown.clear(); this.pointerPressed.clear(); this.pointerReleased.clear(); this.keyboardPressed.clear(); this.keyboardReleased.clear();
    this.onDispose(this);
  }
}

export class InputManager {
  constructor({ eventBus, bindingProvider = null }) {
    this.eventBus = eventBus;
    this.bindingProvider = bindingProvider;
    this.game = null;
    this.contexts = new Set();
    this.locked = false;
    this.captureActive = false;
    this.bindingRevision = 0;
    this.boundContextMenu = (event) => event.preventDefault();
    this.boundBlur = () => this.suppressHeldActions();
    this.boundVisibility = () => { if (document.hidden) this.suppressHeldActions(); };
    this.unsubscribeSettings = eventBus.subscribe('settings:changed', ({ path }) => {
      if (path === 'controls.bindings' || path?.startsWith('controls.bindings.')) this.refreshContexts('settings-change');
    }, { owner: this });
  }

  setBindingProvider(provider) { this.bindingProvider = provider; }
  getBindingsSnapshot() {
    const raw = this.bindingProvider?.() ?? {};
    return mergeBindings(normalizeBindings(raw, { repair: true }).bindings);
  }

  attachGame(game) {
    if (this.game === game) return;
    this.detachGame(); this.game = game;
    game.canvas.addEventListener('contextmenu', this.boundContextMenu);
    globalThis.addEventListener('blur', this.boundBlur);
    document.addEventListener('visibilitychange', this.boundVisibility);
  }

  detachGame() {
    if (!this.game) return;
    this.game.canvas.removeEventListener('contextmenu', this.boundContextMenu);
    globalThis.removeEventListener('blur', this.boundBlur);
    document.removeEventListener('visibilitychange', this.boundVisibility);
    this.game = null;
  }

  createContext(scene, cleanupRegistry) {
    const context = new InputContext(scene, this.getBindingsSnapshot(), this, (disposed) => this.contexts.delete(disposed));
    this.contexts.add(context);
    cleanupRegistry.add(() => context.dispose());
    return context;
  }

  refreshContexts(reason = 'manual') {
    const bindings = this.getBindingsSnapshot();
    this.suppressHeldActions();
    for (const context of this.contexts) context.rebind(bindings);
    this.bindingRevision += 1;
    this.eventBus.emit('input:contexts:rebuilt', { reason, contextCount: this.contexts.size, bindingRevision: this.bindingRevision });
  }

  beginCapture() { this.captureActive = true; this.suppressHeldActions(); this.eventBus.emit('input:capture:changed', { active: true }); }
  endCapture() { this.captureActive = false; this.suppressHeldActions(); this.eventBus.emit('input:capture:changed', { active: false }); }

  setLocked(locked) {
    this.locked = Boolean(locked);
    if (this.locked) this.suppressHeldActions();
    this.eventBus.emit('input:lock:changed', { locked: this.locked });
  }
  suppressHeldActions() { for (const context of this.contexts) context.suppressHeldActions(); }
  getDiagnostics() {
    const contexts = [...this.contexts].map((context) => context.diagnostics());
    return { contextCount: contexts.length, bindingRevision: this.bindingRevision, captureActive: this.captureActive, locked: this.locked, keyObjectCount: contexts.reduce((sum, entry) => sum + entry.keyObjectCount, 0), contexts };
  }
  dispose() {
    for (const context of [...this.contexts]) context.dispose();
    this.unsubscribeSettings?.(); this.unsubscribeSettings = null;
    this.detachGame();
  }
}
