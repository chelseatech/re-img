# Shared download counter and empty-only drop outline

Status: published as version14 at https://re-image.chelsea-tech-2945.chatgpt.site after Ryan's explicit approval. Existing public audience and owner access were retained. The normal Sites deployment applied the additive schema; no synthetic production counter event or historical backfill was performed.

## Behavior and data integrity

The quiet bottom-right FR/EN total comes from the existing shared D1 `DB` binding. An individual dispatch reports1; a ZIP reports its included image count. Cached files dispatched again create new reports. Previews, unsuccessful processing, stopped processing and incomplete/failed ZIPs do not report. Native browser save/cancel outcomes are not observable; the metric counts generated files dispatched to the browser.

Each dispatch has a fresh random UUID. A report retry reuses that UUID; casing is canonicalized. The unique ledger key and AFTER INSERT trigger update the aggregate atomically. The250-new-report/minute admission check is in the same INSERT statement. No other client's or owner's identity enters this logic.

A single-snapshot aggregate/ledger read verifies empty zero and rejects missing, zero-with-history, negative, fractional or unsafe aggregate values. POST performs this check before inserting, preventing a new report from reseeding an inconsistent aggregate and hiding prior history. Reads use D1's primary path without Sessions API, per [Cloudflare's documented behavior](https://developers.cloudflare.com/d1/best-practices/read-replication/).

Reporting is asynchronous and cannot hold up a download. Reads/reports have6-second timeouts; failed reports retry once. UI starts with an em dash until a total is verified, preserves the last verified total during outages and ignores stale lower responses. It refreshes while visible every30seconds and when returning to the tab. No local fabricated increments, initial fallback zero or historical backfill is included.

Drop areas now use explicit empty/loaded classes. The central area follows the selected image's successfully loaded preview; the Batch import area follows whether any image has loaded. Empty areas show the4px dashed frame, loaded areas have no border, and equivalent padding preserves layout. All-clear restores outlines. Failed-only imports retain the empty outline; selecting a failed image keeps its central area empty even when another queue image loaded. Drop/paste handlers and keyboard focus indications remain active.

## Privacy and abuse bounds

- Report JSON contains only `requestId` and `count` (integer1–50). Only request ID, count and server timestamp enter the ledger; the aggregate stores its total.
- No image bytes, source/output names, paths, preset data, visitor identifier, IP or cookie is stored by counter code. Existing hosting/authentication request processing is unchanged. FR/EN Help discloses the count and random report ID.
- POST requires same-origin JSON, rejects cross-site request metadata and bounds streamed bodies to512bytes, including absent Content-Length. Unknown fields and mismatched reused counts are rejected.
- The cap bounds new admitted reports rather than all request traffic. Public clients can fabricate reports within these bounds; the metric is not tamper-proof. Offline, blocked, timed-out or capped reports can undercount. Other clients see updates after their next refresh, rather than a live push.
- Retry IDs are retained for durable deduplication, so the ledger grows with dispatches. No existing data is pruned or permissions broadened. New service credentials are unnecessary.

## Passed checks

1. **Schema and presets:** pending local migrations0001/0002 applied in order;0000 unchanged.16 existing preset rows had identical SHA-256 before/after migration: `6952fa3a7ef5c030135fdaabb49749cb0f9803300a8513f591541fa398eccf41`. Existing binding, preferences route, clipboard helper, filename rules and exact icon bytes match v13.
2. **Real local D1:**60 unique concurrent reports;40 concurrent copies of one ID; UUID casing; count mismatch409; an explicitly discarded committed200 response followed by retry; independent anonymous clients; malformed/bounded/type/origin/method validation; no-Content-Length streamed overflow; corrupt GET/POST503 with unchanged ledger;300 concurrent admissions accepting exactly250 and rejecting50; known retry accepted even at cap; renewed window; ledger SUM equals aggregate. All22 pre-existing owner rows were unchanged during the final suite. Two fresh owner fixtures verified isolation and were removed by exact IDs afterward.
3. **Cold D1:** a separate empty local fixture returned verified0, then30 unique first-use concurrent reports plus20 copies of one ID yielded exactly65, with no false first-use inconsistency or casing double-count. The main fixture's history was not reset.
4. **Owner regression:** existing persistence test passed two-user isolation, guest rejection, revision conflicts, foreign-origin and injected-user rejection,85 saved/merged recipes, account language validation and preservation.
5. **Unit/logic:**31 tests passed; TypeScript and final production build passed. Final targeted i18n checks passed after the privacy copy update.
6. **Actual React/WASM export integration:** ZIP member counts, fresh/cache dispatch IDs, no preview/error/Stop reports, offline reporting unable to block new generation/download, byte limits and existing JPEG/PNG/crop/paste/ASCII filename regressions passed.
7. **Actual component read fixtures:** initial failure dash, verified0, later totals, stale/out-of-order responses, invalid totals,503/network retention, exact localized labels/formatting, two independent readers, visible-only polling and cleanup passed.
8. **Outline fixtures:** actual React/WASM plus productionCSS passed empty→loaded→empty, Single/Batch switches, light/dark, border+padding insets, malformed selected previews, failed-only batches, all-clear and loaded/empty drop/paste.
9. **Chrome local preview:** real bottom-right counter checked at desktop,320px and768px widths, EN/dark and FR/light. No horizontal overflow or clipped total; header/main alignment preserved. Screenshots at task root: `reimg-counter-local-desktop.png`, `reimg-counter-local-mobile-fr.png`. Values in screenshots are synthetic local fixture totals, not a live count.

Wrangler occasionally restarted a development worker mid-request, returning an identifiable plain-text503. The D1 harness retries only that development response, with the same UUID, and still fails on application errors. Four such retries occurred in the final main suite. Existing persistence tests passed serially after source edits stopped. All QA servers and temporary viewport overrides were cleaned up.

## Reproduction and release boundary

New tests: `tests/counter-d1.mjs`, `counter-cold.mjs`, `counter-ui.mjs`, `drop-border.mjs`, `download-count.mjs`; existing `mixed-presets-ui.mjs` and `persistence.mjs` remain regression evidence. HTTP counter fixtures reject non-loopback URLs and redirects, so fake reports cannot be sent to production. `local-counter-db.mjs` inspects only the local preview file and emits preset hashes rather than payloads.

Main local migrations are already applied; do not replay them. The cold-start test requires a newly created isolated `--persist-to` directory and the exact schema files; the current `.wrangler/counter-cold` contains synthetic test history. Both `.wrangler` and `work` are ignored and excluded from deployment artifacts. No production test events or migration seeds are required to verify release later.

Native file saving/clipboard/physical drag and Safari retain the previously disclosed manual limits; canvas painting is mocked in jsdom. Hosted increments and owner writes were not exercised with synthetic events. Local real D1 covers increment/trigger behavior, retries, isolation and conflicts. Hosted verification was read-only; no blocker remains.

## Publication evidence — 2026-10-14

- Tested app/GitHub commit: `9ce9d769cf5270fa38d2aa629eb0f489bcbd5dcf`, pushed and exact remote branch verified.
- Sites source: `f6ae73b8a47ced65dde33108acaed4dd60c5bb3a`, pushed and packaged by the supported helper from the tested build.
- Saved version14: `appgprj_6ace73957edc8191937355a7461c00ef~appgver_39aaca35d3b48191b51547556c7e0a05`.
- Deployment: `appgdep_6acff665a3908191875bb7f6edaf93ad`, succeeded at21:38:55 UTC, environment revision0.
- Archive SHA-256: `507d0f2d448ce95c4327ce8c748a7c1d37f09cf45b284a4d88e47aedc38098e3`,2949120bytes,81files. Only build/schema artifacts were packaged; ignored local SQLite/test data was excluded.
- GET-only checks: app200, counter200 with `{total:0}` and `no-store`, owner preferences401, forged identity headers401, exact icon hash, empty border overrides and borderless loaded base CSS confirmed. No counter POST was made.
- Fresh Chrome tab confirmed French default, fixed bottom-right verified0, correct empty frame and icon. No loaded user session was reloaded and no clipboard/file/download action occurred. Screenshot: task root `reimg-v14-hosted.png`.
- Both checkouts were clean after deployment. This evidence update is a documentation-only GitHub follow-up; the deployed app commit and Sites source above remain exact.
