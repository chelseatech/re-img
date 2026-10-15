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

Publication evidence will be appended after the native Sites deployment succeeds.
