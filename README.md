# re-img

Browser-based image preparation for uOttawa web content. Crop, resize and compress images to component presets, then download JPG/PNG files individually or as a ZIP. Created by Ryan O’Connor.

**Status: ready for internal rollout.** The browser app is now available at **[Open re-img on Cloudflare](https://re-img.ryan-e65.workers.dev/)**. The Cloudflare deployment uses the published version 27 source from October 23, 2026. The former ChatGPT Sites URL remains public while links are updated.

No desktop installation is needed for the hosted app. French is the default; English and light/dark themes are available.

## Source and release status

| Item | Current status |
| --- | --- |
| Hosted browser app | Cloudflare Worker based on published version 27; ready for internal rollout |
| Browser source | Cloudflare migration is in the local `migrate/cloudflare-hosting` branch of the separate `site/` checkout; the earlier browser source is on [feat/re-image-browser](https://github.com/chelseatech/re-img/tree/feat/re-image-browser) |
| Default branch | Apart from this README, main still contains the original Windows/Tauri 0.1.1 prototype; the browser work has not been merged |
| Desktop app | Separate development path; no GitHub release is published |
| Access | Latest deployment record confirms a public audience. Internal rollout describes intended use, not enforced access restriction |

The hosted deployment and GitHub branches are separate. Updating this README does not deploy code, merge branches or change access. Use the browser branch for current app development; a checkout of main does not contain the hosted app.

## Using re-img

1. Open the app and choose a component preset. Output resolution is displayed as locked text; flexible presets offer supported crop ratios.
2. Add a still image with **Select Files**, drag and drop, or paste with **Ctrl+V / ⌘V** while the image area is active.
3. Move the crop frame by dragging or with arrow keys. Drag a corner, or use **+ / −**, to resize it. Circle overlays are guides; exported files remain square.
4. Choose **JPG (photos)** or **PNG (graphics)**. Edit the base filename if needed; the final filename is shown, with an optional dimensions suffix.
5. Download the displayed image. For several images, switch to **Batch mode**, adjust each image, and download individually or use **Download all as a ZIP file**. **Apply to all images** copies current settings while preserving names and crops.

Single mode is the default. Switching modes preserves the current image queue, filenames, presets and crops. In Single mode, only the first dropped/pasted image is used; Batch mode accepts multiple images. The built-in **? Help** explains the workflow and selected preset in both languages.

Downloads follow the browser’s normal folder and save-prompt settings. Images and unsaved edits are session data: download your results before closing or reloading the tab.

## Formats, dimensions and limits

| Rule | Browser app behavior |
| --- | --- |
| Input | Still JPEG, PNG and WebP |
| Output | JPG or PNG; JPG uses a white background for transparency, PNG preserves alpha |
| Maximum input file | 50 MB (50,000,000 bytes), inclusive |
| Batch size | Up to 50 images |
| Output size limit | 1,200,000 bytes per image; Homepage hero uses 1,000,000 bytes |
| Fixed presets | Exact prescribed output dimensions; small crops may be enlarged with a warning |
| Body text with image | Up to 800 px wide, native crop size without enlargement |
| Quick links with tabs and images | Up to 1200 px wide, without enlargement; 500 px recommended minimum; supported responsive ratios available |
| Homepage hero | Fixed 1000 × 667 px, a re-img setting |

JPG compression adjusts automatically. PNG compression is lossless; if a cap cannot be met, the app reports an error rather than downloading an oversized file. A failed batch does not produce a partial ZIP. Decimal units are used: 1 KB = 1,000 bytes; 1 MB = 1,000,000 bytes.

HEIC, RAW, GIF, SVG and animated files are unsupported. Convert a copy first. Malformed or unsupported colour profiles, including unsupported CMYK/YCCK inputs, are rejected with guidance. Large batches can still encounter device memory limits.

The catalogue is based on the [official uOttawa image specifications](https://virtuo.uottawa.ca/en/brand-design/digital-marketing/design/image-specifications), which may require uOttawa sign-in. App-specific sizing and caps are not claims about official requirements. See the selected preset’s help for source notes and ambiguities. Video-related presets prepare still preview images, not video files.

## Processing and privacy

- Images are processed on the user’s device using the shared Rust engine compiled to WebAssembly in a browser Worker. Originals remain unchanged.
- EXIF orientation is applied, supported RGB ICC profiles are converted to sRGB, and EXIF/GPS metadata is removed from exports.
- Images, original filenames and local paths are not sent to the server.
- Language and theme are stored in the current browser. The Cloudflare version has no account-based preset syncing.
- The shared download counter receives only a downloaded-image count and a random per-download ID for deduplication. Counter records contain no visitor identifiers. This replaces the original desktop prototype’s blanket “no telemetry” description.
- Filenames are normalized to lowercase letters, digits and dashes, with safe suffixes for duplicate names in a batch.

## Validation and remaining acceptance

The version 17 release record reports a successful production build, TypeScript checks, **38 unit tests**, and six React/WASM/CSS regression scripts. Coverage includes the exact 50 MB boundary, rejection before WASM allocation, picker/import routing, mixed presets, output dimensions/caps, no partial ZIP on failure, bilingual controls and dark borders. Hosted HTML and engine assets were checked against the tested build; authentication rejection checks passed. Earlier records cover native/WASM colour and pixel parity, ZIP integrity, Stop/retry, cropping, filenames, persistence and responsive layouts.

These are recorded results, not a claim that the full suite was rerun for this documentation change. The live interface, preset list, Help and mode switching were inspected on October 19, 2026.

Remaining acceptance checks: Safari, physical touch/drag, native file dialogs and browser save prompts. These are not claimed as verified. Review exported images before publishing, especially when the app warns about enlargement or strong compression.

Release evidence and detailed history are on the browser branch:

- [Version 17 publication and 50 MB input validation](https://github.com/chelseatech/re-img/blob/feat/re-image-browser/browser/UPLOAD_ZONE_VALIDATION.md)
- [Browser validation records](https://github.com/chelseatech/re-img/tree/feat/re-image-browser/browser)
- [Shared engine and initial browser validation](https://github.com/chelseatech/re-img/blob/feat/re-image-browser/RE_IMAGE_VALIDATION.md)

## Development

Check out the browser branch before running browser commands. Node.js **22.13.0 or newer** is required.

~~~sh
git clone https://github.com/chelseatech/re-img.git
cd re-img
git switch feat/re-image-browser
cd browser
npm run install:ci
npm run dev
~~~

For a standalone production build, run **npm run build** from browser/. **npm start** previews the built Worker locally; it does not deploy. The download counter uses Cloudflare D1. The local `site/CLOUDFLARE_MIGRATION.md` records the current deployment and release procedure. Keep validation records tied to the exact tested application commit and deployment.

Repository layout on the browser branch:

| Path | Purpose |
| --- | --- |
| browser/ | Current React/TypeScript, Vite/Vinext browser app, Worker integration, D1 routes and validation records |
| crates/ | Shared Rust processing engine and WASM support |
| src/, src-tauri/ | Original desktop interface and Tauri shell |
| tests/ | Desktop JavaScript regression tests |

The desktop prototype uses separate root-level npm/Tauri commands and native prerequisites. Its original [VALIDATION.md](VALIDATION.md) is historical desktop evidence, not the current browser launch status. Browser rollout does not imply a new Windows or macOS installer release.
