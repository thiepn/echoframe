# ECHOFRAME: LAST SIGNAL — Balance Specification

**Document:** `BALANCE_SPEC.md`  
**Version:** 1.0-preproduction  
**Authority:** Starting values, formulas, caps, difficulty multipliers, upgrade stacking, pacing, and balance targets  
**Notation:** **PT** = playtest variable; **FIXED** = structural rule

---

# 1. Balance philosophy

The balance model must preserve:

- Responsive control.
- Readable threats.
- Echo relevance.
- Distinct enemy roles.
- Build variety.
- Bounded power growth.
- A 12–18 minute successful run.
- A boss that remains meaningful across strong builds.
- No mandatory upgrade.
- No hidden adaptive difficulty.

Challenge should arise from decision combinations, not simultaneous inflation of every enemy variable.

---

# 2. Global formulas

## 2.1 Stat pipeline

```text
final =
  clamp(
    (base + flatAdditions)
    × (1 + summedPercentageAdditions)
    × product(boundedMultipliers),
    minimum,
    maximum
  )
```

Order:

1. Base.
2. Flat additions.
3. Summed additive percentages.
4. Bounded multipliers.
5. Floors/caps.
6. Temporary combat modifiers.
7. Display rounding.

## 2.2 Rounding

- Damage stays decimal internally.
- Health may stay decimal internally.
- HUD displays remaining health as an integer.
- Cooldowns use milliseconds.
- Score becomes integer at each event.
- Counts remain integer.
- Descriptions must match implementation values exactly.

## 2.3 Damage tags

- `playerProjectile`
- `echoProjectile`
- `dash`
- `area`
- `chain`
- `critical`
- `hazard`
- `contact`
- `boss`
- `environment`

Upgrades declare affected tags.

## 2.4 Internal cooldowns

Every reactive upgrade has an explicit internal cooldown. Recursive triggers are forbidden unless explicitly specified and bounded.

---

# 3. Player base values

## 3.1 Movement

| Parameter | Value | Status |
|---|---:|---|
| Maximum speed | 340 px/s | PT |
| Acceleration | 2600 px/s² | PT |
| Deceleration | 3200 px/s² | PT |
| Collision radius | 18 px | FIXED intent |
| Contact separation impulse | 260 px/s | PT |
| Maximum separation displacement | 26 px | PT |

Targets:

- Reach 90% speed in approximately 0.30–0.45 s.
- Stop from full speed in approximately 0.15–0.25 s.
- Cross arena width in approximately 4.2 s without dash.

## 3.2 Dash

| Parameter | Value | Status |
|---|---:|---|
| Distance | 150 px | PT |
| Duration | 160 ms | PT |
| Cooldown | 1200 ms | PT |
| Invulnerability | 190 ms | PT |
| Input buffer | 120 ms | FIXED feature |
| Wall recovery | 60 ms | PT |

Caps:

- Minimum cooldown: 600 ms.
- Maximum distance: 220 px.
- Maximum invulnerability: 260 ms.
- No permanent invulnerability chain.

## 3.3 Health

| Parameter | Value |
|---|---:|
| Maximum health | 100 |
| Post-hit invulnerability | 700 ms |
| Normal contact damage | 12 |
| Heavy attack damage | 18–25 |
| Standard hostile projectile | 10–16 |
| Boss major hit | 18–28 |

Targets:

- Player survives roughly 5–8 ordinary mistakes.
- No normal non-boss event exceeds 30 base damage.
- No single Standard boss hit exceeds 35 base damage.

---

# 4. Base weapon

| Parameter | Value |
|---|---:|
| Damage | 10 |
| Fire rate | 5/s |
| Projectile speed | 850 px/s |
| Lifetime | 1.4 s |
| Radius | 5 px |
| Critical chance | 5% |
| Critical multiplier | 1.6× |
| Base DPS | 50 |
| Expected DPS with crit | 51.5 |

Caps:

- Fire rate: 10/s.
- Projectile speed: 1400 px/s.
- Critical chance: 35%.
- Critical multiplier: 2.25×.
- Maximum projectiles per shot: 3.
- Maximum fragments from one impact chain: 6.
- Maximum additional pierces: 3.
- Maximum ricochets: 2.

---

# 5. Echo base values

| Parameter | Value | Status |
|---|---:|---|
| Replay duration | 3.5 s | FIXED base |
| Sample rate | 30 Hz | FIXED |
| Cooldown | 7.0 s | PT |
| Damage scalar | 0.55 | PT |
| Active cap | 1 | FIXED base |
| Crossfire window | 1.0 s | PT |
| Crossfire target cooldown | 1.25 s | PT |
| Dissolve | 300 ms | PT |

Targets:

- Base Echo contributes 15–25% of total damage when used regularly.
- Echo builds contribute 35–50%.
- Normal builds should not exceed 60% Echo damage.
- Value should come from positioning, not raw duplication alone.

Caps:

- Replay duration: 5.3 s.
- Minimum cooldown: 4.5 s.
- Maximum friendly Echoes: 2.
- Maximum base scalar before conditional bonuses: 0.90.
- Phantom Shield capacity: 5 per Echo.

---

# 6. Difficulty presets

| Variable | Relaxed | Standard | Overclocked |
|---|---:|---:|---:|
| Enemy health | 0.90 | 1.00 | 1.12 |
| Enemy movement | 0.92 | 1.00 | 1.08 |
| Hostile projectile speed | 0.85 | 1.00 | 1.12 |
| Attack anticipation duration | 1.20 | 1.00 | 0.90 |
| Recovery duration | 1.15 | 1.00 | 0.90 |
| Threat budget | 0.82 | 1.00 | 1.20 |
| Spawn interval | 1.15 | 1.00 | 0.88 |
| Recovery phase duration | 1.25 | 1.00 | 0.80 |
| Player post-hit invulnerability | 1.12 | 1.00 | 0.92 |
| Score multiplier | 0.75 | 1.00 | 1.35 |

Global floors:

- Sentry telegraph ≥500 ms.
- Lancer telegraph ≥550 ms.
- Boss major telegraph ≥600 ms unless repeated simple pattern.
- At most two major executions in a 300 ms window.
- Player post-hit invulnerability ≥550 ms.
- Recovery phase ≥1.5 s.

---

# 7. Run-stage threat targets

| Segment | Threat target | Active threat cap | New content |
|---|---:|---:|---|
| Combat 1 | 5–7 | 6 | Drifter, Sentry |
| Combat 2 | 7–10 | 8 | Lancer |
| Elite 1 | 8–11 + elite | 8 | Elite modifier |
| Combat 3 | 10–13 | 10 | Carrier, Bulwark |
| Combat 4 | 12–16 | 12 | Suppressor |
| Elite 2 | 13–17 + elite | 12 | Full roster |
| Boss adds | 4–8 support threat | 8 | Restricted adds |

Within a normal chamber:

- Opening: 45–60% of peak.
- Development: 65–80%.
- Pressure: 90–100%.
- Recovery: 25–40%.
- Finale: 85–105%.
- Cleanup: no new full wave.

---

# 8. Enemy statistics

All values are Standard starting values before stage and difficulty multipliers.

## 8.1 Drifter

| Parameter | Value |
|---|---:|
| Health | 32 |
| Move speed | 145 px/s |
| Contact damage | 12 |
| Lunge damage | 14 |
| Lunge anticipation | 600 ms |
| Lunge speed | 460 px/s |
| Lunge duration | 320 ms |
| Recovery | 650 ms |
| Threat cost | 1 |
| Score | 100 |

Base time-to-kill target: 0.6–0.9 s.

## 8.2 Sentry

| Parameter | Value |
|---|---:|
| Health | 48 |
| Move speed | 105 px/s |
| Preferred range | 420–620 px |
| Telegraph | 700 ms |
| Lock delay | 120 ms |
| Burst count | 3 |
| Burst spacing | 110 ms |
| Projectile speed | 430 px/s |
| Projectile damage | 11 |
| Recovery | 950 ms |
| Spawn attack lockout | 900 ms |
| Threat cost | 2 |
| Score | 180 |

## 8.3 Lancer

| Parameter | Value |
|---|---:|
| Health | 72 |
| Move speed | 125 px/s |
| Telegraph | 760 ms |
| Lock | 140 ms |
| Charge speed | 760 px/s |
| Maximum charge | 620 px |
| Charge damage | 22 |
| Recovery | 1000 ms |
| Threat cost | 3 |
| Score | 280 |

## 8.4 Shard Carrier

| Parameter | Value |
|---|---:|
| Health | 90 |
| Move speed | 82 px/s |
| Preferred range | 330–500 px |
| Shard count | 3 |
| Hazard damage | 14 |
| Activation delay | 900 ms |
| Hazard duration | 4.0 s |
| Hazard radius | 54 px |
| Threat cost | 3 |
| Score | 300 |

## 8.5 Bulwark

| Parameter | Value |
|---|---:|
| Health | 150 |
| Move speed | 72 px/s |
| Shield arc | 150° |
| Frontal scalar | 0.22 |
| Side transition | 20° each side |
| Turn speed | 95°/s |
| Rear stagger threshold | 45 damage in 1.5 s |
| Stagger | 900 ms |
| Contact damage | 16 |
| Threat cost | 4 |
| Score | 450 |

## 8.6 Suppressor

| Parameter | Value |
|---|---:|
| Health | 120 |
| Move speed | 68 px/s |
| Field radius | 210 px |
| Echo recovery scalar in field | 0.45 |
| Field setup | 800 ms |
| Relocation interval | 5–8 s |
| Contact damage | 10 |
| Threat cost | 5 |
| Score | 520 |

Multiple fields never stack.

---

# 9. Elite modifiers

## 9.1 Overclocked

| Parameter | Modifier |
|---|---:|
| Health | ×1.30 |
| Movement | ×1.15 |
| Anticipation | ×0.85, subject to floors |
| Recovery | ×0.80 |
| Score | ×2.0 |
| Threat cost | +3 |

## 9.2 Replicating

| Parameter | Modifier |
|---|---:|
| Parent health | ×1.15 |
| Trigger | 50% health |
| Copy health | 50% modified max |
| Copy damage | ×0.80 |
| Copy speed | ×0.95 |
| Score | Parent ×1.5 + copy ×0.5 |
| Threat cost | +4 |

## 9.3 Resonant

| Parameter | Modifier |
|---|---:|
| Health | ×1.20 |
| Shield | 24% max health |
| Shield duration | 3.5 s |
| Trigger radius | 300 px |
| Internal cooldown | 2.5 s |
| Score | ×1.9 |
| Threat cost | +4 |

---

# 10. Upgrade balance

## 10.1 General rules

- First selection grants level 1.
- Values stack linearly unless stated.
- Descriptions display exact values.
- Active Echoes use frozen values.
- Hostile boss copies inherit no player upgrades.

## 10.2 Weapon upgrades

### Split Lens

Max level: 2.

- L1: one side projectile at 8°, all projectiles deal 72% base damage.
- L2: two side projectiles at ±9°, all three deal 62%.
- Critical chance rolls independently.
- Same-target fragment triggering has an 80 ms guard.

### Piercing Signal

Max level: 3.

- +1 enemy pierce per level.
- Damage after each pierce ×0.82.
- Minimum damage after pierce: 45% original.
- Walls end the projectile unless Ricochet applies.

### Arc Relay

Max level: 3.

- Every sixth qualifying hit chains.
- L1: 1 target at 45%.
- L2: 2 targets at 42% each.
- L3: 3 targets at 40% each.
- Range: 220 px.
- Same target cannot be hit twice by one chain.
- Chain cannot trigger another chain.

### Fracture Round

Max level: 3.

- Critical hits release fragments.
- L1: 2 fragments at 35%.
- L2: 3 at 33%.
- L3: 4 at 30%.
- Speed: 70% base.
- Lifetime: 500 ms.
- Fragments cannot crit or generate fragments.

### Compression Coil

Max level: 3.

- Continuous fire charges over 1.2 s.
- L1: +12% projectile speed, +8% damage.
- L2: +18% speed, +12% damage.
- L3: +24% speed, +16% damage.
- Charge decays over 350 ms.
- Dash removes 50% of charge.

### Ricochet Matrix

Max level: 2.

- L1: one bounce, post-bounce damage ×0.82.
- L2: two bounces, each ×0.82 current damage.
- Lifetime does not reset.
- Minimum bounce angle prevents trapping.
- Same enemy cannot be hit twice within 120 ms.

## 10.3 Echo upgrades

### Extended Memory

Max level: 3.

- +0.6 s replay per level.
- Maximum 5.3 s.
- Cooldown +0.25 s per level.
- Recording capacity expands accordingly.

### Twin Recall

Max level: 1.

- Second Echo starts 650 ms later.
- Secondary scalar = 75% of primary scalar.
- Same replay and loadout.
- Cooldown +1.0 s.
- Active cap becomes two.

### Resonant Damage

Max level: 3.

- Crossfire trigger bonus:
  - L1 +12%.
  - L2 +18%.
  - L3 +24%.
- Trigger window: 1.0 s.
- Per-target cooldown: 650 ms.
- Cannot recursively trigger.

### Phantom Shield

Max level: 3.

- Each Echo destroys:
  - L1: 1 projectile.
  - L2: 3.
  - L3: 5.
- Explicit unblockable boss attacks are immune.

### Stable Projection

Max level: 3.

- +0.10 Echo scalar each level.
- Base 0.55 becomes 0.85.
- Hard cap before conditional bonuses: 0.90.

### Memory Burst

Max level: 3.

| Level | Radius | Damage |
|---|---:|---:|
| 1 | 90 px | 24 |
| 2 | 110 px | 36 |
| 3 | 130 px | 48 |

- One hit per target.
- Cannot crit.
- Cannot trigger Arc Relay or Fracture.

## 10.4 Mobility upgrades

### Dash Wake

Max level: 3.

- Trail lasts 450 ms.
- Damage: 18 / 27 / 36.
- One hit per target per dash.
- Width: 28 px.
- Echo trail deals 55% if captured.

### Phase Recovery

Max level: 3.

Near-miss radius: 28 px beyond player body.

- Cooldown reduction: 120 / 180 / 240 ms.
- Internal cooldown: 500 ms.
- Global cooldown floor applies.

### Kinetic Charge

Max level: 3.

- Move above 70% speed for 1.5 s.
- Fire-rate bonus: 8% / 13% / 18%.
- Charge decays over 600 ms.
- Fire-rate cap applies.

### Vector Reversal

Max level: 2.

A second dash is available if direction differs by at least 120°.

- L1: 450 ms window, 70% distance.
- L2: 600 ms, 85% distance.
- Second dash begins normal cooldown.
- No further chain.

### Slipstream

Max level: 3.

Passing within 46 px of Echo grants:

- 12% / 18% / 24% movement speed.
- Duration: 1.2 s.
- Per-Echo cooldown: 1.5 s.
- Movement cap: 440 px/s.

### Afterburn

Max level: 3.

First projectile within 300 ms after dash gains:

- +35% / +55% / +75%.
- Split Lens side shots receive 50% of bonus.
- One activation per dash.
- Recorded qualifying Echo shots may inherit it.

## 10.5 Defensive upgrades

### Emergency Repair

Max level: 3.

- Heal 6 / 10 / 14 after combat chamber.
- No tutorial heal.
- Cannot exceed max health.

### Reactive Shell

Max level: 3.

- Damage reduction after taking damage:
  - 15% / 22% / 30%.
- Duration: 2.0 s.
- Applies after triggering hit.
- Refreshes, does not stack.

### Null Absorption

Max level: 3.

Destroyed hostile projectiles have:

- L1: 15% chance, -150 ms Echo cooldown.
- L2: 22%, -180 ms.
- L3: 30%, -220 ms.
- Internal cooldown: 180 ms.
- Player destruction or Phantom Shield qualifies.

### Last Frame

Max level: 1.

- Once per chamber, lethal damage leaves 1 health.
- Grants 1.2 s invulnerability.
- Boss counts as one chamber.
- Does not trigger from scripted defeat.

### Regenerative Circuit

Max level: 3.

| Level | No-damage delay | Tick interval | Chamber cap |
|---|---:|---:|---:|
| 1 | 8 s | 1.6 s | 8 HP |
| 2 | 7 s | 1.4 s | 12 HP |
| 3 | 6 s | 1.2 s | 16 HP |

- Regenerates 1 HP per tick.
- Taking damage resets delay.
- Disabled during transitions.

### Deflection Pulse

Max level: 3.

| Level | Radius | Push |
|---|---:|---:|
| 1 | 110 px | 55 px |
| 2 | 135 px | 75 px |
| 3 | 160 px | 95 px |

- No damage.
- Elites receive 50% displacement.
- Boss immune.
- Cannot push through walls.

---

# 11. Upgrade offering weights

Base weights:

| Category | Weight |
|---|---:|
| Weapon | 1.00 |
| Echo | 1.00 |
| Mobility | 0.90 |
| Defense | 0.85 |

Adjustments:

- Two upgrades in category: ×1.12.
- Three or more: additional ×1.05.
- Health ≤35%: defensive ×1.30.
- Include an outside-category option where eligible.
- Maximum effective category weight: 1.6× base.
- Maxed, locked, conflicting: zero.

---

# 12. Boss balance

## 12.1 Base

| Parameter | Standard |
|---|---:|
| Total health | 3600 |
| Phase 1 | 3600–2520 |
| Phase 2 | 2520–1260 |
| Phase 3 | 1260–0 |
| Contact damage | 20 |
| Add cap | 8 threat |
| Maximum invulnerable interval | 2.8 s |
| Minimum vulnerable interval | 3.5 s |
| Fight target | 3.5–5.0 min |

## 12.2 Phase 1

Rotating fan:

- Damage: 12.
- Speed: 330 px/s.
- 8–12 projectiles per emission.
- Guaranteed angular gaps.

Targeted line volley:

- Telegraph: 800 ms.
- Lock: 150 ms.
- 2 lines initially, up to 3.
- Damage: 18.

Summon:

- 2–4 Drifters.
- 700 ms spawn.
- Add cap enforced.

## 12.3 Phase 2 hostile copy

- Delay: 1.0 s.
- Lifetime: 3.5–4.5 s.
- Projectile damage: 10–14.
- One active initially.
- Two only late in phase without another major attack.
- Spawn warning: 700 ms.
- No player upgrade inheritance.

## 12.4 Phase 3 sectors

- Warning: 1.0 s.
- Disabled: 2.5–3.5 s.
- At least 45% arena area safe.
- Safe region remains connected.
- Damage: 16 per tick.
- Tick interval: 700 ms.
- Entry grace: 250 ms.
- Sector patterns do not overlap without restoration.

## 12.5 Long-fight behavior

No hard enrage.

After 7 minutes:

- Slightly faster attack selection.
- No new mechanics.
- Telegraph floors stay.
- Time bonus approaches zero.

---

# 13. Scoring

## 13.1 Chamber scores

| Event | Score |
|---|---:|
| Combat 1 clear | 500 |
| Combat 2 clear | 650 |
| Elite 1 clear | 900 |
| Combat 3 clear | 750 |
| Combat 4 clear | 900 |
| Elite 2 clear | 1200 |
| Boss victory | 5000 |

## 13.2 Combo

Gains:

- Normal kill: +1.0.
- Elite kill: +3.0.
- Crossfire: +0.5.
- Near miss: +0.2, capped.
- Multi-kill within 600 ms: +0.5 per extra kill.

Decay begins after 2.0 s.

```text
comboMultiplier = 1 + min(combo, 20) × 0.03
```

Maximum: 1.60×.

Taking damage halves combo.

## 13.3 Crossfire score

```text
crossfireScore = 40 × stageScalar
```

Per-target cooldown applies.

## 13.4 Near miss

- 15 points.
- One award per projectile.
- Maximum four awards per second.

## 13.5 Time bonus

- Based on difficulty target band.
- Maximum 12% of combat score.
- Never negative.
- Tutorial excluded.

## 13.6 Avoidance bonus

```text
avoidanceScalar = clamp(1 - damageTaken / 180, 0, 1)
avoidanceBonus = round(1500 × avoidanceScalar)
```

## 13.7 Final score

```text
subtotal =
  enemyScore
  + chamberScore
  + bossScore
  + crossfireScore
  + nearMissScore
  + timeBonus
  + avoidanceBonus

finalScore = round(subtotal × difficultyMultiplier)
```

---

# 14. Progression balance

No currency exists.

Example unlock milestones:

- First crossfire kill → Echo upgrade.
- First elite defeat → mobility upgrade.
- Damage-free Standard chamber → defense upgrade.
- Reach boss → weapon upgrade.
- First Standard victory → Overclocked.
- High Echo-damage victory → cosmetic trail.

Unlocks never alter permanent base stats.

---

# 15. Pacing targets

| Segment | Target |
|---|---:|
| Normal chamber | 75–110 s |
| Elite chamber | 60–90 s |
| Recovery chamber | 20–40 s |
| Boss | 210–300 s |

Recovery:

- Between waves: 1.5–3.0 s.
- After pressure: 2.5–4.0 s.
- Before elite activation: 1.0–1.5 s.
- After clear before upgrade: 0.8–1.2 s.

Active enemies:

- Early: 3–6.
- Mid: 5–9.
- Late: 7–12.
- Technical hard cap remains 30.

---

# 16. Fairness constraints

Fixed:

- No attack during enemy spawn.
- Ranged attack lockout: 900 ms after spawn completion.
- Standard spawn safety radius: 260 px.
- Relaxed: 300 px.
- Overclocked: 230 px.
- At most two major attack executions in 300 ms.
- At least one route 90 px wide through hazard layouts.
- Lancer endpoint must be valid.
- Boss sectors preserve connected safe space.
- Projectiles cannot spawn inside player body.
- Damage events are source-deduplicated.
- Off-screen attacks have directional indicators.

---

# 17. Local balance telemetry

Development summaries report:

- Player/Echo/other damage split.
- Echo deployments per minute.
- Echo uptime.
- Crossfire per chamber.
- Dash usage.
- Damage by source.
- Kill time by enemy type.
- Chamber duration.
- Upgrade pick frequency.
- Boss phase duration.
- Death cause and location.
- Projectile density.
- Threat over time.

No remote telemetry is collected.

---

# 18. Acceptance targets

## 18.1 New player

- Understands controls after tutorial.
- Reaches Elite 1 within several attempts.
- Does not die primarily to unclear attacks.

## 18.2 Competent player

- Standard learned victory rate: 35–55%.
- Successful duration median: 13–15 minutes.
- Echo use: at least 1.5 deployments/minute.
- Echo damage share: 15–35% in ordinary builds.
- No upgrade exceeds 70% pick rate when offered in informed testing.

## 18.3 Strong player

- Overclocked remains demanding.
- Strong builds shorten boss but do not skip all mechanics.
- Sustained effective DPS should not exceed roughly 4× base without setup and tradeoff.
- No defensive combination creates permanent invulnerability.

---

# 19. Balance risk register

| Risk | Detection | Correction |
|---|---|---|
| Echo ignored | Low use/share | Lower cooldown, improve rewards/tutorial |
| Echo only raw DPS | Same build pattern | Reduce scalar, strengthen utility |
| Split Lens dominates | High pick/win | Lower projectile scalar |
| Defense trivializes boss | Very low damage | Tighten caps/durations |
| Suppressor denies core mechanic | Long downtime/frustration | Smaller field, higher scalar, lower health |
| Bulwark is tedious | Excessive kill time | Faster stagger, lower health |
| Overclocked unreadable | Timing deaths | Restore floors, increase composition pressure |
| Boss requires ideal build | Weak builds stall | More vulnerability, lower health, neutral openings |
