---
title: 'findings-hypotheses-implementation-reality'
description: 'Findings + Hypotheses are richly built out in code TODAY (full type system + UI surfaces + persistence) — correction of past framing that called them aspirational F1/G1/H1 territory'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, project]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: e98b0be32a392f50
origin-session-id: 99006d69-683b-44e8-a807-7a81fd9d2a53
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_findings_hypotheses_implementation_reality.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Findings + Hypotheses are NOT aspirational future work — they exist as fully-built primitives in the codebase as of 2026-05-28. Past planning sessions (including the start of E1 brainstorming on 2026-05-28) incorrectly framed them as "F1/G1/H1 territory" / things still to be built. That framing is wrong and should be corrected on sight.

## What exists today

**Findings (`packages/core/src/findings/`):**
- `Finding extends EntityBase` with full lifecycle
- `FindingStatus = 'observed' | 'investigating' | 'analyzed' | 'improving' | 'resolved'`
- `FindingSource`, `FindingComment`, `FindingOutcome`, `FindingAssignee`
- `FindingContribution` (referenced in `packages/core/src/variation/progress.ts:15`)
- Factories in `packages/core/src/findings/factories.ts`
- Source-column hints (`FindingSourceColumnHints` in `hypothesisCondition.ts:44`)

**Hypotheses (same `findings/` directory):**
- `Hypothesis extends EntityBase`
- `HypothesisStatus`, `HypothesisEvidence`, `HypothesisCondition` (leaf/branch tree)
- `HypothesisAction` (`packages/core/src/actions/hypothesisActions.ts:4`)
- `HypothesisReadAPI` persistence boundary (`packages/core/src/persistence/HubRepository.ts:53`)

**IP type already references both:**
- `ImprovementProject.sections.investigationLineage.{findingIds, hypothesisIds}` at `packages/core/src/improvementProject/types.ts:79-80`

**ProcessHub already has the collection:**
- `processHub.ts:450, 1054` — `findings: { ... }` top-level field

**UI surfaces shipped:**
- `packages/ui/src/components/FindingsPanel/`
- `packages/ui/src/components/FindingsWindow/`
- `packages/ui/src/components/FindingsLog/`

## Why this matters

When planning Canvas Connection Journey E1, the original spec §4.4.1 prescribed a 5-entry-point Charter ceremony with an `InheritedContextBlock` that would bundle Findings/Hypotheses inherited from the user's current state into the new Improvement Project. The user pushed back with a cleaner mental model: "the project saves all the hypothesis and findings etc automatically" — meaning Findings/Hypotheses created while inside the active IP auto-scope to it by virtue of context, with no Charter-time "inheritance" ceremony needed.

That insight only makes sense BECAUSE the primitives already exist. If Findings were unimplemented, the whole §4.4.1 inheritance question would have to wait. Because they ARE implemented, the deferred design question is consistency-of-presentation across verb tabs (Task #44), not capability.

**Why:** Treating already-built primitives as aspirational leads to over-scoped plans (build-it-then-inherit-it) and missed simplification opportunities (recognize-it-exists-and-amend).

**How to apply:** Before claiming any primitive is "F1/G1/H1 territory" or "not built yet" in planning prose, grep `packages/core/src/` for the type name. Especially relevant when designing Charter / Promote / Investigate / Analyze flows — Findings + Hypotheses are foundational substrate to most of these.

## Related

- Discovered during E1 brainstorming on 2026-05-28 (this session's grep audit)
- Companion to [[canvas-connection-journey]] § "E1 lightweight scope" amendment
- Task #44 — Design session: cross-tab presentation of IP-scoped entities (the deferred half of spec §4.4.1, only meaningful BECAUSE these primitives exist)
- [[feedback_subagent_grounding_catches_drift]] — subagent grounding-against-source-code is what surfaced this; future planning should do the same
