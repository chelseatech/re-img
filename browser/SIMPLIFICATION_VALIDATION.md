# Simplification release — version 10 published

Published on BEAST, 2026-10-14, at https://re-image.chelsea-tech-2945.chatgpt.site with the existing public audience. Ryan explicitly chose to publish now and manually test dragging files into the live site; that remaining manual test no longer blocks publication.

- App commit: `f41087f10f8d1e46ee8b85abada39d669ed11f71`, verified exact remote SHA on `feat/re-image-browser`.
- Sites source: `c2a5a1532ff74687b108762c73c231857fd2e977`.
- Saved version 10: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_dcda5bede1cc8191a3ff90f64ddf05ee`.
- Successful deployment: `appgdep_6acfc7ddf2c8819192e614db1bb98fa3`, confirmed 2026-10-14 18:20 UTC.
- Archive: task workspace `reimg-simplification-candidate.tar.gz`, SHA256 `de0e3cf1a78390ad2a1013f31d15e58518a7e135e7d006a5aa1555b77444fe84`.

Implemented requested scope:

1. Hidden 1,200,000-byte maximum per image, automatic JPG quality search and lossless PNG compression. Stricter official preset byte caps remain respected. Exact dimensions and byte length checked before every individual export or ZIP member; impossible PNG raises an exceptional error without format/dimension substitution or oversized download.
2. Local light/dark toggle and contrasting controls, labels, warnings and focus outlines.
3. Read-only dimensions. Fixed presets use official dimensions and upscale an undersized crop with a clear red resolution warning. Flexible body/quick-links ratios retain native sizing up to1200px. Preserved the500px quick-links recommendation. Full-width600px integer crop stays600; false599px loss corrected in JS and Rust/WASM.
4. Drop loading restored through native browser drag events, with single-first-file and batch-all-files behavior. File picker remains. Handler tests pass; required ordinary OS interaction remains blocked (below).
5. Only JPG (photos) / PNG (graphics) output options, translated; JPG filenames end `.jpg`. WebP remains accepted as an input format.
6. Removed Frame/fit controls. Crop-to-fill default. Circle guides appear only for official Circular presets, automatically enabled; no export mask is applied.
7. Final filename below the filename field; per-image dimension suffix checkbox defaults on and preserves collision safety.
8. Single filename/download/confirmation moved into the right preset panel. Confirmation includes actual filename, dimensions, bytes and an accurately labelled percentage smaller or larger.
9. Removed Options, quality, background/transparency and maximum-KB controls. PNG retains alpha; JPG uses white for transparency.
10. Removed preset-save and General/Personal UI. Existing account data is read/retained; no production write or deletion. Official dimensions are used for editing.
11. Tight right panel, inline labels, larger editing space and neutral canvas without checkerboard.
12. Illustrated French/English instructions updated with official source links and possible sign-in notice.

Passed verification:

- Rebuilt the existing WASM engine using the official Rust target; TypeScript and final production build pass.
- 26 unit tests, including actual WASM integer/exact-pixel cases.
- Actual React/WASM regression with generated fixtures: modes preserve images, presets, names, crops and cached output; independent JPG/PNG individual/ZIP outputs; Apply to all; Stop/retry; optional suffix; native flexible ratios; accurate larger-file confirmation.
- Decoded exported pixels verify600x400 source → fixed1260x717, native600x341; fixed80x80PNG retains alpha; mixed ZIP members have exact prescribed dimensions and each is within the cap.
- Dense lossless PNG individual and ZIP fail without a download. Dense JPG automatically compresses within the cap at exact1920x717. No silent resizing or format conversion.
- Chrome local preview at390px and1280px: Single/Batch, light/dark, no horizontal overflow, read-only dimensions, removed controls and neutral canvas. Both help languages and source hrefs checked. Escape and close buttons work.

Hosted verification passed: anonymous root 200 with read-only dimensions, JPG/PNG labels, theme toggle, and no removed controls; preference GET/PUT 401, forged identity headers rejected, no owner data in anonymous HTML. Signed-in Chrome loaded the existing owner preset without a production preference write. Single/Batch and dark theme worked on the live release. Screenshot: task workspace `reimg-v10-live-dark.png`.

Remaining verification limits:

- Actual chooser test attempted against `browser/work/ordinary600.png`. Chrome rejected it because the ChatGPT extension has "Allow access to file URLs" disabled. No permission changes or bypass were attempted. Enable it in chrome://extensions → ChatGPT extension Details to allow file-based browser QA. Native Windows app/Explorer drag automation is unavailable in this execution environment, so an ordinary OS drag in Single and Batch still needs a manual check. Synthetic handler tests are explicitly not equivalent to that check.
- Automatic approval review rejected inspecting the official French URL when it redirected to login.microsoftonline.com: no authority to observe that sign-in origin was granted. The requested literal FR/EN links are present, but protected source content is unverified. No bypass or sign-in attempted.
- Safari and physical touch not tested. Real image canvas painting/native save prompt not verified in this release due the file-import blocker. Browser Ask where settings are untouched.
- Unresolved banner presets remain locked/unconfigured rather than receiving invented sizes; a clear explanation is shown and export stays disabled.

Screenshot: task workspace `reimg-simplified-dark-preview.png`.
