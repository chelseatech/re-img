# re-image

Windows desktop image-preparation prototype. Tauri 2 shell, vanilla JavaScript/Vite interface, Rust image-processing core. Version 0.1.2 hardens ICC colour conversion and malformed metadata handling. The Create preset feature branch adds reusable named custom settings and all 34 official uOttawa image-component presets. See [PRESET-VALIDATION.md](PRESET-VALIDATION.md) for current feature checks and Windows build status; [VALIDATION.md](VALIDATION.md) records the ICC baseline checks.

## Launch on Windows

From the checked-out project directory:

```powershell
Get-Command rustc,cargo,node,npm
rustc --version
node --version
npm ci
npm run icons
npm run check
npm run build
cargo test --locked --manifest-path crates/prep-core/Cargo.toml
cargo check --locked --manifest-path src-tauri/Cargo.toml
npm run tauri -- dev
```

Use Node 22 LTS or a current supported LTS and Rust 1.88 or newer (required by the locked image 0.25.10 dependency). Windows Tauri also requires Microsoft C++ Build Tools and WebView2. Inspect installed prerequisites before installing anything; no Windows prerequisites were installed during cloud verification. See [official Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/). `npm ci` and Cargo dependency resolution require registry access. Both Cargo lockfiles and package-lock.json are retained; use locked installs. Normal development packaging is disabled; the existing NSIS override enables a Windows installer build with `npm run tauri -- build --config src-tauri/tauri.release-nsis.conf.json`.

`npm.cmd run icons` generates the local Windows ICO and RGBA PNG assets from `assets/app-icon.svg` using the already-installed Tauri CLI. Run it before the first Tauri build, including development builds: Windows resource generation requires `src-tauri/icons/icon.ico` even when installer bundling is disabled. The CLI also supplies the standard PNG sizes and ICNS asset expected by Tauri's default scaffold. See [official Tauri icon generation](https://v2.tauri.app/develop/icons/). No icon download or extra dependency is required.

## First-use workflow

1. Add images with the Windows file picker or drop them into the native window. Up to 100 files; input resource limits are 100 MB / 64 megapixels per file, with a 256 MiB decode allocation limit.
2. Choose a profile, or click **Create preset** beside the Website profile selector to save your own named settings. Width, height, maximum size and format are saved locally for the next launch. Crop positions and zoom are per image for the current session. Batch export uses the current profile for all imported images.
3. Drag the crop or use arrow keys (Shift moves faster). Zoom tightens the crop. Circle overlays are guides only; files remain square when using the square portrait/card profiles.
4. Choose JPEG for photographs, PNG for transparency or graphics. Custom profiles can export lossless WebP. The image crate does not offer lossy WebP; this prototype does not present a misleading lossy quality control. libwebp would be a separate future dependency if lossy WebP is needed.
5. Choose an existing output folder and export. Each file shows processing, success or a specific error. Hover its result for the destination or full error.

## Create a reusable preset

1. Under **Prepare your export**, click **Create preset** beside **Website profile**. Scroll down to the export settings if needed.
2. Enter a unique name, such as **Homepage banner**, and the desired width and height in whole pixels (1 to 10,000). The form starts with the current profile's dimensions, format and size target.
3. Choose JPEG for photographs, PNG for transparency/graphics, or lossless WebP for a custom preset.
4. Optionally enter a file-size target in decimal KB. Blank or 0 means no limit. JPEG quality may be lowered to meet it; PNG/WebP remain lossless, and an impossible target produces an export error instead of silently shrinking the image.
5. Click **Save preset**. The new preset is selected immediately and appears in **Website profile** for future sessions. Edits to its dimensions, target, circle preview or format are saved automatically. Cancel or Escape closes the form without saving.

Presets stay on this device using the app's existing `web-image-prep-presets` localStorage key. Existing five-profile edits and previously created presets are retained. **Restore starter profiles** resets the original profiles and official component catalogue, and keeps your created presets. Duplicate names are rejected, and a storage failure keeps the form open with an explanation. New presets are custom profiles; every uOttawa profile permits JPEG/PNG only. Presets never authorize upscaling, and choosing a profile resets the optional permission to export smaller derivatives. Originals and existing exports retain the same read-only/unique-filename protection.

## Official uOttawa component presets

The **uOttawa — official components** group contains all 34 exact headings from the authenticated [VirtuO image specifications](https://virtuo.uottawa.ca/en/brand-design/digital-marketing/design/image-specifications), read on 2026-10-10. No publication/revision date was shown; the unpublished draft was not inspected. Complete task-relevant statements, usage notes and observed component anchors are retained in [src/uottawa-specifications.json](src/uottawa-specifications.json).

Select a component to see its documented dimensions, ratio and cap. **Featured article (2)** requires choosing **Image 1** (783×490) or **image 2** (390×390, circle preview); it keeps one component title. The four flexible entries start with blank width/height until you enter a size. The 960×700 reference for **Split screen hero** is not treated as a fixed rule, and the 500px recommendation for **Quick links blocks with tabs and images** is displayed without inventing a height. Responsive ratios remain usage guidance, not forced export sizes. Video component presets prepare still preview images only.

Where pixel dimensions and ratios disagree, both source statements remain visible with **Verification needed**; the app uses the listed pixels without asserting a corrected official ratio. These include the full-bleed components, Business card - Image, Section header with image, Social Feed and Static content block (3). Smaller rounding differences and other ambiguities are also flagged. Obvious source typos such as **JEPG** are interpreted as JPEG while original wording remains available.

All uOttawa output is JPEG or PNG. A missing source cap is labeled **not specified** and starts unset; no universal 1 MB cap is invented. The source prints KB/MB without defining byte convention. This app uses its existing decimal convention (1 KB = 1,000 bytes; 1 MB = 1,000,000 bytes), disclosed beside source limits. Circular uploads use square dimensions with a circle preview.

## Legacy editable profiles

| Profile | Output pixels | Maximum file size | Preview |
| --- | --- | --- | --- |
| Article image | 830 × 553 | 1,000,000 bytes | Rectangle |
| Article / event card | 390 × 260 | Unset | Rectangle |
| Author portrait | 80 × 80 | 200,000 bytes | Circle; square output |
| Circular card | 200 × 200 | Unset | Circle; square output |

The original four uOttawa profiles remain under **Legacy profiles** so their saved edits are preserved. The original **Custom client profile** remains under **Custom presets**. 0 in the UI means no app cap; no upscaling or overwrite behavior changes.

## Processing guarantees and limitations

- Source files are read only. Derivatives use a `-web-WIDTHxHEIGHT` suffix and atomic `create_new` reservation. Existing names gain numeric suffixes, including in the source directory. Originals and existing exports are never overwritten. A crash can leave a partial newly created derivative, which is never reused or treated as complete by a subsequent run.
- EXIF orientation is applied to pixels before crop coordinates are calculated. New encoders do not copy EXIF/GPS, XMP or IPTC.
- Embedded RGB ICC profiles (including camera sRGB and Adobe RGB profiles) are converted to sRGB before preview and export using moxcms with relative colourimetric intent, including matrix and LUT-based RGB profiles. Colours outside sRGB may clip. RGB/RGBA 8-bit and 16-bit input is supported and alpha is preserved. Untagged RGB/grayscale input is assumed sRGB. CMYK/YCCK JPEGs are rejected, including untagged files, because the decoder does not expose their original CMYK samples for managed conversion. Malformed or incomplete embedded ICC chunks are rejected rather than silently treated as untagged. Malformed profiles, non-RGB profiles (including CMYK and grayscale), device-link profiles and incompatible decoded channels are rejected with instructions to convert a copy in a colour-managed editor. Derivatives include an sRGB ICC profile; source ICC and EXIF/GPS are not copied. Original files remain unchanged.
- No upscaling. A too-small crop is blocked by default. Explicitly permitting smaller derivatives exports below the requested size and marks the result. JPEG compression reduces quality from the selected ceiling until the byte cap is met; it can reach Q1. Inspect low-quality results. PNG and WebP are lossless. Impossible caps produce errors before creating output files; dimensions are never silently shrunk to satisfy a cap.
- JPEG with transparent pixels requires a white, black or custom background selected by the user. PNG and lossless WebP preserve alpha. Graphics are resized with Lanczos3; colour-managed linear-light and premultiplied-alpha resampling are not implemented.
- Still JPEG/PNG/WebP only. Animated PNG/WebP may decode a first frame; animation export, HEIC, RAW and AI cropping are deferred. The window explicitly discloses this.
- No photo upload, account, telemetry, CMS integration, external fonts or application network client. Development tooling fetches dependencies and uses a loopback Vite server; packaged frontend policy allows only local IPC connections.
- File decode/encoding occurs in blocking worker tasks; frontend batch requests are sequential, and the window displays progress by file. There is no intra-file percentage estimate or cancellation yet.

## Validation status

See [PRESET-VALIDATION.md](PRESET-VALIDATION.md) for feature checks and [VALIDATION.md](VALIDATION.md) for baseline ICC checks. The existing Windows workflow is scoped to the repair/Create preset branches and starts a push build only for a workflow change with a `[build-windows]` commit. It retains read-only repository permissions and publishes no releases. Its feature checks compile/test Rust, verify native startup, create a named preset in the real compiled WebView, restart the app, verify persistence, and package a portable ZIP with commit/check/hash information. Debug arguments are supplied only to the CI smoke-test process; none ship in the app or are written to system settings.

The older `image specs for uottawa.docx` was not inspected in this executor. The official component catalogue uses the current authenticated VirtuO page extraction, rather than asserting that the older upload is current.
