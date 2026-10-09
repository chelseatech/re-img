# Web image prep

First Windows desktop prototype source for Beast. Tauri 2 shell, vanilla JavaScript/Vite interface, Rust image-processing core. **Not compiled, launched, or runtime-validated in this session.** The execution helper fails before starting PowerShell.

## Launch on Beast

From `C:\Users\Ryan\Documents\Codex\2026-10-08\task-2\web-image-prep`:

```powershell
Get-Command rustc,cargo,node,npm
rustc --version
node --version
npm install
npm run icons
npm run check
npm run build
cargo test --manifest-path crates/prep-core/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
npm run tauri -- dev
```

Use Node 22 LTS or a current supported LTS and Rust 1.85 or newer. Windows Tauri also requires Microsoft C++ Build Tools and WebView2. Inspect installed prerequisites before installing anything; none were installed here. See [official Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/). `npm install` and Cargo dependency resolution require registry access. Version locks must be generated and retained after the first successful dependency resolution. Build packaging is disabled; this is a development prototype.

`npm.cmd run icons` generates the local Windows ICO and RGBA PNG assets from `assets/app-icon.svg` using the already-installed Tauri CLI. Run it before the first Tauri build, including development builds: Windows resource generation requires `src-tauri/icons/icon.ico` even when installer bundling is disabled. The CLI also supplies the standard PNG sizes and ICNS asset expected by Tauri's default scaffold. See [official Tauri icon generation](https://v2.tauri.app/develop/icons/). No icon download or extra dependency is required.

## First-use workflow

1. Add images with the Windows file picker or drop them into the native window. Up to 100 files; input resource limits are 100 MB / 64 megapixels per file, with a 256 MiB decode allocation limit.
2. Choose a profile. Width, height and maximum size are editable and saved locally for the next launch. Crop positions and zoom are per image for the current session. Batch export uses the current profile for all imported images.
3. Drag the crop or use arrow keys (Shift moves faster). Zoom tightens the crop. Circle overlays are guides only; files remain square when using the square portrait/card profiles.
4. Choose JPEG for photographs, PNG for transparency or graphics. Custom profiles can export lossless WebP. The image crate does not offer lossy WebP; this prototype does not present a misleading lossy quality control. libwebp would be a separate future dependency if lossy WebP is needed.
5. Choose an existing output folder and export. Each file shows processing, success or a specific error. Hover its result for the destination or full error.

## Starter presets

| Profile | Output pixels | Maximum file size | Preview |
| --- | --- | --- | --- |
| Article image | 830 × 553 | 1,000,000 bytes | Rectangle |
| Article / event card | 390 × 260 | Unset | Rectangle |
| Author portrait | 80 × 80 | 200,000 bytes | Circle; square output |
| Circular card | 200 × 200 | Unset | Circle; square output |

uOttawa output is JPEG or PNG only. Decimal convention: 1 KB = 1,000 bytes, 1 MB = 1,000,000 bytes. Binary units differ: 1 KiB = 1,024 bytes, 1 MiB = 1,048,576 bytes. There is no universal output cap. 0 in the UI means no cap. The full-bleed hero (1920 × 700 with contradictory 2.21:1 label) and business card (610 × 763 with contradictory 5:4 label) are intentionally excluded until verified.

## Processing guarantees and limitations

- Source files are read only. Derivatives use a `-web-WIDTHxHEIGHT` suffix and atomic `create_new` reservation. Existing names gain numeric suffixes, including in the source directory. Originals and existing exports are never overwritten. A crash can leave a partial newly created derivative, which is never reused or treated as complete by a subsequent run.
- EXIF orientation is applied to pixels before crop coordinates are calculated. New encoders do not copy EXIF/GPS, XMP or IPTC.
- Embedded RGB ICC profiles (including camera sRGB and Adobe RGB profiles) are converted to sRGB before preview and export using moxcms with relative colourimetric intent. Colours outside sRGB may clip. RGB/RGBA 8-bit and 16-bit input is supported and alpha is preserved. Untagged input is assumed sRGB. Malformed profiles, non-RGB profiles (including CMYK and grayscale), device-link profiles and incompatible decoded channels are rejected with instructions to convert a copy in a colour-managed editor. Derivatives include an sRGB ICC profile; source ICC and EXIF/GPS are not copied. Original files remain unchanged.
- No upscaling. A too-small crop is blocked by default. Explicitly permitting smaller derivatives exports below the requested size and marks the result. JPEG compression reduces quality from the selected ceiling until the byte cap is met; it can reach Q1. Inspect low-quality results. PNG and WebP are lossless. Impossible caps produce errors before creating output files; dimensions are never silently shrunk to satisfy a cap.
- JPEG with transparent pixels requires a white, black or custom background selected by the user. PNG and lossless WebP preserve alpha. Graphics are resized with Lanczos3; colour-managed linear-light and premultiplied-alpha resampling are not implemented.
- Still JPEG/PNG/WebP only. Animated PNG/WebP may decode a first frame; animation export, HEIC, RAW and AI cropping are deferred. The window explicitly discloses this.
- No photo upload, account, telemetry, CMS integration, external fonts or application network client. Development tooling fetches dependencies and uses a loopback Vite server; packaged frontend policy allows only local IPC connections.
- File decode/encoding occurs in blocking worker tasks; frontend batch requests are sequential, and the window displays progress by file. There is no intra-file percentage estimate or cancellation yet.

## Validation status

See [VALIDATION.md](VALIDATION.md) for the actual checks attempted, exact helper failure and remaining acceptance steps. Tests are provided; no test pass is claimed.

The Library item `libfile_c946a7f57bc48191a1662c2038dda592` was resolved by filename to `image specs for uottawa.docx` (17,399,078 bytes in Library metadata). It was **not materialized** into this executor and its screenshots were **not inspected**. The presets use only the four starter specifications in the delegated instruction.
