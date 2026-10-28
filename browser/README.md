# re-img

The browser application for preparing images for uOttawa websites. Crop, resize and compress to university component presets, then generate editable English and French alt text. Created by Ryan O’Connor.

**Current release: version 30 — Cloudflare Workers and Workers AI.**

**[Open re-img](https://re-img.ryan-e65.workers.dev/)**

This directory is the production browser source, published as `browser/` in [chelseatech/re-img](https://github.com/chelseatech/re-img). The old ChatGPT Sites deployment is a separate, older release. New releases target Cloudflare.

## What editors can do

- Choose among 42 component presets, with searchable English/French names and dimensions.
- Import still JPEG, PNG or WebP images by picker, drop or clipboard.
- Move and resize crops with a mouse, touch or keyboard; see circular display guides where relevant.
- Export JPG or PNG at the prescribed dimensions, individually or in a batch ZIP.
- Generate EN/FR alt-text drafts, edit them and copy each language independently or together.
- Mark decorative images, confirm human review and export a filename-matched UTF-8 CSV. Crop changes flag descriptions for review.

Image files and alt-text drafts are session data. Download/copy/export before closing or refreshing. CSV export requires a configured preset for every queued image.

## Cloud AI, speed and cost

Generation uses `@cf/meta/llama-4-scout-17b-16e-instruct` through the server-side Workers AI binding. There is **no browser model download** and no API key in client code. Both languages come from one request.

A test crop took 2.3 seconds through the API and 2.8 seconds through the browser workflow; these are sample measurements, not a latency guarantee. It used 1,597 input tokens and 40 output tokens. At the model's published US$0.27/M input and US$0.85/M output rates, that is about **US$0.00047 per request**, or **US$0.47 per 1,000 comparable requests**, before free allowances.

Cloudflare includes 10,000 AI neurons per day across the account. Actual charges depend on token usage, other account workloads and the account plan. See [current pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

The app reserves quota atomically in D1 before inference: **100 requests per UTC day and 10 per minute, shared across the app**. Failed or cancelled requests can still consume quota. This bounds request volume; it is not a guaranteed dollar spending limit. No automatic retries or paid-plan upgrades are performed.

## Processing and privacy

Cropping, resizing, colour conversion and image export run locally in the Rust/WASM engine. Originals are unchanged; EXIF orientation is applied, supported RGB profiles are converted to sRGB and export metadata is stripped.

**Choosing Generate sends only the prepared crop to Cloudflare Workers AI.** The app does not store images or descriptions on the server, and does not send original filenames or local paths. D1 stores the anonymous download ledger and aggregate AI request/token counts. Manual alt-text entry and copy remain available without AI.

Cloudflare's handling of inference content is described in its [Workers AI data policy](https://developers.cloudflare.com/workers-ai/platform/data-usage/). The app does not enable AI Gateway content logging or cache inference content. Language and theme stay in the browser; this version has no account sign-in or preset syncing.

AI drafts can omit or invent details. Review both languages for the image's actual purpose and terminology before publishing. Charts and text-heavy graphics may need additional descriptions. Decorative images use an empty CMS alt field. Downloading an image does not automatically populate its website alt attribute.

## Image rules

- Still JPEG, PNG and WebP input; JPG/PNG output. HEIC, RAW, GIF, SVG and animation are unsupported.
- Up to 50 images; maximum input file 50,000,000 bytes.
- Exact fixed output dimensions, with an enlargement warning when needed.
- Body images: 600 × 337, 600 × 400 or 600 × 750 px. Quick links with tabs/images: 380 × 474 px. Homepage hero: 1000 × 667 px.
- Global output ceiling: 1,200,000 bytes; stricter per-preset caps also apply, including 1,000,000 bytes for Homepage hero. PNG that cannot meet its cap fails rather than downloading an oversized file.
- JPG replaces transparency with white; PNG preserves alpha. Circular guides do not make exported files circular.

The catalogue retains source notes and app-specific overrides. The [official Virtuo specifications](https://virtuo.uottawa.ca/en/brand-design/digital-marketing/design/image-specifications) may require uOttawa sign-in.

## Development

Use Node.js 22.13+ (verified on Node 24). Run these commands inside `browser/`:

```sh
npm run install:ci
npx wrangler login
npm run build
npm run db:local
npm run dev
```

The configured local AI binding requires Wrangler authentication. AI calls use real Cloudflare inference and consume account quota. Ordinary crop/export and manual alt text do not make AI calls.

```sh
npm test
npx tsc --noEmit
```

React UI regression scripts additionally use JSDOM installed under ignored `work/qa-runtime/`; see the validation records for the scripts exercised. Historical validation documents describe their own release, not necessarily the current hosting or inference architecture.

## Deploy to Cloudflare

Authenticate with `npx wrangler login`, then:

```sh
npm run deploy
```

This builds the app, applies the additive schema in `cloudflare/schema.sql` and deploys the generated `dist/server/wrangler.json`. Existing counters and usage rows are preserved. The configured Worker is `re-img`, with `DB` bound to the existing `re-img` D1 database and `AI` bound to Workers AI.

For a different Cloudflare account, create your own D1 database and update its ID in `vite.config.ts` before deploying. Do not commit OAuth tokens, API tokens, `.env` files, local database state or private image fixtures.

The browser source, README and deployment should move together. See [Cloudflare release details](CLOUDFLARE_MIGRATION.md), [cloud AI validation](CLOUDFLARE_AI_VALIDATION.md), and the earlier [caption-quality regression](ALT_TEXT_QUALITY_VALIDATION.md).
