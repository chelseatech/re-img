# Upload area and 50 MB input limit

Ryan requested this follow-up while version 16 was publishing. It was prepared separately, then explicitly approved for publication after confirmation of the Select Files layout and 50 MB scope. Published as version 17 at https://re-image.chelsea-tech-2945.chatgpt.site, preserving the existing public audience. The reference image was read from Library file `libfile_11e9b8b7df308191964ec11c8dc803fb` and inspected locally.

The empty main area follows the reference's centered arrangement: drop heading, small “or”, one outlined Select Files button and a separate maximum-size line. It uses re-img's existing light/dark palette and secondary-button styling. French is the default. Clicking the button or empty area opens the same picker once. The real button supplies keyboard semantics and the only empty-area tab stop; its surrounding group avoids nested button roles. Empty canvas cursors inherit pointer/default instead of move. Loaded crop move/resize behavior and the top New image control remain.

The shared browser input policy is **50,000,000 bytes per source**, inclusive. Picker, drop, paste, Batch, preview, export and retry validate File.size before reading, then actual buffer bytes. The worker checks before fetching/initializing the engine, and the ABI checks before WASM allocation. Over-limit images retain localized actionable errors and a failed batch produces no partial ZIP. The displayed French/English limit matches decimal 50 MB. Rust/desktop fallback limits are unchanged.

Output rules are unchanged: 1,200,000 bytes globally, 1,000,000 for Homepage hero, exact hero 1000 × 667, Quick links ratios/native sizing/500 px warnings, 50-image batches and existing retained-output/decode limits. The approved dark-border block is preserved verbatim; new upload CSS precedes it.

Outside-repo draft checks passed before integration: three input-policy tests; actual React/ABI/WASM/worker boundary and upload-route tests; updated empty-picker and mixed-preset regressions. Tests include a real padded 50,000,000-byte PNG, rejection at 50,000,001 bytes before WASM allocation, invalid/spoofed size checks, source retries, no oversized dispatch/partial ZIP, languages, cancel/reselection and New image queue preservation.

Combined post-integration checks passed: production Sites/Vinext build, TypeScript, 38 unit tests, `upload-limit-ui.mjs`, `empty-picker.mjs`, `mixed-presets-ui.mjs`, `preset-breakpoints-ui.mjs`, `dark-outlines.mjs` and `drop-border.mjs`. The browser source import from the shared public engine module compiled successfully. The drop-border fixture now verifies the new single native-button focus target while retaining every border/import assertion. Independent review found no concrete guard, cache, cursor, cap or localization defect.

All tests were rerun before publication: build, TypeScript, 38 unit checks and the six React/WASM/CSS regression scripts passed. Independent release review confirmed that output caps, counter, presets, database, hosting configuration, dependencies, WASM and the approved dark-border block remain unchanged. The updated worker, ABI and new input-policy module deploy together under `/engine/`.

No shared browser UI, native clipboard, synthetic production counter report or account-data write was used. Native keyboard default activation, file dialogs, painted layout, physical touch/drag and Safari remain browser acceptance checks.

## Publication evidence

- Tested application commit: `cd0bb606266eea78a00c782061d32c8710dcbeb8`, pushed and verified exactly on `feat/re-image-browser` before publication.
- Sites source commit: `e447bd1cee67928430b6aa5c1eeac382e32c2187`.
- Saved version: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_239fa431ee3c8191b3e8818de7b1dce5`, version 17.
- Archive: `sha256:a3fa12caaed86a1f5583566e3c27957ef13153634732b45020eef1094689aea1`.
- Deployment: `appgdep_6ad0df3254a08191b9319d2281c8b0df`, native status `succeeded`, updated `2026-10-15T14:12:19.004399+00:00`.
- Sites confirmed version 17, owner role and unchanged public audience after deployment.
- Hosted GET checks passed: root200; one visible native in-zone button, bilingual text and 50,000,000-byte policy; six CSS/JS and four engine assets byte-identical to the tested build; both Quick links ratios, exact hero configuration and softer dark border retained; counter200/no-store with valid total4 at verification; owner preferences401 and spoofed identity401; original icon hash unchanged. Zero synthetic production POSTs.

The documentation follow-up commit records evidence only and does not require a second deployment.
