---
title: 'feedback-tiered-audit-then-plan'
description: 'For "should we update X strategy" questions, default to audit → 2-3 tiers with trigger conditions → user picks scope → preserve unchosen tiers'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 626c2f4f1514e2fd
origin-session-id: dc7020a5-b53d-48d3-81d6-5423c126385e
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_tiered_audit_then_plan.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When the user asks an open-ended audit / strategy question ("should we update our testing strategy?", "would there be smarter ways to do X?", "is our approach to Y still right?"): **don't jump to implementation, and don't propose a single monolithic plan**. The shape that works:

1. **Audit current state** — Phase 1 with parallel Explore agents on the codebase + WebSearch / WebFetch for 2026 best practices. Capture findings in a comparison table (current state vs best practice).
2. **Propose 2–3 tiers** — Tier 1 = "tighten what's already there" (small, low-risk, ship now), Tier 2 = "consolidate" (medium structural change), Tier 3 = "restructure / future asks" (bigger ambitions). Each tier item gets effort estimate + risk classification + **trigger condition** ("execute when X happens").
3. **Let user pick the scope** — present the tiers as a menu, ask which they want via plan-mode approval. They may say "Tier 1 only", "Tier 1+2 bundle", "all in one PR", or "save the rest for later".
4. **Preserve unchosen tiers** as project docs per [[feedback_preserve_deferred_tiers_as_project_docs]].

**Why:** Worked twice in this session. User picked "all 3 polishes in 1 PR" for wedge V1 cleanup (compressed scope), then chose "Tier 1 only ship; save Tier 2+3 as docs" for testing strategy (deliberate scope reduction). The tiered shape made both decisions cheap to make and reversible. Compare to a single monolithic plan: the user would have had to either approve all of it or block on edits — neither matches their actual preference of "ship the high-signal slice, defer the rest discoverably."

**How to apply:**
- Default this shape for any "should we / would there be smarter / is X still right" framing
- If the audit reveals a single critical bug (not a strategy question), skip tiering and just fix
- Tier 1 is always "what we'd ship today without controversy" — if nothing fits Tier 1, the audit hasn't found anything worth doing yet
- Each tier item must be independently shippable; if Tier N requires Tier N-1, call that out explicitly so the user can decide whether to bundle
- Use plan mode for the tier presentation — the visible plan file + ExitPlanMode approval gates the scope decision cleanly
- Counter-signal: don't tier work that's actually one indivisible change (e.g. atomic deletion sweeps per [[feedback_atomic_sweep_one_dispatch]])

**Related:** [[feedback_preserve_deferred_tiers_as_project_docs]] (where unchosen tiers go), [[feedback_bundle_followups_pre_merge]] (when bundling IS the right call), [[feedback_slice_size_cap]] (cap each tier at ~6-8 tasks for feature work).
