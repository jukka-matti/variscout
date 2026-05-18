---
title: 'When plan TDD code references type fields that don''t exist, the plan is implicitly asking for a schema add — close the gap upfront, not mid-implementation'
description: 'PR-RPS-2 lesson — plan tests prescribing `f.evidenceType` / `f.refutes` on Finding (which had neither) implicitly required adding both. Caught at controller level; budgeted cascade scope upfront.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 0fb937fd-b788-4d86-98fe-1c6557cdeef8
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_plan_tdd_implies_schema_change.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When an implementation plan's TDD code reads fields off a domain type that don't exist on that type today, the plan is implicitly asking for a schema addition — even if it doesn't say so explicitly. Don't dispatch the implementer with the plan as-written and let them discover this mid-task; close the gap in the controller's prompt **before** dispatching.

**Why:** The plan author was thinking spec-intent (spec §5 talked about evidence-type tagging on findings); they forgot the type didn't carry it yet. Per `feedback_plan_grounded_in_actual_types`, the implementer should not be the first one to discover the gap — controllers verify type-level reachability the same way they verify call-site reachability for integrations.

Observed 2026-05-09 during PR-RPS-2: plan §Task 7 + §Task 8 TDD code referenced `Finding.evidenceType` and `Finding.refutes` — neither existed; only `CausalLink` had `evidenceType`. Controller prompt expanded Task 7 scope explicitly to add both fields, set realistic cascade-footprint expectation (~5 files but accept up to ~50 mechanical fixture adds), and pre-decided how to handle related fields like `validationStatus` (kept separate; may diverge). Implementer cascaded to 49 files cleanly with no ambiguity escalations.

**How to apply:**

Before dispatching a plan-task implementer, scan the plan's TDD code for property accesses on domain types and grep the type definitions to confirm the fields exist:

```bash
grep -rn "\.fieldName" docs/superpowers/plans/<plan>.md
grep -n "fieldName" packages/core/src/<domain>/types.ts
```

If a referenced field is missing:

1. Read the spec to confirm the field is intended (vs. plan author drift).
2. Decide the schema addition shape (required vs optional, defaults, where to place it).
3. Decide whether to collapse with adjacent fields or keep separate.
4. Cap cascade scope upfront (e.g. "if cascade balloons beyond N files, stop and report") — but accept the larger number when it's purely mechanical fixture adds in a no-back-compat phase.
5. State the decisions in the implementer prompt explicitly so they don't have to make them mid-task.

Costs ~5 minutes of controller time; saves an implementer's BLOCKED escalation OR (worse) a fix-up commit because the implementer added a field with the wrong shape.
