# File Manifest

**Version:** `1.0.0-release-candidate`  
**Generated:** 2026-07-07T22:28:06.169Z  
**Included files:** 597  

The manifest excludes generated `node_modules/`, `dist/`, and `.git/` content. Runtime-mutable means the module owns or contains live game/browser state during execution; it does not mean the source file is modified at runtime.

## File counts

| Area | Files |
|---|---:|
| `.github` | 2 |
| `(root)` | 9 |
| `docs` | 131 |
| `public` | 2 |
| `scripts` | 65 |
| `src` | 345 |
| `tests` | 43 |

## Complete inventory

| Path | Purpose | Primary owner | Runtime-mutable state |
|---|---|---|---|
| `.editorconfig` | Repository configuration or release metadata | Repository/tooling | No |
| `.github/workflows/ci.yml` | GitHub Pages CI/CD workflow | Repository tooling | No |
| `.github/workflows/deploy.yml` | GitHub Pages CI/CD workflow | Repository tooling | No |
| `.gitignore` | Repository configuration or release metadata | Repository/tooling | No |
| `docs/ART_DIRECTION.md` | Canonical design authority | Preproduction documents | No |
| `docs/BALANCE_SPEC.md` | Canonical design authority | Preproduction documents | No |
| `docs/BROWSER_SUPPORT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/CHANGELOG.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/CURRENT_STATE.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/ECHOFRAME_PHASE10_IMPLEMENTATION_PROMPT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/ECHOFRAME_PHASE11_IMPLEMENTATION_PROMPT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/FILE_MANIFEST.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/GAME_DESIGN.md` | Canonical design authority | Preproduction documents | No |
| `docs/IMPLEMENTATION_NOTES.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE10_ACCESSIBILITY_AUDIT.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_ACCESSIBILITY_BROWSER_VALIDATION.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_ACTIVE_SOAK_VALIDATION.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_BINDING_AUDIT.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_BROWSER_CHROMIUM_VALIDATION.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_BROWSER_FIREFOX_VALIDATION.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_CANONICAL_EXTRACTION.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE10_CORE_VALIDATION.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_DEFECT_REGISTER.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE10_DEPLOYMENT_VALIDATION.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_LIFECYCLE_VALIDATION.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_MENU_IDLE_VALIDATION.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_NPM_AUDIT.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_PERFORMANCE_VALIDATION.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_RECOVERY_REPORT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE10_RELEASE_AUDIT.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_RELEASE_CHECKLIST.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE10_RELEASE_SIGNOFF.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_SECURITY_AUDIT.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_SOURCE_AUDIT.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE10_TUTORIAL_AUDIT.json` | Machine-readable Phase 10 release evidence | Validation tooling | No |
| `docs/PHASE11_ACCESSIBILITY_CERTIFICATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_ACTIVE_SOAK_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_AUDIO_CERTIFICATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_BROWSER_CHROMIUM_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_BROWSER_FIREFOX_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_CI_AGGREGATE.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_CI_ARCHITECTURE.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_CI_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_CROSS_BROWSER_DETERMINISM.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_DEFECT_REGISTER.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_DEPLOYMENT_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_EVIDENCE_INVALIDATION.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_EVIDENCE_MAP.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_FINAL_RELEASE_AUDIT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_FIREFOX_COMPATIBILITY_NOTES.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_LIFECYCLE_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_MENU_IDLE_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_NPM_AUDIT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_PERFORMANCE_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_PUBLIC_DEPLOYMENT_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_RECOVERY_REPORT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_RECOVERY_REPORT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_RELEASE_CHECKLIST.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_RELEASE_SIGNOFF.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_SECURITY_AUDIT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE11_SOURCE_AUDIT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE5_BROWSER_VALIDATION.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE5_CANONICAL_EXTRACTION.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE5_LIFECYCLE_BATCH1_10.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE5_LIFECYCLE_BATCH2_10.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE5_LIFECYCLE_BATCH3_10.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE5_LIFECYCLE_BATCH4_10.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE5_LIFECYCLE_BATCH5_10.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE5_LIFECYCLE_VALIDATION.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE5_NPM_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE5_RECOVERY_REPORT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE5_SEED_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE5_SOAK_VALIDATION.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE5_SOURCE_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE6_BROWSER_VALIDATION.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE6_CANONICAL_EXTRACTION.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE6_ELITE_MATRIX_VALIDATION.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE6_LIFECYCLE_VALIDATION.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE6_NPM_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE6_RECOVERY_REPORT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE6_SEED_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE6_SOAK_VALIDATION.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE6_SOURCE_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE7_ARENA_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE7_BROWSER_VALIDATION.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE7_CANONICAL_EXTRACTION.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE7_LIFECYCLE_VALIDATION.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE7_NPM_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE7_RECOVERY_REPORT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE7_SEED_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE7_SOAK_VALIDATION.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE7_SOURCE_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE7_UPGRADE_AUDIT.json` | Machine-readable validation evidence | Validation tooling | No |
| `docs/PHASE8_BOSS_AUDIT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_BROWSER_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_CANONICAL_EXTRACTION.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_HOSTILE_ECHO_AUDIT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_LIFECYCLE_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_NPM_AUDIT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_PATTERN_AUDIT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_PERFORMANCE_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_RECOVERY_REPORT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_SECTOR_AUDIT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_SOAK_VALIDATION.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE8_SOURCE_AUDIT.json` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE9_BROWSER_VALIDATION.json` | Machine-readable Phase 9 validation evidence | Validation tooling | No |
| `docs/PHASE9_CANONICAL_EXTRACTION.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE9_COMBO_AUDIT.json` | Machine-readable Phase 9 validation evidence | Validation tooling | No |
| `docs/PHASE9_LIFECYCLE_VALIDATION.json` | Machine-readable Phase 9 validation evidence | Validation tooling | No |
| `docs/PHASE9_NPM_AUDIT.json` | Machine-readable Phase 9 validation evidence | Validation tooling | No |
| `docs/PHASE9_PERFORMANCE_VALIDATION.json` | Machine-readable Phase 9 validation evidence | Validation tooling | No |
| `docs/PHASE9_PROGRESSION_AUDIT.json` | Machine-readable Phase 9 validation evidence | Validation tooling | No |
| `docs/PHASE9_RECOVERY_REPORT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/PHASE9_SCORE_AUDIT.json` | Machine-readable Phase 9 validation evidence | Validation tooling | No |
| `docs/PHASE9_SOAK_VALIDATION.json` | Machine-readable Phase 9 validation evidence | Validation tooling | No |
| `docs/PHASE9_SOURCE_AUDIT.json` | Machine-readable Phase 9 validation evidence | Validation tooling | No |
| `docs/PHASE9_STATISTICS_AUDIT.json` | Machine-readable Phase 9 validation evidence | Validation tooling | No |
| `docs/QA_CHECKLIST.md` | Canonical design authority | Preproduction documents | No |
| `docs/RELEASE_NOTES_v1.0.0.md` | Project state, design extraction, or release evidence | Documentation | No |
| `docs/screenshots/ECHOFRAME_phase10_accessibility.png` | Validated Phase 10 release-candidate screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase10_boss_phase3.png` | Validated Phase 10 release-candidate screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase10_controls_rebinding.png` | Validated Phase 10 release-candidate screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase10_credits.png` | Validated Phase 10 release-candidate screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase10_fatal_screen.png` | Validated Phase 10 release-candidate screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase10_full_combat.png` | Validated Phase 10 release-candidate screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase10_main_menu.png` | Validated Phase 10 release-candidate screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase10_results.png` | Validated Phase 10 release-candidate screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase10_tutorial_echo.png` | Validated Phase 10 release-candidate screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase10_tutorial_movement.png` | Validated Phase 10 release-candidate screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase11_rc_accessibility_chromium.png` | Historical validated runtime screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase11_rc_credits_chromium.png` | Historical validated runtime screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase11_rc_main_menu_chromium.png` | Historical validated runtime screenshot | Validation documentation | No |
| `docs/screenshots/ECHOFRAME_phase11_rc_results_chromium.png` | Historical validated runtime screenshot | Validation documentation | No |
| `docs/TECHNICAL_SPEC.md` | Canonical design authority | Preproduction documents | No |
| `docs/VALIDATION_REPORT.md` | Project state, design extraction, or release evidence | Documentation | No |
| `eslint.config.js` | Repository configuration or release metadata | Repository/tooling | No |
| `index.html` | Repository configuration or release metadata | Repository/tooling | No |
| `LICENSE` | Repository configuration or release metadata | Repository/tooling | No |
| `package-lock.json` | Repository configuration or release metadata | Repository/tooling | No |
| `package.json` | Repository configuration or release metadata | Repository/tooling | No |
| `public/favicon.svg` | Static browser/PWA asset | Repository/tooling | No |
| `public/manifest.webmanifest` | Static browser/PWA asset | Repository/tooling | No |
| `README.md` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/aggregate-phase5-lifecycle.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/generate-file-manifest.mjs` | Generates this repository manifest | Documentation tooling | No |
| `scripts/phase10-accessibility-audit.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-accessibility-browser-validation.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-active-soak-validation.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-binding-audit.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-browser-helpers.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-browser-validation.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-core-validation.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-deployment-validation.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-firefox-validation.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-generate-release-docs.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-lifecycle-validation.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-menu-idle-validation.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-package-release.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-performance-validation.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-release-audit.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-security-audit.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-source-audit.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase10-tutorial-audit.mjs` | Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase11-browser-chromium-validation.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-certification-status.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-ci-aggregate.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-ci-validation.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-cross-browser-determinism.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-deployment-validation.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-final-release-audit.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-firefox-validation.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-generate-docs.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-package-candidate.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-package-final.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-recovery.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-source-security.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-utils.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase11-validate-candidate-archives.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase5-browser-validation.mjs` | Historical Phase 5 validation harness | Validation tooling | No |
| `scripts/phase5-lifecycle-validation.mjs` | Historical Phase 5 validation harness | Validation tooling | No |
| `scripts/phase5-seed-audit.mjs` | Historical Phase 5 validation harness | Validation tooling | No |
| `scripts/phase5-soak-validation.mjs` | Historical Phase 5 validation harness | Validation tooling | No |
| `scripts/phase5-source-audit.mjs` | Historical Phase 5 validation harness | Validation tooling | No |
| `scripts/phase6-browser-validation.mjs` | Phase 6 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase6-elite-matrix-validation.mjs` | Phase 6 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase6-lifecycle-validation.mjs` | Phase 6 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase6-seed-audit.mjs` | Phase 6 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase6-soak-validation.mjs` | Phase 6 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase6-source-audit.mjs` | Phase 6 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase7-arena-audit.mjs` | Phase 7 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase7-browser-validation.mjs` | Phase 7 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase7-lifecycle-validation.mjs` | Phase 7 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase7-seed-audit.mjs` | Phase 7 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase7-soak-validation.mjs` | Phase 7 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase7-source-audit.mjs` | Phase 7 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase7-upgrade-audit.mjs` | Phase 7 deterministic/browser/lifecycle/soak validation harness | Validation tooling | No |
| `scripts/phase8-browser-validation.mjs` | Repository configuration or release metadata | Repository/tooling | No |
| `scripts/phase9-audit-helpers.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase9-browser-validation.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase9-combo-audit.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase9-lifecycle-validation-resume.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase9-lifecycle-validation.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase9-performance-validation.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase9-progression-audit.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase9-score-audit.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase9-soak-validation.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase9-source-audit.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `scripts/phase9-statistics-audit.mjs` | Phase 9 deterministic/browser/lifecycle/soak/performance validation harness | Validation tooling | No |
| `src/arena/ArenaCollisionRegistry.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaDescriptor.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaFallback.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaGenerator.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaGeometryFactory.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaHazardValidator.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaHistory.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaNavigationValidator.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaRandomStreams.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaRuntime.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaSnapshot.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaSocketValidator.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaTemplate.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaTemplateCatalog.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaTransform.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaTransformResolver.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/arena/ArenaValidator.js` | Authored arena descriptor, generation, transform, navigation, validation, or runtime logic | ArenaManager / ArenaGenerator | Yes |
| `src/boss/attacks/DrifterSummonAttack.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/attacks/HostileEchoAttack.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/attacks/RearPanelExposureAttack.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/attacks/RotatingFanAttack.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/attacks/SectorDeletionAttack.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/attacks/TargetedLineVolleyAttack.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossActivationProfile.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossArenaAdapter.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossAttackCatalog.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossAttackDefinition.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossAttackScheduler.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossCompletionRules.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossDestructionController.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossOutcomeResolver.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossRandomStreams.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossSnapshot.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/BossVulnerabilityController.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/NullArchitectController.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/NullArchitectPhase.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/boss/NullArchitectState.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/buffers/ActionEventRingBuffer.js` | Bounded replay/event ring buffer | EchoRecorder | Yes |
| `src/buffers/SnapshotRingBuffer.js` | Bounded replay/event ring buffer | EchoRecorder | Yes |
| `src/combat/DamagePacket.js` | Faction-aware damage packet/result/resolution logic | DamageService | No |
| `src/combat/DamageResult.js` | Faction-aware damage packet/result/resolution logic | DamageService | No |
| `src/combat/DamageService.js` | Faction-aware damage packet/result/resolution logic | DamageService | No |
| `src/combat/Faction.js` | Faction-aware damage packet/result/resolution logic | DamageService | No |
| `src/components/ContactDamageComponent.js` | Reusable health, invulnerability, or contact-damage component | Owning entity | Yes |
| `src/components/HealthComponent.js` | Reusable health, invulnerability, or contact-damage component | Owning entity | Yes |
| `src/components/HitInvulnerabilityComponent.js` | Reusable health, invulnerability, or contact-damage component | Owning entity | Yes |
| `src/data/accessibility.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/arenaDecorationDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/arenaHazardDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/arenaStageEligibility.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/arenaTemplateDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/arenaTransformDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/bossAttackDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/bossBalance.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/bossDifficultyRules.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/bossPhaseDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/bossProjectileDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/bossSectorDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/collisionCategories.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/combatBalance.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/comboDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/constants.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/coreEnemyDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/cosmeticDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/difficulty.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/echoBalance.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/eliteBalance.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/eliteEligibilityDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/eliteEncounterRules.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/eliteModifierDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/encounterBalance.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/encounterPatterns.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/encounterSlice.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/enemyDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/enemySynergyDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/hostileEchoDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/phase4UpgradePool.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/phase6RunSegments.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/phase7RunSegments.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/phase8RunSegments.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/playerBalance.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/progressionDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/prototypeArena.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/recoveryChamberDefinition.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/sceneKeys.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/scoreDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/spawnPointDefinitions.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/data/tutorialArena.js` | Immutable balance, definitions, settings, or authored metadata | Data layer | No |
| `src/elites/EliteActivationProfile.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/EliteEligibility.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/EliteEncounterValidator.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/EliteModifierController.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/EliteModifierDefinition.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/EliteModifierLifecycle.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/EliteModifierRegistry.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/EliteModifierType.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/EliteSelectionPlanner.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/EliteSnapshot.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/EliteThreatModel.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/modifiers/OverclockedModifier.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/modifiers/ReplicatingModifier.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/elites/modifiers/ResonantModifier.js` | Elite modifier composition, eligibility, activation, lifecycle, and validation logic | EliteManager / EliteModifierController | No |
| `src/encounter/EncounterCompositionValidator.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/encounter/EncounterDescriptor.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/encounter/EncounterGenerator.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/encounter/EncounterHistory.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/encounter/EncounterPatternCatalog.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/encounter/EncounterRandomStreams.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/encounter/EnemySynergyRules.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/encounter/RecoveryWindowController.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/encounter/SpawnPlanner.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/encounter/SpawnSafetyValidator.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/encounter/ThreatBudgetModel.js` | Pure threat, generation, history, validation, recovery, or spawn-planning logic | EncounterGenerator | No |
| `src/enemies/BaseEnemy.js` | Pooled Phaser-facing enemy entity | EnemyManager | Yes |
| `src/enemies/Bulwark.js` | Pooled Phaser-facing enemy entity | EnemyManager | Yes |
| `src/enemies/Drifter.js` | Pooled Phaser-facing enemy entity | EnemyManager | Yes |
| `src/enemies/Lancer.js` | Pooled Phaser-facing enemy entity | EnemyManager | Yes |
| `src/enemies/Sentry.js` | Pooled Phaser-facing enemy entity | EnemyManager | Yes |
| `src/enemies/ShardCarrier.js` | Pooled Phaser-facing enemy entity | EnemyManager | Yes |
| `src/enemies/Suppressor.js` | Pooled Phaser-facing enemy entity | EnemyManager | Yes |
| `src/enemy-ai/BulwarkBrain.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/bulwarkDefense.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/carrierHazardPlacement.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/DrifterBrain.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/EnemyIntent.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/EnemyRole.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/EnemyStateMachine.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/enemySteering.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/lancerAttackSpace.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/LancerBrain.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/SentryBrain.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/ShardCarrierBrain.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/steering.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/enemy-ai/SuppressorBrain.js` | Pure enemy behavior, state, steering, defense, or attack-space logic | Enemy AI | No |
| `src/entities/BossProjectile.js` | Pooled or scene-owned gameplay entity | Owning gameplay manager | Yes |
| `src/entities/CarrierShard.js` | Pooled or scene-owned gameplay entity | Owning gameplay manager | Yes |
| `src/entities/CompletionTerminal.js` | Pooled or scene-owned gameplay entity | Owning gameplay manager | Yes |
| `src/entities/Echo.js` | Pooled or scene-owned gameplay entity | Owning gameplay manager | Yes |
| `src/entities/EchoProjectile.js` | Pooled or scene-owned gameplay entity | Owning gameplay manager | Yes |
| `src/entities/EnemyProjectile.js` | Pooled or scene-owned gameplay entity | Owning gameplay manager | Yes |
| `src/entities/Player.js` | Pooled or scene-owned gameplay entity | Owning gameplay manager | Yes |
| `src/entities/PlayerProjectile.js` | Pooled or scene-owned gameplay entity | Owning gameplay manager | Yes |
| `src/entities/TargetDummy.js` | Pooled or scene-owned gameplay entity | Owning gameplay manager | Yes |
| `src/gameConfig.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/graphics/BossDestructionRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/BossSectorRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/BulwarkRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/DrifterRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/EchoRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/EliteOverlayRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/EnemyProjectileRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/HostileEchoRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/LancerRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/NullArchitectRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/PlayerRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/ProjectileRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/SentryRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/ShardCarrierRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/SuppressorRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/TargetDummyRenderer.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/graphics/TextureFactory.js` | Procedural renderer or texture factory | Owning entity/scene | Yes |
| `src/hostile-echo/HostileEcho.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/hostile-echo/HostileEchoEventConverter.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/hostile-echo/HostileEchoManager.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/hostile-echo/HostileEchoProjectileProfile.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/hostile-echo/HostileEchoReplay.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/hostile-echo/HostileEchoSnapshot.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/hostile-echo/HostileEchoSpawnValidator.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/input/BindingCatalog.js` | Serializable binding normalization, migration, labels, and conflict validation | InputManager / SettingsManager | No |
| `src/input/BindingMigration.js` | Serializable binding normalization, migration, labels, and conflict validation | InputManager / SettingsManager | No |
| `src/main.js` | Application bootstrap or Phaser configuration | Application bootstrap | Yes |
| `src/pools/CarrierShardPool.js` | Bounded reusable object pool | Owning gameplay manager | Yes |
| `src/pools/EchoPool.js` | Bounded reusable object pool | Owning gameplay manager | Yes |
| `src/pools/EnemyPool.js` | Bounded reusable object pool | Owning gameplay manager | Yes |
| `src/pools/EnemyProjectilePool.js` | Bounded reusable object pool | Owning gameplay manager | Yes |
| `src/pools/ObjectPool.js` | Bounded reusable object pool | Owning gameplay manager | Yes |
| `src/pools/ProjectilePool.js` | Bounded reusable object pool | Owning gameplay manager | Yes |
| `src/progression/ArchiveDiscoveryManager.js` | Breadth-only unlock, cosmetic, and Archive discovery logic | ProgressionManager | Yes |
| `src/progression/CosmeticSelection.js` | Breadth-only unlock, cosmetic, and Archive discovery logic | ProgressionManager | Yes |
| `src/progression/ProgressionManager.js` | Breadth-only unlock, cosmetic, and Archive discovery logic | ProgressionManager | Yes |
| `src/progression/UnlockEvaluator.js` | Breadth-only unlock, cosmetic, and Archive discovery logic | ProgressionManager | Yes |
| `src/progression/UnlockTransaction.js` | Breadth-only unlock, cosmetic, and Archive discovery logic | ProgressionManager | Yes |
| `src/run/RunCompletionRules.js` | Deterministic run plan and pre-boss progression logic | RunProgressionController | No |
| `src/run/RunPlan.js` | Deterministic run plan and pre-boss progression logic | RunProgressionController | No |
| `src/run/RunPlanGenerator.js` | Deterministic run plan and pre-boss progression logic | RunProgressionController | No |
| `src/run/RunProgressionController.js` | Deterministic run plan and pre-boss progression logic | RunProgressionController | No |
| `src/run/RunSegmentDefinition.js` | Deterministic run plan and pre-boss progression logic | RunProgressionController | No |
| `src/run/RunSegmentType.js` | Deterministic run plan and pre-boss progression logic | RunProgressionController | No |
| `src/run/RunTransitionValidator.js` | Deterministic run plan and pre-boss progression logic | RunProgressionController | No |
| `src/scenes/ArchiveScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/BaseScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/BootScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/BossScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/CreditsScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/HUDScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/MainMenuScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/MenuSceneBase.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/PauseScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/PreloadScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/RecoveryScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/ResultsScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/RunScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/SettingsScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/StatisticsScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/TutorialScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scenes/UpgradeScene.js` | Phaser scene and scene-level coordination/UI | SceneFlowController / scene | Yes |
| `src/scoring/AvoidanceBonusCalculator.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/scoring/ComboController.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/scoring/MultiKillTracker.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/scoring/ScoreBreakdown.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/scoring/ScoreCalculator.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/scoring/ScoreEvent.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/scoring/ScoreEventLedger.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/scoring/ScoreManager.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/scoring/ScoreSnapshot.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/scoring/ScoreTelemetry.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/scoring/TimeBonusCalculator.js` | Deterministic score ledger, combo, bonus, calculation, or telemetry logic | ScoreManager / RunFinalizationService | Yes |
| `src/state/ChamberState.js` | Run/save/combat/player state model | GameState / RunState | Yes |
| `src/state/CombatState.js` | Run/save/combat/player state model | GameState / RunState | Yes |
| `src/state/defaultSaveData.js` | Run/save/combat/player state model | GameState / RunState | Yes |
| `src/state/EchoPrototypeStatistics.js` | Run/save/combat/player state model | GameState / RunState | Yes |
| `src/state/EchoState.js` | Run/save/combat/player state model | GameState / RunState | Yes |
| `src/state/GameState.js` | Run/save/combat/player state model | GameState / RunState | Yes |
| `src/state/PlayerState.js` | Run/save/combat/player state model | GameState / RunState | Yes |
| `src/state/PrototypeStatistics.js` | Run/save/combat/player state model | GameState / RunState | Yes |
| `src/state/RunState.js` | Run/save/combat/player state model | GameState / RunState | Yes |
| `src/state/SaveSchema.js` | Run/save/combat/player state model | GameState / RunState | Yes |
| `src/statistics/AggregateStatisticsManager.js` | Run aggregation, personal-best, recent-run, or formatting logic | AggregateStatisticsManager | Yes |
| `src/statistics/PersonalBestManager.js` | Run aggregation, personal-best, recent-run, or formatting logic | AggregateStatisticsManager | Yes |
| `src/statistics/RecentRunRecord.js` | Run aggregation, personal-best, recent-run, or formatting logic | AggregateStatisticsManager | Yes |
| `src/statistics/RunStatisticsAggregator.js` | Run aggregation, personal-best, recent-run, or formatting logic | AggregateStatisticsManager | Yes |
| `src/statistics/StatisticsFormatter.js` | Run aggregation, personal-best, recent-run, or formatting logic | AggregateStatisticsManager | Yes |
| `src/styles/main.css` | Browser shell styling | Repository/tooling | No |
| `src/systems/AppServices.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/ArenaDebugController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/ArenaHazardManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/ArenaManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/ArenaTelemetry.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/AudioManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/BossDebugController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/BossHandoffController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/BossProjectileManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/BossSectorManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/BossSummonController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/BossTelemetry.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/CameraController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/CarrierShardManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/ChainProjectileManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/ChamberController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/CollisionManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/CombatFeedbackSystem.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/CombatStatistics.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/CrossfireTracker.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/DashModel.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/DashWakeManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/DebugManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/DeflectionPulseManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/DirectorDebugController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EchoCooldownModel.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EchoLoadoutSnapshot.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EchoPlaybackSystem.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EchoProjectileManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EchoRecorder.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EliteDebugController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EliteManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EliteTelemetry.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EncounterDirector.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EncounterTelemetry.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EnemyManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EnemyProjectileManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/EnemyRosterManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/FatalErrorPresenter.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/FragmentProjectileManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/InputManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/MajorExecutionCoordinator.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/MemoryBurstManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/NearMissTracker.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/PlayerController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/PlayerFeedbackSystem.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/ProjectileInterceptionService.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/ProjectileManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/RecoveryChamberController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/ReplicationSpawnService.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/ResonantShieldService.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/RunFinalizationService.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/SaveManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/SceneFlowController.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/SettingsManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/SuppressionModifierService.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/UIFocusManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/UpgradeManager.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/UpgradeTelemetry.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/WeaponClock.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/systems/WeaponSystem.js` | Gameplay/application manager or simulation system | Named system | Yes |
| `src/tutorial/TutorialController.js` | Playable tutorial state, qualification, and progression logic | TutorialController | No |
| `src/tutorial/TutorialObjectiveValidator.js` | Playable tutorial state, qualification, and progression logic | TutorialController | No |
| `src/tutorial/TutorialState.js` | Playable tutorial state, qualification, and progression logic | TutorialController | No |
| `src/tutorial/TutorialStepCatalog.js` | Playable tutorial state, qualification, and progression logic | TutorialController | No |
| `src/ui/ConfirmationModal.js` | Reusable keyboard/pointer UI control | Owning scene | Yes |
| `src/ui/DebugOverlay.js` | Reusable keyboard/pointer UI control | Owning scene | Yes |
| `src/ui/FocusableControl.js` | Reusable keyboard/pointer UI control | Owning scene | Yes |
| `src/ui/MenuButton.js` | Reusable keyboard/pointer UI control | Owning scene | Yes |
| `src/upgrades/behaviors/AfterburnBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/ArcRelayBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/DashWakeBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/DeflectionPulseBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/ExtendedMemoryBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/FractureRoundBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/KineticChargeBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/MemoryBurstBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/NullAbsorptionBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/PhantomShieldBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/PhaseRecoveryBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/ResonantDamageBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/RicochetBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/SlipstreamBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/TwinRecallBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/behaviors/VectorReversalBehavior.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeApplier.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeCatalog.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeDefinition.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeDescriptionFormatter.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeEligibility.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeInteractionRegistry.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeOfferGenerator.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeOfferValidator.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeRuntimeHooks.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeSnapshot.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/upgrades/UpgradeStatPipeline.js` | Run-local upgrade definition, offer, or application logic | UpgradeManager | No |
| `src/utils/angleMath.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/arenaGeometry.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/assertions.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/CleanupRegistry.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/deterministicShuffle.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/EventBus.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/math.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/physicsCleanup.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/playerMath.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/projectileDamage.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/replayEvents.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/replayInterpolation.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/SeededRandom.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/storage.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/version.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `src/utils/weightedSelection.js` | Shared deterministic, lifecycle, storage, math, or geometry utility | Shared utility layer | No |
| `tests/actionEventRingBuffer.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/combatHealth.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/crossfireTracker.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/damageService.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/dashModel.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/echoCooldown.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/echoLoadout.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/echoRecorder.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/echoState.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/echoStatistics.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/encounterUpgrade.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/enemyLogic.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/objectPool.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase10-release-candidate.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase11-certification.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase5Director.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase5EncounterExtended.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase5EnemyMechanicsExtended.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase6EliteModifiers.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase6RunPlan.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase6RunProgression.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase7-arena.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase7-run-tail.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase7-upgrades.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase8-boss-core.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase8-hostile-sector-panel.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase8-patterns.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase8-run-integration.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase8-upgrade-interactions.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase9-finalization.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase9-progression.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase9-score.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/phase9-ui.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/playerMath.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/playerState.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/prototypeStatistics.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/replayEvents.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/replayInterpolation.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/saveSchema.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/sceneFlow.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/snapshotRingBuffer.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/storage.test.js` | Node regression/mechanic test | Automated tests | No |
| `tests/weaponClock.test.js` | Node regression/mechanic test | Automated tests | No |
| `vite.config.js` | Repository configuration or release metadata | Repository/tooling | No |
