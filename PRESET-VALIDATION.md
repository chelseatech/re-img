# Create preset validation — Lappy, 2026-10-10

This is the initial report for `2ddbc2e`. See [UOTTAWA-VALIDATION.md](UOTTAWA-VALIDATION.md) for the subsequently authorized 34-component catalogue and Windows CI scope. Final run results and commit-bound BUILD-INFO artifacts supersede the pending/native-build status described here.

Baseline: `fix/icc-colour-import`, commit `234b1eccc235cc72ac3631a55f8faa1e6510a746`, application version 0.1.2. Feature branch: `feat/create-preset`. No repository `AGENTS.md`, `.agents` instructions or repository skills were present. The README and Windows workflow supplied the build instructions.

## Changes

Added a visible **Create preset** button beside the Website profile selector and a modal form for name, width, height, output format and optional decimal-KB target. Saving selects the new custom preset. Names must be unique; dimensions are whole pixels; format choices explain JPEG, PNG and lossless WebP. The modal supports native validation, Cancel, Escape, focus return and readable storage errors. Creation is disabled while a batch is running.

The existing `web-image-prep-presets` localStorage key remains an array. Its original five positions retain their trusted names and uOttawa policies; legacy edits without a format migrate with JPEG as the default. Added records store their names, dimensions, cap, format and circle-preview setting. Existing settings remain editable. Restoring starters preserves added records. Choosing a profile resets permission for smaller derivatives to unchecked.

Rust processing, source-file handling, dependencies/lockfiles, security settings, app identifier and version are unchanged. The four uOttawa presets still block WebP in both the interface and existing Rust validation. The feature does not alter the core's no-upscaling or unique-output-name behavior.

## Passed locally

Environment: LAPPY, Windows; installed Node 25.2.1, npm 11.6.2. Locked project dependencies restored with `npm ci --ignore-scripts` into the task checkout; no system tools installed. The initial sandbox could not reach GitHub, so the authorized clone used the normal account; private repository access succeeded without asking for credentials. The initial sandbox build encountered esbuild parent-directory access denial; rerunning under the checkout owner's account passed without changing Git or system security settings.

- `npm run check`: JavaScript syntax plus all 13 tests passed (five crop tests and eight preset tests).
- `npm run build`: Vite 6.4.4 production build passed, 14 modules transformed.
- `git diff --check`: passed.
- 18 real-browser interface checks passed in installed Chrome, headless, using an isolated temporary profile and a loopback test server. Native Tauri picker/import/export/drop adapters were mocked. Browser DOM, modal behavior, native numeric validation and localStorage were real.
- Reviewed screenshots at 1180×820 and the minimum 900×660 window dimensions. The creation dialog fits both without horizontal overflow.

Storage tests cover legacy edits, multiple named presets across all formats, trim/duplicate-name rules, bounds, malformed saved data, trusted uOttawa policies, restore retention and failed persistence. Interface checks cover save/select/switch/restart, PNG and WebP, optional target, invalid input, duplicate error, Cancel/focus, Escape, storage failure without phantom records, restore retention, batch disable/re-enable and the exact export options sent to Tauri. The export-options check verifies 1400×500 PNG, 250,000-byte cap, `allow_smaller: false`, `uottawa: false`.

External verification artifacts are in the task's `preset-verification` directory: `verify-interface.mjs`, `interface-results.json` and three PNG screenshots. The script uses the already-installed Chrome and Node without a new automation dependency. It neither attaches to nor changes an existing browser session. All test browser processes were closed.

## Blocked locally

`cargo test --locked --manifest-path crates/prep-core/Cargo.toml` and `cargo check --locked --manifest-path src-tauri/Cargo.toml` could not start: PowerShell reports **“cargo: The term 'cargo' is not recognized as a name of a cmdlet, function, script file, or executable program.”** `rustc` is also unavailable. No `.cargo`/`.rustup` installation or workspace-local `cargo.exe` was found. Visual Studio 2022 C++ Build Tools is installed, but Rust is required to compile Tauri.

Therefore no native app executable or portable Windows ZIP was produced. The supplied ZIP is source only. Native Windows picker/drop/crop/export acceptance, WebView2 operation and a Rust rebuild remain unverified for this feature. Earlier core tests in `VALIDATION.md` belong to the baseline and are not new local passes.

Once the required Rust toolchain is available in an authorized build environment, run the README's locked Rust checks and:

```powershell
npm.cmd run check
npm.cmd run tauri -- build --ci --no-sign -- --locked
```

With bundling disabled in the existing configuration, package the resulting `src-tauri\target\release\web-image-prep.exe` plus usage/build information as a portable ZIP. Check launch and actual image export before labeling it a verified portable build. This task did not merge, push, request a CI run, publish a release, install prerequisites or change the user's existing installed app.

## Use after building

Scroll to **Prepare your export**, click **Create preset**, name it, set dimensions and format, optionally set a KB target, and click **Save preset**. Choose it again from **Website profile** on future launches. Blank/0 means no target. uOttawa profiles retain JPEG/PNG restrictions; new profiles are custom. Originals remain untouched and images are never enlarged.
