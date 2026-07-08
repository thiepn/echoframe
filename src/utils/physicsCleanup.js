/**
 * Deactivates and removes an Arcade Physics collider without assuming Phaser's
 * scene-shutdown order. Phaser may already have nulled the collider world.
 */
export function destroyPhysicsCollider(collider) {
  if (!collider) return false;

  collider.active = false;
  const world = collider.world ?? null;

  try {
    if (world && typeof collider.destroy === 'function') {
      collider.destroy();
    } else if (world?.removeCollider) {
      world.removeCollider(collider);
    }
  } catch {
    try { world?.removeCollider?.(collider); } catch { /* world already gone */ }
  }

  // Clear references even when Phaser's own destroy path could not run.
  collider.active = false;
  if ('world' in collider) collider.world = null;
  if ('object1' in collider) collider.object1 = null;
  if ('object2' in collider) collider.object2 = null;
  if ('collideCallback' in collider) collider.collideCallback = null;
  if ('processCallback' in collider) collider.processCallback = null;
  if ('callbackContext' in collider) collider.callbackContext = null;
  return true;
}
