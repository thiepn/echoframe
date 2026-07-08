# Phase 13 Defect Register

## Product defects

- Critical: 0
- High: 0
- Release-blocking Medium: 0

## Release-engineering and performance defects resolved

1. Phase 12 lockfile tarball URLs referenced an OpenAI-internal registry. Phase 13 uses public npm URLs while preserving versions and integrity hashes.
2. Hosted Chromium input validation used stale canvas geometry and fixed capture timing. Phase 13 uses trusted-event telemetry, fresh geometry, state-based waits, and a deterministic close firing lane while retaining the production input path.
3. Hosted requestAnimationFrame cadence reflected virtual-display throttling rather than browser main-thread game work. Phase 13 records Phaser prestep-to-postrender work with unchanged gameplay workloads and frame-time thresholds.
4. The boss HUD rerasterized unchanged text on every telemetry event. Phase 13 caches text values and redraws only when visible content changes.
5. Final package metadata used a stale fixed test count and a duplicate release field. Phase 13 derives test totals from passed core evidence and separates release title from publication status.
