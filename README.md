# ECHOFRAME: LAST SIGNAL

ECHOFRAME: LAST SIGNAL is a deterministic desktop browser action-roguelite built with Phaser 3.90.0, JavaScript ES modules, Vite, and Arcade Physics.

**Fight with your past. Rebuild the signal.**

## Version 1.0.1 stabilization candidate

- Package version: `1.0.1`
- Runtime version: `1.0.1`
- Save schema: `2` (unchanged)
- Release state: candidate only; no tag, GitHub Release, or public deployment is claimed by this branch
- Canonical design authority: `GAME_DESIGN.md`, `TECHNICAL_SPEC.md`, `ART_DIRECTION.md`, `BALANCE_SPEC.md`, `QA_CHECKLIST.md`

## Quick start

Requirements:

- Node.js `>=20.19.0`
- npm

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Controls

| Action | Default binding |
| --- | --- |
| Move | `WASD` |
| Aim | Mouse |
| Fire | Left mouse |
| Dash | `Shift` |
| Deploy Echo | `Space` |
| Pause / back | `Escape` |
| Menu navigation | Mouse or arrow keys |
| Menu confirm | Left click or `Enter` |

Bindings remain rebindable in Settings. Save-schema Version 2 and existing Version 1.0 saves remain supported.

## What changed in Version 1.0.1

- Shared combat-runtime composition and reverse-order teardown.
- One version-independent, validation-only semantic interface.
- Deterministic visual-quality profiles: Low, Standard, and High.
- Layered Warden, Echo, enemy, boss, and arena rendering.
- Decision-oriented combat HUD and explicit score settlement.
- Layered procedural ambience and expanded combat audio identity.
- Guarded pool-exhaustion diagnostics.
- Separated Phaser, boss, and application chunks.
- Deterministic packaging with source and artifact provenance.
- Read-only pull-request CI, trusted post-merge certification, and artifact-only publication.

No gameplay balance, difficulty tables, seed behavior, scoring authority, save schema, canonical design rule, or authoritative mechanic was intentionally changed.

## Validation commands

Core gates:

```bash
npm run format:check
npm run lint
npm run test
npm run build
npm run audit:security
npm run validate:save-compatibility
npm run validate:core
```

Browser and runtime gates:

```bash
npm run validate:browser:chromium
npm run validate:browser:firefox
npm run audit:determinism
npm run validate:accessibility
npm run validate:lifecycle
npm run validate:performance
npm run validate:soak
```

Safari/WebKit, mobile/touch, and gamepad support are not claimed. Historical Version 1.0 browser evidence is archived under `docs/evidence/v1.0.0/`. Version 1.0.1 support claims become authoritative only after the trusted certification reports named in `docs/V1_0_1_RELEASE_CHECKLIST.md` pass.

## Release architecture

1. `.github/workflows/ci.yml` runs read-only pull-request and main-branch validation.
2. `.github/workflows/certify-release.yml` accepts an exact `main`-ancestor SHA and builds the certified web output once.
3. `.github/workflows/publish-release.yml` downloads that exact artifact, verifies its source SHA and production-bundle digest, deploys it unchanged, validates the public site, and only then creates `v1.0.1` and the GitHub Release.

The tag must target the certified source commit. The release files must be byte-identical to the certification artifact. Publication must never rebuild the game.
