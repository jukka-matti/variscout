---
title: 'Handoff workflow V1'
purpose: remember
tier: card
status: archived
date: 2026-05-17
topic: ['investigation', 'wedge-scope-note']
surfaced-date: 2026-05-07
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-17 (wedge-scope-note); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Handoff workflow V1

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

> **Wedge V1 (2026-05-16):** The Handoff response path is retired. Canvas exposes 3 paths (Investigate / Quick Action / Charter); Sustainment auto-fires per ADR-080 and absorbs end-of-project close logic. The Handoff stub code + prerequisite signal are dead code; clean-up deferred to a dedicated deletion PR.

**Description (historical):** PR8-8a shipped a Handoff stub destination only. The CTA's prerequisite signal (`sustainmentConfirmed`) is hardcoded `false` in FrameView until the data model lands. The full surface — transferring ownership of a confirmed-sustained improvement to the process owner with a control plan — is deferred.

**Possible directions (if Handoff is restored in VariScout Process):**

- "Sustainment confirmed" signal: needs concrete definition. Likely `SustainmentRecord.latestReviewId` populated AND review marked `confirmed-sustained`.
- Control plan: who owns the process post-handoff; what triggers escalation; reaction plan if metrics drift.
- Process-role split: Process Owner receives the handoff; out-of-scope for V1 Specialist-only model.

**Promotion path:** VariScout Process (named-future — requires Process Owner persona from [four-personas.md](01-vision/variscout-process/four-personas.md)).
