# ECHOFRAME: LAST SIGNAL — Current State

## Product identity

- Package version: `1.0.0`
- Runtime version: `1.0.0`
- Release label: **Version 1.0**
- Save schema: `2`
- Production subtitle: **Fight with your past. Rebuild the signal.**

## Automated verification

- Retained through Phase 12: `1,319` tests
- Phase 13: `10` tests
- Current total: `1,329` tests
- Canonical design documents: byte-identical to the certified baseline
- Chromium: real hosted production matrix required
- Firefox: real hosted production matrix required
- Root and repository-subpath hosting: required in both browsers
- Cross-browser deterministic comparison: required with zero authoritative mismatches
- Chromium lifecycle: 60 cycles required
- Firefox lifecycle subset: at least 12 cycles required
- Menu idle: 30 real minutes required
- Active gameplay soak: 30 real minutes required
- Firefox soak: 10 real minutes required

## Release authority

Publication is controlled by machine-readable evidence. This document does not independently claim that a workflow, deployment, tag, or release passed.

Authoritative state is recorded in:

- `PHASE13_CI_VALIDATION.json`
- `PHASE13_NONPUBLIC_RELEASE_AUDIT.json`
- `PHASE13_SOURCE_ARCHIVE_VALIDATION.json`
- `PHASE13_WEB_ARCHIVE_VALIDATION.json`
- `PHASE13_PUBLIC_DEPLOYMENT_VALIDATION.json`
- `PHASE13_FINAL_RELEASE_AUDIT.json`
- `PHASE13_RELEASE_SIGNOFF.json`
- `PHASE13_RELEASE_CHECKLIST.md`
- `../release/ECHOFRAME_v1.0.0_RELEASE_MANIFEST.json`

The tag `v1.0.0` and GitHub Release may be created only when final sign-off reports `passed: true` and `publicationAuthorized: true`.
