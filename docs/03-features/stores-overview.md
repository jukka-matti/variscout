---
title: 'Stores Layer Overview'
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

# Stores Layer Overview

## Problem

Multiple surfaces (canvas, charts, investigation wall, projects tab, evidence map) need to read and mutate shared analyst state without prop-drilling through deep component trees or coupling rendering to persistence — and the kinds of state in play (portable document data vs per-user UI annotations vs transient view focus) have different correctness boundaries that must not blur.

## Capability claim

`@variscout/stores` provides Zustand domain stores split across 3 layers per ADR-078 + the F4 three-layer-state design: **Document** stores (`useProjectStore`, `useInvestigationStore`, `useCanvasStore`) hold portable analyst-owned data, **Annotation** stores (`useCanvasViewportStore`, `usePreferencesStore`, `useActiveIPStore`, `useProjectMembershipStore`) hold per-user-or-per-hub-but-non-portable state, and **View** (`useViewStore`) holds transient session-only focus. A portability-test boundary rule plus `__tests__/layerBoundary.test.ts` enforces middleware presence/absence; `useImprovementProjectStore` participates in the Document layer for V1 wedge projects.

## Intent diagram

No user-facing surface — infrastructure layer. See `packages/stores/CLAUDE.md` for the canonical layer table and the F4 design spec at `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md` for layer rationale. The R5 thin app-feature factory pattern (shared store construction vs app-owned adapters) is documented in [app-feature-factories-pattern.md](../05-technical/architecture/app-feature-factories-pattern.md).

## Acceptance signals

TBD — see related tests at `packages/stores/src/__tests__/layerBoundary.test.ts` and per-store test files in `packages/stores/src/__tests__/` for current verification.

## Out of scope / non-goals

TBD. Feature-local UI state (`apps/azure/src/features/*/`) is NOT a domain store and is out of scope; cross-store reactive subscriptions are forbidden per the package contract.

## Links

- **Code**: `packages/stores/src/projectStore.ts`, `packages/stores/src/investigationStore.ts`, `packages/stores/src/canvasStore.ts`, `packages/stores/src/canvasViewportStore.ts`, `packages/stores/src/preferencesStore.ts`, `packages/stores/src/activeIPStore.ts`, `packages/stores/src/viewStore.ts`, `packages/stores/src/useProjectMembershipStore.ts`, `packages/stores/src/improvementProjectStore.ts`
- **Tests**: `packages/stores/src/__tests__/`
- **Related**: `docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md`, `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`, `packages/stores/CLAUDE.md`
