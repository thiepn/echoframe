export function createScoreSnapshot(scoreManager) { return scoreManager?.snapshot?.() ?? Object.freeze({ currentScore: 0, combo: { combo: 0, multiplier: 1 }, ledgerSize: 0, categoryTotals: {} }); }
