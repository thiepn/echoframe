# Phase 11 Evidence Invalidation

Evidence is bound to the source-manifest digest and, for browser checks, the production-bundle digest.

- Any source modification invalidates lint, tests, build, source/security/npm audits, tutorial/binding/accessibility audits, Chromium smoke, Firefox smoke, and deployment validation.
- Runtime, lifecycle, input, audio, save, focus, visibility, pool, timer, tween, or Phaser configuration changes also invalidate the 60-cycle lifecycle and both 30-minute gates.
- Release identity promotion to `1.0.0` requires all final reports to be rerun against that exact source and production bundle.
- Phase 10 reports remain historical evidence and cannot certify a different source digest.
