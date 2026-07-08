# ECHOFRAME: LAST SIGNAL — Phase 11 Implementation Prompt

Continue development of **ECHOFRAME: LAST SIGNAL** from the validated but not fully signed-off **Phase 10: First Signal Tutorial, Complete Controls, Accessibility, and Release Candidate Hardening** archive.

Act as all of the following simultaneously:

- senior Phaser 3 release engineer
- cross-browser compatibility engineer
- Firefox/Gecko browser engineer
- JavaScript and Web Platform engineer
- Vite and static-deployment engineer
- GitHub Actions and GitHub Pages engineer
- QA lead
- save-compatibility engineer
- accessibility verification engineer
- performance and lifecycle engineer
- security/privacy auditor
- release-packaging engineer
- technical documentation lead

Your task is to implement and fully validate:

```text
Phase 11: Cross-Browser Certification, Public Deployment,
and Version 1.0 Final Release

Target version after every gate passes:
1.0.0
```

Do not use Codex. Work directly from the uploaded Phase 10 release-candidate repository and return the completed final source archive, deployable web archive, validation evidence, and exact release verdict.

This is a **certification and final-release phase**, not a content phase. Do not add enemies, upgrades, arenas, bosses, modes, progression systems, narrative content, or platform features. Close the remaining release gates, fix only defects that block or materially weaken Version 1.0, prove the final source in real Chromium and real Firefox, verify the actual static deployment when a public URL is provided, and package a reproducible final release.

Do not call the build Version 1.0 final merely because the code appears complete. The `1.0.0` identity may be committed only after the mandatory release gates have genuinely passed.

---

# Authoritative inputs I will provide

I will upload:

1. `ECHOFRAME_phase10_release_candidate.zip`
2. This Phase 11 implementation prompt
3. The Phase 10 package sidecars when available:
   - `ECHOFRAME_phase10_release_candidate.zip.sha256`
   - `ECHOFRAME_phase10_release_candidate.zip.package.json`
   - `ECHOFRAME_phase10_release_candidate.clean-extraction.json`
   - `ECHOFRAME_phase10_release_candidate.clean-extraction.md`
4. A GitHub repository URL and/or deployed GitHub Pages URL if public deployment validation is expected in the current environment
5. Any externally produced Firefox report, CI log, or browser evidence if one already exists

The five canonical documents inside the Phase 10 archive remain authoritative and must not be modified:

- `GAME_DESIGN.md`
- `TECHNICAL_SPEC.md`
- `ART_DIRECTION.md`
- `BALANCE_SPEC.md`
- `QA_CHECKLIST.md`

Expected Phase 10 release-candidate identity:

```text
Archive:
ECHOFRAME_phase10_release_candidate.zip

Package/runtime version:
1.0.0-release-candidate

Expected ZIP SHA-256:
b95fa2753649d7c57071f2b3b56140cca3553cdd3fea05e56a859f89a245b2e2

Expected tests:
1272/1272

Retained Phase 1–9 tests:
923

Phase 10 and regression tests:
349
```

Do not trust any expected value without independently verifying the uploaded files.

Treat the Phase 10 ZIP as the implementation baseline. Do not fall back to Phase 9 or an earlier archive unless a targeted regression comparison is necessary.

---

# Known Phase 10 status to verify

The Phase 10 release candidate is expected to have completed:

- the playable First Signal tutorial
- fresh-save tutorial routing
- returning-player tutorial bypass
- Archive tutorial replay
- schema-2 keyboard and pointer binding descriptors
- Phase 9 save migration
- primary and secondary gameplay bindings
- real rebinding and conflict rejection
- immediate runtime binding refresh
- accessibility settings and browser matrix
- production-facing copy cleanup
- final Credits presentation
- controlled fatal presentation
- root and project-subpath static deployment validation
- 1272 automated tests
- 10,000 tutorial timelines
- 25,000 binding audit cases
- 60 lifecycle cycles
- 30-minute menu idle validation
- 30-minute active gameplay soak
- Chromium production validation
- clean extraction and package hashing

Expected completed Phase 10 long-session evidence:

```text
Menu idle:
1,800,160 ms
181 samples
zero exceptions/errors
zero measured ownership growth

Active gameplay soak:
1,800,376 ms
362 runtime samples
2,141 mixed scenarios
zero exceptions/errors
zero failed requests
zero measured ownership growth
```

Expected primary open gate:

```text
Real Firefox production-build validation
```

The Phase 10 runner reportedly failed before game execution because its Linux 4.4 kernel caused Firefox 140.12.0esr to abort with:

```text
wasm_rt_syscall_set_segue_base error: Invalid argument
```

This is not Firefox game evidence. It is only evidence that the prior execution environment could not start Firefox.

Additional Phase 10 documentation inconsistencies to inspect and reconcile:

1. `PHASE10_RELEASE_CHECKLIST.md` may still show final packaging and clean extraction as unchecked even though sidecar evidence exists.
2. The package sidecar reports `547` regular files, while a raw ZIP-entry count may report `585` because directory entries are included. Define and report both metrics correctly rather than treating them as contradictory.
3. `PHASE10_BROWSER_FIREFOX_VALIDATION.json` may contain `sourceVersion: null`; final reports must bind evidence to an exact version and source digest.
4. The Phase 10 release audit was generated before the final external package sidecars and therefore may not fully incorporate clean-extraction completion.
5. Public GitHub Pages URL validation was not performed.
6. Strict release sign-off was correctly withheld.

Verify each item from source and evidence. Do not merely repeat this summary.

---

# Phase 11 objective

Produce a genuine, reproducible, cross-browser-certified **Version 1.0 final release**.

The target release identity is:

```text
Package version: 1.0.0
Runtime version: 1.0.0
Release label: Version 1.0
Production subtitle: Fight with your past. Rebuild the signal.
```

The final product must preserve the full Phase 10 behavior:

```text
Fresh save
→ Main Menu
→ First Signal Tutorial
→ Combat 1
→ complete run route
→ Null Architect
→ Results

Returning save
→ Main Menu
→ Combat 1 directly

Archive
→ Replay Tutorial
→ return to Archive
```

Phase 11 must:

1. Independently recover and verify the Phase 10 release candidate.
2. Run real Firefox against the actual production build on a supported environment.
3. Fix every reproducible Firefox or cross-browser defect discovered.
4. Add focused regression tests for every defect fixed.
5. Validate Chromium and Firefox against the same final source digest.
6. validate root and project-subpath production builds in both engines.
7. Add or harden a reproducible GitHub Actions browser matrix.
8. Validate the actual GitHub Pages URL when one is provided and reachable.
9. Reconcile all release documentation and stale Phase 10 package status.
10. Promote release identity from `1.0.0-release-candidate` to `1.0.0` only after pre-promotion gates pass.
11. Rerun final validation against the promoted `1.0.0` source.
12. Generate final source and deployable-web archives.
13. Validate both archives from clean extraction.
14. Produce hashes, manifests, final screenshots, release notes, and sign-off evidence.
15. Stop after Version 1.0 final release certification.

---

# Explicit Phase 11 scope

Phase 11 includes only:

- Phase 10 source and evidence recovery
- real Firefox/Gecko execution
- cross-browser defect repair
- Web Audio compatibility repair
- pointer and keyboard compatibility repair
- focus and visibility compatibility repair
- clipboard and file-input compatibility repair
- canvas/context-menu compatibility repair
- static asset and MIME compatibility repair
- GitHub Actions browser matrix
- GitHub Pages production deployment verification
- release-version promotion
- final regression and deterministic validation
- lifecycle, idle, soak, and performance revalidation
- final documentation
- final source packaging
- final deployable-web packaging
- clean-extraction proof
- release checksums and manifests
- release notes
- final release sign-off

---

# Explicitly out of scope

Do not implement:

- mobile or touch controls
- gamepad support
- localization
- new enemies
- new elite modifiers
- new arenas
- new upgrades
- new bosses
- alternate boss forms
- endless mode
- New Game Plus
- daily or weekly challenges
- online leaderboards
- accounts or authentication
- cloud saves
- remote telemetry
- analytics
- backend services
- monetization
- achievements tied to an external platform
- Steam integration
- store-page work
- user-generated levels
- service-worker or offline/PWA expansion
- new narrative sequences
- voice acting
- permanent combat-stat progression
- post-release content planning
- a new engine architecture
- an ECS migration

Do not perform general refactoring that is unrelated to a measured release defect.

---

# First action: recover and establish truth

Before modifying code:

1. Extract `ECHOFRAME_phase10_release_candidate.zip` into a new clean working directory.
2. Compute and record:
   - ZIP SHA-256
   - ZIP byte size
   - raw ZIP entry count
   - regular-file count
   - directory-entry count
3. Define those archive metrics explicitly so `547 files` and `585 entries` cannot be confused.
4. Confirm repository-root contents are directly contained.
5. Confirm the archive excludes:
   - `node_modules`
   - `dist`
   - `.git`
   - temporary browser profiles
   - temporary servers
   - Playwright reports not referenced by release documentation
   - temporary final logs
   - previous release ZIPs
6. Recompute the five canonical-document SHA-256 hashes.
7. Verify the expected Phase 10 ZIP hash independently.
8. Run `npm ci`.
9. Record Node, npm, operating-system, kernel, browser, and Playwright versions.
10. Read the five canonical documents in full where relevant to:
    - browser support
    - release acceptance
    - GitHub Pages deployment
    - performance
    - long sessions
    - accessibility
    - input
    - audio
    - privacy/security
11. Inspect all Phase 10 reports and package sidecars.
12. Verify that every report refers to the same source or identify where it does not.
13. Compute a source manifest digest covering all production source, tests, scripts, configuration, public files, and canonical documents.
14. Run the complete current Phase 10 validation pipeline before any modifications.
15. Create:

```text
docs/PHASE11_RECOVERY_REPORT.md
docs/PHASE11_EVIDENCE_MAP.json
docs/PHASE11_EVIDENCE_INVALIDATION.md
```

The recovery report must include:

- source archive
- source ZIP hash
- archive metrics with clearly defined counting methods
- package/runtime version
- canonical hashes
- source manifest digest
- package sidecar status
- clean-extraction status
- current test count
- current lint/build/audit state
- current Chromium state
- current Firefox state
- current deployment state
- current lifecycle/idle/soak/performance state
- stale or inconsistent documents
- current open release gates
- exact files planned for modification

Do not modify the canonical documents.

Do not rebuild the project from scratch.

---

# Baseline validation commands

At minimum run:

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

Also run all real Phase 10 browser, deployment, lifecycle, performance, and package scripts that can be executed in the current environment.

Do not claim a report passed merely because a JSON file says it passed. Confirm the script is real and, where feasible, rerun it.

Expected baseline:

```text
1272/1272 tests
```

All 1272 existing tests must remain. Do not delete, skip, rename away, or weaken tests to make Phase 11 pass.

---

# Evidence invalidation rules

Treat release evidence as bound to source.

Create a machine-readable evidence map with:

- report filename
- source manifest digest
- package version
- runtime version
- production bundle digest
- browser name/version
- operating system
- generated timestamp
- validation scope
- pass/fail/blocked status

Use these invalidation rules:

## Always rerun after any source modification

- lint
- all automated tests
- production build
- source audit
- security audit
- npm audit
- tutorial audit
- binding audit
- accessibility audit
- Chromium release smoke
- Firefox release smoke
- root/subpath deployment validation

## Rerun affected browser matrices after changes to

- input
- audio
- focus/visibility
- save/import/export
- menus
- accessibility
- canvas
- error handling
- static assets
- build/base-path handling

## Rerun the full 60-cycle lifecycle and both 30-minute gates after changes to

- runtime gameplay code
- scene lifecycle or cleanup
- input contexts
- audio ownership
- save ownership
- tutorial runtime
- browser event handling
- visibility/focus behavior
- Phaser configuration
- object pools
- timers/tweens
- production bundle structure

## Final-version rule

Even when the only final change is release identity, run the full final validation suite against the exact `1.0.0` source. Do not sign off a source digest that was not the source actually packaged.

The final 30-minute idle and active soak must correspond to the final `1.0.0` production bundle. Phase 10 long-session evidence may be retained as historical evidence but may not replace the final Phase 11 runs.

---

# Real Firefox certification

Use a real Firefox/Gecko browser.

Acceptable execution paths:

1. A supported system Firefox installation.
2. A Playwright-managed Firefox build installed by:

```text
npx playwright install --with-deps firefox
```

3. A GitHub Actions Ubuntu runner using Playwright Firefox.

Not acceptable:

- changing the Chromium user-agent to Firefox
- emulating Firefox headers in Chromium
- using only static source inspection
- claiming the previous kernel crash proves compatibility
- substituting WebKit for Firefox
- marking an environment failure as a pass

Record:

- exact Firefox executable
- exact Firefox version
- Gecko/Playwright version where available
- operating system and kernel
- headless/headed mode
- source manifest digest
- production bundle digest
- test URL/base path

If the local environment still cannot launch Firefox, use a supported CI runner or another available supported execution environment. The final Phase 11 gate requires game code to execute in Firefox.

If no supported Firefox environment is available, do not promote to `1.0.0`, do not create a final-release sign-off, and state the remaining gate exactly.

---

# Firefox required validation matrix

Run the production build, not the Vite development server.

Validate at minimum:

## Startup and presentation

- Boot and Preload
- save-before-settings ordering
- user-gesture audio startup
- muted continuation after forced audio failure
- Main Menu
- release title and version
- no white screen
- no raw error stack
- controlled fatal presentation in development validation mode only

## First-run tutorial

- fresh save enters tutorial
- ordered movement checkpoints
- pointer-world aiming
- firing and accepted player damage
- left mouse fire
- keyboard dash
- right mouse dash
- right-click context suppression only over canvas
- Echo recording
- Echo deployment
- shielded target rear-hit requirement
- final signal gate
- completion persistence
- Combat 1 transition
- no tutorial score/combo/run record

## Returning and replay flow

- returning Start Run bypasses tutorial
- Archive replay starts tutorial
- replay creates no scored run
- replay returns to Archive
- replay remains idempotent

## Controls and pointer behavior

- `KeyboardEvent.code` mappings
- movement keys
- diagonal movement normalization
- held fire
- pointer button 0
- pointer button 2
- pointer release
- context menu behavior
- capture modal
- keyboard rebind
- pointer rebind
- secondary dash binding
- conflict rejection
- Escape capture cancellation
- optional secondary clearing
- Restore Defaults
- immediate runtime application
- reload persistence
- held-input neutralization

## Focus and visibility

- focus loss with auto-pause enabled
- focus loss with auto-pause disabled
- visibility loss
- return from background tab
- no stuck movement/fire/dash/Echo state
- no duplicate Pause scene
- no duplicate input context

## Audio

- one AudioContext
- `AudioContext.resume()` after user gesture
- mute and volume updates
- pause mix
- tutorial mix
- combat music
- boss music
- victory music
- no duplicated music after restart
- procedural buffer generation
- voice caps

## Menus and UI

- Main Menu
- Pause
- all six Settings categories
- Controls capture modal
- Accessibility
- Upgrade selection
- Recovery
- Results
- Archive
- Statistics
- Credits
- destructive confirmation modal
- keyboard navigation
- mouse navigation
- focus restoration

## Save and data

- new save
- Phase 9 schema migration fixture
- valid Phase 10 schema-2 save
- export
- import
- malformed import rejection
- current save preserved after malformed import
- clear-data confirmation
- tutorial reset after clear data
- bindings reset after clear data
- reload persistence

## Browser APIs

- Clipboard API success when permission is available
- clipboard fallback when denied/unavailable
- file input import
- download/export behavior
- object URL revocation
- page visibility events
- focus events
- pointer events
- keyboard codes
- Web Audio resume

## Combat regression

- controlled early combat segment
- elite segment
- hazard arena
- friendly Echo
- hostile Echo
- boss controlled entry
- Null Architect phases 1–3
- victory Results
- defeat Results
- restart
- return to menu

## Accessibility presets

Validate the same five presets used in Phase 10:

1. Default
2. No shake + reduced flashes + reduced particles
3. High contrast + larger outlines + persistent locator
4. Damage numbers off + aim line off + minimum HUD opacity
5. All accessibility aids enabled

Exercise at least:

- tutorial
- early combat
- elite combat
- hazard arena
- boss phase 2
- boss phase 3
- Results
- Archive
- Statistics
- Settings

## Viewports

Validate:

```text
1920 × 1080
1600 × 900
1366 × 768
1280 × 720
1024 × 576
```

Also validate one below-minimum viewport and confirm the viewport notice behaves correctly.

## Static bases

Validate Firefox against:

```text
/
/echoframe-test/
```

Use only production `dist` served by a static server.

Require:

```text
Uncaught exceptions: 0
Console errors: 0
Failed production requests: 0
AudioContexts: maximum 1
```

Every console warning must be recorded and classified.

Create:

```text
docs/PHASE11_BROWSER_FIREFOX_VALIDATION.json
docs/PHASE11_FIREFOX_COMPATIBILITY_NOTES.md
```

---

# Cross-browser defect repair rules

When Firefox exposes a defect:

1. Reproduce it in a minimal deterministic flow.
2. Record the exact browser and environment.
3. Determine whether the defect is:
   - Firefox-specific
   - standards-compliance-related
   - an existing cross-browser race
   - a test-harness defect
   - an execution-environment defect
4. Fix the product when product behavior is incorrect.
5. Fix the harness only when the product is correct and the harness is wrong.
6. Add an automated regression test when feasible.
7. Add a browser regression scenario.
8. Rerun both Firefox and Chromium.
9. Rerun affected lifecycle/soak/performance gates under the evidence invalidation rules.
10. Document the defect in the Phase 11 defect register.

Do not add Firefox-only behavior where standards-compatible code can solve the issue.

Do not use broad user-agent branching unless a browser API difference cannot be handled through feature detection.

Prefer:

- feature detection
- standards-based event handling
- explicit promise/error handling
- browser-independent timing ownership
- safe API fallbacks

Avoid:

- UA sniffing
- arbitrary long delays
- swallowed exceptions
- unbounded retries
- disabling a feature solely to make a test pass

---

# Chromium revalidation

Run the complete Chromium Phase 11 release matrix against the same final source used for Firefox.

At minimum validate:

- fresh-save tutorial route
- returning bypass
- Archive replay
- complete Standard run
- controlled Relaxed run
- controlled Overclocked run
- scoring/combo/progression
- boss victory and defeat
- Settings/rebinding
- all accessibility presets
- save import/export
- clear data
- root/subpath deployment
- focus/visibility
- resize
- clipboard fallback
- Credits
- fatal presentation validation hook in development only
- production debug flags inert

Create:

```text
docs/PHASE11_BROWSER_CHROMIUM_VALIDATION.json
```

Require zero uncaught exceptions and zero console errors.

---

# GitHub Actions browser matrix

Create or harden CI so Firefox certification is reproducible outside the local runner.

Recommended workflows:

```text
.github/workflows/ci.yml
.github/workflows/deploy.yml
```

The CI workflow must include separate, inspectable jobs for:

1. Core validation
2. Chromium production validation
3. Firefox production validation
4. Static root/subpath validation
5. Release audit

Use a supported Node version satisfying the repository engine requirement.

Recommended browser installation:

```text
npx playwright install --with-deps chromium firefox
```

Requirements:

- use `npm ci`
- do not use floating application dependencies
- build production output
- upload failure reports/screenshots as CI artifacts
- upload browser validation JSON
- preserve exit codes
- do not hide failed tests with `continue-on-error`
- do not count a skipped Firefox job as a pass
- do not use automatic retries to conceal deterministic failures
- one documented infrastructure retry is permissible only when the first attempt clearly failed before game execution
- report exact browser versions
- report source commit SHA when running in GitHub
- run debug-production-exposure checks

The deploy workflow must:

1. Check out the exact source.
2. Install exact dependencies.
3. Run mandatory core validation.
4. Require successful browser certification or a documented protected manual approval policy.
5. Calculate the correct Vite base path.
6. Build once for deployment.
7. Upload `dist` as the Pages artifact.
8. Deploy that artifact.
9. Expose the deployed URL to post-deployment validation where GitHub permits it.

Do not create a workflow that can deploy an unvalidated commit accidentally.

Create:

```text
docs/PHASE11_CI_VALIDATION.json
docs/PHASE11_CI_ARCHITECTURE.md
```

If GitHub execution is unavailable, validate workflow structure locally and mark actual CI execution as unavailable. However, real Firefox must still execute somewhere before final sign-off.

---

# Public GitHub Pages deployment validation

If a public GitHub Pages URL is provided or can be derived from the connected repository, validate the actual deployed site after deployment.

Do not treat a local static server as public-deployment evidence.

Validate:

1. Exact public URL loads.
2. HTTPS is active.
3. Production assets return successful status codes.
4. JavaScript and CSS MIME types are correct.
5. Hard refresh succeeds.
6. Cache-busted hashed assets resolve.
7. No source modules are requested.
8. No localhost references exist.
9. Manifest resolves.
10. Favicon resolves.
11. Main Menu loads.
12. Audio begins only after a gesture.
13. Fresh-save tutorial loads.
14. One combat entry succeeds.
15. Save persists after reload.
16. Settings and bindings persist.
17. Archive and Statistics load.
18. Root/subpath assumptions are correct for the real repository path.
19. Browser console is clean.
20. Network request list contains no unexpected API or telemetry calls.

Run this public-site validation in:

- Chromium
- Firefox

Use a fresh/private profile where possible.

Record:

- URL
- deployment timestamp
- source commit SHA if available
- source manifest digest
- deployed asset hashes
- browser versions
- failed requests
- console output
- screenshots

Create:

```text
docs/PHASE11_PUBLIC_DEPLOYMENT_VALIDATION.json
```

If no public URL is available:

- do not fabricate evidence
- do not claim a confirmed public launch
- do not mark the public-deployment gate passed
- keep the artifact at release-candidate status unless the user explicitly defines public deployment as outside the final-release gate

The default Phase 11 interpretation is strict:

```text
Version 1.0 final sign-off requires a real Firefox pass.
A confirmed public-launch claim additionally requires an actual public URL pass.
```

A final source release may be certified without calling it publicly launched only when the user explicitly authorizes separating source-release certification from public deployment.

---

# Release identity promotion process

Do not change the production identity to `1.0.0` at the beginning.

Use this staged process:

## Stage A — release-candidate closure

Keep:

```text
1.0.0-release-candidate
```

while:

- running Firefox
- fixing cross-browser defects
- validating CI
- validating deployment behavior
- resolving all Critical/High defects

## Stage B — pre-promotion gate

Before promotion require:

- all 1272 retained tests pass
- all new regression tests pass
- lint passes
- build passes
- Chromium passes
- Firefox passes
- root/subpath deployment passes
- source/security/npm audits pass
- Critical defects = 0
- High defects = 0
- no unresolved release-blocking Medium defect

## Stage C — promote to final

Update coherently:

```text
package.json: 1.0.0
package-lock.json: 1.0.0
runtime version: 1.0.0
Main Menu release label: Version 1.0
Credits release label: Version 1.0
HTML metadata
manifest metadata where versioned
README
CHANGELOG
CURRENT_STATE
release documentation
```

Do not change save schema merely because the product version changed.

A valid Phase 10 schema-2 save must load unchanged in Version 1.0.

## Stage D — final-source validation

After promotion, rerun every mandatory Phase 11 gate against the exact final source.

Do not reuse a Firefox report from the release-candidate source without rerunning it after promotion.

---

# Final test requirements

Retain all existing tests.

Expected minimum retained total:

```text
1272 tests
```

Add focused tests only where Phase 11 changes behavior or fixes defects.

Potential new coverage includes:

## Release identity

- package version is `1.0.0`
- runtime version is `1.0.0`
- Main Menu label is Version 1.0
- Credits label is Version 1.0
- no `release-candidate` text remains in production-facing UI
- development documentation may retain historical Phase 10 references

## Save compatibility

- Phase 9 schema-1 fixture → Version 1.0
- Phase 10 schema-2 fixture → Version 1.0
- tutorial state preserved
- bindings preserved
- progression preserved
- personal bests preserved
- recent runs preserved
- cosmetics preserved
- unsupported future schema rejected safely

## Firefox compatibility models

- pointer button normalization
- context-menu suppression scope
- focus/blur ordering
- visibility transition ordering
- audio resume rejection handling
- clipboard rejection handling
- file-input cleanup
- object URL cleanup
- key-code normalization

## Deployment

- final base-path normalization
- public manifest paths
- favicon paths
- no localhost
- no `/src/`
- correct asset MIME expectations
- final release archive names
- correct GitHub workflow requirements

## Packaging

- raw ZIP-entry count and regular-file count reported separately
- no temporary directories
- no previous archives
- source archive root layout
- web archive root layout
- checksums match
- manifests match

Do not target a higher test count for appearance alone.

---

# Deterministic and gameplay regression

Phase 11 must not alter game identity or balance.

Verify:

- deterministic run generation remains unchanged for established seed fixtures
- score-event ledger remains immutable
- combo logic remains unchanged
- progression thresholds remain unchanged
- upgrade catalog remains 24 canonical upgrades
- arena pool remains eight normal arenas
- enemy roster remains six standard enemies
- elite modifiers remain three
- boss remains the Null Architect three-phase encounter
- tutorial remains excluded from score/progression
- accessibility settings do not alter RNG or collision
- browser engine does not alter seeded selection outcomes

Generate a Chromium-versus-Firefox deterministic comparison for identical seeds and scripted qualifying actions.

Compare at minimum:

- run plan
- arena order
- encounter selections
- upgrade offers
- elite selections
- boss scheduler decisions where scriptable
- score-event sequence for a controlled deterministic scenario

Create:

```text
docs/PHASE11_CROSS_BROWSER_DETERMINISM.json
```

Every deterministic hard failure must be zero.

Do not require frame-perfect physics equality for unscripted real-time input. Compare authoritative deterministic models and controlled event sequences.

---

# Accessibility final certification

Preserve and rerun the Phase 10 accessibility audit.

Verify in both Chromium and Firefox:

- zero screen shake setting
- reduced flashes
- reduced particles
- high contrast
- damage numbers off
- aim line off
- HUD opacity minimum
- focus-loss pause
- player locator
- larger telegraph outlines
- color-independent danger communication
- keyboard navigation for every menu
- focus stronger than hover
- capture modal focus ownership

No Firefox compatibility fix may silently bypass accessibility settings.

Create:

```text
docs/PHASE11_ACCESSIBILITY_CERTIFICATION.json
```

---

# Audio final certification

Preserve `AudioManager` as sole audio owner.

Verify in both engines:

- one AudioContext maximum
- no sound before gesture
- successful context resume after gesture
- muted continuation after failure
- no duplicate context after reload/restart
- no duplicate music layers
- correct paused mix
- correct scene music transitions
- procedural buffers generated outside hot combat callbacks
- voice caps remain bounded
- all required cues remain available
- player/friendly Echo/hostile Echo remain distinguishable

Record engine-specific Web Audio differences without hiding them.

Create:

```text
docs/PHASE11_AUDIO_CERTIFICATION.json
```

---

# Lifecycle and long-session validation

Run against the final `1.0.0` source.

## Lifecycle

Run at least 60 complete cycles:

- 10 fresh-save tutorial → full Results
- 10 tutorial abort/restart/replay
- 10 rebinding cycles
- 10 Settings/Pause/focus cycles
- 10 accelerated valid run cycles
- 10 Archive/Statistics/Credits/data cycles

Use Chromium for the full 60-cycle gate.

Add at least 12 Firefox lifecycle cycles covering:

- tutorial completion
- tutorial replay
- rebinding
- focus loss
- combat entry
- boss entry
- Results
- menu return

Verify no growth in:

- event listeners
- input contexts
- Phaser key objects
- pointer listeners
- cleanup ownership
- scenes
- colliders
- timers
- tweens
- delayed calls
- tutorial objects
- projectiles/Echoes
- modal objects
- DOM inputs
- object URLs
- AudioContexts

Create:

```text
docs/PHASE11_LIFECYCLE_VALIDATION.json
```

## Menu idle

Run at least 30 minutes of real Chromium menu/UI idle against final `1.0.0`.

Include periodic:

- Main Menu
- Archive
- Statistics
- Settings
- Credits
- controls capture cancel
- resize
- focus loss/return
- mute/unmute

Create:

```text
docs/PHASE11_MENU_IDLE_VALIDATION.json
```

## Active soak

Run at least 30 minutes of real active Chromium gameplay against final `1.0.0`.

Include:

- tutorial
- normal combat
- elite combat
- hazards
- upgrades
- friendly Echoes
- hostile Echoes
- boss phases
- scoring/combo
- Results
- Settings/rebinding
- accessibility changes at safe boundaries
- focus/resize
- restart/menu return
- pool-cap stress
- cleanup

Create:

```text
docs/PHASE11_ACTIVE_SOAK_VALIDATION.json
```

If a Firefox-specific runtime fix affects lifecycle, input, audio, or cleanup, include a bounded Firefox soak of at least 10 real minutes and document why that duration is sufficient in addition to the mandatory Chromium 30-minute soak.

Do not shorten mandatory durations.

---

# Performance validation

Measure the final `1.0.0` production build.

Preserve canonical targets:

```text
60 FPS target
16.7 ms frame target
95th percentile normal combat under 20 ms
No recurring spawn hitch over 50 ms
Compressed initial transfer under 15 MB
```

Measure in Chromium and Firefox:

- boot to Main Menu
- first tutorial startup
- repeat tutorial startup
- Combat 1 startup
- boss startup
- Settings startup
- Archive startup
- Statistics startup
- Results startup
- binding validation
- input-context rebuild
- save migration
- frame distributions
- maximum frame
- recurring hitch count
- static transfer size
- bundle raw/gzip size
- memory trend where available
- maximum listeners
- maximum input contexts
- maximum AudioContexts

Do not compare browser process memory as though Chromium and Firefox expose identical metrics. Label engine-specific measurements appropriately.

Create:

```text
docs/PHASE11_PERFORMANCE_VALIDATION.json
```

---

# Security and privacy final audit

Verify final source and deployed output:

- no analytics
- no remote telemetry
- no personal-data collection
- no runtime gameplay API calls
- no `eval`
- no `new Function`
- no dynamic script injection
- no unsafe imported HTML insertion
- imported JSON validated before commit
- malformed import preserves current save
- Clipboard API used only after user action
- object URLs revoked
- file inputs removed
- debug hooks inert in production
- no destructive hidden production shortcut
- no secrets in source or workflow
- no repository tokens exposed to browser code
- GitHub Actions uses minimal permissions
- Pages workflow permissions are explicit
- no third-party runtime CDN dependency
- no unexpected deployed network request

Create:

```text
docs/PHASE11_SOURCE_AUDIT.json
docs/PHASE11_SECURITY_AUDIT.json
docs/PHASE11_NPM_AUDIT.json
```

---

# Defect classification

Create:

```text
docs/PHASE11_DEFECT_REGISTER.md
```

Use the canonical severity model.

Final release gates:

```text
Critical defects: 0
High defects: 0
Release-blocking Medium defects: 0
```

Every accepted Medium defect must include:

- description
- affected browser/environment
- reproduction
- user impact
- workaround
- reason for acceptance
- planned disposition

A failed Firefox interaction is not automatically a Medium defect. Classify it by actual user impact.

Do not reclassify defects to permit release.

---

# Documentation reconciliation

Update:

- `README.md`
- `docs/FILE_MANIFEST.md`
- `docs/CURRENT_STATE.md`
- `docs/CHANGELOG.md`
- `docs/IMPLEMENTATION_NOTES.md`
- `docs/VALIDATION_REPORT.md`

Add:

```text
docs/PHASE11_RECOVERY_REPORT.md
docs/PHASE11_EVIDENCE_MAP.json
docs/PHASE11_EVIDENCE_INVALIDATION.md
docs/PHASE11_BROWSER_CHROMIUM_VALIDATION.json
docs/PHASE11_BROWSER_FIREFOX_VALIDATION.json
docs/PHASE11_FIREFOX_COMPATIBILITY_NOTES.md
docs/PHASE11_CROSS_BROWSER_DETERMINISM.json
docs/PHASE11_ACCESSIBILITY_CERTIFICATION.json
docs/PHASE11_AUDIO_CERTIFICATION.json
docs/PHASE11_PUBLIC_DEPLOYMENT_VALIDATION.json
docs/PHASE11_CI_VALIDATION.json
docs/PHASE11_CI_ARCHITECTURE.md
docs/PHASE11_LIFECYCLE_VALIDATION.json
docs/PHASE11_MENU_IDLE_VALIDATION.json
docs/PHASE11_ACTIVE_SOAK_VALIDATION.json
docs/PHASE11_PERFORMANCE_VALIDATION.json
docs/PHASE11_SOURCE_AUDIT.json
docs/PHASE11_SECURITY_AUDIT.json
docs/PHASE11_NPM_AUDIT.json
docs/PHASE11_DEFECT_REGISTER.md
docs/PHASE11_RELEASE_CHECKLIST.md
docs/PHASE11_FINAL_RELEASE_AUDIT.json
docs/PHASE11_RELEASE_SIGNOFF.json
docs/RELEASE_NOTES_v1.0.0.md
docs/BROWSER_SUPPORT.md
```

Reconcile Phase 10 history without rewriting it dishonestly.

Requirements:

- Phase 10 reports remain historical evidence.
- Phase 11 reports describe final evidence.
- Stale unchecked Phase 10 package items are explained or corrected in final documentation.
- Archive counts distinguish files from all ZIP entries.
- Every report includes exact source/version information.
- Version 1.0 boundaries remain explicit:
  - desktop keyboard/mouse only
  - no mobile controls
  - no gamepad controls
  - no localization
  - no online services
  - no cloud saves
  - no leaderboards
  - no endless mode
  - one boss
  - procedural visual/audio assets
- Browser support is truthful.
- No unsupported Safari claim is made.
- Public launch status is stated precisely.

---

# Final screenshots

Produce final post-fix screenshots from the exact `1.0.0` source.

Required:

1. `ECHOFRAME_v1_main_menu_chromium.png`
2. `ECHOFRAME_v1_main_menu_firefox.png`
3. `ECHOFRAME_v1_tutorial_firefox.png`
4. `ECHOFRAME_v1_controls_firefox.png`
5. `ECHOFRAME_v1_combat_firefox.png`
6. `ECHOFRAME_v1_boss_firefox.png`
7. `ECHOFRAME_v1_results_chromium.png`
8. `ECHOFRAME_v1_accessibility_chromium.png`
9. `ECHOFRAME_v1_public_deployment.png` when a public URL is available
10. `ECHOFRAME_v1_credits.png`

Screenshots must correspond to final source and must not reuse Phase 10 images as Phase 11 evidence.

Do not fabricate a Firefox screenshot.

---

# Final release audit

Create a machine-readable final audit that verifies:

- package version `1.0.0`
- runtime version `1.0.0`
- canonical documents unchanged
- all required Phase 11 reports present
- all required screenshots present
- all tests pass
- deterministic audits pass
- Chromium passes
- Firefox passes
- root/subpath deployment passes
- public URL passes when required
- CI matrix passes when available
- lifecycle passes
- idle passes
- active soak passes
- performance passes
- source/security/npm audits pass
- Critical defects = 0
- High defects = 0
- package clean extraction passes
- source and web archives match recorded manifests

Create:

```text
docs/PHASE11_FINAL_RELEASE_AUDIT.json
docs/PHASE11_RELEASE_SIGNOFF.json
```

The sign-off JSON must not be handwritten independently of evidence. Generate it from actual reports.

---

# Final packaging

Create two final archives.

## 1. Source archive

```text
ECHOFRAME_v1.0.0_final_source.zip
```

It must:

- contain repository-root contents directly
- include canonical documents unchanged
- include Phase 11 reports
- include final screenshots
- include workflows
- include `package-lock.json`
- exclude `node_modules`
- exclude `dist`
- exclude `.git`
- exclude temporary browser profiles
- exclude temporary servers/logs
- exclude Playwright cache
- exclude previous release archives
- exclude stale duplicate screenshots

## 2. Deployable web archive

```text
ECHOFRAME_v1.0.0_web.zip
```

It must:

- contain the final production `dist` contents directly at archive root
- use the documented deployment base
- contain only files required for static hosting
- include no source files
- include no tests
- include no private validation logs
- load from a static server

Also create:

```text
ECHOFRAME_v1.0.0_SHA256SUMS.txt
ECHOFRAME_v1.0.0_RELEASE_MANIFEST.json
```

The release manifest must include:

- archive names
- SHA-256 hashes
- byte sizes
- raw ZIP-entry counts
- regular-file counts
- directory-entry counts
- source manifest digest
- production bundle digest
- canonical hashes
- Node/npm versions
- browser versions
- final test total
- release-signoff status
- public deployment URL/status

---

# Clean-extraction validation

For the final source archive:

1. Extract into a new clean directory.
2. Verify root layout.
3. Verify exclusions.
4. Run `npm ci`.
5. Run lint.
6. Run all tests.
7. Run production build.
8. Run deterministic/tutorial/binding/accessibility/source/security/npm audits.
9. Run Chromium production smoke.
10. Run Firefox production smoke.
11. Run root/subpath deployment validation.
12. Recompute canonical hashes.
13. Recompute source manifest digest.
14. Confirm it matches the packaged source manifest.

For the web archive:

1. Extract into a clean static directory.
2. Serve only extracted files.
3. Validate production loading in Chromium.
4. Validate production loading in Firefox.
5. Verify all assets and MIME types.
6. Verify no `/src/` request.
7. Verify no localhost reference.
8. Verify no unexpected network request.
9. Verify hard refresh.
10. Verify manifest and favicon.

Create:

```text
docs/PHASE11_SOURCE_ARCHIVE_VALIDATION.json
docs/PHASE11_WEB_ARCHIVE_VALIDATION.json
```

Do not claim completion until both archives pass.

---

# Git tag and GitHub release

Only when repository access is available and the user has authorized publication:

1. Ensure the working tree contains only intentional final changes.
2. Create a final commit with a clear Version 1.0 message.
3. Tag:

```text
v1.0.0
```

4. Push the final branch and tag.
5. Create a GitHub release titled:

```text
ECHOFRAME: LAST SIGNAL — Version 1.0
```

6. Attach:
   - final source archive
   - final web archive
   - checksum file
   - release manifest
7. Use `docs/RELEASE_NOTES_v1.0.0.md` as the release-notes basis.
8. Verify the deployed Pages URL after publication.

Do not push, tag, deploy, or publish without explicit authorization or a connected repository workflow that clearly permits it.

If publication is unavailable, return deploy-ready artifacts and exact manual commands without claiming that publication occurred.

---

# Final release checklist

Create:

```text
docs/PHASE11_RELEASE_CHECKLIST.md
```

The final gate must require all of the following:

- [ ] Phase 10 source archive independently verified
- [ ] canonical documents unchanged
- [ ] all 1272 prior tests retained
- [ ] all tests pass
- [ ] Firefox game code actually executed
- [ ] Firefox fresh tutorial passed
- [ ] Firefox input/rebinding passed
- [ ] Firefox audio passed
- [ ] Firefox focus/visibility passed
- [ ] Firefox combat/boss/Results passed
- [ ] Chromium final matrix passed
- [ ] cross-browser deterministic comparison passed
- [ ] root static deployment passed
- [ ] subpath static deployment passed
- [ ] public URL passed when required
- [ ] CI Firefox job passed when available
- [ ] final version is `1.0.0`
- [ ] 60-cycle lifecycle passed on final source
- [ ] Firefox lifecycle subset passed
- [ ] 30-minute menu idle passed on final source
- [ ] 30-minute active soak passed on final source
- [ ] final performance passed
- [ ] accessibility certification passed
- [ ] audio certification passed
- [ ] source audit passed
- [ ] security audit passed
- [ ] npm audit reports zero vulnerabilities
- [ ] Critical defects = 0
- [ ] High defects = 0
- [ ] source ZIP clean extraction passed
- [ ] web ZIP clean extraction passed
- [ ] checksums recorded
- [ ] archive metrics defined correctly
- [ ] final release audit passed
- [ ] final sign-off passed

Do not leave a checked item unsupported by evidence.

---

# Completion criteria

Phase 11 is complete only when all of the following are true:

- The Phase 10 archive was independently verified.
- The five canonical documents remain unchanged.
- All existing tests remain and pass.
- Every Phase 11 regression test passes.
- Real Firefox executes the production game.
- Firefox passes startup, tutorial, input, audio, focus, save, menus, combat, boss, Results, accessibility, resize, and static-base checks.
- Chromium passes the same final-source release matrix.
- No browser substitution is used.
- Cross-browser deterministic models match.
- Root and project-subpath builds pass in both browsers.
- GitHub Actions can reproduce Firefox validation or actual equivalent evidence exists.
- Actual public deployment is validated when required for public-launch status.
- Save schema remains compatible with Phase 9 and Phase 10 saves.
- No tutorial/scoring/progression regressions exist.
- All accessibility authorities remain connected.
- One AudioContext maximum is preserved.
- Final 60-cycle lifecycle passes.
- Final 30-minute menu idle passes.
- Final 30-minute active soak passes.
- Performance budgets pass.
- Security/privacy audit passes.
- Critical defects equal zero.
- High defects equal zero.
- Package/runtime identity is `1.0.0`.
- No release-candidate wording remains in production-facing Version 1.0 UI.
- Source archive passes clean extraction.
- Web archive passes clean extraction.
- Hashes and manifests are accurate.
- Final sign-off JSON reports `passed: true` and is derived from real evidence.

If Firefox remains unavailable or fails:

- do not promote to `1.0.0`
- do not mark Phase 11 complete
- do not create a false final sign-off
- report the exact blocker
- preserve a release-candidate identity

If the public URL is unavailable:

- do not claim public launch
- distinguish deploy-ready final source from confirmed public deployment
- follow the strict default unless the user explicitly authorizes separating those gates

---

# Final output

Return:

- recovery summary
- independently verified Phase 10 ZIP hash
- archive file/entry metric explanation
- implementation summary
- every Firefox defect found and fixed
- Chromium matrix summary
- Firefox matrix summary
- cross-browser determinism summary
- save-compatibility summary
- accessibility certification summary
- audio certification summary
- CI summary
- root/subpath deployment summary
- public GitHub Pages validation summary
- exact final test total
- retained-test total
- new-test total
- lint result
- build result
- tutorial audit result
- binding audit result
- accessibility audit result
- source audit result
- security audit result
- npm audit result
- lifecycle result
- menu-idle result
- active-soak result
- performance result
- defect totals by severity
- accepted limitations
- final source manifest digest
- final production bundle digest
- final source ZIP link
- final web ZIP link
- checksum link
- release-manifest link
- release-notes link
- browser-support link
- Firefox report link
- Chromium report link
- public-deployment report link
- final validation report link
- final release checklist link
- defect-register link
- final release audit link
- final sign-off link
- screenshot links
- exact SHA-256 for every final archive
- Git tag/release URL if actually created
- exact public Pages URL if actually validated

Stop after Phase 11.

Do not continue into post-release content, mobile/gamepad support, localization, online systems, new modes, new bosses, or Version 1.1 planning.
