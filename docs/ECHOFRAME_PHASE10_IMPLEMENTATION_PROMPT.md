# ECHOFRAME: LAST SIGNAL — Phase 10 Implementation Prompt

Continue development of **ECHOFRAME: LAST SIGNAL** from the validated **Phase 9: Signal Ledger, Scoring, Combo, Archive, and Breadth Progression** release.

Act as a senior Phaser 3 gameplay-onboarding engineer, input-systems engineer, accessibility engineer, UI/UX engineer, browser-compatibility engineer, release engineer, JavaScript architect, save-migration engineer, procedural-audio engineer, performance engineer, and QA lead.

Your task is to implement and fully validate:

```text
Phase 10: First Signal Tutorial, Complete Controls, Accessibility, and Release Candidate Hardening
Version: 1.0.0-release-candidate
```

Do not use Codex. Work directly from the uploaded repository and return the completed release archive and validation evidence.

This is a **release-candidate phase**, not a new content phase. Close every remaining fixed Version 1.0 gap, remove stale prototype presentation, harden production behavior, and prove that the complete game is releasable on desktop browsers and static GitHub Pages hosting.

---

# Files I will upload

I will upload:

1. `ECHOFRAME_phase9_signal_ledger_progression.zip`
2. The five canonical documents, either inside the Phase 9 archive or separately:
   - `GAME_DESIGN.md`
   - `TECHNICAL_SPEC.md`
   - `ART_DIRECTION.md`
   - `BALANCE_SPEC.md`
   - `QA_CHECKLIST.md`
3. Any surviving Phase 10 files, screenshots, notes, defect reports, or partial archives if available
4. This Phase 10 implementation prompt

Treat the validated Phase 9 ZIP as the authoritative code baseline.

Treat the five canonical documents as the authoritative design, technical, art, balance, and QA source.

Do not use Phase 1–8 archives as the implementation baseline unless a specific regression comparison is required.

Do not modify the canonical documents.

Expected Phase 9 release identity:

```text
Archive: ECHOFRAME_phase9_signal_ledger_progression.zip
Version: 0.9.0-signal-ledger-progression
Expected tests: 923/923
Expected SHA-256: 5c19b168b7526d8ec6e83d4fd141fa3fdbbf0a461e5129917347c488626c2f56
```

Do not trust these claims without independently verifying the uploaded archive.

---

# Validated Phase 9 baseline

The Phase 9 release is expected to preserve:

- Phaser 3.90.0
- JavaScript ES modules
- Vite
- Arcade Physics
- GitHub Pages deployment workflow
- deterministic seeded generation
- `SceneFlowController`
- `EventBus`
- `CleanupRegistry`
- `InputManager`
- `AudioManager`
- `SaveManager`
- `SettingsManager`
- `DebugManager`
- `RunState`
- `RunPlan`
- `RunPlanGenerator`
- `RunProgressionController`
- `RunTransitionValidator`
- complete player movement, aiming, firing, dash, health, death, pause, restart, and camera behavior
- deterministic friendly Echo recording and playback
- hostile Echoes as a separate boss-owned system
- six standard enemies
- three elite modifiers
- eight authored arena templates
- all twenty-four canonical upgrades
- seven mandatory upgrade selections
- the recovery chamber
- the complete Null Architect encounter
- true victory and defeat
- deterministic scoring and combo
- immutable score-event ledger
- personal bests
- recent-run history
- breadth-only progression
- six locked-upgrade milestones
- Overclocked unlock
- palettes and trails
- Archive
- Statistics
- complete score-bearing Results
- Phase 9 save migration, import/export, browser validation, lifecycle validation, soak validation, performance evidence, and packaging

The complete playable route is expected to be:

```text
Main Menu
→ Combat 1
→ Upgrade 1
→ Combat 2
→ Upgrade 2
→ Elite 1
→ Upgrade 3
→ Combat 3
→ Upgrade 4
→ Combat 4
→ Upgrade 5
→ Elite 2
→ Upgrade 6
→ Recovery Chamber
→ Final Upgrade 7
→ Null Architect Boss
→ Victory or Defeat Results
→ Restart or Main Menu
```

Phase 10 must preserve this route while adding the canonical first-run tutorial before Combat 1 for a fresh save.

---

# Known Phase 9 release gaps to verify

Do not assume these observations remain true without source inspection, but the uploaded Phase 9 release is expected to contain the following release-candidate gaps:

- `TutorialScene` is an instructional text page rather than the canonical playable tutorial.
- A fresh save does not route through the tutorial before the first run.
- The tutorial cannot be correctly replayed from the Archive as a guided gameplay sequence.
- The save contains `meta.tutorialCompleted`, but production flow does not fully honor it.
- `InputManager` uses hard-coded runtime bindings rather than saved bindings.
- Settings shows bindings but states that interactive rebinding is deferred.
- The current binding save format is legacy string data and does not fully describe keyboard/pointer alternatives.
- Some production-facing strings still refer to a prototype, foundation milestone, pre-boss run, or development phase.
- `CreditsScene` still contains foundation-era wording.
- `PauseScene` contains prototype-era wording.
- `index.html` description still describes an Echo prototype.
- A controlled production fatal-error screen is incomplete or absent.
- Browser/deployment evidence is centered on Chromium and local preview rather than a release browser matrix and static-subpath verification.
- Long-session release gates from `QA_CHECKLIST.md` have not all been run as Phase 10 sign-off evidence.

Document which of these are confirmed, obsolete, partially fixed, or false.

---

# First action: inspect, recover, and establish truth

Before modifying code:

1. Extract the Phase 9 repository into a clean working directory.
2. Compute and record the source ZIP SHA-256.
3. Read all five canonical documents in full where relevant to:
   - first-run onboarding
   - tutorial behavior
   - controls and rebinding
   - menus and focus
   - settings
   - accessibility
   - audio
   - startup and preload
   - error handling
   - privacy and security
   - performance budgets
   - browser compatibility
   - GitHub Pages deployment
   - release acceptance
4. Inspect any uploaded Phase 10 remnants.
5. Compare remnants against the clean Phase 9 baseline.
6. Verify repository-root structure, package version, lockfile, source tree, tests, documentation, screenshots, validation scripts, workflow files, public assets, manifest, favicon, HTML metadata, and Vite base-path logic.
7. Inspect the actual Phase 9 implementation of:
   - `BootScene`
   - `PreloadScene`
   - `MainMenuScene`
   - `TutorialScene`
   - `ArchiveScene`
   - `SettingsScene`
   - `PauseScene`
   - `CreditsScene`
   - `ResultsScene`
   - `InputManager`
   - `SettingsManager`
   - `SaveManager`
   - `SaveSchema`
   - default save data
   - scene registration
   - focus management
   - confirmation modals
   - audio initialization and music-state ownership
   - error handling and fallback paths
   - GitHub Pages workflow
8. Search production-reachable source and UI copy for:
   - `prototype`
   - `foundation`
   - `pre-boss`
   - `boss handoff`
   - `not implemented`
   - `deferred`
   - `coming soon`
   - stale phase/version labels
9. Determine exactly which fixed Version 1.0 requirements are valid, partial, missing, conflicting, or stale.
10. Run the complete existing Phase 9 validation pipeline actually present in `package.json`. At minimum run:

```text
npm ci
npm run lint
npm run test
npm run build
npm run validate
npm run audit:score
npm run audit:combo
npm run audit:progression
npm run audit:statistics
npm run audit:source
npm audit
```

11. Run every real Phase 9 browser/lifecycle/performance script present. Do not invent success for a missing script or unavailable browser.
12. Confirm whether the expected baseline remains `923/923` tests.
13. Create:

```text
docs/PHASE10_RECOVERY_REPORT.md
```

The recovery report must include:

- source archive used
- source SHA-256
- canonical-document hashes
- current package version
- current runtime version
- initial test count
- initial lint/build/audit state
- current tutorial route
- current `tutorialCompleted` behavior
- current tutorial replay behavior
- current binding runtime model
- current saved binding model
- current Settings controls page
- current focus/navigation model
- current accessibility setting coverage
- current audio initialization behavior
- current fatal/recoverable error behavior
- current browser validation coverage
- current GitHub Pages workflow and base-path behavior
- current stale production-facing strings
- recovered Phase 10 files
- missing Phase 10 files
- conflicts
- baseline defects
- reconstruction strategy
- files planned for modification

Do not rebuild the repository from scratch.

Do not replace validated Phase 9 combat, scoring, boss, progression, or save systems with simplified implementations.

Do not trust documentation claims without checking source, tests, production build behavior, and real browser behavior.

---

# Phase 10 objective

Complete all remaining fixed Version 1.0 requirements and produce a credible desktop-browser release candidate.

The fresh-save loop must become:

```text
First launch
→ Main Menu
→ Start Run
→ First Signal Tutorial
→ Combat 1
→ complete Phase 9 route
→ Results
→ progression/statistics update
→ Restart or Main Menu
```

The returning-player loop must remain:

```text
Main Menu
→ Start Run
→ Combat 1
→ complete Phase 9 route
→ Results
```

The tutorial replay loop must be:

```text
Main Menu
→ Archive
→ Tutorial entry
→ Replay Tutorial
→ Tutorial completion
→ Return to Archive or Main Menu
```

Phase 10 must implement:

1. The complete canonical playable first-run tutorial.
2. Fresh-save tutorial routing and persistent completion.
3. Tutorial replay from Archive.
4. Complete gameplay key and pointer rebinding.
5. Binding conflict rejection and safe restoration.
6. Backward-compatible Phase 9 save migration.
7. Full settings and accessibility conformance.
8. Production-facing UI, metadata, credits, and copy cleanup.
9. Controlled recoverable and fatal error presentation.
10. Audio lifecycle and required-cue release audit.
11. Browser compatibility validation in Chromium and Firefox.
12. Static-subpath/GitHub Pages deployment validation.
13. Long-session, performance, lifecycle, focus, resize, and settings validation.
14. Defect classification and release-candidate sign-off.
15. Clean release packaging.

Phase 10 must not change the identity, difficulty structure, combat content, scoring model, progression philosophy, or deterministic generation of the game.

---

# Explicit Phase 10 scope

Phase 10 must include:

- playable authored tutorial chamber
- tutorial state machine
- tutorial step definitions
- player-only movement checkpoints
- stationary target lesson
- harmless dash gate
- recorded firing-path lesson
- meaningful Echo replay lesson
- rear-shielded Echo target
- tutorial hint and retry handling
- out-of-order action protection
- tutorial pause/restart
- first-time tutorial persistence
- returning-player bypass
- Archive replay
- tutorial completion telemetry
- no tutorial scoring or progression rewards
- runtime binding descriptors
- keyboard binding capture
- pointer binding capture
- primary/secondary binding support where required
- binding display labels
- conflict detection and rejection
- reserved-input validation
- restore-default controls
- immediate binding application
- focus-safe capture modal
- held-input neutralization after rebind
- save-schema migration from Phase 9 binding strings
- imported-binding validation
- full Settings category completion
- accessibility setting conformance audit
- keyboard-only complete flow
- mouse complete flow
- readable focus and disabled states
- stale production copy removal
- final Credits scene
- final release metadata
- controlled fatal screen
- save/audio/asset fallback behavior
- clipboard fallback behavior
- production HTML/manifest/favicon review
- GitHub Pages base-path validation
- Chromium and Firefox release matrix
- viewport matrix
- full-route regression
- deterministic regression
- source audit
- security/privacy audit
- long menu idle validation
- long active-session validation
- release defect register
- release checklist
- final screenshots
- clean release ZIP

---

# Explicitly out of scope

Do not implement:

- mobile touch controls
- gamepad controls
- additional playable characters
- additional enemies
- additional elite modifiers
- additional arenas
- additional upgrades
- additional bosses
- alternate boss variants
- endless mode
- New Game Plus
- daily or weekly challenges
- online leaderboards
- accounts
- authentication
- cloud saves
- backend services
- remote telemetry
- full localization
- voice acting
- narrative cutscenes
- user-generated levels
- permanent currency
- shops
- loot boxes
- permanent combat-stat power
- Steam/store integration
- achievements tied to external platforms
- a service worker or offline/PWA expansion unless required to repair an existing shipped manifest defect
- a general ECS

Do not begin a post-release content phase.

---

# Canonical extraction

Create:

```text
docs/PHASE10_CANONICAL_EXTRACTION.md
```

Extract exact canonical requirements for:

## Version 1.0 product scope

- complete primary run mode
- three difficulties
- six enemies
- three elites
- eight arenas
- twenty-four upgrades
- one three-phase boss
- deterministic seeds
- procedural visuals/audio
- local settings/statistics/progression/history
- keyboard-and-mouse navigation
- static GitHub Pages deployment
- explicit non-goals

## First-run tutorial

- new-player understanding target
- tutorial entry route
- movement checkpoints
- stationary target
- harmless dash gate
- path-following while firing
- Echo replay requirement
- shielded target attacked from behind
- normal-combat transition
- tutorial replay
- skip/completion rule
- tutorial scoring exclusion
- Echo/player trigger ownership

## Controls

- default controls
- independent movement and aim
- diagonal normalization
- held fire
- dash inputs
- Echo input
- pause input
- menu inputs
- browser shortcut protection
- context-menu suppression scope
- focus-loss behavior
- gameplay rebinding
- conflict rejection
- fixed menu navigation

## Settings and accessibility

- settings categories
- immediate-application settings
- default values
- shake
- flashes
- particles
- contrast
- damage numbers
- aim line
- HUD opacity
- focus-loss pause
- player locator
- larger outlines
- difficulty
- keyboard-only navigation
- color-independent danger communication

## Main menu, pause, credits, and presentation

- required menu entries
- default focus
- locked difficulty treatment
- low-intensity background
- audio gesture rule
- pause options
- destructive confirmations
- credits behavior
- presentation timing
- minimum viewport

## Audio

- one AudioContext
- user-gesture startup
- required cue list
- music states
- crossfades
- voice caps
- pause mix
- restart ownership
- failure-muted behavior

## Error handling

- recoverable errors
- fatal errors
- fatal-screen contents
- save fallback
- optional asset fallback
- clipboard fallback
- pool fallback
- no raw stack trace

## Performance and release acceptance

- frame targets
- frame-time limits
- spawn-hitch limit
- transfer-size target
- resource caps
- long-session requirements
- deployment verification
- browser coverage
- release-candidate checklist
- zero Critical/High defect rule
- accepted Medium defect documentation

## Privacy and security

- no personal-data collection
- no analytics by default
- no gameplay network requests
- imported JSON treated as untrusted
- no `eval`
- no dynamic script injection
- safe clipboard behavior

Any implementation choice not explicitly canonical must be labeled:

```text
PLAYTEST
```

Do not silently convert a release-engineering preference into canon.

---

# Release identity

Update the project to:

```text
Package version: 1.0.0-release-candidate
Runtime version: 1.0.0-release-candidate
Release label: Version 1.0 Release Candidate
```

Production-facing screens must not use internal phase language as the primary product subtitle.

Development documentation may refer to Phase 10.

Recommended production subtitle:

```text
Fight with your past. Rebuild the signal.
```

This wording is `PLAYTEST` unless a stronger canonical title line exists.

---

# Tutorial architecture

Implement explicit tutorial ownership.

Recommended modules:

```text
src/tutorial/
├── TutorialController.js
├── TutorialState.js
├── TutorialStep.js
├── TutorialStepCatalog.js
├── TutorialProgress.js
├── TutorialObjectiveValidator.js
├── TutorialArenaAdapter.js
├── TutorialTelemetry.js
├── TutorialCompletionRules.js
└── TutorialSnapshot.js
```

Recommended tutorial-specific systems:

```text
src/systems/
├── TutorialMarkerManager.js
├── TutorialTargetManager.js
├── TutorialDashGate.js
├── TutorialShieldTarget.js
└── TutorialHintController.js
```

Recommended data:

```text
src/data/
├── tutorialArena.js
├── tutorialStepDefinitions.js
└── tutorialPresentation.js
```

Use different names where the existing architecture clearly supports a better fit.

Do not create empty abstraction files solely to match this tree.

The tutorial may reuse validated player, projectile, Echo-recorder, Echo-playback, camera, collision, input, HUD, audio, settings, and cleanup systems.

Do not reuse full run progression, score finalization, encounter generation, enemy director, elite selection, upgrade offers, or boss systems inside the tutorial.

---

# Tutorial ownership contract

Preserve these authorities:

- `TutorialController`: tutorial step state and step advancement
- `PlayerController`: player movement and dash execution
- `WeaponSystem`: actual player firing
- `EchoRecorder`: actual recording
- `EchoPlaybackSystem`: actual friendly Echo replay
- `DamageService`: valid tutorial target damage where applicable
- `CollisionManager`: tutorial colliders and overlaps
- `InputManager`: saved gameplay bindings
- `HUDScene` or tutorial HUD layer: read-only objective presentation
- `AudioManager`: tutorial cues
- `SaveManager`: persistent completion only
- `SceneFlowController`: tutorial entry/exit
- `CleanupRegistry`: lifecycle ownership

Do not allow:

- marker visuals to advance steps directly
- Echo visuals to satisfy objective checks without actual replay state
- tutorial target destruction animations to grant completion independently of authoritative target state
- the tutorial to grant score
- the tutorial to grant combo
- the tutorial to update run records
- the tutorial to unlock upgrades, difficulty, lore, or cosmetics merely through completion
- the tutorial to consume gameplay RNG streams
- the tutorial to mutate Phase 9 combat definitions

---

# Tutorial state machine

Use explicit states such as:

```text
INTRO
MOVE_CHECKPOINTS
AIM_AND_FIRE
DASH_GATE
RECORD_PATH
DEPLOY_ECHO
ENTER_SIGNAL_GATE
COMPLETE
EXITING
```

or a clearly equivalent model.

Requirements:

- Steps advance exactly once.
- State transitions are deterministic under identical qualifying events.
- Out-of-order actions cannot skip required lessons.
- Previously learned actions may remain enabled unless they can break the current step.
- Each step has a clear objective, progress, success cue, and next-state transition.
- Step completion uses real gameplay state rather than key-press-only checks.
- Pause freezes simulation and tutorial clocks.
- Restart resets the complete tutorial session.
- Scene shutdown is idempotent.
- Tutorial completion persists only after the final exit gate is successfully entered.
- A tutorial aborted before completion does not set `tutorialCompleted`.
- Replaying an already completed tutorial does not duplicate any reward or statistic.

---

# Canonical tutorial steps

Implement the following exact learning sequence.

## Step 1: Move to three marked positions

Requirements:

- Three authored checkpoints.
- Ordered progression.
- Only the real player can trigger checkpoints.
- Friendly Echoes cannot trigger checkpoints.
- Projectiles cannot trigger checkpoints.
- The player must physically enter each checkpoint.
- Checkpoints remain visually readable in grayscale.
- The current checkpoint is stronger than future checkpoints.
- A subtle path indicator may be used.
- Movement vector and diagonal normalization use production controls.

Recommended `PLAYTEST` completion radius:

```text
44–56 px
```

## Step 2: Aim at and destroy a stationary target

Requirements:

- Uses actual pointer-world aiming.
- Uses actual player projectile path.
- Requires accepted player damage.
- Echo damage does not satisfy this step.
- Target is stationary and clearly non-hostile.
- Target cannot damage the player.
- Target health is low enough to teach firing without delay.
- Aim line setting is respected.
- Damage-number setting is respected.

## Step 3: Dash through a harmless gate

Requirements:

- Uses actual dash state, not movement speed alone.
- Normal walking through the gate does not complete it.
- Echoes cannot complete it.
- The gate deals no damage.
- The gate clearly communicates dash direction and timing without color alone.
- Both configured dash inputs work.
- Dash cooldown and fallback direction behavior match production systems.

## Step 4: Follow a marked path while firing

Requirements:

- The path has multiple authored waypoints.
- Player movement samples must cover the path in order.
- At least a documented minimum number of accepted player fire events must be recorded.
- The step prepares a meaningful replay path rather than checking only elapsed recording time.
- The Echo recorder uses production 30 Hz behavior.
- Pausing does not corrupt the recorded interval.
- Leaving the path may prompt retry without soft-locking the tutorial.

Recommended `PLAYTEST` qualification:

```text
At least 3.5 seconds of valid history
At least 4 path checkpoints
At least 4 recorded fire events
```

## Step 5: Deploy an Echo that destroys a shielded target from behind

Requirements:

- Uses the actual friendly Echo entity and playback system.
- The target has a visible protected front arc and vulnerable rear arc.
- Direct frontal player damage cannot complete the objective.
- Direct player rear damage must not substitute for the required Echo lesson.
- An accepted friendly-Echo hit from the vulnerable rear side must defeat the target.
- The Echo must replay the path and fire events captured in Step 4.
- The target placement makes successful replay understandable and achievable.
- The tutorial detects an invalid recording and offers a bounded retry path.
- Retry resets only the relevant recording/target state, not the entire tutorial, unless the player chooses restart.
- Echo cooldown presentation is accurate.
- Friendly Echo visuals remain distinct from the real player.

## Step 6: Enter normal combat

Requirements:

- A final signal gate opens only after the Echo lesson succeeds.
- Entering the gate marks tutorial completion once.
- First-run flow transitions into Combat 1 with a fresh valid run.
- Tutorial replay returns to the configured parent scene instead of starting a run.
- No tutorial entities survive the transition.
- Held fire, dash, movement, and Echo actions are neutralized until released.

---

# Tutorial arena

Create one authored tutorial arena.

Requirements:

- Separate plain-data descriptor.
- Safe player spawn.
- Three movement checkpoints.
- Stationary target socket.
- Dash-gate lane.
- Recording path.
- Shielded target socket.
- Final signal gate.
- No procedural combat encounter generation.
- No enemy projectiles.
- No hazards.
- No score-bearing objects.
- No upgrade pickups.
- No recovery objects.
- Clear collision boundaries.
- Camera framing consistent with production arenas.
- Valid minimum route widths.
- No decorative collision.
- Tutorial geometry is validated before runtime.

The tutorial arena must not be added to the normal eight-arena run-selection pool.

---

# Tutorial entry and completion rules

Fresh save:

```text
meta.tutorialCompleted = false
```

Required production behavior:

1. Main Menu loads with Start Run focused.
2. Selecting Start Run creates a pending first-run intent, not an active scored run.
3. The tutorial starts.
4. Successful tutorial completion sets `tutorialCompleted` once.
5. A fresh run is then created using Standard difficulty unless the canonical extraction proves another behavior.
6. Combat 1 begins with score zero and no tutorial state.

Returning save:

```text
meta.tutorialCompleted = true
```

Required behavior:

- Start Run begins Combat 1 directly.
- The last unlocked selected difficulty remains respected.
- Archive exposes Replay Tutorial.

Tutorial replay:

- Does not change run-start counters.
- Does not create a run ID.
- Does not update recent runs.
- Does not update personal bests.
- Does not grant progression.
- May refresh `tutorialCompleted` to true idempotently after completion.
- Returns to Archive by default.

If the canonical documents remain ambiguous about first-time skipping, follow the stricter QA requirement:

```text
Fresh save enters the tutorial.
Skipping becomes available only after the first completion.
```

Label this interpretation in canonical extraction.

---

# Tutorial HUD and hints

Required presentation:

- Current objective.
- Step number.
- Concise control hint using the current saved binding.
- Progress where meaningful.
- Retry hint only when needed.
- Pause availability.
- No score or combo HUD.
- No boss/chamber HUD.
- No opaque full-screen instruction panel during active movement.

Binding labels must update if the player changes controls before replaying the tutorial.

Hints must not assume `WASD`, `Shift`, `Space`, or a specific mouse button after rebinding.

Reduced-motion, reduced-flash, high-contrast, larger-outline, HUD-opacity, and locator settings must apply.

---

# Tutorial persistence

Use the existing `meta.tutorialCompleted` field or a clearly compatible successor.

Requirements:

- Completion writes once.
- Completion survives reload.
- Valid Phase 9 imports default missing completion safely.
- Clear data resets completion to false.
- Export/import preserves completion.
- Aborted tutorial does not complete.
- Restart does not complete.
- Replayed tutorial remains complete.
- No per-step save writes are required unless a canonical reason exists.
- Active tutorial state is not resumable after browser reload.

---

# Complete input rebinding

Replace hard-coded production bindings with validated saved binding descriptors.

Menu navigation remains fixed in Version 1.0:

```text
Arrow keys: navigate
Enter: confirm
Escape: cancel/back
Mouse: hover/click/adjust
```

Gameplay actions to support:

```text
moveUp
moveDown
moveLeft
moveRight
fire
dash
deployEcho
pause
```

The runtime may retain internal `confirm` and `cancel` action names for menu architecture, but the Settings UI must not imply that fixed menu navigation is user-remappable in Version 1.0.

---

# Binding descriptor model

Use plain serializable validated data.

Recommended schema:

```text
bindings:
  moveUp:
    - device: keyboard
      code: KeyW
  moveDown:
    - device: keyboard
      code: KeyS
  moveLeft:
    - device: keyboard
      code: KeyA
  moveRight:
    - device: keyboard
      code: KeyD
  fire:
    - device: pointer
      button: 0
  dash:
    - device: keyboard
      code: ShiftLeft
    - device: pointer
      button: 2
  deployEcho:
    - device: keyboard
      code: Space
  pause:
    - device: keyboard
      code: Escape
```

This structure is `PLAYTEST` if the canonical documents do not define the data format.

Requirements:

- Keyboard bindings use `KeyboardEvent.code` or an equally layout-stable physical-key identifier.
- Display labels are separate from stored identifiers.
- Pointer bindings store a finite supported button ID.
- Binding arrays are bounded.
- Unknown devices/codes/buttons are rejected or defaulted.
- No mutable Phaser key objects enter save data.
- Save data is plain JSON.

Recommended hard limits:

```text
Maximum bindings per gameplay action: 2
Supported pointer buttons: 0, 1, 2
```

Do not add touch or gamepad descriptors.

---

# Default gameplay bindings

Preserve canonical defaults:

| Action | Default |
|---|---|
| Move up | W |
| Move down | S |
| Move left | A |
| Move right | D |
| Fire | Left mouse |
| Dash | Left Shift and right mouse |
| Deploy Echo | Space |
| Pause | Escape |

Requirements:

- Restore Defaults returns exactly to these bindings.
- The default right-click context menu remains suppressed only over the game canvas.
- Browser-reserved shortcuts outside the canvas are unaffected.
- Escape remains a fixed menu cancel action.
- If pause is rebound, Escape should remain a documented safety fallback in gameplay unless canonical extraction supports removing it.

---

# Rebinding interaction

Implement a real controls screen.

Required behavior:

1. Select a gameplay action.
2. Select primary or secondary slot where applicable.
3. Open a capture modal.
4. Show `Press a key or mouse button`.
5. Ignore key repeat.
6. Capture one supported input.
7. Validate reserved/conflicting input.
8. Commit only a valid binding.
9. Apply immediately.
10. Restore focus to the edited action.

Required controls:

- Rebind primary.
- Add/change secondary where allowed.
- Clear optional secondary.
- Restore all defaults.
- Cancel capture with Escape.
- Back without changing.

Requirements:

- Capture modal owns input while open.
- Gameplay and menu actions do not fire through the modal.
- The click that opens capture cannot become the captured pointer binding.
- Held keys/buttons are suppressed until released after capture closes.
- Pointer right-click capture does not open the browser context menu over the canvas.
- Capture does not persist invalid partial state.
- Closing Settings preserves valid bindings.
- Reopening Settings displays the saved bindings.

---

# Binding conflict rules

Canonical requirement:

```text
Conflicting bindings are rejected.
```

At minimum reject:

- the same keyboard code assigned to opposing movement actions
- the same keyboard code assigned to multiple gameplay actions where simultaneous meaning is ambiguous
- the same pointer button assigned to both fire and dash
- unsupported pointer buttons
- browser-reserved function keys where the browser cannot safely surrender control
- modifier-only combinations that cannot be reliably detected, except the canonical standalone Shift dash binding
- empty required actions

Requirements:

- Rejection is explicit and readable.
- Existing valid binding remains unchanged.
- No automatic destructive swap unless the user explicitly chooses a documented swap flow.
- A player can never leave the game without movement, fire, dash, Echo, or pause access.
- Restore Defaults always repairs a malformed set.
- Import validation repairs or rejects conflicts deterministically.

If a conflict matrix is not canonical, document it as `PLAYTEST`.

---

# Runtime input architecture

Refactor `InputManager` so new contexts use current validated saved bindings rather than a module-level hard-coded map.

Requirements:

- One authoritative binding catalog/normalizer.
- Context creation reads a frozen binding snapshot.
- A `settings:changed` binding event safely refreshes active contexts or takes effect at a documented safe boundary.
- Rebinding during paused gameplay must apply on resume without duplicate Phaser keys or listeners.
- Existing contexts are disposed before replacement.
- Keyboard and pointer held-state suppression remains correct.
- Focus loss clears held actions.
- Visibility loss clears held actions.
- Key repeat does not drive movement or menu actions.
- Movement vector remains normalized by player movement systems.
- Pointer-world aiming remains unchanged.
- Dynamic binding changes do not alter gameplay RNG.
- Input context counts remain stable through repeated Settings cycles.

Do not duplicate input ownership in individual scenes.

---

# Save-schema migration for controls

The Phase 9 save stores legacy string bindings such as:

```text
W
MOUSE_LEFT
SHIFT_OR_MOUSE_RIGHT
SPACE
ESC
```

Implement an explicit backward-compatible migration.

A schema-version bump is permitted and recommended if required by the new binding descriptor format.

If bumping to schema version 2:

- Back up the Phase 9 save first.
- Migrate schema 1 → schema 2 sequentially.
- Convert every known legacy binding deterministically.
- Preserve all Phase 9 progression, records, scores, cosmetics, settings, and tutorial state.
- Record migration outcome.
- Make migration idempotent.
- Import valid schema-1 Phase 9 saves.
- Import valid schema-2 saves.
- Reject unsupported future schema versions safely.
- Do not discard the current valid save after malformed import.

Legacy conversion requirements:

```text
W/S/A/D → KeyW/KeyS/KeyA/KeyD
MOUSE_LEFT → pointer button 0
SHIFT_OR_MOUSE_RIGHT → ShiftLeft + pointer button 2
SPACE → Space
ESC → Escape
ENTER → Enter where legacy internal data requires it
```

Imported binding normalization must:

- validate known actions
- validate devices
- validate codes/buttons
- remove duplicates
- enforce slot caps
- enforce conflict rules
- restore required missing defaults
- ignore unknown fields

Clear data must restore canonical default bindings.

---

# Settings completion

The complete Settings root must expose:

```text
Audio
Visual
Accessibility
Controls
Gameplay
Data
```

If Gameplay has no additional setting beyond difficulty/focus policy, include a concise truthful page rather than omitting the canonical category.

Required Settings behavior:

- Full keyboard navigation.
- Mouse navigation.
- Visible focus stronger than hover.
- Escape returns one level.
- Modal input capture cannot trap focus.
- Minimum viewport remains usable.
- Scroll or pagination is bounded.
- Settings apply immediately where canonical.
- Return to Pause restores Pause focus.
- Return to Main Menu restores Settings button focus where architecture supports it.
- No stale Phase 3/deferred-rebinding text.

---

# Accessibility conformance audit

Do not merely expose toggles. Verify that each setting affects every relevant production system.

## Screen shake

- 0% disables all gameplay and presentation camera shake.
- 100% remains capped.
- Player hit, elite, hazard, boss, destruction, Results, and tutorial effects obey it.
- No scene directly bypasses `CameraController` or equivalent authority.

## Reduced flashes

Must reduce or remove:

- hit flashes
- critical flashes
- elite pulses
- hazard activation flashes
- hostile-Echo activation
- boss phase flashes
- boss destruction flashes
- score/personal-best/unlock pulses
- tutorial completion flashes

Gameplay cues must remain readable through outline, geometry, text, or motion.

## Reduced particles

Must reduce bounded counts for:

- player/weapon effects
- Echo effects
- enemy destruction
- elites
- hazards
- boss
- score flyouts/decorations
- cosmetics
- tutorial success effects

Do not remove required telegraphs.

## High contrast

Must strengthen:

- player outline
- friendly/hostile Echo distinction
- projectiles
- enemy telegraphs
- elite overlays
- arena hazards
- boss core/panels
- sector boundaries
- tutorial markers/gates
- menu focus
- score/combo text
- locked/unlocked labels

## Damage numbers

- Toggle applies to all player/Echo damage-number presentation.
- Off means no hidden object creation for invisible numbers where avoidable.
- Score flyouts remain separately controlled presentation and do not masquerade as damage numbers.

## Aim line

- Toggle applies in tutorial, normal combat, elites, and boss.
- Turning it off does not disable aiming.

## HUD opacity

- Applies consistently to Run, Boss, Tutorial objective panel, and read-only HUD surfaces.
- Safe minimum remains readable.
- Boss health and critical danger indicators must not become unreadable.

## Pause on focus loss

- Enabled: focus loss pauses active Tutorial, Run, and Boss safely.
- Disabled: held actions are still neutralized to prevent stuck input.
- Menus do not incorrectly open nested Pause scenes.

## Persistent player locator

- Works in dense combat, boss, and tutorial.
- Does not obscure the player or threats.
- Friendly Echo locator remains distinct.

## Larger telegraph outlines

- Applies to enemy, elite, hazard, boss, hostile Echo, sector, panel, and tutorial telegraphs.
- Does not alter collision or safe-route calculations.

## Color-independent communication

Validate in grayscale or equivalent inspection:

- player versus friendly Echo
- friendly versus hostile Echo
- safe versus dangerous sectors
- vulnerable versus closed boss
- focused versus hovered menu item
- completed versus active tutorial marker
- locked versus unlocked Archive item

---

# Keyboard-only release flow

A keyboard-only user must be able to complete:

```text
Boot
→ Main Menu
→ First-run Tutorial
→ Pause/Settings
→ Rebind controls
→ Complete run
→ Upgrade selections
→ Recovery
→ Boss
→ Results
→ Unlock reveals
→ Archive
→ Statistics
→ Credits
→ Data clear confirmation
→ Return to menu
```

Gameplay still requires mouse aiming by canonical design; keyboard-only in this context means every menu and non-aiming UI operation is keyboard accessible.

Do not claim keyboard-only combat aiming.

---

# Production-facing copy cleanup

Audit every production-reachable scene and string.

Remove or replace stale wording such as:

```text
player prototype
echo prototype
foundation milestone
pre-boss run complete
boss handoff
Phase 3 uses...
interactive rebinding remains deferred
not implemented
```

Requirements:

- Main Menu uses release-candidate identity.
- Pause describes the actual current run.
- Tutorial explains only current mechanics.
- Credits describes the actual completed project.
- Results uses actual victory/defeat language.
- Archive and Statistics do not claim missing implemented systems.
- Settings contains no deferred-feature promise.
- HTML metadata describes the complete game.
- Web manifest name/description/version fields are coherent.
- Favicon and theme metadata resolve under root and project subpaths.
- README contains final controls, browser requirements, accessibility settings, local setup, deployment behavior, and save-data notes.

Internal legacy IDs may remain when renaming them risks regressions, but they must be documented and must not be user-visible.

---

# Credits scene

Replace foundation-era credits with a release-ready Credits scene.

Required content:

- game title and release version
- project author/creative direction placeholder as represented by existing project ownership
- architecture and implementation assistance attribution
- Phaser 3.90.0
- Vite
- Web Audio API
- procedural in-engine visual/audio asset statement
- license information
- no false external contributor or asset claims

Requirements:

- Full keyboard/mouse navigation.
- Scroll or pagination if needed.
- Escape/back works.
- Returning restores prior focus.
- No external network dependency.
- No unsupported legal claim.

Do not invent names not present in project files or user-provided metadata.

---

# Audio release hardening

Preserve `AudioManager` as sole owner.

Verify the complete required sound set:

1. Player shot
2. Friendly Echo shot
3. Standard hit
4. Critical hit
5. Dash
6. Echo deployment
7. Echo dissolution
8. Player damage
9. Enemy destruction
10. Elite destruction
11. Upgrade selection
12. Portal/signal gate opening
13. Menu navigation
14. Menu confirmation
15. Boss phase transition
16. Victory

Also verify distinct cues for hostile Echo and tutorial objective completion where already supported.

Requirements:

- One global AudioContext.
- No sound before a user gesture.
- Audio initialization failure continues muted.
- Procedural buffers are generated outside combat callbacks.
- Voice caps prevent dense event buildup.
- Player, friendly Echo, and hostile Echo remain distinguishable.
- Music states remain synchronized:
  - Calm
  - Combat
  - Pressure
  - Elite
  - Boss
  - Victory
  - Paused
- Crossfades do not duplicate layers.
- Restart does not duplicate music.
- Tutorial uses calm/tutorial-appropriate mix without adding a new required music composition.
- Volume/mute changes apply immediately.
- Focus loss and pause use the paused mix.
- Firefox and Chromium behavior are acceptable.

Do not add copyrighted external audio.

---

# Startup, preload, and fallback behavior

Harden Boot and Preload without adding network dependencies.

Requirements:

- Save loads before settings-dependent presentation.
- Corrupt primary save attempts backup recovery.
- Corrupt primary and backup fall back to defaults with a nonfatal notice.
- Texture generation occurs once before combat.
- Re-entering Main Menu does not repeat expensive preload work.
- Optional asset failure uses generated fallback.
- Required core-data failure opens controlled fatal presentation.
- Audio failure continues muted.
- Startup progress remains finite and honest.
- No white screen during normal startup.
- No raw stack trace in normal UI.
- No stale service-worker cache assumption.
- Production performs no required network request after static assets load.

---

# Fatal and recoverable error handling

Implement a controlled fatal screen or DOM-level fallback that still works if Phaser scene initialization is partially unavailable.

Fatal presentation must include:

- plain-language explanation
- stable error code
- Reload action
- Clear Local Data action where relevant
- no raw stack trace
- no sensitive environment information

Required fatal cases:

- Phaser initialization failure
- missing required core data
- unrecoverable migration contradiction

Required recoverable cases:

- invalid arena → safe fallback arena
- invalid encounter → safe fallback encounter
- corrupt save → backup/default
- audio failure → continue muted
- missing optional asset → generated fallback
- clipboard failure → display selectable seed/text manually
- pool warning → bounded cap/fallback behavior

Requirements:

- Global `error` and `unhandledrejection` handling must not convert expected/recovered errors into fatal screens.
- Fatal routing occurs once.
- Reload does not create duplicate listeners.
- Clear-data action requires strong confirmation when Phaser UI is available.
- Development builds may log diagnostics; production UI remains concise.

---

# Clipboard behavior

Seed and diagnostic copy actions must:

- use Clipboard API only after user action
- handle denied/unavailable permission
- show selectable fallback text
- never block Results, Statistics, or debug presentation
- never throw an uncaught promise rejection
- work under HTTPS GitHub Pages and local preview

---

# Browser and viewport support

Validate at minimum:

```text
Chromium current
Firefox current
```

Do not claim Safari validation unless actually run.

Required viewport matrix:

```text
1920 × 1080
1600 × 900
1366 × 768
1280 × 720
1024 × 576
```

Also test one below-minimum viewport to confirm the viewport notice appears and the game fails gracefully rather than changing world scale incorrectly.

Requirements:

- World coordinates remain deterministic across viewport sizes.
- Camera never rotates.
- UI safe margins hold.
- Tutorial objectives remain readable.
- Rebinding modal remains visible.
- Archive/Statistics/Settings remain navigable.
- Boss HUD and score/combo do not overlap.
- Resize does not duplicate scenes, listeners, or canvases.
- Device-pixel-ratio differences do not alter gameplay.
- Browser zoom at 100% is the authoritative QA target.

---

# Static hosting and GitHub Pages hardening

Preserve static hosting with no backend.

Required Vite base behavior:

```text
Root user site: /
Project site: /<repository>/
```

Validate both locally using static production output.

Required deployment checks:

- root base build
- project-subpath base build
- direct initial load
- hard refresh on root route
- private/incognito profile
- case-sensitive asset paths
- favicon
- manifest
- module imports
- no `/src/` production requests
- no localhost references
- no absolute-root asset breakage under subpath
- audio starts after gesture
- save persists after reload
- import/export works
- console clean

Review `.github/workflows/deploy.yml`.

The workflow must:

1. Check out source.
2. Install exact dependencies.
3. Use supported Node version.
4. calculate correct base path.
5. Run release validation appropriate for CI.
6. Build once for deployment.
7. Upload `dist`.
8. Deploy Pages artifact.

Do not require full 30-minute browser soaks inside GitHub Actions if impractical. CI must still run deterministic tests, lint, build, source audit, and release-safe static checks.

If an actual GitHub Pages URL is not available in the execution environment:

- mandatory local root/subpath deployment validation must pass
- document the actual deployed-URL check as a manual release gate
- label the artifact `release candidate`, not a confirmed public launch

Do not fabricate deployed-URL evidence.

---

# Privacy and security audit

Verify:

- no analytics
- no remote telemetry
- no personal-data collection
- no runtime gameplay API calls
- no `eval`
- no `new Function`
- no dynamic script injection
- no unsafe HTML insertion from imported save data
- imported JSON is validated before commit
- malformed import preserves current valid save
- clipboard use is permission-safe
- file import input is removed after use
- object URLs are revoked
- debug controls are inert in production
- production source does not expose a destructive hidden shortcut
- external links, if any, use safe attributes

Add a machine-readable security/source audit.

---

# Visual release polish

Follow `ART_DIRECTION.md` and preserve procedural production constraints.

Required polish areas:

- Main Menu low-intensity background.
- Consistent focus borders.
- Tutorial checkpoint hierarchy.
- Tutorial gate clarity.
- Shielded tutorial target front/rear readability.
- Player/friendly Echo distinction.
- Friendly/hostile Echo distinction.
- Maximum-intensity telegraph priority.
- Boss Phase 3 readability.
- Results and unlock hierarchy.
- Archive and Statistics spacing.
- Rebinding capture modal clarity.
- Fatal screen clarity.

Requirements:

- Telegraphs remain stronger than decoration.
- Color never carries danger alone.
- No unbounded full-screen alpha overlays.
- No repeated texture generation.
- No large complex Graphics paths recreated every frame.
- Final screenshots use final post-fix code.

Do not replace the procedural art direction with unrelated external art.

---

# Performance hardening

Canonical targets:

```text
Stable 60 FPS target
16.7 ms frame target
95th percentile normal-combat frame under 20 ms
No recurring spawn hitch over 50 ms
Compressed initial transfer under 15 MB
```

Canonical caps must remain enforced:

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
| Score events | Existing Phase 9 cap |

Release performance requirements:

- Tutorial startup is bounded.
- Tutorial markers are reused or bounded.
- Rebinding does not leak Phaser key objects.
- Settings does not recreate expensive previews repeatedly.
- Archive and Statistics remain bounded.
- Results counting uses bounded tweens.
- No listener/timer/audio-node accumulation.
- No recurring scene-start hitch over 50 ms without documented reason.
- Production bundle warnings are investigated and documented.
- Code splitting/manual chunks may be used if they improve delivery without breaking static paths.
- Do not change chunk-warning thresholds merely to hide a warning.

Measure:

- boot-to-menu time
- first tutorial startup time
- returning run startup time
- Settings startup time
- binding capture/commit time
- Archive startup time
- Statistics startup time
- Results startup time
- combat frame distribution
- boss frame distribution
- bundle raw/gzip size
- static transfer size
- memory trend
- input context count
- listener count
- AudioContext count

---

# Defect classification and release sign-off

Create:

```text
docs/PHASE10_DEFECT_REGISTER.md
docs/PHASE10_RELEASE_CHECKLIST.md
```

Classify defects using the canonical severity model.

Release-candidate gate:

```text
Critical defects: 0
High defects: 0
```

Every accepted Medium defect must include:

- description
- affected environment
- reproduction
- user impact
- workaround
- reason for acceptance
- planned disposition

Do not reclassify a failing release gate merely to ship.

Do not conceal browser-specific defects.

---

# Telemetry

Add local Phase 10 telemetry for:

- tutorial started
- tutorial entry source
- tutorial step entered
- tutorial step completed
- tutorial retry
- tutorial aborted
- tutorial completed
- tutorial completion duration
- tutorial invalid action reason
- binding capture opened
- binding accepted
- binding rejected and reason
- binding default restored
- binding migration result
- input context rebuild
- focus loss
- auto-pause
- held-action suppression
- settings changed
- audio initialization result
- fallback asset used
- save recovery result
- fatal error code
- clipboard fallback used
- viewport warning shown
- browser identity for local validation
- deployment base path
- scene startup timings
- release validation counts

No remote telemetry is allowed.

---

# Debug tools

Development-only controls should support:

- jump to each tutorial step with valid prerequisite state
- reset current tutorial step
- print tutorial snapshot
- show tutorial trigger zones
- show tutorial target arcs
- simulate invalid/out-of-order tutorial actions
- force tutorial completion in debug memory only
- print current bindings
- simulate key binding capture
- simulate pointer binding capture
- inject binding conflict
- restore default bindings
- print input contexts and registered keys
- force audio initialization failure
- force optional asset fallback
- force save-primary corruption in isolated test storage
- force fatal error code in development
- show viewport safe areas
- dump accessibility settings
- capture release diagnostics

Debug controls must:

- be unavailable or inert in production mode
- not complete tutorial persistently unless explicit test storage is used
- not mutate score, progression, personal bests, or unlocks
- not contaminate gameplay RNG
- use normal cleanup ownership
- not bypass input conflict validation
- not duplicate listeners or save writes

---

# Existing architecture ownership to preserve

Preserve all Phase 9 authorities, including:

- `DamageService`
- `EnemyManager`
- `EliteManager`
- `EnemyProjectileManager`
- `BossProjectileManager`
- `CarrierShardManager`
- `EchoRecorder`
- `EchoPlaybackSystem`
- `EchoProjectileManager`
- `HostileEchoManager`
- `NullArchitectController`
- `BossSectorManager`
- `ArenaManager`
- `RunProgressionController`
- `ScoreManager`
- `ScoreEventLedger`
- `ComboController`
- `RunFinalizationService`
- `ProgressionManager`
- `AggregateStatisticsManager`
- `PersonalBestManager`
- `RunScene`
- `BossScene`
- `HUDScene`
- `SceneFlowController`
- `CollisionManager`
- `CleanupRegistry`
- `AudioManager`
- `SaveManager`

Add tutorial and rebinding ownership without moving unrelated logic into scenes.

Do not merge tutorial state with run progression.

Do not let Settings own input interpretation.

Do not let `InputManager` own persistence directly; it consumes validated settings.

---

# Transition and cleanup requirements

Every Tutorial entry, Tutorial restart, Tutorial completion, Tutorial abort, Settings open/close, binding capture open/close, Pause resume, focus loss, browser visibility change, fatal simulation, Credits exit, Archive replay exit, run restart, Results exit, and Main Menu return must explicitly clean or reset:

- tutorial timers
- tutorial delayed calls
- tutorial tweens
- tutorial markers
- tutorial target bodies
- tutorial dash-gate overlap
- tutorial shield target
- tutorial Echoes
- tutorial projectiles
- tutorial recorder buffers
- tutorial HUD state
- tutorial hints
- binding-capture listeners
- temporary DOM inputs
- temporary object URLs
- key objects replaced during binding refresh
- pointer capture state
- held-input blocks
- focus contexts
- settings listeners
- scene event subscriptions
- confirmation modals
- audio loops
- camera effects
- debug overlays
- cleanup-registry ownership

Cleanup must be idempotent and safe during Phaser shutdown order.

No tutorial object may survive into Combat 1, Archive, Main Menu, or Results.

No binding-capture listener may survive after the modal closes.

No old binding context may remain active after a binding refresh.

---

# Tests

Retain all Phase 1–9 tests.

Expected retained baseline:

```text
923 tests
```

Do not delete, skip, rename away, or weaken existing tests to make Phase 10 pass.

Add substantial meaningful coverage. Target at least:

```text
1,100 total automated tests
```

Test quality takes priority over count.

## Tutorial model

- initial state
- exact step order
- each step advances once
- out-of-order action rejection
- duplicate-event rejection
- player-only checkpoints
- Echo checkpoint exclusion
- real player damage target
- Echo target exclusion in Step 2
- dash-state requirement
- walking through dash gate rejected
- recording duration requirement
- path checkpoint requirement
- fire-event requirement
- invalid recording retry
- friendly-Echo rear hit requirement
- player rear hit rejected for Echo objective
- frontal Echo hit rejected
- completion once
- abort does not complete
- restart resets
- pause freezes
- replay return route
- first-run transition route
- no scoring
- no progression
- no recent-run record

## Tutorial arena

- finite bounds
- safe spawn
- marker positions valid
- target sockets valid
- dash lane clear
- recording path clear
- shield target route valid
- final gate valid
- minimum route width
- no overlap with walls
- no normal arena-pool registration

## Tutorial persistence

- fresh default false
- first completion true
- duplicate completion no-op
- reload preservation
- import/export
- clear-data reset
- Phase 9 save migration
- aborted tutorial no write
- replay idempotence

## Binding descriptors

- keyboard descriptor validation
- pointer descriptor validation
- stable labels
- maximum slot count
- duplicate removal
- unknown device rejection
- unknown code rejection
- unsupported button rejection
- required action fallback
- immutable snapshots

## Binding conflicts

- opposite movement conflict
- movement/action conflict
- fire/dash pointer conflict
- duplicate same-action binding
- reserved input rejection
- valid Shift dash
- Escape capture cancel
- restore default repair
- invalid import repair/rejection

## Binding migration

- every legacy Phase 9 string
- `SHIFT_OR_MOUSE_RIGHT` conversion
- missing bindings
- partial bindings
- schema 1 → schema 2
- migration backup
- migration idempotence
- future schema rejection
- all Phase 9 progression preserved
- recent runs preserved
- personal bests preserved
- cosmetics preserved

## Input runtime

- context uses saved bindings
- new context after rebind
- active context safe refresh
- no duplicate keys
- no duplicate listeners
- key repeat ignored
- pointer pressed/released
- context menu scope
- focus loss suppression
- visibility suppression
- held action neutralization
- movement vector
- pointer aiming unchanged
- pause safety fallback

## Settings UI models

- all six categories
- controls list
- primary/secondary slot
- capture modal
- cancel
- invalid rejection
- restore defaults
- focus restoration
- keyboard navigation
- minimum viewport
- return to Pause
- return to Main Menu

## Accessibility

- zero shake
- capped full shake
- reduced flashes across scene categories
- reduced particles across scene categories
- high-contrast metadata
- damage-number toggle
- aim-line toggle
- HUD-opacity clamp
- focus-loss setting
- persistent locator
- larger outlines
- color-independent presentation metadata
- settings immediate application
- no gameplay RNG effect
- no collision effect

## Audio

- one AudioContext
- no startup before gesture
- mute-on-failure
- required cue catalog
- voice caps
- music-state transition
- pause mix
- no restart duplication
- settings immediate apply
- scene cleanup

## Error handling

- save backup recovery
- default recovery
- optional asset fallback
- clipboard rejection fallback
- fatal error once
- fatal error code
- no raw stack in UI model
- reload action
- clear-data action
- recovered error not fatal
- production/development logging distinction

## Production copy and metadata

- no user-visible prototype strings
- no user-visible boss-handoff strings
- correct version
- correct HTML description
- valid manifest paths
- valid favicon path
- Credits content contract
- README required sections

## Deployment

- root base normalization
- project base normalization
- static asset URLs
- no `/src/` production request
- no localhost references
- case-sensitive path audit
- workflow validation steps
- canonical files included

## Lifecycle

- repeated first-run tutorial
- repeated tutorial replay
- repeated tutorial restart
- repeated Settings open/close
- repeated binding capture cancel
- repeated successful rebinding
- repeated restore defaults
- repeated Pause/Settings/resume
- repeated Credits
- repeated Archive tutorial replay
- repeated focus loss
- repeated resize
- no input-context growth
- no listener growth
- no timer/tween growth
- no AudioContext growth
- no tutorial object leak

---

# Required validation commands

Run:

```text
npm ci
npm run lint
npm run test
npm run build
npm run validate
npm run audit:score
npm run audit:combo
npm run audit:progression
npm run audit:statistics
npm run audit:source
npm audit
```

Add real Phase 10 scripts such as:

```text
npm run audit:tutorial
npm run audit:bindings
npm run audit:accessibility
npm run audit:release
npm run validate:browser:phase10
npm run validate:browser:firefox:phase10
npm run validate:deployment:phase10
npm run validate:lifecycle:phase10
npm run validate:idle:phase10
npm run validate:soak:phase10
npm run validate:performance:phase10
```

Do not add scripts that merely print planned results.

Every report must derive from actual execution.

---

# Tutorial audit

Generate at least:

```text
10,000 tutorial action timelines
```

Include:

- valid completion
- out-of-order movement
- Echo entering player checkpoint
- firing before movement completion
- walking through dash gate
- dashing in wrong direction
- insufficient path history
- insufficient fire events
- invalid Echo path
- frontal Echo attack
- player rear attack
- valid Echo rear attack
- pause/resume
- restart
- abort
- replay
- duplicate completion events

Report:

- incorrect step advancement
- skipped required step
- duplicate completion
- false player/Echo ownership acceptance
- soft-lock state
- non-finite progress
- timer advancement during pause
- score/progression mutation
- deterministic mismatch

Every hard-failure count must be zero.

---

# Binding audit

Generate at least:

```text
25,000 binding normalization, conflict, migration, and capture cases
```

Cover:

- every supported keyboard code used by defaults
- every supported pointer button
- duplicate slots
- unknown device
- unknown code
- malformed arrays
- excessive slots
- required missing action
- movement conflicts
- fire/dash conflicts
- reserved inputs
- schema-1 legacy strings
- valid schema-2 data
- malformed imports
- repeated save round trips

Report:

- invalid binding accepted
- valid binding rejected
- conflict missed
- required action missing
- migration mismatch
- round-trip mismatch
- duplicate descriptor
- non-serializable value
- unbounded binding list
- input-context leak simulation

Every hard-failure count must be zero.

---

# Accessibility audit

Create a deterministic source/data audit plus browser matrix.

At minimum validate every accessibility/visual setting at:

```text
Default
Minimum/disabled
Maximum/enabled
Relevant combined presets
```

Required combined presets:

1. Default
2. No shake + reduced flashes + reduced particles
3. High contrast + larger outlines + persistent locator
4. Damage numbers off + aim line off + minimum HUD opacity
5. All accessibility aids enabled

Exercise:

- tutorial
- early combat
- elite combat
- hazard arena
- boss Phase 2
- boss Phase 3
- Results
- Archive
- Statistics
- Settings

Report:

- setting ignored
- direct bypass of authority
- gameplay RNG difference
- collision difference
- missing shape/text alternative
- unreadable minimum-viewport state
- focus visibility failure
- non-finite visual value

Every gameplay-integrity hard failure must be zero.

---

# Release source audit

Audit:

- missing imports
- dependency cycles
- stale phase/version strings
- production-reachable prototype wording
- duplicate authorities
- `Math.random()` in gameplay
- `eval`/`new Function`
- dynamic script insertion
- network requests
- localhost references
- absolute-root asset references
- canonical-document hashes
- debug production exposure
- unknown save schema access
- unbounded arrays/sets in new Phase 10 systems
- direct audio context construction outside `AudioManager`
- direct key registration outside input ownership where inappropriate

Produce structured findings with severity.

---

# Chromium browser validation

Use a fresh Chromium profile or disabled stale cache.

Required primary flow:

```text
Fresh save
→ Main Menu
→ Start Run
→ Complete all six tutorial lessons
→ Combat 1
→ Complete full Standard run
→ Null Architect
→ Results
→ Main Menu
→ Start second run without tutorial
```

Required focused checks:

## Tutorial

- fresh-save entry
- movement checkpoints
- stationary target
- dash gate
- recording path
- invalid recording retry
- Echo rear attack
- final gate
- completion persistence
- second-run bypass
- Archive replay
- replay return
- pause
- restart
- focus loss
- resize
- no score/combo
- no run record

## Rebinding

- rebind movement key
- rebind fire to a supported alternate
- rebind dash primary
- preserve dash secondary
- rebind Echo
- conflict rejection
- Escape capture cancel
- clear optional secondary
- restore defaults
- immediate gameplay application
- reload persistence
- import/export preservation
- malformed binding import rejection/repair

## Accessibility

- all combined presets
- tutorial readability
- maximum combat readability
- boss Phase 3 readability
- Results/Archive/Statistics focus

## Complete regression

- Relaxed run
- Standard run
- Overclocked run
- scoring
- progression
- boss
- victory
- defeat
- restart
- menu return

## Production behavior

- audio after gesture
- one AudioContext
- clipboard fallback
- corrupt-save recovery in isolated storage
- fatal-screen test hook in development build only
- Credits
- metadata/title
- no stale wording

Record:

- browser exceptions
- console errors
- console warnings
- tutorial state
- tutorial completion writes
- current bindings
- input context count
- listeners
- cleanup ownership
- active scenes
- AudioContext count
- score/result integrity
- save write count

Require zero browser exceptions and zero console errors.

Warnings must be individually explained.

---

# Firefox browser validation

Run a real Firefox production-build validation.

At minimum validate:

- boot and preload
- audio gesture startup
- Main Menu navigation
- first-run tutorial
- pointer aim/fire
- right-click dash/context suppression
- keyboard dash
- Echo deployment
- pause/focus behavior
- Settings
- rebinding
- complete controlled combat segment
- boss controlled entry
- Results
- Archive
- Statistics
- import/export
- root/subpath assets
- resize
- shutdown/restart

Require zero uncaught exceptions and zero console errors.

Document any browser API difference, especially:

- Web Audio resume
- pointer buttons
- KeyboardEvent codes
- clipboard permissions
- file input behavior
- visibility/focus events

Do not substitute a user-agent string change in Chromium for real Firefox.

---

# Deployment validation

Create a real static validation harness.

Test at least:

```text
Base /
Base /echoframe-test/
```

For each:

1. Build production output.
2. Serve only `dist` from a static server.
3. Open exact base URL.
4. Verify all requested assets return successful responses.
5. Hard refresh.
6. Reload after save creation.
7. Verify no development-server dependency.
8. Verify no source-module request.
9. Verify favicon and manifest.
10. Verify menu, tutorial, and one gameplay entry.

Report:

- failed requests
- incorrect MIME types
- root-path assumptions
- missing assets
- console errors
- manifest/favicons
- base-path mismatch
- localhost reference

Every hard failure must be zero.

---

# Lifecycle validation

Run at least:

```text
60 complete Phase 10 lifecycle cycles
```

Cover:

- 10 fresh-save tutorial completions in isolated storage
- 10 tutorial abort/restart/replay cycles
- 10 controls-rebinding cycles
- 10 Settings/Pause/focus cycles
- 10 full or accelerated valid run cycles
- 10 Archive/Statistics/Credits/data cycles

At least 10 cycles must traverse:

```text
Fresh save → Tutorial → complete full run → Results
```

Use all three difficulties after tutorial completion where valid.

Verify no growth in:

- event listeners
- cleanup-registry ownership
- input contexts
- Phaser key objects
- pointer listeners
- scene instances
- colliders
- timers
- tweens
- delayed calls
- tutorial entities
- tutorial markers
- tutorial target bodies
- Echoes/projectiles
- modal objects
- DOM file inputs
- object URLs
- AudioContexts

Require:

- zero browser exceptions
- zero console errors
- exact tutorial completion persistence
- no run-local score leakage
- no duplicate runs-started update from tutorial
- no duplicate save transaction

---

# Menu idle validation

Run at least:

```text
30 minutes of real browser menu/UI idle time
```

The idle test must include periodic:

- Main Menu idle
- Archive open/close
- Statistics open/close
- Settings open/close
- Credits open/close
- Controls capture cancel
- viewport resize
- focus loss/return
- audio mute/unmute

Report:

- actual wall-clock duration
- runtime sample count
- FPS/frame time
- heap/process memory trend where available
- listeners start/end
- input contexts start/end
- scenes start/end
- timers/tweens start/end
- AudioContexts start/end
- audio nodes where measurable
- warnings/errors

Hard requirements:

```text
No unbounded growth
Zero exceptions
Zero console errors
One AudioContext maximum
```

---

# Active soak validation

Run at least:

```text
30 minutes of real active Chromium gameplay
```

The soak must include:

- repeated tutorial sessions
- normal runs
- elite segments
- hazards
- upgrades
- friendly Echoes
- hostile Echoes
- boss phases
- scoring/combo
- Results
- Archive/Statistics
- controls rebinding
- pause/resume
- focus loss
- resize
- restart
- menu return
- accessibility preset changes at safe boundaries
- pool-cap stress
- force-clear cleanup

Report:

- actual wall-clock duration
- runtime sample count
- average FPS
- minimum FPS
- 95th-percentile frame time
- maximum spawn hitch
- heap/process memory trend
- peak pools
- active listeners
- cleanup ownership
- input contexts
- AudioContexts
- tutorial completions
- runs completed
- victories/defeats
- rebind operations
- settings operations
- warnings/errors

Do not weaken evidence gates.

If a harness defect occurs, fix the harness and rerun the full duration.

If a gameplay defect occurs, fix the game, add a regression test, and rerun affected validation.

---

# Performance validation

Measure final production build in real browsers.

Required outputs:

- boot-to-menu timing
- first tutorial startup timing
- repeat tutorial startup timing
- Combat 1 startup timing
- boss startup timing
- Settings startup timing
- Archive startup timing
- Statistics startup timing
- Results startup timing
- binding validation timing
- binding context rebuild timing
- save migration timing
- save serialization size
- raw bundle size
- gzip bundle size
- total `dist` size
- largest asset/chunk
- normal combat frame distribution
- maximum combat frame
- boss frame distribution
- tutorial frame distribution
- maximum input contexts
- maximum listeners
- maximum AudioContexts

Compare against Phase 9.

Do not claim optimization without measurements or source evidence.

---

# Documentation

Update:

- `README.md`
- `docs/FILE_MANIFEST.md`
- `docs/CURRENT_STATE.md`
- `docs/CHANGELOG.md`
- `docs/IMPLEMENTATION_NOTES.md`
- `docs/VALIDATION_REPORT.md`
- `docs/PHASE10_RECOVERY_REPORT.md`
- `docs/PHASE10_CANONICAL_EXTRACTION.md`
- `docs/PHASE10_DEFECT_REGISTER.md`
- `docs/PHASE10_RELEASE_CHECKLIST.md`

Add machine-readable evidence such as:

- `docs/PHASE10_TUTORIAL_AUDIT.json`
- `docs/PHASE10_BINDING_AUDIT.json`
- `docs/PHASE10_ACCESSIBILITY_AUDIT.json`
- `docs/PHASE10_RELEASE_AUDIT.json`
- `docs/PHASE10_BROWSER_CHROMIUM_VALIDATION.json`
- `docs/PHASE10_BROWSER_FIREFOX_VALIDATION.json`
- `docs/PHASE10_DEPLOYMENT_VALIDATION.json`
- `docs/PHASE10_LIFECYCLE_VALIDATION.json`
- `docs/PHASE10_MENU_IDLE_VALIDATION.json`
- `docs/PHASE10_ACTIVE_SOAK_VALIDATION.json`
- `docs/PHASE10_PERFORMANCE_VALIDATION.json`
- `docs/PHASE10_SOURCE_AUDIT.json`
- `docs/PHASE10_SECURITY_AUDIT.json`
- `docs/PHASE10_NPM_AUDIT.json`
- `docs/PHASE10_RELEASE_SIGNOFF.json`

Record exact completed results, not intended work.

Explicitly document remaining Version 1.0 boundaries:

- no mobile controls
- no gamepad controls
- no localization
- no online services
- no cloud saves
- no leaderboards
- no multiple bosses
- no endless mode
- no permanent combat power
- procedural visual/audio production assets
- any accepted Medium defects
- any unavailable actual deployed-URL check
- untested browsers or physical devices
- any `PLAYTEST` tutorial thresholds
- any `PLAYTEST` binding data format/conflict matrix

Remove stale claims that tutorial or rebinding is deferred.

---

# Screenshots

Produce at least ten final screenshots from the validated build:

1. `ECHOFRAME_phase10_main_menu.png`
   - release-candidate identity
   - complete menu
   - readable default focus

2. `ECHOFRAME_phase10_tutorial_movement.png`
   - authored tutorial arena
   - player
   - ordered movement checkpoints
   - objective HUD

3. `ECHOFRAME_phase10_tutorial_echo.png`
   - recorded path context
   - friendly Echo
   - shielded rear-vulnerable target
   - readable success setup

4. `ECHOFRAME_phase10_controls_rebinding.png`
   - complete Controls page
   - primary/secondary bindings
   - capture or conflict feedback

5. `ECHOFRAME_phase10_accessibility.png`
   - complete Accessibility page
   - readable focus and settings

6. `ECHOFRAME_phase10_full_combat.png`
   - representative late combat
   - score/combo
   - friendly Echo
   - readable telegraphs

7. `ECHOFRAME_phase10_boss_phase3.png`
   - Null Architect Delete phase
   - sector/panel readability
   - full release HUD

8. `ECHOFRAME_phase10_results.png`
   - final score
   - personal best
   - unlocks
   - complete navigation

9. `ECHOFRAME_phase10_credits.png`
   - release-ready Credits presentation

10. `ECHOFRAME_phase10_fatal_screen.png`
    - controlled development-triggered fatal presentation
    - error code
    - reload/clear-data options
    - no raw stack trace

Optional:

11. `ECHOFRAME_phase10_firefox.png`
12. `ECHOFRAME_phase10_deployment_subpath.png`
13. `ECHOFRAME_phase10_release_debug.png`

Screenshots must correspond to final post-fix code.

Do not include stale screenshots as Phase 10 evidence.

---

# Packaging

Create:

```text
ECHOFRAME_phase10_release_candidate.zip
```

The ZIP must:

- contain repository-root contents directly
- include canonical documents unchanged
- include complete Phase 10 documentation
- include final Phase 10 screenshots
- include updated `package-lock.json`
- include actual validation evidence
- include GitHub Pages workflow
- include public metadata/assets
- exclude `node_modules`
- exclude `dist`
- exclude Git metadata
- exclude temporary browser profiles
- exclude temporary test servers
- exclude temporary validation logs not referenced by documentation
- exclude previous release ZIP files
- exclude duplicate/stale screenshots
- pass clean extraction
- pass `npm ci`
- pass full validation
- pass Phase 10 audits
- pass `npm audit`

After creating the ZIP:

1. Extract it into a new clean directory.
2. Compute canonical-document hashes.
3. Run the full validation pipeline from the extracted copy.
4. Run tutorial, binding, accessibility, release, source, and security audits.
5. Run root/subpath deployment validation.
6. Run at least the bounded Chromium release smoke from the extracted copy.
7. Confirm Firefox evidence corresponds to the same source commit/archive content.
8. Record the release ZIP SHA-256.
9. Record archive file count.
10. Record archive size.
11. Record excluded directories.
12. Do not claim completion unless the extracted release passes.

---

# Completion criteria

Phase 10 is complete only when all of the following are true:

- All Phase 1–9 behavior remains functional.
- All 923 prior tests pass.
- Fresh save enters a real playable tutorial.
- The tutorial contains all six canonical lessons.
- Tutorial checks real player/Echo behavior.
- Echoes cannot complete player-only triggers.
- Out-of-order tutorial actions cannot soft-lock or skip steps.
- Tutorial completion persists once.
- Returning Start Run bypasses the tutorial.
- Archive replay works without creating a scored run.
- Tutorial grants no score, records, unlocks, or permanent power.
- Saved bindings drive actual runtime input.
- Keyboard and pointer rebinding works.
- Conflicts are rejected.
- Restore Defaults works.
- Rebinding applies without listener/key leaks.
- Valid Phase 9 saves migrate without data loss.
- Import/export preserves Phase 10 bindings and tutorial state.
- Clear data resets tutorial and controls.
- Every accessibility setting is functionally connected.
- Full menu flow is keyboard navigable.
- Production-facing prototype/deferred wording is removed.
- Credits is release-ready and truthful.
- Audio obeys one-context and user-gesture rules.
- Recoverable failures degrade safely.
- Fatal failures show controlled UI.
- Chromium validation passes.
- Firefox validation passes.
- Root and project-subpath static deployment pass.
- Performance budgets pass or any accepted Medium deviation is documented.
- 30-minute menu idle passes.
- 30-minute active soak passes.
- Lifecycle validation passes.
- Security/privacy audit passes.
- Critical defects equal zero.
- High defects equal zero.
- Canonical documents remain unchanged.
- Clean extracted ZIP validation passes.

Do not report planned validation as completed validation.

Do not conceal failed checks.

If an actual deployed GitHub Pages URL cannot be tested, state that precisely and keep the build labeled as a release candidate rather than a confirmed public launch.

If another requirement cannot be completed, state it precisely and do not mark Phase 10 complete.

---

# Final output

Return:

- recovery summary
- implementation summary
- canonical extraction summary
- tutorial architecture summary
- tutorial route summary
- input-rebinding architecture summary
- save-migration summary
- Settings summary
- accessibility summary
- audio summary
- error-handling summary
- production-copy cleanup summary
- browser matrix summary
- deployment summary
- exact test total
- retained-test total
- lint result
- build result
- source-audit result
- security-audit result
- npm-audit result
- tutorial-audit results
- binding-audit results
- accessibility-audit results
- release-audit results
- Chromium browser results
- Firefox browser results
- deployment-validation results
- lifecycle results
- menu-idle results
- active-soak results
- performance results
- defect totals by severity
- accepted limitations
- screenshot links
- validation-report link
- canonical-extraction link
- recovery-report link
- defect-register link
- release-checklist link
- manifest link
- final ZIP link
- SHA-256 hash

Stop after Phase 10.

Do not continue into mobile controls, gamepad controls, localization, online systems, new content, post-release modes, or a public-launch claim unsupported by deployed-URL evidence.
