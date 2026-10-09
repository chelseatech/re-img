# Validation report — 2026-10-09

## Scope and baseline

The uploaded 0.1.1 source already contained moxcms 0.8.1 RGB-to-sRGB conversion. Its original 15 Rust tests passed in this cloud executor. Review and new regression tests reproduced three fail-open cases in that baseline: incomplete JPEG ICC segments, invalid PNG ICC compression, and an incorrect ICC declared size were accepted as images instead of rejected. A separate deterministic test also demonstrated that moxcms's in-place transform ignores an A2B LUT when a profile contains both matrix/TRC and LUT data.

Version 0.1.2 fixes these issues with validated metadata envelopes, explicit ICC size/tag bounds, and a LUT-aware transform using one reusable output row. It also blocks CMYK/YCCK JPEGs before naive decoder conversion and enforces the decoded-pixel allocation ceiling before allocating. The source Tauri lockfile was stale (missing prep-core's moxcms dependency and the current app version); it has been regenerated without changing registry package versions.

## Passed in the Linux cloud executor

Toolchain: Node 24.19.0, npm 11.9.0, Rust/Cargo 1.99.0. Rust was installed only in an isolated workspace-local directory, without modifying system settings or shell configuration. Locked image 0.25.10 declares Rust 1.88.0 as its minimum; the manifests and README now reflect that dependency requirement. Compatibility was tested on 1.99.0, not independently on 1.88.

- `npm ci --ignore-scripts`: locked frontend dependencies installed.
- `npm run check`: JavaScript syntax and all five crop tests pass.
- `npm run build`: Vite production build passes.
- `cargo test --locked --manifest-path crates/prep-core/Cargo.toml`: all 27 tests pass, no failures; doc tests pass (zero tests).
- `cargo check --locked --manifest-path crates/prep-core/Cargo.toml`: passes.
- `git diff --check`: passes.

No dependency version upgrades were needed. New tests generate their own synthetic image/profile fixtures; no personal photos or external ICC assets were used.

## Regression coverage

- sRGB-tagged and untagged pixels, alpha preservation and read-only source handling
- Adobe RGB and Display P3 conversion with numerical colour references
- Matrix-plus-LUT RGB conversion using a synthetic A2B1 table
- RGB/RGBA 8-bit and 16-bit conversion
- Shared preview/export conversion, JPEG/PNG/WebP exports, sRGB output profiles, unique names and byte-cap failure
- Missing, duplicate, inconsistent and out-of-order JPEG ICC segments
- Malformed PNG ICC compression, duplicate ICC chunks and misplaced post-IDAT ICC
- WebP ICC flag/chunk inconsistency and duplicate ICC chunks
- Malformed ICC size, unsupported profile classes and spaces, and four-component JPEG rejection
- Explicit decoded-buffer size guard for a synthetic 320 MB RGBA16 input
- All eight embedded EXIF orientations applied once, including pixel landmarks and derivative re-import
- Derivatives omit EXIF (including GPS), XMP and IPTC, while source bytes stay unchanged

## Blocked or not run

`cargo check --locked --manifest-path src-tauri/Cargo.toml` passed dependency resolution but cannot finish in this Linux executor: pkg-config cannot find the required `glib-2.0 >= 2.70` and `gobject-2.0` development libraries. GTK/WebKit native dependencies are not installed. No system package installation was attempted. This is an environment blocker, not evidence that the Tauri application compiles.

The Windows native app, file picker/drop, UI responsiveness, visual colour comparison, and NSIS installer have not been built or run during this verification. Earlier Windows execution-helper failures are historical and do not invalidate the cloud checks above; they also do not establish that the Windows route has recovered.

## Remaining Windows acceptance

Use a Windows machine or authorized Windows CI runner with Rust 1.88+, Node LTS, Microsoft C++ Build Tools and WebView2. From the project directory run:

```powershell
npm ci
npm run check
npm run build
cargo test --locked --manifest-path crates/prep-core/Cargo.toml
cargo check --locked --manifest-path src-tauri/Cargo.toml
npm run tauri -- dev
npm run tauri -- build --config src-tauri/tauri.release-nsis.conf.json
```

Verify ICC-tagged camera sRGB/Adobe RGB and Display P3 imports against a colour-managed editor; malformed/CMYK inputs should show a clear convert-a-copy error. Check all starter presets, transparent JPEG background choices, PNG/WebP alpha, orientation/crop landmarks, impossible caps, repeated exports into the source folder and original hashes. Exercise native file picking/drop and keyboard crop movement. Confirm the resulting installer version is 0.1.2, install it, and repeat an import/export smoke test. No Windows installer is supplied by this source-only patch.
