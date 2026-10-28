# Release 26 — October 23, 2026

Narrow adjustment to v25: total downloaded images remains left of estimated time saved in one compact horizontal row at every breakpoint. Metrics have no vertical stacking or added padding. Their explanation target is 32px high. Narrow layouts use concise EN/FR visual labels while full labels remain accessible. Exact counter/time values and the existing 107.5-second-per-image estimate are unchanged; extreme-width values can visually ellipsize instead of overflowing, with complete underlying text and value titles retained.

The responsive navigation rows, downward bounded calculation explanation, tooltip access, initial/paste/drop focus, filename options, preset selection/export behavior and advisory-note placement are preserved. Minimal vertical space is documented as an ongoing scoped design preference.

Final checks after v26/date metadata: actual React/JSDOM counter UI (single metrics instance, left/right DOM order, compact/full labels, EN/FR v26/date, zero/persisted/outage/count behavior, click/Escape explanation); initial-focus regression and parsed CSS assertions for one no-wrap row, no metric column override, 32px target and bounded explanation; time-estimate unit cases including invalid, zero, single/batch, persisted and very large totals. Production Vinext build passed via its unchanged direct Node entrypoint; host npm shim remains broken.

No supported browser-control tool is available. Native visual/mobile/touch/clipboard and filesystem download-dialog checks are not claimed. CSS and controlled interaction tests are not native visual QA.

Public access remains unchanged. Rollback: v25 saved `appgprj_6ace73957edc8191937355a7461c00ef~appgver_38430f8f2cd88191a621b0cbaed7e514`, source `484586f4e265724ba81b3523769e86808ea75b6c`; earlier saved versions and release archives remain intact. Adjacent release-evidence records exact publication/source and live asset checks.
