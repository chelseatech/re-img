# Official uOttawa catalogue and feature build — 2026-10-10

Feature branch: `feat/create-preset`, based on ICC repair commit `234b1eccc235cc72ac3631a55f8faa1e6510a746`. Initial Create preset commit: `2ddbc2ec7ff87a83c5aac93ddcf66db896c714ab`. Application version remains 0.1.2. The initial local report is in `PRESET-VALIDATION.md`; this report records the expanded final scope.

## Source and reconciliation

All **34 exact component headings** come from the current authenticated VirtuO page, extracted read-only on Lappy on 2026-10-10: https://virtuo.uottawa.ca/en/brand-design/digital-marketing/design/image-specifications . No publication/revision date was shown; the unpublished draft was not inspected. The parent supplied the local extraction JSON. Task-relevant source wording, ratios, formats, caps, notes and observed anchors are retained in `src/uottawa-specifications.json`; account/session details are omitted. The guidance skill's supplementary reference resources were unavailable, but the requested page itself was fully extracted.

The original five array slots in `web-image-prep-presets` remain stable for legacy edits. Official entries use observed source-derived IDs. Saved metadata cannot replace trusted component titles, provenance, verification flags or JPEG/PNG policy. Previously created named profiles migrate. The original four uOttawa profiles remain under **Legacy profiles** and the original custom profile remains under **Custom presets**.

**Featured article (2)** keeps one exact title and requires an explicit choice between **Image 1**, 783×490, and **image 2**, circular 390×390. **Body text with image**, **Homepage hero**, **Quick links blocks with tabs and images** and **Split screen hero** start with blank dimensions and block export until the user chooses them. The parenthetical split-screen 960×700 is preserved as a reference, not a fixed requirement. Responsive ratios and the 500px minimum-width recommendation remain visible guidance. Circular uploads are square; video entries prepare still previews.

Pixel/ratio conflicts remain visible with **Verification needed**, including minor rounding observations. Full-bleed 1920×700 versus 16:9/2.21:1, business 610×763 versus 5:4, section 600×450 versus 0.8:1 and social 400×600 versus 4:5 are not silently reconciled. Listed pixels are used without claiming a corrected official ratio. Obvious **JEPG** typos normalize to JPEG while original wording remains available. Missing caps are labeled **not specified** and start unset. Source byte convention is unknown; the app's existing decimal KB/MB interpretation is disclosed beside specified caps.

Original-file handling, no upscaling, unique export naming, Rust processing/ICC handling, dependencies/lockfiles, Tauri security policy and app identifier/version remain unchanged.

## Local checks passed

Lappy's installed Node 25.2.1/npm 11.6.2 and locked local frontend dependencies were used; no system tools were installed. C++ Build Tools exist, but `cargo`/`rustc` are unavailable.

- JavaScript syntax and **18 tests** pass: five crop and thirteen preset/catalogue regressions.
- Vite 6.4.4 production build passes; 15 modules transformed.
- Native smoke-test JavaScript parses, and all four workflow PowerShell script blocks parse using the AST parser.
- `git diff --check` passes.
- **29 real-browser interface checks** pass in an isolated headless installed-Chrome process. DOM, dialog behavior, native numeric validation and localStorage were real; Tauri picker/import/export adapters were mocked.
- Screenshots at 1180×820 and minimum 900×660 were visually reviewed, including source-conflict guidance.

Coverage includes old storage migration, saved formats/targets, duplicate/bounds validation, all 34 exact titles, trusted official IDs, flexible input/export blocking, both variants, scoped caps, conflicts/typos, restoration, storage errors, batch locking, focus/keyboard handling and reload persistence. Native export options are checked at the adapter boundary. External evidence is in the task's `preset-verification` folder. Active user apps/browser sessions were not touched.

## Windows CI status at this commit

Local Rust commands cannot start because PowerShell reports that `cargo` is not recognized. The baseline Windows workflow passed for `234b1ec`; that is not evidence for this expanded feature.

Ryan explicitly authorized the separate feature-branch push and existing Windows GitHub build. The workflow adds `feat/create-preset` while preserving the explicit `[build-windows]`/workflow-file push trigger, pinned actions, read-only permissions, runner/toolchain, timeout and no-release policy. Main, repository/billing/security settings and paid-usage limits are unchanged.

Added native checks create a preset in the real compiled app, restart the process and verify saved settings. A sessionStorage marker confirms the restarted WebView is a new session. CDP attaches only to a CI-process loopback debugger. Debug arguments are process-scoped for testing, are restored afterward, and do not ship or alter registry/system settings. The portable ZIP is created only after those checks pass, and includes source commit, run URL, checks and executable/ZIP hashes.

**Native feature build/checks are pending at this source commit.** The final workflow result and commit-bound BUILD-INFO/JSON/checksum artifacts are authoritative. The source ZIP is not a runnable portable app. Actual user-PC picker/drop/crop and real image export still require separate acceptance even if CI passes.

## Usage

Select the exact component under **Website profile**, read any verification note, choose a variant or enter dimensions when required, then export. Click **Create preset** to save personal named settings. Blank/0 KB means no app target. Every uOttawa profile stays JPEG/PNG; custom presets may use lossless WebP. Originals are preserved; images are never enlarged.
