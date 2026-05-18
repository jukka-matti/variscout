---
title: 'reuse-production-primitives'
description: 'When building ''Advanced'' or composite UI surfaces, scout the existing production primitive first — reuse over parallel-build. Skeleton composers from earlier plan iterations retire when production reality is discovered.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 13d849fb-ae7d-4093-90ea-a9bff40322cf
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_reuse_production_primitives.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When a plan calls for an "Advanced" or composite view (PDCA workbench, brainstorm workspace, multi-primitive layout), scout the production codebase BEFORE writing a fresh composition skeleton. The repo likely already has the working surface — wrap it, don't parallel-build it.

**Why:** The PR-WV1-2 amendment surfaced this concretely. The original sub-plan's Task 3 built `<ImproveStageAdvanced>` as a fresh composition of 5 PDCA primitives (`PrioritizationMatrix`, `BrainstormModal`, `IdeaGroupCard`, `ImprovementContextPanel`, `WhatIfExplorer`). Reconnaissance for the amendment discovered `<ImprovementWorkspaceBase>` (in `@variscout/ui`) — already a production composition of those same primitives, already wired in `<ImprovementView>` from before the wedge, already store-backed. The skeleton lacked drag-drop, cross-group data flow, and the action conversion wiring. Reuse > skeleton; the amendment retired `<ImproveStageAdvanced>` and re-pointed the Advanced toggle to `<ImprovementWorkspaceBase>`.

**How to apply:**
1. **Before writing a new composition component**: `grep -rn 'function <PrimitiveName>\|ComposedView\|Workspace\|Panel' packages/ui/src --include="*.tsx"` for any existing surface that already composes the primitives the plan names.
2. **If found**: read it. If it covers the spec's intent, the plan task becomes "wrap + re-route", not "build from scratch". File the skeleton as a deletable artifact.
3. **If not found**: the new composition is justified. But verify by checking what older `*View` / `*WorkspaceBase` components were doing in the pre-wedge surface — they often hold the real behavior under names you weren't searching for.
4. **Scout cost**: ~5 minutes (a few greps + one read). Saves multi-hour re-routes mid-execution.

Companion to `feedback_check_shipped_patterns_first` (look for shipped patterns before treating spec defaults as canon) and `feedback_check_registry_placeholders_first` (verify before expanding). All three are variants of the same heuristic: production reality beats spec abstraction; scout the codebase first.

Related: [[journey-first-then-ui]] — the user reaction that drove the PR-WV1-2 amendment was a journey-first objection; the production primitive was already shaped for that journey. [[step-back-for-system-design]] — when piecewise design surfaces structural debt, pause; mid-execution scout-and-amend is the lightweight form.
