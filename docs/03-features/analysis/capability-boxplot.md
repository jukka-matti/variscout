---
title: 'Capability Boxplot'
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

# Capability Boxplot

## Problem

Process owners overseeing many canonical nodes (lines, cells, SKUs) need to see the distribution of per-context Cpks per node side-by-side — without collapsing heterogeneous local processes into a single misleading Cpk aggregate (Watson's "Cpks aren't additive" rule per ADR-073).

## Capability claim

`CapabilityBoxplot` in `packages/charts/src/CapabilityBoxplot.tsx` renders one boxplot category per canonical node, with each box summarising that node's `perContextResults[].cpk` values via `calculateBoxplotStats`; falls back to a jittered-dot cluster (BoxplotBase) when a node has fewer than 7 per-context Cpks, and overlays per-node target-Cpk ticks plus sample-confidence badges. Bottom-left slot of the production-line-glance 2×2 dashboard.

## Intent diagram

```text
┌────────────────────────────────────────────────────────────┐
│  CapabilityBoxplot — per-node Cpk distribution             │
├────────────────────────────────────────────────────────────┤
│  Cpk ─┤                                                    │
│       │    ┌──┐                                            │
│       │    │  │                                            │
│       │ ───┤  ├───  ─ ─ ─ ─ ─  target tick (per-node)      │
│       │    │ ─│                                            │
│       │    │  │       ┌──┐                                 │
│       │    └──┘       │  │     • • •                       │
│       │            ───┤  ├──   (jittered dots, n<7)        │
│       │               │ ─│                                 │
│       │               └──┘                                 │
│       │            ─ ─ ─ ─ ─ target tick                   │
│       │  Cpk=0                                             │
│       └────────┬────────┬────────┬─────                    │
│              Line A   Line B   Line C                      │
│              [trust]   [n!]    [n!]    sample-confidence   │
│                                                            │
│  One category per canonical node; each box summarises      │
│  perContextResults[].cpk via calculateBoxplotStats.        │
│  Never collapse per-context Cpks (ADR-073).                │
└────────────────────────────────────────────────────────────┘
```

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/charts/src/__tests__/CapabilityBoxplot.test.tsx` for current verification.

## Out of scope / non-goals

TBD. Never collapse per-context Cpks into a single per-node aggregate — distribution shape, not Math.min/mean (ADR-073 invariant).

## Links

- **Code**: `packages/charts/src/CapabilityBoxplot.tsx`, `packages/ui/src/components/ProductionLineGlanceDashboard/`
- **Tests**: `packages/charts/src/__tests__/CapabilityBoxplot.test.tsx`
- **Related**: `docs/03-features/analysis/capability.md`, `docs/03-features/analysis/multi-level-dashboard.md`, `docs/superpowers/specs/2026-04-28-production-line-glance-design.md`
