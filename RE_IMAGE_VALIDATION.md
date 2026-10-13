# RE-IMAGE validation — 2026-10-13, Lappy

## Implementation

`feat/re-image-browser` starts at `feat/create-preset` (`6ad7ac9a48967ad05794dc145ffbab19b415b8d9`). `main` remains the older 0.1.1 branch. Desktop interface, catalogue and Tauri release files were preserved. Browser app lives in `browser/`; the shared core gains a memory input entrypoint and a whole-image contain operation. The Worker invokes that real engine via a small Rust WASM byte ABI. The WASM module has no filesystem/network imports.

Images, original filenames and local paths never go to the server. The sole application data route is `/api/preferences`. It accepts a strict whitelist of deliberate preset/settings data, derives the user key from Sites authentication, scopes all SQL to that key, rejects anonymous writes and foreign origins, and uses optimistic revisions. No image uploads, AI services, paid services or public sharing were added.

Implemented: generic/custom synced presets including dimensions, fit, crop defaults, format, quality, byte target, background and naming; visible saved/unsaved/offline failure states; live safe filenames using actual dimensions with case-insensitive collision suffixes; batch exports, per-image crop/retry, interruption, preserved originals, detail comparison, output sizes/savings, individual download anchors and client-generated ZIP.

## Passed

- Rust 1.99.0 isolated GNU toolchain: 28 `prep-core` tests, including all prior ICC, orientation, metadata, decoded-memory, alpha, byte-cap and unique-file regressions, plus contain full-edge/no-enlargement validation. Doc tests pass (zero tests).
- Release WASM build with locked `image 0.25.10` and `moxcms 0.8.1`.
- First proof: synthetic Adobe RGB PNG converts/crops with alpha; native and WASM PNG pixel scanlines and colour-profile data match. ICC creation timestamps differ across targets, so entire encoded file hashes are not promised equal.
- Expanded parity: 61 native/WASM cases with matching result metadata and errors; 48 successful outputs are pixel-identical after native decoding. sRGB, Adobe RGB, Display P3, 16-bit source, alpha, all EXIF orientations, PNG/JPEG/WebP outputs, no-upscale, zoom, fit and malformed/unsupported ICC/byte-limit errors.
- 18 existing desktop JavaScript tests and syntax checks of `src/main.js`, `src/presets.js`, and `.github/scripts/preset-smoke.mjs`.
- Browser filename, payload-whitelist and ZIP unit checks (3 tests); downloaded two-image ZIP extracted with valid CRCs using Python zipfile.
- TypeScript `tsc --noEmit` and Sites Vinext production build.
- Real local Cloudflare D1 migration and HTTP persistence test: saves survive reads; two authenticated test users have separate records; anonymous requests return 401; stale revisions return 409; attempted user-key injection returns 400; foreign origins return 403.
- Real installed Chrome: duplicate-name imports, batch exports, actual dimension filenames, unmet-cap error, Stop/retry recovery, individual and ZIP downloads, keyboard crop movement, prepare again, 100% detail, saved/custom recipe and naming persistence through reload, offline save failure.
- Chrome responsive layouts at 1440×1000 and 390×844; mobile document width equals viewport width (390 px), including images/results. Screenshots inspected. Only browser console error was the deliberately induced offline request.
- Network observation: image preparation fetched the WASM asset; no image POST or filename request was made.

## Limits and owner acceptance

- Actual Safari was not run on this Windows device. Downloads use normal Blob anchors with `download`, a new-tab fallback and retained output URLs; Safari-specific behavior remains an acceptance check, not a claimed test result.
- Local identity tests use the supported loopback sign-in simulator and a built local Worker with explicit synthetic identity headers. Hosted dispatch-owned sign-in and real two-device sync must be distinguished from these checks. No hosted identity was fabricated.
- JPEG/PNG/WebP inputs only. Animated input frames, HEIC/RAW, arbitrary CMYK/YCCK or unsupported profiles are not supported. Malformed colour metadata fails instead of silently discarding profiles.
- PNG/WebP are lossless; byte caps can fail and show a warning/error. JPEG searches quality down to 1. No enlargement occurs.
- Limits: 50 images per batch; 100 MB source, 64 MP / 256 MiB decoded pixels, 512 MiB retained output. Large on-device images can exhaust a browser's practical memory before those limits. Stop releases the Worker; Clear releases preview/output URLs. Closing/reloading the tab discards the image batch and unsaved edits; only deliberately saved recipes persist in D1.
- Multiple preset outputs from one input remains the requested next enhancement after the core.
- Full Tauri installer was not built; shared engine and existing frontend tests passed.

## Environment repairs

Lappy's system Node is ARM64. Cloudflare workerd does not support Windows ARM64 Node, so a free portable Node 24.14.0 x64 was installed under this task's `toolchain/`, along with isolated Rust homes. No system PATH/shell configuration was changed. The documented npm shell shim failed; the starter's own npm install/build scripts succeeded via npm's direct JavaScript entrypoint. A running built-preview Worker briefly locked `dist/`; it was stopped before the final build. All work remains in the task workspace and private Git branch.

## Private deployment

Sites confirmed success at https://re-image.chelsea-tech-2945.chatgpt.site on 2026-10-13. Owner-only access was confirmed before deployment: one owner, zero external visitors, no groups/editors.

- Project: appgprj_6ace73957edc8191937355a7461c00ef
- Version: appgprj_6ace73957edc8191937355a7461c00ef~appgver_3556e27ad9ec8191b691ba74e30fae55
- Deployment: appgdep_6ace7ce51abc8191b8e97896ea6c49dc
- Sites source commit: 8b2f00997800b6854ef75010f6d08f5c93ba3571
- Tested browser source repository commit: 594c9c796a47590722c61673dac545c1d038f63b

Actual hosted owner authentication and D1 saving passed in the connected Chrome browser. The saved default recipes were restored after a reload and in an independent page. This verifies real hosted persistence; it is not a test on a second physical device.

Hosted automated image import was blocked by the ChatGPT Chrome extension's disabled file-URL access. No new extension/file permission was granted. The native chooser was dismissed. Local installed-Chrome imports, Worker image processing and downloads passed; the deployed automated import remains unverified. Actual Safari and a second physical device remain acceptance checks.

Packaging used the supported Sites helper with hidden-stdin credentials. Session-only Git safe-directory, Git Bash PATH and TAR_OPTIONS=--force-local resolved Windows ownership/path differences without global settings changes. A refreshed same-Site credential was needed after its first short-lived token expired. No credentials were written to source or files.

