---
title: 'Sustainment Phase'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: workflow
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# Sustainment Phase

## Problem

Improvement projects fail when the team stops monitoring after the fix lands — drift returns, the change is silently rolled back, or the control surface (MES recipe, SCADA alarm, work instruction) goes stale; the third Project stage in the wedge V1 `Charter → Approach → Sustainment` model exists to keep the proof going.

## Capability claim

Sustainment domain types live in `packages/core/src/sustainment.ts` (`SustainmentCadence` weekly through annual, `SustainmentVerdict` of `'holding' | 'drifting' | 'broken' | 'inconclusive'`, `SustainmentStatus`, and `ControlHandoffSurface` enumerating `'mes-recipe' | 'scada-alarm' | 'qms-procedure' | 'work-instruction'`), with Azure UI in `apps/azure/src/components/sustainment/SustainmentPanel.tsx` + editors and CoScout auto-fire on Sustainment events per ADR-080.

## Intent diagram

TBD — Mermaid flowchart (Approach signoff → Sustainment review cadence → Verdict) to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/core/src/__tests__/sustainment.test.ts`, `packages/core/src/__tests__/sustainment.paths.test.ts`, and `apps/azure/src/components/__tests__/SustainmentEditors.test.tsx` for current verification.

## Out of scope / non-goals

TBD.

## Links

- **Code**: `packages/core/src/sustainment.ts`, `packages/core/src/actions/sustainmentActions.ts`, `packages/core/src/survey/sustainment.ts`, `apps/azure/src/components/sustainment/`, `apps/azure/src/pages/Editor.sustainment.tsx`
- **Tests**: `packages/core/src/__tests__/sustainment.test.ts`, `packages/core/src/__tests__/sustainment.paths.test.ts`
- **Related**: `docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md`, `docs/07-decisions/adr-082-wedge-architecture.md`, `docs/03-features/workflows/improvement-workspace.md`
