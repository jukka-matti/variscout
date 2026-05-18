---
title: 'Phase 4 W1'' engine layer'
description: 'Production-line-glance engine layer — types + lookupSpecRule + sampleConfidenceFor + calculateNodeCapability. See PR'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 300344a6edbbff34
origin-session-id: ce1c7399-5523-4447-b096-37f8fa8894ef
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_phase_4_engine.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Phase 4 chose **foundation hygiene before more horizon work** (over executing H2 line 2 directly) because the highest-priority drift (Cp/Cpk aggregation safety) is structurally upstream of the H2 capability cards.

**Why:** Devil's-advocate critique flagged five drift items where verbal spec commitments weren't engineered. Closing them gives H2/H3 a foundation that can actually stand on, and aligns governance docs with the Process Learning System pivot before more code locks in old framing.

**How to apply:** Phase 4 still has W2-W7 outstanding. When asked "what's the state of Phase 4" — engine is shipped (PR #103), charts/UI/cross-hub plans (B/C/D) and W4-W7 are all separate future PRs.

## What landed (PR #103, branch `feat/production-line-glance-engine`, 14 commits)

12 plan tasks + 2 follow-up commits:

- Tasks 1-7: Types — `SpecRule`, `SpecLookupContext`, `ProcessMapNode.capabilityScope.specRules`, `ProcessMapTributary.contextColumns`, `ProcessHub.canonicalProcessMap` + `canonicalMapVersion` + `contextColumns`, `InvestigationNodeMapping`, `ProcessHubInvestigationMetadata.canonicalMapVersion` + `nodeMappings`, `SampleConfidence` + `sampleConfidenceFor`
- Tasks 8-9: Engine — `calculateNodeCapability(nodeId, source)` with `kind: 'column' | 'children'`
- Task 10: Migration helpers — `isLegacyInvestigation`, `suggestNodeMappings`
- Task 11: Architectural guard — `architecture.noCrossInvestigationAggregation.test.ts` (fs walk, no shell, 16 forbidden names)
- Task 12: Sub-path exports from `@variscout/core/stats`
- Fixup `c9f004fb`: dropped redundant `finiteOrUndefined(safeDivide(...))` wrapper; added missing `HubReviewSignal` required fields to children-test mock
- Review-response `16ca1e1f`: heterogeneous-specs aggregation fixed (see `feedback_aggregation_heterogeneous_specs.md`); hub-level `contextColumns` threaded through `column` source; forbidden-names list broadened

## Verification

- 153 files / 2903 tests pass in @variscout/core (+30 from baseline)
- Workspace `pnpm test` all 9 turbo tasks green
- Build clean across 5 packages
- `bash scripts/pr-ready-check.sh` green
- `tsc --noEmit -p packages/core/tsconfig.json` clean
- Independent code review (`feature-dev:code-reviewer`): 2 blocking + 1 should-fix + 1 broaden-list — all addressed in commit `16ca1e1f`

## What's next (each its own future plan/PR)

- **Plan B**: chart components (per-step Cpk boxplot, Δ-trend i-chart, per-step Pareto, 2×2 dashboard composition)
- **Plan C**: UI surface wiring (LayeredProcessView Operations band, Process Hub view, FRAME workspace)
- **Plan D**: cross-hub context-filtered view at Org Hub-of-Hubs
- **W4**: `mode` vs `instrument set` terminology drift
- **W5**: Governance docs update to Process Learning System framing (CLAUDE.md, OVERVIEW.md, llms.txt, methodology.md, drop "Makigami" branding)
- **W6**: ADR amendments for 060, 068, 070, 064
- **W7**: Observed-vs-expected methodology unity paragraph + CoScout coaching prompt reference

## References

- PR: https://github.com/jukka-matti/variscout/pull/103
- Spec: `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`
- Plan: `docs/superpowers/plans/2026-04-28-production-line-glance-engine.md`
- Phase 4 plan file: `~/.claude/plans/we-just-implemented-phase-delightful-adleman.md`
