# Phase 9 Implementation Notes

## Layering strategy

Phase 9 extends the validated Phase 8 repository. It does not move score logic into `DamageService`, duplicate score ownership between `RunScene` and `BossScene`, or allow progression to affect combat generation.

## Score ledger

`ScoreManager` accepts authoritative events and appends immutable `ScoreEvent` records to a bounded `ScoreEventLedger`. The ledger has a 4,096-event hard cap, monotonic sequence numbers, run/segment identity, deterministic dedupe keys, integer event awards, rejection reasons, category totals, and exact replay reconciliation.

Enemy/elite deaths are reported only after authoritative defeat. Crossfire and near miss reuse their existing trackers. Segment and boss awards originate from progression/outcome authorities. No renderer or HUD callback grants score.

## Combo

`ComboController` is run-local, simulation-time based, pause-safe, and score-only. The event is scored with the multiplier derived from `comboBefore`; the event gain is then applied. Decay begins after two seconds at the documented `PLAYTEST` rate of 1.0/s. Accepted health damage halves combo; rejected/blocked damage does not. Segment completion resets combo to prevent carrying a farmed multiplier through non-combat scenes.

## Finalization

`RunFinalizationService` is the only final transaction. It locks scoring, reconciles the ledger, computes final bonuses/multiplier, creates the immutable breakdown, compares personal bests, evaluates unlocks, updates aggregate statistics, appends the bounded recent-run record, and commits one save write. Results animation is presentation-only and can be skipped without changing data.

## Progression

Progression unlocks breadth/expression only. The six existing upgrade definitions remain unchanged and become offer-eligible only in future runs after their milestones commit. Overclocked unlocks from the first non-debug Standard victory. Palettes/trails alter only player and friendly-Echo rendering; hostile Echoes and threat telegraphs retain canonical visual ownership.

## Save migration

`SaveSchema` accepts valid Phase 8 saves with absent Phase 9 fields, applies fresh defaults, clamps numerics, deduplicates known IDs, validates selected cosmetics, caps recent runs at 50, ignores unknown data, and preserves the current valid save after malformed import. Clear data restores Relaxed/Standard, 18 unlocked upgrades, 6 locked upgrades, default cosmetics, and empty records.

## UI

- HUD shows current score/combo/multiplier and bounded pooled flyouts.
- Results shows final score, personal-best status, category breakdown, run statistics, deterministic unlock queue, seed, and navigation.
- Archive is catalog-driven and contains enemies, elites, arenas, upgrades, boss/Echo systems, lore, and cosmetics.
- Statistics contains Overview, Combat, Echo, Boss, Score, Records, and Recent Runs tabs.

## PLAYTEST decisions

- Stage scalar table for crossfire.
- 1.0/s combo decay.
- Segment-completion combo reset.
- Six locked-upgrade milestone mappings.
- Cosmetic catalog and milestone mappings.
- Archive discovery rules.
- Weighted time-bonus formula.
- Bulwark rear-break 75-point category.
- Accuracy personal-best minimum of 50 player shots.

## Performance

Score acceptance and deduplication are bounded. Unlock evaluation occurs only during finalization. Score flyouts are pooled. Recent runs are capped. Results uses one counting tween rather than one tween per point. Archive previews do not instantiate gameplay physics. Exact measurements are in `PHASE9_PERFORMANCE_VALIDATION.json`.

# Phase 10 Implementation Notes

## Tutorial ownership

`TutorialScene` constructs the authored chamber and composes existing production authorities. `TutorialController` owns only tutorial state, prerequisites, retry, and completion. Player movement/dash remain in `PlayerController`; firing remains in `WeaponSystem`; recording and replay remain in `EchoRecorder` and `EchoPlaybackSystem`; accepted damage remains owned by `DamageService`; persistent completion remains owned by `SaveManager`.

The tutorial never creates a normal `RunState` until the final signal gate is entered from first-run mode. Replay mode never creates a run. Tutorial HUD omits score/combo and reads current binding labels and accessibility settings.

## Binding architecture

`BindingCatalog` is the single normalizer, validator, label source, default catalog, and conflict authority. Save data contains only bounded JSON descriptors. `InputManager` consumes frozen binding snapshots and rebuilds existing input contexts after a binding revision. Persistence remains in Settings/SaveManager, not InputManager.

A capture modal owns key and pointer input until commit/cancel. The opening click is ignored, repeats are rejected, invalid conflicts preserve the old binding, optional secondary slots may be cleared, and held inputs are suppressed until release. Menu arrows/Enter/Escape remain fixed.

## Save migration

Schema 1 control strings migrate sequentially to schema 2 descriptors. Known legacy values are deterministic, duplicate descriptors are removed, slot limits are enforced, unknown descriptors are ignored, conflicts are repaired, required actions receive canonical defaults, and unsupported future schemas are rejected without replacing the current valid save.

## Release/error behavior

`FatalErrorPresenter` is DOM-owned so a controlled screen remains possible when Phaser is unavailable. Production UI exposes a stable code, Reload, and relevant Clear Local Data action without stack/environment detail. Recoverable save, audio, optional asset, clipboard, arena/encounter, and bounded-pool failures do not become fatal.

Development validation hooks require a validation build and are inert in production. URL query parameters cannot enable them in the shipped build.

## Validation acceleration boundary

Lifecycle and browser harnesses may reduce presentation fades/delays through validation-only adapters. They do not alter gameplay definitions, scoring acceptance, boss/result finalization, save semantics, or release production code. Idle and active-soak gates use real wall-clock duration.

## Static deployment

The Vite base is normalized for both `/` and a repository subpath. Production validation serves only built static output and verifies direct load, hard refresh, metadata, asset MIME types, save persistence, no `/src/` requests, no localhost references, and no absolute-root dependency.

## Browser limitation

The installed real Firefox 140.12.0esr process aborts before page creation on the validation runner's Linux 4.4 kernel with `wasm_rt_syscall_set_segue_base error: Invalid argument`. The report records this as an environment-blocked release gate. Chromium user-agent emulation is not accepted as Firefox evidence.

# Phase 11 Implementation Notes

## Evidence binding

Phase 11 computes a SHA-256 source-manifest digest over production source, tests, validation scripts, workflows, configuration, public files, and the five canonical documents. Browser reports additionally record the production-bundle digest. Evidence from another digest remains historical and cannot sign off the current source.

## Real-browser policy

The Firefox validator accepts only a real Gecko executable discovered from a supported system installation, Playwright-managed browser, or CI environment. User-agent substitution, Chromium emulation, and static inspection cannot satisfy the gate. This runner has no usable Firefox executable and cannot resolve the browser/package download endpoints, so the gate records `gameCodeExecuted: false`.

## Certification workflows

`.github/workflows/ci.yml` separates core, Chromium, Firefox, static-deployment, deterministic-comparison, and aggregate release jobs. `.github/workflows/deploy.yml` deploys Pages automatically only after successful cross-browser CI, or through an explicit manual certified-release input that still reruns the core suite. No repository was connected during local execution, so workflow structure is validated but GitHub-hosted execution is not claimed.

## Promotion guard

Candidate identity remains `1.0.0-release-candidate`. Final packaging refuses to create `ECHOFRAME_v1.0.0_*` artifacts unless the package/runtime identity is `1.0.0` and the evidence-derived final audit and sign-off both pass. With Firefox, cross-browser determinism, CI execution, public deployment, and final-version long-session gates open, only explicitly named certification-candidate archives may be produced.

