export const GAMEPLAY_ACTIONS = Object.freeze([
  'moveUp', 'moveDown', 'moveLeft', 'moveRight',
  'fire', 'dash', 'deployEcho', 'pause',
]);

export const ACTION_LABELS = Object.freeze({
  moveUp: 'Move up', moveDown: 'Move down', moveLeft: 'Move left', moveRight: 'Move right',
  fire: 'Fire', dash: 'Dash', deployEcho: 'Deploy Echo', pause: 'Pause',
});

export const DEFAULT_BINDINGS = deepFreeze({
  moveUp: [{ device: 'keyboard', code: 'KeyW' }],
  moveDown: [{ device: 'keyboard', code: 'KeyS' }],
  moveLeft: [{ device: 'keyboard', code: 'KeyA' }],
  moveRight: [{ device: 'keyboard', code: 'KeyD' }],
  fire: [{ device: 'pointer', button: 0 }],
  dash: [
    { device: 'keyboard', code: 'ShiftLeft' },
    { device: 'pointer', button: 2 },
  ],
  deployEcho: [{ device: 'keyboard', code: 'Space' }],
  pause: [{ device: 'keyboard', code: 'Escape' }],
});

export const FIXED_MENU_BINDINGS = deepFreeze({
  confirm: [{ device: 'keyboard', code: 'Enter' }],
  cancel: [{ device: 'keyboard', code: 'Escape' }],
  uiUp: [{ device: 'keyboard', code: 'ArrowUp' }],
  uiDown: [{ device: 'keyboard', code: 'ArrowDown' }],
  uiLeft: [{ device: 'keyboard', code: 'ArrowLeft' }],
  uiRight: [{ device: 'keyboard', code: 'ArrowRight' }],
});

const SUPPORTED_NAMED_CODES = new Set([
  'Space', 'Enter', 'Escape', 'Backspace',
  'ShiftLeft', 'ShiftRight',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Comma', 'Period', 'Slash', 'Semicolon', 'Quote',
  'BracketLeft', 'BracketRight', 'Backslash', 'Minus', 'Equal', 'Backquote',
]);
const RESERVED_CODES = new Set(['Tab', 'MetaLeft', 'MetaRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'CapsLock', 'ContextMenu']);
const OPPOSING_ACTIONS = new Set(['moveDown|moveUp', 'moveLeft|moveRight']);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function clone(value) { return structuredClone(value); }

export function isSupportedKeyboardCode(code) {
  if (typeof code !== 'string') return false;
  return /^Key[A-Z]$/.test(code) || /^Digit[0-9]$/.test(code) || /^Numpad[0-9]$/.test(code) || SUPPORTED_NAMED_CODES.has(code);
}

export function descriptorKey(descriptor) {
  if (descriptor?.device === 'keyboard') return `keyboard:${descriptor.code}`;
  if (descriptor?.device === 'pointer') return `pointer:${descriptor.button}`;
  return 'invalid';
}

export function normalizeDescriptor(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  if (input.device === 'keyboard') {
    if (!isSupportedKeyboardCode(input.code) || RESERVED_CODES.has(input.code) || /^F\d+$/.test(input.code)) return null;
    return Object.freeze({ device: 'keyboard', code: input.code });
  }
  if (input.device === 'pointer') {
    const button = Number(input.button);
    if (!Number.isInteger(button) || button < 0 || button > 2) return null;
    return Object.freeze({ device: 'pointer', button });
  }
  return null;
}

export function bindingLabel(descriptor) {
  const value = normalizeDescriptor(descriptor);
  if (!value) return 'Unbound';
  if (value.device === 'pointer') return ['Left mouse', 'Middle mouse', 'Right mouse'][value.button];
  const labels = {
    Space: 'Space', Enter: 'Enter', Escape: 'Escape', Backspace: 'Backspace',
    ShiftLeft: 'Left Shift', ShiftRight: 'Right Shift',
    ArrowUp: 'Up Arrow', ArrowDown: 'Down Arrow', ArrowLeft: 'Left Arrow', ArrowRight: 'Right Arrow',
    Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`',
  };
  return labels[value.code] ?? value.code.replace(/^Key/, '').replace(/^Digit/, '');
}

export function bindingListLabel(bindings) {
  return (Array.isArray(bindings) ? bindings : []).map(bindingLabel).join(' / ') || 'Unbound';
}

export function validateCandidate(action, candidate, currentBindings, { slot = 0 } = {}) {
  if (!GAMEPLAY_ACTIONS.includes(action)) return { valid: false, reason: 'unknown-action' };
  const descriptor = normalizeDescriptor(candidate);
  if (!descriptor) return { valid: false, reason: 'unsupported-input' };
  if (descriptor.device === 'keyboard' && descriptor.code === 'Escape' && action !== 'pause') return { valid: false, reason: 'escape-reserved-for-pause' };
  if (descriptor.device === 'keyboard' && descriptor.code.startsWith('Shift') && action !== 'dash') return { valid: false, reason: 'modifier-only-reserved' };
  const key = descriptorKey(descriptor);
  for (const otherAction of GAMEPLAY_ACTIONS) {
    const list = currentBindings?.[otherAction] ?? [];
    for (let index = 0; index < list.length; index += 1) {
      if (otherAction === action && index === slot) continue;
      if (descriptorKey(list[index]) === key) {
        const pair = [action, otherAction].sort().join('|');
        return { valid: false, reason: OPPOSING_ACTIONS.has(pair) ? 'opposing-movement-conflict' : 'binding-conflict', conflictAction: otherAction };
      }
    }
  }
  return { valid: true, descriptor };
}

export function normalizeBindings(input, { repair = true } = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const output = {};
  const issues = [];
  const used = new Map();

  for (const action of GAMEPLAY_ACTIONS) {
    const raw = Array.isArray(source[action]) ? source[action].slice(0, 2) : [];
    const accepted = [];
    for (const candidate of raw) {
      const descriptor = normalizeDescriptor(candidate);
      if (!descriptor) { issues.push(`${action}:unsupported-input`); continue; }
      const key = descriptorKey(descriptor);
      if (accepted.some((entry) => descriptorKey(entry) === key)) { issues.push(`${action}:duplicate`); continue; }
      if (used.has(key)) { issues.push(`${action}:conflict:${used.get(key)}`); continue; }
      if (descriptor.device === 'keyboard' && descriptor.code === 'Escape' && action !== 'pause') { issues.push(`${action}:escape-reserved`); continue; }
      if (descriptor.device === 'keyboard' && descriptor.code.startsWith('Shift') && action !== 'dash') { issues.push(`${action}:modifier-reserved`); continue; }
      accepted.push(descriptor);
      used.set(key, action);
    }
    output[action] = accepted;
  }

  if (repair) {
    for (const action of GAMEPLAY_ACTIONS) {
      if (output[action].length > 0) continue;
      issues.push(`${action}:default-restored`);
      for (const fallback of DEFAULT_BINDINGS[action]) {
        const key = descriptorKey(fallback);
        if (!used.has(key)) { output[action].push(clone(fallback)); used.set(key, action); }
      }
      if (output[action].length === 0) {
        // Full reset is safer than leaving a required action unreachable.
        return { bindings: clone(DEFAULT_BINDINGS), issues: [...issues, 'all:defaults-restored'], repaired: true };
      }
    }
  }
  return { bindings: deepFreeze(output), issues, repaired: issues.length > 0 };
}

export function replaceBinding(currentBindings, action, slot, candidate) {
  const base = normalizeBindings(currentBindings).bindings;
  const validation = validateCandidate(action, candidate, base, { slot });
  if (!validation.valid) return { ok: false, ...validation, bindings: base };
  const next = clone(base);
  while (next[action].length <= slot) next[action].push(null);
  next[action][slot] = validation.descriptor;
  next[action] = next[action].filter(Boolean).slice(0, 2);
  const normalized = normalizeBindings(next, { repair: true });
  return { ok: true, bindings: normalized.bindings, descriptor: validation.descriptor, issues: normalized.issues };
}

export function clearSecondaryBinding(currentBindings, action) {
  const base = clone(normalizeBindings(currentBindings).bindings);
  if (!base[action] || base[action].length < 2) return { ok: true, skipped: true, bindings: deepFreeze(base) };
  base[action] = base[action].slice(0, 1);
  return { ok: true, bindings: normalizeBindings(base).bindings };
}

export function defaultBindingsSnapshot() { return clone(DEFAULT_BINDINGS); }
