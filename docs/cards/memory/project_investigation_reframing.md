---
title: 'Investigation Workspace Reframing (Apr 3 2026)'
description: 'IMPLEMENTED — PS forms early, Diamond finds WHY, SuspectedCause hub entity, unified projection model, mode-aware evidence, lean projection engine'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_investigation_reframing.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Systematic evaluation + brainstorming + implementation (Apr 3 2026). 26 commits merged to main. 70 files changed, +3,472 lines.

**Specs:** `docs/superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md` + `2026-04-03-suspected-cause-evidence-model-design.md`

## Insight 1: Problem Statement Forms Early — IMPLEMENTED

Watson's 3 questions: Q1 (measure) + Q2 (direction) deterministic from FRAME, Q3 (scope) from first significant factor at SCOUT Loop 1.

- `buildProblemStatement()` derives direction from `characteristicType` (nominal→reduce variation, smaller→decrease, larger→increase)
- `useProblemStatement` returns `q1Ready`, `q2Ready`, `hasScope` (renamed from q3Ready), `isFormable`, `liveStatement`, `canGenerateDraft`
- `LocationFactor` interface for Q3 scope
- Wired in Azure app via `InvestigationWorkspace.tsx`

## Insight 2: Investigation Diamond = Finding the WHY — DOCUMENTED

Diamond discovers suspected causes (WHY), not the Problem Statement (already exists). Two speeds: PI panel for quick check, Investigation workspace for deep dive. Suspected cause hub creation exclusive to Investigation workspace.

## Insight 3: SuspectedCause Hub Entity — IMPLEMENTED

`SuspectedCause` is a first-class entity in `@variscout/core/findings/types.ts`:
- `name`, `synthesis`, `questionIds[]`, `findingIds[]`, `evidence?: SuspectedCauseEvidence`, `selectedForImprovement?`, `status`
- `Question.causeRole` deprecated (retained for migration)
- `useSuspectedCauses` hook: full CRUD + `resetHubs` + `getHubForQuestion/Finding`
- Both app stores + orchestration wired with one-time migration from legacy causeRole
- Serialization with backward-compatible deserialization

## Unified Projection Model — IMPLEMENTED (types + engines)

`ProjectionScenario` with `ProjectionSource` (drill/suspected-cause/centering/idea/measured) + `ProjectionMethod` (match-best/target/eliminate-waste/direct/actual) + `ProjectionResult` (statistical + lean domains).

- `findBestSubgroup()` extracted from WhatIfPageBase to `@variscout/core/variation/bestSubgroup.ts`
- `computeHubEvidence()` uses Best Subsets R²adj (mode-dispatched, deduplicates factors)
- Mode-dispatch pattern: `evidenceComputers: Record<mode, fn>` following `analysisStrategy.ts`

## Lean Projection Engine — IMPLEMENTED

`projectWasteElimination()` + `projectVAImprovement()` in `@variscout/core/yamazumi/projection.ts`. Lean domain parallel to statistical `simulateDirectAdjustment`.

## Key Files

- Types: `packages/core/src/findings/types.ts` (SuspectedCause, ProjectionScenario, SuspectedCauseEvidence)
- Hook: `packages/hooks/src/useSuspectedCauses.ts`
- Evidence: `packages/core/src/findings/helpers.ts` (computeHubEvidence, mode-dispatched)
- Best subgroup: `packages/core/src/variation/bestSubgroup.ts`
- Lean projection: `packages/core/src/yamazumi/projection.ts`
- Problem Statement: `packages/hooks/src/useProblemStatement.ts` (hasScope, liveStatement)

## Not Yet Implemented

- UI component changes for hub creation UX (pull-together gesture, hub card)
- `useProcessProjection` refactor to unified ProjectionScenario pipeline
- CoScout hub-aware coaching prompts
- Tech debt: 5 remaining mode-dispatch consolidation targets (documented in `docs/10-development/feature-backlog.md`)
