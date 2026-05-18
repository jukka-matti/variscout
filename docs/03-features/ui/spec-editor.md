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
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# Spec Editor

## Problem

Each measured column needs editable specification limits (USL / LSL / target) plus optional Cpk target and characteristic-type override — surfaced inline near the chart without a heavy modal, and persisted per-column so capability analysis can render against customer specs.

## Capability claim

`SpecEditor` (`packages/ui/src/components/SpecEditor/SpecEditor.tsx`) is the single per-characteristic spec form — it edits `usl`, `lsl`, `target`, `characteristicType`, and `cpkTarget` for one column; consumers wire it via `measureSpecs[outcome]` + `setMeasureSpec(outcome, partial)` from `@variscout/stores`, and the deleted `SpecsPopover` is explicitly forbidden from being reintroduced (per `packages/ui/CLAUDE.md` invariant).

## Intent diagram

Single per-column form, surfaces inline (popover desktop / bottom-sheet mobile):

```
┌────── Spec Editor — Weight ─────── ✕ ──┐
│  LIMITS                                │
│  USL        [ 12.5  ]                  │
│  LSL        [ 11.5  ]                  │
│  Target     [ 12.0  ]                  │
│                                        │
│  CHARACTERISTIC TYPE                   │
│  ( ) Auto (inferred: two-sided)        │
│  (•) Two-sided   ( ) Upper   ( ) Lower │
│                                        │
│  ADVANCED                              │
│  ☑ Custom Cpk target [ 1.50 ]          │
│                                        │
│             [ Cancel ]  [ Save ]       │
└────────────────────────────────────────┘
         │
         ▼ onSave({ usl, lsl, target, characteristicType, cpkTarget })
         ▼
   setMeasureSpec(outcome, partial)   ← from @variscout/stores
```

One form, one column. `SpecsPopover` (deleted) is forbidden — `SpecEditor` is the canonical per-characteristic surface.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/ui/src/components/SpecEditor/__tests__/SpecEditor.test.tsx` for current verification.

## Out of scope / non-goals

TBD.

## Links

- **Code**: `packages/ui/src/components/SpecEditor/SpecEditor.tsx`, `packages/ui/src/components/SpecEditor/types.ts`
- **Tests**: `packages/ui/src/components/SpecEditor/__tests__/SpecEditor.test.tsx`
- **Related**: `docs/03-features/ui/health-bar.md`, `docs/03-features/analysis/capability.md`, `packages/ui/CLAUDE.md`
