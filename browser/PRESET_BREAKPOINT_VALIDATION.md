# Prepared Quick links and Homepage hero fixes

Prepared locally on BEAST on 2026-10-15 at Ryan's request. This change is not published or pushed. The live Site remains version 15 at https://re-image.chelsea-tech-2945.chatgpt.site. The separate dark-outline candidate remains outside this repository and is excluded.

Later on 2026-10-15, Ryan approved publication together with the dark-border candidate. Published as version 16; see `COMBINED_RELEASE_VALIDATION.md` for exact commits and deployment evidence. The preparation record below describes the earlier local-only validation boundary.

## Source and behavior

The archived authoritative extraction is `src/uottawa-specifications.json`, retrieved 2026-10-10 from VirtuO Image specifications. It provides no publication/revision date. This task reconciled that existing extraction rather than claiming a fresh authenticated source review.

- Quick links blocks with tabs and images (`uo-27`, source anchor `p-8f84da43-0cbc-46ba-b13d-f81ed51fb6d4`) states 1.6:1 at S and 5:4 at larger breakpoints, with a recommended width of at least 500 px. Both are now explicit, labelled crop/export choices. Choosing one changes that image's crop ratio and derivative; resizing the re-img window never chooses a ratio or changes output. The existing 1200 px app maximum and no-enlargement policy remain. A cropped native output narrower than 500 px shows the existing warning and can still export; this follows the source's recommendation rather than inventing a mandatory enlargement or rejection. The source's conflicting “vertical” wording versus printed 5:4 stays visible in Help. No pixel breakpoint thresholds are invented.
- Homepage hero (`uo-23`, source anchor `p-7f7d69ea-a4c3-4eaf-b453-0cd62bf6855d`) has no official fixed export size. Ryan's app override is exactly 1000 × 667 px, with locked output dimensions and no 3:2 rounding. Smaller source crops retain the enlargement warning. Its existing 1,000,000-byte source cap remains stricter than the unchanged 1,200,000-byte global cap. The incorrect 960 × 700 source example was removed from this entry; that example belongs to Split screen hero, which remains unchanged.
- French and English labels/help distinguish the two breakpoint choices and Ryan's fixed hero setting from source requirements. The French Homepage hero name is corrected to “Bannière de la page d’accueil”.
- Legacy saved hero recipes with null or partially null dimensions still validate and merge unchanged. Current editing uses the new locked 1000 × 667 output. Saved source-listed flexible ratios restore at current app size limits, including Quick links 5:4; unknown ratios use the existing default. No account records were written or migrated.
- Per-image preset, crop, format, name and ratio state remain independent. Ratio edits invalidate that image's output and the ZIP cache; other images retain their state.

## Validation

Passed:

- Production Sites/Vinext build and TypeScript `tsc --noEmit`.
- 35 unit checks: catalogue, legacy payloads/custom recipes, source-backed ratios, fixed hero dimensions, warnings, naming, bilingual copy, crop, batch and counter-report behavior.
- New `node tests/preset-breakpoints-ui.mjs`, using actual React and WASM exports decoded with Sharp. Verified 1200 × 750 and 1200 × 960 outputs from a 1600 × 1200 source; 600 × 375 versus 500 × 400 from 600 × 400 without enlargement; warnings and native exports below 500 px, including zoomed crops; fixed 1000 × 667 hero from large and small sources; fixture viewport 360/1920 independence; locked dimensions; independent per-image settings; mixed PNG/JPG ZIP members and cache invalidation; hero 1 MB/global 1.2 MB limits; lossless PNG failure with no individual/partial ZIP dispatch; JPEG retry; legacy null hero and saved 5:4 ratio restoration.
- Existing `node tests/mixed-presets-ui.mjs` and `node tests/empty-picker.mjs`: mixed formats/caps, crop/name/cache retention, Single/Batch, Stop/retry, paste/drop, counter dispatch boundaries, and the version 15 clickable empty area.
- Independent code review found no sizing, cache, cap or saved-data defect. Its copy finding about “official dimensions” was corrected to “current preset output rules”.

No native browser session was used, avoiding interference with the concurrent FHS task. These fixtures do not prove painted layout, browser download prompts, physical touch/drag or Safari behavior. No real clipboard, production request, production counter report, database write, source synchronization, GitHub push or publication occurred for this prepared change. Production verification belongs to an approved publication step.
