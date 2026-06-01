---
title: 'audit-zero-callers-verify-scope'
description: 'When an Explore audit claims "zero app callers," that excludes packages/hooks + packages/ui + packages/core — production callers across ALL packages must be verified before deletion.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 5e9d7b059f4090f8
origin-session-id: 92fc33ef-814c-4acd-844b-f15042e00987
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_audit_zero_callers_verify_scope.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When an Explore audit summarizes call sites as "zero in app code" or "test-only," **verify the scope of the claim** before acting on it. `apps/*/src/` is not the only place production code lives — `packages/hooks/`, `packages/ui/`, `packages/core/` are imported by apps and count as production callers.

**Why:** During PR #212 prep, the Explore audit for `migrateFindings` reported "zero in app code; only test fixtures call it directly." Plan locked on that premise. During implementation, a wider grep revealed `packages/hooks/src/useFindings.ts:146` calls `migrateFindings(initialFindings)` on every hook init — production load path, not test fixture. Caught during the implementer's pre-edit verification, not by the auditor.

**How to apply:**
- When dispatching scoped-deletion audits, **prompt the auditor to grep across both `packages/*/src/` and `apps/*/src/`** and report "production callers" not "app callers."
- When reading audit output, treat "zero in apps/" as a partial answer — re-grep across all of `packages/*/src/` before locking the plan.
- If the audit phrasing is "production callers" but the grep was apps-only, push back and request the full scope.

**Recovery cost:** Discovering the missed call site mid-implementation means scoping down the PR. Cheaper than discovering it post-merge when consumers break.

Companion to [[feedback_plan_call_site_reachability]] (types ≠ runtime reachability) and [[feedback_subagent_grounding_catches_drift]] (grounded subagents catch what top-down audits miss). Both share the lesson: audit summaries compress reality; verify against actual source before acting.
