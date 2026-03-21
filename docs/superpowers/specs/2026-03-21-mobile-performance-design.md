---
title: 'Mobile Performance & Async Computation Architecture'
---

# Mobile Performance & Async Computation Architecture

**Date**: 2026-03-21
**Status**: Design approved, pending implementation
**ADR**: ADR-039

## Problem

VariScout's "all in-browser" architecture means the browser IS the server. On desktop, browser limits are generous. On mobile, two critical problems emerge:

1. **I-Chart SVG explosion**: `IChart.tsx` renders one SVG element per data point. 50K rows = 50K+ SVG DOM nodes, freezing mobile browsers. Industry threshold: ~1,000-2,000 interactive SVG elements on mobile.
2. **Synchronous stats blocking**: `calculateStats`, `calculateANOVA`, `calculateKDE` all run on the main thread. 50K rows takes <500ms desktop, 1-2s on mid-tier mobile — completely freezing UI during every filter change.

Additionally:

- Desktop multi-window workflows (editor + findings popout + improvement workspace) freeze during computation
- Rapid filter clicking queues 3 sequential computations when only the final result matters

## Personas & Device Context

| Persona              | Device                | Dataset Size    | Current Experience                           |
| -------------------- | --------------------- | --------------- | -------------------------------------------- |
| Student Sara         | Any phone             | <1K rows        | Good — works fine                            |
| Curious Carlos       | Phone (social media)  | Demo data       | Good — samples are small                     |
| Green Belt Gary      | Flagship phone        | 10-50K rows     | Broken — I-Chart freezes                     |
| Factory floor worker | Budget Android ($200) | 5-25K via Teams | Broken — both rendering and computation      |
| Desktop power user   | Desktop, 3 windows    | 50K rows        | UI freezes during stats, affects all windows |

## Decisions (4)

### Decision 1: LTTB Point Decimation for I-Chart

Implement Largest-Triangle-Three-Buckets (LTTB) downsampling for I-Chart display. LTTB is an O(n) algorithm that reduces N data points to K visually representative points while preserving the visual shape — peaks, dips, trends look identical to the human eye. Standard solution used by Grafana, Observable Plot, and Vega-Lite.

- Stats are computed from full dataset (decimation is display-only)
- Violation points (UCL/LCL breaches) are force-included — never hidden by decimation
- Threshold: decimate when `data.length > chartWidth * 2` (typically >600 on mobile, >2400 on desktop)
- Below threshold: render all points (no change to current behavior)

### Decision 2: Web Worker for Stats via Comlink

Move statistical computation to a dedicated Web Worker using Comlink (1.4 KB gzipped, typed async API).

**Architecture**:

- Singleton Worker created at app startup, reused for all computations
- Existing pure functions in `@variscout/core/stats` imported by Worker (no code duplication)
- Worker produces both full stats AND decimated I-Chart data in one pass
- Data transferred via structured clone (~1-3ms for 50K rows — negligible)

**Cancellation**: Generation counter pattern — each computation gets a monotonic ID. If a newer request arrives before the old completes, stale results are silently discarded. Makes rapid filter clicking snappy — only final state renders.

**UI pattern**: Stale-while-revalidate — charts always show last-known stats with a subtle opacity overlay during recomputation. No blank states, no Suspense.

**AI impact**: Minimal — `useAIContext` adds `if (!stats) return null` guard. AI consumes pre-computed stats, never raw data.

### Decision 3: React.memo on Chart Base Components

Wrap `IChartBase`, `BoxplotBase`, `ParetoBase`, `YamazumiChartBase` in `React.memo()` with custom shallow comparators. Prevents unnecessary SVG subtree re-renders when unrelated state changes (findings panel toggle, tooltip state in another chart, etc.).

### Decision 4: Mobile-Specific Row Limits

Lower data ingestion limits on mobile devices:

| Platform | Desktop            | Mobile           |
| -------- | ------------------ | ---------------- |
| PWA      | 50K (warn at 5K)   | 10K (warn at 2K) |
| Azure    | 100K (warn at 10K) | 25K (warn at 5K) |

The shared `useDataIngestion` hook already accepts a `limits` parameter. Mobile detection via `useIsMobile(640)` happens in the **app-level wrapper hooks** (`apps/pwa/src/hooks/useDataIngestion.ts` and `apps/azure/src/hooks/useDataIngestion.ts`), which pass mobile-aware limits to the shared hook. This preserves separation of concerns — the shared hook never imports UI detection logic. Same UX pattern (toast warning + hard rejection) with mobile-specific messaging.

## Technical Design

### LTTB Algorithm

**Location**: `packages/core/src/stats/lttb.ts`

```typescript
export function lttb<T extends { x: number; y: number; originalIndex: number }>(
  data: T[],
  threshold: number,
  forceInclude?: Set<number>
): T[];
```

- O(n) time, ~50 lines
- Preserves first and last points always
- Triangle area maximization for bucket selection
- `forceInclude` set guarantees violation points appear in output
- Returns sorted array of selected points

### Worker Architecture

```
@variscout/core/stats/           <- Pure computation (unchanged)
@variscout/core/stats/lttb.ts    <- New: LTTB algorithm
@variscout/core/workers/statsWorkerApi.ts  <- New: Comlink API wrapper
@variscout/core/workers/types.ts <- New: shared types

apps/pwa/src/workers/stats.worker.ts       <- Vite worker entry
apps/azure/src/workers/stats.worker.ts     <- Vite worker entry
packages/hooks/src/useAsyncStats.ts        <- Generation counter hook
```

### DataContext Changes

Add to state:

- `isComputing: boolean` — true while Worker is processing

The `useMemo` that currently calls stats synchronously in `useDataComputation.ts` is replaced with the `useAsyncStats` hook. The generation counter is a `useRef` that increments on each call and checks on result arrival.

### Stale-While-Revalidate UI

Chart wrappers add a subtle opacity overlay during recomputation. Charts always render with whatever stats they have. No unmounting, no blank state.

## Documentation Updates

These docs must stay in sync with code changes:

| Doc                                                           | Update                                            |
| ------------------------------------------------------------- | ------------------------------------------------- |
| `docs/05-technical/implementation/system-limits.md`           | Add mobile-specific row limits                    |
| `docs/07-decisions/index.md`                                  | Add ADR-039 entry                                 |
| `.claude/rules/charts.md`                                     | Add "Chart Performance" section                   |
| `.claude/rules/monorepo.md`                                   | Add `useAsyncStats` to hooks list                 |
| `.claude/rules/testing.md`                                    | Add LTTB and Worker test ownership                |
| `CLAUDE.md`                                                   | Add "Performance / Mobile" to task-to-doc mapping |
| `docs/superpowers/specs/index.md`                             | Add this spec entry                               |
| `docs/08-products/tier-philosophy.md`                         | Note mobile vs desktop row limits                 |
| `docs/08-products/feature-parity.md`                          | Add mobile limits footnote                        |
| `docs/01-vision/evaluations/tensions/mobile-screen-budget.md` | Add resolution note                               |

## Prerequisites

1. Create `feat/mobile-performance` from main
2. `pnpm add comlink`

## Verification

1. `pnpm test` — all ~3,000 tests pass
2. LTTB: shape preservation, violation inclusion, boundary cases
3. Worker: async flow, generation counter, stale result discarding
4. Visual (`pnpm dev`): smooth I-Chart, computing overlay, mobile limits
5. Multi-window: popout syncs, main UI responsive
6. AI: CoScout context populated after async stats
7. Build: `pnpm build` succeeds, worker chunk generated
