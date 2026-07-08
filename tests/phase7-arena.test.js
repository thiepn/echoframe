import test from 'node:test';
import assert from 'node:assert/strict';
import { ArenaTemplateCatalog } from '../src/arena/ArenaTemplateCatalog.js';
import { ArenaTransformResolver } from '../src/arena/ArenaTransformResolver.js';
import { ArenaValidator } from '../src/arena/ArenaValidator.js';
import { ArenaGenerator } from '../src/arena/ArenaGenerator.js';
import { ArenaHistory } from '../src/arena/ArenaHistory.js';
import { createArenaDescriptor } from '../src/arena/ArenaDescriptor.js';
import { PHASE7_RUN_SEGMENTS } from '../src/data/phase7RunSegments.js';

const catalog = new ArenaTemplateCatalog();
const resolver = new ArenaTransformResolver();
const validator = new ArenaValidator();

function descriptorFor(template, transformId) {
  const transformed = resolver.resolve(template, transformId);
  return createArenaDescriptor({
    arenaInstanceId: `test-${template.id}-${transformId}`,
    templateId: template.id,
    templateVersion: template.version,
    selectionSeed: 1,
    segmentId: 'test',
    segmentIndex: 0,
    stageTags: [],
    transformId,
    rotationDegrees: transformed.transform.rotationDegrees,
    mirrorX: transformed.transform.mirrorX,
    mirrorY: transformed.transform.mirrorY,
    decorationVariantId: 'variant-a',
    hazardConfigurationId: 'none',
    playerSpawn: transformed.playerSpawn,
    enemySockets: transformed.enemySockets,
    eliteSockets: transformed.eliteSockets,
    hazardSockets: transformed.hazardSockets,
    solidGeometry: transformed.solidGeometry,
    safeZones: transformed.safeZones,
    navigationZones: transformed.navigationZones,
    lineOfSightMetadata: transformed.lineOfSightMetadata,
    cameraBounds: template.cameraBounds,
    tags: template.tags,
    forbiddenEncounterTags: template.forbiddenEncounterTags,
    validationVersion: template.validationVersion,
    decorationAnchors: transformed.decorationAnchors,
    generationDiagnostics: {},
  });
}

test('Phase 7 catalog contains seven gameplay templates plus one fixed boss chamber', () => {
  const all = catalog.all();
  assert.equal(all.length, 8);
  assert.equal(new Set(all.map((item) => item.id)).size, 8);
  assert.deepEqual(all.map((item) => item.id), [
    'open-circle', 'split-pillars', 'four-corners', 'side-channels',
    'broken-ring', 'offset-core', 'twin-islands', 'boss-chamber',
  ]);
});

for (const template of catalog.all()) {
  test(`${template.id} is immutable and contains authored gameplay metadata`, () => {
    assert.ok(Object.isFrozen(template));
    assert.ok(template.solids.length >= 4);
    assert.ok(template.enemySockets.length >= 4 || template.id === 'boss-chamber');
    assert.ok(template.validTransformIds.length >= 1 && template.validTransformIds.length <= 4);
    assert.ok(template.cameraBounds.left === 0 && template.cameraBounds.top === 0);
    assert.ok(template.validationVersion >= 1);
    assert.ok(template.identity.length > 0);
  });

  for (const transformId of template.validTransformIds) {
    test(`${template.id}/${transformId} passes independent arena validation`, () => {
      const descriptor = descriptorFor(template, transformId);
      const result = validator.validate(descriptor);
      assert.equal(result.valid, true, result.reasons.join(', '));
      assert.ok(Object.isFrozen(descriptor));
      assert.doesNotThrow(() => JSON.stringify(descriptor));
      assert.equal(descriptor.solidGeometry.every((rect) => [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)), true);
      assert.equal(descriptor.enemySockets.every((socket) => Number.isFinite(socket.x) && Number.isFinite(socket.y)), true);
    });
  }
}

test('boss chamber is fixed, no-hazard, and excluded from combat tags', () => {
  const boss = catalog.get('boss-chamber');
  assert.deepEqual(boss.validTransformIds, ['identity']);
  assert.deepEqual(boss.hazardConfigurationIds, ['none']);
  assert.ok(boss.tags.includes('boss'));
  assert.ok(!boss.tags.includes('combat'));
});

test('recovery generation always selects a safe no-hazard open arena', () => {
  const descriptor = new ArenaGenerator().generate({
    seed: 41,
    segment: PHASE7_RUN_SEGMENTS[6],
    history: new ArenaHistory(),
    recovery: true,
  });
  assert.equal(descriptor.templateId, 'open-circle');
  assert.equal(descriptor.transformId, 'identity');
  assert.equal(descriptor.hazardConfigurationId, 'none');
  assert.ok(descriptor.tags.includes('recovery'));
  assert.equal(validator.validate(descriptor).valid, true);
});

test('boss generation always selects the fixed boss chamber', () => {
  const descriptor = new ArenaGenerator().generate({
    seed: 41,
    segment: PHASE7_RUN_SEGMENTS[7],
    history: new ArenaHistory(),
    boss: true,
  });
  assert.equal(descriptor.templateId, 'boss-chamber');
  assert.equal(descriptor.hazardConfigurationId, 'none');
  assert.equal(descriptor.transformId, 'identity');
});

for (let seed = 1; seed <= 20; seed += 1) {
  test(`full arena sequence seed ${seed} is deterministic and obeys repetition rules`, () => {
    const generator = new ArenaGenerator();
    const create = () => {
      const history = new ArenaHistory();
      return PHASE7_RUN_SEGMENTS.map((segment) => generator.generate({
        seed: seed * 1000 + segment.segmentIndex,
        segment,
        history,
        recovery: segment.segmentId === 'recovery',
        boss: segment.segmentId === 'boss-handoff',
      }));
    };
    const first = create();
    const second = create();
    assert.deepEqual(first, second);
    for (let index = 1; index < 6; index += 1) {
      assert.notEqual(first[index].templateId, first[index - 1].templateId);
    }
    const hazards = first.slice(0, 6).map((item) => item.hazardConfigurationId).filter((id) => id !== 'none');
    for (const id of new Set(hazards)) assert.ok(hazards.filter((value) => value === id).length <= 2);
    assert.equal(first[6].hazardConfigurationId, 'none');
    assert.equal(first[7].templateId, 'boss-chamber');
  });
}

test('arena gameplay generation is isolated from decoration RNG output', () => {
  const segment = PHASE7_RUN_SEGMENTS[3];
  const a = new ArenaGenerator().generate({ seed: 999, segment, history: new ArenaHistory() });
  const b = new ArenaGenerator().generate({ seed: 999, segment, history: new ArenaHistory() });
  assert.equal(a.templateId, b.templateId);
  assert.equal(a.transformId, b.transformId);
  assert.equal(a.hazardConfigurationId, b.hazardConfigurationId);
  assert.deepEqual(a.solidGeometry, b.solidGeometry);
  assert.deepEqual(a.enemySockets, b.enemySockets);
});

test('ArenaRuntime teardown tolerates Phaser-invalidated static groups and is idempotent', async () => {
  const { ArenaRuntime } = await import('../src/arena/ArenaRuntime.js');
  let floorDestroyed = 0;
  const runtime = new ArenaRuntime({
    descriptor: { cameraBounds: {}, solidGeometry: [], enemySockets: [], eliteSockets: [] },
    wallGroup: { clear() { throw new Error('must not be called'); }, destroy() { throw new Error('must not be called'); } },
    wallVisuals: [],
    floor: { destroy() { floorDestroyed += 1; } },
    decoration: { destroy() {} },
  });
  assert.equal(runtime.destroy(), true);
  assert.equal(runtime.destroy(), false);
  assert.equal(floorDestroyed, 1);
});

test('ArenaHazardManager clear disables hazards without invalidating a collider-owned group', async () => {
  const { ArenaHazardManager } = await import('../src/systems/ArenaHazardManager.js');
  const group = { children: { size: 1 } };
  const body = { enable: true };
  const data = { consumed: true, state: 'ACTIVE' };
  const item = {
    state: 'ACTIVE',
    remainingMs: 1,
    zone: { body, getData() { return data; } },
    visual: { setVisible(value) { this.visible = value; return this; } },
  };
  const manager = Object.create(ArenaHazardManager.prototype);
  Object.assign(manager, {
    destroyed: false,
    items: [item],
    group,
    enabled: true,
    definition: { cooldownMs: 3200 },
    eventBus: null,
  });
  assert.equal(manager.clear('segment-clear'), true);
  assert.equal(manager.group, group);
  assert.equal(manager.destroyed, false);
  assert.equal(manager.enabled, false);
  assert.equal(body.enable, false);
  assert.equal(item.state, 'COOLDOWN');
  assert.equal(data.state, 'COOLDOWN');
});

test('ArenaHazardManager teardown tolerates an already-invalidated static group', async () => {
  const { ArenaHazardManager } = await import('../src/systems/ArenaHazardManager.js');
  const manager = Object.create(ArenaHazardManager.prototype);
  Object.assign(manager, {
    destroyed: false,
    items: [],
    group: { clear() { throw new Error('must not be called'); }, destroy() { throw new Error('must not be called'); } },
    enabled: true,
    definition: { cooldownMs: 3200 },
    eventBus: null,
  });
  assert.doesNotThrow(() => manager.destroy());
  assert.equal(manager.destroyed, true);
  assert.equal(manager.group, null);
  assert.equal(manager.destroy(), false);
});

test('physics collider cleanup remains idempotent after Phaser nulls the collider world', async () => {
  const { destroyPhysicsCollider } = await import('../src/utils/physicsCleanup.js');
  const alreadyDestroyed = { active: true, world: null, object1: {}, object2: {} };
  assert.equal(destroyPhysicsCollider(alreadyDestroyed), true);
  assert.equal(alreadyDestroyed.active, false);
  assert.equal(alreadyDestroyed.object1, null);
  assert.equal(alreadyDestroyed.object2, null);
  assert.equal(destroyPhysicsCollider(alreadyDestroyed), true);
});

test('CollisionManager cleanup deactivates every collider even when an earlier collider was already destroyed', async () => {
  const { CollisionManager } = await import('../src/systems/CollisionManager.js');
  let removed = 0;
  const world = { removeCollider() { removed += 1; } };
  const live = {
    active: true,
    world,
    object1: {},
    object2: {},
    destroy() { this.world.removeCollider(this); this.world = null; },
  };
  const manager = Object.create(CollisionManager.prototype);
  Object.assign(manager, {
    scene: { events: { off() {} } },
    finalizeContacts() {},
    colliders: [{ active: true, world: null }, live],
    currentWallContacts: new Set(['wall']),
    previousWallContacts: new Set(['wall']),
  });
  assert.doesNotThrow(() => manager.destroy());
  assert.equal(removed, 1);
  assert.equal(live.active, false);
  assert.equal(manager.colliders.length, 0);
  assert.equal(manager.currentWallContacts.size, 0);
  assert.equal(manager.previousWallContacts.size, 0);
});
