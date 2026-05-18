---
title: 'Process Health Bar'
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

# Process Health Bar

## Problem

Process Hub Capability and Investigation surfaces need a compact, always-visible toolbar that fuses stats summary + filter chips (with sample count) + Cpk-target quick-tweak + export/present actions — so users can read process health and adjust scope without leaving the canvas.

## Capability claim

`ProcessHealthBar` (`packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx`) is the unified toolbar row rendering layout: `[Layout toggle] [Factors(n)] | [Stats] | [Filter chips (n=X)] | [Cpk target] [Export] [Present]`, with Cpk values graded via `gradeCpk(cpk, target)` from `@variscout/core/capability` against the user-set target (not literature 1.33/1.67 — per `feedback_capability_grades_target_relative`) and an inline `onCpkTargetCommit` quick-tweak paired with `columnLabel` for scope visibility.

## Intent diagram

TBD — Mermaid wireframe to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/ui/src/components/ProcessHealthBar/__tests__/ProcessHealthBar.test.tsx` for current verification.

## Out of scope / non-goals

TBD.

## Links

- **Code**: `packages/ui/src/components/ProcessHealthBar/ProcessHealthBar.tsx`, `packages/ui/src/components/ProcessHealthBar/types.ts`
- **Tests**: `packages/ui/src/components/ProcessHealthBar/__tests__/ProcessHealthBar.test.tsx`
- **Related**: `docs/03-features/ui/spec-editor.md`, `docs/03-features/ui/filter-bar.md`, `docs/03-features/analysis/capability.md`
