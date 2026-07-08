# Phase 12 Firefox Compatibility Notes

- Supported Firefox recovered: **Mozilla Firefox 152.0.1**.
- Supported Firefox game code executed: **false**.
- Status: **environment-blocked-before-game-execution**.
- Blocker: Firefox aborted before page creation because this Linux 4.4 kernel rejected the GS-base syscall used by current Firefox RLBox/WASM sandboxing.
- Legacy Firefox diagnostic accepted as certification: **false**.

The Linux 4.4 runner rejects the GS-base syscall used by current Firefox before page creation. Firefox 115 can remain alive only as an obsolete diagnostic and cannot certify Version 1.0.
