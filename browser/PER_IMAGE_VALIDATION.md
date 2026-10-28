# Per-image presets and sidebar controls validation

Published on BEAST, 2026-10-14. No Lappy access was attempted.

- App source: `49221d98109fdc6d5785d19e9d10107e345445a2`, branch `feat/re-image-browser`, verified exact remote SHA.
- Sites source: `829d2633eeae5458590e91c558741af1f67dc184`.
- Site version: 8. Deployment `appgdep_6acfa381aef48191afd17a24e9c50339` succeeded.
- URL: https://re-image.chelsea-tech-2945.chatgpt.site
- Existing public audience preserved. Owner settings were read in the signed-in browser; no production preference writes were made.

Each image has its own preset snapshot. Selecting or editing one image preserves other images' crop, edited filename, cached output and undersize warning. Explicit Apply to all copies the active export settings while preserving each crop and name. Mixed presets drive individual and ZIP output. The redundant bottom bar and reserved bottom padding are removed; ZIP, progress and Stop remain in the sidebar.

Validation passed:

- TypeScript and production build.
- 22 existing catalogue, logic, language, crop, batch and feedback tests.
- `tests/mixed-presets-ui.mjs`: actual React handlers with the real WASM engine; mixed cropped JPEG 181x181 and PNG 120x80 individual/ZIP outputs, independent caches/names/crops/warnings, Apply to all, Stop and retry.
- Chrome at 390px and 1280px: no horizontal overflow, no footer, French/English labels and normal bottom padding.
- Hosted anonymous root 200; preference GET/PUT 401; forged visitor headers rejected; no owner data in anonymous HTML.
- Hosted Chrome: exactly one sidebar ZIP control, no footer, Apply to all visible.

Limits: native browser file upload/download chooser was not repeated because the Chrome extension's file URL permission is disabled; it was not changed or bypassed. Canvas painting, touch hardware and Safari were not tested in this release. The React/WASM regression covers output and interaction handlers, not native chooser behavior. The Library screenshot was available as caption/OCR only, not pixels; the app itself was inspected directly.

Live screenshot retained in the task workspace: `reimg-v8-live.png`.
