---
title: 'Spec Editor'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: ui
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-06-11
---

# Spec Editor

## Problem

Each measured column needs editable specification limits (USL / LSL / target) plus optional Cpk target and characteristic-type override — surfaced inline near the chart without a heavy modal, and persisted per-column so capability analysis can render against customer specs.

## Capability claim

`SpecEditor` (`packages/ui/src/components/SpecEditor/SpecEditor.tsx`) is the single per-characteristic spec form — it edits `usl`, `lsl`, `target`, `characteristicType`, and `cpkTarget` for one column; consumers wire it via `measureSpecs[outcome]` + `setMeasureSpec(outcome, partial)` from `@variscout/stores`, and the deleted `SpecsPopover` is explicitly forbidden from being reintroduced (per `packages/ui/CLAUDE.md` invariant).

## Intent diagram

Single per-column form, surfaces inline (popover desktop / bottom-sheet mobile). Consumers must resolve the active column's specs as `measureSpecs[outcome] ?? specs` before rendering charts or opening the editor.

```
┌────── Edit Specifications ─────── ✕ ──┐
│  LIMITS                               │
│  LSL (Min) [ 11.5 ] Target [ 12.0 ]   │
│  USL (Max) [ 12.5 ]                   │
│            LSL + USL -> target-centered│
│                                        │
│  Capability target (Cpk)              │
│  ☑ [ 1.50 ]                           │
│                                        │
│                 [ Save ]              │
└────────────────────────────────────────┘
         │
         ▼ onSave({ usl, lsl, target, characteristicType, cpkTarget })
         ▼
   setMeasureSpec(outcome, partial)   ← from @variscout/stores
```

One form, one column. `SpecsPopover` (deleted) is forbidden — `SpecEditor` is the canonical per-characteristic surface.

## Acceptance signals

- USL-only specs echo `USL only -> smaller is better`.
- LSL-only specs echo `LSL only -> larger is better`.
- LSL + USL specs echo `LSL + USL -> target-centered`.
- Empty specs show no best-direction inference.
- I-Chart, boxplot, histogram, and capability/stat surfaces read per-measure specs with `measureSpecs[outcome] ?? specs`.

## Out of scope / non-goals

- Reintroducing `SpecsPopover`.
- Inferring a best direction from an empty spec.

## Links

- **Code**: `packages/ui/src/components/SpecEditor/SpecEditor.tsx`, `packages/ui/src/components/SpecEditor/types.ts`
- **Tests**: `packages/ui/src/components/SpecEditor/__tests__/SpecEditor.test.tsx`
- **Related**: `docs/03-features/ui/health-bar.md`, `docs/03-features/analysis/capability.md`, `packages/ui/CLAUDE.md`
