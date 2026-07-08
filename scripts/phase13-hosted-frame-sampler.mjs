const SAMPLER_KEY = '__ECHOFRAME_PHASE13_FRAME_WORK_SAMPLER__';
const MAX_SAMPLES = 120000;

export async function installFrameSampler(page) {
  await page.evaluate(({ samplerKey, maxSamples }) => {
    const game = globalThis.__ECHOFRAME__?.game;
    if (!game?.events) throw new Error('ECHOFRAME game events are unavailable for hosted frame-work sampling.');

    const previous = globalThis[samplerKey];
    if (previous?.running && previous?.game === game) return;
    previous?.dispose?.();

    const state = {
      mode: 'phaser-main-thread-frame-work',
      running: true,
      game,
      currentStart: null,
      deltas: [],
      longFrames: 0,
      max: 0,
      count: 0,
      eventNames: { start: 'prestep', end: 'postrender' },
      excludesExternalPresentationWait: true,
      includesGameUpdateAndRenderSubmission: true,
    };

    const onPreStep = () => {
      state.currentStart = performance.now();
    };
    const onPostRender = () => {
      if (!state.running || state.currentStart === null) return;
      const duration = performance.now() - state.currentStart;
      state.currentStart = null;
      if (!(duration >= 0) || duration >= 1000) return;
      state.deltas.push(duration);
      if (state.deltas.length > maxSamples) state.deltas.shift();
      state.max = Math.max(state.max, duration);
      state.count += 1;
      if (duration > 50) state.longFrames += 1;
    };
    state.dispose = () => {
      if (!state.running) return;
      state.running = false;
      game.events.off('prestep', onPreStep);
      game.events.off('postrender', onPostRender);
    };

    game.events.on('prestep', onPreStep);
    game.events.on('postrender', onPostRender);
    globalThis[samplerKey] = state;
  }, { samplerKey: SAMPLER_KEY, maxSamples: MAX_SAMPLES });
}

export async function readFrameSampler(page, { reset = false } = {}) {
  return page.evaluate(({ samplerKey, reset }) => {
    const state = globalThis[samplerKey];
    if (!state) return null;
    const sorted = [...state.deltas].sort((a, b) => a - b);
    const percentile = (p) => sorted.length
      ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))]
      : 0;
    const averageFrameMs = sorted.length
      ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length
      : 0;
    const minimumFpsEquivalent = state.max > 0 ? 1000 / state.max : 0;
    const averageFpsEquivalent = averageFrameMs > 0 ? 1000 / averageFrameMs : 0;
    const value = {
      measurementMode: state.mode,
      measurementUnit: 'milliseconds of browser main-thread game work per Phaser frame',
      eventNames: state.eventNames,
      excludesExternalPresentationWait: state.excludesExternalPresentationWait,
      includesGameUpdateAndRenderSubmission: state.includesGameUpdateAndRenderSubmission,
      samples: sorted.length,
      averageFrameMs,
      minimumFps: minimumFpsEquivalent,
      averageFps: averageFpsEquivalent,
      minimumFpsEquivalent,
      averageFpsEquivalent,
      p95FrameMs: percentile(0.95),
      p99FrameMs: percentile(0.99),
      maximumFrameMs: state.max,
      framesOver50Ms: state.longFrames,
    };
    if (reset) {
      state.deltas = [];
      state.max = 0;
      state.longFrames = 0;
      state.count = 0;
      state.currentStart = null;
    }
    return value;
  }, { samplerKey: SAMPLER_KEY, reset });
}
