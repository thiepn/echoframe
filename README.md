# ECHOFRAME: LAST SIGNAL

**Version:** `1.0.0-release-candidate`  
**Release label:** Version 1.0 Release Candidate

A deterministic top-down Phaser 3 browser action game. The Warden records recent movement, aim, fire, and dash actions, then deploys temporary friendly Echoes that replay that history. A complete run contains six combat/elite chambers, seven upgrade selections, a recovery chamber, and the three-phase Null Architect boss.

## Release-candidate additions

- Playable **First Signal Tutorial** using the production player, weapon, projectile, recording, and friendly-Echo systems.
- Fresh-save tutorial routing, persistent completion, returning-player bypass, and Archive replay without score or progression rewards.
- Serializable keyboard and pointer binding descriptors with primary/secondary slots, capture UI, conflict rejection, immediate runtime refresh, and canonical default restoration.
- Explicit schema-1 to schema-2 migration for Phase 9 control strings while preserving progression, records, statistics, cosmetics, and tutorial state.
- Complete Audio, Visual, Accessibility, Controls, Gameplay, and Data settings categories.
- Release-facing copy, credits, HTML metadata, manifest metadata, production debug guards, and controlled fatal-error presentation.
- Chromium, root/subpath deployment, deterministic tutorial/binding, accessibility, lifecycle, security, source, long-session, and performance evidence under `docs/`.


## Phase 11 cross-browser certification status

Phase 11 adds source-bound recovery, browser, deployment, determinism, CI, security, certification, and packaging gates without changing gameplay content. The current candidate passes **1299/1299** automated tests, the complete Chromium production matrix, and local static deployment at both `/` and `/echoframe-test/`.

Real Firefox/Gecko execution remains a mandatory open gate. This runner contains no Firefox executable, and browser/package downloads are unavailable through DNS. No Chromium emulation is accepted as Firefox evidence. The project therefore remains `1.0.0-release-candidate`; Version 1.0 final promotion, final-source long-session reruns, and public-launch claims are withheld. See `docs/PHASE11_RELEASE_CHECKLIST.md` and `docs/BROWSER_SUPPORT.md`.

## Routes

Fresh save:

```text
Main Menu
→ First Signal Tutorial
→ Combat 1 → Upgrade 1
→ Combat 2 → Upgrade 2
→ Elite 1 → Upgrade 3
→ Combat 3 → Upgrade 4
→ Combat 4 → Upgrade 5
→ Elite 2 → Upgrade 6
→ Recovery Chamber → Final Upgrade 7
→ Null Architect
→ Victory or Defeat Results
```

Returning save:

```text
Main Menu → Combat 1 → complete run
```

Tutorial replay:

```text
Main Menu → Archive → Replay Tutorial → Archive
```

## Default controls

| Action | Default binding |
|---|---|
| Move | `W`, `A`, `S`, `D` |
| Aim | Mouse pointer |
| Fire | Left mouse button |
| Dash | Left Shift or right mouse button |
| Deploy Echo | Space |
| Pause | Escape |
| Menu navigation | Arrow keys |
| Menu confirm | Enter |
| Menu cancel/back | Escape |

Gameplay bindings can be changed in **Settings → Controls**. Fixed menu navigation is intentionally not remappable in Version 1.0.

## Accessibility and visual settings

- Screen-shake amount
- Reduced flashes
- Reduced particles
- High contrast
- Damage-number toggle
- Aim-line toggle
- HUD opacity
- Pause on focus loss
- Persistent player locator
- Larger telegraph outlines

Danger, focus, vulnerability, and tutorial progression use geometry, outline, pattern, motion, or text in addition to color.

## Browser and viewport requirements

- Desktop Chromium-family browser: certified for the current release candidate
- Firefox/Gecko: targeted, but final certification remains pending real execution
- Keyboard and mouse
- Authoritative browser zoom: 100%
- Minimum supported CSS viewport: `1024 × 576`
- Web Audio begins only after a user gesture
- Saves, settings, statistics, progression, and history remain local to the browser

The release evidence records successful Chromium validation. The included Firefox report states the exact result obtained in the validation environment; it must not be interpreted as a substituted Chromium test.

## Local development

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Core validation:

```bash
npm run lint
npm run test
npm run build
npm run validate
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

Release validation scripts:

```bash
npm run validate:browser:phase10
npm run validate:browser:firefox:phase10
npm run validate:deployment:phase10
npm run validate:lifecycle:phase10
npm run validate:idle:phase10
npm run validate:soak:phase10
npm run validate:performance:phase10
npm run audit:release
```

Browser scripts use Playwright and may require explicit executable paths:

```bash
CHROMIUM_EXECUTABLE=/path/to/chromium npm run validate:browser:phase10
FIREFOX_EXECUTABLE=/path/to/firefox npm run validate:browser:firefox:phase10
```

## Static deployment

The Vite build supports:

```text
/
/<repository>/
```

Set `VITE_BASE_PATH` when building a project-site subpath. The GitHub Pages workflow checks out the repository, installs exact dependencies, runs CI-safe release gates, calculates the base path, builds `dist`, and deploys the Pages artifact.

## Save data

- Current schema: `2`
- Local storage only
- Phase 9 schema-1 saves migrate sequentially and deterministically
- Imports are treated as untrusted JSON and normalized before commit
- Malformed imports do not replace the current valid save
- Clear Data restores a fresh tutorial state and canonical controls

## Privacy and security

The game has no accounts, analytics, remote telemetry, personal-data collection, gameplay API calls, dynamic script injection, or runtime dependency on a backend. Clipboard access occurs only after user action and has a selectable-text fallback.

## Scope boundaries

Version 1.0 does not include mobile controls, gamepad controls, localization, online services, cloud saves, leaderboards, accounts, multiple bosses, endless mode, New Game Plus, or permanent combat-stat power. Visual and audio production assets are generated procedurally in-engine.

See `docs/VALIDATION_REPORT.md`, `docs/PHASE10_CANONICAL_EXTRACTION.md`, `docs/PHASE10_RECOVERY_REPORT.md`, `docs/PHASE10_DEFECT_REGISTER.md`, and `docs/PHASE10_RELEASE_CHECKLIST.md`.
