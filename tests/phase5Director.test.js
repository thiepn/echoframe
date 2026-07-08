import test from 'node:test';
import assert from 'node:assert/strict';
import { SeededRandom } from '../src/utils/SeededRandom.js';
import { ThreatBudgetModel } from '../src/encounter/ThreatBudgetModel.js';
import { EncounterGenerator } from '../src/encounter/EncounterGenerator.js';
import { EncounterHistory } from '../src/encounter/EncounterHistory.js';
import { EncounterCompositionValidator } from '../src/encounter/EncounterCompositionValidator.js';
import { RecoveryWindowController } from '../src/encounter/RecoveryWindowController.js';
import { SpawnPlanner } from '../src/encounter/SpawnPlanner.js';
import { SpawnSafetyValidator } from '../src/encounter/SpawnSafetyValidator.js';
import { SPAWN_POINT_DEFINITIONS } from '../src/data/spawnPointDefinitions.js';
import { classifyBulwarkHit } from '../src/enemy-ai/bulwarkDefense.js';
import { SuppressionModifierService } from '../src/systems/SuppressionModifierService.js';
import { EchoCooldownModel } from '../src/systems/EchoCooldownModel.js';

test('SeededRandom reproduces sequences and isolates derived streams', () => {
  const a = new SeededRandom(42);
  const b = new SeededRandom(42);
  assert.deepEqual([a.nextUint32(), a.nextUint32(), a.nextUint32()], [b.nextUint32(), b.nextUint32(), b.nextUint32()]);
  assert.notEqual(new SeededRandom(42).derive('gameplay').nextUint32(), new SeededRandom(42).derive('cosmetic').nextUint32());
  a.reset();
  assert.equal(a.nextUint32(), new SeededRandom(42).nextUint32());
});

test('ThreatBudgetModel consumes without becoming negative', () => {
  const model = new ThreatBudgetModel({ targetThreat: 10, toleranceBelow: 0.1, toleranceAbove: 0.1 });
  assert.equal(model.consume(4), true);
  assert.equal(model.consume(7), true);
  assert.equal(model.remainingThreat, 0);
  assert.equal(model.withinTolerance, true);
  assert.equal(model.consume(1), false);
});

test('EncounterGenerator is deterministic and chamber restricted', () => {
  const generator = new EncounterGenerator();
  const first = generator.generateChamber({ seed: 123, difficultyId: 'standard', chamberIndex: 1, encounterHistory: new EncounterHistory(), spawnSafetyRadius: 260 });
  const second = generator.generateChamber({ seed: 123, difficultyId: 'standard', chamberIndex: 1, encounterHistory: new EncounterHistory(), spawnSafetyRadius: 260 });
  assert.deepEqual(first, second);
  assert.equal(first.flatMap((descriptor) => descriptor.enemyEntries).every((entry) => ['drifter', 'sentry', 'lancer'].includes(entry.enemyType)), true);
  assert.equal(Object.isFrozen(first[0]), true);
});

test('Chamber 2 generation introduces all new enemies and valid finale', () => {
  const descriptors = new EncounterGenerator().generateChamber({ seed: 987, difficultyId: 'standard', chamberIndex: 2, encounterHistory: new EncounterHistory(), spawnSafetyRadius: 260 });
  const types = new Set(descriptors.flatMap((descriptor) => descriptor.enemyEntries.map((entry) => entry.enemyType)));
  for (const type of ['lancer', 'shard-carrier', 'bulwark', 'suppressor']) assert.equal(types.has(type), true);
  const finale = descriptors.at(-1);
  assert.equal(finale.phase, 'CLIMAX');
  assert.equal(new Set(finale.enemyEntries.map((entry) => entry.enemyType)).size, 6);
  assert.equal(finale.generationDiagnostics.fallbackUsed, false);
});

test('Composition validator rejects saturation and accepts a mixed roster', () => {
  const validator = new EncounterCompositionValidator();
  const pattern = { minimumTypes: 1, maximumTypes: 6, requiredRoles: [] };
  const allowed = ['drifter', 'sentry', 'lancer', 'shard-carrier', 'bulwark', 'suppressor'];
  const invalid = validator.validate(['sentry', 'sentry', 'sentry', 'sentry', 'sentry'], { targetThreat: 10, allowedEnemyTypes: allowed, pattern });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.reasons.includes('projectile-saturation') || invalid.reasons.includes('enemy-cap'), true);
  const valid = validator.validate(['drifter', 'sentry', 'lancer'], { targetThreat: 6, allowedEnemyTypes: allowed, pattern });
  assert.equal(valid.valid, true);
});

test('EncounterHistory prevents exact consecutive repeats', () => {
  const history = new EncounterHistory();
  const descriptor = { pattern: 'A', enemyEntries: [{ enemyType: 'drifter' }, { enemyType: 'sentry' }], generationDiagnostics: { dominantRole: 'PRESSURE' }, recoveryAfterMs: 0 };
  history.add(descriptor);
  assert.equal(history.exactRepeat('drifter:1|sentry:1'), true);
  history.reset();
  assert.equal(history.exactRepeat('drifter:1|sentry:1'), false);
});

test('SpawnPlanner is deterministic and respects player safety', () => {
  const planner = new SpawnPlanner({ points: SPAWN_POINT_DEFINITIONS, validator: new SpawnSafetyValidator({ wallDefinitions: [], worldBounds: { x: 80, y: 45, width: 1440, height: 810 } }) });
  const input = [{ enemyType: 'lancer', requiredRole: 'BURST', clearanceRadius: 40, groupIndex: 0, activationOrder: 0 }];
  const a = planner.plan(input, { random: new SeededRandom(5), playerPosition: { x: 800, y: 450 }, safetyRadius: 260 });
  planner.reset();
  const b = planner.plan(input, { random: new SeededRandom(5), playerPosition: { x: 800, y: 450 }, safetyRadius: 260 });
  assert.deepEqual(a, b);
  assert.ok(Math.hypot(a.planned[0].x - 800, a.planned[0].y - 450) >= 260);
});

test('RecoveryWindowController freezes while paused and completes once', () => {
  const recovery = new RecoveryWindowController();
  assert.equal(recovery.start(1000), true);
  recovery.update(600, { paused: true });
  assert.equal(recovery.remainingMs, 1000);
  assert.equal(recovery.update(600), false);
  assert.equal(recovery.update(400), true);
  assert.equal(recovery.update(400), false);
});

test('Bulwark defense classifies protected, side, and rear hits', () => {
  const base = { shieldAngle: 0, shieldArcRadians: 150 * Math.PI / 180, sideTransitionRadians: 20 * Math.PI / 180, frontalScalar: 0.22 };
  assert.equal(classifyBulwarkHit({ ...base, incomingDirection: { x: -1, y: 0 } }).zone, 'front');
  assert.equal(classifyBulwarkHit({ ...base, incomingDirection: { x: 1, y: 0 } }).zone, 'rear');
  const side = classifyBulwarkHit({ ...base, incomingDirection: { x: -Math.cos(85 * Math.PI / 180), y: -Math.sin(85 * Math.PI / 180) } });
  assert.equal(side.zone, 'side');
  assert.ok(side.scalar > 0.22 && side.scalar < 1);
});

test('Suppressor fields do not stack and slow Echo cooldown recovery', () => {
  const service = new SuppressionModifierService();
  const suppressors = [{ enemyId: 'a', fieldActive: true, x: 0, y: 0, fieldRadius: 210, echoRecoveryScalar: 0.45 }, { enemyId: 'b', fieldActive: true, x: 0, y: 0, fieldRadius: 210, echoRecoveryScalar: 0.6 }];
  assert.equal(service.update(suppressors, { x: 50, y: 0 }), 0.45);
  const cooldown = new EchoCooldownModel(1000);
  cooldown.consume();
  cooldown.update(100, service.scalar);
  assert.equal(cooldown.remainingMs, 955);
  service.update([], { x: 0, y: 0 });
  assert.equal(service.active, false);
});

test('EncounterHistory ignores recovery descriptors when preventing combat repeats', () => {
  const history = new EncounterHistory();
  const combat = { pattern: 'PRESSURE_LINE', enemyEntries: [{ enemyType: 'drifter' }, { enemyType: 'sentry' }], recoveryAfterMs: 0, generationDiagnostics: { dominantRole: 'PRESSURE', spawnTopology: 'authored-sockets' } };
  history.add(combat);
  history.add({ pattern: 'RECOVERY', enemyEntries: [], recoveryAfterMs: 3000, generationDiagnostics: { dominantRole: null, spawnTopology: 'authored-sockets' } });
  assert.equal(history.exactRepeat('drifter:1|sentry:1'), true);
  assert.equal(history.previousPattern(), 'PRESSURE_LINE');
});
