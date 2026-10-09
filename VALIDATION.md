# Validation and blockers — 2026-10-09

## Observed

- Execution attempted with default PowerShell, `login:false`, and explicit `shell: powershell`.
- Each supported-shell attempt failed before process creation with:

```text
CreateProcess: Rejected("Failed to create unified exec process:
exec-server rejected request (-32603):
helper_unknown_error: setup refresh had errors")
```

- An attempt using the absolute Windows PowerShell executable returned `only supports powershell`; retrying the supported shell returned the helper error above.
- `apply_patch` calls returned without an error (empty `{}` results). Independent local readback/byte verification is unavailable, so source presence must be confirmed after the helper is repaired.
- Opening the file-check document in Codex returned `status: queued`; this does not verify local file bytes.
- Bundled dependency lookup returned `Workspace dependency tools are only supported for local threads.` No fallback machine or environment was used.
- UI inventory exposed Chrome tabs only and no native app surface. The native Computer Use skill requires `node_repl`/`@oai/sky`; that runtime is not available here. The prototype could not be launched or captured.
- Library filename search resolved the exact provided attachment identity and metadata. Required current materialization helpers cannot execute here. No DOCX bytes or screenshots were retrieved or inspected.
- Workspace checkout, `.agents`, AGENTS.md and local Codex memories could not be inspected because command execution failed. Work was scoped to a new `web-image-prep` subfolder; no existing project changes, pushes, CMS changes or publishing were attempted.

## Checks not run

- Toolchain/version inventory, dependency installation and lockfile generation.
- JavaScript syntax and five frontend crop tests (`npm run check`).
- Vite production build (`npm run build`).
- Rust synthetic tests (`cargo test --manifest-path crates/prep-core/Cargo.toml`).
- Tauri compile (`cargo check --manifest-path src-tauri/Cargo.toml`).
- Windows native file picker/drop, responsiveness, crop preview, export and UI screenshot.

No runtime checks passed or failed: they were blocked before execution. Source review caught and corrected integer rounding that could otherwise reduce a full-size crop by one output pixel. Official Tauri 2 and image 0.25.9 API documentation was consulted; this is not compilation evidence.

## Tests supplied

Rust tests cover crop edge clamps and zoom, no-upscale opt-in, transparent JPEG background requirement and PNG alpha preservation, impossible caps and uOttawa WebP rejection, invalid crop numbers, rotated pixel landmarks, synthetic embedded EXIF orientation, collision-safe names preserving bytes, and absence of EXIF/ICC in encoded JPEGs.

Frontend tests cover crop bounds, zoom, integer-rounded crops retaining target dimensions, no upscaling, invalid parameters and a grid of profile/position/zoom combinations.

## Exact next step on Beast

Repair or reconnect Beast's Codex execution helper, then retry `Get-Location` and inventory commands in this same task. Confirm local files and read applicable workspace instructions before continuing. Follow README's dependency/check/launch commands; obtain approval first if major missing system prerequisites must be installed.

After a successful launch, use synthetic images only for the first smoke test:

1. JPEG with EXIF Orientation=6: compare portrait preview, crop position and exported pixels.
2. Large opaque gradient/photo: export all four presets; check dimensions, byte caps and unique names.
3. Transparent graphic: verify JPEG blocks with no background, then white/black/custom backgrounds; verify PNG alpha.
4. Tiny 20×20 image: verify blocked export, then explicit smaller export with no enlarged pixels.
5. 1-byte cap: verify per-file failure and no created derivative.
6. Export the same batch twice into the source folder: verify every original hash is unchanged, every existing derivative is unchanged, and new names have suffixes.
7. ICC-tagged image: verify explicit rejection without pretending colour conversion occurred.
8. Mixed valid/corrupt files: verify other files finish and errors remain readable.
9. Capture the actual 1180×820 Windows window and test keyboard crop nudges/file pickers/native drag/drop.

No screenshot is available from this session. This source is a starting implementation pending execution repair, compilation fixes if needed, and Windows acceptance testing.
