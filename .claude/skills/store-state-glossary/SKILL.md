---
name: "Store State Glossary"
description: "Use when you need to know what state lives in which Zustand store before reading or mutating store state. Covers the 9 stores across 3 layers (Document ×4, Annotation ×3 — 1 per-hub + 2 per-user, View ×2) per ADR-078 + F4 (activeIPStore deleted in the Workspace migration, W3/PR #358). Use before any store read/write, before dispatching actions, or when you're unsure which store owns a piece of state."
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
| **Document** | `useProjectStore`, `useInvestigationStore`, `useCanvasStore`, `useImprovementProjectStore` | Hub repository → `.vrs` / Dexie (Azure) | Load a fresh `SerializedProject` |
| **Annotation** | `useCanvasViewportStore` (per-hub), `usePreferencesStore`, `useActiveIPStore`, `useProjectMembershipStore` (per-user) | Dexie / idb-keyval / localStorage | Clear individually per store key |
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

### Document — `useImprovementProjectStore` (V1 user-facing Project entity)
- The wedge V1 top-level user-facing unit. **Multiple Projects per user** (Charter ceremony per spec §3.0); **each Project wraps one internal `ProcessHub` 1:1**. Hub is internal/demoted; multi-Hub orchestration is deferred to VariScout Process (future product), NOT V1.
- `projectsByHub: Record<ProcessHubId, ImprovementProject[]>` — current shape; **migration-in-progress per wedge spec §6** (re-keying `ProcessHubId` → `ProjectId` for project-scoped state). The `Record` shape is a legacy holdover; V1 reality is 1 Hub → 1 Project.
- Code entity name is `ImprovementProject` (kept for backward compat); user-facing label is "Project". `metadata.members?: ProjectMember[]` carries Lead/Member/Sponsor roles per spec §4.1.
- Key actions: `setProjectsForHub(hubId, projects)`, `getProjectsForHub(hubId)`, `upsertProject(project)`, `removeProject(projectId)`

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

### Annotation — `useProjectMembershipStore` (per-user, localStorage; wedge V1)
- `pendingInvites: Invitation[]` — invitations awaiting acceptance (in-app side of wedge V1 invitation UX). Accepted invites cascade into `ImprovementProject.members` via `useImprovementProjectStore` (membership data lives on the IP record, not here).
- Key actions: `addPendingInvite(inv)`, `acceptInvite(id)`, `revokeInvite(id)`

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
- **Renamed / deleted stores**: `useSessionStore` was deleted in F4 (durable half → `usePreferencesStore`; transient half → `useViewStore`). `useImprovementStore` was renamed to `useImprovementProjectStore` post-wedge-V1 with a new IP-scoped data shape; do not re-introduce the old name.

## Full Glossary

Complete field-level documentation (all 9 stores with types, persistence details, key actions, boundary notes):

`docs/agent-context/store-state-glossary.md`

Read that doc when you need the full type signatures, persistence mechanisms, or the rationale for a specific field.

## Related

- `packages/stores/CLAUDE.md` — authoritative one-page summary
- ADR-078 — architecture alignment (same stores, gated tiers)
- ADR-064 — `SuspectedCause` as first-class entity
- `writing-tests` skill — Zustand test reset patterns (`beforeEach` + `getInitialState()`)
