---
title: 'Phase 2 V2 closure plan (Layered Process View follow-on)'
description: 'V2 reframed to H1 capability completion. Defer LayeredProcessView snapshot mode to H3; redirect PR'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: efb5d588-ee52-4005-996f-a8f1d0dca016
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_phase_2_v2_closure.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

After Phase 1 (V1) of the Layered Process View shipped (PR #95, commit `d2b26b79` on 2026-04-26), Phase 2 V2 was scoped during the 2026-04-27 brainstorming session. Final closure shape:

**Shipped 2026-04-27:**
- PR #96 (commit `9455e7db`): canonicalized `createEmptyMap` in `@variscout/core/frame`. Pure refactor.
- PR #97 (commit `e9674997`): moved `ProcessHubCurrentStatePanel` from `apps/azure/src/components/` to `packages/ui/src/components/ProcessHubCurrentStatePanel/`. Pure code-share. PWA does NOT get the panel — Process Hub is Azure-only by ADR-072 (multi-investigation aggregation requires persistence; PWA is session-only by ADR-012). Stale `feature/hub-review-signals` branch deleted (work was already on main via direct-to-main commit `1d05619e`).

**Deferred to a later horizon (H3):**
- PR #3 as originally planned (snapshot mode in LayeredProcessView reading hub-wide CurrentProcessState). Three structural blockers: (a) `CurrentProcessState.items[]` has no per-tributary keys, (b) `buildCurrentProcessState` is built on Dashboard not Editor, (c) `ProcessMap` is investigation-scoped not hub-scoped. The hub-canonical-map design is explicitly H3 in the Product Method Roadmap (line 226: "Level-aware Process Hub map: outcome, flow, local mechanism, evidence/trust"). Premature in V2.

**To-do for V2 closure (H1-aligned):**
- PR #4 (rehomed): make state items in `ProcessHubCurrentStatePanel` clickable affordances routing to their `responsePath` (all 7 paths wired; missing-surface fallbacks documented). Aligns with H1 capabilities #1 + #2.
- PR #5 (rehomed): add evidence-count badges + popover to state items in the panel (process-scoped findings ≥ analyzed, plus Phase-6 sustainment/handoff records as relevant). Aligns with H1 capability #3.

**Shipped 2026-04-27 (V2 closure complete):**
- PR #98 (commit `85f844a2`): PR #4 — `ProcessHubCurrentStatePanel` actions. `ResponsePathAction` discriminated union + `deriveResponsePathAction` in core, `actionToHref` in azure/lib, panel takes 3 required props (state/actions/evidence — no back-compat optionality), Dashboard wires telemetry + navigation. 9 commits, +714/-15 LOC.
- PR #99 (commit `caba84ee`): PR #5 — evidence chip. `linkFindingsToStateItems` pure aggregator in core, `EvidenceChip` subcomponent, `ProcessHubReviewPanel` derives chip count from `ProcessHubInvestigationMetadata.findingCounts`, click navigates to most-recent linked investigation with App Insights telemetry. 5 commits, +442/-8 LOC.

**Pragmatic divergences from spec (documented in plan + commit messages):**
1. `linkFindingsToStateItems` accepts `findingsByInvestigationId: ReadonlyMap` (caller pre-groups) instead of flat `Finding[]` — `Finding` type has no `investigationId` field.
2. Chip count uses `findingCounts` metadata (cheap; already on rollup); chip click navigates to investigation. Full `EvidenceSheet` with finding labels deferred to a follow-up PR (needs Dashboard-side findings load).
3. Editor doesn't yet honor `?intent=` and `?surface=` query params from `actionToHref` URLs — Dashboard navigates via existing `onOpenProject(investigationId)`. URL construction is logged via telemetry but not yet routed. Follow-up.

**Future PRs flagged in plan §"Future PRs":**
- PR #6: full `EvidenceSheet` rendering (requires Dashboard findings load).
- PR #7: Editor honors `?intent=` and `?surface=` query params.
- PR #8: MSA editor surface (currently renders 'Planned' pill — H2 horizon).
- Control-handoff concept revisit (own brainstorming session).

**Why:** The Product Method Roadmap's H1 promise is "process owner opens hub → knows what needs attention → routes to response path." `ProcessHubCurrentStatePanel` already shipped the "what needs attention" surface; PR #4 + PR #5 complete the loop. LayeredProcessView's three-band shell is the wrong abstraction for the Dashboard surface — it belongs to the Editor's FRAME workspace. When H3 arrives, design a hub-canonical ProcessMap properly (level-aware, with V3 schema additions and variant/optional-step support per Yamazumi nuance the user raised).

**How to apply:**
- Before resuming Phase 2 work, the V2-closure design spec (PR #4 + PR #5) should be written via the brainstorming → writing-plans flow.
- The hub-canonical-map design becomes an H3 work item, deserving its own brainstorming session, ADR, and implementation plan when the team reaches that horizon.
- Watch for scope drift back into LayeredProcessView snapshot mode in V2; redirect to the panel-based H1 alternative.
