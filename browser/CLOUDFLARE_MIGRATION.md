# Cloudflare deployment

Production: https://re-img.ryan-e65.workers.dev/.

Version 30 combines the version 29 crop/alt-text improvements with direct Cloudflare hosting and cloud inference. The initial migration used version 27; its source was merged forward rather than replacing the existing Worker or database.

- Worker: `re-img`.
- D1 database: `re-img`, ID `1a23bdd8-7322-4f8e-8453-49d726213948`, binding `DB`.
- Workers AI binding: `AI`.
- Model: `@cf/meta/llama-4-scout-17b-16e-instruct`.
- Browser source: `browser/` on GitHub main. Root desktop files remain historical.
- No ChatGPT sign-in or account preference endpoint. Browser language/theme remain local.

Run `npm run deploy` in `browser/` after verification. It builds, applies the additive schema and deploys. `npm run db:local` initializes local development tables after a build. Database commands never reseed counters or delete existing rows.

The Cloudflare download counter was originally initialized to 82 when migration began. It is now independent of the old Sites counter. New releases preserve the Cloudflare ledger rather than copying totals between services.

The old ChatGPT Sites URL remains a separate version 29 release with local AI. It is not updated or redirected by deploying this Worker. Share the Cloudflare URL for the current version.

The generated deployment configuration must name Worker `re-img`, include the expected D1 database ID and bind Workers AI. Wrangler uses the operator's Cloudflare login; no credentials belong in the repository. The deployment creates no account upgrade or new paid plan.
