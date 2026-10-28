# re-img

Prepare images for uOttawa websites: crop, resize and compress to the correct component dimensions, then generate editable English and French alt text. Created by Ryan O’Connor.

**[Open re-img on Cloudflare](https://re-img.ryan-e65.workers.dev/)**

**Current release: version 30.** Hosting uses Cloudflare Workers; alt text uses Cloudflare Workers AI. The current browser source is now checked into **[`browser/`](browser/)** on this repository's main branch.

## Using the app

1. Choose a website component from the searchable preset list.
2. Add a still JPEG, PNG or WebP image using the picker, drag/drop or clipboard.
3. Position the crop. Arrow keys move it; +/− resize it. Circular guides show the website's visible area; exported files remain square.
4. Choose JPG or PNG, check the filename and download. Batch mode supports individual exports or a ZIP.
5. Choose **Generate EN + FR**, review/edit both alt-text drafts and copy them into the CMS. Each language has its own copy button.

You can also write descriptions manually, mark an image decorative, confirm review and download a filename-matched CSV. Crop changes flag descriptions for review. CSV export requires a configured preset for every queued image.

Images and drafts stay in the current tab. Download/copy/export before closing or refreshing. AI can miss or invent details; review both languages for the image's purpose and correct terminology before publishing. A downloaded image does not automatically fill its website alt attribute.

## Cloudflare AI: speed and cost

There is no 400 MB browser-model download. One server-side request to Llama 4 Scout generates both languages.

Sample measurements: **2.3 seconds via the API; 2.8 seconds through the browser workflow**. The sample used 1,597 input tokens and 40 output tokens, approximately **US$0.00047 per generation** or **US$0.47 per 1,000 comparable generations**, before free allowances. These are sample results, not latency or cost guarantees.

Cloudflare includes 10,000 AI neurons per day across the account. Actual costs depend on image/token usage, other workloads and the account plan. Prices were checked October 27, 2026; see [Cloudflare's current pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

The app limits AI to **100 requests per UTC day and 10 per minute, shared across all visitors**. Quota is reserved before inference. Failed/cancelled calls may count, and no automatic retries or paid-plan upgrades occur. This caps request volume rather than guaranteeing a fixed dollar bill.

## Privacy

Crop, resize, colour conversion and image export happen on the device using Rust/WASM. Originals remain unchanged; supported RGB colour profiles are converted to sRGB, EXIF orientation is applied and export metadata is stripped.

**Generate sends only the prepared crop to Cloudflare Workers AI.** This app does not store images or descriptions on the server. Original filenames and local paths are not sent. D1 stores the anonymous download ledger and aggregate AI usage counts. Manual alt-text entry/copy works without AI.

See [Cloudflare's Workers AI data policy](https://developers.cloudflare.com/workers-ai/platform/data-usage/) for provider handling. The app does not enable AI Gateway content logging or cache inference content. This version has no account sign-in or preset syncing; language and theme stay in the browser.

## Image rules

| Rule | Current behaviour |
| --- | --- |
| Input | Still JPEG, PNG and WebP; maximum 50,000,000 bytes per file |
| Output | JPG or PNG; up to 50 images per batch |
| Dimensions | Exact prescribed pixels, with an enlargement warning when necessary |
| Body text with image | 600 × 337, 600 × 400 or 600 × 750 px |
| Quick links with tabs/images | 380 × 474 px |
| Homepage hero | 1000 × 667 px, a re-img setting |
| File-size caps | 1,200,000-byte global ceiling; stricter component caps apply, including 1,000,000 bytes for Homepage hero |
| Transparency | JPG uses white; PNG preserves alpha |

JPG compression adjusts automatically. A PNG that cannot meet its cap fails instead of downloading an oversized file. HEIC, RAW, GIF, SVG and animated images are unsupported. The selected preset's Help retains source notes and app-specific overrides. [Official Virtuo specifications](https://virtuo.uottawa.ca/en/brand-design/digital-marketing/design/image-specifications) may require uOttawa sign-in.

## Develop and deploy

Node.js 22.13+ is required (verified on Node 24). The browser build includes the compiled WASM engine, so building the website does not require Rust.

```sh
git clone https://github.com/chelseatech/re-img.git
cd re-img/browser
npm run install:ci
npx wrangler login
npm run build
npm run db:local
npm run dev
```

The configured local AI binding requires Wrangler authentication. AI testing calls Cloudflare and consumes account quota. Crop/export and manual text entry do not make AI calls.

```sh
npm test
npx tsc --noEmit
```

To release into the configured Cloudflare account:

```sh
npx wrangler login
npm run deploy
```

Deployment builds the app, applies the additive D1 schema and publishes the existing Worker. It preserves counters/usage. For a different account, create your own D1 database and update its ID in `browser/vite.config.ts` first. Keep credentials and private fixtures out of Git.

Detailed setup, privacy and release guidance: [`browser/README.md`](browser/README.md), [Cloudflare deployment](browser/CLOUDFLARE_MIGRATION.md), [cloud AI validation](browser/CLOUDFLARE_AI_VALIDATION.md).

## Repository and release history

| Location | Purpose |
| --- | --- |
| `browser/` | Current Cloudflare browser application, backend, engine asset, tests and documentation |
| `src/`, `src-tauri/`, root npm commands | Historical desktop prototype |
| `crates/` | Earlier native engine source; website builds use the checked-in WASM asset |
| `feat/re-image-browser` branch | Earlier browser snapshot, superseded by current `browser/` source |

The former ChatGPT Sites URL is a separate version 29 release with on-device AI. Use the Cloudflare URL for the current app. Old validation documents describe their own release; current delivery evidence is in `browser/CLOUDFLARE_AI_VALIDATION.md`. Safari and physical mobile hardware remain acceptance checks.
