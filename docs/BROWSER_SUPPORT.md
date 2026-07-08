# ECHOFRAME: LAST SIGNAL — Browser Support

## Version 1.0 release targets

- Desktop Chromium-family browsers
- Desktop Firefox/Gecko
- Keyboard and mouse
- Browser zoom at 100%
- Minimum supported CSS viewport: `1024 × 576`
- Static hosting at `/` or a repository subpath

The Phase 13 workflow executes the complete production game in real installed Chromium and Firefox on GitHub-hosted Ubuntu. Exact browser versions, source commit, source digest, bundle digest, errors, failed requests, and results are recorded in:

- `PHASE13_FINAL_CHROMIUM_VALIDATION.json`
- `PHASE13_FINAL_FIREFOX_VALIDATION.json`
- `PHASE13_FINAL_CROSS_BROWSER_DETERMINISM.json`
- `PHASE13_PUBLIC_DEPLOYMENT_VALIDATION.json`

Public-site support is claimed only when the public-deployment report passes for both engines against the exact HTTPS Pages URL.

## Not claimed

- Safari/WebKit certification
- Mobile browser support
- Touch controls
- Gamepad controls
- Installed-PWA behavior

## Runtime constraints

- Web Audio begins only after a user gesture.
- Saves and settings remain local to the browser.
- The game makes no gameplay API, analytics, or remote-telemetry requests.
- A below-minimum viewport displays the controlled minimum-size presentation rather than an unsupported gameplay layout.
