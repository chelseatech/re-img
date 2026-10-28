# re-img development

- The production application is in `browser/`. Root `src/`, `src-tauri/` and their npm commands are the historical desktop prototype.
- Production hosting and AI use Ryan's Cloudflare account: https://re-img.ryan-e65.workers.dev/. Use the existing Worker/database, not the old ChatGPT Sites publication workflow.
- Run `npm test`, `npx tsc --noEmit` and `npm run build` inside `browser/` for relevant changes. `npm run deploy` builds, applies the additive schema and publishes the Worker.
- Read `browser/README.md` and `browser/CLOUDFLARE_MIGRATION.md` before deployment. Preserve the existing counter and AI quota data.
- Crop/export runs on-device. Only explicit alt-text generation sends a prepared crop to Workers AI. Preserve the privacy disclosure, server-only binding, shared daily/burst caps, manual fallback and editable drafts.
- Keep exact university preset dimensions and file-size rules. AI analysis must retain source detail without changing export dimensions.
- Private photo fixtures, local state, credentials and task screenshots belong in ignored scratch/evidence directories. Never stage them with source.
- `site/` is an ignored legacy checkout; `artifacts/` contains local handoffs/evidence. Keep GitHub's current browser source and README aligned with the Cloudflare release.
