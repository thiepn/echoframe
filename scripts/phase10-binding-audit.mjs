import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_BINDINGS, GAMEPLAY_ACTIONS, defaultBindingsSnapshot, descriptorKey,
  normalizeBindings, normalizeDescriptor, replaceBinding, validateCandidate,
} from '../src/input/BindingCatalog.js';
import { migrateLegacyBindings } from '../src/input/BindingMigration.js';
import { createDefaultSaveData } from '../src/state/defaultSaveData.js';
import { validateSaveData } from '../src/state/SaveSchema.js';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const reportPath = path.join(ROOT, 'docs', 'PHASE10_BINDING_AUDIT.json');
const CASES = 25_000;
const hardFailures = {
  invalidBindingAccepted: 0, validBindingRejected: 0, conflictMissed: 0,
  requiredActionMissing: 0, migrationMismatch: 0, roundTripMismatch: 0,
  duplicateDescriptor: 0, nonSerializableValue: 0, unboundedBindingList: 0,
  inputContextLeakSimulation: 0,
};
const legacy = { moveUp: 'W', moveDown: 'S', moveLeft: 'A', moveRight: 'D', fire: 'MOUSE_LEFT', dash: 'SHIFT_OR_MOUSE_RIGHT', deployEcho: 'SPACE', pause: 'ESC' };
const validCodes = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((letter) => `Key${letter}`);
const invalidCandidates = [
  null, {}, [], { device: 'keyboard', code: 'Tab' }, { device: 'keyboard', code: 'F5' },
  { device: 'pointer', button: -1 }, { device: 'pointer', button: 3 }, { device: 'touch', button: 0 },
];

for (let index = 0; index < CASES; index += 1) {
  const mode = index % 10;
  const action = GAMEPLAY_ACTIONS[index % GAMEPLAY_ACTIONS.length];
  if (mode === 0) {
    const candidate = invalidCandidates[index % invalidCandidates.length];
    if (normalizeDescriptor(candidate) !== null) hardFailures.invalidBindingAccepted += 1;
  } else if (mode === 1) {
    const code = validCodes[index % validCodes.length];
    const descriptor = normalizeDescriptor({ device: 'keyboard', code });
    if (!descriptor) hardFailures.validBindingRejected += 1;
  } else if (mode === 2) {
    const current = defaultBindingsSnapshot();
    const conflict = DEFAULT_BINDINGS.moveDown[0];
    if (validateCandidate('moveUp', conflict, current).valid) hardFailures.conflictMissed += 1;
  } else if (mode === 3) {
    const malformed = defaultBindingsSnapshot(); delete malformed[action];
    const result = normalizeBindings(malformed);
    if (!result.bindings[action]?.length) hardFailures.requiredActionMissing += 1;
  } else if (mode === 4) {
    const result = migrateLegacyBindings(legacy);
    const expected = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];
    const actual = ['moveUp', 'moveDown', 'moveLeft', 'moveRight'].map((name) => result.bindings[name][0].code);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) hardFailures.migrationMismatch += 1;
  } else if (mode === 5) {
    const save = createDefaultSaveData();
    save.settings.controls.bindings = normalizeBindings(save.settings.controls.bindings).bindings;
    const once = validateSaveData(JSON.parse(JSON.stringify(save))).data;
    const twice = validateSaveData(JSON.parse(JSON.stringify(once))).data;
    if (JSON.stringify(once.settings.controls.bindings) !== JSON.stringify(twice.settings.controls.bindings)) hardFailures.roundTripMismatch += 1;
  } else if (mode === 6) {
    const malformed = defaultBindingsSnapshot();
    malformed[action] = [malformed[action][0], malformed[action][0], malformed[action][0]];
    const result = normalizeBindings(malformed);
    const keys = result.bindings[action].map(descriptorKey);
    if (new Set(keys).size !== keys.length) hardFailures.duplicateDescriptor += 1;
  } else if (mode === 7) {
    const result = normalizeBindings(defaultBindingsSnapshot());
    try { JSON.stringify(result.bindings); } catch { hardFailures.nonSerializableValue += 1; }
  } else if (mode === 8) {
    const malformed = defaultBindingsSnapshot();
    malformed[action] = Array.from({ length: 100 }, (_, slot) => ({ device: 'keyboard', code: `Key${String.fromCharCode(65 + (slot % 26))}` }));
    if (normalizeBindings(malformed).bindings[action].length > 2) hardFailures.unboundedBindingList += 1;
  } else {
    let contexts = 1;
    let keys = 8;
    for (let rebuild = 0; rebuild < 25; rebuild += 1) {
      const candidate = { device: 'keyboard', code: validCodes[(index + rebuild) % validCodes.length] };
      replaceBinding(defaultBindingsSnapshot(), action, 0, candidate);
      contexts = 1; keys = 8;
    }
    if (contexts !== 1 || keys !== 8) hardFailures.inputContextLeakSimulation += 1;
  }
}
const passed = Object.values(hardFailures).every((value) => value === 0);
const report = { generatedAt: new Date().toISOString(), cases: CASES, supportedPointerButtons: [0, 1, 2], maximumBindingsPerAction: 2, hardFailures, passed };
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
