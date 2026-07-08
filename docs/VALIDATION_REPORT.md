# ECHOFRAME: LAST SIGNAL — Validation Report

## Version 1.0 validation model

Version 1.0 is certified through executable reports generated from one exact source commit. Stored prose is descriptive only; machine-readable reports and workflow results control release authorization.

Required final gates include:

- `1,329` automated tests
- ESLint and production build
- deterministic score, combo, progression, statistics, tutorial, binding, accessibility, source, security, and npm audits
- real hosted Chromium production matrix
- real hosted Firefox production matrix with game execution
- root and `/echoframe-test/` static validation in both engines
- cross-browser deterministic comparison
- accessibility and Web Audio certification
- 60-cycle Chromium lifecycle
- Firefox lifecycle subset
- 30-minute menu idle
- 30-minute active gameplay soak
- 10-minute Firefox soak
- Chromium and Firefox performance validation
- source and web archive clean-extraction validation
- GitHub Pages deployment of the certified build
- public Chromium and Firefox validation
- final audit and publication sign-off
- annotated `v1.0.0` tag and verified GitHub Release assets

## Evidence map

Core and browser evidence:

- `PHASE10_CORE_VALIDATION.json`
- `PHASE12_BROWSER_CHROMIUM_VALIDATION.json`
- `PHASE12_BROWSER_FIREFOX_VALIDATION.json`
- `PHASE12_DEPLOYMENT_VALIDATION.json`
- `PHASE12_CROSS_BROWSER_DETERMINISM.json`
- `PHASE13_FINAL_CHROMIUM_VALIDATION.json`
- `PHASE13_FINAL_FIREFOX_VALIDATION.json`
- `PHASE13_FINAL_CROSS_BROWSER_DETERMINISM.json`

Lifecycle, soak, and performance:

- `PHASE10_LIFECYCLE_VALIDATION.json`
- `PHASE13_FIREFOX_LIFECYCLE_VALIDATION.json`
- `PHASE10_MENU_IDLE_VALIDATION.json`
- `PHASE10_ACTIVE_SOAK_VALIDATION.json`
- `PHASE13_FIREFOX_SOAK_VALIDATION.json`
- `PHASE10_PERFORMANCE_VALIDATION.json`
- `PHASE13_FIREFOX_PERFORMANCE_VALIDATION.json`
- `PHASE13_PERFORMANCE_VALIDATION.json`

Packaging and publication:

- `PHASE13_NONPUBLIC_RELEASE_AUDIT.json`
- `PHASE13_PACKAGE_BUILD.json`
- `PHASE13_SOURCE_ARCHIVE_VALIDATION.json`
- `PHASE13_WEB_ARCHIVE_VALIDATION.json`
- `PHASE13_PUBLIC_DEPLOYMENT_VALIDATION.json`
- `PHASE13_FINAL_RELEASE_AUDIT.json`
- `PHASE13_RELEASE_SIGNOFF.json`
- `PHASE13_RELEASE_CHECKLIST.md`
- `../release/ECHOFRAME_v1.0.0_RELEASE_MANIFEST.json`
- `../release/PHASE13_PUBLICATION_VERIFICATION.json`

## Evidence rules

- Browser evidence must come from real installed Chromium or Firefox, not emulation.
- Final evidence must match the exact Version 1.0 source-manifest digest.
- Long-session gates use real wall-clock duration.
- Performance thresholds are not weakened for hosted execution.
- Canonical documents remain byte-identical.
- Critical, High, and release-blocking Medium defect totals must be zero.
- Public launch is not claimed until the actual HTTPS Pages URL passes both browser validators.
- Tag and release creation occur only after evidence-derived final sign-off.
