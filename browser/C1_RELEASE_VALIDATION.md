# C1 preset list release — 2026-10-23

The approved C1 refinement replaces the duplicated search results/native dropdown with one always-visible compact list. Search filters names, bilingual aliases and dimensions immediately. Filtering, clearing and moving keyboard focus preserve the selected preset until a row is activated. Names and dimensions have no column headers. The existing shared JPG/PNG radios remain below the list with a translated Save format label and download-type explanation.

Preserved: canonical preset catalogue/specifications and search metadata, export engine, per-image batch settings and Apply all behavior, official EN/FR Virtuo links, counter semantics, time estimate, theme controls and footer corner padding. Release footer: version 23, October 23, 2026.

Passed before packaging:

- `node tests/preset-search-ui.mjs`: actual React/JSDOM picker; 42 initial rows, headshot and French accents/aliases, dimensions, empty/no-results, clear, explicit selection, keyboard arrows/Home/End/Escape, disabled state, translations and responsive CSS/44px targets.
- `node tests/preset-search.mjs`: metadata, ranking, exact catalogue dimensions, immutable specifications.
- `node tests/preset-breakpoints-ui.mjs`: actual React/WASM, 43 targets in JPEG and PNG with decoded dimensions, mixed ZIP, per-image format settings, Apply all, ratios/crop, unspecified-size guard, saved account selection and count integrity. Viewport state exercised at 360 and 1920 pixels.
- `node tests/export-policy.mjs`: actual WASM and strict pixel/byte limits.
- `node tests/counter-ui.mjs`: bilingual release footer, counters, outages, persisted count and estimated time.
- `node tests/time-saved.mjs`: zero, single, batch, large and invalid totals, bilingual formatting.

Verification limit: this session exposes no browser-control tool. No native browser screenshot, visual mobile layout, touch, real filesystem download dialog or signed-in browser interaction was tested. JSDOM clicks/keyboard and actual downloaded image/ZIP bytes are controlled test fixtures, not production counter events.

Rollback retained: saved v21 `appgprj_6ace73957edc8191937355a7461c00ef~appgver_8c34e5a356b08191acad56b6acc797d5`, source `fbea32c4a5622c6822e78b5dc0bfa6f5eccc76ad`. Prior saved v22 and its source also remain intact. No access-policy changes requested or made.
