---
tier: living
purpose: decide
title: 'ADR-081: Canvas viewport architecture — levels-as-pan/zoom (8f)'
audience: human
category: architecture
status: active
date: 2026-05-13
related:
  - adr-068-coscout-cognitive-redesign
  - adr-073-no-statistical-rollup-across-heterogeneous-units
  - adr-074-scout-level-spanning-surface-boundary-policy
  - adr-076-frame-b0-lightweight-render
  - adr-078-pwa-azure-architecture-alignment
  - canvas-viewport-architecture-design
---

# ADR-081: Canvas viewport architecture — levels-as-pan/zoom (8f)

**Status**: Accepted

**Date**: 2026-05-13

## Context

Vision spec §5.4 commits the Canvas surface to express the three methodology levels (System / Process Flow / Local Mechanism) as a pan/zoom gesture, not a separate level picker. This is **the last unmet vision-spec commitment** after PR8 sub-PRs 8a–8e closed the other five (decision-log 2026-05-08).

Today the Canvas is a DOM grid with `overflow: auto` scroll. The only pan/zoom in the product lives inside the Investigation Wall (`WallCanvas` → CSS transform on an SVG `<g>`, state in `wallLayoutStore`). Three levels exist in our methodology (defined in `docs/01-vision/methodology.md` §2.1) but live on three different surfaces (SCOUT for L1, Hub Capability + Canvas for L2, Evidence Map + Wall for L3). There is no unified pan/zoom navigation between them.

A 2026-05-13 brainstorm session locked the architecture for 8f. This ADR codifies the **irreversible commitments** from that brainstorm. UX-level details (exact LOD threshold values, animation timing, field lists per level) live in the design spec `docs/superpowers/specs/2026-05-13-canvas-viewport-architecture-design.md` and are tunable in chrome walks.

## Decision

The following five commitments are codified as architecture. They constrain implementation choices for the entire workstream and any future viewport-related work.

### 1. d3-zoom is the only viewport dependency

The Canvas viewport uses **`d3-zoom`** (3 KB gz, framework-agnostic) to handle wheel + pinch + pointer-drag input math, scale-extent clamps, and programmatic transitions. d3-zoom is used internally by Figma and Miro and is the foundation of every serious React data-viz stack (Visx is "d3-scale + React"). It is the only new dependency introduced by 8f.

**Explicitly rejected alternatives:**

- **`react-flow` / `@xyflow/react`** (~50–80 KB gz): mature DAG-editor library, but opinionated about node/edge model. Would force a rewrite of `CanvasStepCard` (currently custom-rendered with dnd-kit chips, drift overlays, mini-charts), conflict with Wall overlay input layering locked in PR8 sub-PR 8e, and pay bundle cost for affordances we do not need at three discrete LODs.
- **Pure hand-rolled (no library)**: re-invents wheel-zoom + pinch + scale-extent clamps + programmatic transitions. Wasteful when d3-zoom solves it cleanly.

Future viewport work that pressures this decision (e.g., need for advanced minimap, smart edge routing, or thousands-of-nodes performance) shall be addressed as a separate ADR; it does not silently re-open this one.

### 2. Unified state + pluggable renderers

The Canvas viewport state lives in **one store**, `useCanvasViewportStore` (generalized from today's `wallLayoutStore`). The state holds `zoom`, `pan`, `currentLevel`, `focalStepId`, plus the wall-layout fields (`nodePositions`, `groupByTributary`). State layer: annotation-per-project, persisted via the same Dexie + Blob path that PR8 8e established for `wallLayoutStore` (PWA = IndexedDB; Azure = IndexedDB + Blob sync with ETag per ADR-079).

The store shape is locked as Hub-keyed state: `viewports: Record<ProcessHubId, CanvasViewport>`. It is not a flat per-project singleton. A Hub is the L2 artifact, and the viewport belongs to that Hub. Persistence follows the same boundary: Azure persists one per-Hub blob or equivalent per-Hub record; PWA persists one per-Hub Dexie record/blob. The pre-8f flat per-project viewport snapshot is dropped on 8f deploy because it cannot be reshaped into N Hub viewports without inventing missing mapping data. LOD thresholds and transition details remain tunable, but the `ProcessHubId`-keyed state shape is locked by this ADR.

**Renderers are pluggable per level:**

- L1 (System) renders DOM-native — a slim outcome panel.
- L2 (Process Flow) renders DOM-native — today's Canvas grid wrapped in CSS transform.
- L3 (Local Mechanism) renders DOM-native — column mini-charts + embedded Evidence Map + Wall mirror.
- The Wall (separate surface) reads the same store and renders SVG `<g>` transform unchanged.

**Forcing one render mechanism on all surfaces is rejected.** Wall is graph-positioned (SVG-natural); Canvas-L2 is flow-positioned with rich interactive DOM cards (DOM-natural). The viewport is a state concept, not a rendering mechanism. This matches Figma's scene-graph + canvas-renderer split, Google Maps' camera + tile-renderer split, VS Code's ViewModel + DOM/Canvas split.

### 3. Canvas is the viewport surface — ADR-074 amendment

Canvas mounts level-specific views by **embedding owner-surface components**, not by re-rendering or recomputing. Owner surfaces (SCOUT, Evidence Map, Wall) remain analytical engines + deep-work destinations.

This amends ADR-074 (level-spanning surface boundary policy). The "no re-rendering / no recomputing" rule still binds; Canvas may import owner-surface components but may not implement parallel ones. See the [Amendment 2026-05-13 block on ADR-074](adr-074-scout-level-spanning-surface-boundary-policy.md#amendment--2026-05-13-canvas-as-viewport-surface-8f) for the verification implications.

### 4. L1 is ADR-073-compliant (no cross-step rollup)

At L1 the Canvas renders **the Hub's outcome series itself** — a single Y column with a single spec — not aggregated capability across steps. The outcome panel includes:

- Outcome distribution (boxplot or histogram)
- Drift over time
- Cp / Cpk / Pp / Ppk against the **outcome's own spec**
- Conformance % against the outcome's own spec
- Inbox digest + active investigations summary

**No statistical roll-up across heterogeneous sibling steps occurs at L1.** Sibling steps with different specs render at L2 with their per-step capability, never combined.

This codifies the only safe shape for L1 under ADR-073 (no statistical roll-up across heterogeneous units). Future L1 redesign requests that propose any form of step-capability aggregation are rejected without a separate ADR.

### 5. Within-Hub scope (multi-Hub portfolio is out)

8f's pan/zoom navigates **within one Hub**. The L1 view is "this Hub's outcome" — not "all Hubs in the workspace." Multi-Hub portfolio / cross-Hub aggregation views are Azure-tier named-future per vision §7, governed by their own future spec and ADR.

This scope boundary is locked at the ADR level because reopening it would invalidate the ADR-073 compliance argument in Decision 4 (multi-Hub aggregation re-introduces the cross-heterogeneity rollup problem).

## Consequences

**Positive:**

- One viewport state model serves Wall + Canvas + future surfaces. The pattern is industry-default; new developers recognize it immediately (Figma, Google Maps, VS Code, Notion, Linear, Visx all ship the same shape).
- Owner surfaces (SCOUT, Evidence Map, Wall) keep their analytical authority. Canvas does not become a parallel implementation that drifts from owner-surface semantics.
- Bundle cost is small (~3 KB gz). PWA browser-only delivery target is not strained.
- Future level-axis features (e.g., level-aware CoScout coaching per ADR-068) compose naturally on top of `currentLevel`.

**Negative / accepted trade-offs:**

- Two render mechanisms (SVG for Wall, DOM-CSS-transform for Canvas) require a small coordinate-space translation utility for cross-surface features. Figma solves the same problem for Canvas ↔ DOM overlay interop; tractable but called out in the spec §4.7.
- LOD transition between L1/L2/L3 requires a brief opacity cross-fade to avoid jarring mount/unmount snaps. Cheap implementation, but called out so future contributors don't remove it as "unnecessary animation."
- The clean shape change `wallLayoutStore → useCanvasViewportStore` (per `feedback_no_backcompat_clean_architecture`) is a one-PR refactor touching every Wall consumer and the persisted state key. No legacy alias.

**Out of scope for this ADR (lives in spec):**

- Exact LOD threshold values (the spec starts at `0.3` for L1/L2 and `2.0` for L2/L3; tunable in chrome walks).
- LOD transition animation timing (the spec starts at 150ms cross-fade).
- L1 field list, L2 overview-detail cutoff, L3 archetype routing details.
- Mode-lens × level matrix cell-by-cell content (15 cells in spec §10).
- Mobile breakpoint (the spec uses `<768px` per PR8 8e Q6 precedent).
- Gesture vocabulary (Map convention per brainstorm Decision #9).
- Click-vs-drag deadband (6 CSS pixels in spec).
- URL deep-link query-param naming (`?level=` in spec).

## References

- Vision spec §5.4 + §2.1 + §3.1: [`docs/superpowers/specs/2026-05-03-variscout-vision-design.md`](../superpowers/specs/2026-05-03-variscout-vision-design.md)
- Methodology: [`docs/01-vision/methodology.md`](../01-vision/methodology.md) §2.1
- Design spec (8f, this work): [`docs/superpowers/specs/2026-05-13-canvas-viewport-architecture-design.md`](../superpowers/specs/2026-05-13-canvas-viewport-architecture-design.md)
- ADR-068 (CoScout cognitive redesign — already assumed level-aware coaching from `currentLevel`)
- ADR-073 (No statistical roll-up — the binding L1 constraint)
- ADR-074 (Level-spanning surface boundary policy — amended by this ADR)
- ADR-076 (FRAME b0 lightweight render — b0/b1 archetype routing reused at L3)
- ADR-078 (PWA + Azure alignment — state-shape parity across tiers)
- PR8 sub-PR 8d (hypothesis-arrow drawing — input-layer precedence preserved at L2)
- PR8 sub-PR 8e (Wall mirror overlay — `wallLayoutStore` precedent for state shape + mobile fallback)
- PR8 sub-PR 8e Q6 (mobile fallback at <768px — applied identically here)

## Status

Accepted (2026-05-13). Codifies the irreversible architecture; the design spec carries reversible UX details.

## Supersedes / superseded by

- Supersedes: none.
- Amends: ADR-074 (named amendment block dated 2026-05-13).
- Superseded by: none (active).
