# re-img v5 public ZIP update — 2026-10-14

Public URL: https://re-image.chelsea-tech-2945.chatgpt.site

- Application commit: `d90dede3a9a02c1d3b1209bb30dbe3ebeae88d6d`, branch `feat/re-image-browser`; exact GitHub remote verified.
- Sites source: `ac1342b137a6e934e3fb74f4734b6cc1c3021afa`.
- Saved version v5: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_e77c860d04fc8191aa86c5b5b9f38c5a`.
- Deployment: `appgdep_6acf8bef45f08191b0ee5060dd2b72c5`, succeeded at 14:04 UTC.
- Access: native Sites policy changed from custom owner-only to public, revision 2. Anonymous checks succeeded after policy propagation.

The bottom action now reads **Download all as a ZIP file**, or **Télécharger toutes les images en ZIP** in French. It processes all images on demand, retaining individual Download controls and the separate Stop action. No Prepare step. Successful output is cached for click-gesture fallback; crop/settings/new-image changes invalidate the ZIP. A failed image prevents an incomplete ZIP; completed image derivatives remain available individually and for retry. Cancellation prevents the ZIP and keeps completed derivatives.

## Verified

- TypeScript and production build passed; 17 Node tests passed, including ZIP collision handling, cached bytes, failure/retry, cancellation, catalogue, naming, crop interactions, and bilingual settings.
- Actual WASM exports bundled into ZIP: `photo-720x720.jpg`, `PHOTO-720x720-2.jpg`, `crop-360x360.jpg`. Sharp confirmed JPEG dimensions. Windows Expand-Archive extracted all entries with exact matching file hashes. Existing PNG/alpha and byte-cap failure/retry engine checks also passed.
- Actual React component handlers tested in an isolated Node DOM runtime with the real WASM engine: anonymous use without any preferences fetch, batch ZIP, individual image download, cached ZIP retry, double-click guard, cancellation retaining a completed output, retry of unfinished work, and malformed input blocking incomplete ZIP. Canvas rendering and native browser file chooser were not simulated.
- Chrome inspected anonymous local UI, explicit preset selection, French default, English switch and exact ZIP label. Hosted Chrome confirmed the deployed label. Browser download-folder preferences were not changed.
- Real local D1 assertions passed for anonymous rejection, two-user isolation, revision conflicts, origin rejection, language validation, and 85 preserved recipes. A repeated client run hit a connection timeout after origin tests; the complete original run finished successfully. Preferences API code is unchanged.
- Before exposure, private service access without visitor identity returned root 200 and preferences GET/PUT 401.
- After public exposure, requests with **no cookies, credentials, or visitor identity** returned root 200 with the ZIP UI and anonymous save/sign-in guidance. Preferences GET and PUT returned 401, with only an error field. Forged visitor identity headers also returned 401. No owner data was returned.

## Privacy review

Reviewed all 34 catalogue records and their variants, all catalogue fields, rendered help, frontend/server routes, public assets and client-facing source. Catalogue contains component names, technical dimensions/ratios/format/size limits, source page numbers, and image-format/crop guidance. No internal URLs, credentials, personal records, document attachments, or confidential operational material were found. Owner preferences are fetched only for signed-in visitors, remain keyed to authenticated user ID, and are not baked into the public frontend. Public processing remains on the visitor's device. No production test preset or data migration was created.

## Limits

Chrome's native fixture upload remains blocked by the extension's file-access permission; it was not changed or bypassed. Native browser ZIP/file download and canvas gestures were not repeated in this release; the actual handlers were covered in Node DOM/WASM integration instead. Safari, touch and browser download-location prompts remain unverified. Public read/write isolation was checked through real hosted HTTP requests, not by signing the owner's browser out.
