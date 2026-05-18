---
title: 'feedback-preserve-deferred-tiers-as-project-docs'
description: 'When a multi-tier plan ships only the first tier, preserve remaining tiers as a project doc with status=deferred + inbound link, not in session-local plan files'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 2fa85e059a3962b9
origin-session-id: dc7020a5-b53d-48d3-81d6-5423c126385e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_preserve_deferred_tiers_as_project_docs.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a session produces a multi-tier plan (Tier 1 / Tier 2 / Tier 3 or similar) and only one tier ships, **save the unshipped tiers as a project document under `docs/superpowers/plans/YYYY-MM-DD-<topic>-deferred.md`** with `status: deferred` frontmatter and an inbound link from `docs/investigations.md`. Don't leave them only in the session-local `~/.claude/plans/` file.

**Why:** User explicitly asked at end of testing-strategy session (2026-05-17): "lets save the tier 2 and 3 as documents to the project, but leave it otherwise here." Session plan files live in `~/.claude/plans/` and aren't visible to other contributors, future Claude sessions on different machines, or git history. Project docs are. Without this move, deferred work is rediscovered from scratch when the trigger condition fires, losing the audit's reasoning + the file-level scope recommendations.

**How to apply:**
- After shipping Tier N of an N-tier plan, write a `2026-MM-DD-<topic>-tier(N+1)-N-deferred.md` doc that captures: which tier(s) deferred, **trigger condition for execution** per tier (the most important field — "when X happens, ship this"), file-level scope, sequencing if multiple tiers eventually ship, references to research/audits that informed the original plan
- Use `status: deferred` (valid per `scripts/docs-frontmatter-schema.mjs` STATUS enum)
- Add inbound link in `docs/investigations.md` under "Active investigations" so the doc isn't orphaned + so it appears in the open-loop list
- Each tier should be written to ship **independently** — don't create chains where Tier 3 requires Tier 2 unless that's a real technical constraint
- Counter-signal: if the deferred work is genuinely abandoned (not "later"), put it in `docs/decision-log.md` Replayed Decisions instead with rationale

**Related:** [[feedback_consolidation_replace_not_umbrella]] (similar bias to archive over discard, but for docs); [[feedback_close_threads_to_done]] (the opposite end of the lifecycle — close investigations.md entries via ship or decision, not perpetual deferral).

The deferred doc itself becomes a "should we do X" trigger when its conditions surface in future sessions.
