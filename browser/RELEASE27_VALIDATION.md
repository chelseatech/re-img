# Release 27 — October 23, 2026

Approved revision: filename and dimension-suffix controls are always expanded in single and batch modes. The preset viewport holds five 52px rows (260px total), with all remaining presets scrollable. Consistent two-line name treatment retains full accessible labels and native titles. Current selected rows scroll into view on selection restoration, keyboard choice or filter clearing, without changing focus or selection merely because the query changed.

The visible preset count and separate sidebar shortcut icon are removed. A visually hidden count retains screen-reader live feedback. A brief EN/FR shortcut sentence is first inside the existing top-right question-mark help content; no new help button or expanded standalone shortcut panel was added. Existing help close/cancel/focus return behavior is retained.

Other v26 behavior is preserved, including the compact downloaded-left/time-saved-right header row, initial/import focus, actual counter/time semantics, ratio/size controls, advisory placement, export behavior and preview-only hero illustration.

Final post-metadata checks: production build; actual React five-row/scroll/filter/keyboard/help tests in EN/FR; expanded-name/suffix edit tests with real JPEG/PNG and batch ZIP filenames/bytes; initial/import-focus safeguards; one compact header metric instance, bilingual v27/date and counter regressions; filter reset preserves crop/format/image/export pixels and totals.

Limits: browser-control tools remain unavailable. Native visual/mobile/touch/scroll/clipboard/disclosure defaults and filesystem-download dialog QA are not claimed. CSS row geometry and mocked scrollIntoView calls do not substitute for native visual checks. Reference Library reads yielded asset pointers and OCR/metadata only; the parent separately visually confirmed the cropped preset-count/info reference.

Access remains public. Retained rollback: v26 saved `appgprj_6ace73957edc8191937355a7461c00ef~appgver_2e626919ddd081918796e034e9071b75`, source `d19e478e6f10965f5c78ad6d28525d272f137871`. Exact save/deployment identifiers and live asset checks are recorded in adjacent release-evidence.
