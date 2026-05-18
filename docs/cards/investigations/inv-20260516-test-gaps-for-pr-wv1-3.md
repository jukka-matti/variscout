---
title: 'Test gaps for PR-WV1-3'
purpose: remember
tier: card
status: archived
date: 2026-05-16
topic: ['investigation', 'logged']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-16 (logged); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Test gaps for PR-WV1-3

**Surfaced by:** PR-WV1-3 code review.

Three gaps to close in PR-WV1-4 or PR-WV1-5:

1. `MEASUREMENT_PLAN_REMOVE` E2E — assert chip disappears from SVG after remove dispatch.
2. Dexie v11→v12 (Azure) + v4→v5 (PWA) upgrade-path integration smoke — confirm upgrade callback fires cleanly against pre-existing data.
3. `acceptInvite` when target project doesn't exist — guard at store level filters from pendingInvites regardless.

**Promotion path:** Pick up in PR-WV1-4 or the first PR that touches MeasurementPlan remove / Dexie version bump.
