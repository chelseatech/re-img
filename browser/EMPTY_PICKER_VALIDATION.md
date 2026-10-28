# Clickable empty image area

Ryan authorized implementation and publication of this focused change on 2026-10-15. The main empty image area opens the existing browser file picker and describes this action in French and English. Its duplicate Single-mode Add an image control is removed. Enter and Space activate it, repeated keydown is ignored, and the existing visible focus ring is retained. The sibling hidden file input avoids recursive click bubbling. Single mode selects one image; Batch allows multiple images.

The loaded-image New image control, crop interactions, drag/drop, paste, existing download counter and theme colors are preserved. The separately requested dark decorative-border candidate is prepared outside the repository and is not part of this release.

Validation passed:

- Production Sites/Vinext build and TypeScript `tsc --noEmit`.
- 31 logic, catalogue, crop, export, naming, language, batch and counter-report unit checks.
- `tests/empty-picker.mjs`: actual React, production CSS and WASM fixtures check pointer/child activation once, Enter/Space and repeat guards, busy states, Single/Batch, cancel/reselect, empty/loaded transitions, loaded crop exclusion, unchanged New image selection and queue retention, drop/paste, exact bilingual labels and focus declarations.
- Existing `tests/mixed-presets-ui.mjs` and `tests/drop-border.mjs`: actual React/WASM regressions, import/export behavior, paste and filename policies, mixed JPG/PNG ZIP, Stop/retry, empty/loaded outlines and both themes.
- Local built application in Chrome: area click, Enter and Space emitted a single-file chooser; Batch emitted a multiple-file chooser. French/English copy, absent duplicate main control, pointer cursor, blue light focus and gold dark focus were verified. The 320px layout had no horizontal overflow.

Limits: Chrome extension file-URL access is disabled, so selecting a local fixture through its native chooser was blocked. File selection/import, cancellation, same-file reselection and loaded-image behavior passed local React/WASM fixtures. Native clipboard and physical drag were not accessed; Safari and touch were not newly tested. No synthetic production counter reports were sent. No app data or access settings were changed.

Published to the existing public Site at https://re-image.chelsea-tech-2945.chatgpt.site as version **15**. Sites confirmed the owner role and unchanged public audience after deployment.

- Tested application/GitHub commit: `9b1180d7d997fd362a3299ef9a8ac6d2e1879a03` on `feat/re-image-browser`; exact remote equality confirmed before publication.
- Sites source commit: `d5f35920d641d2c286b4afb778c610d76201a9a7`.
- Saved version: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_8a6db737da8c8191a2308b4418fabc30`.
- Archive hash: `sha256:8ad261690b045d34d4c69c9339368c3c77f93bd23abd369e5530e00fd4a0353f`.
- Deployment: `appgdep_6ad0c99f543c8191a7bc9e82bf5f3909`, native status `succeeded`, updated `2026-10-15T12:40:15.044004+00:00`.
- Hosted GET checks passed: root200; new clickable role/label/input and absent duplicate; six CSS/JS assets byte-identical to tested build; counter200/no-store with a valid total of3 at verification; unauthenticated and spoofed owner preferences401; exact original Ryan icon hash. Zero synthetic production POSTs.
- Hosted Chrome confirmed empty-area click opens a Single-mode file chooser and observed the visible bilingual-ready interface, focus state and production total3. Screenshot saved as `C:\Users\Ryan\Documents\Codex\2026-10-14\task\reimg-v15-hosted.png`.

The documentation follow-up commit records publication only; it does not change the tested application or require a second deployment.
