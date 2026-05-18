---
title: 'Does the PWA still need a service worker, given ADR-075''s run-time defenses?'
purpose: decide
tier: card
status: active
date: 2026-04-29
topic: ['open-question', 'adr', 'pwa']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §2 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Does the PWA still need a service worker, given ADR-075's run-time defenses?

**Current options:** Drop SW entirely (rely on `lazyWithRetry` + `check-dist-integrity` + cache-control headers); or keep SW for offline app-shell only; or keep current `autoUpdate` + `skipWaiting` SW

**Blocked by:** Opinion / brainstorm

**Notes:** ADR-075's chunk-load self-heal + dist-integrity gate cover the stale-chunk failure class without an SW. SW retains value as offline app-shell precache (PWA opens without network). Tenant-data-only stance + browser-only processing argues offline scope is partial anyway. Source: [`docs/07-decisions/adr-075-pwa-atomic-deploy-and-update-policy.md`](07-decisions/adr-075-pwa-atomic-deploy-and-update-policy.md) Alternatives.
