# re-img v4 — BEAST completion, 2026-10-14

Published owner-only to https://re-image.chelsea-tech-2945.chatgpt.site.

- Application GitHub commit: `2475ddb068f45b4286c9ef32ce3647d7054fb9bf` on `feat/re-image-browser`.
- Download fixes: `be3f498ec3161b3e1a3ffa7df568abdf5dac60b7`.
- Sites source commit: `2bb8218a9d9af40cfb9167b6d3eb018cfa0877ed`.
- Saved version: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_76933f72edb4819187131a26a08422b5`.
- Deployment: `appgdep_6acf8737ce00819194f34c31bd96e853`, succeeded at 13:44 UTC; Site v4.

## Source provenance

No pre-existing BEAST checkout was found under Documents/Codex. A clean clone matched GitHub checkpoint `e2dc281d22e1d114f636ddb0811dc6a800c8488b`. Lappy was not accessed or modified. Its four subsequent unpushed files were **not recovered**. Changes in `app/prep.tsx`, `app/globals.css`, `lib/i18n.mjs`, and `tests/persistence.mjs` were reconstructed from exact scripts/diffs retained in the previous task history. They cover cached click-gesture fallback, derivative invalidation after saving, repeat-click guards, stable Download placement with separate Stop, localized fallback help, and language persistence regressions. A further narrow-screen CSS fix was made after observed field clipping.

## Checks repeated on BEAST

- TypeScript `tsc --noEmit`: passed.
- Production Sites/Vinext build: passed, including rebuilt mobile CSS.
- Node i18n, logic, crop-interaction, and catalogue suites: 14/14 passed.
- Real local D1: anonymous rejection, two-user isolation, revision conflict, forged user-key rejection, origin rejection, invalid catalogue-format rejection, language validation/isolation, and preservation of 85 recipes passed.
- Actual WASM exports using generated test images: 720×720 JPEG; changed 360×360 crop; 120×80 PNG with all alpha values 170; malformed input rejection; impossible byte-cap rejection followed by deterministic successful retry. Decoded with Sharp, not judged only by filenames.
- Chrome built-Worker UI via loopback proxy with synthetic local identity: French default, explicit empty preset prompt, 38 recipe choices, compact header (~61 px) and uploader (48 px), illustrated help, reverse/forward focus trap, Escape and focus return.
- Chrome custom preset: created a 333×222 personal preset; saved and restored exactly after reload.
- Simulated preferences-network failure: displayed Save failed, retained the custom preset and language, then successfully saved and restored after connection recovery. This was a local proxy failure test, not a browser offline-mode test.
- Responsive inspection at 1500×1000, 768×1024, 390×844, and 320×800: no horizontal document overflow. Narrow mobile settings changed to two readable fields per row; rebuilt and inspected at 320 px.
- GitHub pushes and exact remote SHAs verified.
- Sites helper pushed exact matching application source and packaged the unchanged successful build; native private publication reported success. Refreshed access remains one owner, no added viewers or groups.
- Real hosted owner save/reload: D1 revision advanced 4→5; selected `wide`, 38 recipes, and all visible/advanced control values matched before and after reload. No test preset was added to hosted data.

## Limits

Chrome file-chooser automation was blocked by the extension's disabled “Allow access to file URLs” permission. That setting was not changed or bypassed. Therefore BEAST did not repeat the browser file-import/download, rapid-click export, or interruption/retry gesture campaign; these had passed on Lappy before its execution failure. WASM output checks above were independently repeated on BEAST. Actual browser offline mode, touch emulation/physical touch, and Safari remain unverified. Download-folder/“Ask where” preferences were not changed; the app continues using normal browser downloads.

No new app, data migration, TinyPNG integration, desktop build, or audience change was performed. The original Lappy workspace still needs independent preservation if its app is repaired or reinstalled.
