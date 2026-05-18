---
title: 'Evidence Map Implementation Gaps'
description: 'Apr 6–7 2026 audit — 7 half-delivered features found. All resolved or intentionally deferred.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_evidence_map_gaps.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Comprehensive audit of Evidence Map (Apr 6–7 2026) found 7 features that were partially implemented. All addressed.

**Why:** The Evidence Map spine (ADR-066) was built in 5 phases. Infrastructure was added (hook return values, prop interfaces) but some visual/interaction wiring was never completed.

**How to apply:** Reference this when working on Evidence Map features. The deferred items are tracked below.

## Fixed (Apr 6 2026) — Batch 1

| # | What | Fix |
|---|------|-----|
| 1 | `exploredFactors: Set<string>` unused | Baked `explored?: boolean` into `FactorNodeData`, grey+0.4 opacity |
| 2 | `CausalEdgeData.fromLevel`/`toLevel` unused | Level subtitle text element on causal edges |
| 3 | `evidenceMapTopology` — CoScout lacks factor types | Extended `variationContributions` with factorType/relationship/optimum |
| 5 | `onConvergenceClick` disconnected | Wired `onConvergenceClick={handleFactorClick}` |
| 6+7 | `onViewDetails` dead + i18n missing | Removed dead callback, added i18n keys |

## Fixed (Apr 7 2026) — Batch 2

| # | What | Fix |
|---|------|-----|
| A | EdgeMiniChart not wired inside EdgeDetailCard | `filteredData` prop threaded from InvestigationWorkspace → InvestigationMapView. EdgeMiniChart rendered as `children` of EdgeDetailCard (scatter for continuous×continuous, boxplot otherwise) |
| B | Edge CoScout context plain string | `handleEdgeAskCoScout` now builds enriched context: `"FactorA × FactorB (Interact, R²adj=0.72)"` using `mapRelationshipType` |
| C | Mobile edge sheet missing actions | `onAskCoScout` wired on `EvidenceMapEdgeSheet` in MobileChartCarousel via adapter closure. Promote intentionally omitted (desktop-only) |
| D | Timeline replay not wired to Report | `computeBestSubsets`/`mainEffects`/`interactions` computed locally in ReportView. `useEvidenceMapTimeline` + `ReportEvidenceMap` wired into evidence-trail section |

## Also Fixed (Apr 7 2026) — Pre-existing Build Errors

| What | Fix |
|------|-----|
| `@variscout/stores` symlink missing from `packages/ui/node_modules` | `pnpm install` created the symlink |
| `PIPanelBase.onTabChange` type `(string) => void` vs narrower union | Made `PIPanelBaseProps<T extends string = string>` generic — `activeTab` and `onTabChange` share `T` |
| PWA `ProcessIntelligencePanel` stale props | Removed 7 dead props (isDrilling, complement, centeringOpportunity, activeProjection, sampleCount, overflowView, onOverflowViewChange) from interface, destructuring, and call site |

## Intentionally Deferred

| # | What | Rationale |
|---|------|-----------|
| 4 | `distance`, `angle`, `slopeCoefficient` in layout | Internal layout intermediates |
| E | evidenceMapTopology full threading | Already handled via variationContributions extension (5/8 fields redundant) |
| F | Node click → PI tab switch in Investigation | Already correct — panelsStore.setHighlightedFactor handles per-view |
| G | Double-click node → FocusedChartCard overlay | New feature, not wiring. Spec allows "View chart" button alternative. Deferred to future iteration |
| H | Mode-specific metric labels (Cpk/waste%) | Explicit TODO in useEvidenceMapData.ts:95-103 |
