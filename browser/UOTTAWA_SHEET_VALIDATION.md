# re-img — confirmed uOttawa sheet corrections

Prepared on Forge, 2026-10-19. Base: `feat/re-image-browser` at `11873d7`.
Working branch: `fix/uottawa-authoritative-sheet`.

## Authority and changes

Ryan confirmed the supplied table as the source of truth. The independent fixture
`tests/authoritative-sizes.json` records every supplied pixel target plus the four
preserved targets (homepage hero, Business card, Article results, Static content
block). The React/WASM regression selects every target through the actual UI,
exports both JPEG and PNG, and decodes the results to verify exact pixels.

- Corrected all differing dimensions and added the sheet's missing collection,
  referenced articles/events, gallery (12), and view-up-to-20 components.
- Body image choices are exactly 600×337, 600×400, and 600×750. The approximate
  16:9 label never rounds the first height to 338. Removed the former 800 px rule.
- Quick links with tabs/images is fixed at 380×474; split-screen image/video is
  fixed at 960×756. Old saved ratios cannot reinstate the previous sizes.
- Section header offers 600×450 rectangle and 450×450 circle. Its existing
  `uo-31` ID still selects the rectangle, preserving saved selection compatibility.
- Quote and related article use 710×540 and 390×275. Removed their old unverified
  breakpoint guides instead of deriving new responsive requirements.
- EN/FR preset labels and help agree with the sheet. French labels now come from
  the catalogue, avoiding a second stale translation list. Help explains still/
  poster image preparation for video presets.
- Circular presets retain square exports and the existing circular framing guide.
  Global/per-preset byte caps and supported formats remain enforced.
- Existing account data/custom recipes are retained; loading a selected built-in
  applies current output rules without writing preferences.

## Preserved and unresolved

- Homepage hero remains Ryan's exact 1000×667 override, including its 1 MB cap.
- Business card remains 610×763 with existing metadata and cap.
- Article results remains 390×260 because the sheet gives no dimensions; help
  explicitly marks clarification pending.
- Featured person has no assumed output size. It is listed with an explanation,
  and export is disabled until dimensions are clarified.
- Static content block (3) remains a distinct 390×273 preset; gallery (12) is a
  separate 393×242 preset. The block's French label now correctly says “Bloc”.

## Validation

Passed:

1. 36 unit/WASM tests: `node --test tests/batch.mjs tests/catalogue.mjs
   tests/crop-interaction.mjs tests/download-count.mjs tests/export-policy.mjs
   tests/feedback.mjs tests/filenames.mjs tests/flexible-size.mjs tests/i18n.mjs
   tests/input-policy.mjs tests/logic.mjs`.
2. `node tests/preset-breakpoints-ui.mjs`: 43 supplied/preserved target selections,
   86 decoded JPEG/PNG exports, circle corners retained, EN/FR help modal, exact
   rounding, missing-size guard, mixed ZIP, per-image settings, Apply all, crop and
   viewport retention, five legacy saved-selection fixtures, and dispatch counts.
3. `node tests/mixed-presets-ui.mjs`: existing mixed exports, Stop/retry, dense PNG
   byte-cap failures without partial ZIP, JPEG retry, filenames, clipboard
   fixtures, picker/drop handlers, counter and offline reporting behavior.
4. `node node_modules/typescript/bin/tsc --noEmit` and `npm run build`.
5. `git diff --check`.

The React tests use jsdom and the real WASM image engine with controlled HTTP
fixtures. Native browser rendering, native clipboard/OS drag, live deployment,
and authenticated persistence integration are outside this verification. The
standalone persistence integration requires a local API service at port 5180;
an initial invocation without that service returned connection refused.

Lint is not clean in the existing `app/prep.tsx`: baseline 15 errors/9 warnings,
changed file 14 errors/9 warnings, with no new rule violations. The remaining
issues are existing hook/ref, explicit-any, and Function-type rules. The lint
comparison JSON is in ignored `work/lint-before.json` and `work/lint-after.json`.

## Checkout and release

The original checkout at
`C:/Users/Ryan/Documents/Codex/2026-10-14/task/re-image` was clean before and after.
It had one worktree on `feat/re-image-browser`. Work was copied into this task's
isolated checkout, with independent local build dependencies and output.

Build-ready for parent review and an authorized release. No push, PR, preference
write, site-version save, or deployment was performed. The live site is unchanged.

Changed runtime files: `app/prep.tsx`, `lib/catalogue.mjs`,
`lib/export-policy.mjs`, `lib/flexible-size.mjs`, `lib/i18n.mjs`,
`lib/uottawa-catalogue.json`. Changed tests: `tests/catalogue.mjs`,
`tests/feedback.mjs`, `tests/flexible-size.mjs`, `tests/i18n.mjs`,
`tests/mixed-presets-ui.mjs`, `tests/preset-breakpoints-ui.mjs`, plus new fixture
`tests/authoritative-sizes.json` and this report.
