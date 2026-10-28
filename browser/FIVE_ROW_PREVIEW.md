# Five preset rows and expanded controls — unpublished

Based on live v26. Filename and Dimensions in filename are always visible in single mode and every batch row, with no disclosure. Edited names, suffix choices and exports are preserved.

The preset list retains all 42 entries but has a 260px viewport: five 52px rows including separators. Remaining rows scroll. Names have a two-line visual limit to keep row heights consistent; complete names/dimensions remain in accessible button labels and native titles. Search and keyboard selection remain; restoring/changing the selection or clearing the filter scrolls the current matching selected row into view without changing focus or selection.

Presets header now contains its title only visually. The visible count and separate circled-i control are removed. A visually hidden live count continues to inform screen readers. A concise EN/FR shortcut sentence is the very first content inside the existing top-right question-mark help dialog; no new help button or standalone panel was added. Closing that help preserves the search/filter and returns focus normally.

Passed: production build; actual React five-row CSS/row-count/scroll-command and EN/FR keyboard/filter/help tests; actual React/WASM expanded-name/suffix editing with real JPEG/PNG and batch ZIP names/bytes; existing ratio/size controls/advisory placement; initial/import focus, compact header counter/time behavior and filter-only reset/export isolation.

Limits: native browser visual/mobile/touch/scroll layout QA remains unavailable. Library reads for screenshots libfile_9b2c73f41f448191984a7259e4bf87d9 and libfile_b8d83d39af188191a022c9edc0390e82 returned image asset pointers plus OCR/metadata, not directly viewable pixel blocks here. The latter agrees with the parent's visual finding: Presets, 42 presets and a circled i. No additional screenshot geometry was inferred.

No save, push, deployment or release metadata change. Live remains v26; changes are uncommitted for review.
