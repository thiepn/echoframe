import test from 'node:test';
import assert from 'node:assert/strict';
import { MenuButton } from '../src/ui/MenuButton.js';

function chainable(overrides = {}) {
  const listeners = new Map();
  return Object.assign({
    listeners,
    setStrokeStyle() { return this; },
    setVisible() { return this; },
    setOrigin() { return this; },
    setInteractive() { return this; },
    disableInteractive() { return this; },
    setAlpha() { return this; },
    setScale() { return this; },
    setText() { return this; },
    on(event, handler) { listeners.set(event, handler); return this; },
    removeAllListeners() { listeners.clear(); return this; },
    destroy() { this.active = false; },
    active: true,
  }, overrides);
}

function createScene() {
  return {
    add: {
      container() { return chainable({ add() { return this; } }); },
      rectangle() { return chainable(); },
      triangle() { return chainable(); },
      text() { return chainable(); },
    },
  };
}

test('pointer activation falls back to the clicked button when focus routing is unavailable', () => {
  let activations = 0;
  const button = new MenuButton(createScene(), {
    x: 0,
    y: 0,
    label: 'Exit',
    onActivate: () => { activations += 1; },
  });
  button.setFocusManager({
    focusedControl: null,
    focus: () => false,
    activateFocused: () => assert.fail('focus activation should not be used'),
  });

  button.background.listeners.get('pointerup')({ button: 0 });
  assert.equal(activations, 1);
});

test('pointer activation uses the focused control when focus routing succeeds', () => {
  let activations = 0;
  const button = new MenuButton(createScene(), {
    x: 0,
    y: 0,
    label: 'Confirm',
    onActivate: () => { activations += 1; },
  });
  const manager = {
    focusedControl: null,
    focus(control) { this.focusedControl = control; return true; },
    activateFocused() { this.focusedControl.activate(); },
  };
  button.setFocusManager(manager);

  button.background.listeners.get('pointerup')({ button: 0 });
  assert.equal(activations, 1);
});

test('non-primary pointer buttons do not activate menu actions', () => {
  let activations = 0;
  const button = new MenuButton(createScene(), {
    x: 0,
    y: 0,
    label: 'Exit',
    onActivate: () => { activations += 1; },
  });

  button.background.listeners.get('pointerup')({ button: 2 });
  assert.equal(activations, 0);
});
