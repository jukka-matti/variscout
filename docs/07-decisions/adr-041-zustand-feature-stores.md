---
title: 'ADR-041: Zustand Feature Stores'
---

# ADR-041: Zustand Feature Stores

**Status:** Accepted
**Date:** 2026-03-22

## Context

The Azure app's `Editor.tsx` had grown into a 1,963-line god component that instantiated 25+ hooks and threaded 40+ props through to child components. This created several problems:

1. **Prop drilling** — Feature modules (findings, investigation, improvement, AI) received 8-15 props each, making refactoring risky and code reviews difficult.

2. **Re-render scope** — Any state change in Editor triggered re-renders across unrelated feature modules because all state was lifted to the same component.

3. **React Context limitations** — React Context was evaluated as an alternative but rejected because it broadcasts to all consumers on any change. A Context holding 40+ values would cause unnecessary re-renders across the entire tree.

4. **Industry consensus (2025-2026)** — The React ecosystem has converged on Zustand for feature-domain state management. It provides selector-based subscriptions (components only re-render when their selected slice changes), minimal API surface, and ~1KB bundle cost.

## Decision

Adopt **Zustand stores per feature domain** in the Azure app:

| Store                | Domain                      | Key State                                                                      |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------ |
| `panelsStore`        | Panel visibility & layout   | isFindingsOpen, isCoScoutOpen, isDataPanelOpen, highlightRowIndex, etc.        |
| `findingsStore`      | Findings read-side state    | findings[], highlightedFindingId, chartFindings (grouped by chart type)        |
| `investigationStore` | Investigation UI state      | hypotheses[], hypothesesMap, ideaImpacts, projectionTarget                     |
| `improvementStore`   | Improvement workspace state | improvementHypotheses, selectedIdeaIds, projectedCpkMap, convertedIdeaIds      |
| `aiStore`            | AI/CoScout UI state         | narration, coscoutMessages, suggestedQuestions, actionProposals, providerLabel |

### Architecture principles

- **DataContext stays as React Context** — The core data pipeline (parsed data, stats, specs, filters) changes infrequently and is consumed by nearly every component. React Context remains the right tool for this low-frequency, broadly-consumed state.

- **Stores hold read-side state** — Zustand stores manage UI state (panel visibility, selection, view modes). They do not replace the shared hooks from `@variscout/hooks` which remain the CRUD engines for domain logic (findings, hypotheses, AI conversations).

- **Orchestration hooks sync to stores** — Thin `useEffect` hooks in feature modules sync relevant state from shared hooks into stores, keeping the store API simple and the shared hooks unchanged.

- **Feature modules in `features/` directory** — Each feature domain (findings, investigation, improvement, AI, data-flow) gets its own directory under `apps/azure/src/features/` with clear boundaries and local component composition.

- **Cross-store access via `getState()`** — When one feature needs state from another (e.g., AI needs the selected finding), it calls `otherStore.getState()` directly. This replaces provider ordering dependencies with explicit, traceable data access.

## Consequences

### Positive

- **Editor.tsx reduced from 1,963 to 1,085 lines** — Feature-specific state and wiring moved to feature modules and stores.
- **Eliminated read-side prop drilling** — Components use `useStore(selector)` to access state directly without intermediate prop threading. Orchestration callbacks (action handlers that depend on DataContext) remain as props — an architectural constraint of hook-based composition.
- **Granular re-renders** — Zustand's selector-based subscriptions mean components only re-render when their specific slice of state changes.
- **Clear feature boundaries** — The `features/` directory makes ownership and dependencies between feature modules explicit.
- **Testable in isolation** — Stores can be tested by calling actions and asserting state, without rendering components.

### Negative

- **~1.1KB bundle addition** — Zustand adds a small runtime dependency to the Azure app.
- **Two state paradigms** — Developers must understand when to use React Context (data pipeline) vs Zustand stores (feature UI state).
- **Store proliferation risk** — Without discipline, stores could fragment state across too many small slices. The 5-store model should be treated as a ceiling, not a starting point.

### Store co-location (implemented)

Stores have been moved from `apps/azure/src/stores/` into their respective `apps/azure/src/features/*/` directories following Feature-Sliced Design. Each feature module (findings, investigation, improvement, AI, panels) owns its store alongside its components and wiring. The separate `stores/` directory no longer exists.

### Migration path

- PWA app retains its simpler architecture (fewer features, no investigation/improvement). Zustand adoption is Azure-only for now.
- Shared hooks in `@variscout/hooks` are unchanged — no migration needed for the packages layer.

### Bridge Hook Pattern

React hooks that watch Zustand stores and notify DataContext for persistence.

**Why:** DataContext holds the full AnalysisState blob (rawData, filters, specs, findings, etc.) and manages project-level persistence to IndexedDB/OneDrive. Zustand stores hold transient UI state (panel visibility, highlights, focused charts). When UI state changes that should persist across sessions, a bridge hook watches the Zustand store via selectors and calls DataContext's `setViewState()` to merge the partial update into the full project state.

**Current instances:**

- `usePanelsPersistence` — watches `isFindingsOpen`, `isWhatIfOpen`, `activeView` from panelsStore (ADR-055: `isImprovementOpen` replaced by `activeView: 'improvement'`)

**Pattern:**

```typescript
export function usePanelsPersistence(
  onViewStateChange?: (partial: Partial<ViewState>) => void
): void {
  const field = usePanelsStore(s => s.field);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onViewStateChange?.({ field });
  }, [field, onViewStateChange]);
}
```

**When to generalize:** If 3+ bridge hooks are needed, extract a `useStorePersistence(store, selector, onPersist)` utility.

**When event-driven persistence makes sense:** When persistence moves out of React Context into a standalone service (e.g., server-side API backend or real-time collaboration with CRDT).

## Architectural Validation (Mar 2026)

### DataContext as React Context — Validated

The decision to keep DataContext as React Context (not migrate to Zustand) was validated against 2025-2026 ecosystem consensus:

- **React team position:** Context is a dependency injection transport, not a state management tool. React has intentionally not added selector support to Context (Dan Abramov, Mark Erikson).
- **React Compiler does not fix Context re-renders.** The compiler auto-memoizes component bodies but cannot prevent Context propagation (Nadia Makarevich, testing across three production apps: compiler fixed only 2/10 re-render cases).
- **VariScout is in the safe zone:** DataContext updates at human speed (seconds, not animation frames), stats computation is off-thread via Web Worker, `startTransition` wraps filter updates, and high-frequency UI state is already in Zustand.
- **Rule going forward:** New rapidly-changing state always goes to Zustand. DataContext stays as the data pipeline container. Do not add state updating at >1Hz to DataContext.

### Navigation Without Router — Validated

The decision to use state-driven navigation (`panelsStore.activeView`) instead of React Router was validated:

- **Teams embedding favors state-driven navigation:** No URL bar visible, `subPageId` is a string (not a path), 2048 character limit on deep links, no browser history participation, session loss on tab switch.
- **Comparable workspace apps** (Figma, Notion, Linear) use state-driven navigation for within-editor views.
- **Re-evaluate when any two become true:** >6 independent top-level views, route-level code splitting needed, public-facing SSR needed, back/forward browser navigation required, app stops being Teams-embedded.

## Related Decisions

- [ADR-045: Modular Architecture](adr-045-modular-architecture.md) — broader DDD-lite architecture context
- [ADR-046: Event-Driven Architecture](adr-046-event-driven-architecture.md) — event bus evaluation; superseded, `getState()` calls retained
- [ADR-047: Analysis Mode Strategy Pattern](adr-047-analysis-mode-strategy.md) — strategy fields for AI tool sets not yet consumed by stores
- [Store Interactions](../05-technical/architecture/store-interactions.md) — cross-store dependency graph and coupling analysis
