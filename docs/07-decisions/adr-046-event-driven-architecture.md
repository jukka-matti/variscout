---
title: 'ADR-046: Event-Driven Architecture — mitt Event Bus'
---

# ADR-046: Event-Driven Architecture — mitt Event Bus

**Status:** Accepted
**Date:** 2026-03-23

## Context

ADR-045 documented 12 cross-store `.getState()` calls across 3 orchestration hooks and deferred domain events until "cross-store calls exceed ~30 or feature count exceeds ~10." The subsequent architectural exploration (2026-03-23) found that the coupling was already creating concrete problems:

- Side effects were implicit and scattered: opening the findings panel after creating a finding required `useFindingsOrchestration` to know about `panelsStore`
- `useToolHandlers` reached across 3 stores (`panelsStore`, `findingsStore`, `investigationStore`) for a single `navigate_to` AI tool call
- Testing orchestration hooks required mocking multiple unrelated stores
- Adding new workflows (e.g., opening improvement workspace from a finding action) required editing multiple orchestration files

The full audit counted **9 cross-domain orchestration calls** in 3 files (ADR-045 §cross-store-coupling listed 12; the refined count after separating intra-feature syncs from cross-domain calls is 9).

### Why an event bus, not a service layer

A service layer (application services calling stores) would add indirection without improving testability. An event bus provides:

- **Traceability**: every side effect has a named event and a centralized listener
- **Testability**: emit an event, assert listener outcomes — no store mocking needed
- **Extensibility**: adding a new side effect to an existing domain action = add one line to `listeners.ts`

### Library selection

`mitt` (200 bytes, typed, no dependencies) was selected over:

- **RxJS** — 10× larger, reactive streams are over-engineered for UI choreography
- **EventEmitter3** — 3× larger, Node.js mental model
- **Custom bus** — mitt is small enough that wrapping it adds no value

## Decision

### Adopt mitt as the typed event bus for Azure app cross-domain events

```typescript
// apps/azure/src/events/bus.ts
import mitt from 'mitt';
import type { AppEvents } from './types';

export const bus = mitt<AppEvents>();
```

### 11 typed domain events in 3 layers

**Layer 1: Domain events** (7 events — emitted by orchestration hooks after CRUD operations)

| Event                       | Emitted by                      | Payload                                                                                                  |
| --------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `finding:created`           | `useFindingsOrchestration`      | `{ finding: Finding, source?: FindingSource }`                                                           |
| `finding:status-changed`    | `useFindingsOrchestration`      | `{ findingId: string, from: FindingStatus, to: FindingStatus }` — reserved                               |
| `finding:resolved`          | `useFindingsOrchestration`      | `{ findingId: string, outcome: FindingOutcome }` — reserved                                              |
| `hypothesis:validated`      | `useInvestigationOrchestration` | `{ hypothesisId: string, status: 'supported'\|'contradicted'\|'partial', eta2: number }` — reserved      |
| `hypothesis:cause-assigned` | `useInvestigationOrchestration` | `{ hypothesisId: string, role: 'primary'\|'contributing', findingId: string }` — reserved                |
| `idea:projection-attached`  | `useInvestigationOrchestration` | `{ ideaId: string, projected: { mean: number, sigma: number, cpk: number, yield?: number } }` — reserved |
| `idea:converted-to-actions` | `useImprovementOrchestration`   | `{ ideaIds: string[], findingId: string, actions: ActionItem[] }` — reserved                             |

**Layer 2: UI choreography events** (4 events — emitted by domain listeners, consumed by panel listeners)

| Event                      | Meaning                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `panel:visibility-changed` | A workflow requires a panel to open or close                      |
| `navigate:to`              | AI `navigate_to` tool or a domain listener resolved a destination |
| `highlight:finding`        | Scroll to and briefly highlight a specific finding — reserved     |
| `highlight:chart-point`    | Briefly highlight a data point on the active chart — reserved     |

**Layer 3: AI integration** (flows through domain events — no dedicated AI layer)

AI action tools call CRUD functions in `@variscout/hooks` (the same path as user actions). The resulting domain events are identical. `useToolHandlers` emits `navigate:to` directly when the tool resolves navigation targets.

### Centralized listeners

All cross-domain side effects are registered in one file:

```
apps/azure/src/events/
├── bus.ts          — mitt instance export
├── types.ts        — AppEvents type map
└── listeners.ts    — all on() registrations
```

`listeners.ts` is mounted once in `Editor.tsx` via `useEffect`. Each listener is a single-responsibility function: receive an event, call one store action.

```typescript
// Example: finding:created → open findings panel
bus.on('finding:created', () => {
  usePanelsStore.getState().setFindingsOpen(true);
});

// Example: idea:projection-attached → open what-if panel (listener would be added when reserved event is activated)
bus.on('idea:projection-attached', () => {
  usePanelsStore.getState().setWhatIfOpen(true);
});
```

### Migration path

1. Add `mitt` to `apps/azure` dependencies
2. Create `events/` directory with `bus.ts`, `types.ts`, `listeners.ts`
3. Replace each cross-domain `.getState()` call in orchestration hooks with `bus.emit()`
4. Mount listeners in `Editor.tsx`
5. Cross-store call count in orchestration hooks drops from 9 to 0

Intra-feature syncs (e.g., `useFindingsOrchestration` writing to `findingsStore`) remain as direct calls — they are not cross-domain.

## Consequences

### Positive

- Cross-domain `.getState()` calls in orchestration hooks reduced to **0**
- All side effect wiring visible in one file (`listeners.ts`), not scattered across 3–5 hooks
- Orchestration hooks become testable without mocking unrelated stores
- New side effects added by appending to `listeners.ts`, not editing business logic
- Event log gives a natural audit trail for debugging UI state transitions
- Supersedes the "revisit in Q3 2026" deferral from ADR-045 §cross-store-coupling

### Negative

- Event flow is less explicit than direct function calls — requires reading `listeners.ts` to understand what happens after `bus.emit('finding:created')`
- Typos in event names are caught by TypeScript (the `AppEvents` type map), not at call sites
- `mitt` adds one dependency (200B, so negligible)

### Neutral

- Intra-feature store writes remain as direct calls (no events for same-domain sync)
- Component selector reads are unchanged
- `panelsStore` remains the UI coordinator — now driven by events rather than direct calls

## Related

- [ADR-045: Modular Architecture](adr-045-modular-architecture.md) — supersedes §cross-store-coupling evaluation
- [ADR-041: Zustand Feature Stores](adr-041-zustand-feature-stores.md) — store architecture this builds on
- [ADR-029: AI Action Tools](adr-029-ai-action-tools.md) — AI tools flow through domain events
- [Store Interactions](../05-technical/architecture/store-interactions.md) — updated with event bus section
- Full design: `docs/superpowers/specs/2026-03-23-event-driven-architecture-design.md`
