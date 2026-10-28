# Version 29 — caption accuracy regression

## Report and reproduction

Ryan reported that version 28 described two people embracing as a woman with a cell phone. A local test fixture was extracted from the photo area of the supplied screenshot. The original JPEG was not supplied; this reproduces the visible scene rather than its exact original encoded pixels. The private screenshot/fixture is not tracked, packaged or uploaded to an inference service.

The previous captioner (`Xenova/vit-gpt2-image-captioning`) reproduced the invented-phone error at both 80px and 800px. The replacement, quantized Florence-2-base-ft, still misdescribed the 80px input as a woman in front of a mirror, but correctly described the 800px scene as “Two people embracing in front of a field of tall grass.” Both model capability and input detail needed correction.

## Change

- Use `onnx-community/Florence-2-base-ft`, revision `e88a44eaf3791a35eae0c5a47b3dbcd36e67eb6f`, with Transformers.js 3.8.1 on WASM. The concise caption task is used; there are no scene-specific replacements or blocked-word filters.
- Extract the selected region from the **original file** through the existing orientation/colour-aware Rust/WASM engine. Integer multiples of the preset preserve its exact aspect ratio before native-size processing. This avoids both tiny exports and loss of detail from enlarging a full-image thumbnail after a deep zoom.
- Give the captioner a separate, lossless analysis crop bounded to 768px. Do not enlarge genuinely small source regions. Apply circular visibility masks so content outside the website circle does not influence descriptions. No crop guides or preview overlays are included.
- Normal downloadable image dimensions, format, byte caps and counter behaviour are unchanged. AI preparation no longer creates a downloadable derivative as a side effect.
- Keep bilingual drafts, cancellation, copy, manual review and CSV behaviour. First-use model download notice updated to approximately 400 MB plus runtime. Worker URL is versioned to avoid reusing version 28 code from cache.

## Verification

- `node --test` over `alt-image`, `alt-text`, `logic`, `batch`, `input-policy`, `filenames`, `crop-interaction`, `catalogue`, `flexible-size`, `download-count`, `i18n`, `export-policy`, `preset-search`, and `time-saved`: 43 passing tests.
- `node tests/alt-image-wasm.mjs`: real WASM retained the 250 × 250px source region after zoom while exporting the prescribed 80 × 80px JPEG.
- Native Chromium `tests/alt-image-browser.js`: actual canvas pixels confirm the selected region, analysis detail above 80px, circular corner exclusion and preserved visible centre.
- Native Chromium `tests/alt-quality-browser.js`: real model generation through the application on the screenshot-scene fixture, using the 80 × 80 author preset, produced “Two people embracing in a field of tall grass.” / “Deux personnes s'embrassent dans un champ de grande herbe.” Semantic checks for two people embracing and absence of the invented phone/mirror passed. The French remains an editable draft and needs editorial review.
- Instrumented the actual worker boundary: original-file engine request was 800 × 800 PNG; captioner received 768 × 768 PNG, rather than the 80px export. Preparing alt text did not create an image download/output.
- Separate real-model photo checks: cats → “Two cats laying on a pink blanket next to remotes.”; car → “A green car parked in front of a building.” These are a small regression set, not a general accuracy benchmark.
- `alt-text-ui`, `preset-breakpoints-ui`, `filename-options-ui`, and `refinement-import-ui` passed, including all 43 website image targets in JPEG/PNG and mixed ZIP behaviour.
- TypeScript and Sites production build passed.

Existing version-28 validation notes, including two pre-existing legacy test-script failures and browser coverage limits, remain in `ALT_TEXT_VALIDATION.md`. Captioning and translation can still make mistakes; this release fixes the demonstrated regression and improves input quality, rather than guaranteeing correct alt text for every image.

References: https://huggingface.co/onnx-community/Florence-2-base-ft/blob/main/README.md and https://huggingface.co/docs/transformers.js/v3.8.1/en/guides/dtypes.
