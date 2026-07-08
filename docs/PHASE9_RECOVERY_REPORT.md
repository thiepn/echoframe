# Phase 9 Recovery Report

## Source of truth

- Source archive: `ECHOFRAME_phase8_null_architect_boss.zip`
- Source SHA-256: `7a0936bb3e8c7a109628975abc409ff4829788e93f735b55060a4d929c2cbabc`
- Initial package/runtime version: `0.8.0-null-architect-boss`
- Initial tests: `564/564`
- Initial lint: passed
- Initial build: passed with the existing Vite large-chunk advisory
- Initial source audit: passed
- Initial npm audit: 0 vulnerabilities

The archive was extracted into a clean working directory. No Phase 9 source remnants were present. The Phase 8 repository was extended in place; it was not rebuilt from scratch.

## Canonical document hashes

| Document | SHA-256 |
|---|---|
| `GAME_DESIGN.md` | `556d99d05d7896c2b02bb653cb28e8a0cb631e223edf67e3e0c1236fd7811f71` |
| `TECHNICAL_SPEC.md` | `8562235331a2dc229977db11a56fdb10ba0032494d4b0d0706f41bf24c903468` |
| `ART_DIRECTION.md` | `aa29931c92ada05c0693ea58730986bc8b9ce8c1b8fcbf78acb4d72be8d1529a` |
| `BALANCE_SPEC.md` | `5fca70f1c890b1e13a3b8b17ab3c82da725491c0cca6146a7ad0a2b1f55fd107` |
| `QA_CHECKLIST.md` | `b120097203b11e7f2fe025ea5767e931395f5edc7059e9821f6ab5ce1c722122` |

All five documents remain unchanged.

## Recovered Phase 8 state

- Complete deterministic combat route through the Null Architect.
- Run-local combat statistics and boss telemetry existed, but there was no authoritative score ledger.
- Crossfire and near-miss qualification systems existed and could be reused as scoring authorities.
- Results displayed combat outcome data but did not reconcile deterministic score categories or personal bests.
- Archive and Statistics were placeholders/incomplete.
- Save data contained basic unlock and recent-run structures but not the complete Phase 9 progression/statistics model.
- Overclocked difficulty support existed, but its canonical first-Standard-victory unlock flow was incomplete.
- Palette/trail rendering hooks were absent.
- The implemented-but-locked upgrades were:
  - `twin-recall`
  - `memory-burst`
  - `vector-reversal`
  - `afterburn`
  - `null-absorption`
  - `deflection-pulse`

## Baseline defects and conflicts

- Package and top-level documentation still identified the game as Phase 8.
- Phase 8 release metadata did not register Phase 8 audit scripts even though evidence files existed.
- Archive/Statistics wording understated implemented boss, elite, and progression content.
- No deterministic score finalization transaction prevented duplicate Results callbacks from becoming future persistence risks.
- Existing save validation required extension to accept absent Phase 9 fields without rejecting valid Phase 8 saves.

## Reconstruction strategy

1. Preserve combat, damage, RNG, encounter, upgrade, arena, Echo, and boss ownership.
2. Add one run-level `ScoreManager` and immutable bounded event ledger.
3. Connect score only to existing authoritative defeat, crossfire, near-miss, segment, damage, and outcome events.
4. Add a single `RunFinalizationService` transaction for score reconciliation, personal bests, unlocks, aggregate statistics, recent runs, and save commitment.
5. Extend save normalization with backward-compatible defaults and bounded arrays.
6. Replace Archive, Statistics, and Results placeholders with data-driven read-only scenes.
7. Apply selected cosmetics only to player/friendly-Echo rendering.
8. Add deterministic audits and real Chromium validation without changing gameplay RNG.

## Principal files added or modified

- `src/scoring/**`
- `src/progression/**`
- `src/statistics/**`
- `src/systems/RunFinalizationService.js`
- `src/state/RunState.js`
- `src/state/SaveSchema.js`
- `src/state/defaultSaveData.js`
- `src/scenes/RunScene.js`
- `src/scenes/BossScene.js`
- `src/scenes/HUDScene.js`
- `src/scenes/ResultsScene.js`
- `src/scenes/ArchiveScene.js`
- `src/scenes/StatisticsScene.js`
- `src/scenes/MainMenuScene.js`
- Phase 9 tests, audits, browser/lifecycle/soak/performance harnesses, documentation, and screenshots.
