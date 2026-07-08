# Phase 10 Release Checklist

Legend: `[x]` passed, `[ ]` open/failed, `[~]` attempted but blocked before game execution.

## Product and migration

- [x] Package/runtime identity is `1.0.0-release-candidate`.
- [x] Five canonical documents are byte-for-byte unchanged.
- [x] Fresh save routes through the playable tutorial before Combat 1.
- [x] Returning save bypasses the tutorial.
- [x] Archive tutorial replay creates no scored run.
- [x] Tutorial grants no score, combo, records, progression, unlocks, or permanent power.
- [x] Schema-1 Phase 9 saves migrate to schema 2 without progression/statistics loss.
- [x] Movement migration is exactly `W/S/A/D → KeyW/KeyS/KeyA/KeyD`.

## Controls, accessibility, presentation

- [x] Keyboard and pointer gameplay rebinding works.
- [x] Conflicts, capture cancel, optional secondary clearing, and Restore Defaults are covered.
- [x] Runtime contexts rebuild without measured listener/key growth.
- [x] Fixed menu navigation remains Arrow/Enter/Escape.
- [x] Six Settings categories and accessibility authorities are complete.
- [x] Production copy, Credits, metadata, fatal screen, and debug guards are reconciled.

## Evidence

- [x] Core validation: 1272/1272 tests.
- [x] Tutorial audit: 10000 timelines.
- [x] Binding audit: 25000 cases.
- [x] Accessibility source/data audit.
- [x] Accessibility Chromium browser matrix (five presets).
- [x] Source audit.
- [x] Security/privacy audit.
- [x] npm audit: zero vulnerabilities.
- [x] Chromium production validation.
- [~] Real Firefox validation attempted; browser aborted before page creation on this runner.
- [x] Root and project-subpath deployment validation.
- [x] 60-cycle lifecycle validation.
- [x] 30-minute menu/UI idle.
- [x] 30-minute active gameplay soak.
- [x] Performance hard gates.
- [ ] Strict release audit/sign-off.

## Packaging

- [x] Ten final Phase 10 screenshots exist.
- [ ] Final archive clean-extraction result and SHA-256 are recorded outside the self-referential archive in the package sidecar report.
- [ ] Actual deployed GitHub Pages URL remains a manual gate because no public URL was available.

## Verdict

**Release sign-off withheld.** Open gates: firefox.
