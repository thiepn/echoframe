# Phase 5 Canonical Extraction

**Project:** ECHOFRAME: LAST SIGNAL  
**Milestone:** Phase 5 — Core Enemy Roster and Encounter Director

This document records the values extracted from the unchanged canonical preproduction documents. Values or algorithms introduced only to make the two-chamber Phase 5 slice executable are labeled **PLAYTEST**. The canonical documents themselves are not modified.

## Shared enemy contract

All standard enemies follow these canonical rules:

- spawn animation lasts 450–900 ms and cannot deal damage;
- ranged attacks remain locked for 900 ms after spawn completion where specified;
- attacks expose anticipation, lock, execution, and recovery;
- pause freezes attack, hazard, cooldown, and recovery timers;
- death cancels pending attacks;
- transitions remove enemies, hazards, and hostile projectiles;
- bodies are smaller than visual silhouettes and use soft separation;
- repeated entities and projectiles are pooled;
- difficulty is applied once to activation values and timing, never again to threat cost;
- telegraphs use shape and motion in addition to color.

## Enemy definitions

### Drifter

| Field | Canonical value |
|---|---|
| Role | Basic pursuer / pressure |
| Health | 32 |
| Movement | 145 px/s pursuit |
| Damage | 12 contact; 14 lunge |
| Attack timing | 600 ms anticipation; 460 px/s lunge for 320 ms; 650 ms recovery |
| Threat cost | 1 |
| Telegraph | Widening wedge; direction locks before execution |
| Recovery/counterplay | Miss creates a visible punishment window |
| Visual identity | Compact forward wedge, two rear fins, forward core; forward-axis death split |
| Audio identity | **PLAYTEST:** restrained pursuit/lunge cues; no enemy-specific canonical waveform is prescribed |
| Difficulty interaction | Enemy movement and attack timing use the selected difficulty profile; canonical timing floors remain enforced |
| Special mechanics | Per-source contact-damage cooldown; cannot permanently pin in groups |
| Pooling constraints | Reset lunge state, locked direction, timers, contact history, health, body, renderer, and event IDs on reuse |

### Sentry

| Field | Canonical value |
|---|---|
| Role | Ranged pressure |
| Health | 48 |
| Movement | 105 px/s; seeks 420–620 px preferred range |
| Damage/projectile | Three projectiles; 11 damage each; 430 px/s; 110 ms burst spacing |
| Attack timing | 700 ms telegraph; 120 ms lock; 950 ms recovery; 900 ms post-spawn attack lockout |
| Threat cost | 2 |
| Telegraph | Dotted → segmented → solid aim line; lock pulse and audio tick; tracking stops after lock |
| Recovery/counterplay | Reposition during tracking/telegraph; attack requires line of sight |
| Visual identity | Anchored central eye with three stabilizing arms; inward-fold death |
| Audio identity | Canonical lock tick; **PLAYTEST:** procedural burst and death cues |
| Difficulty interaction | Telegraph cannot fall below the canonical 500 ms global floor; projectile/movement pressure uses the chosen profile |
| Special mechanics | No firing without line of sight; no immediate attack after spawn |
| Pooling constraints | Reset burst index, line lock, spawn lockout, target, timers, projectiles, health, and renderer on reuse |

### Lancer

| Field | Canonical value |
|---|---|
| Role | Space-cutting charger / burst |
| Health | 72 |
| Movement | 125 px/s outside attack |
| Damage | 22 per charge; one valid damage application per attack |
| Attack timing | 760 ms rectangular-lane telegraph; 140 ms lock; 760 px/s charge; maximum 620 px; 1000 ms vulnerable recovery |
| Threat cost | 3 |
| Telegraph | Body-aligned rectangular lane remains visible through direction lock |
| Recovery/counterplay | Leave the committed lane, then punish the bent/embedded recovery posture |
| Visual identity | Elongated spear body, rear stabilizers, red trail with orange front edge, axial fracture death |
| Audio identity | **PLAYTEST:** separate anticipation, lock, execution, wall-stop, and recovery cues; canonical documents prescribe cue separation but not waveform values |
| Difficulty interaction | Anticipation never falls below 550 ms; movement and recovery use the selected profile |
| Special mechanics | Direction commits before movement; stops at wall or maximum distance; invalid endpoint cancels/reschedules; intersecting charges require an authored safe recipe |
| Pooling constraints | Reset committed direction, planned endpoint, lane, hit-once set, state timers, body velocity, health, and renderer on reuse |

**PLAYTEST implementation choice:** a valid charge path must retain at least 140 px after wall/arena truncation. The deterministic path evaluator uses the authored arena bounds and internal walls, prevents non-finite endpoints, and continuously revalidates the lane during anticipation.

### Shard Carrier

| Field | Canonical value |
|---|---|
| Role | Delayed area control / spawner |
| Health | 90 |
| Movement | 82 px/s; maintains 330–500 px preferred range |
| Payload | Up to three subordinate shards |
| Hazard | 14 damage; 54 px radius; 900 ms activation delay; 4.0 s active duration |
| Threat cost | 3, including subordinate pressure |
| Telegraph | Visible orbiting satellites, release trajectories, triangular floor markers, inward-closing activation rings |
| Recovery/counterplay | Kill placement determines the hazard layout; activation delay preserves an escape opportunity |
| Visual identity | Hexagonal body with three triangular orbiting satellites; orbit-collapse death/release |
| Audio identity | **PLAYTEST:** separate release, arming, activation, expiry, and cleanup cues; no canonical waveform values are prescribed |
| Difficulty interaction | Movement/timing use the selected profile without multiplying threat cost or shard count |
| Special mechanics | Releases unresolved shards exactly once on death; hazard layout cannot block every route |
| Pooling constraints | Dedicated bounded subordinate pool; reset owner, release flag, travel/arming/active timers, damage state, body, renderer, and target coordinates; clear all unresolved objects on restart/transition/exit |

**PLAYTEST implementation choice:** deterministic placement rotates candidate layouts by owner ID, rejects arena/wall overlap, player-proximity violations, inadequate shard spacing, and layouts without a 90 px escape route. It never exceeds three hazards and emits structured diagnostics when a reduced valid layout is required.

### Bulwark

| Field | Canonical value |
|---|---|
| Role | Directional defense / defender |
| Health | 150 |
| Movement | 72 px/s slow approach |
| Damage | 16 contact |
| Shield | 150° protected arc; 0.22 frontal damage scalar; 20° side transition on each edge; 95°/s turn |
| Stagger | 45 rear damage within 1.5 s produces 900 ms stagger |
| Threat cost | 4 |
| Telegraph | Floor-visible crescent shield, limited shield lag, flattened protected impacts, exposed rear core |
| Recovery/counterplay | Attack from rear; sustained rear pressure opens stagger; frontal protection is resistance, never immunity |
| Visual identity | Broad crescent shield with smaller rear core; shield-collapse death |
| Audio identity | **PLAYTEST:** protected-impact, vulnerable-hit, stagger, and shield-collapse cues; no canonical waveform values are prescribed |
| Difficulty interaction | Health/movement/turn/recovery use the selected profile where defined; frontal scalar remains explicit and readable |
| Special mechanics | Shield tracks the real player, not Echoes; player and Echo packets use the same directional modifier; critical and piercing metadata remain in the centralized packet pipeline |
| Pooling constraints | Reset shield facing, rear-damage window, stagger state, packet modifier state, timers, health, body, and renderer on reuse |

### Suppressor

| Field | Canonical value |
|---|---|
| Role | Priority disruption / control |
| Health | 120 |
| Movement | 68 px/s; relocates every 5–8 s |
| Damage | 10 contact; low direct offense |
| Field | 210 px radius; 800 ms setup; Echo cooldown-recovery scalar ×0.45 |
| Threat cost | 5 |
| Telegraph | Central ring with four emitters; persistent patterned boundary, inward arrows, scan distortion, setup pulse |
| Recovery/counterplay | Leave the field or eliminate the Suppressor; existing Echo playback remains functional |
| Visual identity | Ring projector with floating inner core; inward field-collapse death |
| Audio identity | **PLAYTEST:** setup, activation, suppressed-state, relocation, and collapse cues; no canonical waveform values are prescribed |
| Difficulty interaction | Movement/setup/relocation use selected-profile timing while cooldown recovery never reaches zero |
| Special mechanics | Strongest field only; fields do not stack; no direct mutation of Echo internals; cannot appear in tutorial or canonical Combat 1 |
| Pooling constraints | Explicit modifier-source ownership; remove source immediately on death/deactivation/restart/transition/exit; reset state, relocation target, timers, health, body, and renderer |

## Difficulty profiles and timing floors

- **Relaxed:** reduced enemy movement/projectile pressure; longer anticipation, recovery, recovery windows, and player hit invulnerability.
- **Standard:** canonical base values.
- **Overclocked:** increased movement/projectile pressure and shorter anticipation/recovery/spawn intervals subject to floors.
- Sentry telegraph remains at least 500 ms.
- Lancer telegraph remains at least 550 ms.
- At most two major attack executions may occur inside a 300 ms window.
- Player post-hit invulnerability remains at least 550 ms.

## Spawn, entity, and hazard constraints

- Spawn safety radius: Relaxed 300 px, Standard 260 px, Overclocked 230 px.
- Enemies do not damage during spawn.
- Ranged firing positions require a valid line.
- Lancer requires valid attack space.
- Large enemies require sufficient wall clearance.
- Carrier layouts retain at least one 90 px route.
- Suppressor fields use strongest-only ownership.
- Global technical hard limits remain 30 simultaneous enemies and 240 hostile projectiles.
- All subordinate objects, enemies, projectiles, Echoes, and modifier sources are cleared on lifecycle transitions.

## Encounter and run adaptation — PLAYTEST

The canonical final game specifies a longer staged run. Phase 5 retains the validated two-chamber vertical slice:

| Chamber | Roster | Pacing | Target threat |
|---|---|---|---|
| 1 | Drifter, Sentry, Lancer | INTRO → BUILD → PRESSURE → RECOVERY → CLIMAX | 5, 7, 9, 0, 9 |
| 2 | Full six-enemy roster | INTRO → BUILD → PRESSURE → RECOVERY → CLIMAX | 8, 10, 13, 0, 18 |

Phase 5 composition caps, role caps, projectile-pressure estimates, control/spawner/body-block limits, pattern weights, deterministic fallback recipes, and anti-repeat history are conservative **PLAYTEST** safeguards below canonical hard limits. Recovery phases last at least 1.5 seconds. Chamber 2 introduces Shard Carrier, Bulwark, and Suppressor separately before permitting a full-roster finale.

## Resolved implementation interpretations

- `DamageService` remains the sole final damage authority. Bulwark modifies a packet before resolution rather than applying health changes directly.
- Carrier shards are subordinate hazards, not standard enemies, and use a dedicated bounded pool/manager.
- Suppression modifies only Echo cooldown recovery. It does not cancel recording, deployment readiness, or an existing Echo.
- Encounter threat represents combat pressure, not health, enemy count, or difficulty-scaled stats.
- Named seeded substreams isolate composition, spawn selection, spawn order, recovery variation, and cosmetic randomness so cosmetic calls cannot change gameplay descriptors.
