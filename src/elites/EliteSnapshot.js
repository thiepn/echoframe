export function createEliteSnapshot(controller) {
  if (!controller) return null;
  return Object.freeze({
    eliteInstanceId: controller.eliteInstanceId,
    modifierId: controller.modifierId,
    hostEnemyType: controller.enemy?.type ?? null,
    enemyId: controller.enemy?.enemyId ?? null,
    state: controller.state,
    pendingCopyMs: controller.modifier?.pendingMs ?? 0,
    replicationTriggered: Boolean(controller.modifier?.triggered),
    shieldAmount: controller.modifier?.shieldAmount ?? 0,
    shieldRemainingMs: controller.modifier?.shieldRemainingMs ?? 0,
    internalCooldownMs: controller.modifier?.cooldownRemainingMs ?? 0,
  });
}
