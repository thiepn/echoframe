# Phase 8 Canonical Extraction

This document extracts Phase 8 requirements from the five immutable canonical documents. Rules introduced only by the implementation prompt or by tuning are explicitly marked **PLAYTEST**.

## Boss identity and purpose

The Null Architect is an arena-integrated machine with a black-red central core, four modular panels, a rotating outer ring, exposed apertures, and floor-connected circuitry. Its approximate visual diameter is 300–420 px, and a vulnerable target must be at least 40 px.

The encounter tests telegraph reading, movement, dash timing, crossfire, friendly/hostile Echo distinction, recorded-path planning, and target prioritization. The Echo must remain tactically relevant, particularly through rear pressure and crossfire, without making the fight require a specific upgrade.

## Standard base values

| Parameter | Canonical Standard value |
|---|---:|
| Total health | 3600 |
| Observe | 3600–2520 / 100–70% |
| Imitate | 2520–1260 / 70–35% |
| Delete | 1260–0 / 35–0% |
| Contact damage | 20 |
| Add threat cap | 8 |
| Maximum normal invulnerable interval | 2.8 s |
| Minimum vulnerable interval | 3.5 s |
| Target fight duration | 210–300 s |
| Major telegraph floor | 600 ms unless a repeated simple pattern |
| Major execution concurrency | at most two starts in 300 ms |
| Player post-hit invulnerability floor | 550 ms |
| Maximum Standard boss hit | 35 base damage |

Difficulty is applied once. Existing difficulty health, hostile-projectile-speed, anticipation, recovery, and player post-hit-invulnerability multipliers are mapped where semantically valid; this mapping is **PLAYTEST** because the canonical documents do not define a separate complete boss difficulty table.

## Phase 1 — Observe

Required mechanics:

- rotating projectile fan;
- targeted line volley;
- 2–4 Drifter summons with 700 ms assembly;
- vulnerable-core windows.

The first use of each attack is slower, the initial cycle avoids simultaneous major attacks, and vulnerability windows occur frequently enough to avoid inactivity.

### Rotating fan

- damage 12;
- speed 330 px/s;
- 8–12 projectiles per emission;
- guaranteed angular gaps.

**PLAYTEST:** two to three emissions, 380–480 ms spacing, 55–80° gaps, 950 ms first warning, and at least 650 ms repeated warning after floors.

### Targeted line volley

- 800 ms telegraph;
- 150 ms locked position;
- two lines initially, up to three later;
- damage 18.

The canonical documents do not define whether lines are beams or projectile lanes. The implementation uses a 46 px, 220 ms, player-only line beam with one accepted hit per line activation; this is **PLAYTEST** and explicitly non-projectile/unblockable.

## Phase 2 — Imitate

The boss creates a red-black hostile recording. It appears after roughly one second, uses a 700 ms warning, lives 3.5–4.5 seconds, deals 10–14 projectile damage, and inherits no player upgrades. One copy is active initially; two are allowed only late in the phase without another major attack. It cannot spawn on the player and is removed at transition.

The hostile copy is not a recolored friendly Echo. Canonical visual requirements include a hooked/inverted silhouette, jagged trail, solid hostile sigil, distorted low audio, red-shell/dark-core projectiles, and mechanical interpolation. Grayscale distinction is required.

**PLAYTEST conversion:** replay 3.5–4.0 seconds of recent movement, preserve available 30 Hz ordering, convert selected fire events only, cap converted shots at five per second, ignore all player upgrade payloads, and use a deterministic fallback path when history is insufficient.

**PLAYTEST spawn distance:** at least 260 px from the player, with deterministic 180–320 px path offsets and a known-safe chamber socket fallback.

## Phase 3 — Delete

Required mechanics:

- temporary unsafe arena sectors;
- exposed rear panels;
- hostile recordings combined with projectile waves;
- connected safe route at all times;
- Echo-relevant rear pressure;
- bounded invulnerability.

### Sector state machine

```text
SAFE → WARNING → DISABLED → RESTORING → SAFE
```

Canonical values:

- warning 1.0 s;
- disabled 2.5–3.5 s;
- at least 45% safe area;
- connected safe region;
- 16 damage per tick;
- 700 ms tick interval;
- 250 ms entry grace;
- no overlap before restoration.

The implementation uses six authored fixed-chamber patterns and validates a 90 px route before activation. Pattern geometry and restoration timing not defined canonically are **PLAYTEST**.

### Rear panels

Four modular panel hit zones correspond to visible boss geometry. Closed panels reject damage; open panels are at least 40 px and accept player/friendly-Echo damage through `DamageService`.

**PLAYTEST selection:** sample player angle at lock time, prefer one or two far-side panels, hold selection for 3.5–4.5 seconds, reject targets inside deleted sectors, and preserve both a direct player route and plausible Echo crossfire route.

## Vulnerability and phase gates

Vulnerability is geometrically communicated through `CLOSED → OPENING → VULNERABLE → CLOSING → CLOSED`. Player and friendly-Echo projectiles use identical acceptance rules.

**PLAYTEST cycle:** one or two closed attacks, 700–1000 ms opening, 3.5–5.0 s vulnerable, and 500–800 ms closing.

The canonical documents require strong builds not to skip all mechanics but do not specify exact phase gates. **PLAYTEST gates** require:

- Observe: one fan, one line volley, and one vulnerability window;
- Imitate: one hostile-Echo lifecycle and one vulnerability window;
- Delete: one sector cycle and one rear-panel exposure.

Threshold-crossing damage clamps at the phase boundary until the gate is complete, with no carry-over damage.

## Destruction and outcome

Canonical sequence:

1. controlled final-hit freeze;
2. geometry destabilization;
3. hostile projectile dissolve;
4. danger lighting shifts to calm;
5. three-stage core fracture;
6. station signal return;
7. results.

Visual order: ring stops, panels desynchronize, core cracks white, red drains to black, cyan lines reactivate, core fractures, background settles. The first victory is unskippable; later victories may skip while performing identical cleanup and record finalization.

**PLAYTEST timing:** 90–130 ms freeze, 700 ms destabilization, three 450 ms fractures, 900–1200 ms settle, roughly 3.5–5.0 seconds total.

The canonical documents do not define same-tick lethal ordering. **PLAYTEST tie rule:** accepted damage sequence order decides; if boss defeat and player lethal damage are accepted in the same simulation tick with boss defeat first, victory wins and player health is clamped to one for destruction. An earlier player defeat rejects later boss damage.

## UI, audio, statistics, and accessibility

Boss-only HUD requirements:

- top-center Null Architect health bar;
- Observe/Imitate/Delete label;
- vulnerable, closed, transition, hostile-Echo, and sector state where useful;
- existing player health, status effects, and friendly-Echo readiness.

Audio remains owned by `AudioManager` and includes intro, core, fan, line, summon, hostile Echo, sector, panel, phase, final-hit, fracture, signal-return, and victory cues, with one boss music state and phase-intensity changes.

Required accessibility behavior:

- reduced flashes, particles, and shake preserve all gameplay cues;
- high contrast strengthens apertures, projectiles, silhouettes, and sector borders;
- larger outlines apply to hostile Echoes, panels, and sectors;
- no color-only distinction or rapid full-screen flashing;
- camera never rotates;
- pause and focus loss freeze simulation and neutralize held input.

Required records include boss/run duration, phase timing, death cause/phase/location, player/friendly-Echo damage split, crossfire, projectile interception/density, hostile-Echo activity, sectors, summons, Last Frame use, destruction viewed/skipped, and exactly-once victory/boss-defeat persistence.

## Explicitly deferred canonical systems

The canonical documents contain later scoring and combo requirements. Phase 8 intentionally does not implement score, combo, permanent power awards, multiple bosses, mobile controls, gamepad controls, or online systems, matching the authoritative Phase 8 scope.
