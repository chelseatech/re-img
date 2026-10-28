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

Published as **version 16** at https://re-image.chelsea-tech-2945.chatgpt.site. Sites confirmed the unchanged public audience and owner role after successful deployment.

- Tested application commit: `42534dc09fae2cbb6519cf0c5ec9d4bce4644bb2`, pushed and verified exactly on `feat/re-image-browser` before publication.
- Sites source commit: `4b845039da43f0438b9e11fb6040b65f509cc70e`.
- Saved version: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_d78fc9bebd9c8191a3d7f66973f7e740`.
- Archive: `sha256:7ef67f99200a44c19f8e46a8b85a189fc43294fede91238c8118f3213dd91474`.
- Deployment: `appgdep_6ad0da4200c481919d05946f4c197da8`, native status `succeeded`, updated `2026-10-15T13:51:11.799581+00:00`.
- Hosted GET checks: root200, six referenced CSS/JS files byte-identical to tested build; both ratio/hero configuration and approved dark color present; newer Select Files/50MB draft absent. Counter200/no-store with valid total4 at verification; owner preferences401 and spoofed identity401; exact original icon hash. No synthetic production POSTs.

The documentation follow-up commit records publication only. Its source changes are not needed for the already verified runtime deployment.
