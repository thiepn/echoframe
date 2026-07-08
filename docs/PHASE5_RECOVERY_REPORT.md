# Phase 5 Recovery Report

**Project:** ECHOFRAME: LAST SIGNAL  
**Recovered version:** `0.5.0-core-roster-director`  
**Recovery date:** 2026-07-05

## Inputs inspected

- Validated Phase 4 repository: `0.4.0-combat-vertical-slice`.
- Uploaded Phase 5 repository archive.
- Uploaded Phase 5 continuation specification.
- Five canonical preproduction documents embedded in both repositories.

## Recovery result

The uploaded Phase 5 archive contained substantially more source than the interrupted-chat status implied. It included the four new enemies, enemy AI/renderers, Carrier subordinate pool, Suppressor modifier service, encounter-generation modules, director integration, seed-audit script, screenshots, documentation, and 96 automated tests. The Phase 4 architecture therefore did not need to be rebuilt or replaced.

The five canonical documents in the uploaded Phase 5 archive were byte-identical to the validated Phase 4 copies. Their SHA-256 hashes remain unchanged.

## Recovered and retained

- Phaser/Vite foundation and all Phase 1–4 gameplay systems.
- Central `DamageService`, pooled player/Echo/hostile projectiles, and enemy pools.
- Drifter and Sentry implementations.
- Lancer, Shard Carrier, Bulwark, and Suppressor implementations.
- Threat budgets, encounter patterns, composition validation, synergy rules, history, spawn planning, recovery descriptors, telemetry, and debug controls.
- Canonical extraction, Phase 5 screenshots, and the original seed-audit tooling.
- All 85 Phase 1–4 regression tests plus the archive’s initial Phase 5 tests.

## Missing or insufficient evidence

The archive did not contain reliable independent evidence for the interrupted implementation’s claimed runtime quality. Its bundled reports and screenshots existed, but the corresponding validation did not detect a shared arena-bounds integration error. Dedicated reproducible browser, lifecycle, source-audit, and wall-clock soak harnesses were therefore added.

## Conflicts and defects found

The canonical arena exposes bounds as:

```text
left, right, top, bottom
```

Several recovered Phase 5 systems read them as:

```text
x, y, width, height
```

This caused three material defects:

1. Lancer charge-space checks produced invalid endpoints and rejected valid charges.
2. Shard Carrier hazard targets could become non-finite.
3. Spawn boundary validation silently failed to enforce the arena edge.

The archive’s 96-test suite did not exercise these runtime paths deeply enough, so its prior “complete” reports were treated as stale rather than authoritative.

A later wall-clock soak also exposed a lifecycle edge case: if `RunScene` shut down while enemies were still active, Phaser could remove an Arcade Physics body before the enemy pool released its entity. The original teardown then called `setVelocity()` through the missing body and logged a cleanup error. Enemy deactivation/destruction is now idempotent against that shutdown order, and a dedicated regression test covers the missing-body path.

## Targeted reconstruction strategy

The validated Phase 4 ownership model was preserved. Repair work was limited to the affected Phase 5 layers:

- normalized arena geometry and wall-clearance helpers;
- deterministic Lancer charge-path evaluation;
- deterministic Carrier hazard placement with finite-coordinate and escape-route constraints;
- corrected spawn safety;
- explicit named encounter RNG streams;
- stronger suppression-source cleanup;
- shutdown-safe pooled-enemy teardown when Phaser has already removed a physics body;
- expanded runtime/debug diagnostics;
- substantially expanded regression and mechanic tests;
- new Chromium browser, lifecycle, source-audit, and soak validation harnesses.

No general ECS or architectural rewrite was introduced.

## Recovery checkpoint

After targeted repair, before final packaging:

- version: `0.5.0-core-roster-director`;
- automated tests: 147/147;
- production build: passing;
- 300-run seed audit: passing with zero errors and zero fallbacks;
- canonical document hashes: unchanged.

Final runtime, lifecycle, soak, and clean-package results are recorded in `VALIDATION_REPORT.md`.
