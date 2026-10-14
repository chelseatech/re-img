# Clipboard, header and filename release — 2026-10-14

## Delivered

- Document paste events import clipboard image files through the existing size/format/worker validation. Single mode imports the first image; Batch mode imports all accepted files. Items/files representations are not added twice. Empty names receive a localized name. Text fields, text/URLs, busy processing and over-capacity pastes keep their normal behavior. No clipboard read API or clipboard polling is used.
- Both drop targets have a 4 px high-contrast dashed frame and padding; dark mode uses a pale frame. Ctrl+V / ⌘V hints and illustrated help explain pasting.
- Single mode / Batch mode (Mode individuel / Mode lot) sit beside the theme button. Default and state preservation stay intact. Header and main share centered widths (1500 px Single, 1900 px Batch) and responsive gutters.
- The decorative 16×16 r mark uses the exact Library PNG, clipped at x12/y16 from the original 63×37 pixels. The 1506-byte asset SHA-256 is `f5121a2e3d7c99f56c1303d962ec2f3cc5c4f1fd2479c37056bc2ccd3723b354`. BEAST materialization applied and verified its Library version extended attribute (0). No image was redrawn.
- Output stems allow lowercase ASCII a–z, digits 0–9 and dashes. Spaces become dashes, accents normalize, other symbols are stripped, repeated/edge dashes collapse/trim, and empty/non-Latin-only stems become `image`. Imported stems, edited/pasted names, previews and individual/ZIP exports use this policy. JPG/PNG extensions and optional actual-dimension suffixes remain automatic. ZIP collisions get numeric suffixes. Original source names remain in metadata. A trailing dash may remain while typing so another word can be entered; blur/export canonicalizes it.
- The requested shared counter is excluded. Its unfinished source/schema/test work is preserved separately on BEAST under the task's `counter-deferred` directory. No counter endpoint, UI, migration, service or permissions change is included.

## Validation

- 28 unit/logic/WASM tests passed, plus final targeted filename/i18n checks and TypeScript.
- Actual React + WASM integration passed: PNG/JPEG/WebP clipboard fixtures, unnamed/repeated clipboard files, Single/Batch import rules, editable-field exclusions, busy/capacity/100 MB/malformed guards; French accent/symbol names, empty/non-Latin fallback, extension handling, optional suffix, individual filenames and four-member ZIP collision inspection. Original filenames stayed intact.
- Existing integration regressions passed: exact fixed pixels, native flexible dimensions, crop/name/cache preservation, mixed JPG/PNG ZIP members, all byte limits, Stop/retry, dense PNG rejection and dense JPG compression.
- Real local D1 passed: anonymous rejection, two-user isolation, revisions/conflicts, foreign origin and injected-user rejection, 85 saved/merged recipes, language validation and preservation.
- Chrome production preview passed: real 63×37 asset loaded; computed 4 px dashed border in light/dark themes; 320 px viewport without horizontal overflow; 1920 px header/main exact centered width alignment in both modes; English/French labels; help focus/Escape. The UI was checked in the actual app, not just a separate mockup.

## Limits

Clipboard integration uses event fixtures and never read Ryan's clipboard. Native OS clipboard image paste, physical drag/file chooser and Safari remain manual checks. Chrome's file-URL upload permission is disabled and native Windows automation is unavailable; no permission was changed. Current hosted owner sync is not exercised with Ryan's authenticated session; local real D1 and hosted anonymous/spoof rejection are the available evidence. Browser download destination prompts remain controlled by browser settings.

## Publication

Pending exact GitHub/source/deployment evidence below. Existing public audience and URL are retained; no new Site or database migration is required.
