---
title: 'Evidence Map Edge Interactions'
description: 'Statistical edge click→detail card with mini chart, right-click→context menu, promote-to-causal, mobile actions, enriched CoScout context. Delivered Apr 7 2026.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_evidence_map_edge_interactions.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Evidence Map Edge Interactions: making statistical relationship edges interactive — the bridge from "data says these correlate" (Layer 1) to "I believe this drives that" (Layer 2). Delivered Apr 7 2026.

**Why:** Edge interactions are the most important investigation moment — where correlation becomes hypothesis. Previously edges were passive.

**3 user-facing relationship types** (mapped from 5 engine types via `mapRelationshipType` in `@variscout/core/stats`):
- Interact (interactive + synergistic) — "Optimize together" (purple)
- Overlap (overlapping) — "Shared variation — investigate what connects them" (amber)
- Independent (independent + redundant) — "Optimize separately" (grey)

**Components:**
- `EdgeDetailCard` (`packages/ui/src/components/EvidenceMap/`) — floating card: header with type badge, R²adj stats, guidance, **EdgeMiniChart** (scatter or boxplot), 3 action buttons
- `EdgeContextMenu` (`packages/ui/src/components/EvidenceMapContextMenu/`) — right-click: Ask question, Ask CoScout, Promote to causal link
- `EdgeMiniChart` (`packages/ui/src/components/EvidenceMap/`) — adaptive 150px chart (boxplot for categorical pairs, scatter for continuous)
- `mapRelationshipType` (`packages/core/src/stats/relationshipTypeMapping.ts`) — 5→3 type mapping with labels + guidance

**Data flow for EdgeMiniChart:** `filteredData` threaded from `useFilteredData()` in InvestigationWorkspace → `filteredData` prop on InvestigationMapView → `children` slot of EdgeDetailCard. Factor types from `mapOptions.bestSubsets.factorTypes`.

**CoScout context:** `handleEdgeAskCoScout` builds enriched string: `"FactorA × FactorB (Interact, R²adj=0.72)"` using `mapRelationshipType(edge.type, true)`.

**Mobile:** `EvidenceMapEdgeSheet` has `onAskCoScout` wired via adapter closure in MobileChartCarousel. `onPromoteToCausal` intentionally omitted — CausalLinkCreator is desktop-only.

**Known limitations:**
- Arrow key navigation between menu items — pre-existing gap shared with NodeContextMenu
- Mobile CoScout context is plain `"FactorA × FactorB"` (not enriched like desktop) — the adapter bridges different callback signatures

**Two-spec approach:** Spec A (UI interactions, delivered Apr 7). Spec B (OLS interaction terms for all factor types, delivered Apr 7) — see `project_continuous_regression.md` for the two-pass best subsets with interaction screening.

**How to apply:** UI spec at `docs/superpowers/specs/2026-04-07-evidence-map-edge-interactions-design.md`. Interaction engine spec at `docs/superpowers/specs/2026-04-07-interaction-effects-design.md`.
