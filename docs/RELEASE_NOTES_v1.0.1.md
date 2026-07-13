# ECHOFRAME: LAST SIGNAL — Version 1.0.1 Release Notes

**Status:** Implementation candidate; not yet certified, tagged, deployed, or published.

Version 1.0.1 is a controlled stabilization release. It preserves the game’s content, deterministic simulation, balance, local save model, desktop input target, and core Echo mechanic.

## Tutorial repair

The post-1.0 tutorial repair freezes the exact qualified replay descriptor before lesson 5. A failed Space press no longer rewinds the player into the recording lesson, held actions are suppressed at the lock boundary, and `R` explicitly starts a new recording. The Echo-memory timeline now communicates recording, lock, deployment, and failure state.

## Security and release integrity

- Pull-request validation is read-only.
- Trusted certification and publication are separate manual workflows.
- Publication promotes the exact certified artifact instead of rebuilding it.
- Privileged deployment and release jobs do not check out or execute repository code.
- Active Actions are pinned to full commit SHAs.
- The `v1.0.1` tag, when authorized, is immutable and points to the certified source SHA.

## Architecture and maintainability

- Stable validation, audit, packaging, and metrics commands replace active phase-number interfaces.
- Historical Version 1.0 workflows and evidence remain preserved outside active execution.
- Shared combat-runtime composition reduces duplicated scene setup while retaining scene-specific ownership.
- Formatting and documentation generation are standardized.

## Presentation

The rendering, HUD, menus, boss presentation, and procedural audio systems receive a readability-focused pass. The visual thesis remains crisp geometric science fiction with restrained neon light and mechanically meaningful motion. Accessibility settings retain all required gameplay information.

## Performance and testing

- Performance reports include p95, p99, hitch counts, transitions, pool exhaustion, warnings, exceptions, failed requests, lifecycle counts, and AudioContext ownership.
- Workflow policy is tested through parsed YAML rather than brittle string matching.
- Version 1.0.0 save fixtures cover fresh, tutorial-complete, partial-progression, settings-heavy, statistics-heavy, and missing-optional-field saves.
- Browser, determinism, accessibility, lifecycle, soak, visual, and packaging gates remain mandatory for final certification.

## Compatibility

- Save schema remains `2`.
- Existing valid Version 1.0 saves remain supported.
- Phaser remains `3.90.0`.
- Desktop Chromium and Firefox with keyboard and mouse remain the supported target.
- Safari/WebKit, mobile/touch, gamepad, cloud saves, accounts, telemetry, and online services are not claimed.

## Known limitations

Human playtest success is not claimed without participants. Final hosted browser certification, public deployment verification, immutable tag creation, and GitHub Release publication are not claimed until those stages execute successfully against the final candidate SHA.
