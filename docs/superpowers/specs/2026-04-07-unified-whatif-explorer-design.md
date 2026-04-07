---
title: Unified What-If Explorer
status: delivered
date: 2026-04-07
related:
  [
    adr-067,
    adr-047,
    investigation-spine-design,
    improvement-hub-design,
    continuous-regression-design,
  ]
---

# Unified What-If Explorer

A single `WhatIfExplorer` component that replaces the three scattered what-if simulation components (`WhatIfSimulator`, `PredictionProfiler`, `LeanWhatIfSimulator`) with a unified, mode-aware explorer backed by scoped regression models.

## Problem

The existing what-if components were built independently:

- `WhatIfSimulator` — factor slider simulation for standard analysis
- `PredictionProfiler` — model-informed prediction from OLS regression
- `LeanWhatIfSimulator` — activity time reduction for Yamazumi mode

Each had its own state, props interface, and data pipeline. Adding the OLS regression engine (ADR-067) created a fourth conceptual mode. Maintenance overhead and inconsistent UX were the primary drivers for unification.

## Solution

A single `WhatIfExplorer` component with four renderer modes:

| Mode      | Renderer                 | When Active                                  |
| --------- | ------------------------ | -------------------------------------------- |
| `basic`   | `BasicEstimator`         | No regression model available                |
| `model`   | `ModelInformedEstimator` | OLS model present, standard/performance mode |
| `lean`    | `ActivityReducer`        | Yamazumi mode                                |
| `channel` | `ChannelAdjuster`        | Performance mode, multi-channel              |

The component auto-selects the renderer based on props. No manual mode switching required.

## Architecture

### Phase 1 — Types and Hooks

New hooks in `@variscout/hooks`:

- `useScopedModels` — derives the best regression model scoped to the current SuspectedCause hub
- `useWhatIfReferences` — builds spec limits, target values, and baseline stats for the explorer

New types in `@variscout/core/ui-types`:

- `WhatIfExplorerProps` — unified props interface
- `WhatIfScope` — `'hub' | 'global'` — controls which model is used
- `WhatIfRendererMode` — the four modes above

### Phase 2 — Component

`WhatIfExplorer` in `packages/ui/src/components/WhatIfExplorer/`:

- `WhatIfExplorer.tsx` — main component, renderer selection logic
- `BasicEstimator.tsx` — factor slider simulation (replaces WhatIfSimulator core)
- `ModelInformedEstimator.tsx` — OLS-backed prediction profiler
- `ActivityReducer.tsx` — lean time reduction (replaces LeanWhatIfSimulator)
- `ChannelAdjuster.tsx` — multi-channel Cpk adjustment
- `types.ts` — renderer-specific prop interfaces
- `index.ts` — barrel export

## PI Panel Integration

The PI Panel What-If tab now uses `WhatIfExplorer` in both apps:

- `apps/azure/src/features/investigation/` — Azure PI panel wiring
- `apps/pwa/src/components/Dashboard.tsx` — PWA PI panel wiring

The old `WhatIfSimulator` tab component has been replaced. Both apps pass regression model context via `useScopedModels` / `useWhatIfReferences`.

## Delivery Notes

- **Phase 1 (types + hooks)** — complete. `useScopedModels`, `useWhatIfReferences`, and `WhatIfExplorerProps` types delivered.
- **Phase 2 (component)** — complete. All four renderers delivered with tests.
- **PI panel What-If replaced** — both Azure and PWA apps now use `WhatIfExplorer`.
- **`WhatIfPageBase` (improvement workflow full page) replaced** — `WhatIfExplorerPage` is now used in the improvement hub workflow. `WhatIfPageBase` has been deleted.
- **Model/scopes wired** — the `scope` toggle and model selection are active in both Azure and PWA editors.
- **CoScout interaction context confirmed wired** — `whatIfExplorerState` is included in the AI context via the existing `useAIOrchestration` wiring.

## Migration Path

| Old Component                            | Replacement                         | Status  |
| ---------------------------------------- | ----------------------------------- | ------- |
| `WhatIfSimulator`                        | `WhatIfExplorer` (basic/model mode) | Deleted |
| `PredictionProfiler`                     | `WhatIfExplorer` (model mode)       | Deleted |
| `LeanWhatIfSimulator`                    | `WhatIfExplorer` (lean mode)        | Deleted |
| `WhatIfPageBase` (improvement full page) | `WhatIfExplorerPage` wrapper        | Deleted |

Main component files have been deleted. The `packages/ui/src/components/WhatIfSimulator/` directory now contains only helper sub-components (`DistributionPreview`, `LeanDistributionPreview`, `OverallImpactSummary`) which are still used by `WhatIfExplorer`.
