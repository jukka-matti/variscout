---
title: 'Ground prescribed code in actual codebase types'
description: 'When writing implementation plans, read the actual TypeScript types before prescribing detailed code; don''t invent envelope/wrapper types that don''t exist'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 63e83e6f-6d7f-4518-9add-ab057c5c39d8
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_plan_grounded_in_actual_types.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When writing detailed implementation plans (especially via `superpowers:writing-plans`), prescribed code blocks must be grounded in the **actual codebase types**, not in a mental model of what the types ought to be.

**Why:** During Multi-level SCOUT V1 plan execution (2026-04-29), my plan prescribed an `Investigation` envelope type with `processContext.nodeMappings`. Neither shape exists. The actual hub-attached investigation type is `ProcessHubInvestigation` (from `packages/core/src/processHub.ts`) with `nodeMappings` on `metadata: ProcessHubInvestigationMetadata`. The Task 3 implementer caught it during execution and adapted; subsequent tasks needed similar adaptations (Finding type fields differed too — `text` not `title` plus several required fields). Decision #1 in the locked-decisions doc had to be revised in flight to point at the real type.

**How to apply:** Before writing detailed code blocks in a plan, run:
- `rg "^export (interface|type) <CandidateName>" packages/core/src/**/*.ts` for each type referenced in the plan
- Read the actual interface to confirm field names, optionality, and which envelope owns which fields
- For composite types (e.g. an "Investigation" that's actually a thin wrapper + metadata), make the wrapper / metadata distinction explicit in the plan

Costs of getting this wrong: in-flight plan revisions, extra subagent rounds, drift between locked-decisions doc and reality, and mid-execution courage to call out the mismatch. The savings from grounding upfront more than pay for the read time.

**Generalizes to:** every spec / plan that prescribes code shapes, not just this one. Especially relevant when the plan references frequently-evolving entities (Investigation, Finding, ProcessContext, mode strategies) whose internal structure has shifted across recent ADRs.
