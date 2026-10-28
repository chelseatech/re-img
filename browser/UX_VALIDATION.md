# re-image browser UI update — 2026-10-13

The update follows the existing desktop layout: slate/teal controls, queue, one large canvas and compact export settings. Circle guides mask the preview while exports stay square. Four corner handles resize a fixed-aspect crop; mouse/touch drag moves it and keyboard arrows/+/- provide alternatives. Before/after views and crop sliders are removed. Individual downloads take priority; ZIP UI is removed as requested. A small 12px creator credit appears above the lowercase product name.

Filename previews use actual output dimensions and reserve existing completed names. Worker requests now read the input before worker creation, reject cancelled read generations, ignore obsolete worker events, match response IDs, and synchronously guard batch operations. This prevents a terminated/failed worker clearing a newer worker during retry.

## Passed checks

- TypeScript and supported Sites production build.
- 10 Node tests: crop bounds/all four resize anchors/aspect/no enlargement, naming/Unicode/reserved names/collisions, preset/catalogue preservation and whitelisted sync payloads. The ZIP helper remains tested but is not exposed in this UI.
- Installed Chrome against the built Worker: mouse resize/drag, keyboard nudge/resize, circle guide, live names, individual JPEG download, repeated same-source import, unique batch names, clearing and output invalidation, Stop/retry, saved circle setting and reload.
- Responsive layout checks at 320, 390 and 768px; desktop and phone screenshots inspected. Creator credit contrast is 5.63:1 on white. Focusable canvas, labelled controls, visible focus outlines and keyboard gestures checked.
- Chrome CDP touch-pointer resize, malformed-image isolation, byte-cap error/recovery, PNG download, visible offline/not-saved feedback, reconnect and reload.
- Downloaded PNG inspected with standard-library decoding: 120×80 RGBA, alpha 170 preserved. JPEG download used actual 565×565 dimensions in its filename.
- Real local D1: anonymous rejection, two-user isolation, stale-revision conflicts, foreign-origin rejection; 50 existing recipes plus 35 catalogue choices survive save/reload. The storage schema and image engine are unchanged.
- Network inspection: image bytes/original filenames were not posted; only deliberate preset/settings writes used the backend.

## Scope and limits

The previously verified Rust/WASM ICC, malformed-profile, EXIF orientation, metadata and alpha engine is retained. These UI edits do not rebuild or replace it. Safari and physical touch devices have not been tested; touch evidence is Chrome emulation. Download links retain their browser save/open fallback. Hosted sync is checked separately after publication; local identity tests are not presented as a second hosted user or a second physical device.

Existing owner-private Site identity, preset IDs/data location and audience are retained. Desktop display branding is saved independently on feat/re-image-desktop-branding; this update starts no Mac builds and changes no paid budgets.
