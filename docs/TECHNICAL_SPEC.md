# ECHOFRAME: LAST SIGNAL — Technical Specification

**Document:** `TECHNICAL_SPEC.md`  
**Version:** 1.0-preproduction  
**Authority:** Implementation architecture, ownership, lifecycle, data contracts, performance, and deployment  
**Required stack:** Phaser 3.90.0, JavaScript ES modules, Vite, Arcade Physics, Web Audio API, `localStorage`, GitHub Pages

---

# 1. Technical objectives

The implementation must be:

- Deterministic for gameplay generation.
- Modular enough for file-by-file ChatGPT development.
- Restart-safe.
- Pause-safe.
- Free of unbounded per-frame allocation.
- Compatible with current Chromium, Firefox, and Edge desktop browsers.
- Deployable as a static GitHub Pages site.
- Independent of a backend.
- Inspectable through development diagnostics.
- Resilient to malformed local save data.
- Capable of maintaining 60 FPS under intended maximum load on the target desktop range.

---

# 2. Technology constraints

## 2.1 Required

- Phaser 3.90.0 pinned exactly.
- JavaScript ES modules.
- Vite build and development server.
- Phaser Arcade Physics.
- Web Audio API.
- `localStorage`.
- GitHub Pages.

## 2.2 Prohibited for version 1.0

- Server-side code.
- Remote databases.
- Runtime CDN dependency for Phaser or core libraries.
- Dynamic code evaluation.
- Third-party analytics.
- WebSockets.
- Additional physics engines.
- Heavy shader frameworks.
- Runtime generation of large raster assets.
- Backend-dependent features.
- Active-run cloud or local resume.

## 2.3 Dependency policy

- Phaser is installed and bundled through Vite.
- Every dependency requires a documented purpose.
- Prefer small local modules over general utility libraries.
- Pin versions in the lockfile.
- Production gameplay performs no required external network request after static assets load.

---

# 3. Resolution and scaling

## 3.1 Logical coordinate system

- Design resolution: 1600×900.
- Aspect ratio: 16:9.
- Combat-safe rectangle: 1440×810 centered within the design resolution.
- World units correspond to logical pixels.

## 3.2 Scaling behavior

- Fit canvas inside viewport.
- Center horizontally and vertically.
- Preserve aspect ratio.
- Allow letterboxing.
- Never stretch.
- Resize on viewport changes.
- Preserve world coordinates.
- UI anchors use logical coordinates and safe margins.
- Device-pixel ratio may improve rendering but must not alter gameplay scale.

## 3.3 Supported minimum

- Minimum supported CSS viewport: 1024×576.
- The game remains technically functional to approximately 960×540.
- Below the supported minimum, show “larger window recommended.”
- Mobile portrait is unsupported and may show a desktop-required message.

## 3.4 Coordinate ownership

- `RunScene` owns world coordinates.
- `HUDScene` owns screen-space gameplay UI.
- Pointer positions are converted through the world camera.
- Gameplay systems never use raw page coordinates.

---

# 4. Project structure

```text
echoframe/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
├── LICENSE
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── assets/
│       ├── images/
│       ├── fonts/
│       └── data/
├── src/
│   ├── main.js
│   ├── gameConfig.js
│   ├── scenes/
│   ├── entities/
│   ├── systems/
│   ├── generation/
│   ├── pools/
│   ├── data/
│   ├── graphics/
│   ├── ui/
│   ├── state/
│   └── utils/
├── docs/
└── .github/workflows/deploy.yml
```

## 4.1 File ownership rule

Every major state has exactly one authoritative owner. Other modules request changes through documented methods or events. No duplicated writable state is permitted.

---

# 5. Scene architecture

## 5.1 Scene list

| Scene | Responsibility | Concurrency |
|---|---|---|
| `BootScene` | Minimal bootstrap, save initialization | Standalone |
| `PreloadScene` | Load/generate textures, data, fonts, audio resources | Standalone |
| `MainMenuScene` | Main navigation and menu background | Standalone |
| `TutorialScene` | First-run guided tutorial | May run with HUD |
| `RunScene` | World simulation and run orchestration | Runs with HUD |
| `HUDScene` | Gameplay HUD and world-independent overlays | Runs with RunScene |
| `UpgradeScene` | Upgrade selection overlay | Gameplay paused |
| `PauseScene` | Pause overlay | Gameplay paused |
| `ResultsScene` | Results and unlock presentation | Standalone |
| `ArchiveScene` | Upgrade archive, lore, tutorial entry | Standalone |
| `StatisticsScene` | Local aggregate statistics | Standalone |
| `SettingsScene` | Settings UI | Standalone or overlay |
| `CreditsScene` | Credits | Standalone |

## 5.2 Scene lifecycle contract

Every scene must have:

- Explicit initialization.
- Explicit creation.
- Documented subscriptions.
- Shutdown cleanup.
- Destroy cleanup where applicable.
- No retained references to destroyed scenes.
- No duplicate subscriptions after restart.
- No ownership of global audio state.
- No direct mutation of another scene’s private state.

## 5.3 Scene transitions

`SceneFlowController` is the sole owner of high-level transitions.

A transition request includes:

- Transition type.
- Source scene.
- Destination scene.
- Payload.
- Fade duration.
- Audio-state request.
- Input-lock behavior.
- Unique transition token.

Duplicate requests with an already-consumed token are ignored.

---

# 6. Ownership matrix

| State or behavior | Sole owner | Authorized readers | Authorized writers |
|---|---|---|---|
| Run lifecycle | `RunController` | HUD, results, director | `RunController` |
| Player derived stats | `RunStatsModel` | Player, weapon, HUD | Upgrade recomputation |
| Player body state | `PlayerController` | Echo recorder, camera | PlayerController/dash |
| Player health | `HealthComponent` | HUD, results | Damage/repair API |
| Weapon cooldown | `WeaponSystem` | HUD/debug | WeaponSystem |
| Echo history | `EchoRecorder` | Echo playback | EchoRecorder |
| Active Echoes | `EchoPlaybackSystem` | HUD, statistics | EchoPlaybackSystem |
| Enemy lifecycle | `EnemyManager` | director/debug | EnemyManager |
| Encounter schedule | `EncounterDirector` | HUD/debug | EncounterDirector |
| Arena choice | `ArenaGenerator` | RunController | ArenaGenerator |
| Gameplay RNG | `SeededRandomService` | Generation systems | Service only |
| Upgrade levels | `UpgradeManager` | UI/stats | UpgradeManager |
| Global audio | `AudioManager` | All scenes | AudioManager |
| Persistent data | `SaveManager` | UI/systems | SaveManager |
| Aggregate statistics | `StatisticsManager` | Results/statistics UI | Through SaveManager |
| Camera effects | `CameraController` | None | CameraController |
| Global events | `EventBus` | Subscribers | Contracted publishers |
| Debug state | `DebugManager` | Systems | DebugManager |

---

# 7. Event architecture

## 7.1 Purpose

Use an event bus for cross-system notifications. Local synchronous logic uses direct method calls.

## 7.2 Naming convention

```text
domain:entity:action
```

Examples:

- `player:health:changed`
- `player:dash:started`
- `echo:deployed`
- `enemy:destroyed`
- `run:phase:changed`
- `upgrade:selected`
- `audio:intensity:requested`
- `settings:changed`

## 7.3 Payload rules

- Payloads contain plain data.
- Do not store Phaser objects in delayed or persistent payloads.
- Every event has a documented schema.
- High-frequency events include source and activation IDs.
- Subscribers unregister during shutdown.
- One-time events use a once-subscription or token.
- Listener registration is idempotent.

## 7.4 Operations that remain synchronous

- Damage application.
- Projectile collision resolution.
- Dash cooldown consumption.
- Echo deployment validation.
- Upgrade commitment.
- Run-state advancement.
- Final result construction.

---

# 8. Time and simulation

## 8.1 Time sources

- Gameplay uses Phaser scene simulation time.
- Pause freezes simulation.
- Pause overlay UI uses its own scene time.
- Browser wall-clock time is used only for persistent timestamps and diagnostics.
- Echo recording and playback use simulation timestamps.
- Director schedules use simulation time.
- Web Audio scheduling uses AudioContext time through `AudioManager`.

## 8.2 Delta handling

- Clamp unusually large frame deltas.
- Do not simulate seconds of missed time after tab restoration.
- State machines use elapsed durations, not frame counts.
- Periodic logic uses bounded accumulators.
- Catch-up loops have hard limits.

## 8.3 Echo sample timing

- Target sample rate: 30 Hz.
- Interval: 33.333… ms.
- Accumulator carries remainder.
- Catch-up samples per frame are capped.
- Severe stalls create an interpolated discontinuity marker instead of hundreds of samples.

---

# 9. Physics and collision

## 9.1 Logical categories

- Player body.
- Enemy body.
- Solid world.
- Player projectile.
- Echo projectile.
- Enemy projectile.
- Hazard.
- Trigger.
- Decoration.

## 9.2 Interaction table

| A | B | Behavior |
|---|---|---|
| Player | Solid | Hard collision |
| Player | Enemy | Damage overlap + controlled separation |
| Player | Enemy projectile | Damage overlap |
| Player | Hazard | Overlap/persistent damage |
| Player projectile | Enemy | Damage |
| Player projectile | Solid | Destroy, pierce, or ricochet |
| Echo projectile | Enemy | Damage |
| Echo projectile | Solid | Frozen-loadout rule |
| Enemy projectile | Solid | Usually destroy |
| Enemy | Solid | Collision or steering constraint |
| Enemy | Enemy | Soft separation |
| Echo body | All | No physical interaction |

## 9.3 Damage service

A damage request contains:

- Source ID.
- Source activation ID.
- Source faction.
- Target ID.
- Base damage.
- Damage tags.
- Critical flag.
- Timestamp.
- Hit position.
- Direction.
- Internal-cooldown key.
- Optional bypass flags.

Resolution order:

1. Validate source and target.
2. Reject duplicate activation.
3. Check target invulnerability.
4. Apply shields and reductions.
5. Clamp.
6. Mutate health.
7. Emit feedback/statistics.
8. Trigger death once.

## 9.4 Contact damage

- Per-source cooldown.
- Controlled separation after valid or blocked contact.
- Post-hit invulnerability limits burst damage.
- Separation cannot move player through walls.

## 9.5 Collision callback constraints

- Avoid allocation in high-frequency callbacks.
- Use pooled effects.
- Deactivation is idempotent.
- Piercing projectiles track already-hit targets.
- A projectile cannot damage the same target twice unless explicitly allowed.

---

# 10. Core state models

## 10.1 RunState conceptual schema

```text
runId: string
seed: uint32
difficultyId: relaxed | standard | overclocked
status: created | active | victory | defeat | closed
currentSegmentIndex: integer
currentChamberId: string
currentArenaId: string
elapsedSimulationMs: number
score: integer
combo: number
selectedUpgrades: map<upgradeId, level>
statistics: RunStatistics
rngState: serializable state
generationVersion: integer
```

No active run resume is persisted in version 1.0.

## 10.2 RunStatistics

Required:

- Player shots.
- Echo shots.
- Player hits.
- Echo hits.
- Critical hits.
- Kills by enemy type.
- Elite kills.
- Player damage dealt.
- Echo damage dealt.
- Damage taken.
- Dashes.
- Echo deployments.
- Crossfire events.
- Near misses.
- Highest combo.
- Chambers completed.
- Boss phase reached.
- Duration.
- Victory.
- Seed.
- Upgrade history.

## 10.3 RunStatsModel

Derived values:

- Maximum health.
- Movement and dash stats.
- Weapon stats.
- Echo stats.
- Damage reduction.
- Upgrade counters.
- Internal cooldowns.

Recompute only when the build changes or a temporary modifier changes, not each frame.

---

# 11. Player architecture

## 11.1 Modules

- `Player`: Phaser entity/container.
- `PlayerController`: movement, dash, action interpretation.
- `HealthComponent`.
- `WeaponSystem`.
- `StatusEffectComponent`.
- `PlayerRenderer`.
- `InputManager`.
- `RunStatsModel`.

## 11.2 Update order

1. Read abstract input.
2. Resolve pause/transition locks.
3. Update state timers.
4. Determine movement.
5. Apply dash state.
6. Set physics velocity.
7. Update aim.
8. Process firing.
9. Process Echo request.
10. Update visuals.
11. Record resolved state.

## 11.3 Death

- Health zero requests defeat.
- Input locks immediately.
- New spawns stop.
- Short death presentation may continue.
- Results transition occurs once.
- Duplicate death requests are ignored.

---

# 12. Echo architecture

## 12.1 Components

- `EchoRecorder`.
- `SnapshotRingBuffer`.
- `ActionEventRingBuffer`.
- `EchoPlaybackSystem`.
- `EchoInstance`.
- `EchoRenderer`.
- `EchoProjectilePool`.
- `EchoLoadoutSnapshot`.

## 12.2 Snapshot ring buffer

Requirements:

- Fixed capacity.
- Preallocated storage where practical.
- Monotonic timestamps.
- Constant-time append.
- No array shifting.
- Indexed access by logical order.
- Retrieval of samples surrounding a requested time.
- Clear without reallocation.

## 12.3 Event buffers

Separate bounded buffers for:

- Fire.
- Dash.

Retention exceeds maximum supported replay duration by a small safety margin.

## 12.4 Deployment sequence

```text
Receive action
→ Validate run/player state
→ Validate cooldown
→ Validate history
→ Validate active cap
→ Freeze Echo loadout
→ Determine replay interval
→ Acquire Echo from pool
→ Initialize cursors
→ Consume cooldown
→ Emit deployment event
```

## 12.5 Playback requirements

- Uses simulation time.
- Interpolates position and aim between samples.
- Dispatches each recorded event once.
- Keeps per-instance event cursors.
- Does not scan complete buffers each frame.
- Handles frame skips by dispatching crossed events.
- Caps pathological event bursts.
- Completes at replay end.
- Dissolves and returns to pool.

## 12.6 Frozen loadout contents

- Damage scalar.
- Projectile speed.
- Projectile count/spread.
- Pierce.
- Ricochet.
- Chain eligibility.
- Phantom Shield capacity.
- Memory Burst.
- Dash Wake.
- Relevant upgrade levels.

Not included:

- Player current health.
- Player invulnerability.
- Future upgrades.
- Non-Echo defensive effects.

## 12.7 Twin Recall

- Primary starts immediately.
- Secondary starts after configured delay.
- Both use same recording interval and loadout.
- Cooldown consumed once.
- Secondary creation cancels if combat state ends.
- Secondary cannot recursively create another Echo.

---

# 13. Projectile architecture

## 13.1 Pools

Separate pools:

- Player projectiles.
- Echo projectiles.
- Enemy projectiles.
- Fragments/chains where behavior differs.

## 13.2 Projectile state

- Active.
- Activation ID.
- Faction.
- Owner ID.
- Position/velocity.
- Radius.
- Remaining lifetime.
- Damage packet.
- Pierce remaining.
- Ricochet remaining.
- Bounded already-hit targets.
- Visual profile.
- Spawn timestamp.

## 13.3 Deactivation contract

Deactivation:

- Disables physics.
- Hides visual.
- Clears ownership.
- Clears hit history.
- Resets counters.
- Stops attached effects.
- Returns exactly once.

## 13.4 Exhaustion

- Pools expand in bounded chunks to hard caps.
- Gameplay-critical projectiles must not silently disappear.
- Director and weapon limits prevent overflow.
- Any overflow attempt creates a development warning.

---

# 14. Enemy architecture

## 14.1 Base contract

Every enemy provides:

- Pooled initialization.
- Spawn state.
- AI update.
- Damage reception.
- Attack cancellation.
- Death.
- Deactivation.
- Threat cost.
- Telegraph priority.
- Arena tags.
- Debug description.

## 14.2 Shared state machine

```text
INACTIVE
→ SPAWNING
→ ACTIVE
→ ATTACK_ANTICIPATION
→ ATTACK_LOCK
→ ATTACK_EXECUTION
→ RECOVERY
→ ACTIVE
→ DYING
→ INACTIVE
```

## 14.3 Update frequency

- Active attacks and nearby steering update each frame.
- Non-critical perception may update at fixed lower frequency.
- Visual interpolation remains per-frame.
- Expensive queries are throttled.

## 14.4 Elite composition

Elite modifiers wrap parameter and lifecycle hooks. They do not duplicate entire enemy classes.

---

# 15. Encounter director

## 15.1 Inputs

- Run segment.
- Difficulty.
- Arena tags.
- Unlocked enemy set.
- RNG stream.
- Active counts.
- Recent recipe history.
- Telegraph occupancy.

## 15.2 No hidden adaptive difficulty

Player performance does not secretly alter combat power. It may only influence equivalent-intensity variety selection or diagnostics.

## 15.3 Recipe schema

```text
id
allowedPhases
minimumStage
maximumStage
requiredArenaTags
forbiddenArenaTags
baseThreatCost
spawnGroups
timing
telegraphConcurrencyLimit
recoveryAfterMs
weight
selectionCooldown
validationVersion
```

## 15.4 Spawn-group schema

- Enemy types/counts.
- Socket tags.
- Member delays.
- Activation delay.
- Elite eligibility.
- Dependency.
- Simultaneous threat limit.
- Fallback group.

## 15.5 Validation

Check:

- Arena compatibility.
- Socket availability.
- Safety radius.
- Line of sight.
- Active caps.
- Telegraph concurrency.
- Introduction rules.
- Repetition.
- Hazard conflict.

Rejected candidates are logged in development mode.

---

# 16. Arena generation

## 16.1 RNG streams

Use deterministic named streams:

- Arena selection.
- Encounter selection.
- Upgrade offering.
- Boss scheduling.
- Cosmetic variation.

Cosmetic RNG must not consume gameplay RNG.

## 16.2 Selection sequence

```text
Eligible templates
→ Remove recent repeats
→ Filter stage
→ Select template
→ Select transform
→ Select decoration
→ Select hazard
→ Validate
→ Fallback if needed
```

## 16.3 Validation

- Spawn clearance.
- Navigation connectivity.
- Obstacle bounds.
- Hazard route preservation.
- Socket distances.
- Elite socket validity.
- Camera bounds.
- No invalid solid overlap.

## 16.4 Fallback

A known-safe open arena is always available. Generation failure cannot crash or end the run.

---

# 17. Upgrade architecture

## 17.1 Definition fields

- ID.
- Display name key.
- Description template.
- Category.
- Tags.
- Max level.
- Unlock requirement.
- Base weight.
- Conflicts.
- Requirements.
- Stat modifiers.
- Behavior hooks.
- Icon ID.
- Validation tests.

## 17.2 Stat pipeline

1. Base.
2. Flat additions.
3. Summed percentage additions.
4. Bounded multipliers.
5. Floors and caps.
6. Derived values.
7. Behavior-hook configuration.

## 17.3 Selection sequence

1. Eligible pool.
2. Remove maxed.
3. Remove conflicts.
4. Apply unlocks.
5. Apply weighting.
6. Draw unique options.
7. Enforce diversity where possible.
8. Store offered IDs.
9. Commit one choice.
10. Recompute stats.
11. Emit event.

## 17.4 Debug controls

Development mode can:

- Grant by ID.
- Set level.
- Reset build.
- Print derived stats.
- Generate offerings.
- Validate description values.

---

# 18. Boss architecture

## 18.1 Controller ownership

`NullArchitectController` owns:

- Health.
- Phase.
- Scheduler.
- Vulnerability.
- Summons.
- Hostile copies.
- Sector state.
- Transition locks.
- Defeat sequence.

## 18.2 Attack scheduler

- Selects phase-valid attacks.
- Enforces cooldown.
- Enforces concurrency.
- Uses boss RNG stream.
- Suspends during transitions.
- Has a safe fallback attack.

## 18.3 Hostile copy

Separate from friendly Echo:

- Separate entity class.
- Separate faction.
- Separate renderer.
- Separate projectile profile.
- Curated event conversion.
- Safe spawn offset.
- Hard lifetime.
- Phase-transition cleanup.

## 18.4 Sector state machine

```text
SAFE
→ WARNING
→ DISABLED
→ RESTORING
→ SAFE
```

Validation guarantees connected safe space before activation.

---

# 19. UI architecture

## 19.1 Focus manager

`UIFocusManager` owns:

- Focused component.
- Directional navigation graph.
- Mouse/focus handoff.
- Confirm/cancel.
- Modal capture.
- Focus restoration.
- Disabled control exclusion.

## 19.2 Reusable components

- Button.
- Slider.
- Toggle.
- Binding row.
- Upgrade card.
- Modal.
- Tooltip.
- Tabs.
- Scroll container.
- Statistic row.
- Seed display/copy control.

## 19.3 HUD data flow

HUD subscribes to:

- Health.
- Score.
- Combo.
- Chamber phase.
- Boss phase.
- Status effects.
- Echo readiness.
- Settings.

Cooldown arcs may read normalized read-only values each frame.

## 19.4 Pause contract

When paused:

- Run simulation stops.
- Gameplay timers stop.
- Pause UI remains active.
- Audio enters paused mix.
- Held gameplay actions are neutralized until release.
- Resume returns to prior state.

---

# 20. Audio architecture

## 20.1 Lifecycle

- One global AudioContext.
- Create/resume after user gesture.
- Never create per scene or run.
- Handle page visibility gracefully.
- Continue muted if audio initialization fails.

## 20.2 Procedural sounds

- Reusable buffers generated at preload/first gesture.
- Controlled pitch/filter/gain variation.
- No synthesis construction inside combat callbacks.
- Positional panning relative to camera.

## 20.3 Music

Layers:

1. Pad.
2. Pulse.
3. Bass.
4. Percussion.

States:

- Calm.
- Combat.
- Pressure.
- Elite.
- Boss.
- Victory.
- Paused.

Layers remain synchronized. State transitions crossfade.

## 20.4 Mix priority

1. Player damage/fatal warning.
2. Boss and major telegraphs.
3. Echo and dash.
4. Enemy attacks.
5. Hits/destruction.
6. UI.
7. Ambient.
8. Music.

Voice caps prevent buildup.

---

# 21. Save architecture

## 21.1 Storage keys

Conceptual:

- `echoframe.save.v1`
- `echoframe.save.backup.v1`

## 21.2 Schema

```text
schemaVersion
createdAt
updatedAt
settings:
  audio
  visual
  accessibility
  controls
  gameplay
progression:
  unlockedUpgradeIds
  unlockedPaletteIds
  unlockedTrailIds
  unlockedDifficultyIds
  loreIds
statistics:
  aggregateCounters
  personalBests
  bossRecords
records:
  recentRuns
meta:
  lastSelectedDifficulty
  tutorialCompleted
  seenIntroductions
```

## 21.3 Rules

- Validate every field.
- Apply defaults for absent fields.
- Ignore unknown fields.
- Clamp numerics.
- Validate bindings.
- Cap run history at 50.
- Write only on meaningful changes.
- Copy valid primary to backup before overwrite.
- Restore backup after primary corruption.
- Fall back to defaults after both fail.
- Import/export JSON.
- Validate imported data before commit.
- Clear data requires strong confirmation.
- Active run is not resumable.

## 21.4 Migration

- Sequential migrations.
- Backup first.
- Each migration records outcome.
- Prefer idempotence.
- Preserve only validated data.

---

# 22. Settings

## 22.1 Categories

- Audio.
- Visual.
- Accessibility.
- Controls.
- Gameplay.
- Data.

## 22.2 Immediate application

- Volume.
- Shake.
- Particles.
- Flash reduction.
- Damage numbers.
- HUD opacity.
- Aim line.
- Contrast.

## 22.3 Defaults

| Setting | Default |
|---|---|
| Pause on focus loss | Enabled |
| Screen shake | 70% |
| Reduced flashes | Disabled |
| Reduced particles | Disabled |
| High contrast | Disabled |
| Damage numbers | Enabled |
| Aim line | Enabled |
| Master volume | 80% |
| Music volume | 60% |
| Effects volume | 80% |
| Difficulty | Standard after tutorial |

---

# 23. Procedural graphics

## 23.1 Texture generation

Generate reusable textures before combat:

- Player parts.
- Enemy silhouettes.
- Projectiles.
- Particles.
- UI icons.
- Floor motifs.
- Telegraph masks.

Runtime transforms and masks may animate them.

## 23.2 Prohibited runtime work

- Repeated texture generation.
- Recreating emitters per hit.
- Large complex Graphics paths each frame.
- Unbounded full-screen alpha overlays.

## 23.3 World layer order

1. Background.
2. Architecture.
3. Floor.
4. Decoration.
5. Ground hazards.
6. Shadows.
7. Enemies.
8. Friendly entities.
9. Projectiles.
10. Particles.
11. Telegraphs.
12. Player clarity effects.
13. Transitions.

---

# 24. Performance budgets

## 24.1 Targets

- Stable 60 FPS.
- 16.7 ms frame target.
- 95th percentile normal-combat frame under 20 ms.
- No recurring spawn hitch over 50 ms.
- Compressed initial transfer target under 15 MB.

## 24.2 Hard caps

| Resource | Cap |
|---|---:|
| Normal enemies | 30 |
| Elites | 2 |
| Player projectiles | 120 |
| Echo projectiles | 120 total |
| Enemy projectiles | 100 |
| Particles | 180 |
| Friendly Echoes | 2 |
| Hostile copies | 2 |
| Major telegraphs | 2 |
| Recent runs | 50 |

## 24.3 Allocation policy

- No array creation in hot update loops where avoidable.
- Reuse vectors and temporary objects.
- Pool repeated entities.
- Bound event allocation.
- Use event-driven UI.
- Precompile descriptions where practical.

## 24.4 Debug counters

- FPS/frame time.
- Active enemies.
- Projectiles by faction.
- Particles.
- Echo count.
- Pool use/capacity.
- Listener counts.
- Timers.
- Arena/recipe.
- Seed/RNG streams.
- Difficulty stage.

---

# 25. Error handling

## 25.1 Recoverable

- Invalid arena → fallback arena.
- Invalid recipe → safe recipe.
- Corrupt save → backup/default.
- Audio failure → continue muted.
- Missing optional asset → generated fallback.
- Clipboard failure → display seed manually.
- Pool warning → cap/fallback behavior.

## 25.2 Fatal

- Phaser initialization failure.
- Missing required core data.
- Unrecoverable migration contradiction.

Fatal screen contains:

- Plain explanation.
- Reload.
- Relevant clear-data option.
- Error code.
- No raw stack trace in normal UI.

---

# 26. Debug and test hooks

Development controls:

- Hitboxes.
- Navigation zones.
- Spawn sockets.
- Telegraph priorities.
- Freeze AI.
- Advance phase.
- Spawn enemy/elite.
- Grant upgrade.
- Set health.
- Set cooldown.
- Force boss phase.
- Print run state.
- Copy seed.
- Replay seed.
- Show pools/listeners/timers.
- Simulate low FPS.
- Validate all arenas.
- Generate 1,000 upgrade offerings.
- Generate 1,000 encounter selections.

---

# 27. Deployment

## 27.1 Base path

Project site:

```text
https://<username>.github.io/<repository>/
```

Vite base:

```text
/<repository>/
```

Root user site uses `/`.

## 27.2 GitHub Actions flow

1. Checkout.
2. Install exact dependencies.
3. Run validation/tests.
4. Build.
5. Upload `dist`.
6. Deploy Pages artifact.

## 27.3 Production verification

- Test local preview.
- Test deployed URL.
- Hard refresh.
- Private window.
- Case-sensitive paths.
- No localhost references.
- Audio after gesture.
- Save persistence.
- Console clean.

---

# 28. Privacy and security

- No personal-data collection.
- No analytics by default.
- No gameplay network requests.
- Treat imported JSON as untrusted.
- No `eval`.
- No dynamic script injection.
- Sanitize any user-entered display text.
- Clipboard use is optional and permission-safe.

---

# 29. Technical acceptance criteria

The implementation passes when:

- Production build has no console errors.
- Twenty restarts show no listener, timer, audio-node, or object-count growth.
- Echo playback survives pause/resume.
- Same seed reproduces gameplay generation under identical choices.
- Corrupt saves recover.
- Arena and encounter fallbacks work.
- Performance budgets hold.
- Repeated entities are pooled.
- Scene shutdown is complete.
- GitHub Pages matches local production behavior.
- Settings persist.
- No backend is required.

---

# 30. Technical risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Echo playback drift | Critical | Simulation timestamps, interpolation, event cursors, stress tests |
| Restart duplicates listeners/timers | Critical | Cleanup registry and count tests |
| Cosmetic RNG changes gameplay | High | Separate RNG streams |
| Crowd physics pins player | High | Soft separation, caps, spacing |
| Multiple AudioContexts | High | One AudioManager |
| Upgrade mutates active Echo | High | Frozen loadout snapshot |
| Hostile copy reuses friendly faction | High | Separate entity/faction/renderer |
| Generation creates dead end | High | Authored templates, validation, fallback |
| Save corruption | Medium | Schema validation and backup |
| GitHub Pages path failure | High | Correct Vite base and deployed QA |
| Per-frame allocation | High | Pools, fixed buffers, profiler |
| UI focus conflict | Medium | One UIFocusManager |
