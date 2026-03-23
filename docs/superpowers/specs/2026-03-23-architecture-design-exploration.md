---
title: 'Architecture Design Exploration'
audience: [developer]
category: architecture
status: stable
related: [adr-045, ddd, feature-sliced-design, strategy-pattern, domain-events]
---

# Architecture Design Exploration

**Date:** 2026-03-23
**Context:** ADR-045 documented the DDD-lite + Feature-Sliced Design architecture. This spec evaluates three architectural patterns for further evolution and compares Signals vs Event-Driven approaches.

## Current Architecture Summary

VariScout uses Presentation-Domain-Data layering across 5 packages with clean unidirectional dependencies (rated A-). The AI layer is the most cross-cutting concern, spanning 4 layers and 5.7K LOC. See [ADR-045](../../07-decisions/adr-045-modular-architecture.md) for full documentation.

---

## Pattern 1: Strategy Pattern for Analysis Mode Branching

### Problem

37 occurrences of `isYamazumi / isCapabilityMode / analysisMode === 'performance'` branching across 8 files. ReportView alone has 20 occurrences with 4-level nested ternaries:

```typescript
// Current anti-pattern (ReportView.tsx, repeated 20 times):
{isYamazumi ? (
  <YamazumiKPIGrid ... />
) : isCapabilityMode ? (
  <CapabilityKPIGrid ... />
) : analysisMode === 'performance' ? (
  <PerformanceKPIGrid ... />
) : (
  <ReportKPIGrid ... />
)}
```

Adding a new analysis mode (e.g., multi-variate) would require touching all 8 files.

### Solution

Define analysis mode strategies as a TypeScript Record:

```typescript
// packages/core/src/analysisStrategy.ts
type AnalysisMode = 'standard' | 'yamazumi' | 'capability' | 'performance';

interface AnalysisModeStrategy {
  metricLabel: (hasSpecs: boolean) => string;
  formatMetricValue?: (v: number) => string;
  kpiComponent: 'standard' | 'yamazumi' | 'capability' | 'performance';
  chartSlotMapping: { slot1: ChartType; slot2: ChartType; slot3: ChartType; slot4: ChartType };
}

const strategies: Record<AnalysisMode, AnalysisModeStrategy> = {
  standard: { metricLabel: (hasSpecs) => hasSpecs ? 'Cpk' : 'σ', kpiComponent: 'standard', ... },
  yamazumi: { metricLabel: () => 'VA Ratio', formatMetricValue: (v) => `${Math.round(v*100)}%`, ... },
  capability: { metricLabel: () => 'Mean Cpk', kpiComponent: 'capability', ... },
  performance: { metricLabel: () => 'Worst Channel Cpk', kpiComponent: 'performance', ... },
};
```

Usage replaces nested ternaries:

```typescript
const strategy = strategies[resolvedMode];
<>{strategy.kpiComponent === 'yamazumi' ? <YamazumiKPIGrid /> : ...}</>
// Or use a component lookup map for full elimination
```

### Where it applies

| File             | Occurrences | Impact                                            |
| ---------------- | ----------- | ------------------------------------------------- |
| `ReportView.tsx` | 20          | Highest — 4-level ternaries become single lookups |
| `IChart.tsx`     | 6           | I-Chart data source selection                     |
| `Dashboard.tsx`  | 4           | Tab switching, chart slot mapping                 |
| `Editor.tsx`     | 3           | Mode detection                                    |
| Other files      | 4           | Minor usage                                       |

### AI layer impact

The AI layer **already uses** this pattern. `chartInsights.ts` has a strategy map for 5 chart types. `buildCoScoutTools` switches tool sets by journey phase. Extending the strategy pattern to analysis modes would be consistent with existing AI architecture.

### Recommendation: **P1 — Adopt during ReportView extraction**

Define the strategy interface as part of the ReportView extraction work. Place in `@variscout/core` since it's pure logic. Don't retrofit Dashboard/IChart yet — only adopt when touching those files.

---

## Pattern 2: ESLint Boundary Enforcement

### Problem

Package boundaries maintained by convention only. No tooling prevents `packages/hooks` from importing `apps/azure`. ADR-045 documents 7 boundary rules, all enforced by convention.

### Solution

`eslint-plugin-boundaries` with element type definitions:

```javascript
settings: {
  'boundaries/elements': [
    { type: 'core', pattern: 'packages/core/src/**' },
    { type: 'charts', pattern: 'packages/charts/src/**' },
    { type: 'hooks', pattern: 'packages/hooks/src/**' },
    { type: 'ui', pattern: 'packages/ui/src/**' },
    { type: 'data', pattern: 'packages/data/src/**' },
    { type: 'azure', pattern: 'apps/azure/src/**' },
    { type: 'pwa', pattern: 'apps/pwa/src/**' },
  ],
},
rules: {
  'boundaries/element-types': [2, {
    default: 'disallow',
    rules: [
      { from: 'core', allow: [] },
      { from: 'data', allow: ['core'] },
      { from: 'charts', allow: ['core'] },
      { from: 'hooks', allow: ['core', 'data'] },
      { from: 'ui', allow: ['core', 'charts', 'hooks'] },
      { from: 'azure', allow: ['core', 'charts', 'hooks', 'ui', 'data'] },
      { from: 'pwa', allow: ['core', 'charts', 'hooks', 'ui', 'data'] },
    ],
  }],
}
```

### AI layer compatibility

Fully compatible. The AI callback injection pattern (`fetchNarration`, `fetchChartInsight` passed as callbacks from Azure → hooks) doesn't create import violations — the plugin checks import paths, not runtime callbacks. The intentional split (tool definitions in core, handlers in Azure) is expressed as `from: 'azure', allow: ['core']`.

### Recommendation: **P2 — Add in a follow-up session**

Low effort, high value. Makes ADR-045 rules enforceable in CI. Add to the root ESLint config.

---

## Pattern 3: Domain Events for Cross-Store Communication

### Problem

12 explicit cross-store calls create implicit ordering dependencies:

| Caller                     | Target      | Calls | Pattern                                        |
| -------------------------- | ----------- | ----- | ---------------------------------------------- |
| findingsOrchestration      | panelsStore | 4     | `setFindingsOpen(true)` after creating finding |
| investigationOrchestration | panelsStore | 2     | `setWhatIfOpen(true)` for projection           |
| useToolHandlers            | panelsStore | 6     | AI `navigate_to` tool opens panels             |

### Solution options

| Library                | Size         | Type safety     | Notes                                        |
| ---------------------- | ------------ | --------------- | -------------------------------------------- |
| **mitt**               | 200 bytes    | Generic typed   | Zero-dep, most popular                       |
| **Zustand middleware** | 0 (built-in) | Via subscribe   | Inversion — listeners react to store changes |
| **Custom bus**         | ~30 lines    | Full TypeScript | No dependency, project-specific event types  |

### AI layer impact

AI tool execution is the **highest-coupling point**: `useToolHandlers` makes 6+ cross-store calls when processing tool results. Domain events would decouple the tool handler from knowing which panels to open. However:

- Tool handlers need **synchronous results** for the tool loop (feed result back to LLM)
- Only the **side effects** (panel opening, highlighting) could be async events
- The 6 calls are concentrated in one file, not scattered

### Why defer

- 12 calls is manageable without indirection
- Event buses add debugging complexity (implicit flow vs explicit calls)
- Single developer doesn't benefit from team-boundary decoupling
- React DevTools and Zustand DevTools trace store mutations; event bus requires separate tooling

### Recommendation: **Defer to Q3 2026**

Revisit when cross-store calls exceed ~30 or feature count exceeds ~10. Document the threshold in ADR-045 (already done).

---

## Paradigm Comparison: Signals vs Event-Driven + Strategy

### Why this comparison matters

Signals (Preact Signals, SolidJS, Angular 20, Vue 4) represent a fundamental paradigm shift — fine-grained reactivity at the value level, not the component level. VariScout could theoretically migrate to signals for better rendering performance.

### Evaluation for VariScout

| Concern               | Signals approach                 | VariScout already has                   |
| --------------------- | -------------------------------- | --------------------------------------- |
| Fine-grained updates  | Signal tracks → DOM update       | React Compiler auto-memoization         |
| Bundle size           | ~30KB (Solid) vs ~72KB (React)   | Not a concern (offline PWA, cached)     |
| Reactive derivations  | Computed signals auto-track deps | useMemo + Web Worker pipeline           |
| Store subscriptions   | Auto-track reads                 | Zustand selectors (equivalent)          |
| Re-render elimination | No virtual DOM diffing           | React Compiler skips unchanged subtrees |

**Benchmark context (2026):** SolidJS: 42.8 ops/s, React 19 + Compiler: 28.4 ops/s. The gap exists but VariScout's bottleneck is stats computation (Web Worker), not rendering.

### Migration cost analysis

| Factor            | Signals                                      | Event-Driven + Strategy                                    |
| ----------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Files affected    | All (~400+)                                  | 8-15 files                                                 |
| Libraries changed | React → Preact/Solid (or experimental addon) | Zero new deps (strategy) or mitt ~200B (events)            |
| React Compiler    | Lost (not compatible with signals addons)    | Preserved                                                  |
| Zustand stores    | Rewritten                                    | Unchanged                                                  |
| Testing           | All tests rewritten                          | Strategy: new tests for strategies. Events: listener tests |
| Risk              | Revolutionary (could break everything)       | Evolutionary (additive, incremental)                       |

### Verdict

**Signals are a lateral move for VariScout.** React Compiler + Zustand selectors already deliver 90% of signals' benefit. The remaining 10% (no virtual DOM) doesn't matter when the bottleneck is stats computation, not rendering. Migration cost is massive with zero net benefit.

**Event-Driven + Strategy is the high-value evolution.** Strategy pattern eliminates 37 nested ternaries and makes new analysis modes additive (one file, not eight). Event bus is a future option for when coupling grows. Both patterns are incremental, low-risk, and preserve all existing infrastructure.

---

## Adoption Roadmap (Updated Mar 23)

**Decision:** Adopt full event-driven architecture alongside strategy pattern. Domain events promoted from P3 to P1.

| Priority | Pattern               | When          | Effort | Impact                                    |
| -------- | --------------------- | ------------- | ------ | ----------------------------------------- |
| **P1a**  | Domain events (full)  | Next session  | Medium | Decouples all 12+ cross-store calls       |
| **P1b**  | Strategy pattern      | With events   | Medium | Eliminates 37 ternaries, extensible modes |
| **P2**   | ESLint boundaries     | Follow-up     | Low    | Makes ADR-045 rules CI-enforceable        |
| **P1c**  | ReportView extraction | After P1a+P1b | Medium | Applies both patterns to biggest file     |
| **Skip** | Signals migration     | Not planned   | High   | Lateral move, no net benefit              |

### Event-Driven Design (next session scope)

Full event-driven architecture for cross-store communication:

- Typed event bus (mitt or custom ~30 lines)
- Finding lifecycle events: `finding-created`, `finding-status-changed`, `finding-resolved`
- Investigation events: `hypothesis-validated`, `projection-started`
- Panel events: `navigate-to-panel`, `focus-chart`
- AI tool events: `tool-executed` → side effects (panel open, highlight)
- All 12+ `store.getState().action()` calls replaced with `bus.emit()`
- Listeners registered in stores or side-effect hooks

---

## References

- [ADR-045: Modular Architecture](../../07-decisions/adr-045-modular-architecture.md)
- [ADR-041: Zustand Feature Stores](../../07-decisions/adr-041-zustand-feature-stores.md)
- [ADR-029: AI Action Tools](../../07-decisions/adr-029-ai-action-tools.md)
- [Common Sense Refactoring](https://alexkondov.com/refactoring-a-messy-react-component/) — Alex Kondov
- [Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) — Martin Fowler
- [Strategy Pattern in React](https://dev.to/itswillt/applying-design-patterns-in-react-strategy-pattern-enn) — DEV Community
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) — GitHub
- [DDD for Frontend Devs](https://feature-sliced.design/blog/ddd-for-frontend-devs) — Feature-Sliced Design
- [2026 Frontend Framework War](https://dev.to/linou518/2026-frontend-framework-war-signals-won-react-is-living-off-its-ecosystem-2dki) — DEV Community
