# Phase 13 source-archive handoff

The release branch is prepared for hosted certification.

Required repository-root file:

```text
ECHOFRAME_phase12_certification_candidate.zip
```

Required SHA-256:

```text
8cbc7d526c80ae0ea1c506cf580518cc5abed93b7f653eeb2ca43b659db122ca
```

Once this exact archive exists on `release/v1.0.0-certification`, the `Phase 13 Hosted Certification Bootstrap` workflow will:

1. verify the archive hash;
2. extract the candidate;
3. install exact dependencies;
4. install real Playwright Chromium and Firefox on Ubuntu 24.04;
5. run core, Chromium, Firefox, root/subpath, determinism, and release-audit gates;
6. upload the resulting evidence.

Do not replace the archive with a rebuilt or renamed source without updating and re-verifying the expected digest.
