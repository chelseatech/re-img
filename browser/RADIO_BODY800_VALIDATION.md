# Version11 — format radios, locked text and body800

Published on BEAST, 2026-10-14, at https://re-image.chelsea-tech-2945.chatgpt.site. Existing public audience preserved; no saved-data writes/deletions. Publication was explicitly authorized after the initial local-only instruction.

- App commit: `0907ad31bc7f53d307f5483a246eb857a1c97429`, verified exact GitHub remote SHA on `feat/re-image-browser`.
- Sites source: `5fea3ebca5e2921a5b326c8ebdcccba83023b8a8`.
- Saved version11: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_8ef58e4e88608191b849e4c4fd34abf7`.
- Successful deployment: `appgdep_6acfd0d798c881918d039c88517324d4` at18:58 UTC.

Changes are limited to the requested refinements and related help/tests:

- JPG/PNG dropdown replaced with native labelled radio buttons, a Format fieldset/legend and shared radio group. Labels are bilingual, disabled states preserved, arrow-key selection works.
- Dimensions rendered as noneditable output text, borderless and right-aligned. No dimension input controls remain.
- Only Body text with image (`uo-05`) changes from1200px to800px maximum width. Supported ratios and native smaller crops retained, with no enlargement. Quick links (`uo-27`) retains1200px maximum and500px recommendation. Fixed and unresolved presets unchanged.
- Help describes radios and distinguishes the body800 and quick-links1200 app policies in both languages.

Passed:

- TypeScript and production build.
- 26 unit tests, including native crop/exact fixed pixels, flexible source/crop bounds, body800 policy and unchanged other presets.
- Actual React/WASM regression including decoded body-photo PNG ZIP pixels: large1600x900 →800x450, source1000x750 →800x450, source600x400 →600x338. Portrait native output remains600x750. Additional quick-links output remains1200x750.
- Retained version10 regression for independent mixed JPG/PNG exports, mode/crop/name/cache preservation, optional suffix, Apply to all, Stop/retry, hard per-image limits and dense PNG failure without oversized download; dense JPG output verified1920x717 within its cap.
- Chrome: arrow keys switch radio selection; French/English labels; body16:9 →800x450 and3:2 →800x533. Dimension text computed styles show right alignment and0px borders. At390px and1280px, no horizontal overflow; light/dark controls and help work. Temporary viewport override reset.
- Hosted anonymous HTML200 with radios/locked text and removed controls absent; preference GET/PUT401 and forged identity headers rejected. Existing owner preset loaded in signed-in Chrome without a save. Hosted body800x450 and quick-links1200x750 defaults confirmed.

Testing limits unchanged: native OS drag/file chooser and save prompt not verified here because Chrome extension file-URL access is disabled and native Windows drag automation is unavailable; Ryan accepted manual drag testing on the live app. Safari and physical touch untested. Protected official-source content remains unverified; links are retained.

Live screenshot: task workspace `reimg-v11-live.png`.
