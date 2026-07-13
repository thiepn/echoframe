# ECHOFRAME Version 1.0.1 Release Checklist

Release SHA: `______________________________`  
Certification run: `________________________`  
Publication run: `__________________________`  
Bundle digest: `____________________________`  
Source archive digest: `____________________`  

## Source identity

- [ ] Candidate source is a full `main` ancestor.
- [ ] Package version is `1.0.1`.
- [ ] Runtime version is `1.0.1`.
- [ ] Save schema is `2`.
- [ ] Five canonical documents match the recorded hashes.
- [ ] Working tree is clean.
- [ ] No production phase-number validation global remains.
- [ ] No active one-shot historical workflow remains.

## Static and domain validation

- [ ] `npm ci --no-audit --no-fund`
- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm audit`
- [ ] `npm run audit:security`
- [ ] `npm run validate:save-compatibility`
- [ ] `npm run validate:core`

## Browser and runtime certification

- [ ] Chromium production matrix
- [ ] Firefox production matrix
- [ ] Root and `/echoframe/` static deployment bases
- [ ] Cross-browser deterministic checkpoints
- [ ] Chromium and Firefox accessibility matrix
- [ ] Minimum 1024×576 viewport
- [ ] Reduced-particles profile
- [ ] High-contrast profile
- [ ] Tutorial first-run and Archive replay
- [ ] Echo deployment and cooldown
- [ ] Upgrade choice and score continuity
- [ ] Boss transition and all three phases
- [ ] Results and recent-run persistence
- [ ] Zero unexplained console errors
- [ ] Zero failed requests

## Lifecycle, performance, and soak

- [ ] Restart cycles preserve listener baselines
- [ ] Pause/resume cycles preserve clocks and input contexts
- [ ] Focus-loss cycles preserve AudioContext ownership
- [ ] Resize cycles preserve logical world coordinates
- [ ] Long-session heap trend within budget
- [ ] No NaN coordinates
- [ ] No negative threat values
- [ ] Pools remain bounded
- [ ] Pool exhaustion counters remain zero in intended load
- [ ] Performance report records p95/p99/hitches
- [ ] Production Phaser chunk is isolated from the application chunk
- [ ] Human playtest non-claim is preserved if no participants were available

## Packaging

- [ ] `npm run manifest:repository`
- [ ] `npm run report:performance`
- [ ] Production output is built once with `/echoframe/` base
- [ ] `npm run package:release -- --dist certified-web --source-sha <sha>`
- [ ] `npm run verify:release -- --release-dir release --source-sha <sha>`
- [ ] Source archive excludes `node_modules`, `.git`, `dist*`, coverage, and transient logs
- [ ] Web archive contains no source maps, dependencies, or secrets
- [ ] SHA-256 sums verify
- [ ] Release manifest source SHA equals the merge SHA
- [ ] Release manifest production-bundle digest equals the certified web tree digest
- [ ] Working tree remains clean after packaging

## Trusted publication

- [ ] Certification completed against the exact merge SHA
- [ ] Publication downloaded the exact named certification artifact
- [ ] Publication verified version, source SHA, and bundle digest before deployment
- [ ] Pages received the certified web artifact without checkout or build
- [ ] Public Chromium validation passed against the deployed URL
- [ ] Public runtime source SHA and bundle digest match the certification manifest
- [ ] Annotated tag `v1.0.1` points to the certified merge SHA
- [ ] Existing tag guard prevents tag movement
- [ ] GitHub Release assets are the certified release files
- [ ] No rebuild occurred after certification

## Final declaration

Version 1.0.1 is not complete until every applicable box above is checked and the generated release manifest, checksum file, workflow run IDs, public validation report, tag target, and release asset digests agree.
