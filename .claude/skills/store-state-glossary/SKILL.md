---
name: "Store State Glossary"
description: "Use when you need to know what state lives in which Zustand store before reading or mutating store state. Covers the 7 stores across 3 layers (Document ×3, Annotation ×3, View ×1) per ADR-078 + F4. Use before any store read/write, before dispatching actions, or when you're unsure which store owns a piece of state."
---

# Store State Glossary

## When to Use This Skill

Use before:
- Reading or writing any Zustand store field
- Dispatching a store action
- Deciding where new state should live (which layer + which store)
- Writing tests that reset store state in `beforeEach`
- Debugging state that isn't persisting / is persisting unexpectedly

## The 3-Layer Model

| Layer | Stores | Persistence | Test reset |
|---|---|---|---|
| **Document** | `useProjectStore`, `useInvestigationStore`, `useCanvasStore` | Hub repository → `.vrs` / Dexie (Azure) | Load a fresh `SerializedProject` |
| **Annotation** | `useCanvasViewportStore`, `usePreferencesStore`, `useActiveIPStore` | Dexie / idb-keyval / localStorage | Clear individually per store key |
| **View** | `useViewStore` | NONE — transient | `useViewStore.setState(useViewStore.getInitialState())` |

**Portability test**: Would another analyst importing this hub need this state? Yes → Document. Survives reload but not portable → Annotation. Doesn't survive reload → View.

## Quick Field Reference

### Document — `useProjectStore` (dataset + config)
- `rawData` — all parsed rows
- `outcome` — selected Y column
- `factors` — selected X columns
- `specs` / `measureSpecs` — spec limits (per-outcome and per-column)
- `analysisMode` — `'standard' | 'performance' | 'yamazumi' | 'defect'` (never `'capability'` — that's a `ResolvedMode`)
- `filters` — active row-level filters
- `subgroupConfig` — n for subgrouping (default n=5+ for capability)
- `dataQualityReport` — parse-time report

### Document — `useInvestigationStore` (findings + hypotheses)
- `findings` — pinned observations (`FindingSource` discriminated union; always narrow before accessing)
- `questions` — investigation question tree (max depth 3, max 8 children per parent)
- `hypotheses` — `SuspectedCause` entities; `selectedForImprovement: true` triggers HMW brainstorm
- `causalLinks` — directed causal graph edges (cycle-guarded via `wouldCreateCycle()`)
- `problemContributionTree` — AND-gate tree for the Wall (highlights in `useViewStore`)

### Document — `useCanvasStore` (FRAME / Process Hub canvas)
- `canonicalMap` — the process map (nodes = steps, edges = connections)
- `outcomes` / `primaryScopeDimensions` — hub outcome specs
- `undoStack` / `redoStack` — undo history (cap 50)

### Annotation — `useCanvasViewportStore` (per-hub viewport, Dexie)
- `viewMode` — `'map' | 'wall'`
- `viewports` — per-hub zoom + pan + level state (call `rehydrateCanvasViewport(hubId)` on hub open)
- `selection` — selected canvas nodes
- `chartClusters` — positioned chart clusters on the Wall

### Annotation — `usePreferencesStore` (per-user, idb-keyval)
- `activeView` — workspace tab: `'dashboard' | 'frame' | 'analysis' | 'investigation' | 'improvement' | 'report'`
- `piActiveTab` — PI panel tab: `'stats' | 'questions' | 'journal'`
- `aiEnabled` — user AI feature toggle (Azure only)
- `timeLens` — active time lens selection
- `riskAxisConfig` / `budgetConfig` — improvement matrix config

### Annotation — `useActiveIPStore` (per-hub per-user, localStorage)
- `activeIPs` — map of `variscout:activeIP:{hubId}:{userId}` → `{ ipId, setAt }`

### View — `useViewStore` (transient, no persist)
- `highlightRowIndex` / `highlightedChartPoint` — bidirectional chart↔table highlight
- `highlightedFindingId` — finding nav highlight
- `focusedQuestionId` — Wall question focus
- `pendingChartFocus` — set by CoScout `navigate_to` tool
- `selectedPoints` / `selectionIndexMap` — Minitab-style brushing selection
- `isDataTableOpen` — data table modal state
- `improvementActiveView` — `'plan' | 'track'`

## Hard Rules

- **Selectors required**: `useProjectStore(s => s.field)` — never bare `useStore()`.
- **No DataContext** (ADR-041).
- **Document stores never import Dexie** (ESLint P7.2). R12 exception: `canvasViewportStore.ts` (separate Dexie DB for cross-app viewport state).
- **Cross-store imperative calls are OK; reactive subscriptions between stores are forbidden**.
- **Deleted stores**: `useSessionStore` + `useImprovementStore` were deleted in F4. Never re-introduce.

## Full Glossary

Complete field-level documentation (all 7 stores with types, persistence details, key actions, boundary notes):

`docs/agent-context/store-state-glossary.md`

Read that doc when you need the full type signatures, persistence mechanisms, or the rationale for a specific field.

## Related

- `packages/stores/CLAUDE.md` — authoritative one-page summary
- ADR-078 — architecture alignment (same stores, gated tiers)
- ADR-064 — `SuspectedCause` as first-class entity
- `writing-tests` skill — Zustand test reset patterns (`beforeEach` + `getInitialState()`)
