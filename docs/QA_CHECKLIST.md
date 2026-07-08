# ECHOFRAME: LAST SIGNAL — Quality Assurance Checklist

**Document:** `QA_CHECKLIST.md`  
**Version:** 1.0-preproduction  
**Purpose:** Release gates, functional tests, regression tests, performance tests, deterministic-generation tests, accessibility tests, browser coverage, and deployment verification

---

# 1. QA principles

- Test the production build, not only the development server.
- Every defect records expected behavior, actual behavior, reproduction, environment, severity, and evidence.
- Every fixed defect receives a regression test.
- Features do not pass milestones until exit criteria are met.
- Restart, pause, scene shutdown, and focus loss are tested continuously.
- Deterministic systems use fixed-seed tests.
- Visual quality is evaluated at intended maximum intensity.
- “Works” requires a reproducible test.

---

# 2. Severity

## Critical

- Game cannot load or start.
- Save corruption causes repeated failure.
- Run cannot be completed.
- Core state corruption.
- Infinite loop, hard lock, or crash.
- GitHub Pages build unusable.
- Echo broadly fails.

## High

- Major system broken.
- Frequent unfair damage.
- Restart duplicates systems.
- Severe recurring frame hitch.
- Boss phase cannot complete.
- Upgrade creates invalid state.
- Controls/settings prevent play.
- Runaway audio or resource growth.

## Medium

- Noticeable non-blocking gameplay defect.
- Wrong value or description.
- Rare generation fallback.
- UI navigation inconsistency.
- Minor performance spike.
- Uncommon visual ambiguity.

## Low

- Cosmetic alignment.
- Minor audio mismatch.
- Typographic inconsistency.
- Non-critical polish issue.

Release gate:

- 0 Critical.
- 0 High.
- Medium issues only if documented and accepted.
- Low issues cannot damage readability or trust.

---

# 3. Test environments

## 3.1 Browsers

Required:

- Current Chrome desktop.
- Current Firefox desktop.
- Current Edge desktop.

Secondary where available:

- Another Chromium browser.
- Safari desktop as non-blocking compatibility information.

## 3.2 Operating systems

Primary:

- Windows 10/11.

Secondary:

- macOS or Linux where available.

## 3.3 Viewports

- 1920×1080.
- 1600×900.
- 1366×768.
- 1280×720.
- 1024×576.
- High-DPI display.
- Live resize from large to minimum.

## 3.4 Hardware

- Dedicated GPU system.
- Integrated graphics laptop.
- Older lower-power laptop if available.

---

# 4. Build verification

## 4.1 Development

- [ ] Clean dependency install succeeds.
- [ ] Development server starts.
- [ ] No missing modules.
- [ ] No console errors on load.
- [ ] Debug mode activates only intentionally.

## 4.2 Production

- [ ] Vite build succeeds.
- [ ] `dist` contains required files.
- [ ] Local preview loads.
- [ ] No dev-only UI.
- [ ] No localhost references.
- [ ] No invalid root-relative paths.
- [ ] Bundle meets transfer target.

## 4.3 GitHub Pages

- [ ] Workflow succeeds.
- [ ] Deployed root loads.
- [ ] Hard refresh loads.
- [ ] Private window loads.
- [ ] Case-sensitive asset paths work.
- [ ] Audio starts after gesture.
- [ ] Save persists.
- [ ] Console is clean.
- [ ] Repository base path is correct.
- [ ] No failed backend requests.

---

# 5. Smoke test

Run after every significant change:

1. [ ] Load menu.
2. [ ] Start Standard.
3. [ ] Move.
4. [ ] Aim/fire.
5. [ ] Dash.
6. [ ] Wait for recording.
7. [ ] Deploy Echo.
8. [ ] Kill enemy.
9. [ ] Pause.
10. [ ] Resume.
11. [ ] Complete/debug-complete chamber.
12. [ ] Select upgrade.
13. [ ] Trigger defeat.
14. [ ] Open results.
15. [ ] Restart.
16. [ ] Return to menu.
17. [ ] Verify no duplicate audio, input, enemies, or HUD.

---

# 6. Boot and preload

- [ ] Boot initializes once.
- [ ] Defaults load without save.
- [ ] Valid save loads.
- [ ] Corrupt primary attempts backup.
- [ ] Corrupt primary and backup produce defaults with notice.
- [ ] Procedural textures exist before use.
- [ ] Audio resources obey browser gesture rule.
- [ ] Missing optional asset uses fallback.
- [ ] Missing required data shows controlled fatal screen.
- [ ] Progress display remains valid.
- [ ] Returning to menu does not redo expensive preload.

---

# 7. Main menu

- [ ] Start Run has default focus.
- [ ] Arrow navigation.
- [ ] Mouse hover.
- [ ] Keyboard focus distinct from hover.
- [ ] Enter confirms.
- [ ] Escape returns.
- [ ] Difficulty persists.
- [ ] Locked difficulty shows requirement.
- [ ] Settings persist.
- [ ] Archive opens/closes.
- [ ] Statistics opens/closes.
- [ ] Credits opens/closes.
- [ ] Background remains low intensity.
- [ ] Audio starts only after gesture.
- [ ] Re-entry does not duplicate music.

---

# 8. Tutorial

- [ ] Fresh save enters tutorial.
- [ ] Returning player can skip.
- [ ] Archive can replay.
- [ ] Movement goals require real player.
- [ ] Target receives player damage.
- [ ] Dash gate recognizes dash.
- [ ] Echo step requires correct replay behavior.
- [ ] Echo cannot complete player-only trigger.
- [ ] Out-of-order actions cannot soft-lock.
- [ ] Pause/resume.
- [ ] Restart resets tutorial.
- [ ] Completion persists.

---

# 9. Input

## 9.1 Gameplay

- [ ] WASD.
- [ ] Diagonal normalization.
- [ ] Mouse aim.
- [ ] Left hold fire.
- [ ] Right-mouse dash.
- [ ] Shift dash.
- [ ] Space Echo.
- [ ] Escape pause.
- [ ] Held keys at scene start do not trigger unintended action.
- [ ] Held actions across resume are neutralized appropriately.
- [ ] Context menu suppressed over canvas only.
- [ ] Browser shortcuts remain available.

## 9.2 Rebinding

- [ ] All gameplay actions can rebind.
- [ ] Conflicts detected.
- [ ] Defaults restore.
- [ ] Invalid/reserved key handled clearly.
- [ ] Bindings persist.
- [ ] Mouse buttons display correctly.

## 9.3 Focus loss

- [ ] Default auto-pause.
- [ ] Return does not auto-resume.
- [ ] Input state cleared.
- [ ] Audio pauses/mixes correctly.
- [ ] Disabled auto-pause setting works.

---

# 10. Player movement

- [ ] Cardinal and diagonal speed equal.
- [ ] Acceleration matches target.
- [ ] Deceleration matches target.
- [ ] Arena containment.
- [ ] Solid collision.
- [ ] Decoration non-collision.
- [ ] No corner sticking.
- [ ] Crowd does not permanently pin.
- [ ] Separation does not push through walls.
- [ ] Low-FPS movement remains stable.
- [ ] High-FPS movement remains stable.
- [ ] Resize does not change world scale.

---

# 11. Dash

- [ ] Uses movement direction.
- [ ] Uses aim direction without movement.
- [ ] Direction locks.
- [ ] Stops at walls.
- [ ] Ignores enemy body.
- [ ] Invulnerability blocks valid damage.
- [ ] Damage resumes afterward.
- [ ] Cooldown start correct.
- [ ] Input buffer limited to final window.
- [ ] Repeated input does not double-consume.
- [ ] Pause freezes dash.
- [ ] Restart clears dash.
- [ ] Vector Reversal cannot chain.
- [ ] Dash Wake hits once per target.
- [ ] Shake setting scales effect.

---

# 12. Weapon

- [ ] Immediate first shot.
- [ ] Held interval correct.
- [ ] Direction matches aim.
- [ ] Dead-zone behavior stable.
- [ ] Lifetime expires.
- [ ] World-exit cleanup.
- [ ] Enemy collision.
- [ ] Wall collision.
- [ ] Critical state correct.
- [ ] Projectile pool reuse.
- [ ] Deactivation clears state.
- [ ] No unintended duplicate target hit.
- [ ] No fire during pause.
- [ ] Restart clears projectiles.

---

# 13. Echo recorder and playback

## 13.1 Recording

- [ ] Records only active gameplay.
- [ ] Average sample frequency is 30 Hz.
- [ ] Buffer wraps correctly.
- [ ] Timestamps ordered.
- [ ] Pause stops recording.
- [ ] Focus pause stops recording.
- [ ] Restart clears.
- [ ] Transition behavior correct.
- [ ] Severe hitch does not create unbounded samples.

## 13.2 Deployment

- [ ] Disabled before sufficient history.
- [ ] HUD shows progress.
- [ ] Valid press deploys once.
- [ ] Cooldown consumed once.
- [ ] Active cap enforced.
- [ ] Held Space does not repeat.
- [ ] Disabled during transition/death.
- [ ] Frozen loadout captured.

## 13.3 Playback

- [ ] Starts at correct historical position.
- [ ] Follows path.
- [ ] Aim interpolates.
- [ ] Fire timing within ±20 ms under stable conditions.
- [ ] Dash events replay.
- [ ] Wall changes do not trap.
- [ ] No physical collision.
- [ ] Cannot trigger player-only objects.
- [ ] Echo projectile damage.
- [ ] Separate statistics.
- [ ] Pause freezes.
- [ ] Resume has no drift.
- [ ] Dissolve returns to pool.
- [ ] Thirty deployments remain synchronized.

## 13.4 Upgrade interaction

- [ ] Extended Memory expands history.
- [ ] Twin Recall delay.
- [ ] Secondary scalar.
- [ ] Stable Projection cap.
- [ ] Resonant Damage cooldown.
- [ ] Phantom Shield capacity.
- [ ] Memory Burst once.
- [ ] Active Echo not mutated by later upgrade.
- [ ] Echo Dash Wake uses frozen state.

---

# 14. Common enemy tests

For every enemy:

- [ ] Spawn animation.
- [ ] No spawn damage.
- [ ] Attack lockout.
- [ ] Correct health.
- [ ] Correct score.
- [ ] Correct threat.
- [ ] Pause freezes AI/timers.
- [ ] Death cancels attack.
- [ ] Death returns to pool.
- [ ] Restart removes.
- [ ] Off-screen indication where required.
- [ ] Difficulty multiplier applied once.
- [ ] Elite modifier applied once.
- [ ] Hit/death feedback readable.
- [ ] Hitbox matches intent.
- [ ] No listener leak.

---

# 15. Drifter

- [ ] Pursuit.
- [ ] Lunge telegraph.
- [ ] Direction lock.
- [ ] Miss recovery.
- [ ] Contact cooldown.
- [ ] Groups do not permanently pin.
- [ ] Overclocked timing floor.
- [ ] Replicating copy cannot replicate.
- [ ] Resonant behavior.

# 16. Sentry

- [ ] Valid range selection.
- [ ] No fire without line of sight.
- [ ] Early tracking.
- [ ] Lock cue.
- [ ] No tracking after lock.
- [ ] Burst count/spacing.
- [ ] Spawn lockout.
- [ ] Projectile values.
- [ ] Telegraph concurrency.

# 17. Lancer

- [ ] Lane equals path.
- [ ] Direction lock.
- [ ] Endpoint valid.
- [ ] Wall stop.
- [ ] Recovery.
- [ ] Invalid geometry prevents attack.
- [ ] Multi-Lancer recipe remains fair.
- [ ] Dash can evade.

# 18. Shard Carrier

- [ ] Shard cap.
- [ ] Stable orbit.
- [ ] Death deployment.
- [ ] Valid hazard positions.
- [ ] Activation delay.
- [ ] Finite duration.
- [ ] Route remains.
- [ ] Transition cleanup.
- [ ] Reduced-particle mode preserves border.

# 19. Bulwark

- [ ] Tracks real player only.
- [ ] Turn speed.
- [ ] Front scalar.
- [ ] Side transition.
- [ ] Rear damage.
- [ ] Stagger threshold/window.
- [ ] Echo crossfire.
- [ ] High-contrast arc.
- [ ] No unintended immunity.

# 20. Suppressor

- [ ] Field radius.
- [ ] Cooldown scalar.
- [ ] Existing Echo survives.
- [ ] Fields do not stack.
- [ ] Border readable.
- [ ] Valid relocation.
- [ ] No early spawn.
- [ ] Death removes field.
- [ ] No negative cooldown.

---

# 21. Elite modifiers

## Overclocked

- [ ] Health.
- [ ] Speed.
- [ ] Timing floors.
- [ ] Orange visuals.
- [ ] Score/threat.

## Replicating

- [ ] One threshold trigger.
- [ ] Copy health/damage.
- [ ] Copy cannot replicate.
- [ ] Ineligible types excluded.
- [ ] Safe warning.

## Resonant

- [ ] Trigger radius.
- [ ] Shield amount.
- [ ] Duration.
- [ ] Internal cooldown.
- [ ] No stacking.
- [ ] Connection readable.

---

# 22. Encounter director

- [ ] Correct phase order.
- [ ] Safe opening.
- [ ] Known-role development.
- [ ] Target pressure.
- [ ] Recovery.
- [ ] Valid finale.
- [ ] Cleanup adds no full wave.
- [ ] No consecutive recipe repeat.
- [ ] No dual unseen introduction.
- [ ] Active caps.
- [ ] Telegraph caps.
- [ ] Invalid recipe rejected.
- [ ] Safe fallback.
- [ ] Debug selection log.
- [ ] Same seed/choices reproduce sequence.

---

# 23. Arena generation

For each template and transform:

- [ ] Player spawn clear.
- [ ] Obstacles in bounds.
- [ ] Collision matches visual.
- [ ] Navigation connected.
- [ ] Hazard route valid.
- [ ] Sockets obey safety radius.
- [ ] Ranged sockets not immediately lethal.
- [ ] Elite sockets valid.
- [ ] Camera bounds.
- [ ] Decoration non-blocking.
- [ ] No consecutive layout.
- [ ] Hazard repetition rule.
- [ ] Fallback.
- [ ] 1,000 validation generations without crash.

---

# 24. Upgrade system

## 24.1 Selection

- [ ] Three unique options.
- [ ] Maxed excluded.
- [ ] Locked excluded.
- [ ] Conflicts excluded.
- [ ] Diversity rule.
- [ ] Low-health weighting not guarantee.
- [ ] One commit.
- [ ] Gameplay frozen.
- [ ] Choice logged.
- [ ] Seed reproduction.

## 24.2 Description integrity

For every level:

- [ ] Display equals implementation.
- [ ] Max level shown.
- [ ] Current/next comparison.
- [ ] Tags.
- [ ] Conflicts.

## 24.3 Interaction matrix

- [ ] Split Lens + Fracture.
- [ ] Split Lens + Afterburn.
- [ ] Pierce + Ricochet.
- [ ] Arc Relay + Echo.
- [ ] Extended Memory + Twin Recall.
- [ ] Stable Projection + Resonant Damage.
- [ ] Phantom Shield + Null Absorption.
- [ ] Dash Wake + Echo dash.
- [ ] Vector Reversal + Phase Recovery.
- [ ] Reactive Shell + Last Frame.
- [ ] Regeneration + transition.
- [ ] Deflection Pulse + walls.
- [ ] No recursive trigger.

---

# 25. Run flow

- [ ] Unique run ID/seed.
- [ ] Tutorial option.
- [ ] Each chamber begins.
- [ ] Safe completion.
- [ ] Echo clears before upgrade.
- [ ] Hostile projectile cleanup.
- [ ] Upgrade exactly once.
- [ ] Elite order.
- [ ] Recovery chamber.
- [ ] Boss transition.
- [ ] Victory.
- [ ] Defeat.
- [ ] Complete result payload.
- [ ] Clean restart.
- [ ] Clean menu return.
- [ ] Refresh does not save incomplete run as completed.

---

# 26. Boss

## 26.1 Core

- [ ] Health/thresholds.
- [ ] Scheduler cooldown.
- [ ] Fallback attack.
- [ ] Vulnerability windows.
- [ ] Maximum invulnerability.
- [ ] Add cap.
- [ ] Pause.
- [ ] Restart cleanup.

## 26.2 Phase 1

- [ ] Fan safe gaps.
- [ ] Line telegraph/lock.
- [ ] Safe summons.
- [ ] Core opening readable.

## 26.3 Phase 2

- [ ] Safe transition.
- [ ] Hostile copy warning.
- [ ] Visual distinction.
- [ ] Projectile distinction.
- [ ] Lifetime.
- [ ] Copy cap.
- [ ] No player upgrades.
- [ ] Friendly/hostile simultaneous readability.

## 26.4 Phase 3

- [ ] Sector warning.
- [ ] State transitions.
- [ ] Connected safe route.
- [ ] Minimum safe area.
- [ ] Damage grace.
- [ ] Rear panels.
- [ ] Concurrency readable.

## 26.5 End states

- [ ] Defeat triggers once.
- [ ] Victory triggers once.
- [ ] Projectiles dissolve.
- [ ] Adds clear.
- [ ] Victory sequence skip rule.
- [ ] Boss stats recorded.
- [ ] Death/final-hit race resolves correctly.

---

# 27. Scoring

- [ ] Enemy scores.
- [ ] Elite scalar.
- [ ] Chamber scores.
- [ ] Boss score.
- [ ] Combo gain.
- [ ] Combo decay.
- [ ] Damage combo loss.
- [ ] Crossfire window.
- [ ] Per-target cooldown.
- [ ] Near-miss once/projectile.
- [ ] Near-miss rate cap.
- [ ] Time bonus.
- [ ] Avoidance bonus.
- [ ] Difficulty multiplier.
- [ ] Integer rounding.
- [ ] Results match event log.

---

# 28. Progression

- [ ] Fresh unlock set.
- [ ] Locked upgrade excluded.
- [ ] Achievement unlock once.
- [ ] Unlock persists.
- [ ] Standard victory unlocks Overclocked.
- [ ] No permanent stats.
- [ ] Cosmetics persist.
- [ ] Clear data resets.
- [ ] Import/export preserves.
- [ ] No duplicate unlock entries.

---

# 29. UI and navigation

## 29.1 HUD

- [ ] Health.
- [ ] Trailing health.
- [ ] Echo history readiness.
- [ ] Echo cooldown.
- [ ] Dash cooldown.
- [ ] Score.
- [ ] Combo.
- [ ] Chamber phase.
- [ ] Boss health.
- [ ] No overlap at supported viewports.

## 29.2 Pause

- [ ] Opens once.
- [ ] Simulation freezes.
- [ ] Audio mix.
- [ ] Resume.
- [ ] Settings.
- [ ] Restart confirmation.
- [ ] Menu confirmation.
- [ ] Focus restoration.

## 29.3 Results

- [ ] Victory/defeat.
- [ ] Score animation.
- [ ] Skip.
- [ ] Personal best.
- [ ] Statistics.
- [ ] Unlocks.
- [ ] Seed.
- [ ] Restart.
- [ ] Menu.

## 29.4 Keyboard-only

- [ ] Every control reachable.
- [ ] Focus visible.
- [ ] No trap.
- [ ] Disabled skipped.
- [ ] Modal captures.
- [ ] Closing restores focus.

---

# 30. Audio

- [ ] No sound before gesture.
- [ ] One AudioContext.
- [ ] Player shot.
- [ ] Echo shot distinct.
- [ ] Hostile copy distinct.
- [ ] Dash.
- [ ] Echo deploy/dissolve.
- [ ] Player damage.
- [ ] Normal/elite death.
- [ ] Upgrade.
- [ ] Portal.
- [ ] Menu.
- [ ] Boss transition.
- [ ] Victory.
- [ ] Controlled variation.
- [ ] Voice caps.
- [ ] Music-state transitions.
- [ ] Layer synchronization.
- [ ] Pause mix.
- [ ] Mute.
- [ ] Persistence.
- [ ] No restart duplication.
- [ ] Chromium/Firefox acceptable.

---

# 31. Accessibility

- [ ] Shake 0%.
- [ ] Shake 100% remains capped.
- [ ] Reduced flashes.
- [ ] Reduced particles.
- [ ] High contrast.
- [ ] Colorblind telegraphs.
- [ ] Aim line toggle.
- [ ] Damage numbers toggle.
- [ ] Persistent locator.
- [ ] Larger outlines.
- [ ] Keyboard-only complete flow.
- [ ] Destructive confirmation.
- [ ] Difficulty presets.
- [ ] Minimum viewport readability.
- [ ] Color is never sole warning.
- [ ] Echo/copy distinct in grayscale.

---

# 32. Save data

- [ ] First creation.
- [ ] Normal load.
- [ ] Backup creation.
- [ ] Corrupt-primary recovery.
- [ ] Corrupt-backup fallback.
- [ ] Missing fields default.
- [ ] Unknown fields ignored.
- [ ] Numeric clamp.
- [ ] Migration.
- [ ] Migration backup.
- [ ] Export.
- [ ] Valid import.
- [ ] Invalid import rejection.
- [ ] Clear confirmation.
- [ ] Recent run cap 50.
- [ ] No active-run resume.
- [ ] No per-frame writes.

---

# 33. Determinism

For fixed seed and choices:

- [ ] Same arena sequence.
- [ ] Same transforms.
- [ ] Same hazards.
- [ ] Same encounters.
- [ ] Same spawn groups.
- [ ] Same upgrade offerings.
- [ ] Same boss sequence where intended.
- [ ] Cosmetic differences do not affect gameplay.
- [ ] Pause does not alter generation.
- [ ] Visual settings do not alter gameplay RNG.
- [ ] Debug stream states available.
- [ ] Algorithm version recorded.

---

# 34. Performance

## 34.1 Normal run

- [ ] 60 FPS target.
- [ ] 95th percentile frame under 20 ms.
- [ ] No recurring spawn hitch over 50 ms.
- [ ] Stable memory.
- [ ] Counts within caps.
- [ ] Listener count stable.

## 34.2 Stress

- [ ] 30 normal enemies.
- [ ] 2 elites.
- [ ] 120 player projectiles.
- [ ] 120 Echo projectiles.
- [ ] 100 hostile projectiles.
- [ ] 180 particles.
- [ ] 2 friendly Echoes.
- [ ] 2 hostile copies.
- [ ] Maximum telegraphs.
- [ ] Maximum damage numbers.

Stress may exceed intended balance but cannot crash or leak.

## 34.3 Long sessions

- [ ] 30-minute menu idle.
- [ ] 30-minute active debug loop.
- [ ] 20 restarts.
- [ ] 50 pause/resume cycles.
- [ ] 20 focus-loss cycles.
- [ ] Repeated resize.
- [ ] Repeated settings open/close.
- [ ] Repeated boss restart.

Record:

- Heap trend.
- Object counts.
- Audio nodes.
- Listeners.
- Timers.
- Tweens.
- Pool capacity.
- Frame-time trend.

---

# 35. Visual readability

Capture:

- Early chamber.
- Maximum late chamber.
- Two friendly Echoes.
- Friendly Echo + hostile copy.
- Multiple telegraphs.
- Boss Phase 3.
- Reduced effects.
- High contrast.
- Minimum viewport.
- Grayscale.

Verify:

- [ ] Player instantly locatable.
- [ ] Friendly Echo distinct.
- [ ] Hostile copy distinct.
- [ ] Enemies identifiable.
- [ ] Damage sources visible.
- [ ] Hazard boundaries visible.
- [ ] HUD does not cover threats.
- [ ] Particles do not resemble projectiles.
- [ ] Background does not resemble telegraphs.

---

# 36. Universal regression checklist

After any system change:

- [ ] Menu.
- [ ] Start run.
- [ ] Movement.
- [ ] Aim.
- [ ] Fire.
- [ ] Dash.
- [ ] Echo.
- [ ] Pause/resume.
- [ ] Enemy death.
- [ ] Chamber clear.
- [ ] Upgrade.
- [ ] Restart.
- [ ] Menu return.
- [ ] Audio duplication.
- [ ] Listener count.
- [ ] Console.
- [ ] Production build.

Add system-specific regression cases to this list.

---

# 37. Milestone gates

## Foundation

- [ ] Local and deployed build.
- [ ] Scene transitions.
- [ ] Scaling.
- [ ] Clean console.

## Player prototype

- [ ] Movement.
- [ ] Aim.
- [ ] Fire.
- [ ] Dash.
- [ ] Restart-safe.

## Echo prototype

- [ ] Recording.
- [ ] Playback.
- [ ] Fire/dash events.
- [ ] Pause-safe.
- [ ] Thirty-deployment stress.

## Vertical slice

- [ ] Drifter.
- [ ] Sentry.
- [ ] One arena.
- [ ] One upgrade.
- [ ] HUD.
- [ ] Death/results/restart.
- [ ] Basic audio/effects.

## Core combat

- [ ] Pools.
- [ ] Director.
- [ ] Damage.
- [ ] Debug metrics.
- [ ] No spawn stutter.

## Content complete

- [ ] Full enemy roster.
- [ ] Elites.
- [ ] Arenas.
- [ ] Upgrades.
- [ ] Full run.

## Boss complete

- [ ] Three phases.
- [ ] Hostile copy.
- [ ] Victory.
- [ ] Restart.

## Release candidate

- [ ] Performance.
- [ ] Accessibility.
- [ ] Save validation.
- [ ] Browser matrix.
- [ ] Deployment.
- [ ] 0 Critical/High.

---

# 38. Release sign-off

Release only when:

- [ ] Every fixed requirement is implemented.
- [ ] No deferred feature is partially exposed.
- [ ] 0 Critical defects.
- [ ] 0 High defects.
- [ ] Accepted Medium defects documented.
- [ ] Fresh Standard run can complete.
- [ ] Relaxed and Overclocked work.
- [ ] Boss is beatable without a specific upgrade.
- [ ] Determinism passes.
- [ ] Save import/export passes.
- [ ] Accessibility baseline passes.
- [ ] Twenty-restart leak test passes.
- [ ] Production and GitHub Pages pass.
- [ ] README contains controls, browser requirements, and local run instructions.
