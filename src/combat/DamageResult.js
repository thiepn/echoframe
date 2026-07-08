export function createDamageResult(data = {}) {
  return Object.freeze({
    accepted: Boolean(data.accepted),
    rejectedReason: data.rejectedReason ?? null,
    amountBeforeMitigation: Math.max(0, Number(data.amountBeforeMitigation) || 0),
    amountAfterMitigation: Math.max(0, Number(data.amountAfterMitigation) || 0),
    shieldAbsorbed: Math.max(0, Number(data.shieldAbsorbed) || 0),
    damageApplied: Math.max(0, Number(data.damageApplied) || 0),
    remainingHealth: Math.max(0, Number(data.remainingHealth) || 0),
    targetDefeated: Boolean(data.targetDefeated),
    critical: Boolean(data.critical),
    damageId: String(data.damageId ?? ''),
    modifierDiagnostics: data.modifierDiagnostics ? Object.freeze({ ...data.modifierDiagnostics }) : null,
  });
}
