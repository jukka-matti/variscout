---
title: 'Evidence Map as Analysis Spine'
description: 'Evidence Map grows through FRAME→SCOUT→INVESTIGATE→IMPROVE→REPORT as the persistent visual narrative. Investigation workspace redesigned with Map center + PI Panel left.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_evidence_map_spine.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Evidence Map transformed from pop-out-only to the analysis spine (Apr 5 2026).

**Why:** Transcripts from expert voice memos revealed that factor relationships, the regression equation, and the investigation narrative need a persistent visual thread. Evidence Map and Factor Intelligence show the same data in different forms (spatial vs tabular) — they should be deeply linked.

**How to apply:** The Evidence Map is now the default center view in the Investigation workspace. PI Panel (left) and CoScout (right) surround it. Factor node click → PI panel scrolls to related questions. **Note (Apr 6 audit):** `exploredFactors` hook data is computed but never wired to node rendering — nodes don't yet show grey/colored exploration state. See `project_evidence_map_gaps.md` for full gap list.

## What was built (13 commits, +1505 lines, 26 files)

### Phase 0: Quick Wins
- `exploredFactors: Set<string>` in `useEvidenceMapData` — tracks answered/ruled-out factors
- `evidenceMapTopology` in `buildAIContext` — CoScout sees graph structure, relationships, convergence points
- `highlightedFactor` + `investigationViewMode` in panelsStore — bidirectional PI ↔ Map linking

### Phase 1: Factor Preview
- `FactorPreviewOverlay` component — embryonic Evidence Map at FRAME→SCOUT transition
- Wired in `EditorDashboardView` with dismiss persistence

### Phase 2: Investigation Workspace Redesign
- `InvestigationMapView` — Evidence Map center with ResizeObserver
- `InvestigationWorkspace` restructured: "Evidence Map" / "Findings" toggle, Map is default
- PI panel scroll-to via `data-factor` attributes + `highlightedFactor` state

### Phase 3: Direct Interactions
- `NodeContextMenu` — right-click: ask question, create finding, ask CoScout, drill down
- `CausalLinkCreator` — modal for why-statement + direction + evidence type

### Phase 4: Report + Docs
- `ReportEvidenceMap` — timeline playback controls (play/pause/seek) wrapping map
- All docs updated (spec, mental-model-hierarchy, CLAUDE.md)

### Code Review Fixes
- Keyboard/ARIA for NodeContextMenu (role="menu", Escape, auto-focus)
- Focus trap for FactorPreviewOverlay
- Viewport overflow bounds checking
- CausalLinkCreator form disabled on cycle warning
- mainEffects/interactions wired to InvestigationMapView (was null)

## Key files
- `apps/azure/src/components/editor/InvestigationMapView.tsx`
- `apps/azure/src/components/editor/InvestigationWorkspace.tsx`
- `packages/ui/src/components/FactorPreviewOverlay/`
- `packages/ui/src/components/EvidenceMapContextMenu/`
- `packages/ui/src/components/CausalLinkCreator/`
- `packages/ui/src/components/ReportEvidenceMap/`

## Source transcripts
Ideas extracted from `docs/10-development/transcripts/` (5 files cataloged from expert voice memos + MBB validation interview).
