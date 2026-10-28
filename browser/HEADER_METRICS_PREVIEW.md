# Header metrics and initial search focus — local only

Based on published v24. Move the existing single Downloaded count / Estimated time saved block into the header without duplicating its hooks, counter reads or report behavior. The existing EN/FR labels, 107.5 seconds per completed downloaded image, calculation explanation, click/tap and Escape behavior remain. The explanation opens downward into the page, with a viewport-bounded width. Navigation and metrics have separate rows below 1100px; small-screen controls retain their separate row and metrics stack below 480px. Version/date stays in the padded lower-left corner.

Preset search receives focus once when its first mount is enabled and there is no competing focus or open modal. Later language/metric/busy-state rerenders do not repeat this focus. Existing guarded autofocus after successful paste/drop remains.

Passed: production build; actual React initial-focus and existing-focus/dialog guards; responsive CSS AST checks; actual counter UI and bilingual estimation/counter regressions; actual React/WASM paste/drop focus and unchanged export-pixel/state tests; preset keyboard/tooltip/filter regressions; zero/single/batch/persisted/large-total time calculation tests. Native browser layout/mobile/touch QA remains unavailable; CSS checks do not constitute visual verification.

No Site save, source push, deployment or version metadata change. Suggestions only, not implemented: collapse Filename and dimension-suffix controls under Filename options; avoid duplicating fixed target dimensions in both selected row and Resolution; move advisory preset-specific instructions below the editor while keeping actionable warnings and required ratio/size selectors visible.
