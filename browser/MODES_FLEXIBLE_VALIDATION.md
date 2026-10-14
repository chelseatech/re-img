# Single/Batch and flexible-width release

BEAST, 2026-10-14. Version 9 published successfully at https://re-image.chelsea-tech-2945.chatgpt.site with its existing public audience.

- Modes commit: `53524afce46bfad49ba24d679ca4116a869f6ffb`.
- Final app commit: `447e9f3ff7147ad9ece83bc11fa6ab429592df48`, verified on GitHub branch `feat/re-image-browser`.
- Sites source: `36a454afefcb6fe4aa219016b35d43141a2d6590`.
- Version ID: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_59a923fb44ec8191acac2f66fd446e5c`.
- Successful deployment: `appgdep_6acfab2599288191b6bb9c406c9bded4`.

Single is the default and hides the sidebar, ZIP and Apply to all. It imports one image, selects the newly imported image and edits/downloads only the displayed image. Existing images remain available in Batch. Switching modes preserves all loaded images and their names, crops, presets and cached output. Batch restores the list and its existing per-image and bulk controls. The top mode buttons disable during processing so Stop remains visible in the current view. French and English help now include an illustrated comparison of modes and current instructions.

Flexible width is an app policy separate from the official catalogue. Body text with image defaults to a 1200px width cap with 16:9; chosen ratios govern height. Quick links with tabs/images also uses the compatible 1200px cap and keeps its 500px recommendation. Body widths below 800px show the existing red warning, but still export at native size. Fixed presets and unresolved flexible banners remain unchanged. Changing crop, ratio or preset recomputes preview dimensions, filenames and warnings; exports use the same computed dimensions, including per-image ZIP entries.

Passed:

- TypeScript and final production build.
- 24 unit tests (all 22 v8 tests plus flexible sizing policy coverage).
- Actual React/WASM regression: default Single hides bulk controls; Batch import and image selection; Single selected-only cached and edited exports; mode switches preserve presets, names, crops, cached files; Single import preserves earlier images; retained v8 mixed JPEG/PNG ZIP, Apply to all and Stop/retry.
- Actual flexible exports: large source → 1200x675, 1000px source → 1000x563, small source → 700x394 with minimum warning; 4:5 → 600x750 native crop; 3:2 → 1080x720, further crop → 981x654. Mixed ZIP preserves these per-image dimensions alongside a fixed 80x80 preset.
- Chrome at 390px and 1280px: both modes without horizontal overflow; English and French help; Escape closes help and restores focus. Final flexible UI defaults to 1200x675, changes to 1200x1500 for 4:5, and fits at 390px.
- Hosted anonymous default Single HTML returned 200 with no sidebar or bulk controls. Preference GET/PUT returned 401; forged identity headers rejected; no owner data in anonymous HTML.
- Hosted Chrome default Single confirmed; Batch revealed one sidebar and its bulk controls. Existing owner settings loaded, with no production preference write.

Limits: native file chooser/download prompt not repeated because Chrome extension file URL access is disabled; permissions were not changed or bypassed. Safari, physical touch and real image canvas painting were not tested in this release. React/WASM uses generated local fixtures and tests handlers/output; browser QA verifies layout/help/controls. No Lappy access or desktop packaging.

Live screenshot: task workspace `reimg-v9-single-live.png`.
