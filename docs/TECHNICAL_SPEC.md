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
| Aggregate statistics | `StatisticsManager` | Results/statistics UI | StatisticsManager |
| Menu focus | `FocusManager` | Current UI scene | FocusManager |
| Pause | `PauseController` | Gameplay systems | PauseController |
| Boss attack schedule | `BossAttackScheduler` | Boss presentation/debug | Scheduler |

No second owner is allowed without revising this specification.

---

# 7. Service container

A small explicit service container is created once in `main.js`.

```js
const services = {
  eventBus,
  sceneFlow,
  inputManager,
  audioManager,
  saveManager,
  settingsManager,
  debugManager,
};
```

Rules:

- Services are passed to scenes.
- Services do not import scenes.
- Services expose narrow public APIs.
- Services survive scene restarts.
- Scene-owned gameplay systems do not become global services unless required across scenes.

---

# 8. Event bus

Use a narrow typed-by-convention event bus.

## 8.1 Event naming

```text
scope:entity:action
```

Examples:

```text
player:health:changed
echo:deployed
enemy:defeated
run:segment:changed
score:changed
combo:changed
boss:phase:changed
settings:changed
save:recovered
```

## 8.2 Event rules

- Payloads have documented shapes.
- Publishers do not assume listeners.
- Listeners unsubscribe on shutdown.
- Listener ownership is tracked.
- Development builds expose listener counts.
- Listeners must not cause hidden state ownership.
- Events must not replace direct calls for authoritative mutation.

---

# 9. Cleanup registry

Each scene and long-lived system owns a `CleanupRegistry`.

Supported cleanup entries:

- EventBus unsubscribe functions.
- Phaser event listeners.
- DOM listeners.
- Timers.
- Delayed calls.
- Tweens.
- Colliders and overlaps.
- Audio voice handles.
- Abort controllers.
- Temporary graphics.

Required API:

```js
registry.add(cleanupFunction);
registry.flush();
registry.size;
```

Rules:

- Flush is idempotent.
- New entries cannot be added after final destruction in development mode.
- Development builds warn on non-empty registry after expected shutdown.

---

# 10. Pause model

## 10.1 Pause owner

`PauseController` owns pause state.

## 10.2 Pause effects

On pause:

- Pause simulation clock.
- Pause gameplay scenes.
- Stop authoritative timers.
- Preserve render state.
- Lower audio mix.
- Keep UI input active.
- Suppress held gameplay actions.

On resume:

- Resume simulation clock.
- Resume gameplay scenes.
- Clear transient pressed/released edges.
- Preserve cooldown values exactly.
- Restore prior music state.

## 10.3 Time source

Gameplay systems use simulation time supplied by the owning scene or `SimulationClock`.

Do not use:

- `Date.now()` for gameplay timing.
- `performance.now()` for authoritative gameplay.
- Wall-clock time for cooldowns.

Wall-clock time is allowed for:

- Save timestamps.
- Profiling.
- Diagnostics.
- Menu animation independent of gameplay.

---

# 11. Deterministic random service

## 11.1 RNG algorithm

Use a documented deterministic generator such as `sfc32` seeded by a 128-bit state derived from:

- User seed.
- Version salt.
- Stream key.

## 11.2 Named streams

```text
run.route
run.arena
run.encounter
run.spawn
run.elite
run.upgrade
run.boss
run.hostileEcho
run.cosmetic
```

Rules:

- Streams are independent.
- Cosmetic RNG never consumes gameplay RNG.
- UI animation RNG never consumes gameplay RNG.
- Debug tools show stream state in development mode.
- RNG call order is stable.
- No gameplay use of `Math.random()`.

## 11.3 Seed record

A completed run stores:

```js
{
  seedText,
  seedHash,
  generatorVersion,
  routeHash,
}
```

---

# 12. Run state

## 12.1 RunState

`RunState` is a serializable in-memory object for the current run.

```js
{
  runId,
  seed,
  difficultyId,
  generatorVersion,
  status,
  currentSegmentIndex,
  currentArenaId,
  playerHealth,
  upgrades,
  score,
  combo,
  statistics,
  bossState,
  hostileEchoSource,
  startedAt,
}
```

`RunState` is not saved for resume.

## 12.2 Run status

```text
PREPARING
ACTIVE
PAUSED
UPGRADE
RECOVERY
BOSS
VICTORY
DEFEAT
FINALIZED
```

## 12.3 Finalization

Finalization is idempotent.

```js
finalizeRun(resultPayload, uniqueToken)
```

It:

- Stops gameplay.
- Locks input.
- Clears active objects.
- Computes final score.
- Updates persistent statistics.
- Evaluates achievements.
- Stores recent run.
- Saves persistent data.
- Transitions to Results.

A consumed finalization token cannot execute twice.

---

# 13. Player architecture

## 13.1 Player entity

The Player owns:

- Arcade body.
- Visual container.
- Aim direction.
- State enum.
- Health component reference.

The Player does not own:

- Global input mapping.
- Weapon cooldown policy.
- Dash cooldown policy.
- Upgrade recomputation.
- Camera.
- Score.

## 13.2 Player state

```text
SPAWNING
ACTIVE
DASHING
DISABLED
DEAD
```

## 13.3 Movement

- Acceleration and deceleration based.
- Diagonal input normalized.
- Velocity capped.
- Collision against obstacles and bounds.
- Aim independent of movement.
- No hidden friction after explicit stop.

## 13.4 Dash

Dash uses:

- Input buffer.
- Direction lock at activation.
- Separate duration and cooldown.
- Fixed invulnerability window.
- Collision-safe stop.
- No tunneling through obstacles.
- No collision-category changes.

Dash exposes:

```js
{
  active,
  cooldownRemaining,
  direction,
  invulnerable,
}
```

---

# 14. Echo recording

## 14.1 EchoRecorder ownership

`EchoRecorder` owns recent player history.

## 14.2 Sampling frequency

- Target: 30 Hz.
- Sampling uses simulation time.
- Catch-up is bounded.
- A dropped render frame may emit several snapshots up to a hard maximum.
- Excess catch-up is discarded with a development warning.

## 14.3 Snapshot structure

```js
{
  time,
  x,
  y,
  vx,
  vy,
  aimX,
  aimY,
  facing,
  stateFlags,
}
```

## 14.4 Snapshot buffer

- Fixed capacity.
- Preallocated storage.
- Constant-time append.
- Wrap-safe logical ordering.
- Range extraction without mutation.
- Surrounding-snapshot lookup for interpolation.

## 14.5 Action events

Separate fixed-capacity buffers for:

```text
FIRE
DASH_START
DASH_END
```

Each event includes:

```js
{
  id,
  time,
  type,
  payload,
}
```

Event IDs are monotonic within a run.

## 14.6 Timestamp semantics

Recording window:

```text
[startTime, endTime]
```

- Include events exactly at `startTime`.
- Include events exactly at `endTime` if they have completed before deployment lock.
- Do not include events after `endTime`.
- Normalize all extracted timestamps relative to `startTime`.

---

# 15. Echo playback

## 15.1 Echo instance

An Echo instance owns:

- Immutable recording descriptor.
- Immutable loadout snapshot.
- Playback time.
- Snapshot cursor.
- Event cursors.
- Visual state.
- Pooled projectile ownership metadata.

## 15.2 Loadout snapshot

At deployment:

```js
{
  baseDamage,
  projectileSpeed,
  projectileLifetime,
  projectileCount,
  pierce,
  fireRateScalar,
  upgradeLevels,
  damageScalar,
  visualVariant,
}
```

Playback uses this snapshot, not live upgrade state.

## 15.3 Interpolation

- Linear position interpolation.
- Shortest-angle aim interpolation.
- Clamp before first snapshot.
- Clamp after final snapshot.
- No extrapolation.
- No physics authority.

## 15.4 Event replay

- Cursors only move forward.
- Events execute once.
- Events at equal timestamps execute by recorded event ID.
- Dash visuals replay.
- Fire events spawn Echo projectiles.
- No contact damage.

## 15.5 Echo state

```text
SPAWNING
REPLAYING
DISSOLVING
INACTIVE
```

## 15.6 Echo cleanup

Cleanup:

- Stops event replay.
- Clears timers/tweens.
- Recycles body and renderer.
- Releases projectile ownership handles.
- Emits exactly one dissolve event.

---

# 16. Projectile architecture

## 16.1 Projectile types

```text
PLAYER
FRIENDLY_ECHO
ENEMY
BOSS
HOSTILE_ECHO
```

## 16.2 Shared fields

```js
{
  projectileId,
  faction,
  sourceId,
  position,
  velocity,
  damage,
  pierceRemaining,
  lifetimeRemaining,
  active,
  nearMissConsumed,
}
```

## 16.3 Pools

Separate pools by behavior group:

- Player/friendly.
- Enemy.
- Boss/hostile Echo.
- Effects.
- Damage text.

Rules:

- Preallocate.
- Fixed capacity.
- LIFO reuse.
- Explicit reset.
- No active-object reuse.
- Development metrics expose active, free, and capacity.

## 16.4 Pool exhaustion

On exhaustion:

- Reject spawn deterministically.
- Increment diagnostic counter.
- Log one rate-limited development warning.
- Do not allocate fallback objects.
- Do not reuse active objects.

---

# 17. Collision architecture

## 17.1 Categories

```text
PLAYER_BODY
PLAYER_PROJECTILE
ECHO_PROJECTILE
ENEMY_BODY
ENEMY_PROJECTILE
BOSS_PROJECTILE
WORLD_SOLID
HAZARD
```

## 17.2 Matrix

| A | B | Behavior |
|---|---|---|
| Player | World | Collide |
| Player | Enemy | Contact damage |
| Player | Enemy projectile | Damage/consume |
| Player | Boss projectile | Damage/consume |
| Player projectile | World | Consume |
| Player projectile | Enemy | Damage/pierce |
| Player projectile | Boss | Damage/pierce |
| Echo projectile | World | Consume |
| Echo projectile | Enemy | Damage/pierce |
| Echo projectile | Boss | Damage/pierce |
| Enemy | World | Collide/avoid |
| Enemy projectile | World | Consume |
| Hazard | Player | Hazard API |

## 17.3 Exactly-once hit handling

Projectile-target hit key:

```text
projectileId + targetId
```

Rules:

- The same projectile cannot hit the same target twice.
- Piercing may hit different targets.
- Consumed projectiles are disabled before deferred callbacks.
- Death handling validates target alive state.
- Score events consume unique IDs.

---

# 18. Damage and health

## 18.1 Damage request

```js
{
  sourceId,
  sourceType,
  targetId,
  amount,
  damageType,
  timestamp,
  hitPosition,
  uniqueHitId,
}
```

## 18.2 Damage result

```js
{
  applied,
  amountApplied,
  killed,
  remainingHealth,
  reason,
}
```

Reasons include:

```text
APPLIED
INVULNERABLE
ALREADY_DEAD
DUPLICATE_HIT
INVALID_TARGET
ZERO_DAMAGE
```

## 18.3 Health invariants

- Health clamped to `[0, maxHealth]`.
- Death fires once.
- Invulnerability uses simulation time.
- Damage cannot resurrect.
- Repair cannot exceed max.
- Boss phase thresholds are evaluated after applied damage.

---

# 19. Enemy architecture

## 19.1 Enemy instance

An enemy owns:

- Entity ID.
- Archetype ID.
- Arcade body.
- Health component.
- AI controller.
- Attack controller.
- Elite state.
- Renderer.
- Cleanup registry.

## 19.2 AI state model

Every enemy uses explicit states:

```text
SPAWNING
ACQUIRE
MOVE
TELEGRAPH
ATTACK
RECOVER
STAGGER
DEAD
INACTIVE
```

Unsupported states are not silently entered.

## 19.3 Enemy update budget

- Navigation updates may run below render frequency.
- Attack telegraphs remain frame-smooth.
- Expensive target queries are staggered.
- Avoid full-array sort each frame.
- Reuse query buffers.

## 19.4 Enemy definitions

Definitions are data objects.

```js
{
  id,
  baseHealth,
  moveSpeed,
  contactDamage,
  preferredRange,
  attackInterval,
  projectileSpeed,
  projectileDamage,
  threatCost,
  allowedEliteModifiers,
  presentation,
}
```

---

# 20. Elite architecture

## 20.1 Elite composition

Elites wrap base enemy behavior.

```js
EliteState {
  modifierId,
  threatCost,
  visualState,
  cooldowns,
}
```

## 20.2 Modifier hooks

```text
onSpawn
beforeMove
afterMove
beforeAttack
afterAttack
onDamage
onDeath
onUpdate
```

Each hook is optional.

## 20.3 Constraints

- Modifiers do not replace the base role.
- Modifier state resets on pool return.
- Duplicating creates a separate tracked enemy.
- Regeneration cannot revive.
- Volatile death is once-only.
- Phase-Rush respects world collision.

---

# 21. Encounter generation

## 21.1 EncounterDirector

Responsibilities:

- Own encounter state.
- Request deterministic encounter plan.
- Schedule telegraphs.
- Activate groups.
- Track completion.
- Trigger recovery/upgrade.
- Emit diagnostics.

## 21.2 Encounter plan

```js
{
  encounterId,
  threatBudget,
  groups: [
    {
      groupId,
      telegraphTime,
      activationTime,
      spawns: [
        {
          enemyType,
          transformId,
          eliteModifierId,
        }
      ]
    }
  ]
}
```

## 21.3 Spawn schedule

- Telegraph start.
- Telegraph complete.
- Body activation.
- AI activation.

No enemy damages the player before AI activation.

## 21.4 Completion

Encounter complete when:

- All planned groups activated.
- No active enemies remain.
- No pending duplication remains.
- No completion transition already consumed.

---

# 22. Arena generation

## 22.1 Arena template

```js
{
  id,
  bounds,
  playerSpawn,
  enemySpawnTransforms,
  obstacles,
  hazardRegions,
  recoveryTransform,
  bossCompatible,
  minimumSafeArea,
}
```

## 22.2 Template validation

Offline validator checks:

- Player spawn valid.
- Enemy transforms valid.
- No obstacle overlap.
- Minimum navigable lanes.
- No spawn inside hazards.
- Recovery transform valid.
- Boss space sufficient.

## 22.3 Arena selection

- Uses `run.arena` stream.
- Avoid immediate repeats where alternatives exist.
- Difficulty may filter templates.
- Selection is stored in run plan.

---

# 23. Run plan

The run is generated into a serializable `RunPlan` before gameplay begins.

```js
{
  seed,
  generatorVersion,
  difficultyId,
  segments: [
    { type: 'COMBAT', arenaId, encounters },
    { type: 'UPGRADE', offerSeed },
    { type: 'ELITE_COMBAT', arenaId, encounters },
    { type: 'RECOVERY', arenaId },
    { type: 'BOSS', arenaId, bossSeed }
  ]
}
```

Benefits:

- Generation independent of render timing.
- Easy deterministic testing.
- Route inspectable in debug mode.
- Pause cannot alter later choices.
- Boss schedule can derive named stream from stored seed.

---

# 24. Upgrade architecture

## 24.1 Upgrade definition

```js
{
  id,
  category,
  maxStacks,
  dependencies,
  exclusions,
  weight,
  tags,
  isUnlocked(saveData),
  apply(runUpgradeState),
}
```

`apply` mutates run upgrade state only.

## 24.2 RunStatsModel

Derived stats are recomputed from:

```text
base stats + ordered active upgrade definitions
```

No incremental permanent mutation.

## 24.3 Offer generator

Inputs:

- Offer seed.
- Current upgrade levels.
- Unlocked upgrade set.
- Prior offer history.
- Pity counters.

Output:

- Three unique valid cards.
- Stable order.
- Deterministic replacement if pool is too small.

## 24.4 Extra Echoes

Extra Echoes are real instances.

Each has:

- Unique ID.
- Own playback cursor.
- Own event cursor.
- Own pooled projectile source ID.
- Own lifetime.
- Own visual marker.

No shared mutable cursor.

---

# 25. Boss architecture

## 25.1 Boss state

```text
INTRO
PHASE_1
TRANSITION_1
PHASE_2
TRANSITION_2
PHASE_3
VICTORY
DEAD
```

## 25.2 Boss owner

`BossScene` owns:

- Boss body.
- Boss health.
- Phase state.
- Pattern scheduler.
- Boss projectile manager.
- Hostile Echo copies.
- Sector hazard controller.
- Boss adds.
- Boss-local cleanup.

## 25.3 Pattern scheduler

Pattern definition:

```js
{
  id,
  minPhase,
  maxPhase,
  telegraphDuration,
  activeDuration,
  cooldown,
  maxConcurrent,
  prerequisites,
  start(context),
  update(context),
  stop(context),
}
```

Scheduler rules:

- Deterministic named stream.
- No immediate repeat where alternatives exist.
- Enforce cooldown.
- Enforce concurrency.
- Fallback attack if no pattern eligible.
- Pause-safe.
- Restart-safe.

## 25.4 Vulnerability cap

Boss damage immunity may not exceed the documented maximum continuous duration.

Scheduler tracks:

```js
continuousInvulnerableDuration
```

If cap reached, force a vulnerability window.

---

# 26. Hostile Echo copy

## 26.1 Source selection

Hostile Echo source selection uses:

- Completed recent run.
- Compatible generator version.
- Supported upgrade set.
- Valid recording payload.
- Deterministic fallback.

## 26.2 Normalization

Historical payload is normalized:

- Clamp damage.
- Clamp projectile count.
- Clamp fire rate.
- Clamp replay speed.
- Remove unsupported upgrades.
- Limit active projectiles.

## 26.3 Ownership

Hostile Echo belongs to `BossScene`.

It uses:

- Separate renderer.
- Separate projectile pool partition.
- Separate faction.
- Separate damage scalar.
- Separate cleanup.

It never reuses friendly Echo ownership identifiers.

---

# 27. Scoring architecture

## 27.1 Score owner

`ScoreManager` owns score and combo.

## 27.2 Score event

```js
{
  eventId,
  type,
  baseValue,
  targetId,
  sourceType,
  simulationTime,
  metadata,
}
```

`eventId` is unique.

## 27.3 Award formula

```text
floor(baseValue × comboMultiplier × difficultyMultiplier)
```

## 27.4 Combo state

```js
{
  meter,
  multiplier,
  lastGainTime,
  decayActive,
}
```

Rules:

- Decay uses simulation time.
- Damage resets meter.
- Pause freezes decay.
- Thresholds are data-driven.
- HUD animation does not own authoritative combo.

## 27.5 Near miss

Near miss requires:

- Hostile projectile enters near radius.
- Projectile does not hit player.
- Projectile has not already awarded near miss.
- Rate cap not exceeded.

Projectile stores `nearMissConsumed`.

---

# 28. Statistics and achievements

## 28.1 Persistent aggregate statistics

Store:

- Runs started.
- Runs completed.
- Victories.
- Defeats.
- Enemies defeated.
- Elites defeated.
- Boss defeats.
- Echoes deployed.
- Friendly Echo damage.
- Player damage.
- Crossfire events.
- Total score.
- Highest score.
- Highest combo.
- Total playtime.

## 28.2 Recent runs

Maximum 50.

Each entry stores compact summary only.

## 28.3 Achievements

Achievement definition:

```js
{
  id,
  condition(statistics, runResult),
  unlocks,
  repeatable: false,
}
```

Rules:

- Evaluate once during finalization.
- Record completion timestamp.
- Do not mutate run result after creation.
- Do not award twice.

---

# 29. Save schema

## 29.1 Top-level

```js
{
  schemaVersion,
  createdAt,
  updatedAt,
  settings,
  progression,
  statistics,
  records,
  recentRuns,
  achievements,
  meta,
}
```

## 29.2 Keys

```text
echoframe.save.v1
echoframe.save.backup.v1
```

## 29.3 Write sequence

1. Clone in-memory validated data.
2. Apply mutation.
3. Validate and normalize.
4. Serialize.
5. Write previous primary to backup.
6. Write new primary.
7. Update in-memory snapshot.
8. Emit saved event.

## 29.4 Load sequence

1. Read primary.
2. Parse.
3. Validate.
4. Migrate.
5. If invalid, read backup.
6. If backup valid, restore primary.
7. Otherwise create defaults.
8. Notify user if recovery occurred.

## 29.5 Validation rules

- Object types checked.
- Arrays length-capped.
- Strings length-capped.
- Numbers finite and clamped.
- IDs validated against known catalogs.
- Unknown fields ignored.
- Missing fields defaulted.
- No dynamic code.
- Import rejects malformed payload.

## 29.6 Persistence exclusions

Do not save:

- Active projectiles.
- Active enemies.
- Active Echo instances.
- Current physics bodies.
- Timers.
- Tweens.
- Active run resume state.

---

# 30. Settings architecture

## 30.1 Settings categories

```text
AUDIO
VISUAL
ACCESSIBILITY
CONTROLS
GAMEPLAY
DATA
```

## 30.2 Settings rules

- Read through SettingsManager.
- Persist through SaveManager.
- Apply immediately where safe.
- Visual settings do not alter simulation.
- Audio settings affect buses.
- Binding changes trigger InputManager rebuild.
- Rebuild disposes old key objects.
- Reset-to-default supported per category.

## 30.3 Binding representation

```js
{
  actionId: [
    { device: 'keyboard', code: 'KeyW' },
    { device: 'pointer', button: 0 }
  ]
}
```

Up to two bindings per action.

---

# 31. Input architecture

## 31.1 Action state

```js
{
  held,
  pressed,
  released,
  value,
}
```

## 31.2 Contexts

```text
MENU
GAMEPLAY
PAUSE
MODAL
REBIND_CAPTURE
```

Contexts form a stack.

Only the top context receives actionable input.

## 31.3 Rebinding

Rebinding flow:

1. Enter capture context.
2. Suppress current held actions.
3. Listen for next allowed descriptor.
4. Validate descriptor.
5. Check conflicts.
6. Apply or reject.
7. Rebuild action map.
8. Persist.
9. Exit capture context.

Reserved:

- Browser refresh combinations.
- DevTools combinations.
- `F5`.
- Unsupported pointer buttons.

---

# 32. Menu focus architecture

## 32.1 Focus manager

Each menu scene owns one FocusManager.

Features:

- Ordered controls.
- Disabled controls skipped.
- Pointer hover updates focus.
- Keyboard focus visible.
- Modal focus trap.
- Focus restore on modal close.
- Default focus on scene entry.

## 32.2 Menu control contract

Every focusable control exposes:

```js
{
  focus(),
  blur(),
  activate(),
  isEnabled(),
  getBounds(),
}
```

---

# 33. Audio architecture

## 33.1 AudioManager ownership

One global AudioManager owns:

- One AudioContext.
- Master bus.
- Music bus.
- Effects bus.
- Voice bus if narration exists later.
- Procedural sound definitions.
- Music-state machine.
- Voice caps.

## 33.2 Initialization

- No AudioContext before user gesture.
- First valid gesture initializes.
- Initialization is idempotent.
- One context maximum.
- Context resumes if suspended.

## 33.3 Sound request

```js
{
  soundId,
  bus,
  gain,
  pitch,
  position,
  priority,
  sourceId,
}
```

## 33.4 Voice caps

Per sound family:

- Player fire.
- Echo fire.
- Enemy fire.
- Hit.
- Death.
- UI.
- Boss.

On cap:

- Reject lowest-priority new voice or stop oldest lowest-priority voice.
- Never allocate unbounded nodes.

## 33.5 Music states

```text
MENU
TUTORIAL
COMBAT_LOW
COMBAT_HIGH
RECOVERY
BOSS_1
BOSS_2
BOSS_3
VICTORY
DEFEAT
```

Transitions use scheduled gain ramps and shared phase origins.

---

# 34. Rendering architecture

## 34.1 Procedural textures

Generated once in PreloadScene.

Cache keys include:

- Asset family.
- Variant ID.
- Scale class if needed.

Do not regenerate per scene.

## 34.2 Render layers

Suggested world depths:

```text
0 background
10 arena floor
20 obstacles
30 hazards
40 enemy shadows
50 enemies
60 Echoes
70 player
80 projectiles
90 impacts
100 world labels
```

HUD lives in separate scene.

## 34.3 Particles

- Pooled or bounded emitters.
- Reduced-particle mode modifies emit counts at creation.
- No emitter created per hit without cleanup.
- Particle geometry must not resemble hostile projectiles.

## 34.4 Accessibility rendering

- High contrast uses alternate texture/material parameters.
- Colorblind telegraphs include shape and line-pattern differences.
- Reduced flashes replace rapid brightness changes with outline changes.
- Reduced particles preserve hit confirmation.

---

# 35. Camera architecture

`CameraController` owns:

- Follow target.
- Shake requests.
- Zoom effects.
- Arena framing.
- Boss transition framing.

Shake request:

```js
{
  amplitude,
  duration,
  frequency,
  sourceType,
}
```

Settings scale amplitude.

Shake is clamped globally.

---

# 36. Debug architecture

Development-only tools:

- FPS.
- Frame time.
- Heap if available.
- Entity counts.
- Projectile counts.
- Pool active/free/capacity.
- Listener counts.
- Timer counts.
- Collider counts.
- RNG stream states.
- Run plan.
- Current segment.
- Player state.
- Echo cursor state.
- Boss scheduler state.
- Forced transitions.
- Pool exhaustion counters.
- State-machine invalid transition warnings.

Production build disables debug overlay and mutations.

---

# 37. Performance budgets

Target mid-range desktop:

- 60 FPS target.
- 95th percentile frame under 20 ms in intended load.
- No recurring spawn hitch over 50 ms.
- Stable heap over 30-minute session.
- One AudioContext.
- No listener growth after restart.

Approximate active caps:

```text
normal enemies: 30
elites: 3
enemy bodies including adds: 48
friendly Echoes: 3
hostile Echo copies: 2
player projectiles: 120
Echo projectiles: 120
enemy projectiles: 180
boss projectiles: 240
particles/effects: 256
damage labels: 80
```

---

# 38. Browser compatibility

Support current stable:

- Chromium.
- Firefox.
- Edge.

Required checks:

- Keyboard codes.
- Pointer buttons.
- Web Audio initialization.
- LocalStorage quota/error handling.
- Focus loss.
- Resize.
- Visibility change.
- Performance API guards.
- Clipboard API fallback for export.

Safari is best-effort for version 1.0 unless explicitly certified.

---

# 39. Error handling

## 39.1 Recoverable

- Save primary corrupt, backup valid.
- Audio initialization blocked.
- Clipboard API unavailable.
- Fullscreen request rejected.
- LocalStorage write fails.

Show non-blocking user-facing message where relevant.

## 39.2 Fatal

- Core data definitions missing.
- Scene initialization failure.
- Unsupported save schema newer than current.
- Critical asset generation failure.

Fatal flow:

- Stop gameplay.
- Show controlled error screen.
- Offer reload.
- Offer clear local data if safe.
- Log diagnostic message in development.

---

# 40. Testing architecture

## 40.1 Unit tests

Pure modules tested with Node test runner or Vitest:

- RNG.
- Buffers.
- Interpolation.
- Event cursors.
- Upgrade calculations.
- Encounter generation.
- Arena validation.
- Score formulas.
- Save migration/validation.
- Achievement evaluation.
- Boss scheduler selection.

## 40.2 Browser integration

Use Playwright for:

- Fresh launch.
- Audio gesture.
- Tutorial.
- Complete run smoke.
- Pause/restart.
- Settings.
- Rebinding.
- Import/export.
- Boss phases.
- Results.
- GitHub Pages path.

## 40.3 Soak tools

Development build exposes controlled hooks for:

- Time acceleration.
- Forced encounters.
- Pool saturation.
- Repeated restart.
- Repeated pause.
- Boss phase forcing.
- Echo stress.
- Resize cycles.
- Focus-loss cycles.

---

# 41. Deployment

## 41.1 Vite

`vite.config.js` reads base path from environment.

```js
base: process.env.VITE_BASE_PATH || '/'
```

## 41.2 GitHub Pages workflow

Workflow:

1. Checkout.
2. Setup Node.
3. `npm ci`.
4. `npm test`.
5. `npm run build` with repository base.
6. Upload `dist`.
7. Deploy Pages artifact.

## 41.3 Static-path rules

- No root-absolute asset URLs unless base-aware.
- No runtime filesystem access.
- No backend routing.
- `index.html` and manifest use base-compatible paths.
- Refresh on root deployment path remains functional.

---

# 42. Security and privacy

- No analytics.
- No telemetry.
- No external requests after static load.
- No cookies.
- No account data.
- LocalStorage only.
- Imports treated as untrusted.
- No dynamic evaluation.
- No HTML injection from save data.
- No secrets in repository.
- No source maps if release policy excludes them.

---

# 43. Build and release metadata

Production build exposes:

```js
{
  version,
  buildMode,
  generatorVersion,
  balanceVersion,
  saveSchemaVersion,
}
```

Visible in:

- Credits.
- Debug overlay in development.
- Save export.
- Results metadata.

---

# 44. Implementation acceptance criteria

Implementation is technically acceptable only when:

- Deterministic seed audit passes.
- Save migration passes.
- All fixed systems complete.
- Restart leaves no leaked listeners, timers, tweens, colliders, or AudioContexts.
- Pause preserves simulation timing.
- Projectile and effect pools remain within caps.
- Twenty consecutive restarts pass.
- Thirty consecutive Echo deployments pass.
- Boss phase transitions are safe.
- Hostile Echo normalization is bounded.
- Browser matrix passes.
- Production GitHub Pages build passes.
- No Critical or High defects remain.
