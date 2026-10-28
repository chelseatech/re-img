# Release 25 — October 23, 2026

Approved scope: publish the pending responsive top-bar metrics and one-time initial search focus, plus sidebar suggestions 1 and 2 only. Filename and Dimensions in filename now sit inside a native collapsed Filename options disclosure in single mode and each batch row. Generated filename remains visible. Fixed presets no longer duplicate their dimensions in a Resolution paragraph; required ratio/size selectors and dynamic/multi-size resolution output remain. Advisory preset notes stay in their existing sidebar location (suggestion 3 was not applied).

There is one Downloaded / Estimated time saved block, now in the header. Its EN/FR content, 107.5-second estimate per counted completed image, explanation and underlying counter logic are preserved. Narrow CSS separates metrics from navigation and stacks them below 480px; explanation opens downward with a viewport-bounded width. Initial search focus waits until enabled and makes one guarded attempt, respecting existing user/dialog focus. Existing guarded paste/drop focus remains.

Passed after v25/date metadata changes:

- Production Vinext build via the unchanged direct Node build entrypoint (host npm shim remains broken).
- Actual React/JSDOM filename-options test: default collapse, independent batch disclosures, EN/FR labels, edited stem/suffix retained across collapse, JPEG/PNG filename and decoded bytes, ZIP entry names, required ratio/multi-size controls and unchanged advisory placement.
- Actual React/WASM 43-target regression in JPEG/PNG: exact output dimensions, ratio handling, per-image batch settings, ZIPs, Apply all, saved account selections, byte/count guards and viewport state.
- Initial focus test: enabled mount, one attempt, no rerender/user/dialog focus theft, import focus retained; parsed responsive CSS verifies separate narrow navigation/metrics rows and viewport-bounded explanation.
- Counter UI: one header instance, no footer duplicate, EN/FR v25/date and formula explanation, zero/persisted/out-of-order/outage totals and cleanup.
- Import/export regression: paste/drop focus safeguards, normal text paste, filter-only double Escape preserves pixels/crop/format/count, hero illustration absent from exported bytes.
- Preset picker keyboard/tooltip/clear/no-results/accent/EN/FR regression.

Limits: no supported browser-control tool is exposed. Native visual/mobile/touch, real clipboard, native keyboard/disclosure defaults and filesystem download dialogs were not verified. CSS/viewport-state tests and controlled React/WASM exports do not substitute for native visual QA. Existing tiny shortcut tooltip and preview-only hero treatment are retained.

Public access is unchanged. Saved v24 rollback is `appgprj_6ace73957edc8191937355a7461c00ef~appgver_4a0285f3a1f88191ae8bd07e04bc6ff4`, source `3a07eeed518644663b90e3e8462bd405f6c1da55`; its archive and older versions remain intact. Final publication/source/asset evidence is recorded in adjacent release-evidence.
