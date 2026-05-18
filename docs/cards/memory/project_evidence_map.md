---
title: 'Evidence Map Implementation'
description: 'Data relationship visualization — layered SVG, CausalLink entity, pop-out BroadcastChannel, CoScout tools, mobile pinch-zoom carousel, 2x code reviewed'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 41551e43d30feedd
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_evidence_map.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Evidence Map: spatial visualization of factor relationships and causal investigation. IMPLEMENTED Apr 5 2026. 9 commits, 2 code reviews (all findings resolved).

**Architecture:** Layered SVG (visx) with 3 composited `<g>` layers in `packages/charts/src/EvidenceMap/`:
- Layer 1 (Statistical): Factor nodes by R²adj, 5 relationship types, equation bar. PWA + Azure.
- Layer 2 (Investigation): CausalLink directed edges, evidence badges (D/G/E), gap markers. Azure only.
- Layer 3 (Synthesis): SuspectedCause hub convergence zones, projections, status. Azure only.

**Key files:**
- `packages/core/src/stats/causalGraph.ts` — 5 pure graph functions (classify, cycles, convergence, sort, paths). 30 tests.
- `packages/core/src/stats/evidenceMapLayout.ts` — deterministic radial layout. 10 tests.
- `packages/charts/src/EvidenceMap/` — 10 component files (EvidenceMapBase + 3 layers + FactorNode + edges)
- `packages/hooks/src/useEvidenceMapData.ts` — data flow hook (3 layers from stores + stats)
- `packages/hooks/src/usePopoutChannel.ts` — BroadcastChannel cross-window sync
- `packages/hooks/src/useEvidenceMapTimeline.ts` — report timeline animation
- `packages/ui/src/components/EvidenceMapSheet/` — mobile bottom sheets (node + edge tap)
- `apps/azure/src/pages/EvidenceMapWindow.tsx` — pop-out route
- `apps/pwa/src/components/EvidenceMapPopout.tsx` — PWA pop-out (L1 only)

**CausalLink entity:** First-class in investigationStore with 7 CRUD actions + cycle prevention (DFS). 17 store tests including cascade behavior. Persists via AnalysisState serialization.

**CoScout:** 2 action tools (`suggest_causal_link`, `highlight_map_pattern`), 3 RefTargetTypes. AI context includes evidenceMapTopology (factor nodes + relationships + convergence points), causalLinks, and suspectedCauses — wired via `useAIOrchestration.ts` reading from domain investigationStore. Lightweight topology built from η² contributions when full bestSubsets data unavailable.

**Mobile (<640px):** 5th carousel tab in MobileDashboard (PWA) and MobileChartCarousel (Azure). Pinch-zoom via @visx/zoom, 44px touch targets, progressive label disclosure (hidden until zoom >1.5x), tap → bottom sheet. Read-only (no link creation). Gated on bestSubsets R²adj > 0.05. Swipe disabled on map tab to prevent zoom/swipe conflict.

**Pop-out:** ?view=evidence-map route, BroadcastChannel sync, responsive via withParentSize.

**Key decisions:**
- R²adj (not η²) as first principle — best subsets comparison reveals 5 relationship types
- One living map growing through journey (SCOUT → INVESTIGATE → IMPROVE → REPORT)
- BroadcastChannel for cross-window sync (not localStorage)
- chartColors/chromeColors constants (no hardcoded hex)
- CausalLink canonical type in findings/types.ts only

**Wired to UI (Apr 5 2026):** Investigation workspace center (InvestigationMapView with Evidence Map/Findings toggle), FactorPreviewOverlay at FRAME→SCOUT, ReportEvidenceMap for timeline playback. **Fully interactive (Apr 5 2026):** Right-click → NodeContextMenu (5 actions: ask question, create finding, ask CoScout, drill down, create causal link). Two-step causal link creation (right-click from-node → click to-node → CausalLinkCreator modal). Causal edge click → inline detail card (edit/delete). SweetSpotCard for quadratic factors (∩/∪ trend glyph). highlightedFactor scrolls QuestionChecklist in Investigation workspace. All callbacks threaded from InvestigationWorkspace via InvestigationMapView props.

**Apr 6 audit:** 7 half-delivered features found — see `project_evidence_map_gaps.md`. 5 fixed in completeness spec.

**Apr 7 edge interactions:** Statistical edges now fully interactive — click→EdgeDetailCard (stats + type badge + 3 actions), right-click→EdgeContextMenu, promote-to-causal flow, mobile action buttons. See `project_evidence_map_edge_interactions.md` for details.

**How to apply:** Design specs at docs/superpowers/specs/2026-04-05-evidence-map-design.md (component architecture), docs/superpowers/specs/2026-04-05-evidence-map-spine-design.md (spine integration), docs/superpowers/specs/2026-04-07-evidence-map-edge-interactions-design.md (edge interactions).
