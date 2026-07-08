# ECHOFRAME: LAST SIGNAL — Phase 12 Implementation Prompt

Continue development of **ECHOFRAME: LAST SIGNAL** from the verified but not promoted **Phase 11 certification candidate**.

Act as all of the following simultaneously:

- senior Phaser 3 release engineer
- Firefox/Gecko certification engineer
- Chromium validation engineer
- GitHub Actions and GitHub Pages engineer
- JavaScript/Web Platform compatibility engineer
- cross-browser determinism engineer
- Vite/static-deployment engineer
- save-compatibility engineer
- accessibility and Web Audio certification engineer
- lifecycle, performance, security, and release-packaging lead

Implement and fully validate:

```text
Phase 12: External Gecko Certification, CI Execution,
Public Deployment, and Version 1.0 Final Promotion

Target final version: 1.0.0
```

Do not use Codex. Work directly from the uploaded Phase 11 certification candidate and any available supported browser/GitHub environment.

This is a **release-closure phase**, not a content phase. Do not add enemies, arenas, upgrades, bosses, modes, narrative content, mobile controls, gamepad controls, localization, online services, or post-release features.

The purpose of Phase 12 is to execute the gates that Phase 11 could not execute, fix only genuine release defects, promote the exact verified source to Version 1.0 after all pre-promotion gates pass, rerun the complete final-version validation suite, package final artifacts, and return an evidence-derived release verdict.

Do not promote to `1.0.0` merely because the candidate appears complete.

---

# Authoritative inputs

I will provide as many of the following as are available:

1. `ECHOFRAME_phase11_certification_candidate.zip`
2. `ECHOFRAME_phase11_certification_candidate_web.zip`
3. `ECHOFRAME_phase11_SHA256SUMS.txt`
4. `ECHOFRAME_phase11_CERTIFICATION_MANIFEST.json`
5. `ECHOFRAME_phase11_candidate_archive_validation.json`
6. Phase 11 reports under `docs/`
7. This Phase 12 implementation prompt
8. A GitHub repository URL, connected repository, or local Git checkout
9. A public GitHub Pages URL when one exists
10. GitHub Actions logs or external Firefox evidence when available
11. Explicit publication authorization when commit/tag/push/deploy/release actions are expected

Expected Phase 11 source candidate:

```text
Archive:
ECHOFRAME_phase11_certification_candidate.zip

Expected SHA-256:
0471a46aa98e7b23c2f50b2e20bdcc143d78c959c465ab41f83310303ad720ed

Expected archive metrics:
635 total ZIP entries
597 regular files
38 directory entries

Expected package/runtime version:
1.0.0-release-candidate

Expected source manifest digest:
3be6c352bb402201c24c32067bbd281dc0493008e19f469f1827ceebffd4fa78

Expected tests:
1299/1299

Retained Phase 10 tests:
1272

Phase 11 tests:
27
```

Expected Phase 11 web candidate:

```text
Archive:
ECHOFRAME_phase11_certification_candidate_web.zip

Expected SHA-256:
9fabe142d2dcf733f02b4c43e14942e9d15b95f472d7cd477783e9060a11572c

Expected archive metrics:
6 total ZIP entries
5 regular files
1 directory entry
```

Do not trust these values without independently verifying the files.

The following canonical documents remain authoritative and must not be modified:

- `GAME_DESIGN.md`
- `TECHNICAL_SPEC.md`
- `ART_DIRECTION.md`
- `BALANCE_SPEC.md`
- `QA_CHECKLIST.md`

Treat the Phase 11 source ZIP as the implementation baseline. Do not fall back to an earlier release except for targeted regression comparison.

---

# Expected Phase 11 state to verify

The Phase 11 candidate is expected to include:

- complete playable First Signal tutorial
- fresh-save tutorial routing
- returning-player bypass
- Archive tutorial replay
- schema-2 keyboard/pointer bindings
- Phase 9 save migration
- real rebinding and conflict rejection
- primary/secondary bindings
- immediate runtime input-context rebuilding
- accessibility conformance
- controlled fatal presentation
- final production-facing copy
- Chromium certification
- root and `/echoframe-test/` static deployment certification
- source-manifest and production-bundle hashing
- source-bound evidence mapping
- real-Firefox-only validation harnesses
- cross-browser determinism scripts
- protected GitHub Actions and Pages workflows
- release-promotion guards
- candidate source/web packaging
- clean-extraction validation
- 1299 automated tests

Expected open gates:

```text
1. Real Firefox game execution
2. Complete Firefox production matrix
3. Chromium-versus-Firefox deterministic comparison
4. Actual GitHub Actions execution
5. Actual GitHub Pages validation when public launch is required
6. Promotion to 1.0.0
7. Final-version lifecycle validation
8. Final-version 30-minute menu idle
9. Final-version 30-minute active gameplay soak
10. Final Version 1.0 packaging and clean-extraction validation
11. Evidence-derived final sign-off
```

Expected previous Firefox state:

```text
environment-blocked-no-firefox-executable
gameCodeExecuted: false
```

Phase 12 must replace this with real Gecko execution or retain the release-candidate verdict.

---

# Phase 12 objective

Produce a genuine, reproducible, cross-browser-certified **Version 1.0** release.

Target identity:

```text
Package version: 1.0.0
Runtime version: 1.0.0
Release label: Version 1.0
Production subtitle: Fight with your past. Rebuild the signal.
Git tag: v1.0.0
```

Preserve the complete flow:

```text
Fresh save
→ Main Menu
→ First Signal Tutorial
→ Combat 1
→ complete run
→ Null Architect
→ Results

Returning save
→ Main Menu
→ Combat 1 directly

Archive
→ Replay Tutorial
→ return to Archive
```

Phase 12 must:

1. Independently recover and verify Phase 11.
2. Establish a supported real Firefox environment.
3. Execute the complete Firefox production matrix.
4. Fix every reproducible product defect found.
5. Add focused regression tests for each product defect.
6. Revalidate Chromium against the same source digest.
7. Complete cross-browser deterministic comparison.
8. Execute the GitHub Actions browser matrix when repository access is available.
9. Validate the actual GitHub Pages deployment when public launch is expected.
10. Promote to `1.0.0` only after pre-promotion gates pass.
11. Rerun all mandatory final-version gates against the exact promoted source.
12. Create final source and web archives.
13. Validate both archives from clean extraction in Chromium and Firefox.
14. Produce checksums, manifests, screenshots, documentation, and evidence-derived sign-off.
15. Publish commit/tag/release/Pages only when explicitly authorized.
16. Stop after Version 1.0 release closure.

---

# Out of scope

Do not implement:

- mobile/touch controls
- gamepad controls
- localization
- new enemies, elites, arenas, upgrades, or bosses
- alternate boss variants
- endless mode or New Game Plus
- daily/weekly challenges
- online leaderboards
- accounts/authentication
- cloud saves
- analytics or remote telemetry
- backend services
- monetization
- platform achievements
- Steam/store integration
- user-generated content
- PWA/service-worker expansion
- new narrative/cutscenes/voice acting
- permanent combat-stat progression
- Version 1.1 planning
- engine migration, ECS migration, or unrelated refactoring

---

# First action: recover and establish truth

Before modifying code:

1. Extract the Phase 11 source archive into a clean working directory.
2. Compute and record:
   - source ZIP SHA-256
   - byte size
   - total ZIP-entry count
   - regular-file count
   - directory-entry count
3. Verify repository-root contents are directly contained.
4. Confirm exclusions:
   - `node_modules`
   - `dist`
   - `.git`
   - browser profiles/caches
   - temporary servers/logs
   - prior release archives
5. Verify the Phase 11 web ZIP and its metrics.
6. Recompute canonical-document hashes.
7. Verify the Phase 11 source-manifest digest.
8. Verify the production-bundle digest.
9. Run `npm ci`.
10. Record OS, kernel, architecture, Node, npm, Playwright, Chromium, Firefox, Git, and GitHub CLI versions.
11. Inspect `package.json`, lockfile, scripts, workflows, promotion guards, packaging scripts, evidence scripts, and all Phase 11 reports.
12. Confirm all 1299 tests remain.
13. Run the complete baseline pipeline before modifications.
14. Create:

```text
docs/PHASE12_RECOVERY_REPORT.md
docs/PHASE12_ENVIRONMENT_REPORT.json
docs/PHASE12_EVIDENCE_MAP.json
docs/PHASE12_EVIDENCE_INVALIDATION.md
```

The recovery report must include the archive metrics, hashes, canonical hashes, versions, source/bundle digests, test state, browser state, CI state, public deployment state, open gates, inconsistencies, and planned modifications.

Do not modify the canonical documents. Do not rebuild the project from scratch.

---

# Baseline validation

Run at minimum:

```text
npm ci
npm run lint
npm run test
npm run build
npm run validate
npm run validate:core:phase10
npm run audit:score
npm run audit:combo
npm run audit:progression
npm run audit:statistics
npm run audit:tutorial
npm run audit:bindings
npm run audit:accessibility
npm run audit:source
npm run audit:security
npm audit
```

Also run every real Phase 11 browser, deployment, determinism, release-audit, and packaging script present.

Expected baseline:

```text
1299/1299 tests
```

Do not delete, skip, rename away, or weaken tests.

---

# Supported Firefox execution

Use a real Firefox/Gecko browser.

Acceptable:

1. Current supported system Firefox.
2. Playwright-managed Firefox installed with:

```text
npx playwright install --with-deps firefox
```

3. GitHub-hosted Ubuntu runner with Playwright Firefox.
4. Supported Docker/container environment that actually launches Firefox.
5. Another supported external machine whose exact environment and source digest are recorded.

Not acceptable:

- Chromium with Firefox user-agent or headers
- WebKit substitution
- mocked browser APIs
- source inspection alone
- stored report reuse without matching source digest
- treating launch failure as compatibility evidence
- manually editing a report to pass

Record exact Firefox executable/version, Gecko/Playwright version, OS/kernel, architecture, headed/headless mode, source digest, bundle digest, test base, timestamp, screenshots, console/network evidence, and whether game code executed.

If local Firefox cannot run, use CI or another supported environment. If no real Firefox environment exists, stop before promotion and retain release-candidate identity.

---

# Firefox production matrix

Run production `dist`, not the Vite development server.

## Startup and presentation

Validate Boot, Preload, save-before-settings ordering, generated textures, no white screen, no raw stack, controlled fatal validation hook only in development validation mode, production debug flags inert, metadata, version, manifest, favicon, and clean initial network requests.

## Audio

Validate user-gesture startup, one AudioContext maximum, successful resume, muted continuation after forced failure, volume/mute changes, paused/tutorial/combat/elite/boss/victory mixes, no duplicate music after restart, bounded voice counts, and procedural buffers generated outside hot callbacks.

## Fresh tutorial

Validate fresh-save entry, ordered checkpoints, normalized movement, pointer-world aiming, left-click firing, accepted player damage, keyboard/right-click dash, canvas-only context-menu suppression, path recording, recorded fire events, Echo deployment, shield target rear-hit ownership rules, final gate, completion persistence, Combat 1 transition, and complete score/progression exclusion.

## Returning and replay

Validate returning-player bypass, difficulty preservation, Archive replay, no run ID/history/progression from replay, return to Archive, and idempotent completion.

## Input and rebinding

Validate `KeyboardEvent.code`, default movement, alternate keys, pointer buttons 0/2, held fire, dash, Echo, pause, Escape fallback, capture modal, primary/secondary bindings, optional-secondary clear, conflicts/reserved inputs, Escape cancellation, click-through prevention, held-input suppression, immediate application, persistence, defaults, focus restoration, and listener cleanup.

## Focus and visibility

Validate auto-pause on/off, blur, hidden/visible transitions, background/foreground tabs, no stuck actions, no duplicate Pause scene, no duplicate input context, correct audio mix, and correct resume state.

## Menus and data

Validate Main Menu, Pause, all six Settings categories, Upgrade, Recovery, Results, Archive, Statistics, Credits, confirmations, keyboard/mouse navigation, focus hierarchy/restoration, minimum viewport, fresh save, Phase 9 schema-1 fixture, Phase 10/11 schema-2 fixtures, export/import, malformed import preservation, future-schema rejection, clear data, defaults, and reload persistence.

## Browser APIs

Validate Clipboard success/fallback, selectable fallback, file input, input cleanup, object URL creation/revocation, downloads, pointer events, keyboard codes, context menus, focus/visibility events, Web Audio promises, and rejected-promise handling.

## Combat

Validate Combat 1, elites, hazards, upgrades, friendly/hostile Echoes, score ledger, combo/multi-kill/crossfire/near miss, Recovery, all three Null Architect phases, victory, defeat, Results, restart, and menu return.

## Accessibility presets

Validate:

1. Default
2. No shake + reduced flashes + reduced particles
3. High contrast + larger outlines + persistent locator
4. Damage numbers off + aim line off + minimum HUD opacity
5. All aids enabled

Exercise tutorial, early combat, elite, hazard, boss phases 2–3, Results, Archive, Statistics, and Settings.

## Viewports

Validate:

```text
1920×1080
1600×900
1366×768
1280×720
1024×576
```

Also validate one below-minimum viewport and verify the notice, bounded UI, unchanged world scale, visible rebinding modal, readable tutorial/boss HUD, and no duplicate canvases/scenes/listeners after resize.

## Static bases

Validate both:

```text
/
/echoframe-test/
```

For each, build production output, serve only `dist`, load directly, hard refresh, use a fresh profile, reload after save, verify manifest/favicon/imports/MIME types, confirm no `/src/`, localhost, or root-path breakage, and require clean console/network results.

Required Firefox outcome:

```text
Game code executed: true
Uncaught exceptions: 0
Console errors: 0
Failed production requests: 0
AudioContexts: maximum 1
```

Create:

```text
docs/PHASE12_BROWSER_FIREFOX_VALIDATION.json
docs/PHASE12_FIREFOX_COMPATIBILITY_NOTES.md
```

---

# Defect repair rules

For each Firefox or cross-browser defect:

1. Reproduce deterministically.
2. Record browser/environment.
3. Classify as product, standards, race, harness, or infrastructure defect.
4. Fix product code only when product behavior is wrong.
5. Fix harness only when harness behavior is wrong.
6. Add a focused unit/integration regression test where feasible.
7. Add a browser regression scenario.
8. Rerun Firefox and Chromium.
9. Apply evidence invalidation rules.
10. Add the defect to the Phase 12 register.

Prefer feature detection and standards-based code. Avoid UA sniffing, arbitrary delays, swallowed errors, broad retries, or disabling features merely to pass.

---

# Chromium revalidation

Run the equivalent final matrix in Chromium against the same source digest, including fresh/returning/replay flows, all difficulties, scoring/progression, victory/defeat, settings/rebinding, save/data, accessibility, root/subpath, focus/visibility, resize, Clipboard fallback, Credits, development fatal hook, and production debug-inertness.

Create:

```text
docs/PHASE12_BROWSER_CHROMIUM_VALIDATION.json
```

Require zero uncaught exceptions, zero console errors, and zero failed production requests.

---

# Cross-browser determinism

Run identical controlled seeds and authoritative scripted actions in Chromium and Firefox.

Compare:

- run plan
- arena order
- encounters
- elites
- upgrade offers
- recovery placement
- boss scheduler decisions
- score-event ledger
- combo transitions
- progression result
- final score
- browser-independent save serialization

Do not require frame-perfect unscripted physics equality.

Every authoritative mismatch must be zero.

Create:

```text
docs/PHASE12_CROSS_BROWSER_DETERMINISM.json
```

---

# GitHub Actions execution

Use the Phase 11 workflows as baseline. Correct only measured issues.

Required jobs:

1. Core validation
2. Chromium production validation
3. Firefox production validation
4. Root/subpath static validation
5. Cross-browser determinism
6. Release audit
7. Failure artifact upload
8. Success evidence upload

Requirements:

- `npm ci`
- supported Node version
- Playwright Chromium and Firefox
- production build
- exact exit codes
- no `continue-on-error` for required jobs
- no skipped Firefox counted as pass
- no hidden retries
- browser versions and commit SHA recorded
- evidence JSON uploaded
- screenshots/logs on failure
- minimal permissions
- no secrets exposed to browser code

When repository access exists, push an intentional certification branch, execute the workflow, inspect every job, download artifacts, fix failures, rerun until green, and record run URLs, commit SHA, browser versions, and hashes.

Create:

```text
docs/PHASE12_CI_VALIDATION.json
docs/PHASE12_CI_RUNS.md
```

Do not fabricate CI execution.

---

# Public GitHub Pages validation

When a real URL exists, validate the deployed site in Chromium and Firefox.

Verify HTTPS, exact path, assets/MIME types, hard refresh, hashed assets, no `/src/` or localhost, manifest/favicon, Main Menu, gesture audio, fresh tutorial, combat entry, save/settings/bindings persistence, Archive/Statistics, no analytics/telemetry/API calls, clean console, and zero failed requests.

Record URL, deployment timestamp, commit SHA, source/bundle digests, browser versions, network/console summaries, and screenshots.

Create:

```text
docs/PHASE12_PUBLIC_DEPLOYMENT_VALIDATION.json
```

If no URL exists, do not claim public launch.

---

# Pre-promotion gate

Keep `1.0.0-release-candidate` until all of the following pass:

- all 1299 retained tests
- all Phase 12 tests
- lint/build/core validation
- tutorial/binding/accessibility/source/security/npm audits
- Chromium production matrix
- Firefox production matrix
- root/subpath in both browsers
- cross-browser determinism
- Critical defects = 0
- High defects = 0
- release-blocking Medium defects = 0

GitHub Actions should also pass when repository access is available.

Do not promote before this gate.

---

# Promote to Version 1.0

After the pre-promotion gate, update coherently:

```text
package.json
package-lock.json
runtime version
Main Menu
Credits
index.html metadata
manifest metadata where applicable
README
CURRENT_STATE
CHANGELOG
IMPLEMENTATION_NOTES
VALIDATION_REPORT
release notes
browser-support documentation
release audit
```

Target:

```text
1.0.0
Version 1.0
```

Requirements:

- no production-facing release-candidate wording
- historical documents may retain historical wording
- save schema unchanged
- Phase 9 schema-1 and Phase 10/11 schema-2 saves remain valid
- no progression, binding, or tutorial reset
- identity regression tests added/updated

---

# Evidence invalidation

Bind every report to source digest, package/runtime version, bundle digest, browser version, OS, and timestamp.

After any source change rerun lint, tests, build, all audits, Chromium smoke, Firefox smoke, and root/subpath validation.

After runtime/input/audio/focus/save/lifecycle/Phaser/pool/timer changes, rerun full browser matrices, determinism, lifecycle, 30-minute idle, 30-minute soak, and affected performance gates.

Final evidence must correspond to the exact packaged `1.0.0` source.

---

# Tests

Retain all 1299 tests. Add tests only for actual Phase 12 changes.

Potential coverage:

- audio-resume rejection
- Firefox pointer/context-menu normalization
- focus/visibility ordering
- Clipboard/file/object-URL cleanup
- final identity `1.0.0`
- workflow requirements and permissions
- deployment base calculation
- final package names/exclusions/metrics/checksums/manifests

Do not inflate count for appearance alone.

---

# Final lifecycle validation

Run against exact final `1.0.0`.

## Chromium: 60 cycles

- 10 fresh tutorial → full Results
- 10 tutorial abort/restart/replay
- 10 rebinding
- 10 Settings/Pause/focus
- 10 accelerated valid runs
- 10 Archive/Statistics/Credits/data

## Firefox: at least 12 cycles

Cover tutorial completion/replay, rebinding, focus loss, combat entry, boss entry, Results, menu return, restart, save reload, settings persistence, and Archive/Statistics/Credits.

Verify zero growth in listeners, cleanup ownership, input contexts, Phaser keys, pointer listeners, scenes, colliders, timers, tweens, delayed calls, tutorial objects, projectiles/Echoes, modals, DOM inputs, object URLs, and AudioContexts.

Create:

```text
docs/PHASE12_LIFECYCLE_VALIDATION.json
```

---

# Final long-session gates

Against exact final `1.0.0`:

## Menu idle

Run at least 30 real Chromium minutes, periodically cycling Main Menu, Archive, Statistics, Settings, Credits, capture cancel, resize, focus loss/return, and mute/unmute.

Create:

```text
docs/PHASE12_MENU_IDLE_VALIDATION.json
```

## Active soak

Run at least 30 real Chromium minutes covering tutorial, combat, elites, hazards, upgrades, friendly/hostile Echoes, boss phases, scoring/combo, Results, rebinding, accessibility changes, focus/resize, restart/menu return, pool stress, and cleanup.

If a Firefox-specific fix affected runtime lifecycle/input/audio/cleanup, also run at least 10 real Firefox minutes.

Create:

```text
docs/PHASE12_ACTIVE_SOAK_VALIDATION.json
docs/PHASE12_FIREFOX_BOUNDED_SOAK.json
```

Do not shorten durations.

---

# Performance

Measure final production build in Chromium and Firefox.

Targets:

```text
60 FPS
16.7 ms target frame
normal-combat p95 under 20 ms
no recurring spawn hitch over 50 ms
compressed initial transfer under 15 MB
```

Measure startup times, binding/input rebuild, save migration, tutorial/combat/boss frames, maximum frame/hitches, bundle/static sizes, largest asset, memory trend where available, listeners, input contexts, and AudioContexts.

Create:

```text
docs/PHASE12_PERFORMANCE_VALIDATION.json
```

---

# Accessibility and audio certification

Validate all accessibility authorities and five presets in both engines. Confirm no RNG or collision changes.

Create:

```text
docs/PHASE12_ACCESSIBILITY_CERTIFICATION.json
```

Validate one AudioContext, gesture startup, mute-on-failure, immediate settings, mix transitions, no duplicate music, procedural buffer ownership, voice caps, cue catalog, Echo distinction, restart/focus ownership.

Create:

```text
docs/PHASE12_AUDIO_CERTIFICATION.json
```

---

# Security/privacy

Audit final source, workflows, and deployed output for analytics/telemetry/data collection, runtime APIs, `eval`, `new Function`, dynamic scripts, unsafe HTML, import validation, Clipboard/file/object-URL safety, debug exposure, hidden destructive shortcuts, secrets/tokens, workflow permissions, CDN dependencies, and unexpected network requests.

Create:

```text
docs/PHASE12_SOURCE_AUDIT.json
docs/PHASE12_SECURITY_AUDIT.json
docs/PHASE12_NPM_AUDIT.json
```

---

# Defects

Create:

```text
docs/PHASE12_DEFECT_REGISTER.md
```

Final gate:

```text
Critical: 0
High: 0
Release-blocking Medium: 0
```

Document every accepted Medium with environment, reproduction, impact, workaround, acceptance reason, and disposition. Do not downgrade defects to ship.

---

# Documentation

Update:

- `README.md`
- `docs/FILE_MANIFEST.md`
- `docs/CURRENT_STATE.md`
- `docs/CHANGELOG.md`
- `docs/IMPLEMENTATION_NOTES.md`
- `docs/VALIDATION_REPORT.md`
- `docs/BROWSER_SUPPORT.md`
- `docs/RELEASE_NOTES_v1.0.0.md`

Add all Phase 12 recovery, environment, evidence, browser, determinism, CI, deployment, accessibility, audio, lifecycle, long-session, performance, audit, defect, checklist, package-validation, final-audit, and sign-off reports.

Preserve Phase 10/11 reports as historical evidence. Every final report must identify exact source/version/browser. Keep product boundaries explicit and browser claims truthful.

---

# Final screenshots

Produce from exact final source:

1. `ECHOFRAME_v1_main_menu_chromium.png`
2. `ECHOFRAME_v1_main_menu_firefox.png`
3. `ECHOFRAME_v1_tutorial_firefox.png`
4. `ECHOFRAME_v1_controls_firefox.png`
5. `ECHOFRAME_v1_combat_firefox.png`
6. `ECHOFRAME_v1_boss_firefox.png`
7. `ECHOFRAME_v1_results_chromium.png`
8. `ECHOFRAME_v1_accessibility_chromium.png`
9. `ECHOFRAME_v1_credits.png`
10. `ECHOFRAME_v1_public_deployment.png` when a public URL exists

Do not reuse old images or fabricate Firefox evidence.

---

# Final audit and sign-off

Generate:

```text
docs/PHASE12_FINAL_RELEASE_AUDIT.json
docs/PHASE12_RELEASE_SIGNOFF.json
```

Verify final identity, canonical hashes, reports/screenshots, tests/audits, Chromium, Firefox, determinism, static bases, CI, public URL when claimed, lifecycle, idle, soak, performance, accessibility, audio, defects, package extraction, hashes, and manifests.

Sign-off must be generated from evidence, not handwritten.

---

# Final packaging

Create:

```text
ECHOFRAME_v1.0.0_final_source.zip
ECHOFRAME_v1.0.0_web.zip
ECHOFRAME_v1.0.0_SHA256SUMS.txt
ECHOFRAME_v1.0.0_RELEASE_MANIFEST.json
```

The source ZIP must contain repository-root contents directly and exclude dependencies, builds, Git metadata, profiles/caches, temporary servers/logs, old archives, and stale screenshots.

The web ZIP must contain final `dist` contents directly, only static-hosting files, and no source/tests/private logs.

Manifest fields must include archive hashes/sizes/entry metrics, source and bundle digests, canonical hashes, tool/browser versions, test total, sign-off, CI run, Pages URL/status, tag, and release URL.

---

# Clean-extraction validation

For the source ZIP, extract cleanly, verify layout/exclusions, run `npm ci`, lint, tests, build, audits, Chromium smoke, Firefox smoke, root/subpath deployment, and digest/hash comparison.

For the web ZIP, extract to a static directory, serve only extracted files, validate in Chromium and Firefox, hard refresh, MIME/assets/manifest/favicon, no `/src/`, localhost, or unexpected requests, and confirm bundle digest.

Create:

```text
docs/PHASE12_SOURCE_ARCHIVE_VALIDATION.json
docs/PHASE12_WEB_ARCHIVE_VALIDATION.json
```

Do not claim completion until both pass.

---

# Git publication

Only with explicit authorization:

1. Confirm intentional clean working tree.
2. Commit Version 1.0.
3. Tag `v1.0.0`.
4. Push branch/tag.
5. Require CI green.
6. Deploy Pages.
7. Validate public URL.
8. Create GitHub release titled:

```text
ECHOFRAME: LAST SIGNAL — Version 1.0
```

9. Attach source ZIP, web ZIP, checksums, and manifest.
10. Verify release asset hashes.

Without authorization/access, return deploy-ready artifacts and exact commands without claiming publication.

---

# Completion criteria

Phase 12 is complete only when:

- Phase 11 source/web candidates are verified.
- Canonical documents are unchanged.
- All retained and new tests pass.
- Real Firefox executes and passes the full matrix.
- Chromium passes the matching final matrix.
- Cross-browser determinism passes.
- Both static bases pass in both browsers.
- CI passes when available.
- Public deployment passes when public launch is claimed.
- Save compatibility is preserved.
- Accessibility and audio certification pass.
- Package/runtime identity is `1.0.0`.
- Final lifecycle, Firefox subset, 30-minute idle, and 30-minute active soak pass.
- Firefox bounded soak passes when required.
- Performance and security pass.
- Critical and High defects are zero.
- Final source/web archives pass clean extraction.
- Hashes/manifests are accurate.
- Evidence-derived sign-off reports `passed: true`.

If Firefox remains unavailable or fails:

- do not promote to `1.0.0`
- do not create final Version 1.0 artifacts
- do not mark Phase 12 complete
- preserve release-candidate identity
- report the exact blocker

If public deployment is unavailable, do not claim public launch.

---

# Final output

Return:

- recovery and environment summaries
- verified Phase 11 source/web hashes and archive metrics
- Firefox version/environment
- Firefox defects found/fixed
- Chromium and Firefox matrices
- cross-browser determinism
- save compatibility
- accessibility/audio certification
- CI and Pages results
- exact test totals
- lint/build/audit results
- lifecycle/idle/soak/performance results
- defect totals and limitations
- final source/bundle digests
- final source/web ZIP links and SHA-256 hashes
- checksum, manifest, release notes, browser support, reports, checklist, defect register, final audit/sign-off, and screenshots
- Git tag/release URL when created
- exact public Pages URL when validated

Stop after Phase 12. Do not continue into Version 1.1 or post-release content.
