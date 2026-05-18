---
title: 'Performance Setup Panel'
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

# Performance Setup Panel

## Problem

Performance Mode needs a single configuration surface where users pick multiple measure channels, set a shared Cpk target, and emit the resulting per-channel spec assignments — so multi-channel capability analysis can be enabled without scattering spec edits across multiple modals.

## Capability claim

`PerformanceSetupPanelBase` (`packages/ui/src/components/PerformanceSetupPanel/PerformanceSetupPanelBase.tsx`) is the multi-channel Performance Mode config UI — it takes a single Cpk-target input and emits `onEnable(columns, label, cpkTargetPerChannel)` where `cpkTargetPerChannel: Record<string, number>` maps every selected channel to that input value; consumers fan out via `setMeasureSpec(column, { cpkTarget })` (no project-wide `setCpkTarget` from this surface — per `packages/ui/CLAUDE.md` invariant).

## Intent diagram

Multi-channel selection + single Cpk target → fan-out per column on submit:

```
┌────────────────────────── Performance Mode Setup ──────────────────────────┐
│ Measure channels:  ☑ Head_1  ☑ Head_2  ☑ Head_3  ☐ Head_4   (3 selected)   │
│ Label:             [ Head_____________ ]                                   │
│ Cpk target:        [ 1.33 ▾ ]   ← single value, applied to all channels    │
│                                                                            │
│                                          [ Cancel ]  [ Enable Performance ]│
└────────────────────────────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
                onEnable(columns, label, cpkTargetPerChannel)
                  cpkTargetPerChannel = { Head_1: 1.33, Head_2: 1.33, Head_3: 1.33 }
                                                       │
                                                       ▼
                Consumer fans out: for each col → setMeasureSpec(col, { cpkTarget })
```

No project-wide `setCpkTarget` from this surface — every channel writes through `measureSpecs[col]` so resolution stays per-characteristic.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/ui/src/components/PerformanceSetupPanel/__tests__/PerformanceSetupPanelBase.test.tsx` for current verification.

## Out of scope / non-goals

TBD.

## Links

- **Code**: `packages/ui/src/components/PerformanceSetupPanel/PerformanceSetupPanelBase.tsx`, `packages/ui/src/components/MeasureColumnSelector/`
- **Tests**: `packages/ui/src/components/PerformanceSetupPanel/__tests__/PerformanceSetupPanelBase.test.tsx`
- **Related**: `docs/03-features/analysis/performance-mode.md`, `docs/03-features/ui/spec-editor.md`
