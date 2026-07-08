import test from 'node:test';
import assert from 'node:assert/strict';
import { CORE_ENEMY_DEFINITIONS } from '../src/data/coreEnemyDefinitions.js';
import { BaseEnemy } from '../src/enemies/BaseEnemy.js';
import { PROTOTYPE_ARENA } from '../src/data/prototypeArena.js';
import { planCarrierHazards } from '../src/enemy-ai/carrierHazardPlacement.js';
import { classifyBulwarkHit } from '../src/enemy-ai/bulwarkDefense.js';
import { ENEMY_STATES, EnemyStateMachine } from '../src/enemy-ai/EnemyStateMachine.js';
import { LancerBrain } from '../src/enemy-ai/LancerBrain.js';
import { evaluateLancerChargePath } from '../src/enemy-ai/lancerAttackSpace.js';
import { EchoCooldownModel } from '../src/systems/EchoCooldownModel.js';
import { SuppressionModifierService } from '../src/systems/SuppressionModifierService.js';

const openBounds = { left: 0, right: 1000, top: 0, bottom: 1000 };

test('Lancer path uses full requested distance in open space', () => {
  const result = evaluateLancerChargePath({ origin: { x: 200, y: 500 }, direction: { x: 1, y: 0 }, maximumDistance: 620, collisionRadius: 23, bounds: openBounds, walls: [] });
  assert.equal(result.valid, true);
  assert.equal(result.maximumDistance, 620);
  assert.deepEqual(result.endpoint, { x: 820, y: 500 });
});

test('Lancer path truncates at arena boundary', () => {
  const result = evaluateLancerChargePath({ origin: { x: 800, y: 500 }, direction: { x: 1, y: 0 }, maximumDistance: 620, collisionRadius: 23, bounds: openBounds, walls: [] });
  assert.equal(result.valid, true);
  assert.equal(result.maximumDistance, 177);
  assert.equal(result.limitingObstacle, 'arena-boundary');
});

test('Lancer path truncates before an internal wall', () => {
  const result = evaluateLancerChargePath({
    origin: { x: 100, y: 500 }, direction: { x: 1, y: 0 }, maximumDistance: 620, collisionRadius: 20,
    bounds: openBounds, walls: [{ id: 'wall', x: 500, y: 500, width: 50, height: 200 }],
  });
  assert.equal(result.valid, true);
  assert.equal(result.limitingObstacle, 'wall');
  assert.ok(result.maximumDistance < 360);
  assert.ok(result.endpoint.x < 455);
});

test('Lancer path rejects insufficient attack space', () => {
  const result = evaluateLancerChargePath({
    origin: { x: 100, y: 500 }, direction: { x: 1, y: 0 }, maximumDistance: 620, collisionRadius: 20, minimumDistance: 140,
    bounds: openBounds, walls: [{ id: 'near', x: 210, y: 500, width: 50, height: 200 }],
  });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'insufficient-charge-space');
  assert.equal(result.maximumDistance, 0);
});

test('Lancer path rejects a zero direction', () => {
  const result = evaluateLancerChargePath({ origin: { x: 100, y: 100 }, direction: { x: 0, y: 0 }, maximumDistance: 620, bounds: openBounds });
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'invalid-direction');
});

test('Lancer path remains finite for diagonal movement', () => {
  const result = evaluateLancerChargePath({ origin: { x: 400, y: 400 }, direction: { x: 1, y: 1 }, maximumDistance: 620, collisionRadius: 23, bounds: openBounds, walls: [] });
  assert.equal(result.valid, true);
  assert.equal(Number.isFinite(result.endpoint.x) && Number.isFinite(result.endpoint.y), true);
});

function createLancerBrainEnemy(endpointValidator = () => ({ valid: true, maximumDistance: 180 })) {
  const state = new EnemyStateMachine();
  state.transition(ENEMY_STATES.spawning);
  const enemy = {
    state,
    x: 100,
    y: 100,
    moveSpeed: 125,
    maximumCharge: 620,
    currentChargeDistance: 620,
    telegraphMs: 760,
    lockMs: 140,
    chargeSpeed: 760,
    recoveryMs: 1000,
    spawnDurationMs: 0,
    endpointValidator,
    bodySprite: { body: { blocked: { left: false, right: false, up: false, down: false } } },
    renderer: { setRotation() {}, setLaneLength() {} },
    velocity: { x: 0, y: 0 },
    setVelocity(x, y) { this.velocity = { x, y }; },
    directionTo(target) { const dx = target.x - this.x; const dy = target.y - this.y; const length = Math.hypot(dx, dy) || 1; return { x: dx / length, y: dy / length }; },
    activateFromSpawn() { this.state.transition(ENEMY_STATES.active); },
    beginAnticipation(_direction, distance) { this.currentChargeDistance = distance; this.state.transition(ENEMY_STATES.anticipation); },
    cancelAnticipation() { this.state.transition(ENEMY_STATES.active); },
    beginLock() { this.state.transition(ENEMY_STATES.lock); },
    beginExecution() { this.state.transition(ENEMY_STATES.execution); },
    beginRecovery() { this.state.transition(ENEMY_STATES.recovery); },
    finishRecovery() { this.state.transition(ENEMY_STATES.active); },
  };
  return enemy;
}

test('LancerBrain completes anticipation, lock, execution, and recovery', () => {
  const enemy = createLancerBrainEnemy();
  const brain = new LancerBrain(enemy);
  const context = { player: { x: 300, y: 100 }, neighbours: [], telegraph() {}, commit() {} };
  brain.update(0, context);
  assert.equal(enemy.state.value, ENEMY_STATES.active);
  brain.update(1, context);
  assert.equal(enemy.state.value, ENEMY_STATES.anticipation);
  assert.equal(enemy.currentChargeDistance, 180);
  brain.update(760, context);
  assert.equal(enemy.state.value, ENEMY_STATES.lock);
  brain.update(140, context);
  assert.equal(enemy.state.value, ENEMY_STATES.execution);
  enemy.x = 300;
  brain.update(16, context);
  assert.equal(enemy.state.value, ENEMY_STATES.recovery);
  brain.update(1000, context);
  assert.equal(enemy.state.value, ENEMY_STATES.active);
});

test('LancerBrain cancels anticipation when tracked path becomes invalid', () => {
  let calls = 0;
  const enemy = createLancerBrainEnemy(() => (++calls === 1 ? { valid: true, maximumDistance: 180 } : { valid: false, maximumDistance: 0 }));
  const brain = new LancerBrain(enemy);
  const context = { player: { x: 300, y: 100 }, neighbours: [] };
  brain.update(0, context);
  brain.update(1, context);
  assert.equal(enemy.state.value, ENEMY_STATES.anticipation);
  brain.update(16, context);
  assert.equal(enemy.state.value, ENEMY_STATES.active);
});

test('EnemyStateMachine permits canonical Lancer anticipation cancellation', () => {
  const state = new EnemyStateMachine();
  state.transition(ENEMY_STATES.spawning);
  state.transition(ENEMY_STATES.active);
  state.transition(ENEMY_STATES.anticipation);
  state.transition(ENEMY_STATES.active);
  assert.equal(state.value, ENEMY_STATES.active);
});

test('Carrier hazard placement returns three finite bounded points', () => {
  const result = planCarrierHazards({ origin: { x: 800, y: 450 }, ownerId: 'carrier-1', count: 3, hazardRadius: 54, bounds: PROTOTYPE_ARENA.bounds, walls: PROTOTYPE_ARENA.walls, playerPosition: { x: 800, y: 735 } });
  assert.equal(result.valid, true);
  assert.equal(result.points.length, 3);
  assert.equal(result.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)), true);
  assert.equal(result.points.every((point) => point.x >= PROTOTYPE_ARENA.bounds.left && point.x <= PROTOTYPE_ARENA.bounds.right && point.y >= PROTOTYPE_ARENA.bounds.top && point.y <= PROTOTYPE_ARENA.bounds.bottom), true);
});

test('Carrier hazard placement is deterministic per owner', () => {
  const input = { origin: { x: 350, y: 450 }, ownerId: 'carrier-deterministic', count: 3, hazardRadius: 54, bounds: PROTOTYPE_ARENA.bounds, walls: PROTOTYPE_ARENA.walls, playerPosition: { x: 800, y: 735 } };
  assert.deepEqual(planCarrierHazards(input), planCarrierHazards(input));
});

test('Carrier hazard placement changes rotation for different owners', () => {
  const base = { origin: { x: 350, y: 450 }, count: 3, hazardRadius: 54, bounds: PROTOTYPE_ARENA.bounds, walls: PROTOTYPE_ARENA.walls, playerPosition: { x: 800, y: 735 } };
  assert.notDeepEqual(planCarrierHazards({ ...base, ownerId: 'carrier-a' }).points, planCarrierHazards({ ...base, ownerId: 'carrier-b' }).points);
});

test('Carrier hazard placement caps subordinate count at three', () => {
  const result = planCarrierHazards({ origin: { x: 300, y: 450 }, ownerId: 'carrier-cap', count: 99, hazardRadius: 40, bounds: openBounds, walls: [] });
  assert.equal(result.requestedCount, 3);
  assert.equal(result.points.length, 3);
});

test('Carrier hazard placement respects player clearance', () => {
  const player = { x: 500, y: 500 };
  const result = planCarrierHazards({ origin: { x: 500, y: 500 }, ownerId: 'carrier-player', count: 3, hazardRadius: 30, bounds: openBounds, walls: [], playerPosition: player, minimumPlayerDistance: 180 });
  assert.equal(result.points.every((point) => Math.hypot(point.x - player.x, point.y - player.y) >= 180), true);
});

test('Carrier hazard placement avoids walls', () => {
  const wall = { id: 'center', x: 500, y: 500, width: 300, height: 300 };
  const result = planCarrierHazards({ origin: { x: 250, y: 500 }, ownerId: 'carrier-wall', count: 3, hazardRadius: 30, bounds: openBounds, walls: [wall], playerPosition: { x: 900, y: 900 } });
  for (const point of result.points) {
    const closestX = Math.max(350, Math.min(point.x, 650));
    const closestY = Math.max(350, Math.min(point.y, 650));
    assert.ok(Math.hypot(point.x - closestX, point.y - closestY) >= 38);
  }
});

test('Carrier canonical threat includes payload pressure as one roster cost', () => {
  const carrier = CORE_ENEMY_DEFINITIONS['shard-carrier'];
  assert.equal(carrier.threatCost, 3);
  assert.equal(carrier.projectileValues.shardCount, 3);
  assert.equal(carrier.damageValues.hazard, 14);
});

test('SuppressionModifierService applies only the strongest scalar', () => {
  const service = new SuppressionModifierService();
  service.update([
    { enemyId: 'a', fieldActive: true, x: 0, y: 0, fieldRadius: 300, echoRecoveryScalar: 0.6 },
    { enemyId: 'b', fieldActive: true, x: 0, y: 0, fieldRadius: 300, echoRecoveryScalar: 0.45 },
  ], { x: 10, y: 10 });
  assert.equal(service.scalar, 0.45);
  assert.equal(service.sources.size, 2);
});

test('SuppressionModifierService recomputes immediately after source removal', () => {
  const service = new SuppressionModifierService();
  service.update([
    { enemyId: 'a', fieldActive: true, x: 0, y: 0, fieldRadius: 300, echoRecoveryScalar: 0.45 },
    { enemyId: 'b', fieldActive: true, x: 0, y: 0, fieldRadius: 300, echoRecoveryScalar: 0.7 },
  ], { x: 10, y: 10 });
  assert.equal(service.removeSource('a'), true);
  assert.equal(service.active, true);
  assert.equal(service.scalar, 0.7);
  assert.equal(service.removeSource('b'), true);
  assert.equal(service.active, false);
  assert.equal(service.scalar, 1);
});

test('SuppressionModifierService emits start and end once per transition', () => {
  const events = [];
  const service = new SuppressionModifierService({ eventBus: { emit: (name) => events.push(name) } });
  const suppressor = { enemyId: 'a', fieldActive: true, x: 0, y: 0, fieldRadius: 300, echoRecoveryScalar: 0.45 };
  service.update([suppressor], { x: 0, y: 0 });
  service.update([suppressor], { x: 0, y: 0 });
  service.update([], { x: 0, y: 0 });
  service.update([], { x: 0, y: 0 });
  assert.deepEqual(events, ['enemy:suppressor:suppression:started', 'enemy:suppressor:suppression:ended']);
});

test('Echo cooldown recovery never becomes negative under suppression', () => {
  const cooldown = new EchoCooldownModel(1000);
  cooldown.consume();
  cooldown.update(5000, 0.45);
  assert.equal(cooldown.remainingMs, 0);
  assert.equal(cooldown.isReady, true);
});

test('Bulwark front mitigation preserves resistance without immunity', () => {
  const result = classifyBulwarkHit({ shieldAngle: 0, incomingDirection: { x: -1, y: 0 }, shieldArcRadians: 150 * Math.PI / 180, sideTransitionRadians: 20 * Math.PI / 180, frontalScalar: 0.22 });
  assert.equal(result.zone, 'front');
  assert.ok(result.scalar > 0 && result.scalar < 1);
});

test('Bulwark side transition reaches full rear damage continuously', () => {
  const common = { shieldAngle: 0, shieldArcRadians: 150 * Math.PI / 180, sideTransitionRadians: 20 * Math.PI / 180, frontalScalar: 0.22 };
  const nearFront = classifyBulwarkHit({ ...common, incomingDirection: { x: -Math.cos(76 * Math.PI / 180), y: -Math.sin(76 * Math.PI / 180) } });
  const nearRear = classifyBulwarkHit({ ...common, incomingDirection: { x: -Math.cos(94 * Math.PI / 180), y: -Math.sin(94 * Math.PI / 180) } });
  assert.equal(nearFront.zone, 'side');
  assert.equal(nearRear.zone, 'side');
  assert.ok(nearRear.scalar > nearFront.scalar);
  assert.ok(nearRear.scalar < 1);
});


test('BaseEnemy cleanup tolerates a physics body already removed during scene shutdown', () => {
  const enemy = Object.create(BaseEnemy.prototype);
  enemy.active = true;
  enemy.enemyId = 'cleanup-test';
  enemy.bodySprite = {
    body: undefined,
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setActive(value) { this.active = value; return this; },
  };
  enemy.renderer = {
    setVisible(value) { this.visible = value; },
    container: { setAlpha() { return this; }, setScale() { return this; } },
  };
  enemy.state = { resetCalled: false, reset() { this.resetCalled = true; } };
  enemy.health = { resetValue: null, reset(value) { this.resetValue = value; } };

  assert.equal(enemy.deactivate(), true);
  assert.equal(enemy.active, false);
  assert.equal(enemy.bodySprite.active, false);
  assert.equal(enemy.renderer.visible, false);
  assert.equal(enemy.state.resetCalled, true);
  assert.equal(enemy.health.resetValue, 1);
});

test('CarrierShard cleanup tolerates a physics body already removed during scene shutdown', async () => {
  const { CarrierShard } = await import('../src/entities/CarrierShard.js');
  const shard = Object.create(CarrierShard.prototype);
  shard.active = true;
  shard.state = 'ACTIVE';
  shard.bodySprite = {
    body: undefined,
    setActive(value) { this.active = value; return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
  };
  shard.container = {
    setVisible(value) { this.visible = value; return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setScale(value) { this.scale = value; return this; },
  };
  shard.contactDamage = { resetCalled: false, reset() { this.resetCalled = true; } };
  assert.equal(shard.deactivate('shutdown-order'), true);
  assert.equal(shard.active, false);
  assert.equal(shard.bodySprite.active, false);
  assert.equal(shard.container.visible, false);
  assert.equal(shard.contactDamage.resetCalled, true);
  assert.equal(shard.deactivate('again'), false);
});
