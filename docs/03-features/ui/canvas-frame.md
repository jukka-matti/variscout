---
title: 'Canvas + Frame Substrate'
purpose: design
tier: living
status: draft
audience: human
layer: L3
kind: infrastructure
serves:
  - docs/02-journeys/index.md
last-reviewed: 2026-05-18
---

> **L3 feature stub** — created 2026-05-18 as part of M0 SDD migration inventory (Option A). Body to be expanded in M3 audit or on next feature edit.

# Canvas + Frame Substrate

## Problem

Investigation Wall, Process Map, and Yamazumi all need to render structured process content with pan/zoom, hit-testing, and step-level actions — without each surface reinventing viewport state or step/chip primitives.

## Capability claim

`packages/core/src/canvas/` provides the pure-TS domain layer (action union, viewport math, step-capability stamping, drift detection) and `packages/core/src/frame/` provides the process-frame factories + gap detection; `packages/ui/src/components/Canvas/` renders these primitives across L1/L2/L3 levels per the 8f viewport architecture (ADR-081) — viewport state is unified in `useCanvasViewportStore` while each level paints in its native medium (SVG / DOM).

## Intent diagram

TBD — Mermaid data-flow to be added in M3 audit or on next edit.

## Acceptance signals

TBD — testable conditions to be added on next edit. See related tests at `packages/core/src/canvas/__tests__/`, `packages/core/src/frame/__tests__/`, and `packages/ui/src/components/Canvas/__tests__/` for current verification.

## Out of scope / non-goals

TBD.

## Links

- **Code**: `packages/core/src/canvas/`, `packages/core/src/frame/`, `packages/ui/src/components/Canvas/`
- **Tests**: `packages/core/src/canvas/__tests__/viewport.test.ts`, `packages/core/src/frame/__tests__/factories.test.ts`, `packages/ui/src/components/Canvas/__tests__/CanvasWorkspace.test.tsx`
- **Related**: `docs/07-decisions/adr-081-canvas-viewport-architecture.md`, `packages/core/CLAUDE.md`, `packages/ui/CLAUDE.md`
