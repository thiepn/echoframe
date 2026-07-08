import { DEFAULT_BINDINGS, GAMEPLAY_ACTIONS, normalizeBindings } from './BindingCatalog.js';

const LEGACY = Object.freeze({
  W: [{ device: 'keyboard', code: 'KeyW' }],
  S: [{ device: 'keyboard', code: 'KeyS' }],
  A: [{ device: 'keyboard', code: 'KeyA' }],
  D: [{ device: 'keyboard', code: 'KeyD' }],
  MOUSE_LEFT: [{ device: 'pointer', button: 0 }],
  SHIFT_OR_MOUSE_RIGHT: [{ device: 'keyboard', code: 'ShiftLeft' }, { device: 'pointer', button: 2 }],
  SPACE: [{ device: 'keyboard', code: 'Space' }],
  ESC: [{ device: 'keyboard', code: 'Escape' }],
  ENTER: [{ device: 'keyboard', code: 'Enter' }],
});

export function migrateLegacyBindings(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const migrated = {};
  const issues = [];
  for (const action of GAMEPLAY_ACTIONS) {
    const raw = source[action];
    if (Array.isArray(raw)) migrated[action] = raw;
    else if (typeof raw === 'string' && LEGACY[raw]) migrated[action] = structuredClone(LEGACY[raw]);
    else { migrated[action] = structuredClone(DEFAULT_BINDINGS[action]); issues.push(`${action}:legacy-default`); }
  }
  const normalized = normalizeBindings(migrated, { repair: true });
  return { bindings: normalized.bindings, issues: [...issues, ...normalized.issues], migrated: true };
}

export function legacyBindingDescriptor(value) {
  return structuredClone(LEGACY[value] ?? null);
}
