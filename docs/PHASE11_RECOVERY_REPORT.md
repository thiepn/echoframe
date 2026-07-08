# Phase 11 Recovery Report

**Generated:** 2026-07-07T22:26:52.125Z  
**Baseline version:** `1.0.0-release-candidate`  
**Source manifest:** `3be6c352bb402201c24c32067bbd281dc0493008e19f469f1827ceebffd4fa78`

## Archive verification

- SHA-256: `b95fa2753649d7c57071f2b3b56140cca3553cdd3fea05e56a859f89a245b2e2`
- Expected SHA-256: `b95fa2753649d7c57071f2b3b56140cca3553cdd3fea05e56a859f89a245b2e2`
- Hash matched: **true**
- Archive bytes: 2406043
- Raw ZIP entries: 585
- Regular files: 547
- Directory entries: 38
- Repository root contained directly: true

The raw-entry count includes explicit directory records. The regular-file count includes only file entries. Therefore the historical values 585 entries and 547 files describe the same archive correctly.

## Canonical documents

- `GAME_DESIGN.md`: `556d99d05d7896c2b02bb653cb28e8a0cb631e223edf67e3e0c1236fd7811f71` — unchanged
- `TECHNICAL_SPEC.md`: `8562235331a2dc229977db11a56fdb10ba0032494d4b0d0706f41bf24c903468` — unchanged
- `ART_DIRECTION.md`: `aa29931c92ada05c0693ea58730986bc8b9ce8c1b8fcbf78acb4d72be8d1529a` — unchanged
- `BALANCE_SPEC.md`: `5fca70f1c890b1e13a3b8b17ab3c82da725491c0cca6146a7ad0a2b1f55fd107` — unchanged
- `QA_CHECKLIST.md`: `b120097203b11e7f2fe025ea5767e931395f5edc7059e9821f6ab5ce1c722122` — unchanged

## Reproduced baseline

The Phase 10 source remains a release candidate. Core validation, Chromium, and static root/subpath validation are rerun separately as Phase 11 evidence. The prior Firefox report is environment evidence only because Firefox aborted before page creation.

## Documentation reconciliation findings

- Phase 10 checklist contains unchecked packaging or clean-extraction items despite external sidecar evidence.
- Phase 10 Firefox report has sourceVersion: null because game code never executed.
- Package sidecar regular-file count (547) differs from raw ZIP-entry count (585); these are distinct metrics, not contradictory results.

## Open gates

- Real Firefox production game execution and certification
- Cross-browser deterministic comparison using real Chromium and Firefox
- Actual CI execution unavailable without a connected repository
- Public GitHub Pages validation unavailable because no public URL was provided
