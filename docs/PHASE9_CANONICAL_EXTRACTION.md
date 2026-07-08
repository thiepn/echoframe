# Phase 9 Canonical Extraction

This document separates requirements extracted from the five immutable canonical documents from Phase 9 values explicitly introduced as `PLAYTEST` decisions.

## Scoring philosophy

Canonical:

- Score is deterministic and derived from authoritative gameplay events.
- Score becomes an integer at each event.
- Combo changes score only; it never changes combat power or RNG.
- Final score contains enemy, chamber, boss, crossfire, near-miss, time, and avoidance contributions.
- Difficulty multiplication occurs once at finalization.
- Current score/combo appear in the HUD and the exact reconciled breakdown appears in Results.

## Canonical enemy score

| Enemy | Score |
|---|---:|
| Drifter | 100 |
| Sentry | 180 |
| Lancer | 280 |
| Shard Carrier | 300 |
| Bulwark | 450 |
| Suppressor | 520 |

Elite rules:

- Overclocked host: base ×2.0
- Replicating parent: base ×1.5
- Replicating copy: base ×0.5
- Resonant host: base ×1.9

Each authoritative defeated entity awards once. Parent and copy use distinct identities.

## Canonical chamber and boss score

| Event | Score |
|---|---:|
| Combat 1 | 500 |
| Combat 2 | 650 |
| Elite 1 | 900 |
| Combat 3 | 750 |
| Combat 4 | 900 |
| Elite 2 | 1200 |
| Null Architect victory | 5000 |

Recovery and upgrade scenes award no score.

## Canonical combo

- Normal kill: +1.0
- Elite parent kill: +3.0
- Crossfire: +0.5
- Near miss: +0.2
- Each additional kill inside 600 ms: +0.5
- Decay begins after 2.0 seconds.
- Multiplier: `1 + min(combo, 20) × 0.03`
- Maximum multiplier: 1.60×
- Accepted player health damage halves combo.

`PLAYTEST`:

- Score is calculated using `comboBefore`, then the event gain is applied.
- Decay rate is 1.0 combo per second.
- Combo resets when a score-bearing combat/elite/boss segment completes.
- A Replicating copy uses the normal-kill combo gain.

## Crossfire and near miss

Canonical crossfire score: `40 × stageScalar`; valid qualification comes from `CrossfireTracker`. Hostile Echoes never qualify.

`PLAYTEST` stage scalars:

| Segment | Scalar |
|---|---:|
| Combat 1 | 1.00 |
| Combat 2 | 1.10 |
| Elite 1 | 1.35 |
| Combat 3 | 1.25 |
| Combat 4 | 1.40 |
| Elite 2 | 1.65 |
| Null Architect | 2.00 |

Canonical near miss:

- 15 points
- one award per hostile projectile
- maximum four awards per second
- +0.2 combo

Line beams, sectors, contacts, friendly projectiles, and player projectiles do not qualify.

`PLAYTEST` Bulwark rear event:

- `bulwark-rear-break`
- 75 points once per Bulwark life
- no extra combo unless the event also qualifies as crossfire

## Time and avoidance

Canonical:

- Time bonus is never negative and is capped at 12% of eligible combat score.
- Avoidance uses accepted historical player health damage, unaffected by later healing.
- `avoidanceScalar = clamp(1 - damageTaken / 180, 0, 1)`
- `avoidanceBonus = round(1500 × avoidanceScalar)`

`PLAYTEST` time formula:

- Normal chamber target: 75–110 s
- Elite target: 60–90 s
- Boss target: 210–300 s
- Difficulty time-band scalars: Relaxed 1.15, Standard 1.00, Overclocked 0.90
- Weighted efficiency uses completed score-bearing segments only.
- Boss time beyond seven minutes contributes zero boss efficiency but never subtracts score.

## Final score

Canonical:

```text
subtotal =
  enemyScore + eliteScore + chamberScore + bossScore
  + crossfireScore + nearMissScore
  + timeBonus + avoidanceBonus

finalScore = round(subtotal × difficultyMultiplier)
```

Difficulty multipliers:

- Relaxed: 0.75
- Standard: 1.00
- Overclocked: 1.35

`bulwarkRearScore` is exposed separately as a documented `PLAYTEST` category and included in the subtotal when present.

## Progression

Canonical philosophy: unlock breadth and expression, never permanent combat power.

Canonical fresh-save state:

- Relaxed and Standard available
- 18 upgrades available
- 6 upgrades implemented but locked
- default cosmetic palette/trail
- no currency and no permanent stat increase

Canonical:

- Overclocked unlocks after the first valid Standard victory.
- Progression may unlock upgrades, cosmetics, lore/archive content, and statistics visibility.

`PLAYTEST` locked-upgrade mappings:

| Upgrade | Milestone |
|---|---|
| Twin Recall | First qualifying crossfire kill |
| Vector Reversal | First elite-parent defeat |
| Null Absorption | Damage-free Standard combat/elite chamber |
| Memory Burst | First full-run Null Architect reach |
| Afterburn | Standard segment at/below lower target with at least one dash |
| Deflection Pulse | Standard victory with at least 12 valid defensive hostile-object/projectile interactions |

## Cosmetics

`PLAYTEST` palettes:

- `default`
- `signal-restored`
- `memory-violet`
- `architect-fracture`

`PLAYTEST` trails:

- `default`
- `resonant-wave`
- `clean-vector`
- `station-cyan`

Cosmetics affect only player/friendly-Echo rendering. They do not change collision, damage, speed, hitboxes, threat colors, hostile Echoes, or accessibility-critical outlines.

## Archive discoveries

`PLAYTEST`:

- Standard enemies are visible by default.
- Elite, arena, boss-phase, hostile-Echo, and lore entries become discovered through authoritative encounters/milestones.
- Locked upgrades and cosmetics remain keyboard reachable and show requirements.
- Opening an Archive entry never grants a reward.

## Results, Archive, Statistics, HUD

Canonical:

- HUD top-right: score, combo/multiplier, timer.
- Results order: result, final score, personal best, category breakdown, run statistics, unlocks, seed, navigation.
- Score counting is restrained and skippable; skipping changes presentation only.
- Archive and Statistics are local, keyboard/mouse navigable, and do not instantiate gameplay objects.
- Recent runs are capped at 50.

`PLAYTEST`:

- Accuracy records require at least 50 player shots.
- Score flyouts are pooled with at most six visible entries.
- Identical low-value presentation events may merge within 120 ms without modifying the ledger.

## Persistence

Canonical:

- Valid Phase 8 saves must migrate through absent-field defaults.
- Unknown fields are ignored; invalid numerics and IDs are normalized.
- Selected cosmetics must be unlocked or fall back to `default`.
- Unlocks, records, statistics, and recent runs commit once per finalized run.
- Malformed import must not destroy the current valid save.
- Clear data returns to canonical fresh-save state.
