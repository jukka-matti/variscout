---
title: 'viewport-is-a-state-concept-not-a-rendering-mechanism'
description: 'When designing multi-renderer surfaces (canvas, map, editor), share the state + input layer; let each renderer use its native paint mechanism. Don''t force one paint mechanism on incompatible content.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 7d1bd47c7ef9be7d
origin-session-id: 0bd8bf7b-cd60-4ddd-8a60-5b0b0ac8bf40
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_viewport_state_not_mechanism.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When two or more surfaces appear to need "the same pan/zoom feel," the temptation is to share the rendering mechanism (one big SVG, or one big Canvas, or one DOM tree). Resist this.

**The right unification is at the state + input layer:**

- One state model (`{zoom, pan, level, ...}`)
- One input handler driving that state (d3-zoom, in VariScout's case)
- Pluggable renderers per surface, each in its native medium

Industry precedent for the pattern (all shipping at scale):

- **Figma** — scene graph state is renderer-agnostic; Canvas/WebGL paints geometry; DOM overlays paint multiplayer cursors + comments + plugin UIs. Two paint mechanisms reading shared state.
- **Google Maps + Apple Maps** — camera state (center / zoom / bearing) drives raster tiles, vector tiles, 3D buildings, Street View — completely different render pipelines.
- **VS Code / Monaco** — text rendering uses DOM lines; minimap uses Canvas; both read the same ViewModel.
- **CodeMirror 6** — explicit "headless platform" architecture: state is `EditorState`; views/extensions render however they want.
- **Notion / Linear** — Table / Board / Calendar / Timeline / Gallery views all read the same data model + filter state, render with completely different mechanisms.
- **Visx (lib VariScout already uses)** — d3-scale state + React render. Same pattern at chart granularity.

**Why:** Different content kinds want different paint mechanisms.

- Graph-positioned content (Wall hypothesis cards positioned by tributary + theme) → SVG-natural.
- Flow-positioned rich-interactive cards (Canvas step cards with dnd-kit chips, scroll, mode-lens re-skin) → DOM-natural; SVG `<foreignObject>` is famously janky for this on Safari/Firefox.

Forcing one mechanism on both breaks one of them — either you lose dnd-kit + Safari hit-testing on Canvas, or you lose graph positioning on Wall.

**Why:** This is one of the few rules that lets you change your mind freely later

If the state + input layer is the contract, you can swap a renderer (e.g., add WebGL for performance, add a minimap, add a print view) without touching state model or input gestures. The contract is small + stable.

**How to apply:**

When you're tempted to unify rendering — **first** check if state + input unification gets you what you actually want. Almost always yes.

When designing a new "viewport-driven" feature (anything with pan/zoom/scroll/transform), the architecture skeleton is:

```
1. State store with viewport fields (annotation layer if team-shared, view layer if transient)
2. Input handler binding the state (d3-zoom for viewport; native scroll for text; etc.)
3. Renderer-per-surface, each reading the state, each painting in its native medium
4. Small coord-space utility for cross-renderer features (e.g., Figma's Canvas↔DOM overlay interop)
```

VariScout 8f (Canvas viewport architecture, ADR-081, design spec 2026-05-13) is the in-product realization of this pattern. See [[project_canvas_viewport_8f]] for the concrete shape.

**When NOT to apply:**

- Single-renderer surfaces (only one paint mechanism in scope) → no need for the abstraction; it's overkill.
- When the content really IS uniform across the surface (e.g., a chart-only view) → one renderer is fine; don't introduce pluggability you don't need (`feedback_check_shipped_patterns_first` + YAGNI).
