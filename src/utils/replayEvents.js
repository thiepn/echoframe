export function consumeEventsThrough(events, cursor, timestampMs, callback) {
  let nextCursor = Math.max(0, Math.trunc(cursor) || 0);
  const endTime = Number(timestampMs) || 0;
  while (nextCursor < events.length && events[nextCursor].timestampMs <= endTime) {
    callback(events[nextCursor], nextCursor);
    nextCursor += 1;
  }
  return nextCursor;
}
