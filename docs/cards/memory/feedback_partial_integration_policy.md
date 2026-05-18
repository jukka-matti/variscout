---
title: 'Bake partial-integration policy into the plan upfront'
description: 'When a feature spans engine → primitive → app integration, define at plan time what to do if the integration target isn''t reachable. Don''t improvise mid-flight.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: d5237c7475392c49
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_partial_integration_policy.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Implementation plans that span engine + UI primitive + app-level integration should explicitly state the deferral policy: if the natural integration target turns out not to have the required context, defer the integration to a focused follow-up, ship the package-level primitives, and document the gap with a promotion path in `docs/investigations.md`.

**Why:** VariScout slice 4 P3.6 / P4.2 hit "FrameView lacks investigation context" mid-flight. The plan said "mount in FrameView" without addressing "what if FrameView doesn't have what we need?" The implementer improvised session-local state — that's a deferred decision in disguise, made under time pressure, with no upstream input. Worse, by the time the wall surfaced, the engine + primitive layers were already shipped, so reverting wasn't an option; the only choices were "improvise" or "block the slice." Both bad.

A partial-integration policy decided UPFRONT in the plan means the implementer hits the wall, recognizes the pre-decided fallback ("ship primitives only, document gap"), and proceeds without inventing a policy under pressure.

**How to apply:** Add a §"Partial-integration policy" section to plan templates that span layers. State the rule explicitly:

> If `<integration target>` turns out not to have `<required context>` in scope at implementation time:
> 1. Ship the package-level primitives (`<X>`, `<Y>`).
> 2. Skip the app-level mount; do NOT improvise a fallback persistence path.
> 3. Add a `docs/investigations.md` entry titled `<feature> app-level integration` with: what's blocked, three or more promotion directions, "why this isn't blocking the slice," and a concrete E2E acceptance plan that lands when the writers are wired.
> 4. Mark the relevant verification §16 acceptance rows as DEFERRED with cross-reference to the investigations.md entry.

This is also a hint that `feedback_plan_call_site_reachability` should run BEFORE plan-locking — partial-integration policy is the safety net for when reachability validation didn't catch the gap (or when business priorities change between plan + implementation).

**Trade-off:** more verbose plans. Worth it because the alternative is mid-flight improvisation that ships ambiguous deferrals (was it intentional? a forced trade-off? what's the promotion path?). Pre-decided deferrals carry their justification with them.
