export function safePercentage(numerator, denominator) { return denominator > 0 ? Math.max(0, Math.min(1, numerator / denominator)) : 0; }
export function formatInteger(value) { return Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-US'); }
