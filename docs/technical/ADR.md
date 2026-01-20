# Architecture Decision Records (ADR)

This document captures key architectural decisions made during VariScout Lite development. Each decision includes context, the decision made, and consequences.

## ADR Template

```markdown
## ADR-XXX: Title

**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX

**Date**: YYYY-MM-DD

### Context

What is the issue we're addressing?

### Decision

What is the change we're proposing?

### Consequences

What becomes easier or harder as a result?
```

---

## ADR-001: Monorepo with pnpm Workspaces

**Status**: Accepted

**Date**: 2024-01-15

### Context

VariScout Lite consists of multiple applications (PWA, Excel Add-in, Azure App, Marketing Website) that share significant code including statistical calculations, chart components, and UI utilities. We needed a code organization strategy that enables sharing while maintaining clear boundaries.

### Decision

Use pnpm workspaces in a monorepo structure:

```
packages/
├── core/      # Pure logic (stats, parser, types)
├── charts/    # React + Visx chart components
├── data/      # Sample datasets
├── hooks/     # Shared React hooks
└── ui/        # Shared UI components

apps/
├── pwa/          # React + Vite PWA
├── azure/        # Azure Team App
├── website/      # Astro marketing site
└── excel-addin/  # Office.js Add-in
```

### Consequences

**Benefits**:

- Single source of truth for shared code
- Atomic commits across packages and apps
- Simplified dependency management with `workspace:*`
- pnpm's efficient disk usage via hard links

**Trade-offs**:

- More complex build orchestration
- Must be careful about package boundaries
- Git history can be harder to navigate

---

## ADR-002: Visx for Chart Components

**Status**: Accepted

**Date**: 2024-01-20

### Context

We needed a charting solution for statistical process control charts (I-Charts, Boxplots, Capability histograms). Options considered:

1. **Chart.js**: Popular, but canvas-based limits customization
2. **Recharts**: React-friendly but high-level API hides SVG control
3. **D3.js**: Maximum control but verbose and imperative
4. **Visx**: D3-powered React primitives with full SVG access

### Decision

Use Visx (@visx/\*) for all chart components. Visx provides low-level SVG primitives that compose into React components, giving us:

- Full control over SVG elements for custom annotations (spec limits, zones)
- D3 scales and utilities without D3's DOM manipulation
- React component model with hooks

### Consequences

**Benefits**:

- Precise control over chart rendering
- Easy to add custom elements (spec lines, shading, annotations)
- Server-side rendering possible
- Small bundle size (tree-shakeable)

**Trade-offs**:

- More code to write vs high-level chart libraries
- Team needs SVG/D3 knowledge
- No built-in chart types (must build from primitives)

---

## ADR-003: IndexedDB for PWA Storage

**Status**: Accepted

**Date**: 2024-02-01

### Context

PWA needs to store user data (uploaded files, analysis results, settings) persistently in the browser. Options:

1. **localStorage**: Simple but 5MB limit, synchronous, string-only
2. **IndexedDB**: Complex API but large storage, async, structured data
3. **Cache API**: Designed for HTTP responses, not app data

### Decision

Use IndexedDB with a wrapper utility for:

- Uploaded datasets (can be multi-MB)
- Computed statistics cache
- User preferences and settings

Use localStorage only for:

- Small, simple values (theme preference, last-used settings)

### Consequences

**Benefits**:

- Virtually unlimited storage (browser-managed quotas)
- Structured data with indexes for queries
- Async API won't block UI thread
- Survives browser restarts

**Trade-offs**:

- Complex API requiring wrapper abstraction
- Debugging is harder than localStorage
- Storage can be evicted under pressure

---

## ADR-004: Offline-First Architecture

**Status**: Accepted

**Date**: 2024-02-05

### Context

Quality professionals often work in manufacturing environments with unreliable network connectivity. The tool must work without internet access after initial installation.

### Decision

Implement offline-first architecture:

1. **No backend required**: All statistical processing in browser
2. **Service Worker**: Cache app shell and assets
3. **Local-first data**: All data stays in IndexedDB
4. **Optional sync**: Azure app can sync to OneDrive when online

### Consequences

**Benefits**:

- Works in low/no connectivity environments
- No server costs or maintenance
- Data privacy (stays on user's device)
- Instant load after first visit

**Trade-offs**:

- Can't do cross-device sync without explicit cloud integration
- Limited to browser's computational capabilities
- Updates require service worker refresh cycle

---

## ADR-005: Props-Based Charts (vs Context)

**Status**: Accepted

**Date**: 2024-02-15

### Context

Chart components need data (measurements, specs, stats). Two patterns:

1. **Context-based**: Charts consume data from React Context
2. **Props-based**: Charts receive all data through props

### Decision

All chart components in `@variscout/charts` are props-based:

```typescript
<IChart
  data={measurements}
  specs={{ lsl: 98, usl: 102, target: 100 }}
  stats={calculatedStats}
  showBranding={true}
/>
```

### Consequences

**Benefits**:

- Charts are pure, testable, reusable
- Same chart works in PWA, Excel, Azure with different data sources
- Clear data flow, easy to reason about
- Can render multiple charts with different data

**Trade-offs**:

- More props to pass through component tree
- Parent components must manage data fetching/calculation
- Some prop drilling in complex layouts

---

## ADR-006: Edition System (Community/ITC/Licensed)

**Status**: Accepted

**Date**: 2024-03-01

### Context

We need to support multiple editions of the app:

- **Community**: Free, full features, VariScout branding
- **ITC**: Custom branding for training partner
- **Licensed**: Paid (€49), no branding, theme customization

### Decision

Implement edition detection via build-time environment variables:

```typescript
// packages/core/src/edition.ts
export function getEdition(): Edition {
  return import.meta.env.VITE_EDITION || 'community';
}

export function isThemingEnabled(): boolean {
  return getEdition() === 'licensed';
}
```

Feature gates check edition at runtime:

```typescript
if (isThemingEnabled()) {
  // Show theme picker
}
```

### Consequences

**Benefits**:

- Single codebase for all editions
- Features can be edition-gated granularly
- Build commands produce different bundles
- License validation for paid edition

**Trade-offs**:

- Build complexity (multiple build targets)
- Must be careful not to leak licensed features
- License validation adds code complexity

---

## Pending Decisions

### ADR-007: Testing Strategy (Proposed)

See `docs/technical/TESTING_STRATEGY.md` for current approach. May formalize as ADR.

### ADR-008: State Management Pattern (Proposed)

Currently using React Context. May evaluate alternatives if complexity grows.

---

## Decision Log

| ID  | Title                 | Status   | Date       |
| --- | --------------------- | -------- | ---------- |
| 001 | Monorepo with pnpm    | Accepted | 2024-01-15 |
| 002 | Visx for Charts       | Accepted | 2024-01-20 |
| 003 | IndexedDB for Storage | Accepted | 2024-02-01 |
| 004 | Offline-First         | Accepted | 2024-02-05 |
| 005 | Props-Based Charts    | Accepted | 2024-02-15 |
| 006 | Edition System        | Accepted | 2024-03-01 |
