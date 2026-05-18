---
title: 'Unified What-If Explorer'
description: 'WhatIfExplorer replaces 3 separate tools (WhatIfSimulator, PredictionProfiler, LeanWhatIfSimulator) with mode-aware rendering'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 3254db05c4838ebc
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_unified_whatif.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Unified What-If Explorer delivered Apr 7, 2026. Old components (WhatIfSimulator, PredictionProfiler, LeanWhatIfSimulator, WhatIfPageBase) fully deleted.

**Why:** Three separate what-if tools served the same purpose with different UIs. PredictionProfiler was never mounted. With OLS engine (ADR-067), factor-level prediction is possible but the fundamental insight is: "model informs, analyst estimates" — improvement ideas target root causes, not factor levels directly.

**How to apply:**
- `WhatIfExplorer` in `@variscout/ui` with 4 internal renderers dispatched by mode + model availability
- `WhatIfExplorerPage` wraps with page chrome for improvement workflow (header, back button, context banners, stats computation)
- ModelInformedEstimator: shows factor gap context, "how much will this close?" slider, reference markers (current/best/model optimum)
- BasicEstimator: mean/sigma sliders (fallback when no model)
- ActivityReducer: yamazumi mode
- ChannelAdjuster: performance mode
- All output `FindingProjection` (with optional `modelContext`) — same matrix positioning regardless of mode
- Model scoping: `useScopedModels` hook auto-recomputes on filter change, enables interaction discovery through scope comparison
- Reference markers: `useWhatIfReferences` hook computes current, best performer, model optimum, percentile benchmarks
- `computePresets` extracted to `WhatIfExplorer/computePresets.ts` (smart presets from specs + category data)
- Helper sub-components remain: `DistributionPreview`, `OverallImpactSummary` in WhatIfSimulator/
- Design spec: `docs/superpowers/specs/2026-04-07-unified-whatif-explorer-design.md`
- 134 new tests added, total monorepo: ~5,710
