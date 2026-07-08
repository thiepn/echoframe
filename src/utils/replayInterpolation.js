import { lerpAngle } from './angleMath.js';

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function copySnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }
  return {
    timestampMs: finite(snapshot.timestampMs),
    x: finite(snapshot.x),
    y: finite(snapshot.y),
    aimX: finite(snapshot.aimX, 1),
    aimY: finite(snapshot.aimY),
    aimRotation: finite(snapshot.aimRotation),
    velocityX: finite(snapshot.velocityX),
    velocityY: finite(snapshot.velocityY),
    movementState: snapshot.movementState ?? 'ACTIVE',
    dashVisualState: Boolean(snapshot.dashVisualState),
  };
}

export function interpolateReplaySnapshot(snapshots, timestampMs, cursorHint = 0) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return { snapshot: null, cursor: 0 };
  }
  if (snapshots.length === 1) {
    return { snapshot: copySnapshot(snapshots[0]), cursor: 0 };
  }

  const time = finite(timestampMs);
  if (time <= snapshots[0].timestampMs) {
    return { snapshot: copySnapshot(snapshots[0]), cursor: 0 };
  }
  const lastIndex = snapshots.length - 1;
  if (time >= snapshots[lastIndex].timestampMs) {
    return { snapshot: copySnapshot(snapshots[lastIndex]), cursor: Math.max(0, lastIndex - 1) };
  }

  let cursor = Math.max(0, Math.min(lastIndex - 1, Math.trunc(cursorHint) || 0));
  while (cursor > 0 && snapshots[cursor].timestampMs > time) {
    cursor -= 1;
  }
  while (cursor < lastIndex - 1 && snapshots[cursor + 1].timestampMs < time) {
    cursor += 1;
  }

  const before = snapshots[cursor];
  const after = snapshots[cursor + 1];
  const denominator = after.timestampMs - before.timestampMs;
  const alpha = denominator > 0
    ? Math.max(0, Math.min(1, (time - before.timestampMs) / denominator))
    : 0;
  const rotation = lerpAngle(before.aimRotation, after.aimRotation, alpha);
  return {
    cursor,
    snapshot: {
      timestampMs: time,
      x: finite(before.x + (after.x - before.x) * alpha),
      y: finite(before.y + (after.y - before.y) * alpha),
      aimX: Math.cos(rotation),
      aimY: Math.sin(rotation),
      aimRotation: rotation,
      velocityX: finite(before.velocityX + (after.velocityX - before.velocityX) * alpha),
      velocityY: finite(before.velocityY + (after.velocityY - before.velocityY) * alpha),
      movementState: alpha < 0.5 ? before.movementState : after.movementState,
      dashVisualState: alpha < 0.5
        ? Boolean(before.dashVisualState)
        : Boolean(after.dashVisualState),
    },
  };
}
