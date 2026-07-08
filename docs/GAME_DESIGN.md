# ECHOFRAME: LAST SIGNAL — Game Design Document

**Document:** `GAME_DESIGN.md`  
**Version:** 1.0-preproduction  
**Target release:** Desktop browser  
**Technology constraint:** Phaser 3.90.0, JavaScript ES modules, Vite, Arcade Physics, Web Audio API, `localStorage`, GitHub Pages  
**Primary mode:** Standard Run  
**Successful run target:** 12–18 minutes; median target 14 minutes

## Status terminology

- **Fixed requirement:** required for version 1.0.
- **Playtest variable:** starting value that may be tuned without changing the mechanic’s role.
- **Deferred:** explicitly excluded from version 1.0.

---

# 1. Product definition

## 1.1 High concept

**ECHOFRAME: LAST SIGNAL** is a top-down 2D action roguelite set inside a collapsing orbital memory station. The player controls the final defensive construct, the **Warden**. The game continuously records the player’s recent movement, aim, shots, and dashes. Pressing the Echo action creates a temporary projection that replays the previous 3.5 seconds.

The Echo is not merely a damage clone. The player deliberately establishes useful past paths, then repositions so the replay creates crossfire, rear attacks, projectile interception, area coverage, or delayed pressure.

## 1.2 Player fantasy

The player should feel like:

1. A precise, mobile combat machine.
2. A tactician coordinating with their own recent actions.
3. A player converting movement history into positional advantage.
4. A survivor escalating from careful control to controlled spectacle.
5. A player mastering a system rather than grinding permanent statistics.

## 1.3 Version 1.0 product goals

Version 1.0 contains:

- One complete primary run mode.
- Three difficulty presets.
- One playable character.
- Six normal enemy types.
- Three elite modifiers.
- Eight modular arena templates.
- Twenty-four upgrades.
- One three-phase final boss.
- Deterministic seeded run generation.
- Procedural visual and audio assets.
- Local settings, statistics, progression, and run history.
- Full keyboard-and-mouse navigation.
- A static GitHub Pages deployment.

## 1.4 Explicit non-goals

Version 1.0 does not include:

- Online multiplayer.
- Accounts, authentication, cloud saves, or a backend.
- Global leaderboards.
- Mobile touch controls.
- Multiple playable characters.
- Multiple biomes.
- Multiple bosses.
- Narrative cutscenes.
- Voice acting.
- User-generated levels.
- Daily challenges.
- Crafting, inventory, loot rarity, or equipment drops.
- Permanent damage, health, movement, or fire-rate progression.
- Open-world exploration.
- Additional primary game modes.
- Full localization.
- Runtime dependency on third-party services.

---

# 2. Design pillars

Every feature must support at least one pillar and must not undermine another.

## 2.1 Fight with your past

The Echo is the game’s identity.

Requirements:

- The Echo remains tactically valuable from the tutorial through the boss.
- At least three normal enemies create explicit Echo opportunities.
- At least six upgrades materially alter Echo use.
- Scoring rewards crossfire.
- The boss cannot be efficiently solved while ignoring Echoes.

## 2.2 Readable intensity

The player must always understand:

- Their own location.
- Friendly Echo location.
- Hostile entities.
- Immediate damage sources.
- Telegraph start, lock, and execution.
- Current health.
- Echo and dash readiness.
- Why damage occurred.

Readability overrides spectacle.

## 2.3 Compact, meaningful builds

Upgrades change tactics, timing, positioning, or interactions. Numerical upgrades are acceptable only when bounded and linked to a playstyle.

A healthy build contains:

- A recognizable offensive pattern.
- At least one Echo interaction.
- At least one movement or defensive decision.
- No mandatory single upgrade.
- No infinite or recursive damage loop.
- No exponential combination that invalidates enemies.

## 2.4 Short, complete runs

A run follows:

1. Orientation.
2. Enemy introduction.
3. Combination.
4. Elite pressure.
5. Recovery.
6. Final mastery test.

The run ends before the build becomes visually or mechanically incoherent.

## 2.5 Strong presentation from limited assets

Quality comes from:

- Consistent shape language.
- Controlled color semantics.
- Responsive animation.
- Layered feedback.
- Procedural graphics.
- Procedural audio.
- Complete menus and transitions.

Asset quantity is secondary.

---

# 3. Audience, skill model, and failure philosophy

## 3.1 Target audience

Players who enjoy:

- Twin-stick or mouse-aim action.
- Short roguelite runs.
- Mechanical mastery.
- Build experimentation.
- Pattern recognition.
- Responsive controls.
- Readable combat.

## 3.2 Required initial knowledge

A new player should understand basic controls within 60 seconds. The tutorial requires one meaningful Echo use before normal combat begins.

## 3.3 Skill dimensions

The game tests:

- Aim.
- Movement.
- Threat prioritization.
- Telegraph recognition.
- Delayed planning.
- Future Echo positioning.
- Upgrade evaluation.
- Risk management.
- Boss pattern mastery.

## 3.4 Valid causes of failure

Failure should result from:

- Poor positioning.
- Missed telegraph.
- Wrong target priority.
- Wasteful dash.
- Poor Echo preparation.
- Greedy damage attempt.
- Build misunderstanding.

Failure should not commonly result from:

- Hidden projectiles.
- Off-screen attacks without warning.
- Impossible generated layouts.
- Unclear collision boundaries.
- Effects obscuring hazards.
- Random unavoidable combinations.
- Lost input during transitions.

---

# 4. Core loops

## 4.1 Moment-to-moment loop

```text
Observe threats
→ Move and fire
→ Establish a useful recorded path
→ Reposition
→ Deploy Echo
→ Create crossfire or coverage
→ Dash through or away from danger
→ Destroy priority targets
→ Repeat under increasing pressure
```

## 4.2 Chamber loop

```text
Enter chamber
→ Read arena
→ Opening wave
→ Development wave
→ Pressure wave
→ Recovery
→ Finale
→ Cleanup
→ Upgrade
→ Transition
```

## 4.3 Run loop

```text
Main menu
→ Start run
→ Optional first-run tutorial
→ Combat 1
→ Upgrade
→ Combat 2
→ Upgrade
→ Elite 1
→ Upgrade
→ Combat 3
→ Upgrade
→ Combat 4
→ Upgrade
→ Elite 2
→ Upgrade
→ Recovery chamber
→ Final upgrade
→ Boss
→ Results
→ Unlock/stat update
→ Restart or menu
```

A successful run grants seven upgrade selections. Playtesting may increase this to eight or nine, but not beyond nine.

---

# 5. Controls

## 5.1 Fixed controls

| Input | Action |
|---|---|
| `W`, `A`, `S`, `D` | Move |
| Mouse position | Aim |
| Left mouse | Fire continuously while held |
| `Space` | Deploy Echo |
| Left `Shift` or right mouse | Dash |
| `Escape` | Pause or return one menu level |
| Arrow keys | Navigate menus |
| `Enter` | Confirm focused item |
| Mouse | Point, select, and adjust settings |

## 5.2 Input rules

- Movement and aim are independent.
- Diagonal movement is normalized.
- Browser key-repeat events do not drive movement.
- The right-click context menu is suppressed only over the game canvas.
- Browser-reserved shortcuts are not overridden.
- Input is locked during transitions and confirmation dialogs.
- Focus loss pauses by default.
- Held actions are cleared on focus loss.
- Gameplay bindings can be remapped.
- Conflicting bindings are rejected.
- Menu navigation remains fixed in version 1.0.

## 5.3 First-run tutorial

The tutorial chamber requires:

1. Move to three marked positions.
2. Aim at and destroy a stationary target.
3. Dash through a harmless gate.
4. Follow a marked path while firing.
5. Deploy an Echo that replays the path and destroys a shielded target from behind.
6. Enter normal combat.

The tutorial can be skipped after first completion and replayed from the Archive. It is not a separate scoring mode.

---

# 6. Player specification

## 6.1 Identity

The Warden has:

- Bright cyan core.
- Four-point diamond silhouette.
- Thin white outline.
- Circular ground marker.
- Aim-direction nose.
- Stronger glow than Echoes.
- Damage feedback that preserves silhouette visibility.

## 6.2 Movement behavior

Fixed:

- Top-down acceleration-based movement.
- No drift-heavy inertia.
- Equal maximum speed in all directions.
- Solid walls block movement.
- Decoration never blocks.
- Enemies use overlap damage and controlled separation rather than forming rigid walls.
- Player cannot leave the arena.
- Movement remains available while firing.
- No stamina resource.

Starting values:

| Parameter | Value |
|---|---:|
| Maximum speed | 340 px/s |
| Acceleration | 2600 px/s² |
| Deceleration | 3200 px/s² |
| Collision radius | 18 px |
| Aim dead-zone radius | 24 px |
| Contact separation impulse | 260 px/s |
| Maximum contact separation displacement | 26 px |

## 6.3 Dash

Fixed:

- Uses movement direction.
- Without movement input, uses aim direction.
- Direction locks at dash start.
- Player is invulnerable during dash.
- Enemy body collision is ignored.
- Arena walls remain solid.
- Dash is disabled during transitions, menus, and death.
- Inputs during the final 120 ms of cooldown may buffer.
- Cooldown begins when dash ends.
- Damage fields cannot damage during dash invulnerability.
- Dash effects must not hide hostile telegraphs.

Starting values:

| Parameter | Value |
|---|---:|
| Distance | 150 px |
| Duration | 160 ms |
| Invulnerability | 190 ms |
| Cooldown | 1200 ms |
| Input buffer | 120 ms |
| Wall-stop recovery | 60 ms |

## 6.4 Health and damage

Fixed:

- Base maximum health: 100.
- Health cannot exceed current maximum.
- Post-hit invulnerability blocks repeated damage.
- Contact sources have internal cooldown.
- Upgrade and pause screens cannot receive damage.
- Blocked repeated hits may show a harmless spark for clarity.

Starting values:

| Parameter | Value |
|---|---:|
| Base health | 100 |
| Post-hit invulnerability | 700 ms |
| Normal contact damage | 12 |
| Heavy attack damage | 18–25 |
| Damage slowdown | 60 ms at 35% time scale |

## 6.5 Player state machine

```text
SPAWNING
  → ACTIVE
ACTIVE
  → DASHING
  → HIT_REACT
  → TRANSITION_LOCK
  → DEAD
DASHING
  → ACTIVE
HIT_REACT
  → ACTIVE or DEAD
TRANSITION_LOCK
  → ACTIVE or SCENE_EXIT
DEAD
  → RESULTS
```

Only allowed states process movement, fire, Echo, or dash input.

---

# 7. Weapon system

## 7.1 Base weapon

| Parameter | Starting value |
|---|---:|
| Damage | 10 |
| Fire rate | 5 shots/s |
| Fire interval | 200 ms |
| Projectile speed | 850 px/s |
| Lifetime | 1.4 s |
| Projectile radius | 5 px |
| Critical chance | 5% |
| Critical multiplier | 1.6× |
| Spawn offset | 26 px |

## 7.2 Rules

- First shot fires immediately.
- Holding fire repeats at the current interval.
- Aim uses the last valid direction inside the cursor dead zone.
- Projectiles are pooled.
- Player projectiles hit enemies and solid walls.
- Pierce and ricochet modify collision resolution.
- Critical state is determined when the projectile is created.
- The base weapon has no spread.
- Pausing cannot queue extra shots.
- Lifetime, world exit, or terminal collision returns projectile to pool.

## 7.3 Feedback hierarchy

Standard hit:

- 25–45 ms target flash.
- 2–4 small particles.
- Small positional sound.
- Minor recoil or compression.
- Optional damage number.

Critical hit:

- Stronger flash.
- 6–8 particles.
- Larger damage number.
- Sharper sound.
- Brief trail expansion.

Enemy destruction:

- 8–16 particles.
- 120–220 ms silhouette collapse.
- Directional fragments.
- Distinct sound.
- Hitstop reserved for elites and boss-critical events.

---

# 8. Echo system

## 8.1 Purpose

The Echo rewards deliberate movement, delayed planning, crossfire, flanking, and area control.

## 8.2 Base behavior

- The previous 3.5 seconds are recorded.
- Recorded data includes position, aim, fire events, dash events, and visual movement state.
- `Space` deploys an Echo when ready.
- The Echo appears at the historical position 3.5 seconds earlier.
- It replays from that moment to the deployment moment.
- It replays firing and dash events at recorded relative times.
- It lasts for the replay duration, then dissolves.
- It cannot be damaged.
- It does not block anything.
- Enemies target the real player.
- Echoes ignore solid collision during replay.
- Echo projectiles use a separate faction and pool.
- Echoes do not trigger portals, pickups, tutorial movement checks, or player-only hazards.
- Pause freezes recording and playback.
- Restart clears all recording, cooldown, and active Echo state.
- Deployment is unavailable until enough valid history exists.
- Base maximum active Echo count is one.

## 8.3 Base values

| Parameter | Value |
|---|---:|
| Recording duration | 3.5 s |
| Sample rate | 30 Hz |
| Minimum snapshot capacity | 105 |
| Cooldown | 7.0 s |
| Damage scalar | 0.55 |
| Active cap | 1 |
| Fire-event timing tolerance | ±20 ms |
| Opacity | 55–70% |
| Dissolve duration | 300 ms |

## 8.4 Snapshot concept

Movement snapshots contain:

- Simulation timestamp.
- X and Y.
- Aim rotation.
- Movement visual state.
- Dash visual flag.

Fire and dash events are separate timestamped streams.

## 8.5 Frozen loadout rule

On deployment, the Echo captures the player’s current Echo-relevant state:

- Damage scalar.
- Projectile count and spread.
- Projectile speed.
- Pierce.
- Ricochet.
- Chain eligibility.
- Phantom Shield capacity.
- Expiration burst.
- Dash Wake.
- Relevant upgrade levels.

An active Echo never changes because of a later upgrade.

## 8.6 Visual distinction

| Player | Friendly Echo |
|---|---|
| Solid cyan core | Transparent violet-cyan core |
| White outline | Broken outline |
| Solid ground ring | Segmented ground ring |
| Clean trail | Fragmented delayed trail |
| Full-opacity projectiles | Thin translucent projectiles |

## 8.7 State machine

```text
INACTIVE
→ SPAWNING
→ PLAYBACK
→ DISSOLVING
→ INACTIVE
```

## 8.8 Edge cases

- Pause freezes timing exactly.
- Player death freezes normal combat after the short death presentation.
- Upgrade screens clear active Echoes.
- Arena transitions dissolve Echoes immediately.
- Buffer wrap preserves time order.
- Playback uses simulation time, not frame count.
- Repeated Space presses accept only the first valid request.
- Cooldown readiness while Space is held does not auto-deploy.
- Twin Recall uses the same frozen loadout and recording interval.

## 8.9 Acceptance

- Thirty consecutive deployments show no perceptible drift.
- Fire playback remains within ±20 ms under stable conditions.
- Pause/resume preserves synchronization.
- Restart leaves no history.
- Echo damage is tracked separately.
- Friendly Echo, real player, and hostile copy remain distinguishable.

---

# 9. Shared enemy rules

- Spawn animation lasts 450–900 ms.
- Enemies cannot damage during spawn.
- Ranged enemies cannot attack immediately after spawn.
- Physics bodies are smaller than visual silhouettes.
- Every attack has anticipation, lock, execution, and recovery.
- Telegraphs use shape and motion in addition to color.
- Spawns respect the player safety radius.
- Bodies use soft separation.
- Projectiles are pooled.
- Death cancels pending attacks.
- Pause freezes timers.
- Transitions remove enemies, hazards, and projectiles.

---

# 10. Enemy roster

## 10.1 Drifter

**Role:** Basic pursuer  
**Threat cost:** 1

Behavior:

1. Pursue.
2. Enter lunge range.
3. Telegraph.
4. Lock direction.
5. Lunge.
6. Recover.
7. Resume pursuit.

Fairness:

- Direction locks before execution.
- Telegraph uses a widening wedge.
- Miss creates a punishment window.
- Contact damage has per-source cooldown.

## 10.2 Sentry

**Role:** Ranged pressure  
**Threat cost:** 2

Behavior:

1. Seek firing position.
2. Stop.
3. Track player with narrow line.
4. Lock.
5. Fire three-projectile burst.
6. Recover.
7. Reposition.

Fairness:

- Standard initial telegraph at least 650 ms.
- Lock uses visual pulse and audio tick.
- Aim stops tracking after lock.
- Cannot fire without line of sight.
- Cannot fire within 900 ms of spawn completion.

## 10.3 Lancer

**Role:** Space-cutting charger  
**Threat cost:** 3

Behavior:

1. Face player.
2. Display rectangular charge lane.
3. Track briefly.
4. Lock.
5. Charge.
6. Stop at wall or distance.
7. Enter vulnerable recovery.

Fairness:

- Lane remains visible until execution.
- Direction locks before motion.
- Invalid endpoints cancel or reschedule.
- Intersecting Lancer charges require a tested authored recipe.

## 10.4 Shard Carrier

**Role:** Delayed area control  
**Threat cost:** 3

Behavior:

- Maintains preferred orbit distance.
- Controls up to three orbiting shards.
- On death, unresolved shards move to marked floor points.
- Shards telegraph before becoming hazards.
- Hazards expire.

Fairness:

- Activation is delayed.
- Radius is visible.
- Hazard layout cannot block every route.
- Transitions remove unresolved shards.

## 10.5 Bulwark

**Role:** Directional defense  
**Threat cost:** 4

Behavior:

- Slow approach.
- Shield tracks real player.
- Shield covers roughly 150 degrees.
- Front damage is reduced.
- Rear damage is normal.
- Sustained rear pressure causes stagger.

Fairness:

- Shield arc visible on floor.
- Rear weakness explicit.
- Shield tracks player, not Echo.
- Turn speed is limited.
- Front is resistant, never fully immune.

## 10.6 Suppressor

**Role:** Priority disruption  
**Threat cost:** 5

Behavior:

- Moves to a control position.
- Projects an interference field.
- Echo cooldown recovers more slowly inside.
- Existing Echoes continue functioning.
- Field pulses visually.
- Suppressor has moderate health and low direct offense.

Fairness:

- Border remains visible through effects.
- Cooldown recovery never reaches zero.
- Multiple fields use only the strongest effect.
- Cannot spawn in tutorial or Combat 1.

---

# 11. Elite modifiers

Only one modifier may apply to an enemy.

## 11.1 Overclocked

- Faster action timing.
- Shorter recovery.
- Moderate health increase.
- Orange telegraph accents.
- Global anticipation floors still apply.

## 11.2 Replicating

- Creates one weakened copy at a health threshold.
- Copy starts at 50% health.
- Copy cannot replicate.
- Split animation is telegraphed.
- Suppressor and boss are ineligible.

## 11.3 Resonant

- Gains temporary shield when a nearby enemy dies.
- Connection line makes relationship visible.
- Shield is finite.
- Simultaneous deaths do not stack shield amount.

---

# 12. Encounter director

## 12.1 Purpose

The director uses authored recipes and threat budgets. It does not place enemies independently at random.

## 12.2 Chamber phases

```text
OPENING
→ DEVELOPMENT
→ PRESSURE
→ RECOVERY
→ FINALE
→ CLEANUP
→ COMPLETE
```

## 12.3 Phase roles

- **Opening:** introduce or reinforce one concept.
- **Development:** combine known roles.
- **Pressure:** intended chamber peak.
- **Recovery:** reduced threat, no major new execution.
- **Finale:** one deliberate tested combination.
- **Cleanup:** no new full wave.
- **Complete:** all danger cleared.

## 12.4 Constraints

- Never introduce two unseen enemy types simultaneously.
- Never spawn inside safety radius.
- Ranged enemies cannot spawn with an immediate locked line.
- Enforce active entity and projectile caps.
- At most two high-priority telegraphs execute within a 300 ms window.
- Recovery follows each pressure peak.
- No recipe repeats consecutively.
- Arena tags filter recipes.
- Selection is deterministic.
- Invalid selection falls back to a conservative safe recipe.

## 12.5 Cleanup

Cleanup starts when:

- Schedule is exhausted.
- No unresolved spawn remains.
- Remaining threat is below threshold.

During cleanup:

- Remaining enemies receive a mild speed/action increase.
- No new elite appears.
- Off-screen enemies are indicated.
- Inaccessible enemies are safely relocated or removed through a failsafe.

---

# 13. Arena system

## 13.1 Coordinate model

- Logical resolution: 1600×900.
- Combat-safe rectangle: 1440×810 centered.
- World coordinates stay constant across viewport sizes.
- Letterboxing is permitted.
- UI respects safe margins.

## 13.2 Templates

1. Open circular chamber.
2. Split central pillars.
3. Four-corner cover.
4. Narrow side channels.
5. Broken ring.
6. Offset central structure.
7. Twin islands.
8. Boss chamber.

Eligible templates may have:

- Up to four rotations/mirrors.
- Three decoration variants.
- Two validated hazard configurations.

## 13.3 Template data

Each template defines:

- Stable ID.
- Dimensions.
- Player spawn.
- Enemy sockets.
- Elite sockets.
- Hazard sockets.
- Solid obstacles.
- Safe zones.
- Navigation zones.
- Line-of-sight metadata.
- Tags.
- Forbidden encounter tags.
- Camera bounds.
- Decoration anchors.
- Validation version.

## 13.4 Rules

- Same base layout cannot occur consecutively.
- Same hazard configuration cannot occur more than twice per run.
- Player spawn has a clear radius.
- Solids have navigable clearance.
- Hazards cannot block all routes.
- Enemy sockets are filtered against current player position.
- Enemy activation follows spawn telegraph.
- Boss chamber is fixed.
- Validation failure uses a known-safe fallback arena.

---

# 14. Run structure

## 14.1 Target timeline

| Segment | Target elapsed time |
|---|---:|
| Tutorial/entry | 0:00–1:00 |
| Combat 1 | 1:00–2:20 |
| Combat 2 | 2:20–3:50 |
| Elite 1 | 3:50–5:10 |
| Combat 3 | 5:10–6:40 |
| Combat 4 | 6:40–8:20 |
| Elite 2 | 8:20–9:50 |
| Recovery/final upgrade | 9:50–10:30 |
| Boss | 10:30–14:30 |

These are playtest targets.

## 14.2 Run state machine

```text
CREATED
→ TUTORIAL_OPTION
→ CHAMBER_ENTRY
→ COMBAT
→ CHAMBER_COMPLETE
→ UPGRADE_SELECTION
→ TRANSITION
→ BOSS
→ VICTORY or DEFEAT
→ RESULTS
→ CLOSED
```

Only the run controller may advance run state.

## 14.3 Completion sequence

A chamber completes only when:

- Schedule is finished.
- No active enemy remains.
- No pending hostile spawn remains.
- No boss-owned hazard remains.
- Transition-critical projectile cleanup is complete.

Then:

1. Stop spawns.
2. Dissolve hostile projectiles.
3. Clear active Echoes.
4. Lock combat input.
5. Apply safety pause.
6. Open upgrade or transition.

---

# 15. Upgrade system

## 15.1 Selection rules

- Present three unique options.
- Exclude maxed, locked, and conflicting upgrades.
- Generally include at least one option outside the dominant category.
- Low health slightly increases defensive weight but never guarantees defense.
- No rerolls in version 1.0.
- Gameplay freezes.
- Choice is permanent for the current run.
- Active Echoes are cleared.
- Choice is logged.

## 15.2 Categories

- Weapon.
- Echo.
- Mobility.
- Defense.

## 15.3 Version 1.0 list

### Weapon

1. Split Lens.
2. Piercing Signal.
3. Arc Relay.
4. Fracture Round.
5. Compression Coil.
6. Ricochet Matrix.

### Echo

7. Extended Memory.
8. Twin Recall.
9. Resonant Damage.
10. Phantom Shield.
11. Stable Projection.
12. Memory Burst.

### Mobility

13. Dash Wake.
14. Phase Recovery.
15. Kinetic Charge.
16. Vector Reversal.
17. Slipstream.
18. Afterburn.

### Defense

19. Emergency Repair.
20. Reactive Shell.
21. Null Absorption.
22. Last Frame.
23. Regenerative Circuit.
24. Deflection Pulse.

Exact values are authoritative in `BALANCE_SPEC.md`.

## 15.4 Upgrade constraints

Every upgrade:

- Displays exact values.
- Has a maximum level.
- Has category and tags.
- Defines conflicts.
- Defines player/Echo interaction.
- Avoids unbounded recursion.
- Does not add permanent account power.
- Updates run statistics.
- Can be debug-granted in isolation.

---

# 16. Boss: The Null Architect

## 16.1 Purpose

The boss tests:

- Telegraph reading.
- Movement.
- Dash timing.
- Crossfire.
- Friendly/hostile Echo distinction.
- Recorded-path planning.
- Target prioritization.

## 16.2 Phase structure

| Phase | Health | Theme |
|---|---:|---|
| Observe | 100–70% | Learn core attacks |
| Imitate | 70–35% | Hostile recorded movement |
| Delete | 35–0% | Contracting arena and rear pressure |

## 16.3 Phase 1: Observe

Attacks:

- Rotating projectile fan.
- Targeted line volley.
- Drifter summons.
- Vulnerable core windows.

Rules:

- First use of each attack is slower.
- Initial cycle avoids simultaneous major attacks.
- Vulnerability windows are frequent enough to avoid inactivity.

## 16.4 Phase 2: Imitate

- Boss creates a red-black hostile recording.
- Hostile copy is delayed by roughly one second.
- It replays selected movement and curated hostile attack events.
- It does not directly clone every player projectile.
- Spawn is telegraphed.
- It cannot spawn on the player.
- It is removed during phase transition.

## 16.5 Phase 3: Delete

- Arena sectors become temporarily unsafe.
- Boss exposes rear panels.
- Hostile recordings combine with projectile waves.
- Echo is the primary rear-pressure tool.

Rules:

- A valid safe route always remains.
- Sector deletion is temporary.
- Contraction never overlaps an unreadable full-screen attack.
- Invulnerability windows are bounded.

## 16.6 Destruction sequence

1. Final hit creates brief controlled freeze.
2. Boss geometry destabilizes.
3. Hostile projectiles dissolve.
4. Lighting shifts from danger to calm.
5. Core fractures in three stages.
6. Station signal returns.
7. Results begin.

After the first victory, the sequence can be skipped.

---

# 17. Scoring

## 17.1 Sources

- Enemy kills.
- Elite kills.
- Chamber completion.
- Boss victory.
- Crossfire.
- Bulwark rear attack.
- Multi-kill.
- Near miss.
- Damage avoidance.
- Time efficiency.
- Difficulty multiplier.

## 17.2 Combo

- Kills and crossfire increase combo.
- Combo decays.
- Taking damage reduces combo.
- Combo affects score only.
- Combo feedback remains near score HUD.

## 17.3 Crossfire event

A crossfire event occurs when:

- Player and friendly Echo damage the same target within the defined window, or
- Echo attacks a Bulwark outside its shield arc shortly after player damage.

Per-target cooldown prevents farming.

---

# 18. Progression

## 18.1 Philosophy

Permanent progression unlocks breadth and expression, not raw power.

## 18.2 Allowed unlocks

- Upgrade entries.
- Cosmetic palettes.
- Trails.
- Arena decoration variants.
- Challenge modifiers.
- Lore fragments.
- Music layers.
- Overclocked difficulty.
- Expanded statistics.

## 18.3 Fresh-save availability

A new save includes:

- Relaxed and Standard.
- Eighteen of twenty-four upgrades.
- Base palette and trail.
- Core arena variants.
- Basic statistics.

Overclocked unlocks after first Standard victory.

---

# 19. Difficulty presets

## 19.1 Relaxed

- Slower projectiles.
- Longer telegraphs.
- More recovery.
- Lower score multiplier.
- Same content and mechanics.

## 19.2 Standard

- Intended balance.
- Primary QA target.

## 19.3 Overclocked

- Higher threat budget.
- Faster escalation.
- Tighter but readable timings.
- Higher score multiplier.
- No exclusive content.

Exact multipliers are in `BALANCE_SPEC.md`.

---

# 20. User interface

## 20.1 Main menu

- Start Run.
- Difficulty.
- Archive.
- Statistics.
- Settings.
- Credits.

Requirements:

- Keyboard and mouse navigation.
- Last difficulty persists.
- Start Run is default focus.
- Animated background remains low intensity.
- Audio starts only after user gesture.

## 20.2 HUD

Top-left:

- Health.
- Temporary defensive status.
- Chamber and phase progress.

Bottom-center:

- Echo readiness/cooldown.
- Dash cooldown.

Top-right:

- Score.
- Combo.
- Run timer or chamber timer.

Rules:

- Event-driven updates where practical.
- Safe margins.
- Adjustable HUD opacity within safe limits.
- Boss health appears top-center during boss only.

## 20.3 Upgrade screen

Each card shows:

- Icon.
- Name.
- Category.
- Current level.
- Exact effect.
- Next-level value.
- Tags.
- Focus state.

## 20.4 Pause screen

- Resume.
- Settings.
- Restart.
- Return to Menu.

Restart and return require confirmation.

## 20.5 Results

1. Victory/defeat.
2. Score.
3. Personal-best comparison.
4. Run statistics.
5. Unlocks.
6. Seed.
7. Restart/menu.

Counting animations can be skipped.

---

# 21. Accessibility

Version 1.0 includes:

- Master, music, and effects volume.
- Screen-shake slider.
- Reduced hit flashes.
- Reduced particles.
- High-contrast mode.
- Colorblind-safe telegraphs.
- Aim-line toggle.
- Damage-number toggle.
- Pause on focus loss.
- Gameplay key rebinding.
- Difficulty presets.
- Full keyboard menu navigation.
- Optional persistent player locator.
- Optional larger telegraph outlines.

Danger is never communicated through color alone.

---

# 22. Audio design

## 22.1 Goals

Audio clarifies:

- Telegraphs.
- Real player versus Echo.
- Friendly versus hostile copy.
- Impact.
- Intensity.
- Menu state.

## 22.2 Required sound set

1. Player shot.
2. Echo shot.
3. Standard hit.
4. Critical hit.
5. Dash.
6. Echo deployment.
7. Echo dissolution.
8. Player damage.
9. Enemy destruction.
10. Elite destruction.
11. Upgrade selection.
12. Portal opening.
13. Menu navigation.
14. Menu confirmation.
15. Boss phase transition.
16. Victory.

## 22.3 Music states

- Calm.
- Combat.
- Pressure.
- Elite.
- Boss.
- Victory.

Transitions crossfade. Restart never duplicates music layers.

---

# 23. Presentation timing

- Common scene fades: 180–450 ms.
- Combat transitions: no more than 1.2 s without control.
- First-time boss introduction may be longer.
- Boss phase transition may last up to 1.6 s.
- Repeated introductions may shorten.
- Camera does not rotate.
- Normal combat uses fixed arena framing.
- Screen shake is capped and adjustable.
- Scripted zoom returns to standard scale.

---

# 24. Fixed requirements and playtest variables

## 24.1 Fixed

- Echo as central mechanic.
- Six enemy roles.
- Three elite modifiers.
- Eight arena templates.
- Twenty-four upgrades.
- Three difficulty presets.
- One three-phase boss.
- Deterministic seeds.
- Desktop keyboard-and-mouse focus.
- Static hosting.
- No permanent stat progression.
- Full pause, restart, settings, and results flow.
- Accessibility baseline.

## 24.2 Playtest variables

- Movement acceleration.
- Dash cooldown.
- Weapon damage and fire rate.
- Echo cooldown and scalar.
- Enemy health, speed, timing, and damage.
- Threat budgets.
- Chamber duration.
- Upgrade values.
- Boss health and frequency.
- Score weights.
- Particle counts within caps.
- Music thresholds.

Tuning may not change the role of a mechanic.

---

# 25. Release design acceptance

The design is correctly realized when:

- A new player can explain Echo behavior after the tutorial.
- The first combat chamber is enjoyable without upgrades.
- Bulwark demonstrates crossfire value.
- Echo remains relevant in the boss.
- Standard successful runs average near 14 minutes for competent players.
- No chamber requires a specific upgrade.
- Different upgrade categories create distinct tactics.
- Damage remains readable at maximum intended intensity.
- Same seed reproduces generation.
- Difficulty presets preserve game identity.
- Restart begins a clean independent run.
- Progression unlocks options, not permanent strength.
- The game feels complete without deferred features.

---

# 26. Design risk register

| Risk | Consequence | Mitigation |
|---|---|---|
| Echo feels like passive damage | Hook lacks depth | Shields, rear panels, crossfire scoring, positional upgrades |
| Replay is hard to predict | Mechanic feels random | Stable duration, clear readiness, optional path preview after core stability |
| Copies become confusing | Unfair damage | Strict silhouette, trail, color, sound, and projectile separation |
| Effects hide threats | Unreadable intensity | Layer hierarchy, global caps, reduced-effects mode |
| Procedural encounters are unfair | Frustration | Authored recipes, validators, fallback recipes |
| Upgrades create runaway power | Boss invalidated | Caps, additive-first formulas, internal cooldowns |
| Crowd physics pins player | Loss of control | Soft separation, caps, spacing, contact cooldown |
| Procedural audio fatigues | Poor presentation | Mixing rules, voice caps, bounded variation |
| Scope expands early | Incomplete game | Milestone gates and version 1.0 exclusions |
