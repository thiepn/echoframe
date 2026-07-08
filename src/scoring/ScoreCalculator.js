export function recomputeScoreFromLedger(ledgerSnapshot) {
  return (ledgerSnapshot?.events ?? []).reduce((sum, event) => sum + Math.max(0, Math.round(Number(event.awardedPoints) || 0)), 0);
}
