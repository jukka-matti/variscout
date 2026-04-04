---
title: Zustand Store Interaction Graph
audience: [developer]
category: architecture
status: stable
related: [zustand, feature-stores, adr-041, state-management]
---

# Zustand Store Interactions

The app uses Zustand stores at two layers (ADR-041, evolved Apr 2026):

1. **`@variscout/stores` — 4 domain stores** — source of truth for all analytical data, findings, and project state. Shared across PWA and Azure.
2. **Azure feature stores (`apps/azure/src/features/*/`)** — 5 stores for Azure-specific UI state (panel visibility, highlights, AI conversation).

DataContext and useStoreSync have been deleted. Components import directly from `@variscout/stores` via selectors and compose computed state from derived hooks in `@variscout/hooks`.

## Architecture Overview

```
DOMAIN STORES (@variscout/stores) — source of truth
  useProjectStore        → raw data, config, project lifecycle
  useInvestigationStore  → findings, questions, hubs, categories
  useSessionStore        → UI prefs, AI config (auto-persist)
  useImprovementStore    → ephemeral workspace state

        |
        v

DERIVED HOOKS (@variscout/hooks) — computed state
  useFilteredData, useAnalysisStats, useStagedAnalysis,
  usePerformanceAnalysis, useYDomain, useSpecsForMeasure

        |
        v

AZURE FEATURE STORES (apps/azure/src/features/*/)
  panelsStore            → panel visibility & layout
  findingsStore          → findings read-side UI state
  investigationStore     → investigation UI state (feature)
  improvementStore       → improvement workspace UI state (feature)
  aiStore                → CoScout, narration, action proposals

  — Orchestration hooks sync from shared hooks → feature stores

        |
        v

COMPONENTS — compose from stores + derived hooks
```

## Store Dependency Graph

```mermaid
graph TD
    subgraph "Domain Stores (@variscout/stores)"
        PRS[useProjectStore<br/><i>data, config, project lifecycle</i>]
        INS[useInvestigationStore<br/><i>findings, questions, hubs</i>]
        SES[useSessionStore<br/><i>UI prefs, AI config</i>]
        IMP[useImprovementStore<br/><i>ephemeral workspace</i>]
    end

    subgraph "Derived Hooks (@variscout/hooks)"
        DH[useFilteredData<br/>useAnalysisStats<br/>useStagedAnalysis<br/>usePerformanceAnalysis<br/>useYDomain / useSpecsForMeasure]
    end

    subgraph "Azure Feature Stores"
        PS[panelsStore<br/><i>UI visibility, layout</i>]
        FS[findingsStore<br/><i>findings UI state</i>]
        IS[investigationStore (feature)<br/><i>investigation UI state</i>]
        IMS[improvementStore (feature)<br/><i>improvement workspace</i>]
        AS[aiStore<br/><i>CoScout, narration</i>]
    end

    subgraph "Orchestration Hooks"
        FO[useFindingsOrchestration]
        IO[useInvestigationOrchestration]
        IMO[useImprovementOrchestration]
        AO[useAIOrchestration]
        TH[useToolHandlers]
        PSE[usePanelsSideEffects]
    end

    subgraph "Page Layer"
        ED[Editor.tsx]
        PD[ProjectDashboard.tsx]
        EDV[EditorDashboardView.tsx]
    end

    PRS --> DH
    INS --> DH
    SES --> DH
    IMP --> DH

    DH --> FO
    DH --> IO
    DH --> IMO
    DH --> AO

    FO -->|syncFindings, setHighlightedFindingId| FS
    FO -->|setFindingsOpen| PS
    IO -->|syncHypotheses, syncHypothesesMap, syncIdeaImpacts, setProjectionTarget| IS
    IO -->|setWhatIfOpen| PS
    IMO -->|syncState| IMS
    AO -->|syncNarration, syncCoScoutMessages, syncSuggestedQuestions, syncActionProposals, syncAIContext, syncKnowledgeSearch, ...| AS
    PSE -->|setHighlightPoint| PS

    TH -->|navigate_to: showDashboard, showAnalysis, showInvestigation, showImprovement, showReport, setCoScoutOpen, setPendingChartFocus| PS
    TH -->|navigate_to: setHighlightedFindingId| FS
    TH -->|navigate_to: expandToHypothesis| IS

    ED -.->|selector reads| PRS
    ED -.->|selector reads| INS
    ED -.->|selector reads| PS
    ED -.->|selector reads| FS
    ED -.->|selector reads| IS
    ED -.->|selector reads| IMS
    ED -.->|selector reads| AS

    EDV -.->|selector reads| PS
    EDV -.->|selector reads| FS
    EDV -.->|selector reads| IS
    EDV -.->|selector reads| IMS

    PD -.->|selector reads| AS

    style PRS fill:#e0f2fe,stroke:#0284c7
    style INS fill:#ede9fe,stroke:#7c3aed
    style SES fill:#f0fdf4,stroke:#16a34a
    style IMP fill:#dcfce7,stroke:#16a34a
    style PS fill:#e0f2fe,stroke:#0284c7
    style FS fill:#fef3c7,stroke:#d97706
    style IS fill:#ede9fe,stroke:#7c3aed
    style IMS fill:#dcfce7,stroke:#16a34a
    style AS fill:#fce7f3,stroke:#db2777
```

## Cross-Store Writes via Orchestration Hooks

These are the only places where code in one feature domain writes to a store owned by another feature domain. All go through orchestration hooks (never store-to-store).

| Source File                        | Writes To                      | Action(s) Called                                                                                                                                                                                                                                                    | Purpose                                                                   |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `useFindingsOrchestration.ts`      | `panelsStore`                  | `setFindingsOpen(true)`                                                                                                                                                                                                                                             | Open findings panel when pinning or observing a finding                   |
| `useFindingsOrchestration.ts`      | `findingsStore`                | `syncFindings()`, `setHighlightedFindingId()`                                                                                                                                                                                                                       | Sync CRUD state from `useFindings` hook; highlight newly created findings |
| `useInvestigationOrchestration.ts` | `panelsStore`                  | `setWhatIfOpen(true)`, `setWhatIfOpen(false)`                                                                                                                                                                                                                       | Open/close What-If panel for idea projection round-trip                   |
| `useInvestigationOrchestration.ts` | `investigationStore` (feature) | `syncHypotheses()`, `syncHypothesesMap()`, `syncIdeaImpacts()`, `setProjectionTarget()`                                                                                                                                                                             | Sync hypothesis CRUD state and computed display data                      |
| `useImprovementOrchestration.ts`   | `improvementStore` (feature)   | `syncState()`                                                                                                                                                                                                                                                       | Bulk sync computed improvement workspace data                             |
| `useAIOrchestration.ts`            | `aiStore`                      | `syncNarration()`, `syncCoScoutMessages()`, `syncSuggestedQuestions()`, `syncAIContext()`, `setProviderLabel()`, `setKbPermissionWarning()`, `setResolvedChannelFolderUrl()`, `setKnowledgeSearchScope()`, `setKnowledgeSearchTimestamp()`, `syncKnowledgeSearch()` | Sync all AI-derived state from composed hooks                             |
| `teamToolHandlers.ts`              | `panelsStore`                  | `showDashboard()`, `showAnalysis()`, `showInvestigation()`, `showImprovement()`, `setCoScoutOpen()`, `showReport()`, `setPendingChartFocus()` (ADR-055)                                                                                                             | `navigate_to` tool handler navigates to workspaces                        |
| `teamToolHandlers.ts`              | `findingsStore`                | `setHighlightedFindingId()`                                                                                                                                                                                                                                         | `navigate_to` tool highlights target finding                              |
| `teamToolHandlers.ts`              | `investigationStore` (feature) | `expandToHypothesis()`                                                                                                                                                                                                                                              | `navigate_to` tool scrolls to target hypothesis                           |
| `usePanelsSideEffects.ts`          | `panelsStore`                  | `setHighlightPoint(null)`                                                                                                                                                                                                                                           | Auto-clear chart highlight after 2-second timeout                         |

## Cross-Store Reads via Page/Component Layer

Components subscribe to domain stores and feature stores via selectors. This is the intended consumption pattern — components compose state from whichever stores they need.

| Component                 | Reads From                     | Fields Read                                                                                                                                                                                                                | Purpose                                               |
| ------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `Editor.tsx`              | `useProjectStore`              | `rawData`, `config`, `specs`                                                                                                                                                                                               | Data pipeline, project config                         |
| `Editor.tsx`              | `useInvestigationStore`        | `findings`, `questions`, `hubs`, `categories`                                                                                                                                                                              | Investigation state                                   |
| `Editor.tsx`              | `panelsStore`                  | `activeView`, `isFindingsOpen`, `isCoScoutOpen`, `isWhatIfOpen`, `isStatsSidebarOpen`, `pendingChartFocus` (ADR-055: `isImprovementOpen` removed; `isReportOpen`/`isPresentationMode` removed — Report is a workspace tab) | Workspace routing, panel visibility                   |
| `Editor.tsx`              | `findingsStore`                | `highlightedFindingId`, `setHighlightedFindingId`                                                                                                                                                                          | Finding highlight state for sidebar                   |
| `Editor.tsx`              | `investigationStore` (feature) | `projectionTarget`                                                                                                                                                                                                         | What-If round-trip: pre-populate projection from idea |
| `Editor.tsx`              | `improvementStore` (feature)   | `improvementHypotheses`, `improvementLinkedFindings`, `selectedIdeaIds`, `convertedIdeaIds`                                                                                                                                | Improvement workspace props                           |
| `Editor.tsx`              | `aiStore`                      | `pendingDashboardQuestion`                                                                                                                                                                                                 | Pre-fill CoScout from project dashboard quick-ask     |
| `EditorDashboardView.tsx` | `panelsStore`                  | `isFindingsOpen`, `isCoScoutOpen`, `isDataPanelOpen`, `isDataTableOpen`, `highlightRowIndex`, `highlightedChartPoint`                                                                                                      | Dashboard layout, data panel                          |
| `EditorDashboardView.tsx` | `findingsStore`                | `highlightedFindingId`, `setHighlightedFindingId`                                                                                                                                                                          | Finding highlight in dashboard context                |
| `EditorDashboardView.tsx` | `investigationStore` (feature) | `hypothesesMap`, `ideaImpacts`                                                                                                                                                                                             | Hypothesis display data for finding cards             |
| `EditorDashboardView.tsx` | `improvementStore` (feature)   | `projectedCpkMap`, `improvementLinkedFindings`                                                                                                                                                                             | Projected Cpk badges on finding cards                 |
| `ProjectDashboard.tsx`    | `aiStore`                      | `narration`, `setPendingDashboardQuestion`                                                                                                                                                                                 | Show AI summary, queue question for CoScout           |

## Store Isolation Summary

| Store                          | Layer         | Direct Cross-Store Imports | Written By (orchestration)                                                                                            | Read By (components)                    |
| ------------------------------ | ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `useProjectStore`              | Domain        | None                       | App lifecycle (project load/save), user actions                                                                       | `Editor.tsx`, derived hooks             |
| `useInvestigationStore`        | Domain        | None                       | App lifecycle, user actions (findings/questions/hubs)                                                                 | `Editor.tsx`, derived hooks             |
| `useSessionStore`              | Domain        | None                       | App startup, user preference changes                                                                                  | Derived hooks, settings components      |
| `useImprovementStore` (domain) | Domain        | None                       | Improvement workspace actions                                                                                         | Derived hooks                           |
| `panelsStore`                  | Azure Feature | None                       | `useFindingsOrchestration`, `useInvestigationOrchestration`, `teamToolHandlers`, `usePanelsSideEffects`, `Editor.tsx` | `Editor.tsx`, `EditorDashboardView.tsx` |
| `findingsStore`                | Azure Feature | None                       | `useFindingsOrchestration`, `teamToolHandlers`                                                                        | `Editor.tsx`, `EditorDashboardView.tsx` |
| `investigationStore` (feature) | Azure Feature | None                       | `useInvestigationOrchestration`, `teamToolHandlers`                                                                   | `Editor.tsx`, `EditorDashboardView.tsx` |
| `improvementStore` (feature)   | Azure Feature | None                       | `useImprovementOrchestration`                                                                                         | `Editor.tsx`, `EditorDashboardView.tsx` |
| `aiStore`                      | Azure Feature | None                       | `useAIOrchestration`                                                                                                  | `Editor.tsx`, `ProjectDashboard.tsx`    |

## Guidelines

### No Direct Store-to-Store Dependencies

Stores must never import or call `getState()` on another store. This is the current state of the codebase and must be preserved. Direct store-to-store reads would create hidden coupling and make stores difficult to test in isolation.

### No Dependency Cycles

The dependency graph must remain a DAG (directed acyclic graph). Currently, no cycles exist because:

- Domain stores have zero outbound dependencies on other stores.
- Azure feature stores have zero outbound dependencies on domain stores or each other.
- Orchestration hooks write to their own feature store plus `panelsStore` (the shared UI coordinator), but never form circular write chains.

### Use Orchestration Hooks for Cross-Store Coordination

When an action in one domain needs to affect another domain's store, route it through an orchestration hook rather than adding a direct store import. For example, `useFindingsOrchestration` opens the findings panel via `usePanelsStore.getState().setFindingsOpen(true)` rather than having `findingsStore` call `panelsStore` internally.

### panelsStore Is the UI Coordinator

`panelsStore` is the most widely written-to store because it owns panel visibility, which multiple workflows need to control (e.g., opening findings panel after creating a finding, opening What-If for idea projection). This is by design — it acts as a shared UI coordination layer.

### useToolHandlers Is the Cross-Store Bridge for AI

`useToolHandlers` composes three handler modules: `readToolHandlers` (7 data tools), `actionToolHandlers` (7 proposal tools), and `teamToolHandlers` (`navigate_to` + 3 team-only tools). Only `teamToolHandlers` reads/writes stores (`panelsStore`, `findingsStore`, `investigationStore`) — the other two modules are pure functions with no store access. This is intentional: the `navigate_to` AI tool must be able to navigate to any part of the UI, and the team tools need store access for sharing. The handler module split keeps store coupling isolated to one file.

### Component Reads Are Free

Components subscribing to multiple stores via selectors is the normal Zustand pattern. No restrictions apply — components should read from whatever stores they need. The key constraint is on **writes**, which must go through orchestration hooks.

### Domain Stores Are the Authority

`@variscout/stores` domain stores (`useProjectStore`, `useInvestigationStore`, `useSessionStore`, `useImprovementStore`) are the source of truth for all analytical and investigation data. Azure feature stores hold derived/mirrored UI state only. When data conflicts, the domain store wins.

### Testing Stores in Isolation

Each store can be tested independently by calling actions and asserting state, without mocking other stores. Cross-store interactions are tested at the orchestration hook level. See `features/panels/__tests__/panelsStore.test.ts` for the Azure feature store reference pattern. See `packages/stores/src/__tests__/` for domain store tests.

## Cross-Store Coordination Pattern

Orchestration hooks are the designated coordination layer for cross-store interactions. They use direct `getState()` calls, which is the Zustand-recommended pattern for cross-store communication (per maintainer guidance).

```typescript
// useFindingsOrchestration.ts — explicit, traceable cross-store calls
usePanelsStore.getState().setFindingsOpen(true);
useFindingsStore.getState().setHighlightedFindingId(finding.id);
```

**Why direct calls, not an event bus:** An event bus (ADR-046, superseded) was implemented and evaluated. At 5 stores / 9 cross-store interactions, direct calls provide better traceability ("Go to Definition" works, stack traces are clear) without the indirection cost of events. See [ADR-046](../../07-decisions/adr-046-event-driven-architecture.md) for the full evaluation.

### How to Add a Cross-Store Side Effect

When a domain action in one feature needs to trigger a side effect in another feature's store:

**Step 1:** Identify the orchestration hook that owns the triggering action.

| Action                      | Orchestration Hook              |
| --------------------------- | ------------------------------- |
| Finding created/pinned      | `useFindingsOrchestration`      |
| Hypothesis linked           | `useInvestigationOrchestration` |
| AI tool navigation          | `teamToolHandlers`              |
| Improvement idea projection | `useInvestigationOrchestration` |

**Step 2:** Add the `getState()` call in the orchestration hook:

```typescript
// In useFindingsOrchestration.ts
const handlePinFinding = useCallback(() => {
  const newFinding = findingsState.addFinding(text, context);

  // Cross-store side effect: open findings panel + highlight
  usePanelsStore.getState().setFindingsOpen(true);
  useFindingsStore.getState().setHighlightedFindingId(newFinding.id);

  return newFinding;
}, [findingsState]);
```

**Step 3:** Test the side effect in the orchestration hook's test file (not in the store test).

### Anti-Patterns

| Don't                                       | Do Instead                                        |
| ------------------------------------------- | ------------------------------------------------- |
| `bus.emit('finding:created')`               | Direct `getState()` call in orchestration hook    |
| Call `getState()` from a component          | Call from orchestration hook, pass result as prop |
| `storeA.subscribe(() => storeB.setState())` | Direct `getState()` call (avoids infinite loops)  |
| Import stores in other stores               | Keep stores independent; coordinate via hooks     |
| Read domain store state from feature store  | Feature stores hold UI-only derived state         |
