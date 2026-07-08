import test from 'node:test';
import assert from 'node:assert/strict';
import { HealthComponent } from '../src/components/HealthComponent.js';
import { HitInvulnerabilityComponent } from '../src/components/HitInvulnerabilityComponent.js';
import { ContactDamageComponent } from '../src/components/ContactDamageComponent.js';

test('HealthComponent clamps damage, healing, and maximum health', () => {
  const health = new HealthComponent(100);
  assert.equal(health.damage(30).applied, 30);
  assert.equal(health.currentHealth, 70);
  assert.equal(health.heal(50), 30);
  assert.equal(health.currentHealth, 100);
  health.setMaximum(80);
  assert.equal(health.currentHealth, 80);
});

test('HealthComponent reports defeat only once and resets', () => {
  const health = new HealthComponent(20);
  assert.equal(health.damage(30).defeated, true);
  assert.equal(health.damage(5).defeated, false);
  health.reset(40);
  assert.deepEqual(health.snapshot(), { currentHealth: 40, maximumHealth: 40, defeated: false });
});

test('HealthComponent safely handles invalid values', () => {
  const health = new HealthComponent(Number.NaN);
  assert.equal(health.maximumHealth, 1);
  assert.equal(health.damage(-5).applied, 0);
  assert.equal(health.heal(Number.NaN), 0);
});

test('HitInvulnerabilityComponent counts down and freezes while paused', () => {
  const invulnerability = new HitInvulnerabilityComponent(700);
  invulnerability.start();
  invulnerability.update(200);
  assert.equal(invulnerability.remainingMs, 500);
  invulnerability.update(400, { paused: true });
  assert.equal(invulnerability.remainingMs, 500);
  invulnerability.update(500);
  assert.equal(invulnerability.active, false);
});

test('HitInvulnerabilityComponent supports Last Frame duration and clear', () => {
  const invulnerability = new HitInvulnerabilityComponent(700);
  invulnerability.start(1200);
  assert.equal(invulnerability.snapshot().normalizedRemaining, 1);
  invulnerability.clear();
  assert.equal(invulnerability.remainingMs, 0);
});

test('ContactDamageComponent is cooldown limited and pause safe', () => {
  const contact = new ContactDamageComponent({ damage: 12, cooldownMs: 650 });
  assert.equal(contact.consume(), true);
  assert.equal(contact.consume(), false);
  contact.update(650, { paused: true });
  assert.equal(contact.consume(), false);
  contact.update(650);
  assert.equal(contact.consume(), true);
});
