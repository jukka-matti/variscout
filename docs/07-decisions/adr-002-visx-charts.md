---
title: 'ADR-002: Visx for Chart Components'
---

# ADR-002: Visx for Chart Components

**Status**: Accepted

**Date**: 2024-01-20

---

## Context

We needed a charting solution for statistical process control charts (I-Charts, Boxplots, Capability histograms). Options considered:

1. **Chart.js**: Popular, but canvas-based limits customization
2. **Recharts**: React-friendly but high-level API hides SVG control
3. **D3.js**: Maximum control but verbose and imperative
4. **Visx**: D3-powered React primitives with full SVG access

---

## Decision

Use Visx (@visx/\*) for all chart components. Visx provides low-level SVG primitives that compose into React components, giving us:

- Full control over SVG elements for custom annotations (spec limits, zones)
- D3 scales and utilities without D3's DOM manipulation
- React component model with hooks

---

## Consequences

### Benefits

- Precise control over chart rendering
- Easy to add custom elements (spec lines, shading, annotations)
- Server-side rendering possible
- Small bundle size (tree-shakeable)

### Trade-offs

- More code to write vs high-level chart libraries
- Team needs SVG/D3 knowledge
- No built-in chart types (must build from primitives)

---

## See Also

- [Charts Package](../06-design-system/charts/overview.md)
