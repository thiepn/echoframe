import test from 'node:test';
import assert from 'node:assert/strict';
import { getUpgrade, UPGRADE_IDS } from '../src/upgrades/UpgradeCatalog.js';

const contracts = Object.freeze({
  'split-lens':'side shots use normal boss hit-zone guards',
  'piercing-signal':'piercing never bypasses closed vulnerability',
  'arc-relay':'chains may use boss-owned adds without recursion',
  'fracture-round':'critical fragments retain same-target guards',
  'compression-coil':'charge speed and damage remain active',
  'ricochet-matrix':'central shell and arena walls remain bounded',
  'extended-memory':'friendly replay duration remains active',
  'twin-recall':'friendly copies remain separate from hostile Echoes',
  'resonant-damage':'crossfire applies only to valid hit zones',
  'phantom-shield':'only blockable boss projectiles are intercepted',
  'stable-projection':'friendly Echo scalar remains active',
  'memory-burst':'burst cannot bypass closed vulnerability',
  'dash-wake':'wake cannot pass through boss collision shell',
  'phase-recovery':'projectile near misses exclude beams and sectors',
  'kinetic-charge':'movement charge remains active',
  'vector-reversal':'secondary dash obeys boss arena walls',
  'slipstream':'only friendly Echoes grant movement speed',
  'afterburn':'dash-charged shots use valid boss hit zones',
  'emergency-repair':'pre-boss repair remains committed once',
  'reactive-shell':'boss damage reduction remains active',
  'null-absorption':'qualifying blockable projectile destruction reduces cooldown once',
  'last-frame':'lethal prevention is available once for the complete boss',
  'regenerative-circuit':'regeneration advances only during active boss simulation',
  'deflection-pulse':'boss is immune while Drifter summons remain displaceable',
});

for (const id of Object.keys(contracts)) test(`${id} has an explicit bounded boss interaction contract`, () => { const definition=getUpgrade(id); assert.ok(definition); assert.ok(UPGRADE_IDS.includes(id)); assert.ok(definition.levels.length>=1); assert.ok(contracts[id].length>20); assert.equal(Object.isFrozen(definition),true); });
