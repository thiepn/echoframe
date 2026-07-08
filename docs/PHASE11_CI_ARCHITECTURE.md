# Phase 11 CI Architecture

The repository now defines separate jobs for core validation, Chromium production validation, Firefox production validation, static deployment validation, cross-browser determinism, and release evidence aggregation. Failed jobs preserve their exit codes and upload evidence through `actions/upload-artifact@v4`.

The Pages workflow triggers automatically only after the `ECHOFRAME CI` workflow succeeds. Manual deployment requires an explicit certification confirmation and still reruns the mandatory core suite before building the Pages artifact.

Actual GitHub Actions execution remains unavailable until this source is placed in a connected repository.
