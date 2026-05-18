---
title: 'ADR amendment convention'
description: 'For short-term ADR revisions, edit in place with an inline'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 58b5bbc5-f330-4e14-8fcd-95e94bee288c
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_adr_amendment_convention.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

VariScout ADRs are amended IN PLACE for near-term revisions, not superseded by a new ADR number unless the original framing is fundamentally invalid.

**Why:** ADR-075 was amended within 48h of acceptance after the prompt-mode subset turned out to create an SW transition trap. Writing ADR-076-supersedes-ADR-075 would be heavy-handed for a same-week revision; an inline amendment preserves the original decision context (what was tried and why it didn't work) while the amendment section explains what changed and why. Same-day or same-week corrections benefit from the audit trail of "we tried X, it broke for reason Y, changed to Z" being co-located in one file.

**How to apply:**
- For revisions within the same week or month: edit ADR in place. Add `## Amendment — YYYY-MM-DD: short title` section near the top (after the header block, before Context). Body explains the trap or new evidence and what changed. Update Decision and Alternatives sections to reflect the new shape — the previously-rejected alternative may now be what's shipping; flip the framing.
- YAML frontmatter: keep `status: accepted` (lowercase). The visible `**Status**:` line in the body becomes `Accepted (amended YYYY-MM-DD — see Amendment below)` so the amendment is discoverable from the top.
- Always also append a Replayed Decision entry to `docs/decision-log.md` (it's the cross-cutting log; bump `last-reviewed`). This makes the revision searchable from the log even if someone hasn't read the ADR.
- For revisions months later, or that fundamentally invalidate the original problem framing: write a new ADR that supersedes (the project's standard pattern for ADRs 074/073/072 referencing predecessors). Put the predecessor in `docs/archive/adrs/`.

This convention was discovered while writing ADR-075's amendment; sibling ADRs (064, 070, 072, 073, 074) confirm the lowercase-status + inline-amendment pattern is project-standard.
