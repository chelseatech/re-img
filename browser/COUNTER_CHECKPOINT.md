# Shared counter checkpoint — not published

Current result: see [COUNTER_VALIDATION.md](COUNTER_VALIDATION.md). The local migrations and remaining checks below have now completed;0001/0002 are already applied locally and must not be replayed. Publication is still awaiting confirmation. This document records the earlier model-switch checkpoint.

Ryan requested resuming the counter, then requested a safe checkpoint to continue with 6.1 Ultra. Release confirmation remains pending. Do not publish, apply hosted migrations, or send fake counter events to the live Site.

## Preserved state

- Base: GitHub v13 documentation HEAD `d3c57c0f1198b75cae3d714d5eb9436f328ece9b` on `feat/re-image-browser`; all v13 paste/header/icon/ASCII filename changes remain intact.
- Working counter added directly to the current app (not by replacing it with old mixed snapshots).
- Existing `DB` binding reused; `.openai/hosting.json` and owner preferences API are unchanged. No new service, credential or security permission is needed.
- Two schema-only migrations add aggregate and dispatch tables, an atomic AFTER INSERT aggregate trigger, and timestamp index. No backfill/seed. Existing applied migration 0000 is unchanged.
- GET `/api/downloads` returns verified total or 503. POST accepts only UUID/count1–50, same-origin JSON, <=512 streamed bytes; intake bounded to 250 new dispatches/minute globally. UUID casing is canonicalized; repeated IDs do not increment, mismatched reused counts fail409. No filename, image, IP, visitor ID or tracking payload is stored.
- Actual successful anchor dispatch calls nonblocking reporting. Individual counts1, ZIP uses stored imageCount, cached repeated dispatch is a new event. Generation failures/cancellation/previews do not report. Reports retry once using the same UUID; read/report fetches have6-second timeouts.
- Quiet FR/EN bottom-right UI starts with an em dash until verified, retains the last verified monotonic total during failures, refreshes every30seconds while visible and on visibility restore. Counts dispatches, not confirmed disk saves. Failed/unreported events may undercount; this anonymous metric is not tamper-proof. A global cap can limit reporting under abuse.
- Original `counter-deferred` directory remains untouched outside the repo as a backup.

## Completed at checkpoint

- Drizzle generate: no schema changes relative to restored new snapshots; current generated migrations match schema.
- TypeScript passed.
- Production build passed with `/`, `/api/preferences`, `/api/downloads`.
- Read-only real local D1 schema query returned no `download_%` tables. New migrations have NOT been applied locally or remotely.
- Git diff whitespace check passed.
- Previous deferred helper unit tests had passed before v13; current resumed helper/UI regression tests were added but have NOT been run yet.
- No counter events were sent anywhere. No preview server is running. No Sites save/deploy or GitHub push occurred for counter work.

## Remaining work

1. Review counter implementation and migration trigger/abuse/idempotency behavior using the requested model.
2. Apply only pending migrations0001 then0002 to LOCAL D1 with the documented command below; preserve existing `.wrangler/state` preferences. Do not replay0000.
3. Run current unit tests and actual React/WASM `tests/mixed-presets-ui.mjs` (enhanced to check counter dash, ZIP/member/cache dispatch counts, preview/error/Stop exclusions and offline nonblocking download).
4. Add/run real localD1 HTTP tests for zero initialization, independent clients, concurrent atomic increments, repeated/lost-response IDs, UUID case, count mismatch, invalid/body/origin bounds and global rate limit. Verify preset records/isolation remain intact with `tests/persistence.mjs` and before/after saved records. Synthetic events are LOCAL ONLY.
5. Validate localized desktop/mobile light/dark display and stale response handling; document actual test evidence and any remaining limits.
6. Prepare a reviewable checkpoint, then wait for release confirmation. Keep live v13 unchanged until explicitly approved.

Local migration command (from `browser`, adjust filename for0002):

```powershell
& 'C:\Program Files\nodejs\node.exe' --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_lying_warbird.sql
```

Next filename: `drizzle/0002_naive_ulik.sql`. The Sites helper root is `C:\Users\Ryan\.codex\plugins\cache\openai-curated-remote\sites\1.0.0`; build with its `scripts/build-site.mjs`, using the existing workspace `toolchain` PATH shim. Test-only jsdom is in ignored `work/qa-runtime`.
