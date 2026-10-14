# Public feedback release v7 — 2026-10-14

URL: https://re-image.chelsea-tech-2945.chatgpt.site

- Application commit: `350e4c779ef79683ed6332e60f5bac97db665272` on `feat/re-image-browser`.
- Main feedback commit: `88b462ec1de308be8e1229e311eb4cb224724ec6`.
- Canonical GitHub repository: `chelseatech/re-img`. GitHub reported a rename from `web-image-prep`; the same branch SHA was verified through both locations. No replacement repository was created.
- Sites source: `22de01e3dbd0c1d42dafc87e7d43a9399a9b319b`.
- Saved v7: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_3dabfea6a3f48191b4ccd4ffc304490b`.
- Deployment: `appgdep_6acf9b64a18c8191a3e08b0d0d7020dc`, succeeded at 15:10 UTC. Audience remains public.

## Changes

- Removed visible sign-in/sign-out controls, anonymous saving prompt and idle images-ready counter. Existing signed-in saving and authenticated, per-user API isolation remain intact.
- Added ZIP action below the image list, retaining bottom ZIP and individual downloads. The footer action has an explicit grid position so removing the idle counter cannot move it into Stop's area during processing.
- Added red warnings on each image when its usable crop cannot meet the requested dimensions; warnings update with preset/dimensions/crop and do not block smaller exports. Unconfigured flexible targets do not produce false warnings. Containment does not incorrectly require a rectangular image to fill a square target.
- Added editable per-image filename stems. Paths and recognized extensions are removed for export; Unicode is sanitized, length bounded, actual width×height and output extension appended, and collisions handled for individual files and ZIP entries. Changes invalidate cached derivatives/archive. Saved preset naming data is retained; the export UI now uses the requested automatic dimensions suffix.
- Replaced the unverified compact-label drag import with the file picker. File drags/drops are prevented from navigating the app and give a localized Add images instruction. No drag-import affordance is advertised.
- Applied supplied-document French headings and audited fixed dimensions. Two source headings that remained English, Information list block and Related articles (2), remain verbatim rather than being presented as verified official French translations. Stable IDs, 34 catalogue sections, 35 catalogue recipes and 38 total built-ins are preserved. Existing saved/custom settings are not overwritten by a database migration.
- Removed ratio-conflict warnings from the primary controls: dimensions govern fixed crop/export. Corrected defaults include featured images 380×260, full-width video 1260×711, section header 610×487 and static gallery 390×273. Social media offers exact 390×390 and 390×487 choices under the same stable ID.
- Body text offers 16:9, 3:2 and 4:5, producing 800×450, 800×533 or 800×1000 at requested width 800. The 800 minimum is explicitly a Ryan/re-img rule, not a source claim. Flexible unspecified heights remain unset until dimensions or a ratio are chosen.
- Added bounded alternative-ratio outlines for body text and labeled display-preview outlines for citation/related-article components. Fixed export dimensions remain unchanged by responsive display guides. No exact split-hero or ambiguous large-screen quick-link geometry is invented; that ambiguity remains in Help. Recommended quick-link width 500 is identified as a recommendation.
- Unset file limits display a blank value with No limit/Sans plafond, and missing source limits remain Not specified. Article image with description has no claimed official 1000 KB cap in the supplied source.

## Verification

- TypeScript, production build and 22 Node regressions passed. Catalogue merge/preservation, naming, language validation, crop boundaries, live undersize calculations, guide bounds, ZIP failures/retry and cancellation covered.
- Actual React handlers in isolated Node DOM with the real WASM engine passed: ZIP and individual downloads, cache fallback, repeat-click guard, completed-output retention on Stop, retry, malformed input blocking incomplete ZIP, sidebar ZIP, edited duplicate filenames, crop warnings/reset, body ratio choices, repeated drop fallback, no sign-in control and no ready counter.
- A generated **200×200 source exported as exactly 200×200**, with no undersize warning. Intentional crop reduction produced a live warning; Reset restored the full 200 square. The reported colleague 198-pixel behavior was not reproduced. The canvas frame is drawn over the image; its stroke is not subtracted from source pixels. The specific physical browser gesture and proposed border cause remain unconfirmed.
- ZIP byte integrity and actual JPEG/PNG dimensions/alpha were checked through WASM, Sharp and Windows extraction in the preceding release; shared export/ZIP handlers were rerun in this release.
- Chrome inspected official labels, empty preset prompt, body 3:2 selection at 800×533, unset cap placeholder, both ZIP buttons, removed login/counter, and 390/320 px layouts without horizontal overflow. Desktop footer computed column 2 and mobile column 1/−1 were verified after the positioning fix.
- Real hosted requests without cookies, credentials or identity: root 200, preferences GET/PUT 401, forged identity 401, new sidebar/official body label present, no owner settings returned. Native Sites confirms public v7.

## Source and test limits

The current Library helper was fetched unchanged and the complete returned screenshot transfer passed through its supported consumer-local flow. It failed because Windows Python lacks `os.setxattr`; the final destination file did not exist. No raw transfer or metadata bypass was used. The parent's completed cloud audit of actual DOCX text/pixels and screenshots supplied the authoritative source findings. The original Word document was not edited.

Native Chrome fixture upload remains blocked by extension file-access permission. Canvas painting, physical mouse/touch gestures, native file chooser/download prompts and Safari were not covered by the Node DOM test. UI state/geometry and anonymous public access were checked independently. The original colleague drag/drop and 198-pixel causes are not claimed as reproduced; file-picker fallback and exact full-source/reset behavior are implemented and tested.
