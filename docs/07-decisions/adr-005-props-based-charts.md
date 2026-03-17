---
title: 'ADR-005: Props-Based Charts (vs Context)'
---

# ADR-005: Props-Based Charts (vs Context)

**Status**: Accepted

**Date**: 2024-02-15

---

## Context

Chart components need data (measurements, specs, stats). Two patterns:

1. **Context-based**: Charts consume data from React Context
2. **Props-based**: Charts receive all data through props

---

## Decision

All chart components in `@variscout/charts` are props-based:

```typescript
<IChart
  data={measurements}
  specs={{ lsl: 98, usl: 102, target: 100 }}
  stats={calculatedStats}
  showBranding={true}
/>
```

---

## Consequences

### Benefits

- Charts are pure, testable, reusable
- Same chart works in PWA, Excel, Azure with different data sources
- Clear data flow, easy to reason about
- Can render multiple charts with different data

### Trade-offs

- More props to pass through component tree
- Parent components must manage data fetching/calculation
- Some prop drilling in complex layouts

---

## See Also

- [Charts Package Rules](../06-design-system/charts/overview.md)
