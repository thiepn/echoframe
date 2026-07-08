# Phase 10 Canonical Extraction

This document separates requirements extracted from the five unchanged canonical documents from implementation choices introduced for release validation. Items marked `PLAYTEST` are not silently treated as canon.

## Version 1.0 product scope

Canonical fixed scope:

- Complete primary desktop-browser run mode.
- Relaxed, Standard, and Overclocked difficulties.
- Six standard enemies, three elite modifiers, eight normal arenas, twenty-four upgrades, recovery, and one three-phase Null Architect boss.
- Deterministic seeded generation and stable world coordinates across supported viewport sizes.
- Procedural in-engine visual and audio assets.
- Local settings, statistics, progression, records, and history.
- Keyboard-and-mouse navigation and gameplay.
- Static GitHub Pages deployment with no backend requirement.

Canonical non-goals include mobile touch controls, gamepad controls, online services, accounts, cloud saves, leaderboards, localization, multiple bosses, endless mode, and permanent combat-stat power.

## First-run tutorial

Canonical requirements:

- A new player should understand basic controls within roughly 60 seconds.
- One meaningful Echo use is required before normal combat.
- Tutorial entry precedes normal combat for a fresh player.
- Three ordered movement checkpoints.
- A stationary firing target.
- A harmless dash gate that requires real dash state.
- A marked path followed while firing to create meaningful recorded history.
- A friendly Echo replay that attacks a front-shielded, rear-vulnerable target from behind.
- Only the real player may satisfy player-only triggers; friendly Echoes cannot trigger movement checks, portals, pickups, or player-only hazards.
- Pause freezes tutorial simulation, recording, and playback.
- Completion leads to normal combat.
- Tutorial can be replayed from Archive and is not a scoring mode.
- Skipping is available only after first completion.

`PLAYTEST` implementation thresholds:

- Checkpoint radius uses the bounded authored value in `tutorialArena.js`.
- Recording qualification requires at least 3.5 seconds, four path checkpoints, and four fire events.
- Invalid recording retries only the recording/Echo lesson rather than resetting the entire tutorial.

## Controls

Canonical defaults:

| Action | Binding |
|---|---|
| Move up/down/left/right | W/S/A/D |
| Aim | Pointer world position |
| Fire | Left mouse |
| Dash | Left Shift and right mouse |
| Deploy Echo | Space |
| Pause/back | Escape |
| Menu navigation | Arrow keys |
| Menu confirm | Enter |

Canonical behavior:

- Movement and aim are independent.
- Diagonal movement remains normalized.
- Fire is held-action capable.
- Key-repeat does not drive movement or menu actions.
- Browser-reserved shortcuts are not globally overridden.
- Right-click context suppression is scoped to the game canvas.
- Focus loss clears held actions and pauses by default.
- Gameplay actions are rebindable; fixed menu navigation remains separate.
- Conflicting bindings are rejected.

`PLAYTEST` binding representation and conflict matrix:

- Plain descriptors use `{ device: 'keyboard', code }` or `{ device: 'pointer', button }`.
- Maximum two descriptors per gameplay action.
- Supported pointer buttons are 0, 1, and 2.
- The same physical input is rejected across ambiguous gameplay actions; opposing movement conflicts and fire/dash pointer conflicts are explicitly rejected.
- Escape remains a gameplay pause safety fallback even if a saved pause descriptor is repaired.

## Settings and accessibility

Canonical categories:

- Audio
- Visual
- Accessibility
- Controls
- Gameplay
- Data

Canonical defaults include Standard difficulty after tutorial, pause on focus loss enabled, 70% screen shake, reduced flashes/particles disabled, high contrast disabled, damage numbers enabled, and aim line enabled.

Required functional settings:

- Adjustable/capped screen shake; 0% disables it.
- Reduced flashes.
- Reduced particles without removing required telegraphs.
- High contrast.
- Damage-number toggle.
- Aim-line toggle without disabling aim.
- HUD opacity within readable limits.
- Pause on focus loss while always clearing held inputs.
- Persistent player locator.
- Larger telegraph outlines.
- Complete keyboard-accessible menu flow with focus stronger than hover.
- Danger, focus, lock, vulnerability, and completion states communicated without color alone.

## Main menu, pause, credits, and presentation

Canonical requirements:

- Start Run is the default Main Menu focus.
- Main Menu includes tutorial, Archive, Statistics, Settings, and Credits access.
- Audio starts only after user gesture.
- The background remains low intensity and subordinate to UI focus.
- Pause freezes gameplay, simulation clocks, recording/playback, and uses the paused audio mix.
- Restart and destructive data actions require controlled ownership/confirmation.
- Credits is standalone, keyboard/mouse navigable, and has no network dependency.
- Minimum supported viewport is `1024 × 576`.
- World scale and deterministic coordinates do not change across viewport sizes.

Production subtitle `Fight with your past. Rebuild the signal.` is `PLAYTEST` release copy.

## Audio

Canonical architecture and behavior:

- One global `AudioContext`, owned by `AudioManager`.
- Start/resume only after a user gesture.
- Audio initialization failure continues muted.
- Procedural resources are generated outside dense combat callbacks.
- Voice caps and bounded variation prevent buildup.
- Player, friendly Echo, and hostile Echo cues remain distinguishable.
- Music states cover Calm, Combat, Pressure, Elite, Boss, Victory, and Paused.
- Pause/focus loss applies the paused mix.
- Scene restart does not duplicate music or contexts.

Required release cue coverage includes player/friendly-Echo fire, hits, dash, Echo deploy/dissolve, player damage, enemy/elite destruction, upgrade selection, gate opening, menu movement/confirm, boss transition, and victory. Tutorial objective completion and hostile Echo cues are retained where supported.

## Error handling

Canonical recoverable outcomes:

- Invalid arena/encounter → deterministic safe fallback.
- Corrupt primary save → backup; corrupt primary and backup → defaults plus notice.
- Audio failure → continue muted.
- Optional asset failure → generated fallback.
- Clipboard failure → selectable manual text.
- Pool pressure → bounded cap/fallback behavior.

Canonical fatal outcomes include Phaser initialization failure, missing required core data, and unrecoverable migration contradiction. Fatal presentation includes plain-language explanation, stable code, reload, relevant clear-data action, and no raw stack/environment disclosure.

## Performance and release acceptance

Canonical targets:

```text
Stable 60 FPS target
16.7 ms target frame
95th-percentile normal-combat frame under 20 ms
No recurring spawn hitch over 50 ms
Compressed initial transfer under 15 MB
```

Canonical caps:

| Resource | Cap |
|---|---:|
| Normal enemies | 30 |
| Elites | 2 |
| Player projectiles | 120 |
| Friendly-Echo projectiles | 120 total |
| Enemy projectiles | 100 |
| Particles | 180 |
| Friendly Echoes | 2 |
| Hostile copies | 2 |
| Major telegraphs | 2 |
| Recent runs | 50 |
| Score events | Existing Phase 9 cap |

Release acceptance requires clean production load, no console errors, deterministic regression, restart/pause/focus lifecycle stability, accessibility checks, browser matrix, static deployment behavior, performance evidence, and no Critical or High defects. Accepted Medium defects must be explicit.

## Privacy and security

Canonical requirements:

- No personal-data collection.
- No analytics by default.
- No remote gameplay telemetry.
- No required gameplay network request after static assets load.
- Imported JSON is untrusted and validated before commit.
- No `eval`, `new Function`, or dynamic script injection.
- Clipboard access is optional, user-initiated, permission-safe, and non-blocking.
- Production debug controls are unavailable or inert.
