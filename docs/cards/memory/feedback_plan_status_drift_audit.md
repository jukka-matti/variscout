---
title: 'Plan-status frontmatter drifts; audit periodically with a single Explore agent'
description: 'Implementation plan files (docs/superpowers/plans/*.md) accumulate status drift — they get drafted, partially shipped via neighboring workstreams, and never have their frontmatter flipped. A single Explore agent walking plan frontmatters and grepping main for headline deliverables catches the drift cheaply. Trust-but-verify the agent''s verdicts; first-pass audits over-credit shipping.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: d634a930-572b-46ae-aa5c-97fe4d2db39f
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_plan_status_drift_audit.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Plan files (`docs/superpowers/plans/*.md`) accumulate status-drift over time. The pattern: a plan is drafted in week N, work begins, the work gets absorbed by a neighboring (broader) workstream that ships in week N+1 or N+2, the original plan is never explicitly closed. Frontmatter status stays at `draft` / `in-progress` / `deferred` long after the underlying work is shipped or superseded.

Discovered 2026-05-03: ten plans were drafted in a 4-day window (Apr 26–29). By 2026-05-03, exhaustive audit showed:
- 5 fully delivered (PR numbers locatable on main) but frontmatter said `draft` or `in-progress`
- 4 partially delivered (some pieces shipped via broader workstreams; other pieces missing)
- 1 stale-but-honest (deferred)
- The triggering case: `2026-04-27-layered-process-view-v1.md` was marked `deferred` but every one of its 11 tasks had been delivered by production-line-glance C2 (which absorbed the layered-V1 scope). Tried to dispatch the plan, immediately discovered the supersession.

**Why:** Drift is silent — there's no automated nag. Plans are easy to draft, easy to forget. Every dispatch against a stale plan wastes a worktree + several subagent runs before the supersession is discovered (which is what burned the layered-V1 dispatch).

**How to apply:**
- Periodically (every few weeks, or when the user reports "we have scattered plans") run a status-drift audit: dispatch a single Explore agent to walk every plan in `docs/superpowers/plans/` whose frontmatter is NOT `delivered`, identify the headline deliverable (component name, file path, PR number) from each, and grep main for evidence of shipping.
- **Trust-but-verify the audit.** First-pass audits systematically over-credit shipping ("module exists" gets read as "fully delivered" even when integration is missing). Spot-check at least the 3-4 verdicts that don't have a PR number cited — the partials are the ones the audit gets wrong.
- For confident-delivered (PR cited + recent merge), flip frontmatter to `delivered` in the same audit-cleanup commit.
- For partials, correct status to `in-progress` (or `deferred` if the work was absorbed by a different workstream and won't be picked up as-is). Don't auto-flip partials to `delivered`.
- Bundle the frontmatter flips into ONE commit per audit pass (with the audit's verdicts in the commit body). Don't spread across multiple commits — the audit's value is the cohesive picture.

**Future automation:** Consider a pre-merge check that any PR touching `packages/` flags any plan file referencing the same component for status update. Today's `scripts/check-doc-health.sh` already gates on frontmatter completeness; gating on plan-status freshness is a natural extension. Until automated, the manual audit is the fix.
