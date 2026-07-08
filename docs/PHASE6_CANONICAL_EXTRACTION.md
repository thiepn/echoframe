# Phase 6 Canonical Extraction

**Project:** ECHOFRAME: LAST SIGNAL  
**Version:** `0.6.0-elites-run-progression`  
**Milestone:** Phase 6 — Elite Modifiers and Pre-Boss Run Progression

This document extracts Phase 6 requirements from the unchanged canonical preproduction documents. Any implementation rule needed for this milestone but not explicitly fixed by those sources is labeled **PLAYTEST**.

## Canonical run order

The complete canonical run continues beyond Phase 6:

```text
Combat 1 → Upgrade → Combat 2 → Upgrade → Elite 1 → Upgrade
→ Combat 3 → Upgrade → Combat 4 → Upgrade → Elite 2 → Upgrade
→ Recovery chamber → Final upgrade → Boss → Results
```

Phase 6 deliberately stops after Elite 2:

```text
Combat 1 → Upgrade 1 → Combat 2 → Upgrade 2 → Elite 1 → Upgrade 3
→ Combat 3 → Upgrade 4 → Combat 4 → Upgrade 5 → Elite 2
→ Pre-Boss Results
```

The omitted post-Elite-2 upgrade, recovery chamber, final upgrade, and boss are not represented by placeholders. This truncation is **PLAYTEST milestone scope**, not a canonical final-run change.

## Segment targets

| Segment | Threat target | Active threat cap | New content |
|---|---:|---:|---|
| Combat 1 | 5–7 | 6 | Drifter, Sentry |
| Combat 2 | 7–10 | 8 | Lancer |
| Elite 1 | 8–11 plus elite surcharge | 8 | One eligible elite from introduced roster plus support |
| Combat 3 | 10–13 | 10 | Shard Carrier, Bulwark |
| Combat 4 | 12–16 | 12 | Suppressor |
| Elite 2 | 13–17 plus elite surcharge | 12 | Full six-enemy roster |

Canonical pacing constraints:

- opening pressure is 45–60% of peak;
- development is 65–80%;
- pressure is 90–100%;
- recovery is 25–40%;
- finale is 85–105%;
- cleanup adds no full wave;
- recovery is at least 1.5 seconds;
- at most two major executions begin in a 300 ms window;
- Sentry anticipation remains at least 500 ms;
- Lancer anticipation remains at least 550 ms.

The fixed Phase 5 arena remains in use for this milestone. Procedural arena geometry remains out of scope.

## Shared elite rules

Canonical:

- only one elite modifier applies to an enemy;
- bosses are ineligible;
- Replicating copies receive no elite modifier;
- Replicating copies cannot replicate;
- elite threat is a surcharge on the host/support composition;
- elite telegraphs use orange advanced-threat accents;
- color is supported by shape, motion, symbols, and silhouette treatment;
- modifier state must clear on death, pool release, transition, restart, and shutdown.

**PLAYTEST:** All six standard enemies are eligible for Overclocked and Resonant. All standard enemies except Suppressor are eligible for Replicating. This is explicit data rather than class-name inference.

## Overclocked

| Parameter | Canonical value |
|---|---:|
| Health | ×1.30 |
| Movement | ×1.15 |
| Anticipation | ×0.85, subject to floors |
| Recovery | ×0.80 |
| Damage | unchanged |
| Threat surcharge | +3 |
| Score metadata | ×2.0 |

Behavior and presentation:

- faster action timing and shorter recovery;
- moderate health increase;
- no projectile-count, Carrier-shard-count, Suppressor-field-strength, or damage increase;
- global anticipation floors still apply;
- orange secondary lines, trailing accents, periodic heat pulse, and chevrons on normal telegraphs;
- reduced-flash and reduced-screen-shake settings remain authoritative.

Pooling constraints:

- every scalar is applied once through a normalized activation profile;
- normal reuse after an elite must restore unmodified values and visuals.

## Replicating

| Parameter | Canonical value |
|---|---:|
| Parent health | ×1.15 |
| Trigger | first accepted crossing to ≤50% health |
| Copy health | 50% of modified parent maximum health |
| Copy damage | ×0.80 |
| Copy speed | ×0.95 |
| Threat surcharge | +4 |
| Score metadata | parent ×1.5 plus copy ×0.5 |

Canonical behavior:

- creates exactly one weakened copy;
- split is telegraphed;
- copy cannot replicate or receive another modifier;
- Suppressor and boss are ineligible;
- copy remains the same base enemy behavior and uses normal pooling.

Canonical visual identity:

- mirrored split line;
- assembly from one side;
- brief parent/copy link symbol;
- incomplete or dimmer copy.

**PLAYTEST:** A lethal accepted hit cancels an uncompleted split rather than creating an untelegraphed post-mortem copy.

**PLAYTEST:** Copy placement uses bounded seeded local candidates around the parent followed by deterministic safe sockets. Generation reserves one enemy slot before selecting the modifier.

Carrier interaction:

- a Carrier copy may release its normal bounded payload;
- subordinate caps remain enforced;
- no duplicate release may occur.

## Resonant

| Parameter | Canonical value |
|---|---:|
| Health | ×1.20 |
| Shield | 24% of maximum health |
| Shield duration | 3.5 seconds |
| Trigger radius | 300 px |
| Internal cooldown | 2.5 seconds |
| Threat surcharge | +4 |
| Score metadata | ×1.9 |

Canonical behavior:

- a nearby allied death grants a temporary finite shield;
- the elite’s own death does not trigger it;
- simultaneous deaths do not stack shield amount;
- trigger radius, duration, and cooldown use simulation time and pause correctly;
- a Resonant composition requires valid support.

Canonical visual identity:

- thin orange connection line;
- segmented orbital shield plates;
- activation flare and visible duration decay.

Damage-pipeline requirement:

- `DamageService` remains final authority;
- temporary shield absorption occurs before health loss;
- player and friendly Echo damage use identical rules;
- absorption cannot produce negative shield or damage.

**PLAYTEST:** For Bulwark + Resonant, directional Bulwark mitigation is applied first; the remaining amount is then consumed by the finite Resonant shield.

## Deterministic selection and run planning

Canonical generation is seeded, authored-recipe-driven, and threat-budgeted rather than independent random placement.

Phase 6 derives isolated streams for:

- run-plan generation;
- elite modifier selection;
- elite host selection;
- support composition;
- elite spawn selection and order;
- cosmetic variation.

Cosmetic calls cannot alter gameplay descriptors.

**PLAYTEST variety rules:** Elite 1 and Elite 2 avoid the same modifier and avoid the same host/modifier pair whenever another valid deterministic choice exists.

Run plans and encounter descriptors are immutable plain data with no Phaser references.

## Elite chamber pacing

Canonical encounter phases are opening, development, pressure, recovery, finale, cleanup, and complete. Phase 6 maps elite activation into this sequence without creating a second unrelated director.

Required milestone behavior:

- exactly one primary elite per elite segment;
- no elite in a normal combat segment;
- no unseen standard enemy first appears inside an elite encounter;
- support establishes readable counterplay;
- elite activation receives a readable 1.0–1.5 second window;
- no attack occurs during spawn;
- completion waits for the elite, required support, pending copy, projectiles, shards, and transition-critical effects to resolve or clear;
- elite segment target duration is 60–90 seconds (**PLAYTEST tuning target**).

## Upgrade boundaries

Phase 6 supplies exactly five mandatory selections:

1. after Combat 1;
2. after Combat 2;
3. after Elite 1;
4. after Combat 3;
5. after Combat 4.

There is no Phase 6 selection after Elite 2. Escape cannot skip a mandatory offer. Choices remain run-local, maxed choices are filtered, selection applies once, and chamber-limited state resets at each segment boundary.

## Accessibility

- modifier identity is not color-only;
- reduced flash attenuates heat pulses and shield flares;
- reduced screen shake prevents excessive elite feedback;
- no rapid full-screen flashing;
- spawn and attack telegraphs retain priority over decoration.

## Audio identity

Phase 6 uses manager-owned synthesized cues for elite spawn, Overclocked pulse, split warning, copy assembly, Resonant shield start/end, elite defeat, and elite-segment completion. Volume, mute, pause, and shutdown ownership remain centralized. Final recorded audio remains out of scope.

## Results and telemetry

Phase 6 records run seed/difficulty, six segment durations, five upgrades, Elite 1/2 host and modifier, elite damage/defeats, modifier trigger counts, copy outcomes, shield grant/absorption/expiry, player/Echo contribution, final health, and total duration. Score metadata is retained in definitions, but score itself is not implemented.

## Explicitly outside Phase 6

- procedural arena geometry or hazards;
- post-Elite-2 recovery and upgrades;
- Null Architect or any boss behavior;
- hostile Echoes;
- score and combo;
- permanent progression or currency;
- mobile/gamepad/online systems;
- final art, recorded sound, and adaptive music.
