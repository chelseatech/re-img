# Compact sidebar refinement — local preview only

Based on v23 source `a37c4c6f8d9d65b41a2be8433951281dca4fe373`. No Site save, source push or deployment was attempted for this iteration. Published version/date metadata remains v23 / October 23, 2026.

Implemented:

- Official Virtuo reference moved below the editing frame, outside the sidebar. Redundant Selected summary removed; selected row and existing resolution remain.
- Reduced sidebar gaps and list height while keeping preset rows at least 44px high and coarse-pointer info/close targets 44px.
- Up/Down select within the filtered preset list; Home/End select its first/last row. Search arrows choose a match and move into the list. Ordinary text-editing keys remain unchanged.
- Successful paste/drop imports focus preset search once import finishes. Failed/cancelled imports, ordinary file-picker imports, and user interaction during an in-flight import do not steal focus. Text paste in editable inputs remains untouched.
- Small circled info control now shows a tiny EN/FR tooltip only: hover/focus reveals it, tap toggles it, and Escape dismisses it without arming search reset. There is no heading, list, dialog, close button or added sidebar height.
- Double Escape within 500ms, scoped to preset search/list, clears only the filter. Held-key repeats are ignored. Single Escape prevents native search-clearing, guide Escape only closes the guide, and unrelated controls/dialogs cannot trigger filter reset.
- Full-bleed image hero only (`uo-20`, 1920 x 700): clipped bottom gradient plus white lorem ipsum in the crop preview. Bilingual copy explains preview-only coverage, insufficient contrast on very light images, and absence of automatic contrast validation. Export-engine inputs remain unchanged.

Passed: production build; local preview HTTP200 with 42 rows, relocated reference and compiled bilingual overlay/guide copy; actual React picker keyboard/clear/no-results/aliases/accent handling and guide focus tests; real React/WASM import/autofocus and pixel preservation tests; hero canvas draw tests; all 43 preserved preset targets in JPEG/PNG, batch ZIPs, Apply all, saved account settings, crop state, counter and search metadata regressions. Controlled downloads produce actual decoded image/ZIP bytes without sending production counter events.

Limits/blockers:

- User screenshots `libfile_5f68b0d9d8b88191b598d598597d7c27` and `libfile_6a92535dd64081918701c13b47ad757c` were resolved through Library. Materialization of the first failed because the supported Python helper calls `os.setxattr`, unavailable in this Windows runtime. It did not create a readable final local image. The same platform blocker prevents the second; neither screenshot was inspected. No raw-download workaround was used.
- No browser-control tool is exposed. Native visual desktop/mobile, real clipboard/touch, native keyboard-button activation and filesystem-download dialogs were not tested. A screenshot of the completed preview could not be captured or uploaded to Library. CSS and viewport-state tests do not substitute for this visual QA.
- Preview readiness evidence: adjacent `release-evidence/sidebar-refinement-preview.json` and HTML snapshot. The owned local preview server is stopped after readiness checks; restart locally with the existing start script or the equivalent direct Node/Wrangler command on port 5174.

All changes remain uncommitted and unpublished for review. Prior v23 release archive and saved rollback versions remain intact.

Latest verification after tooltip simplification: actual React hover/focus/tap toggle, aria-describedby, Escape dismissal/disarming, French copy and unchanged keyboard search passed. Import/export state-isolation regression and production build passed. No new save, push or deployment. Native visual/touch QA remains unavailable. The earlier static illustration contains the superseded large guide and is not a preview of this final tooltip.
