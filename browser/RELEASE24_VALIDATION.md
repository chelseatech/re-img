# Streamlined refinement release 24 — October 23, 2026

Approved release: compact sidebar, Virtuo reference below editor, no Selected summary, filtered Up/Down preset selection, safe focus after successful paste/drop, and a tiny circled-info tooltip. The rejected expanded shortcut panel is absent. Double Escape within 500ms clears only the preset filter, ignores repeats and does not reset image/crop/preset/format/counters; dismissing the tooltip does not arm the reset.

Full-bleed image hero (`uo-20`, 1920 x 700) has a clipped preview-only bottom gradient and sample white text, with EN/FR contrast guidance. Assumed treatment: bottom 48% of crop frame, fading to 84% black. No reference-image gradient proportions were verified. Actual export pixels do not contain the illustration.

Final checks passed after release metadata changed to v24 / 2026-10-23:

- Production Vinext build. The host npm wrapper is broken; the unchanged build script was invoked directly with Node, as for prior verified builds.
- `tests/preset-search-ui.mjs`: actual React tooltip hover/focus/tap/Escape and accessible description; filter keyboard/timing/repeat/scope/state preservation; EN/FR aliases, no-results, clear, disabled/import-focus guards and responsive CSS targets.
- `tests/refinement-import-ui.mjs`: actual React/WASM successful paste/drop focus, interaction/failed-import safeguards, text paste, picker behavior, identical image/crop/format output bytes before/after filter reset, gradient-free PNG and bilingual reference/caption scope.
- `tests/hero-preview-ui.mjs`: clipped gradient/text drawing, restored drawing state and removal when disabled.
- `tests/preset-breakpoints-ui.mjs`: all 43 existing targets in JPEG and PNG with decoded pixel checks, mixed ZIPs, Apply all, per-image settings, ratios, crop/viewport state, missing-size guard, saved account selection and count integrity.
- `tests/counter-ui.mjs`: v24/date in EN/FR, persisted verified totals, estimated time, outages and cleanup.
- `tests/preset-search.mjs`: immutable catalogue, aliases, accents, dimensions and ranking.

Limits: no supported browser-control route is exposed. Native visual/mobile/touch, native clipboard, keyboard-button defaults and filesystem download dialogs were not tested. Reference materialization failed because the supported Library helper requires Windows-unavailable `os.setxattr`; the references were not pixel-inspected. The labelled static implementation illustration is not browser QA and predates the final tiny-tooltip simplification.

Public access and stored rollback versions are preserved. Previous v23: saved `appgprj_6ace73957edc8191937355a7461c00ef~appgver_714aeecd0848819196ecf2b170e590ee`, source `a37c4c6f8d9d65b41a2be8433951281dca4fe373`; its local release archive remains in adjacent release-evidence. Publication identifiers and live asset checks are recorded there after deployment.
