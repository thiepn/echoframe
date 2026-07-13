# ECHOFRAME: LAST SIGNAL

## Balance Specification

**Document type:** Canonical balance specification  
**Status:** Phase 0 authoritative input  
**Target platform:** Desktop browser, keyboard and mouse

---

## 1. Balance philosophy

ECHOFRAME is balanced around **readable pressure, decisive Echo timing, and strong replay value**.

The game should reward:

- movement precision;
- spatial awareness;
- Echo timing;
- target prioritization;
- combo maintenance;
- understanding enemy roles;
- adapting to upgrade offers;
- learning boss patterns;
- planning for the hostile Echo finale.

The game should not reward:

- idle waiting for cooldowns;
- repetitive circling without engagement;
- off-screen projectile spam;
- permanent defensive stalling;
- random upgrade dependence;
- memorizing opaque encounter scripts;
- exploiting scene transitions or pause behavior.

Balance must remain deterministic for a given:

- version;
- seed;
- difficulty;
- unlocked content set;
- initial settings that affect gameplay.

Presentation-only settings must not alter balance.

---

## 2. Reference run structure

A standard Version 1.0 run contains:

1. arena one;
2. recovery one;
3. upgrade one;
4. arena two;
5. recovery two;
6. upgrade two;
7. arena three;
8. recovery three;
9. upgrade three;
10. boss arena;
11. hostile Echo finale;
12. results.

Target standard run duration:

- 18 to 28 minutes for a competent player.

Target first successful run duration:

- 25 to 40 minutes.

Target failed run duration:

- 4 to 20 minutes depending on progression.

---

## 3. Difficulty definitions

Three initial difficulties are recommended.

### 3.1 Relaxed

Purpose:

- onboarding;
- accessibility;
- narrative discovery;
- lower mechanical pressure.

Global multipliers:

| Parameter | Multiplier |
|---|---:|
| Enemy health | 0.80 |
| Enemy damage | 0.75 |
| Enemy projectile speed | 0.85 |
| Enemy attack interval | 1.15 |
| Encounter threat budget | 0.85 |
| Elite chance | 0.65 |
| Boss health | 0.85 |
| Boss attack cadence | 0.90 |
| Score multiplier | 0.80 |

### 3.2 Standard

Purpose:

- intended baseline experience;
- primary balancing target.

Global multipliers:

| Parameter | Multiplier |
|---|---:|
| Enemy health | 1.00 |
| Enemy damage | 1.00 |
| Enemy projectile speed | 1.00 |
| Enemy attack interval | 1.00 |
| Encounter threat budget | 1.00 |
| Elite chance | 1.00 |
| Boss health | 1.00 |
| Boss attack cadence | 1.00 |
| Score multiplier | 1.00 |

### 3.3 Hard

Purpose:

- experienced players;
- score pursuit;
- stronger deterministic pressure.

Global multipliers:

| Parameter | Multiplier |
|---|---:|
| Enemy health | 1.20 |
| Enemy damage | 1.25 |
| Enemy projectile speed | 1.10 |
| Enemy attack interval | 0.90 |
| Encounter threat budget | 1.18 |
| Elite chance | 1.30 |
| Boss health | 1.20 |
| Boss attack cadence | 1.12 |
| Score multiplier | 1.25 |

All multipliers should be applied through explicit parameter resolution, not scattered conditionals.

---

## 4. Player baseline values

Recommended Standard values:

| Parameter | Value |
|---|---:|
| Maximum health | 100 |
| Move speed | 260 px/s |
| Acceleration | 1800 px/s² |
| Deceleration | 2200 px/s² |
| Dash speed | 720 px/s |
| Dash duration | 0.14 s |
| Dash cooldown | 1.20 s |
| Dash invulnerability | 0.12 s |
| Fire interval | 0.16 s |
| Projectile speed | 760 px/s |
| Projectile lifetime | 1.40 s |
| Base projectile damage | 10 |
| Base projectile pierce | 0 |
| Contact knockback | 180 px/s |
| Post-hit invulnerability | 0.55 s |

Player movement should feel responsive but not frictionless.

---

## 5. Echo baseline values

Recommended Standard values:

| Parameter | Value |
|---|---:|
| Recorded window | 4.00 s |
| Snapshot frequency | 30 Hz |
| Echo cooldown | 7.00 s |
| Active friendly Echo limit | 1 |
| Echo damage multiplier | 0.75 |
| Echo projectile speed multiplier | 1.00 |
| Echo duration | Equal to recorded span |
| Crossfire score window | 1.00 s |
| Minimum deployable history | 0.50 s |

### 5.1 Echo balance intent

The Echo should be:

- strong enough to justify deliberate setup;
- weak enough that random deployment is suboptimal;
- reliable and understandable;
- valuable for both damage and combo control;
- limited primarily by cooldown and recorded quality.

The Echo should not:

- automatically clear encounters;
- inherit live mutable upgrade state during replay;
- create unbounded projectile duplication;
- deal contact damage unless explicitly designed;
- trigger enemy rewards more than once.

---

## 6. Enemy threat costs

Threat costs drive deterministic encounter composition.

| Enemy | Threat cost |
|---|---:|
| Drifter | 1.0 |
| Sentry | 1.5 |
| Skirmisher | 1.75 |
| Bulwark | 2.5 |
| Anchor | 2.25 |
| Sniper | 2.0 |
| Splitter | 2.25 |

Elite application adds modifier threat cost.

| Elite modifier | Added threat cost |
|---|---:|
| Phase-Rush | 0.75 |
| Volatile | 0.60 |
| Bulwarked | 0.85 |
| Regenerative | 0.70 |
| Duplicating | 1.00 |
| Frenzied | 0.80 |

---

## 7. Enemy baseline values

### 7.1 Drifter

| Parameter | Standard value |
|---|---:|
| Health | 25 |
| Contact damage | 8 |
| Move speed | 105 px/s |
| Preferred range | 210 px |
| Attack interval | 1.6 s |
| Projectile damage | 6 |
| Projectile speed | 280 px/s |

Role:

- general pressure;
- path disruption;
- low individual threat.

### 7.2 Sentry

| Parameter | Standard value |
|---|---:|
| Health | 35 |
| Contact damage | 4 |
| Move speed | 20 px/s |
| Charge time | 0.75 s |
| Attack interval | 2.0 s |
| Projectile damage | 10 |
| Projectile speed | 420 px/s |

Role:

- stable firing lane;
- player displacement;
- telegraph discipline.

### 7.3 Skirmisher

| Parameter | Standard value |
|---|---:|
| Health | 30 |
| Contact damage | 7 |
| Move speed | 180 px/s |
| Strafe speed | 210 px/s |
| Preferred range | 240 px |
| Attack interval | 1.35 s |
| Projectile damage | 7 |
| Projectile speed | 360 px/s |

Role:

- flank pressure;
- combo interruption;
- mobile threat.

### 7.4 Bulwark

| Parameter | Standard value |
|---|---:|
| Health | 70 |
| Contact damage | 10 |
| Move speed | 70 px/s |
| Front damage reduction | 75% |
| Rear vulnerable arc | 120 degrees |
| Turn rate | 90 degrees/s |
| Attack interval | 1.8 s |
| Projectile damage | 8 |
| Projectile speed | 300 px/s |

Role:

- positioning check;
- Echo crossfire target;
- lane blocker.

### 7.5 Anchor

| Parameter | Standard value |
|---|---:|
| Health | 45 |
| Contact damage | 5 |
| Move speed | 55 px/s |
| Support range | 280 px |
| Heal per second | 4 |
| Damage buff | 15% |
| Support pulse interval | 0.5 s |

Role:

- target-priority enforcement;
- support network;
- anti-stall pressure.

### 7.6 Sniper

| Parameter | Standard value |
|---|---:|
| Health | 28 |
| Contact damage | 4 |
| Move speed | 60 px/s |
| Preferred range | 520 px |
| Charge time | 1.20 s |
| Attack interval | 2.8 s |
| Projectile damage | 22 |
| Projectile speed | 900 px/s |

Role:

- long-range threat;
- movement timing check;
- telegraph reaction.

### 7.7 Splitter

| Parameter | Standard value |
|---|---:|
| Health | 42 |
| Contact damage | 8 |
| Move speed | 110 px/s |
| Attack interval | 1.7 s |
| Projectile damage | 7 |
| Split child health | 14 |
| Split child count | 2 |
| Split child threat | 0.75 each |

Role:

- target sequencing;
- space multiplication;
- anti-area-spam check.

---

## 8. Encounter threat budgets

Base Standard threat budgets per arena:

| Arena | Encounter | Threat budget |
|---|---:|---:|
| 1 | 1 | 5.0 |
| 1 | 2 | 6.0 |
| 1 | 3 | 7.5 |
| 2 | 1 | 7.0 |
| 2 | 2 | 8.5 |
| 2 | 3 | 10.0 |
| 3 | 1 | 9.0 |
| 3 | 2 | 11.0 |
| 3 | 3 | 13.0 |

Difficulty multipliers apply afterward.

Encounter generation rules:

- at least two enemy families after the first encounter;
- no more than two Snipers in one encounter by default;
- no more than one Anchor in early encounters;
- no more than one Duplicating elite per encounter;
- Splitter child threat must be included in effective pressure tests;
- avoid impossible combinations in constrained arenas;
- avoid repeating the exact previous composition where alternatives exist.

---

## 9. Elite frequency

Standard target frequency:

| Arena | Elite chance per eligible enemy |
|---|---:|
| 1 | 8% |
| 2 | 14% |
| 3 | 20% |
| Boss approach | 24% |

Rules:

- first encounter cannot contain an elite on Relaxed;
- no more than one elite in Arena 1 encounters;
- no more than two elites in Arena 2;
- no more than three elites in Arena 3;
- incompatible modifier/base-family pairs must be filtered deterministically;
- elite threat cost must fit encounter budget.

---

## 10. Upgrade offer rules

### 10.1 Offer size

- three cards per upgrade screen;
- no duplicate IDs in one offer;
- exhausted stackable upgrades are removed;
- mutually exclusive upgrades are filtered;
- one deterministic replacement pass is allowed if the pool is too small.

### 10.2 Category weighting

Base offer weights:

| Category | Weight |
|---|---:|
| Player offense | 1.0 |
| Echo offense | 1.0 |
| Defense | 0.85 |
| Utility | 0.90 |
| Special | 0.35 |

Pity rules:

- if the player has no defensive upgrade after two selections, increase defense weight by 60%;
- if the player has no Echo upgrade after two selections, increase Echo weight by 50%;
- do not guarantee a specific card;
- pity state is deterministic and run-local.

### 10.3 Stack limits

| Upgrade type | Default max stacks |
|---|---:|
| Flat damage | 5 |
| Fire-rate | 4 |
| Projectile speed | 3 |
| Health | 4 |
| Echo damage | 4 |
| Echo cooldown | 3 |
| Duration | 3 |
| Secondary Echo | 1 |
| Revival | 1 |
| Mutual-exclusion branch | 1 |

---

## 11. Upgrade value targets

### 11.1 Player offense

Recommended increments:

- damage: +12% per stack;
- fire rate: +10% effective rate per stack;
- projectile speed: +12% per stack;
- pierce: +1 per stack, max 2;
- projectile size: +8% per stack;
- crit chance if used: +5 percentage points per stack, capped at 25%.

### 11.2 Echo offense

- Echo damage: +15% per stack;
- Echo cooldown: -8% per stack;
- Echo duration: +12% per stack;
- replay speed: +6% per stack, capped to avoid excessive event compression;
- secondary Echo: +1 active deployment, with 40% reduced damage on the secondary;
- Echo pierce: +1, max 1;
- synchronized burst: one additional projectile per recorded shot at 35% damage.

### 11.3 Defense

- maximum health: +20;
- heal after arena: +15 health;
- dash cooldown: -10% per stack;
- dash invulnerability: +0.03 s per stack, capped;
- damage reduction: 6% per stack, max 18%;
- emergency shield: one hit, 25 s internal cooldown;
- revival: restore 35 health once per run.

### 11.4 Utility

- move speed: +8% per stack;
- combo grace: +0.20 s per stack;
- score pickup radius if pickups exist: +20%;
- upgrade reroll: +1 per run;
- chamber recovery duration: +1.0 s;
- hostile Echo vulnerability: +0.25 s per stack.

### 11.5 Risk and special upgrades

Examples:

- Glass Signal: +35% player and Echo damage, -25 maximum health.
- Feedback Loop: Echo cooldown reduced by 25%, player fire rate reduced by 10%.
- Overclocked Trace: replay speed +20%, Echo damage -10%.
- Shared Core: player and Echo projectiles gain +1 pierce, incoming damage +12%.

Risk upgrades must be clearly communicated.

---

## 12. Recovery balance

Base recovery after each arena:

- heal 20 health;
- minimum recovery duration 3.0 s;
- no enemies active;
- Echo cooldown continues;
- combo ends;
- temporary encounter effects clear;
- persistent run upgrades remain.

Recovery upgrades may increase healing but should not fully reset the player after every arena.

---

## 13. Combo and scoring balance

### 13.1 Combo meter

Base values:

| Parameter | Standard value |
|---|---:|
| Meter maximum | 100 |
| Meter gained per hit | 8 |
| Meter gained per kill | 16 |
| Meter gained per crossfire event | 20 |
| Decay delay | 1.25 s |
| Decay rate | 28 per second |
| Damage taken penalty | Reset to 0 |

### 13.2 Multiplier thresholds

| Meter | Multiplier |
|---|---:|
| 0–24 | ×1.0 |
| 25–49 | ×1.5 |
| 50–74 | ×2.0 |
| 75–99 | ×3.0 |
| 100 | ×4.0 |

### 13.3 Score values

| Event | Base score |
|---|---:|
| Drifter defeat | 100 |
| Sentry defeat | 140 |
| Skirmisher defeat | 160 |
| Bulwark defeat | 240 |
| Anchor defeat | 220 |
| Sniper defeat | 200 |
| Splitter defeat | 210 |
| Split child defeat | 55 |
| Elite bonus | +150 |
| Crossfire event | +75 |
| No-hit encounter | +300 |
| Arena clear | +500 |
| Boss phase clear | +750 |
| Boss defeat | +2500 |
| Hostile Echo defeat | +1800 |
| Challenge completion | +400 to +1000 |

Score formula:

```text
awarded_score = floor(base_score × current_combo_multiplier × difficulty_score_multiplier)
```

### 13.4 Score integrity

- each enemy awards defeat score exactly once;
- child enemies award child score only;
- elite bonus awards once;
- boss phase rewards award once;
- paused time cannot extend combo grace;
- score does not depend on rendering frame rate;
- damage from player and Echo cannot double-award the same event.

---

## 14. Boss balance

Recommended Standard values:

| Parameter | Value |
|---|---:|
| Maximum health | 1800 |
| Phase 1 threshold | 100%–67% |
| Phase 2 threshold | 66%–34% |
| Phase 3 threshold | 33%–0% |
| Contact damage | 14 |
| Heavy attack damage | 22 |
| Projectile damage | 10–16 |
| Base attack cadence | 1.4 s |
| Vulnerability window after major attack | 0.9 s |

Boss phase goals:

- Phase 1 teaches sweep and zone patterns;
- Phase 2 adds crossing interference and spawned threats;
- Phase 3 increases density but retains readable safe paths;
- the final 10% should be intense but not randomly lethal.

Boss fight target duration:

- Relaxed: 3–5 minutes;
- Standard: 3–6 minutes;
- Hard: 4–7 minutes.

---

## 15. Hostile Echo balance

The hostile Echo replays selected prior-run data.

Recommended values:

| Parameter | Standard value |
|---|---:|
| Health | 350 |
| Damage multiplier from recorded loadout | 0.60 |
| Replay loop duration | recorded span + dead time |
| Dead-time vulnerability | 1.25 s |
| Maximum projectile count contribution | 60 |
| Dash contact damage | 12 |
| Loop reset telegraph | 0.45 s |

Selection rules:

- prefer prior completed runs;
- exclude corrupted or unsupported versions;
- normalize unsupported upgrades;
- cap extreme fire-rate and projectile-count combinations;
- preserve broad route identity;
- fall back to deterministic built-in replay when necessary.

The hostile Echo should be dangerous because of recognizable behavior, not inflated health alone.

---

## 16. Progression unlock pacing

Suggested unlock targets:

| Milestone | Unlock |
|---|---|
| Complete tutorial | Standard difficulty, first Echo upgrade family |
| Clear Arena 1 | Archive run entries |
| Clear Arena 2 | New arena variation |
| First boss encounter | Boss codex entry |
| First full victory | Hard difficulty |
| Defeat hostile Echo | New palette and lore fragment |
| Reach ×4 combo | Combo-themed trail |
| Win without revival | High-signal palette |
| Complete challenge modifier | Additional upgrade family |

Unlocks must not create mandatory power grind.

---

## 17. Challenge modifiers

Challenge modifiers are optional and unlock progressively.

Examples:

### 17.1 Thin Signal

- maximum health reduced by 35%;
- score multiplier +30%.

### 17.2 Delayed Echo

- Echo cooldown +25%;
- Echo damage +35%;
- score multiplier +15%.

### 17.3 Elite Channel

- elite chance doubled;
- elite score bonus doubled;
- score multiplier +20%.

### 17.4 No Recovery

- no inter-arena healing;
- score multiplier +35%.

Challenge modifiers must be deterministic and clearly displayed.

---

## 18. Projectile and pool limits

Hard runtime limits:

| Pool | Maximum active |
|---|---:|
| Player projectiles | 120 |
| Friendly Echo projectiles | 120 |
| Enemy projectiles | 180 |
| Boss projectiles | 240 |
| Split children | 24 |
| Active friendly Echoes | 3 |
| Active enemies | 48 |
| Active elites | 8 |
| Active effect objects | 256 |

On exhaustion:

- reuse the oldest safe inactive object if possible;
- otherwise reject the spawn deterministically;
- record a diagnostic counter;
- never allocate unbounded replacements.

---

## 19. Anti-stall rules

The game must discourage waiting without arbitrary instant punishment.

Anti-stall mechanisms:

- encounters activate only when entered;
- Echo cooldown continues but no score is gained while idle;
- Anchor support and Sniper pressure punish distant waiting;
- boss patterns continue on deterministic cadence;
- hostile Echo loops prevent indefinite safe spacing;
- recovery zones have finite duration;
- no encounter should require waiting for a random opening.

---

## 20. Deterministic balancing rules

For a given run seed and unlocked content:

- arena sequence is fixed;
- encounter compositions are fixed;
- elite assignments are fixed;
- upgrade offers are fixed;
- boss pattern sequence is fixed;
- hostile Echo source selection is fixed where save state is unchanged;
- score event resolution is fixed;
- presentation settings do not alter simulation.

Random draws must use named stream keys.

Suggested streams:

```text
run.route
run.arena
run.encounter
run.elite
run.upgrade
run.boss
run.hostile_echo
run.cosmetic
```

---

## 21. Balance telemetry

Debug and soak telemetry should record:

- encounter duration;
- damage taken;
- damage dealt by player;
- damage dealt by Echo;
- Echo deploy count;
- Echo active uptime;
- crossfire events;
- combo peak;
- score event count;
- elite count;
- projectile pool peaks;
- boss phase duration;
- hostile Echo loop count;
- upgrade selections;
- run outcome.

Telemetry should be exportable in development builds.

---

## 22. Soak expectations

Required simulations:

### 22.1 Seed matrix

- at least 500 deterministic seeds per difficulty;
- record impossible encounters;
- record threat-budget violations;
- record empty offers;
- record duplicate offers;
- record pool exhaustion;
- record boss completion.

### 22.2 Long-session soak

- at least 60 minutes automated active simulation;
- no unbounded object growth;
- no listener growth;
- no collider growth;
- no duplicate scene finalization;
- no save corruption;
- no NaN coordinates;
- no negative health or threat values without explicit allowance.

### 22.3 Upgrade matrix

- validate all pairwise upgrade combinations;
- validate max-stack states;
- validate mutual exclusion;
- validate secondary Echo limits;
- validate projectile count caps;
- validate revival once-only behavior.

---

## 23. Balance acceptance ranges

Standard difficulty target metrics across representative automated and human runs:

| Metric | Target range |
|---|---|
| Arena 1 clear rate among new players | 60–80% |
| Arena 2 reach rate | 40–65% |
| Boss reach rate | 20–45% |
| First full victory within 10 runs | 15–35% |
| Echo damage share | 20–45% |
| Average Echo deployments per arena | 2–6 |
| Average peak combo multiplier | ×1.5–×3.0 |
| Boss fight duration | 3–6 minutes |
| Hostile Echo fight duration | 1.5–4 minutes |

These are directional targets, not guarantees.

---

## 24. Failure conditions

Balance fails if:

- first-run victory is nearly impossible on Relaxed;
- Echo deployment is weaker than ordinary firing in most cases;
- waiting for Echo cooldown becomes the dominant strategy;
- one upgrade path is mandatory;
- one enemy combination is consistently unavoidable;
- boss phase three relies on random projectile overlap;
- hostile Echo inherits uncapped historical values;
- score can be duplicated;
- difficulty changes break determinism;
- visual settings alter simulation timing;
- pools exhaust during ordinary intended play;
- recovery fully erases all attrition;
- Hard difficulty is primarily health inflation.

---

## 25. Version 1.0 balance freeze

Before Version 1.0 release:

- all baseline values must be centralized in data definitions;
- no scene may contain hidden balance literals;
- all difficulty multipliers must be documented;
- all upgrade values must be documented;
- all elite modifiers must have explicit caps;
- score formulas must be tested;
- boss thresholds must be tested;
- save migration must preserve unlocked progression;
- replay compatibility must normalize historical loadouts;
- all release builds must report version and balance data version.
