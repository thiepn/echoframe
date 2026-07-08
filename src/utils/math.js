export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeUint32(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.trunc(value) >>> 0;
}

export function formatDuration(milliseconds) {
  const safeMilliseconds = Math.max(0, Number(milliseconds) || 0);
  const totalSeconds = Math.floor(safeMilliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
