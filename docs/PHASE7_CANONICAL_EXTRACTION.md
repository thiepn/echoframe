# Phase 7 Canonical Extraction

This file records the canonical Phase 7 requirements extracted from the unchanged design documents. Values introduced because canon does not fully define the behavior are explicitly labeled **PLAYTEST**.

## Source priority

1. `BALANCE_SPEC.md` for numeric gameplay values.
2. `TECHNICAL_SPEC.md` for ownership and runtime architecture.
3. `GAME_DESIGN.md` for flow and system intent.
4. `ART_DIRECTION.md` for visual language.
5. `QA_CHECKLIST.md` for required validation behavior.

## Arena coordinate model

| Requirement | Canonical value |
|---|---|
| Logical resolution | 1600 × 900 |
| Combat-safe rectangle | 1440 × 810, centered |
| World scaling | World coordinates stay constant across viewport sizes |
| Viewport adaptation | Letterboxing allowed; UI respects safe margins |
| Route requirement | At least one connected route 90 px wide through hazard layouts |
| Boss arena | Fixed; excluded from normal selection |
| Immediate repetition | Same base layout cannot occur consecutively |
| Hazard repetition | Same non-none configuration cannot occur more than twice per run |
| Failure behavior | Deterministic known-safe fallback arena |

## Canonical arena templates

| ID used by implementation | Canonical identity | Runtime role |
|---|---|---|
| `open-circle` | Open circular chamber | Early combat, general combat, recovery-safe variant |
| `split-pillars` | Split central pillars | General and ranged-lane combat |
| `four-corners` | Four-corner cover | Cover and route-choice combat |
| `side-channels` | Narrow side channels | Channel pressure and route management |
| `broken-ring` | Broken ring | Interrupted circular routes |
| `offset-core` | Offset central structure | Asymmetric route pressure |
| `twin-islands` | Twin islands | Linked-platform navigation |
| `boss-chamber` | Boss chamber | Fixed Phase 8 handoff only |

Each template defines a stable ID and version, dimensions, player spawn, enemy and elite sockets, hazard sockets, solids, safe zones, navigation zones, line-of-sight metadata, tags, forbidden encounter tags, camera bounds, decoration anchors, and validated transforms.

Eligible templates support no more than four explicitly declared transforms and no more than three decoration variants. Decoration may not change gameplay geometry, sockets, hazards, line of sight, player spawn, or camera bounds.

## Arena art extraction

- Dark matte floor plates with large readable patterns.
- Clear walkable/solid distinction.
- Heavy obstacle borders, raised top surfaces, and consistent bevels.
- Visible obstacle geometry matches collision geometry.
- Decoration density decreases near important combat space.
- Floor seams and decorative lines must not resemble attack telegraphs.
- Template motifs:
  - Open circle: radial seams.
  - Split pillars: paired monoliths.
  - Four corners: corner reactors.
  - Side channels: conduit trenches.
  - Broken ring: interrupted radial architecture.
  - Offset core: asymmetrical reactor.
  - Twin islands: linked platforms.
  - Boss chamber: integrated central machine.

## Arena hazards

The canonical documents require validated hazard configurations, readable countdown presentation, a connected 90 px route, and safe-space preservation, but do not fully define normal-arena hazard mechanics. The two implemented configurations are therefore **PLAYTEST**.

### Pulse Nodes — PLAYTEST

| Parameter | Value |
|---|---:|
| Maximum simultaneous nodes | 3 |
| Warning | 900 ms |
| Warning floor | 700 ms |
| Active duration | 700 ms |
| Cycle cooldown | 3200 ms |
| Radius | 54 px |
| Damage | 14 |
| Damage frequency | One accepted hit per player per activation |

### Conduit Sweep — PLAYTEST

| Parameter | Value |
|---|---:|
| Maximum simultaneous strips | 2 |
| Warning | 1000 ms |
| Warning floor | 750 ms |
| Active duration | 650 ms |
| Cycle cooldown | 3600 ms |
| Width | 52 px |
| Damage | 16 |
| Damage frequency | One accepted hit per player per activation |

General hazard rules:

- Player-only; enemies and friendly Echo bodies are not damaged.
- Damage is resolved by `DamageService` with distinct source IDs.
- Player invulnerability, Reactive Shell, and Last Frame remain authoritative.
- Timings use simulation time and freeze during pause.
- Hazard state uses border, shape, countdown motion, and active edges rather than color alone.
- Explicit recovery windows and the recovery chamber disable hazards.
- Carrier hazards and arena hazards remain separate owners and source types.
- Simultaneous patterns preserve a connected route and, where applicable, at least 45% safe area.

## Complete run tail

Canonical Phase 7 sequence:

```text
Combat 1 → Upgrade 1
Combat 2 → Upgrade 2
Elite 1  → Upgrade 3
Combat 3 → Upgrade 4
Combat 4 → Upgrade 5
Elite 2  → Upgrade 6
Recovery Chamber → Final Upgrade 7
Boss Handoff
```

Run-plan flags:

```text
upgradeOfferCount: 7
expectedEliteCount: 2
recoveryChamberIncluded: true
bossHandoffAvailable: true
bossImplemented: false
```

The handoff uses a fixed `boss-chamber` descriptor and a distinct `BOSS_READY` state. It is not victory and does not increment victory or boss-defeat statistics.

### Recovery chamber

Canonical target duration: **20–40 seconds**.

The documents do not fully specify the recovery interaction. Implemented behavior is **PLAYTEST**:

- Known-safe open-circle descriptor, identity transform, no hazards.
- No enemies, hostile projectiles, Carrier hazards, suppression, or elite effects.
- Player movement and pause remain available.
- Completion terminal calibrates for 18 seconds.
- Strong focus assistance begins at 35 seconds.
- Accessibility-safe automatic completion is available at 40 seconds.
- Completion opens Final Upgrade Selection 7 exactly once.
- Recovery does not grant unconditional healing.
- Echo combat state is cleared and suspended during recovery.
- Regenerative Circuit may operate only through its explicit upgrade behavior and is documented as **PLAYTEST** in recovery.

## Upgrade selection rules

- Three unique options.
- Exclude maxed, locked, conflicting, or otherwise ineligible upgrades.
- Generally include at least one option outside the dominant category.
- Health at or below 35% increases Defense weight but never guarantees Defense.
- Gameplay freezes and active Echoes are cleared.
- One committed selection per offer; Escape cannot skip it.
- Selected upgrades remain run-local.
- Active Echoes retain their frozen loadout; future Echoes use the new build.

Canonical category weights:

| Category | Base weight |
|---|---:|
| Weapon | 1.00 |
| Echo | 1.00 |
| Mobility | 0.90 |
| Defense | 0.85 |

Adjustments:

- Two selections in a category: ×1.12.
- Three or more: an additional ×1.05.
- Health ≤35%: Defense ×1.30.
- Effective category weight is capped at 1.6× base.

Fresh save: 18 upgrades available and 6 fully implemented but locked.

Locked in the Phase 7 baseline save:

- Twin Recall
- Memory Burst
- Vector Reversal
- Afterburn
- Null Absorption
- Deflection Pulse

## Canonical upgrade catalog

### Weapon

| Upgrade | Max | Exact values and constraints |
|---|---:|---|
| Split Lens | 2 | L1: one side shot at 8°, all shots ×0.72. L2: side shots at ±9°, all three ×0.62. Independent crit rolls; 80 ms same-target fragment guard. |
| Piercing Signal | 3 | +1 pierce/level; current damage ×0.82 after each pierce; floor 45% original; walls terminate unless Ricochet applies. |
| Arc Relay | 3 | Every sixth qualifying hit. L1: 1 target ×0.45; L2: 2 ×0.42; L3: 3 ×0.40; 220 px; no repeat target in one chain; no recursive chain. Player/Echo counters are source-owned (**PLAYTEST** where canon is silent). |
| Fracture Round | 3 | Critical hit releases 2×0.35 / 3×0.33 / 4×0.30 fragments; speed ×0.70; lifetime 500 ms; fragments cannot crit or create fragments. |
| Compression Coil | 3 | 1.2 s continuous-fire charge; speed +12/+18/+24%; damage +8/+12/+16%; 350 ms decay; dash retains 50%. |
| Ricochet Matrix | 2 | 1 or 2 bounces; each bounce ×0.82 current damage; lifetime unchanged; minimum escape angle; 120 ms same-target guard. |

### Echo

| Upgrade | Max | Exact values and constraints |
|---|---:|---|
| Extended Memory | 3 | +0.6 s replay and +0.25 s cooldown/level; 5.3 s replay cap; recording capacity expands. |
| Twin Recall | 1 | Secondary Echo after 650 ms at 75% primary scalar; same recording/loadout; +1.0 s cooldown; active cap 2; no recursive secondary. |
| Resonant Damage | 3 | Crossfire +12/+18/+24%; 1.0 s window; 650 ms per-target cooldown; no recursion. |
| Phantom Shield | 3 | Each Echo destroys 1/3/5 hostile projectiles; capacity frozen at deployment; arena hazards unaffected. |
| Stable Projection | 3 | +0.10 Echo scalar/level: 0.65/0.75/0.85; hard cap 0.90 before conditional bonuses. |
| Memory Burst | 3 | 90 px/24, 110 px/36, 130 px/48; one hit/target; cannot crit, chain, or fragment. Normal expiration only is **PLAYTEST** where cleanup behavior is unspecified. |

### Mobility

| Upgrade | Max | Exact values and constraints |
|---|---:|---|
| Dash Wake | 3 | 450 ms trail; 18/27/36 damage; 28 px width; one hit/target/dash; Echo trail ×0.55. |
| Phase Recovery | 3 | Near-miss band 28 px outside body; Echo cooldown −120/−180/−240 ms; 500 ms internal cooldown; global cooldown floor. |
| Kinetic Charge | 3 | Above 70% movement for 1.5 s grants +8/+13/+18% fire rate; 600 ms decay; fire-rate cap. |
| Vector Reversal | 2 | Second dash if direction differs by ≥120°: 450 ms/70% or 600 ms/85%; normal cooldown begins; no third dash. |
| Slipstream | 3 | Within 46 px of an Echo grants +12/+18/+24% movement for 1.2 s; 1.5 s per-Echo cooldown; 440 px/s cap. |
| Afterburn | 3 | First shot within 300 ms after dash gains +35/+55/+75%; Split Lens side shots receive 50% of bonus; one consumption/dash; replay metadata may preserve qualifying Echo shot. |

### Defense

| Upgrade | Max | Exact values and constraints |
|---|---:|---|
| Emergency Repair | 3 | Heal 6/10/14 after each combat or elite chamber; cannot exceed maximum health; no extra recovery heal. |
| Reactive Shell | 3 | After taking damage, 15/22/30% reduction for 2.0 s; applies after triggering hit; refreshes, does not stack. |
| Null Absorption | 3 | Destroyed hostile projectile: 15%/−150 ms, 22%/−180 ms, 30%/−220 ms; 180 ms internal cooldown; player-projectile and Phantom Shield destruction qualify; deterministic gameplay RNG. |
| Last Frame | 1 | Once per combat chamber, lethal damage leaves 1 HP and grants 1.2 s invulnerability; not scripted defeat; recovery does not reset/consume it. |
| Regenerative Circuit | 3 | L1 8 s delay, 1 HP/1.6 s, cap 8; L2 7 s, 1/1.4 s, cap 12; L3 6 s, 1/1.2 s, cap 16; damage resets delay; disabled in transitions. |
| Deflection Pulse | 3 | 110/135/160 px radius and 55/75/95 px push; no damage; elites ×0.50 displacement; wall/bounds safe. Dash-start trigger is **PLAYTEST** because canon does not define the trigger. |

## Recursive-trigger and packet rules

- Chain damage cannot trigger chain.
- Fragments cannot crit or create fragments.
- Memory Burst cannot trigger Arc Relay or Fracture Round.
- Twin Recall cannot recursively create another Echo.
- One dash creates at most one Deflection Pulse and one Afterburn activation.
- Damage packets expose source upgrade, trigger depth, chain/fragment/crit eligibility.
- Trigger depth is bounded.
- All accepted damage remains centralized in `DamageService`.

## Required canonical interaction coverage

- Split Lens + Fracture Round
- Split Lens + Afterburn
- Piercing Signal + Ricochet Matrix
- Arc Relay + Echo projectiles
- Arc Relay + Fracture Round exclusion
- Extended Memory + Twin Recall
- Stable Projection + Resonant Damage
- Phantom Shield + Null Absorption
- Memory Burst chain/fragment exclusions
- Dash Wake + Echo dash playback
- Vector Reversal + Phase Recovery
- Kinetic Charge + Compression Coil
- Slipstream + Twin Recall
- Reactive Shell + Last Frame
- Regenerative Circuit + transitions/recovery
- Deflection Pulse + walls/elites
- Arena hazards + Last Frame, Reactive Shell, and invulnerability
