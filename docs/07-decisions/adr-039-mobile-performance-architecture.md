---
title: 'ADR-039: Mobile Performance & Async Computation Architecture'
---

# ADR-039: Mobile Performance & Async Computation Architecture

**Status**: Accepted

**Date**: 2026-03-21

## Context

VariScout's all-in-browser architecture means the browser is the computation server. On mobile, two problems emerge:

1. I-Chart renders one SVG element per data point. 50K rows = 50K+ DOM nodes, freezing mobile browsers. The industry threshold for smooth interactive SVG is ~1,000-2,000 elements.
2. Stats computation (calculateStats, calculateANOVA, calculateKDE) runs synchronously on the main thread. 50K rows takes <500ms on desktop but 1-2s on mid-tier mobile, freezing all UI interaction.

Desktop multi-window workflows (editor + findings popout + improvement workspace) also benefit from non-blocking computation, and rapid filter clicks currently queue sequential computations when only the final result matters.

## Decision

### 1. LTTB Point Decimation for I-Chart Display

Implement Largest-Triangle-Three-Buckets downsampling. Stats computed from full dataset; rendering uses decimated data. Violation points (UCL/LCL breaches) force-included — never hidden.

### 2. Web Worker for Stats via Comlink

Move statistical computation to a dedicated Web Worker. Singleton lifecycle, structured clone transfer, generation counter cancellation. Stale-while-revalidate UI — charts always show last-known stats.

### 3. React.memo on Chart Base Components

Wrap IChartBase, BoxplotBase, ParetoBase, YamazumiChartBase in React.memo() with custom shallow comparators.

### 4. Mobile-Specific Row Limits

| Platform | Desktop         | Mobile (<640px) |
| -------- | --------------- | --------------- |
| PWA      | 50K (warn 5K)   | 10K (warn 2K)   |
| Azure    | 100K (warn 10K) | 25K (warn 5K)   |

Mobile detection in app-level wrappers via useIsMobile(640), passed as limits parameter to shared useDataIngestion hook.

## Consequences

- Stats consumers must handle async results (stats may be null while computing)
- Charts show stale-while-revalidate overlay during recomputation
- AI context builder already handles null stats — minimal change needed
- Comlink added as dependency (~1.4 KB gzipped)
- Mobile users get lower row limits with clear messaging
