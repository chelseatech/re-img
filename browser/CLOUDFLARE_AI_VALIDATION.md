# Version 30 — Cloudflare hosting and AI

The existing Cloudflare migration branch was merged with the exact version 29 source before adding cloud inference. The existing Worker and D1 database are reused. The old Sites deployment is not the current production target.

## Behaviour

- Local Rust/WASM still prepares the selected crop, including source detail and circular visibility. Website exports retain the prescribed dimensions, formats and byte limits.
- Explicit Generate posts a metadata-free PNG crop, bounded to 768px, to `/api/alt-text`. The server invokes Cloudflare-hosted Llama 4 Scout once for both English and French. No credentials are exposed to the browser, and no local model runtime/download remains in the production flow.
- The application stores no image bytes, filenames or generated text in D1/logs. The only AI records are UTC-day request counts, minute-window counts and aggregate input/output token counts. Cloudflare inference is subject to its published data policy.
- Public endpoint checks same-origin requests, content type, a 3 MB streaming body limit, PNG header/dimensions and nonempty bounded bilingual output. It reserves one of 100 daily/10 minute shared requests in a single conditional D1 write before inference. Errors/aborts do not refund quota; there is no automatic paid retry or account-plan upgrade.
- Manual fields, copy, decorative handling, crop-review invalidation and CSV remain usable independently of AI. Cancelling stops waiting and ignores late results; the server request may still complete and count.
- Direct Cloudflare is the default build. `npm run deploy` builds, applies additive `cloudflare/schema.sql` and publishes the existing Worker. Source now belongs in the GitHub repository's `browser/` directory.

## Measurements and checks

- Real AI inference on the supplied screenshot scene returned: “Two people embrace in a field of tall grass and yellow flowers.” / “Deux personnes s'étreignent dans un champ d'herbe haute et de fleurs jaunes.” The original image was not committed or uploaded as a static website asset.
- API sample: 2.33 seconds. Browser sample: 2.83 seconds; zero Hugging Face/jsDelivr model downloads.
- Recorded usage for the API sample: 1,597 input / 40 output tokens. At the published Scout rates, gross inference cost is approximately US$0.000465 per comparable call, before the account's free allocation. This is a sample, not a speed/cost guarantee or a general model-accuracy benchmark.
- `npm test`: 50 passing tests, including actual WASM, existing crop/catalogue/export policies, real SQLite quota reservation/concurrency, UTC/minute reset, invalid origin/size/dimensions and failed inference behaviour. Only the external model call is controlled in API unit tests; quota SQL runs against SQLite.
- `alt-text-ui.mjs`: actual React editing/copy, explicit cloud upload, replacement confirmation, abort/late-result isolation, decorative guidance, CSV action and EN/FR controls passed.
- `preset-breakpoints-ui.mjs`: all 43 target variants in JPEG/PNG, mixed ZIPs, filenames, pixel caps and no account-preference calls passed. The removed Sites account-sync expectation was replaced with an assertion that no preference endpoint is called.
- Filename/import regressions, TypeScript and production build passed. Build still reports Vinext's existing unknown-route-classification warning for the main page.
- The additive D1 schema was applied without resetting the existing download ledger. Native hosted verification follows deployment.

Historical limitations and old-script failures documented for earlier releases are not a claim that every legacy script was rerun for this migration. Safari and physical mobile hardware remain unverified. All AI descriptions still need editorial review.

References checked October 27, 2026: [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [Scout model](https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/), [data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/).
