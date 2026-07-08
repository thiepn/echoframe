export class CrossfireTracker {
  constructor({ windowMs, targetCooldownMs }) {
    this.windowMs = Math.max(0, Number(windowMs) || 0);
    this.targetCooldownMs = Math.max(0, Number(targetCooldownMs) || 0);
    this.targets = new Map();
    this.nextEventId = 1;
  }

  registerHit({ targetId, source, timestampMs }) {
    if (source !== 'player' && source !== 'echo') {
      return null;
    }
    const time = Number(timestampMs) || 0;
    const state = this.targets.get(targetId) ?? {
      playerTimestampMs: null,
      echoTimestampMs: null,
      cooldownUntilMs: 0,
    };
    if (source === 'player') {
      state.playerTimestampMs = time;
    } else {
      state.echoTimestampMs = time;
    }
    this.targets.set(targetId, state);

    if (time < state.cooldownUntilMs) {
      return null;
    }
    if (state.playerTimestampMs === null || state.echoTimestampMs === null) {
      return null;
    }
    const differenceMs = Math.abs(state.playerTimestampMs - state.echoTimestampMs);
    if (differenceMs > this.windowMs) {
      return null;
    }
    const event = {
      targetId,
      playerHitTimestampMs: state.playerTimestampMs,
      echoHitTimestampMs: state.echoTimestampMs,
      differenceMs,
      crossfireEventId: this.nextEventId,
    };
    this.nextEventId += 1;
    state.cooldownUntilMs = time + this.targetCooldownMs;
    state.playerTimestampMs = null;
    state.echoTimestampMs = null;
    return event;
  }

  reset() {
    this.targets.clear();
    this.nextEventId = 1;
  }

  clearTarget(targetId) { this.targets?.delete?.(targetId); }
}
