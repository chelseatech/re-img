# Approved preset and dark-border release

Ryan approved publication on 2026-10-15 after the prepared preset fixes and softer dark outlines were presented together. This release combines preset commit `d72d6127eec752fcde58a7f42a76d52681a54ed0` with the previously prepared dark decorative-border candidate. The later Select Files layout and 50 MB input-limit request is a separate draft and is excluded.

Behavior:

- Quick links: labelled 1.6:1 at S and 5:4 at larger source breakpoints. These are manual crop/export alternatives, independent of the app viewport. Existing 1200 px maximum, native smaller exports and warnings below the recommended 500 px cropped width remain.
- Homepage hero: exact locked 1000 × 667 output, including smaller-source enlargement warnings. Existing 1,000,000-byte source limit and global 1,200,000-byte hard cap remain.
- Legacy saved hero dimensions and recognized saved ratios remain compatible. Per-image presets, crop, format, filenames and mixed ZIPs stay independent.
- Only decorative dark borders/dividers change to `#7c91a6`. Widths, backgrounds, light mode, text, controls, selected states, drop boundaries and focus colors remain unchanged. Decorative panel contrast changes from 5.68:1 to 4.54:1; primary text stays 13.44:1 and gold focus stays 10.62:1.

Combined validation passed:

- Production Sites/Vinext build, TypeScript and 35 unit checks.
- `tests/preset-breakpoints-ui.mjs`: actual React/WASM decoded outputs, both ratios, native 600 × 375 / 500 × 400, warnings below 500 px, exact hero, viewport-independent sizing, strict byte limits, per-image retention, mixed ZIPs, failed PNG/no partial ZIP/JPEG retry and saved-state restoration.
- `tests/mixed-presets-ui.mjs` and `tests/empty-picker.mjs`: prior output, import, keyboard, mode, filename, paste/drop, Stop/retry and counter regressions.
- `tests/dark-outlines.mjs`: 10 decorative targets; no light-mode differences; 31 controls/boundaries, 16 text/state elements and 26 focus cases unchanged. Only dark-scoped border-color declarations are permitted.

Testing uses actual React/WASM under jsdom and production CSS. No shared browser UI was used, avoiding the concurrent FHS task. Painted layout/canvas, native picker/save prompts, physical touch/drag and Safari were not newly verified. Tests use controlled fixtures and no production counter events or account-data writes. Hosted checks will compare the deployed assets to the exact tested build using GET requests only.

Publication evidence will be appended after deployment.
