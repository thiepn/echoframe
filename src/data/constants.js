export const DESIGN_WIDTH = 1600;
export const DESIGN_HEIGHT = 900;
export const COMBAT_SAFE_WIDTH = 1440;
export const COMBAT_SAFE_HEIGHT = 810;
export const MIN_VIEWPORT_WIDTH = 1024;
export const MIN_VIEWPORT_HEIGHT = 576;

export const PALETTE = Object.freeze({
  void: 0x080b14,
  background: 0x0d1320,
  surface: 0x182338,
  surfaceHighlight: 0x263651,
  playerCyan: 0x55e6ff,
  echoViolet: 0x9a82ff,
  dangerRed: 0xff4d67,
  eliteOrange: 0xff9d45,
  successMint: 0x72f1b8,
  warningYellow: 0xffd166,
  primaryText: '#edf7ff',
  mutedText: '#8da0b8',
  disabledText: '#56657a',
});

export const SAVE_KEYS = Object.freeze({
  primary: 'echoframe.save.v1',
  backup: 'echoframe.save.backup.v1',
});

export const SAVE_SCHEMA_VERSION = 2;
export const RECENT_RUN_LIMIT = 50;
export const RELEASE_VERSION = '1.0.0';
// Retained internal alias for legacy modules; not user-visible.
export const FOUNDATION_VERSION = RELEASE_VERSION;
