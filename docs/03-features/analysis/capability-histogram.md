---
title: 'Capability Histogram'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: ui
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# Capability Histogram

## Problem

Practitioners need to see the shape of a process distribution against its spec limits at a glance — to judge whether tails breach LSL/USL, whether the mean is off-target, and whether the data looks unimodal before relying on Cp/Cpk numbers.

## Capability claim

`CapabilityHistogramBase` in `packages/charts/src/CapabilityHistogram.tsx` renders 15 d3-`bin` histogram bars over a visx scale, overlays LSL/USL/target spec lines (extending the x-domain to keep limits visible when outside the data range) and a mean line; exposes `xDomainOverride` for Y-axis-lock parity across snapshots.

## Intent diagram

```text
┌──────────────────────────────────────────────────────────────┐
│  CapabilityHistogram — distribution vs spec limits           │
├──────────────────────────────────────────────────────────────┤
│   count ─┤                                                   │
│          │           ┌─┐ ┌─┐                                 │
│          │         ┌─┤ ├─┤ ├─┐                               │
│          │       ┌─┤ │ │ │ │ ├─┐                             │
│          │     ┌─┤ │ │ │ │ │ │ ├─┐                           │
│          │     │ │ │ │ │ │ │ │ │ │                           │
│          ├─────┴─┴─┴─┴─┴─┴─┴─┴─┴─┴────                       │
│          ┊  LSL    │mean│  target           USL              │
│          ┊         ┊    ┊                    ┊               │
│          (red bin) (in-spec bins green)  (red bin)           │
│                                                              │
│  15 d3 bin bars, fill via isWithinSpec(midpoint).            │
│  LSL/USL = dashed spec line; target = dashed; mean = solid.  │
│  xDomainOverride extends past data for Y-axis-lock parity.   │
│  ChartSourceBar at bottom (showBranding).                    │
└──────────────────────────────────────────────────────────────┘
```

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/charts/src/__tests__/CapabilityHistogramRender.test.tsx` for current verification.

## Out of scope / non-goals

TBD. Cp/Cpk numeric calculation lives in `@variscout/core/capability`, not this component.

## Links

- **Code**: `packages/charts/src/CapabilityHistogram.tsx`, `packages/ui/src/components/CapabilityHistogram/index.tsx`
- **Tests**: `packages/charts/src/__tests__/CapabilityHistogramRender.test.tsx`, `packages/ui/src/components/CapabilityHistogram/__tests__/CapabilityHistogram.test.tsx`
- **Related**: `docs/03-features/analysis/capability.md`, `docs/03-features/analysis/probability-plot.md`
