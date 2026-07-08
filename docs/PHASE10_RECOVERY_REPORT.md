# Phase 10 Recovery Report

## Source truth

| Item | Verified value |
|---|---|
| Baseline archive | `ECHOFRAME_phase9_signal_ledger_progression.zip` |
| Source SHA-256 | `5c19b168b7526d8ec6e83d4fd141fa3fdbbf0a461e5129917347c488626c2f56` |
| Baseline version | `0.9.0-signal-ledger-progression` |
| Baseline automated tests | `923/923` |
| Recovered Phase 10 working tree | None supplied |
| Reconstruction source | Clean Phase 9 archive plus `ECHOFRAME_PHASE10_IMPLEMENTATION_PROMPT.md` and the user-provided development summary |

The uploaded workspace contained the verified Phase 9 archive and the Phase 10 implementation specification, but no surviving Phase 10 source tree or partial Phase 10 archive. Reconstruction therefore began from a clean Phase 9 extraction. No Phase 1–8 archive was used as the implementation baseline.

## Canonical document hashes

| Document | SHA-256 |
|---|---|
| `GAME_DESIGN.md` | `556d99d05d7896c2b02bb653cb28e8a0cb631e223edf67e3e0c1236fd7811f71` |
| `TECHNICAL_SPEC.md` | `8562235331a2dc229977db11a56fdb10ba0032494d4b0d0706f41bf24c903468` |
| `ART_DIRECTION.md` | `aa29931c92ada05c0693ea58730986bc8b9ce8c1b8fcbf78acb4d72be8d1529a` |
| `BALANCE_SPEC.md` | `5fca70f1c890b1e13a3b8b17ab3c82da725491c0cca6146a7ad0a2b1f55fd107` |
| `QA_CHECKLIST.md` | `b120097203b11e7f2fe025ea5767e931395f5edc7059e9821f6ab5ce1c722122` |

The canonical files remain under `docs/` and were not edited.

## Baseline verification

The clean Phase 9 archive reproduced:

- `npm ci`: passed
- lint: passed
- tests: `923/923`
- production build: passed
- score audit: passed
- combo audit: passed
- progression audit: passed
- statistics audit: passed
- source audit: passed
- `npm audit`: zero vulnerabilities

The inherited Vite advisory for a JavaScript chunk larger than 1,500 kB reproduced. It is a delivery advisory, not a failed transfer budget; Phase 10 investigates and records the final raw/gzip sizes rather than suppressing the warning.

## Confirmed Phase 9 gaps

| Expected gap | Baseline finding |
|---|---|
| Tutorial was instructional text rather than gameplay | Confirmed |
| Fresh Start Run bypassed a playable tutorial | Confirmed |
| Archive replay was incomplete | Confirmed |
| Runtime controls were hard-coded | Confirmed |
| Controls page lacked interactive rebinding | Confirmed |
| Save bindings were legacy strings | Confirmed |
| Prototype/foundation/deferred wording remained | Confirmed |
| Credits and Pause contained stale development copy | Confirmed |
| HTML metadata described a prototype | Confirmed |
| Controlled fatal presentation was incomplete | Confirmed |
| Firefox/root-subpath/long-session RC evidence incomplete | Confirmed |

The legacy movement source mapping was correct: `W/S/A/D → KeyW/KeyS/KeyA/KeyD`. The duplicate `KeyS` in the supplied prose summary was not present in the migration source.

## Reconstructed implementation strategy

1. Preserve every Phase 9 combat, scoring, boss, deterministic generation, progression, and save authority.
2. Add a standalone tutorial controller/state model and authored arena while reusing production movement, weapon, projectile, recording, and friendly-Echo systems.
3. Introduce one plain-JSON binding catalog, conflict validator, normalizer, label layer, and schema migration.
4. Make `InputManager` consume validated setting snapshots and rebuild contexts without owning persistence.
5. Add release-facing settings, copy, metadata, credits, debug guards, and DOM-level fatal presentation.
6. Retain all 923 prior tests and add Phase 10 regression/model tests.
7. Add real browser, deployment, lifecycle, idle, soak, performance, source, security, and release evidence.

## Primary files changed or added

### Tutorial

- `src/tutorial/TutorialState.js`
- `src/tutorial/TutorialStepCatalog.js`
- `src/tutorial/TutorialObjectiveValidator.js`
- `src/tutorial/TutorialController.js`
- `src/data/tutorialArena.js`
- `src/scenes/TutorialScene.js`
- `src/scenes/MainMenuScene.js`
- `src/scenes/ArchiveScene.js`
- `src/scenes/PauseScene.js`

### Controls and save migration

- `src/input/BindingCatalog.js`
- `src/input/BindingMigration.js`
- `src/systems/InputManager.js`
- `src/scenes/SettingsScene.js`
- `src/state/defaultSaveData.js`
- `src/state/SaveSchema.js`
- `src/systems/SaveManager.js`
- `src/data/constants.js`

### Release hardening

- `src/systems/FatalErrorPresenter.js`
- `src/main.js`
- `src/systems/DebugManager.js`
- `src/systems/AudioManager.js`
- `src/scenes/CreditsScene.js`
- `src/styles/main.css`
- `index.html`
- `public/manifest.webmanifest`
- `src/utils/version.js`
- `package.json`
- `package-lock.json`

### Validation

Phase 10 tests, deterministic audits, source/security audits, browser/deployment harnesses, lifecycle, idle, soak, performance, screenshots, and release documentation were added without deleting or skipping retained tests.
