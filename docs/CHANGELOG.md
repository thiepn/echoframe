# Changelog

## Phase 11 certification candidate — unreleased

- Added source-bound Phase 11 recovery and evidence mapping.
- Added reproducible Chromium, Firefox, deployment, deterministic, CI, certification, audit, and packaging gates.
- Hardened GitHub Actions so Pages deployment follows successful cross-browser CI.
- Reconciled Phase 10 archive metrics and package evidence.
- Withheld Version 1.0 promotion because real Firefox did not execute in this environment.

## 1.0.0-release-candidate — Phase 10

### Added

- Playable First Signal Tutorial using production movement, firing, dash, recording, friendly-Echo playback, damage, collision, audio, settings, and cleanup authorities.
- Fresh-save tutorial routing, persistent completion, returning-player bypass, and Archive replay without score, progression, personal-best, or recent-run mutation.
- Schema-2 serializable keyboard/pointer bindings, primary/secondary slots, capture modal, conflict rejection, default restoration, and immediate runtime context rebuilding.
- Sequential schema-1 migration for Phase 9 legacy bindings, including exact `W/S/A/D → KeyW/KeyS/KeyA/KeyD` conversion.
- Complete Accessibility, Controls, Gameplay, and Data settings surfaces and functional conformance audits.
- Controlled DOM-level fatal presentation, recoverable fallback paths, release metadata, final Credits, and production debug guards.
- Phase 10 tutorial, binding, accessibility, source, security, Chromium, Firefox-attempt, deployment, lifecycle, long-session, performance, and release evidence tooling.
- Ten final Phase 10 screenshots.

### Changed

- Advanced package and runtime identity to `1.0.0-release-candidate`.
- Replaced the instructional tutorial page with an authored gameplay tutorial and explicit deterministic state machine.
- Replaced hard-coded production gameplay bindings with validated saved binding snapshots.
- Reconciled Main Menu, Pause, Settings, Credits, HTML, manifest, README, and release-facing wording with the complete game.
- Hardened focus/visibility input clearing, rebinding lifecycle, audio failure handling, clipboard fallback, and startup/fatal behavior.

### Preserved

- All Phase 1–9 deterministic combat, scoring, progression, arena, upgrade, boss, save, and lifecycle authorities.
- All `923` retained automated tests.
- All five canonical documents byte-for-byte unchanged.

### Validation

- `1272/1272` automated tests pass.
- Tutorial audit: `10,000` timelines, zero hard failures.
- Binding audit: `25,000` cases, zero hard failures.
- Chromium, root/subpath deployment, and 60-cycle lifecycle validation pass.
- Real Firefox game validation remains an explicit open release gate when the runner aborts Firefox before page creation; no browser substitution is accepted.


## 0.9.0-signal-ledger-progression — Phase 9

### Added

- Deterministic bounded score-event ledger, exact category reconciliation, and score-only combo.
- Enemy, elite, chamber, boss, crossfire, near-miss, time, avoidance, and difficulty scoring.
- Multi-kill handling, damage combo penalties, score/combo HUD, and pooled score feedback.
- Personal bests, aggregate statistics, and capped recent-run records.
- Breadth-only upgrade, difficulty, cosmetic, lore, and Archive progression.
- Complete Results, Archive, and Statistics scenes.
- Backward-compatible Phase 8 save migration and import/export validation.
- Phase 9 deterministic audits, browser validation, lifecycle validation, soak, performance evidence, screenshots, and packaging support.

### Preserved

- All deterministic combat, arena, upgrade, friendly/hostile Echo, Null Architect, damage, RNG, lifecycle, and accessibility behavior from Phase 8.
- All five canonical documents unchanged.

## 0.7.0-arenas-upgrades-boss-handoff — 2026-07-06

### Added

- Eight authored arena templates: seven normal/recovery spaces and one fixed boss chamber.
- Immutable deterministic arena descriptors, template catalog, transforms, isolated gameplay/cosmetic RNG streams, history, validation, known-safe fallback, runtime construction, and telemetry.
- Arena-aware navigation, spawn sockets, elite sockets, line-of-sight lanes, Lancer charge validation, Bulwark rear access, Carrier placement, Suppressor counterplay, and Replicating copy placement.
- PLAYTEST Pulse Node and Conduit Sweep player-only hazard configurations with pause-safe timing and `DamageService` integration.
- Complete twenty-four-upgrade catalog, authoritative level data, stat pipeline, deterministic offers, interactions, descriptions, debug grants, telemetry, and bounded runtime hooks.
- Pooled or bounded chain, fragment, Dash Wake, Memory Burst, Deflection Pulse, interception, near-miss, and related effect systems.
- Upgrade Selection 6, safe recovery chamber, Final Upgrade Selection 7, final build snapshot, fixed boss-chamber handoff, and explicit non-victory `BOSS_READY` results.
- Phase 7 arena, upgrade, seed, source, Chromium browser, lifecycle, and real-time soak validation harnesses.
- Phase 7 recovery report, canonical extraction, machine-readable evidence, and final runtime screenshots.

### Changed

- Advanced the project to `0.7.0-arenas-upgrades-boss-handoff`.
- Extended the deterministic run plan from six combat segments and five offers to the complete eight-segment pre-boss route and seven offers.
- Replaced the single fixed combat arena with deterministic authored-template selection and validated transforms.
- Extended encounter and spawn descriptors with arena instance, compatibility tags, and transformed socket ownership.
- Migrated the partial upgrade pool to the complete canonical arsenal while preserving the eighteen-unlocked/six-locked fresh-save split.
- Extended damage and projectile metadata with bounded secondary-trigger ownership and recursion guards.
- Extended results, telemetry, archive presentation, HUD/debug information, and save-compatible run snapshots for arenas, hazards, upgrades, recovery, and boss handoff.

### Fixed

- Corrected authored sockets that collided with solids in the four-corners, side-channels, and broken-ring layouts.
- Corrected an arena socket role vocabulary mismatch that caused encounter fallback instead of authored arena-aware spawning.
- Captured Echo dissolve data before pooled deactivation reset its replay state.
- Made arena wall, hazard, collider, and Carrier-shard teardown idempotent against Phaser shutdown ordering.
- Prevented a deferred collider from surviving one physics step after its static group was invalidated.
- Corrected stale Phase 6 runtime version metadata after the Phase 7 migration.
- Corrected the soak driver to handle recovery auto-completion into Final Upgrade before its scheduled action.

### Validation

- Retained all 229 Phase 1–6 tests and expanded the automated suite to 415 passing tests.
- Audited 3,000 complete arena sequences / 24,000 arena descriptors with exact reproduction and zero geometry, route, repetition, or fallback failures.
- Audited all 24 upgrades, every level, the 18/6 unlock split, canonical interactions, seven-offer runs, and 1,000 randomized legal build states.
- Audited 300 complete Phase 7 run plans / 2,400 segments / 2,100 mandatory offers with exact deterministic reproduction and zero fallback use.
- Real Chromium validation completed the full route through `BOSS_READY` with zero exceptions, errors, or warnings.
- Fifty lifecycle cycles completed with stable listeners, cleanup ownership, colliders, input contexts, pools, and AudioContext ownership.
- A real-time 20-minute Chromium soak completed with all required arena, hazard, enemy, elite, Echo, upgrade, recovery, handoff, stress, and cleanup evidence gates.


## 0.6.0-elites-run-progression — 2026-07-05

### Added

- Added immutable deterministic six-segment pre-boss run plans and five mandatory upgrade boundaries.
- Added `RunProgressionController`, segment definitions, transition validation, and pre-boss completion results.
- Added data-driven elite eligibility, threat, selection, activation-profile, lifecycle, and encounter-validation systems.
- Added Overclocked, Replicating, and Resonant modifiers without host/modifier subclasses.
- Added pooled deterministic Replicating copies with slot reservation, bounded safe placement, cancellation, ownership, and cleanup.
- Added finite Resonant shields through generic target-side `DamageService` absorption.
- Added `MajorExecutionCoordinator` for the canonical two-major-executions-per-300-ms rule.
- Added elite overlays, HUD state, audio cues, telemetry, debug tools, and expanded results.
- Added Phase 6 seed, elite-matrix, source, browser, lifecycle, and 20-minute soak harnesses.
- Added 82 Phase 6 tests, increasing the suite from 147 to 229 tests.

### Changed

- Replaced the Phase 5 two-chamber flow with the canonical pre-boss sequence through Elite 2.
- Extended encounter descriptors with immutable elite metadata.
- Extended enemy activation through one normalized elite/copy profile.
- Extended `DamageResult` diagnostics for mitigation, shield absorption, and applied health damage.
- Updated the menu, HUD, archive, upgrade flow, results, version metadata, and documentation for Phase 6.
- Enforced pattern type limits during candidate composition and increased bounded generation attempts to 48 as a PLAYTEST safeguard.

### Fixed

- Prevented pooled enemies from accumulating elite or copy scalars across reuse.
- Prevented Replicating copies from receiving modifiers or replicating.
- Prevented Resonant shield stacking from simultaneous/duplicate death events.
- Prevented segment-transition ownership leaks for copies, shields, overlays, projectiles, shards, suppression, Echoes, timers, collisions, and audio.
- Corrected lifecycle validation races around same-key Phaser scene restarts by verifying newly installed runtime hooks.

## 0.5.0-core-roster-director — 2026-07-05

### Added

- Complete six-enemy standard roster: Drifter, Sentry, Lancer, Shard Carrier, Bulwark, and Suppressor.
- Lancer committed lane charge, explicit attack states, wall/arena endpoint validation, hit-once ownership, and recovery presentation.
- Shard Carrier death payload with deterministic safe placement, dedicated subordinate entity/manager/pool, arming/active/expiry timing, and lifecycle cleanup.
- Bulwark directional packet mitigation, side transition, rear-pressure accumulation, stagger, and readable protected/vulnerable presentation.
- Suppressor strongest-only Echo cooldown-recovery modifier, explicit source ownership, HUD status, and immediate cleanup.
- Immutable seeded encounter descriptors and named independent RNG substreams.
- Threat budgets, pattern catalog, role/type/saturation validation, synergy rules, anti-repeat history, spawn planning, recovery windows, structured rejection diagnostics, and bounded deterministic fallback.
- Encounter telemetry, roster manager, director debug controls, archive entries, and full-roster HUD/debug reporting.
- Shared normalized arena-geometry helpers, deterministic Lancer attack-space evaluation, and deterministic Carrier hazard-placement logic.
- Shutdown-safe pooled-enemy teardown when Phaser removes an Arcade Physics body before scene-owned pool cleanup.
- Extended Phase 5 mechanic/regression tests, increasing the suite from the recovered 96 tests to 147 tests.
- Reproducible seed, source, Chromium runtime, lifecycle, and wall-clock soak validation harnesses.
- Recovery report, expanded canonical extraction, exact validation evidence, and regenerated runtime/debug screenshots.

### Changed

- Replaced the Phase 4 authored wave sequence with the seeded threat-budget `EncounterDirector`.
- Corrected recovered Phase 5 systems that incorrectly interpreted `{ left, right, top, bottom }` arena bounds as `{ x, y, width, height }`.
- Reworked Carrier release to guarantee finite targets, wall/boundary clearance, spacing, player clearance, and an escape route.
- Reworked Lancer charge planning to truncate safely at arena/internal walls and cancel only genuinely invalid lanes.
- Strengthened suppression cleanup and modifier recomputation without mutating Echo internals.
- Expanded source auditing to detect missing/circular imports, gameplay-generation randomness, invalid bounds reads, direct health mutation, and canonical document drift.
- Updated README, current state, implementation notes, canonical extraction, manifest, and validation report to reflect independently reproduced results.

### Validation

- `npm ci`, lint, tests, production build, `npm run validate`, seed audit, source audit, and npm audit passed.
- 147/147 automated tests passed, retaining all Phase 1–4 regression coverage.
- 300 seeded runs / 3,000 descriptors passed with zero generation errors and zero fallbacks.
- Real Chromium validation passed for all six enemies, Echo interactions, Carrier hazards, suppression, Bulwark directions, Lancer charge movement, pause, resize, upgrade controls, victory, and menu cleanup.
- 50 complete lifecycle cycles passed across all three difficulties and 50 unique seeds with bounded ownership diagnostics.
- Wall-clock soak validation: `15-minute real Chromium soak (actual 901.29 s; 447 samples) covered all six enemies, 75 Echo deployment requests, 59 Carrier releases, 45 suppression activations, 49 Bulwark direction checks, 29 projectile-stress events, 3 pauses, and 2 resizes; all ownership/leak invariants passed with 0 browser exceptions and 0 console errors`.
- Five canonical preproduction documents remained byte-identical to Phase 4.


## 0.4.0-combat-vertical-slice — 2026-07-04

### Added

- Central faction-aware DamageService, damage packets/results, health, post-hit invulnerability, contact damage, and once-only death handling.
- Pooled Drifter and Sentry enemies with explicit AI state machines, canonical telegraphs, attacks, recovery, health, death, and reuse.
- Dedicated hostile projectile entity, renderer, manager, and bounded pool.
- Two authored combat chambers, deterministic encounter progression, recovery windows, upgrade intermission, victory, and death results.
- Deterministic three-card offer generation and eight canonical run-local upgrades.
- Player and Echo combat damage against enemies, projectile pierce tracking, enemy defeats, and combat statistics.
- Combat HUD, health display, chamber/encounter telemetry, accessibility integration, procedural combat effects/audio, and debug hooks.
- Phase 4 unit, browser, difficulty, accessibility, lifecycle, soak, and clean-package validation.

### Changed

- Version advanced to `0.4.0-combat-vertical-slice`.
- Main menu action renamed to **Start Combat Vertical Slice**.
- RunScene now coordinates combat systems while retaining Phase 1–3 ownership boundaries.
- UpgradeScene now requires one of three valid keyboard/mouse-selectable offers after Chamber 1.
- ResultsScene now supports honest victory and `Signal Lost` death summaries.
- README, manifest, current state, implementation notes, and validation report updated for Phase 4.

### Validated

- 85/85 tests, ESLint, Vite production build, clean installation, and npm audit pass.
- Twenty-run lifecycle matrix completed with stable listeners, colliders, pools, and one AudioContext.
- Sustained combat soak completed with 56–61 FPS and zero retained active combat objects after cleanup.
- Canonical documents remain unchanged.

All notable changes are recorded here.

## 0.3.0-echo-prototype — 2026-07-04

### Added

- Fixed-frequency 30 Hz EchoRecorder using simulation time and bounded catch-up.
- SnapshotRingBuffer with constant-time append, wrap-safe logical ordering, range extraction, and surrounding-sample lookup.
- Separate bounded ActionEventRingBuffer instances for fire and dash events.
- Friendly Echo entity, renderer, state machine, preallocated EchoPool, and EchoPlaybackSystem.
- Linear position interpolation and shortest-angle aim interpolation.
- Once-only chronological replay cursors for timestamped fire and dash events.
- Immutable EchoLoadoutSnapshot with future-compatible offensive and upgrade metadata.
- Seven-second EchoCooldownModel and timestamp-span recording readiness.
- Separate EchoProjectile entity, manager, faction metadata, collision path, and 120-object hard cap.
- CrossfireTracker for player/Echo hits on the same target within one second.
- Echo-specific procedural deployment, shot, dash, dissolve, and crossfire audio.
- Echo HUD states, completion thresholds, honest results, debug telemetry, and development stress hooks.
- Pure unit tests for buffers, recorder timing, interpolation, event cursors, cooldown, loadouts, Echo state, crossfire, and Echo statistics.

### Changed

- Project version advanced to `0.3.0-echo-prototype`.
- Main menu action renamed to **Start Echo Prototype**.
- RunScene now coordinates recorder, cooldown, playback, Echo projectiles, source-aware hits, and crossfire after the Phase 2 player systems.
- WeaponSystem records deterministic projectile metadata and monotonic weapon event IDs.
- PlayerController emits monotonic dash event IDs and replay-relevant dash metadata.
- CollisionManager distinguishes player and Echo projectile hit sources.
- HUDScene and ResultsScene report only honest Phase 3 metrics.
- Tutorial, Archive, Settings, README, manifest, debug overlay, and documentation updated for Phase 3.

### Validated

- Sixty unit tests pass.
- ESLint, Vite production build, clean npm installation, and npm audit pass.
- Stable 60 FPS fire-event dispatch remains within ±20 ms.
- Thirty consecutive deployments replay all recorded events once with no accumulated positional or duration drift.
- Twenty lifecycle cycles and fifty pause/resume cycles preserve ownership baselines.
- Both projectile pools reach 120 active objects and return to zero.
- Required viewport sizes preserve world coordinates and replay source state.
- One AudioContext remains throughout.
- No enemies, functional upgrades, encounters, score, combo, boss, or hostile Echo logic was introduced.

## 0.2.0-player-prototype — 2026-07-04

### Added

- Authored Player Prototype Arena with visible boundary and internal obstacle collision.
- Procedural Warden entity, renderer, ground locator, aim nose, aim line, movement animation, and dash presentation.
- Explicit player state model: SPAWNING, ACTIVE, DASHING, TRANSITION_LOCK, DISABLED.
- Normalized acceleration/deceleration movement math.
- Camera-transformed independent mouse aiming and stable aim dead zone.
- Time-based dash model with direction fallback, direction lock, input buffer, wall stopping, cooldown, and invulnerability metadata.
- Weapon clock with immediate first shot and continuous-fire cadence.
- Player projectile entity and bounded reusable projectile pool.
- Projectile-wall and projectile-target collision ownership.
- Eight stationary test targets with hit counts and feedback.
- Completion terminal requiring 20 target hits and 3 dashes.
- Prototype statistics for shots, hits, ratio, dashes, movement distance, wall contacts, and pool peak.
- Player-control HUD and debug telemetry.
- Procedural shot, dash, target-hit, and completion sounds through the existing AudioManager.
- Unit tests for movement math, dash model, weapon clock, player state, pool behavior, and prototype statistics.

### Changed

- Project version advanced to `0.2.0-player-prototype`.
- Main menu action renamed to **Start Player Prototype**.
- RunScene now coordinates gameplay systems rather than the Phase 1 foundation marker.
- ResultsScene now reports honest prototype metrics.
- InputManager now exposes gameplay held/pressed/released states and pointer-world conversion.
- Debug overlay now includes player, dash, aim, projectile, hit, and collision data.
- Tutorial, Archive, Statistics, Settings, README, and manifest text updated for Phase 2.

### Validated

- Thirty-six unit tests pass.
- ESLint and Vite production build pass.
- Browser runtime validates movement, aim, continuous firing, target hits, dash, pause/resume, resizing, completion, results, restart, and return to menu.
- Twenty restart cycles preserve lifecycle baselines.
- One AudioContext is retained.
- No enemies, Echoes, upgrades, encounter generation, scoring, or boss systems were introduced.

## 0.1.0-foundation — 2026-07-04

### Added

- Phaser 3.90.0 and Vite repository scaffold.
- Complete canonical scene set.
- Non-combat foundation demonstration.
- Concurrent RunScene and HUDScene.
- Central scene transitions with duplicate-token protection.
- Idempotent lifecycle cleanup.
- Owner-aware EventBus.
- Abstract input action contexts.
- Keyboard and mouse menu navigation.
- Pause, resume, restart, results, and menu-return flow.
- Versioned save schema, backup recovery, import/export, and reset.
- Settings screens for audio, visual, accessibility, controls, and data.
- One global Web Audio context with menu sounds and ambient placeholder.
- Procedural geometric texture foundation.
- Debug overlay and diagnostics.
- Node unit tests for save schema, storage recovery, and scene flow.
- ESLint configuration.
- GitHub Pages deployment workflow.
- README and implementation documentation.
