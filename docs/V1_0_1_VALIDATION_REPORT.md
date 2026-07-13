# ECHOFRAME Version 1.0.1 Validation Report

Status: **Local implementation candidate**

This report separates evidence verified locally from release-blocking hosted evidence.

## Local evidence currently verified

- Package and runtime versions are `1.0.1`.
- Save schema remains `2`.
- The five canonical documents remain byte-identical to the baseline hashes.
- Version 1.0.0 save fixtures pass migration/normalization checks.
- Active package scripts expose stable validation, audit, packaging, and metrics commands.
- Validation globals are version-independent and omitted from production builds.
- Read-only CI, trusted certification, and artifact-only publication workflows are present.
- Workflow security audit passes against parsed YAML.
- Repository manifest generation is deterministic for an unchanged tree.
- Local core validation passes with 1,333 tests, zero failures, zero cancelled tests, and zero skipped tests.
- Local package-lock installation audit reported one moderate advisory in a development dependency; `npm audit fix --force` was not used.
- Source and web archive packaging is deterministic and independently verified.
- Local line coverage is approximately 85.51%.

## Historical baseline evidence

- Baseline package/runtime: `1.0.0`.
- Baseline save schema: `2`.
- Baseline tests: 1,341 passing.
- Baseline lint and production build passed.
- The baseline bundle emitted one large Phaser-containing application chunk; Version 1.0.1 introduces stable Phaser/boss/application chunk groups.

## Release-blocking evidence still required

- Trusted hosted Chromium production validation.
- Trusted hosted Firefox production validation.
- Cross-browser deterministic comparison.
- Accessibility matrix in both supported engines.
- Minimum-viewport and visual-profile screenshot review.
- Restart/pause/focus/resize lifecycle automation.
- Required active and idle soak durations.
- Final p95/p99 and hitch evidence from the candidate bundle.
- Zero intended-load pool exhaustion.
- Public GitHub Pages deployment validation.
- Human playtesting or an explicit release non-claim.
- Trusted certification run bound to the merge SHA.
- Artifact digest verification during publication.
- Annotated `v1.0.1` tag targeting the certified SHA.
- GitHub Release assets copied from the certified artifact.

## Certification rule

No documentation, release note, tag, or UI should claim final certification before the trusted certification and publication workflows complete successfully against the exact immutable source commit.
