# Phase 10 Defect Register

## Severity totals

| Class | Open product defects | Accepted product defects |
|---|---:|---:|
| Critical | 0 | 0 |
| High | 0 | 0 |
| Medium | 0 | 0 |
| Low | 0 | 0 |

No known game defect has been accepted to force release sign-off.

## Open release-validation gate

### RC-GATE-001 — Real Firefox execution unavailable on validation runner

| Field | Detail |
|---|---|
| Classification | Release-blocking validation gap; **not reclassified as a product defect** |
| Affected environment | Installed Firefox 140.12.0esr on Linux kernel `4.4.0` in the execution sandbox |
| Reproduction | Launch `/usr/bin/firefox-esr --headless about:blank` before loading game code |
| Observed result | Firefox exits with code 11 after `wasm_rt_syscall_set_segue_base error: Invalid argument` and abort redirection |
| Game code reached | No |
| User impact | Firefox compatibility cannot be proven in this runner; no Firefox game defect was observed because the browser never created a page |
| Workaround | Run `npm run validate:browser:firefox:phase10` on a compatible current desktop/CI runner with a real Firefox process |
| Acceptance decision | Not accepted for final Version 1.0 sign-off. The archive remains a release candidate and public-launch approval is withheld |
| Browser substitution | None. Chromium with a Firefox user-agent was not used |
| Evidence | `docs/PHASE10_BROWSER_FIREFOX_VALIDATION.json` |

## Build advisory

Vite reports one minified JavaScript chunk above 1,500 kB. This is tracked as a non-defect delivery advisory because the measured static transfer remains below the canonical 15 MB ceiling. The threshold was not increased to hide the warning. Exact sizes are recorded in `PHASE10_PERFORMANCE_VALIDATION.json`.

## Resolution policy

A failed mandatory gate remains failed. The release audit and sign-off reports must retain `releaseReady: false` until a real Firefox run and every other mandatory gate pass against the same source content.
