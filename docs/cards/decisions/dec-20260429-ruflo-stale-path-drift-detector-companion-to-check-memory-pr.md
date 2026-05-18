---
title: 'Ruflo stale-path drift detector (companion to `check-memory-pr-staleness.sh`)'
purpose: decide
tier: card
status: active
date: 2026-04-29
topic: ['open-question']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §2 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Ruflo stale-path drift detector (companion to `check-memory-pr-staleness.sh`)

**Current options:** Direct SQLite read against ruflo's local DB; or wait for ruflo to expose a stable read API; or short-timeout CLI probe at SessionStart

**Blocked by:** Tooling / time

**Notes:** Ruflo CLI hangs while MCP is connected (confirmed 2026-04-29 — see `feedback_ruflo_cli_lock.md`). DB lives at `~/.npm/_npx/<hash>/node_modules/ruflo/.../memory.db` — not a stable path. Discipline rule shipped today (CLAUDE.md "Ruflo hygiene"); automation deferred until a stable read path exists.
