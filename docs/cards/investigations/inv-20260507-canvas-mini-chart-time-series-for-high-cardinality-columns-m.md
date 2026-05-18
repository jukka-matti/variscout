---
title: 'Canvas mini-chart: time-series for high-cardinality columns missing (vision §5.2)'
purpose: remember
tier: card
status: archived
date: 2026-05-07
topic: ['investigation', 'resolved']
surfaced-date: 2026-05-06
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-07 (resolved); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Canvas mini-chart: time-series for high-cardinality columns missing (vision §5.2)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06 (commits `2c010f29` / `36727ad0` / `2820afb1`).

**Description:** Vision §5.2 commits to **three mini-chart types per step card**: histogram for measurements, distribution for categoricals, and **time-series for high-cardinality columns**. `CanvasStepMiniChart` (`packages/ui/src/components/Canvas/internal/CanvasStepMiniChart.tsx`) implements only two — the time-series branch is absent. For process data ordered by run number / batch, the mini-time-series is methodologically meaningful (trend vs distributional shape).

**Possible directions:**

- Add a time-series branch with a cardinality threshold (e.g. `column.type === 'numeric' && distinct > 30`).
- Use the column-detection time column (per `parser/detection.ts`) when present; fall back to row-index ordering. Document the fallback explicitly.
- Algorithm: sparkline / mini-line; LTTB downsampling for >100 points (existing `@variscout/charts` convention).
- Bonus: replace the current "first-12-raw-values" pseudo-histogram with proper Sturges/Scott binning.

**Promotion path:** PR8b of the canvas migration sequence (Vision Alignment phase). Bundles into a small `CanvasStepMiniChart` extension PR.

**Resolution:** PR8-8b — `useCanvasStepCards` adds `numericRenderHint` (`'histogram' | 'time-series'`) based on `NUMERIC_TIME_SERIES_DISTINCT_THRESHOLD = 30`. New sparkline branch in `CanvasStepMiniChart`; LTTB-downsampled to at most 100 points via existing `@variscout/core/stats#lttb`; ordered by parser-detected `timeColumn` only when all metric rows parse, otherwise row-index fallback. Sturges/Scott histogram improvement deferred to its own follow-up entry below.
