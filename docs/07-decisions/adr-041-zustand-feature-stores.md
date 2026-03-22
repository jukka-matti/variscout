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

### Migration path

- PWA app retains its simpler architecture (fewer features, no investigation/improvement). Zustand adoption is Azure-only for now.
- Shared hooks in `@variscout/hooks` are unchanged — no migration needed for the packages layer.
