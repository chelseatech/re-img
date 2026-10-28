# Version 28 — local bilingual alt text

Built from the exact version 27 Sites source at `e74964f314d03f44c695b1e08e77f2acb59ff786`, recovered from its source repository. The public GitHub browser branch is an older source snapshot. Catalogue dimensions and image export policies were preserved.

## Delivered

- Editable English/French descriptions per image, separate copy actions and combined copy.
- Explicit on-device generation from the actual encoded final crop, using the existing validated Rust/WASM export path. Preparing this image does not report a download.
- Lazy module Worker with pinned Transformers.js 3.8.1 runtime from jsDelivr, quantized `Xenova/vit-gpt2-image-captioning` (revision `215b4edcb7ec1fad5905a18a03f7b2007f6fabd0`) and `Xenova/opus-mt-en-fr` (revision `28726206f80896b90035bd99cccd5cc1e151f916`) model downloads from Hugging Face. No API credentials or inference service.
- Visible first-use model-download notice (approximately 360 MB, plus runtime), download/inference progress and cancellation. Images and draft text are not uploaded. Browser model caching remains subject to browser policy.
- Regeneration requires an explicit replace action when drafts exist. Cancellation/image switching cannot overwrite other drafts. Translation failure preserves the English result and leaves French empty.
- Decorative-image guidance, explicit human review and invalidation after crop/output changes. Text is never silently deleted when a crop changes.
- UTF-8 CSV with filenames, EN/FR text, decorative flags and review states; proper quoting and spreadsheet-formula neutralization. CSV is separate from image downloads and does not increment image metrics. Every image must have a configured preset before CSV export, so drafts cannot be silently omitted.
- Responsive light/dark styling; all controls and guidance in EN/FR. Drafts stay in tab memory and must be copied/exported before closing.
- Two pre-existing implicit-any callbacks in the preset picker now have explicit annotations so TypeScript passes.

## Verification

- `npx tsc --noEmit`: passed.
- Sites production build: passed, including the public AI worker asset. No AI library was added to the main app bundle or npm dependencies.
- 38 tests passed using Node's test runner across `alt-text`, `logic`, `batch`, `input-policy`, `filenames`, `crop-interaction`, `catalogue`, `flexible-size`, `download-count`, `i18n`, `export-policy`, `preset-search`, and `time-saved`.
- `node tests/alt-text-ui.mjs`: actual React panel passed lazy generation, editing/copy, review invalidation, replace confirmation, Blob dispatch, cancel, decorative guidance, CSV action, French controls and cross-image isolation. External model/clipboard boundaries are controlled here.
- `node tests/preset-breakpoints-ui.mjs`: actual React/WASM passed 43 targets in JPEG and PNG, decoded pixel dimensions/caps, circles, ratios, mixed ZIP, per-image settings, Apply all and counter integrity.
- `filename-options-ui`, `hero-preview-ui`, `refinement-import-ui`, and `initial-search-focus-ui`: passed.
- Native Chromium: actual local model download and inference succeeded on the public Hugging Face cats fixture. Output was “Two cats are laying on a blanket on a bed.” / “Deux chats sont allongés sur une couverture sur un lit.” This demonstrates inference, not semantic correctness or accessibility certification; the wording requires editorial review.
- Native clipboard actions succeeded. Crop changes retained descriptions and displayed the stale warning. Actual CSV download matched the current export filename and contained the stale review state.
- Native browser layout checked at desktop and 390px width; no horizontal overflow. French dark theme and Help close/focus return checked. Screenshots saved outside the source checkout in the workspace `artifacts/` directory.

## Existing failures and limits

- `mixed-presets-ui.mjs` times out waiting for the obsolete `.profile-control select` element. The same failure was reproduced on untouched version 27 with identical dependencies. The current `preset-breakpoints-ui.mjs` covers mixed exports successfully.
- `preset-search-ui.mjs` fails its Help focus expectation under the installed JSDOM 26 runtime. The identical failure was reproduced on untouched version 27. Native Chromium Help Escape/focus return passed.
- Local `/api/downloads` returns 503 without a migrated local D1 database; this predates the feature. No production counter writes were made during local QA. Hosted database bindings were preserved.
- Safari, Firefox, physical mobile hardware and low-memory devices were not tested. Blocked model/CDN downloads or insufficient memory leave manual fields available.
- This compact captioning model does not understand page context or reliably handle text-heavy graphics, charts, names or institutional terminology. Review both languages before publishing; neither a generated draft nor the review checkbox guarantees accessibility compliance.

Model/runtime references: https://huggingface.co/Xenova/vit-gpt2-image-captioning, https://huggingface.co/Xenova/opus-mt-en-fr, https://huggingface.co/docs/transformers.js/v3.8.1/en/api/pipelines.
