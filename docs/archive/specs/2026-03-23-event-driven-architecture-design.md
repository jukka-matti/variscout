---
title: Event-Driven Architecture Transition
audience: [engineer]
category: architecture
status: superseded
related: [domain-events, strategy-pattern, eslint-boundaries, zustand, mitt]
---

# Event-Driven Architecture Transition

> **Post-Implementation Review (2026-03-23):** Phase 1 (mitt event bus) was implemented, tested, and then reverted after community research found that Zustand's maintainer (dai-shi) explicitly recommends direct `getState()` calls over event buses for cross-store communication. At 5 stores / 9 interactions, orchestration hooks provide better traceability. Phase 2 (strategy pattern, ADR-047) and Phase 3 (ESLint boundaries, ADR-048) were validated and kept. See ADR-046 for full supersession rationale.

## Problem

VariScout's Azure app has 5 Zustand feature stores (ADR-041) with zero direct cross-store imports — all coordination flows through orchestration hooks. However, these hooks contain ~9 cross-store `.getState()` calls (plus ~20 self-store calls) that create implicit coupling between feature domains:

- `useFindingsOrchestration` → `panelsStore` (4 cross-store calls) + `findingsStore` (6 self-feature calls, not in migration scope)
- `useInvestigationOrchestration` → `panelsStore` (2 cross-store calls) + 7 self-store calls (normal Zustand, not in migration scope)
- `useToolHandlers` → `panelsStore`, `findingsStore`, `investigationStore` (3 cross-store calls with multi-step navigation logic)
- `usePanelsSideEffects` → DataContext persistence bridge
- Additional sync patterns via `useEffect` chains

**Scope note:** Self-store `.getState()` calls (a store accessing its own state outside React) are normal Zustand patterns and are NOT in scope for event migration. Only **cross-store** calls — where one feature domain mutates another — are replaced with events.

Separately, ~80 mode-branching ternaries across ~10 files handle analysis mode branching (`isYamazumi`, `isCapabilityMode`, `analysisMode === 'performance'`), making new mode addition require edits to all 8 files.

Package boundary rules exist by convention (ADR-045) but lack CI enforcement.

## Solution

Three reinforcing changes delivered sequentially:

1. **Phase 1 — Domain Event Bus**: Replace all cross-store `.getState()` calls with typed domain events via `mitt` (200 bytes)
2. **Phase 2 — Strategy Pattern**: Replace 37 mode ternaries with flat `resolveMode()` → strategy lookup
3. **Phase 3 — ESLint Boundaries**: Enforce package and feature isolation in CI via `eslint-plugin-boundaries`

Each phase is independently shippable and testable. Events enable clean feature boundaries before ESLint enforces them. Strategy pattern benefits from decoupled stores.

---

## Phase 1: Domain Event Bus

### Technology Choice

**mitt** (200 bytes, 14M weekly downloads). Evaluated against:

- Zustand middleware (0 bytes, but tighter Zustand coupling)
- Custom bus (~30 LOC, more control, more maintenance)

mitt wins on battle-tested reliability, tiny size, and adequate TypeScript generics.

### Architecture

```
packages/core/src/events.ts     — DomainEventMap type + createEventBus() factory
apps/azure/src/events/bus.ts    — Singleton instance + useEventBus() hook
apps/azure/src/events/listeners.ts — All listener registrations
```

The event map type lives in `@variscout/core` (importable by both apps). The singleton bus and listeners live in the Azure app (PWA doesn't need cross-store events — it uses React Context only).

### Event Catalog

#### Domain Events (7)

These model real workflow transitions from the investigation-to-action methodology.

| Event                       | Payload                                                                                       | Emitter                         | Listeners                                                           | Journey Phase                 |
| --------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------- | ----------------------------- |
| `finding:created`           | `{ finding: Finding, source?: FindingSource }`                                                | `useFindingsOrchestration`      | `panelsStore` (open findings panel), `findingsStore` (highlight)    | SCOUT                         |
| `finding:status-changed`    | `{ findingId: string, from: FindingStatus, to: FindingStatus }`                               | `useFindingsOrchestration`      | `investigationStore` (phase transition), `improvementStore` (track) | SCOUT → INVESTIGATE → IMPROVE |
| `finding:resolved`          | `{ findingId: string, outcome: FindingOutcome }`                                              | `useFindingsOrchestration`      | `improvementStore` (completion tracking)                            | IMPROVE                       |
| `hypothesis:validated`      | `{ hypothesisId: string, status: 'supported' \| 'contradicted' \| 'partial', eta2: number }`  | `useInvestigationOrchestration` | `findingsStore` (update linked findings)                            | INVESTIGATE                   |
| `hypothesis:cause-assigned` | `{ hypothesisId: string, role: 'primary' \| 'contributing', findingId: string }`              | `useInvestigationOrchestration` | `findingsStore` (suspected cause display)                           | INVESTIGATE                   |
| `idea:projection-attached`  | `{ ideaId: string, projected: { mean: number, sigma: number, cpk: number, yield?: number } }` | `useInvestigationOrchestration` | `improvementStore` (projection badge)                               | IMPROVE                       |
| `idea:converted-to-actions` | `{ ideaIds: string[], findingId: string, actions: ActionItem[] }`                             | improvement orchestration       | `findingsStore` (add actions, auto-transition)                      | IMPROVE                       |

#### UI Choreography Events (4)

Panel navigation and highlight coordination. High volume, simple payloads.

| Event                      | Payload                                                               | Emitter                                       | Listeners                                                                                          |
| -------------------------- | --------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `navigate:to`              | `{ target: NavigationTarget, targetId?: string, chartType?: string }` | `useToolHandlers`, dashboard navigation       | `panelsStore` (show view, open panels), `findingsStore` (highlight), `investigationStore` (expand) |
| `panel:visibility-changed` | `{ panel: PanelName, visible: boolean }`                              | `panelsStore`                                 | DataContext persistence bridge                                                                     |
| `highlight:finding`        | `{ findingId: string, duration?: number }`                            | `useFindingsOrchestration`, `useToolHandlers` | `findingsStore` (set highlight, auto-clear after 3s)                                               |
| `highlight:chart-point`    | `{ point: ChartPoint, duration?: number }`                            | various callbacks                             | `panelsStore` (set highlight, auto-clear after 2s)                                                 |

### AI Integration

AI action tools (ADR-029) trigger domain events through the existing proposal → CRUD path. No separate AI event layer is needed.

When a user confirms a CoScout proposal (clicks "Apply" on ActionProposalCard), the proposal handler calls the same CRUD methods (addFinding, addHypothesis, etc.) that manual actions use. Those methods emit domain events. The event bus doesn't replace the proposal confirmation step — it replaces what happens _after_ confirmation.

| AI Action Tool                                            | Domain Event Triggered                                       |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `create_finding`                                          | `finding:created`                                            |
| `create_hypothesis`                                       | `hypothesis:validated` (after auto-validation)               |
| `suggest_action`                                          | `finding:status-changed` (if first action → auto-transition) |
| `suggest_improvement_idea`                                | `idea:projection-attached` (if projection included)          |
| `navigate_to`                                             | `navigate:to`                                                |
| `apply_filter`, `clear_filters`, `switch_factor`          | No event (stays within DataContext)                          |
| `share_finding`, `publish_report`, `notify_action_owners` | Future Teams events (not in scope)                           |

### Migration Plan

**Step 1: Create event infrastructure**

- `packages/core/src/events.ts`: Define `DomainEventMap` interface with all 11 event types and payloads
- `packages/core/src/events.ts`: Export `createEventBus()` factory wrapping mitt with TypeScript generics
- `apps/azure/src/events/bus.ts`: Create singleton bus instance + `useEventBus()` React hook
- `apps/azure/src/events/listeners.ts`: Register all listeners (stores subscribe via `bus.on()`)

**Step 2: Migrate orchestration hooks (one at a time)**

1. `useFindingsOrchestration.ts` — Replace 4 cross-store `panelsStore.getState()` calls with `bus.emit()`. Highest coupling, highest impact. (6 self-feature findingsStore calls stay.)
2. `useToolHandlers.ts` — Replace 6-way `navigate_to` switch with `bus.emit('navigate:to', { target, targetId })`. Listeners in panelsStore handle the routing.
3. `useInvestigationOrchestration.ts` — Replace 2 `.getState()` calls.
4. `usePanelsSideEffects.ts` — Replace DataContext bridge with `panel:visibility-changed` event listener.
   (Deferred — this hook bridges Zustand → DataContext for persistence, not cross-store coupling. Architectural review concluded: extracting persistence from React Context adds complexity with no net benefit. See ADR-041 for bridge hook pattern.)

**Step 3: Wire listeners in stores**

- Each store subscribes to relevant events in its own `useEffect` hook or in the centralized `listeners.ts`
- Auto-clear timeouts for highlights move from orchestration hooks to event listeners

### Listener Registration Pattern

```typescript
// apps/azure/src/events/listeners.ts
import { bus } from './bus';
import { usePanelsStore } from '../features/panels/panelsStore';
import { useFindingsStore } from '../features/findings/findingsStore';

export function registerListeners() {
  bus.on('finding:created', ({ finding }) => {
    usePanelsStore.getState().setFindingsOpen(true);
    useFindingsStore.getState().setHighlightedFindingId(finding.id);
  });

  bus.on('navigate:to', ({ target, targetId }) => {
    const panels = usePanelsStore.getState();
    switch (target) {
      case 'dashboard':
        panels.showDashboard();
        break;
      case 'finding':
        panels.showEditor();
        panels.setFindingsOpen(true);
        if (targetId) useFindingsStore.getState().setHighlightedFindingId(targetId);
        break;
      // ... other targets
    }
  });

  // ... other listeners
}
```

Note: `.getState()` calls move FROM orchestration hooks TO the centralized listeners file. The coupling point is the same, but now it's:

- Visible in one file (listeners.ts)
- Triggered by typed events (traceable)
- Testable in isolation (emit event, check store state)

---

## Phase 2: Strategy Pattern

### Problem

~80 mode-branching ternaries across ~10 files branch on analysis mode:

```typescript
// ReportView.tsx — repeated 20 times
{isYamazumi ? (
  <ReportYamazumiKPIGrid ... />
) : isCapabilityMode ? (
  <ReportCapabilityKPIGrid ... />
) : analysisMode === 'performance' ? (
  <ReportPerformanceKPIGrid ... />
) : (
  <ReportKPIGrid ... />
)}
```

Adding a new analysis mode requires editing ~10 files at ~80 locations.

### Methodology Alignment

The Three Analysis Modes and Two Analytical Threads from the methodology documentation:

```
Analysis Modes (dashboard-level, data-format-driven)
├── standard     → Four Lenses (CHANGE, FLOW, FAILURE, VALUE)
├── performance  → Multi-channel Cpk (wide-format data)
└── yamazumi     → Lean time study (activity composition data)

Analytical Threads (cross-cutting, user-toggled)
├── Variation    → Raw values on I-Chart Y-axis
└── Capability   → Per-subgroup Cpk on I-Chart Y-axis
```

**Key distinction:** Performance and Yamazumi are **data-format-driven** modes (auto-detected from column types). Capability is a **user-toggled analytical thread** within standard mode that changes 3 of 4 chart slots plus adds subgroup configuration.

### Design: Hybrid Approach

```
AnalysisMode (3-value, methodology-honest)
  'standard' | 'performance' | 'yamazumi'

resolveMode(mode, displayOptions) → ResolvedMode (4-value, code-practical)
  'standard' | 'capability' | 'performance' | 'yamazumi'

strategies[resolvedMode] → AnalysisModeStrategy
```

`AnalysisMode` stays 3-value (matches methodology). `resolveMode()` returns 4 keys by checking `displayOptions.standardIChartMetric === 'capability'`. The type system stays honest to the domain; the strategy lookup stays flat.

### Strategy Interface

```typescript
// packages/core/src/analysisStrategy.ts

type ResolvedMode = 'standard' | 'capability' | 'performance' | 'yamazumi';

interface AnalysisModeStrategy {
  /** Which chart component renders in each dashboard slot */
  chartSlots: {
    slot1: ChartSlotType;
    slot2: ChartSlotType;
    slot3: ChartSlotType;
    slot4: ChartSlotType;
  };

  /** Which KPI grid component to render in reports */
  kpiComponent: ResolvedMode;

  /** Report title prefix */
  reportTitle: string;

  /** Section keys for useReportSections composition */
  reportSections: string[];

  /** Y-axis label function */
  metricLabel: (hasSpecs: boolean) => string;

  /** Optional custom metric formatter */
  formatMetricValue?: (v: number) => string;

  /** Which chart insight types to generate for CoScout */
  aiChartInsightKeys: string[];

  /** Which AI tool set to expose */
  aiToolSet: 'standard' | 'performance' | 'yamazumi';
}

function resolveMode(mode: AnalysisMode, opts?: { standardIChartMetric?: string }): ResolvedMode {
  if (mode === 'performance') return 'performance';
  if (mode === 'yamazumi') return 'yamazumi';
  if (opts?.standardIChartMetric === 'capability') return 'capability';
  return 'standard';
}

const strategies: Record<ResolvedMode, AnalysisModeStrategy> = {
  standard: {
    /* ... */
  },
  capability: {
    /* ... */
  },
  performance: {
    /* ... */
  },
  yamazumi: {
    /* ... */
  },
};
```

### SubgroupConfig

Subgroup configuration (column-based, fixed-size, time-based) stays in `displayOptions.subgroupConfig` as a **user preference**, not a strategy property. The strategy defines "capability mode uses a capability I-Chart" (chart slot); how the data is subgrouped is a runtime user choice.

### Files to Modify

| File                                             | Ternaries (approx) | Replacement                                            |
| ------------------------------------------------ | ------------------ | ------------------------------------------------------ |
| `apps/azure/src/components/views/ReportView.tsx` | ~21                | `strategies[resolved].kpiComponent`, `.reportSections` |
| `packages/ui/src/components/IChartWrapper/`      | ~19                | `strategies[resolved].chartSlots.slot1`                |
| `apps/azure/src/components/Dashboard.tsx`        | ~6                 | `strategies[resolved].chartSlots`                      |
| `apps/pwa/src/components/Dashboard.tsx`          | ~6                 | `strategies[resolved].chartSlots`                      |
| `apps/azure/src/pages/Editor.tsx`                | ~3                 | `resolveMode()` at component top                       |
| `packages/hooks/src/useReportSections.ts`        | ~4                 | `strategies[resolved].reportSections`                  |
| `packages/hooks/src/useDashboardInsights.ts`     | ~5                 | `strategies[resolved]` properties                      |
| `apps/pwa/src/components/charts/IChart.tsx`      | ~6                 | `strategies[resolved].chartSlots.slot1`                |
| Other files with mode branching                  | ~10                | Various strategy lookups                               |

Total: ~80 occurrences across ~10 files (earlier estimate of 37 was undercounted).

---

## Phase 3: ESLint Boundaries

### Phase 3a: Package-Level Rules

Immediately enforceable — zero current violations exist (confirmed in ADR-045).

| Source              | Cannot Import           | Rationale                  |
| ------------------- | ----------------------- | -------------------------- |
| `@variscout/core`   | hooks, ui, charts, apps | Core stays pure TypeScript |
| `@variscout/charts` | hooks, ui, apps         | Charts stay props-based    |
| `@variscout/hooks`  | ui, charts, apps        | Hooks stay headless        |
| `@variscout/ui`     | apps                    | UI stays app-agnostic      |
| Apps                | Each other              | PWA/Azure stay independent |

### Phase 3b: Feature-Level Rules

Added after Phase 1 events remove all cross-feature imports.

| Rule                                                   | What it prevents                |
| ------------------------------------------------------ | ------------------------------- |
| `features/findings/` cannot import `features/ai/`      | Feature isolation               |
| `features/ai/` cannot import `features/investigation/` | No cross-feature coupling       |
| Any `features/*/` cannot import another `features/*/`  | All cross-feature via event bus |
| Stores cannot import orchestration hooks               | Store reads only                |

7 element types: `domain`, `orchestration`, `presentation`, `store`, `feature`, `test`, `shared`.

No `eslint-disable` exceptions needed because events will have replaced all cross-feature imports before these rules activate.

---

## Documentation Deliverables

| Document                                               | Purpose                                                                                                  |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| ADR-046: Event-Driven Architecture                     | Domain event bus, typed event catalog, cross-store decoupling. Supersedes ADR-045 §cross-store-coupling. |
| ADR-047: Analysis Mode Strategy Pattern                | resolveMode() hybrid, 3-value AnalysisMode + 4-value ResolvedMode, methodology alignment.                |
| ADR-048: Boundary Enforcement (ESLint)                 | eslint-plugin-boundaries, package-level + feature-level rules, CI integration.                           |
| `docs/05-technical/architecture/event-catalog.md`      | Living reference: all domain events with payloads, emitters, listeners.                                  |
| `docs/05-technical/architecture/store-interactions.md` | Updated with event bus diagram (before/after).                                                           |

---

## Implementation Order

1. **Documentation**: Spec doc + 3 ADRs + architecture docs
2. **Phase 1**: Event bus + migration (largest, most impactful)
3. **Phase 2**: Strategy pattern (benefits from decoupled stores)
4. **Phase 3a**: Package ESLint rules
5. **Phase 3b**: Feature ESLint rules (after events enable clean boundaries)

---

## Verification

1. `pnpm test` — all ~3,844 tests pass
2. `pnpm build` — all packages build
3. `pnpm lint` — 0 boundary violations
4. Grep: 0 cross-store `.getState()` calls remaining in orchestration hooks
5. Grep: ternary count reduced from ~80 to <10
6. Manual: pin finding → findings panel opens, highlight appears
7. Manual: CoScout navigate_to → correct panel/finding/hypothesis opens
8. Manual: switch analysis modes → correct charts in all 4 slots

---

## Design Decisions Log

| Decision             | Choice                                             | Rationale                                                                      |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Event bus library    | mitt (200B)                                        | Battle-tested, tiny, adequate TypeScript generics                              |
| Event catalog scope  | 11 events (7 domain + 4 UI)                        | Covers all 35+ cross-boundary mutations and 12 journey transitions             |
| AI event layer       | None — AI uses domain events via CRUD              | Proposals confirm through existing addFinding/addHypothesis, which emit events |
| Capability mode      | Hybrid (3-value type + resolveMode → 4 strategies) | Methodology-honest: capability is a view toggle, not a mode                    |
| SubgroupConfig       | Stays in displayOptions                            | User preference, not mode-defining property                                    |
| ESLint rollout       | Two-phase (package first, features after events)   | Events must remove cross-feature imports before rules can be clean             |
| Implementation order | Sequential layers                                  | Each phase independently testable and shippable                                |
