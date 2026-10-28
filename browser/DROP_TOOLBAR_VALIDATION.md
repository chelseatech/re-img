# Version12 — drop targets, resolution, segmented radios and loaded toolbar

Published on BEAST, 2026-10-14, at https://re-image.chelsea-tech-2945.chatgpt.site after Ryan selected A and approved the combined scope. Existing public audience and saved data preserved.

- App commit: `fc046306d3eef84dca096a7f4cb79b520494678f`, verified on GitHub branch `feat/re-image-browser`.
- Sites source: `5618278efc5aa305b1674629a49d95037411cdc1`.
- Version12: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_0d09c0f9daa08191898ada5c707654c8`.
- Successful deployment: `appgdep_6acfd9a7183c81918995608c7b2f71e9` at19:36 UTC.

Requested UI implemented:

- Dotted functional drop targets below the picker: “Glissez vos images ici” / “Drag images here”. Canvas and compact Batch-sidebar targets have direct dragover/drop handlers; propagation is stopped to prevent duplicate imports. Picker fallback preserved.
- One compact borderless, right-aligned line: “Résolution : 200 px × 200 px” / “Resolution: 200 px × 200 px”, using the actual prescribed/native output dimensions. Body800 policy and other maxima unchanged.
- Native JPG/PNG radios styled as adjoining segments: no gaps or visible circles, shared thin borders, outer rounded corners, pale neutral unselected option, established accent/contrasting selected text. Real radio grouping, arrow keys and visible focus retained; dark theme supported.
- Empty image panel retains Image heading, one picker and one drop instruction. Loaded panel has one toolbar: bold original filename and muted original dimensions/byte size left; New image then Reset crop right. No separate loaded Image heading, Add-image control, upload instruction or repeated source metadata below the image.
- New image selects the new file in Single or Batch and keeps previous images available. Narrow toolbar layout wraps cleanly. Existing secondary button styles used.
- FR/EN help distinguishes original metadata from output resolution and describes New image.

Verification passed:

- TypeScript, production build and26 unit tests.
- Actual React/WASM regression includes drops targeted directly at canvas and Batch boxes, no duplicate imports, picker fallback, source metadata, loaded prompt/heading removal, New image in both modes, old-image preservation and Reset crop exporting zoom1. Existing mixed presets/JPG/PNG/ZIP, optional suffix, Stop/retry, native flexible sizes and hard per-image byte-cap tests retained and pass.
- Chrome local empty-state checks: exact FR/EN drop/resolution text, dotted border, zero segment gap, native keyboard radio selection and visible focus. Single/Batch at390px without overflow; light/dark styles retained.
- Loaded toolbar layout checked at390px and1280px using serialized markup from the actual React regression, not a separately authored toolbar. Source600x400 metadata, filename, New image→Reset crop order and absence of loaded heading/prompts verified; no horizontal overflow. Image area begins immediately below toolbar. This is layout-only verification, not native upload/canvas painting.
- Hosted anonymous root200 with drop target/resolution/radios; preference GET/PUT401 and forged identity rejected; no owner data in anonymous HTML. Signed-in Chrome restored owner-selected `uo-11` and180x180 resolution without writing saved data. Live dotted border and0px radio gap confirmed.

Limits: ordinary OS drag/file chooser and native save prompt remain unverified because Chrome file-URL access is disabled and Windows native drag automation is unavailable here. Ryan accepted manual live drag testing. Safari, physical touch and loaded native canvas painting untested. Protected official-source content remains unverified; links retained. No Lappy access or desktop features.

Live screenshot: task workspace `reimg-v12-live.png`.
