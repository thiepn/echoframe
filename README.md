# ECHOFRAME: LAST SIGNAL

**Version:** `1.0.0`  
**Release label:** Version 1.0  
**Tag:** `v1.0.0`

ECHOFRAME: LAST SIGNAL is a deterministic top-down Phaser 3 browser action game. The Warden records recent movement, aim, fire, and dash actions, then deploys temporary friendly Echoes that replay that history.

A complete run contains six combat or elite chambers, seven upgrade selections, a recovery chamber, and the three-phase Null Architect boss.

## Version 1.0 highlights

- Playable **First Signal** tutorial using the production movement, weapon, projectile, damage, recording, and friendly-Echo systems.
- Fresh-save tutorial routing, returning-player bypass, persistent completion, and Archive replay without score or progression rewards.
- Twenty-four upgrades, deterministic arenas and encounters, immutable score ledger, combo system, progression, Archive, Statistics, Settings, Credits, and Results.
- Serializable keyboard and pointer bindings with primary and secondary slots, conflict rejection, persistence, immediate runtime refresh, and canonical default restoration.
- Accessibility controls for motion, flashes, particles, contrast, outlines, player locator, HUD opacity, damage numbers, and aim line.
- Local-only schema-2 save data with deterministic schema-1 migration and validated import/export.
- Real hosted Chromium and Firefox certification, root/subpath validation, cross-browser deterministic comparison, lifecycle testing, long-session testing, performance gates, clean-extraction packaging, and public-site validation workflows.

## Complete routes

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

Gameplay bindings can be changed in **Settings → Controls**. Fixed menu navigation remains intentionally non-remappable in Version 1.0.

## Browser and viewport support

- Desktop Chromium-family browsers
- Desktop Firefox/Gecko
- Keyboard and mouse
- Browser zoom: 100%
- Minimum supported CSS viewport: `1024 × 576`
- Static hosting at `/` or a repository subpath
- Web Audio begins only after a user gesture

Safari/WebKit, mobile/touch, and gamepad support are not claimed. Exact browser versions and results are recorded in `docs/PHASE13_FINAL_CHROMIUM_VALIDATION.json`, `docs/PHASE13_FINAL_FIREFOX_VALIDATION.json`, and `docs/BROWSER_SUPPORT.md`.

## Release verification

The Version 1.0 source contains **1,329 automated tests**:

```text
1,319 retained through Phase 12
10 Phase 13 tests
1,329 total
```

The executable core report is `docs/PHASE10_CORE_VALIDATION.json`. Final authorization is evidence-derived rather than asserted by this README. Consult:

- `docs/PHASE13_NONPUBLIC_RELEASE_AUDIT.json`
- `docs/PHASE13_PUBLIC_DEPLOYMENT_VALIDATION.json`
- `docs/PHASE13_FINAL_RELEASE_AUDIT.json`
- `docs/PHASE13_RELEASE_SIGNOFF.json`
- `docs/PHASE13_RELEASE_CHECKLIST.md`
- `release/ECHOFRAME_v1.0.0_RELEASE_MANIFEST.json`

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
npm run validate:core:phase10
```

Selected release gates:

```bash
npm run validate:browser:phase12
npm run validate:browser:firefox:phase12
npm run validate:deployment:phase12
npm run audit:determinism:phase12
npm run validate:lifecycle:phase10
npm run validate:idle:phase10
npm run validate:soak:phase10
npm run validate:performance:phase10
npm run validate:performance:firefox:phase13
```

Playwright browser scripts may require explicit executable paths:

```bash
CHROMIUM_EXECUTABLE=/path/to/chromium npm run validate:browser:phase12
FIREFOX_EXECUTABLE=/path/to/firefox npm run validate:browser:firefox:phase12
```

## Static deployment

Set `VITE_BASE_PATH` for project-site hosting:

```bash
VITE_BASE_PATH=/echoframe/ npm run build
```

The Phase 13 publication workflow builds the exact certified source, binds it to `phase13-release.json`, deploys it through GitHub Pages, validates the public HTTPS URL in Chromium and Firefox, then authorizes the tag and GitHub Release only after final sign-off.

## Save data

- Current schema: `2`
- Local storage only
- Schema-1 saves migrate sequentially and deterministically
- Imports are normalized as untrusted JSON before commit
- Malformed imports do not replace the current valid save
- Clear Data restores a fresh tutorial state and canonical controls

## Privacy and security

The game has no accounts, analytics, remote telemetry, personal-data collection, gameplay API calls, runtime backend, dynamic script injection, or third-party runtime CDN. Clipboard access occurs only after user action and provides a selectable-text fallback.

## Scope boundaries

Version 1.0 does not include mobile controls, gamepad controls, localization, online services, cloud saves, leaderboards, accounts, multiple bosses, endless mode, New Game Plus, or permanent combat-stat power.
