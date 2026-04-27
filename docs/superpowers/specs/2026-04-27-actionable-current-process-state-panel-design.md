---
title: Actionable Current Process State Panel
audience: engineer
category: design-spec
status: draft
related:
  - 2026-04-27-layered-process-view-design.md
  - 2026-04-27-process-learning-operating-model-design.md
  - 2026-04-27-product-method-roadmap-design.md
  - ../../07-decisions/adr-070-frame-workspace.md
  - ../../07-decisions/adr-072-process-hub-storage-and-coscout-context.md
  - ../../07-decisions/adr-059-web-first-deployment.md
---

# Actionable Current Process State Panel

> **Implementation plan:** [`2026-04-27-actionable-current-process-state-panel-plan.md`](../plans/2026-04-27-actionable-current-process-state-panel-plan.md) — TDD breakdown for PR #4 (response-path routing) and PR #5 (evidence chip).

## Context

Phase 1 (V1) of the Layered Process View shipped the read-only `ProcessHubCurrentStatePanel` (PR #95, then promoted to `@variscout/ui` in PR #97 on commit `e9674997`). Phase 2 V2 was originally planned to add snapshot-mode rendering inside `LayeredProcessView` itself, with per-factor state badges painted onto the Operations band.

Brainstorming on 2026-04-27 surfaced three structural blockers that invalidated the original V2 plan:

1. `CurrentProcessState.items[]` carries no per-tributary keys — items are hub-wide rollups, not factor-resolved.
2. `buildCurrentProcessState` runs on the Dashboard surface, not the Editor where `LayeredProcessView` lives today.
3. `ProcessMap` is investigation-scoped (per ADR-070), not hub-scoped — there is no canonical hub ProcessMap to render against.

Cross-checking the **Product Method Roadmap** revealed the matching design call: "Level-aware Process Hub map" is explicitly an **H3** capability (line 226 of `2026-04-27-product-method-roadmap-design.md`). The original V2 plan was wedging an H3 feature into V2 via an under-supported data model. The V1 surface that already exists (`ProcessHubCurrentStatePanel`) **already delivers the H1 promise** — _"a process team can open one hub and understand what needs attention now"_ — but only as a read-only display.

This spec closes Phase 2 V2 by making that panel **actionable**: every state-item card becomes a clickable affordance routing to the correct response-path workflow, and each card surfaces an evidence-count chip with a popover listing related findings. Net effect: the H1 product promise — _"...why, and which response path fits"_ — is delivered.

## Goal

The process owner opens the hub, sees the current state, and can act:

- Click any state-item card → routes to the right workflow (focused investigation, sustainment review, control handoff, etc.).
- See at a glance how much evidence backs each item (analyzed/improving/resolved findings).
- Click the evidence chip → bottom sheet lists the linked findings; click a finding → navigates into the investigation.

All telemetry on these clicks is captured (no-PII per ADR-059) so future horizons can prioritize from real usage signal.

## Non-Goals

These are deferred — most to **H3** in the Product Method Roadmap — and are out of scope for this spec:

1. **`LayeredProcessView` snapshot mode** with per-factor state badges. Blocked on per-tributary state data model (ADR-070 V3 schema additions: `tributary.targetRange?`, `node.ctqs?`).
2. **Hub-canonical ProcessMap.** Blocked on H3 "level-aware Process Hub map" design — needs its own brainstorming session covering single map vs. variants vs. Yamazumi optional steps.
3. **Cross-band SVG connectors** in `LayeredProcessView`. Blocked on (1) and (2).
4. **Dedicated MSA editor surface** (`measurement-system-work` response path). Slated for **H2 — Process Measurement System**. This spec renders the path with a "Planned" pill rather than fallback-routing.
5. **Gemba-note and MSA-record evidence linkage**. Out of scope for this spec; finding linkage covers the V2 use case.
6. **Sustainment-record and control-handoff evidence linkage** in the chip. Phase 6 deliverables exist; their inclusion is deferred to a follow-up so the V2 surface stays tight. **Revisit as a focused design pass** — the control-handoff concept is one to re-examine in its own right (control-handoff workflow scope, surface ownership, evidence linkage).
7. **PWA parity.** Process Hub is Azure-only by design (ADR-072 multi-investigation aggregation needs persistence; PWA is session-only by ADR-012).
8. **i18n message catalog migration** for hardcoded English copy in the panel. Existing strings preserved; ADR-025 catalog work is a separate concern.

## Architecture

Three layers, downward dependency flow (per `feedback_no_backcompat_clean_architecture` memory: required props, exhaustive types, refactor consumers in the same PR).

```
┌──────────────────────────── @variscout/core ────────────────────────────┐
│                                                                          │
│  processState.ts (existing — unchanged)                                  │
│    buildCurrentProcessState() → CurrentProcessState                      │
│                                                                          │
│  responsePathAction.ts (NEW)                                             │
│    type ResponsePathAction =                                             │
│      | { kind: 'open-investigation'; investigationId: string;           │
│          intent: 'focused' | 'chartered' | 'quick' }                     │
│      | { kind: 'open-sustainment';                                       │
│          investigationId: string;                                        │
│          surface: 'review' | 'handoff' }                                 │
│      | { kind: 'unsupported'; reason: 'planned' | 'informational' };    │
│                                                                          │
│    deriveResponsePathAction(                                             │
│      item: ProcessStateItem,                                             │
│      defaultInvestigationId: string                                      │
│    ): ResponsePathAction                                                 │
│      Exhaustive switch on item.responsePath. assertNever default.       │
│      Uses defaultInvestigationId for hub-aggregate items.               │
│      monitor → unsupported/'informational'                               │
│      measurement-system-work → unsupported/'planned'                     │
│                                                                          │
│  processEvidence.ts (NEW)                                                │
│    type LinkFindingsResult = {                                           │
│      byItemId: Map<string, readonly Finding[]>;                          │
│      totalLinked: number;                                                │
│      unlinkedItemIds: string[];                                          │
│    };                                                                    │
│                                                                          │
│    linkFindingsToStateItems(                                             │
│      items: readonly ProcessStateItem[],                                 │
│      findings: readonly Finding[],                                       │
│      resolveInvestigationIds: (item) => readonly string[]                │
│    ): LinkFindingsResult                                                 │
│      Filters findings to status ∈ {analyzed, improving, resolved}.      │
│      Caller injects resolver — keeps function a 2-input pure join.      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ pure functions, type-only deps
                              │
┌──────────────────────────── @variscout/ui ──────────────────────────────┐
│                                                                          │
│  ProcessHubCurrentStatePanel (existing — refactored)                    │
│    All 3 props REQUIRED. Existing consumer refactored in same PR.       │
│                                                                          │
│    interface ProcessHubCurrentStatePanelProps {                          │
│      state: CurrentProcessState;                                         │
│      actions: ProcessHubActionsContract;                                 │
│      evidence: ProcessHubEvidenceContract;                               │
│    }                                                                     │
│                                                                          │
│    interface ProcessHubActionsContract {                                 │
│      actionFor: (item: ProcessStateItem) => ResponsePathAction;         │
│      onInvoke: (item, action: ResponsePathAction) => void;              │
│    }                                                                     │
│                                                                          │
│    interface ProcessHubEvidenceContract {                                │
│      findingsFor: (item: ProcessStateItem) => readonly Finding[];       │
│      onChipClick: (item, findings: readonly Finding[]) => void;         │
│    }                                                                     │
│                                                                          │
│  Behavior:                                                               │
│    For each state.items[item]:                                           │
│      action = actions.actionFor(item)                                    │
│      if action.kind === 'unsupported':                                   │
│        Render card with 'Planned' or 'Informational' pill (per reason). │
│        No card click handler. Tooltip explains.                          │
│      else:                                                               │
│        Card whole-area click → actions.onInvoke(item, action)           │
│      Always render evidence chip with evidence.findingsFor(item).length │
│      Chip click → evidence.onChipClick(item, findings)                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ named imports + props
                              │
┌──────────────────────────── apps/azure ─────────────────────────────────┐
│                                                                          │
│  routing/processHubRoutes.ts (NEW, thin)                                 │
│    actionToHref(action: ResponsePathAction): string | null               │
│      Exhaustive switch on action.kind. Single URL source.               │
│      'unsupported' → null                                                │
│      'open-investigation' → /editor/:id?intent=:intent                   │
│      'open-sustainment' → /editor/:id/sustainment[?surface=handoff]     │
│                                                                          │
│  Dashboard.tsx (existing — wired)                                        │
│    findingsLookup = useMemo(...)  built from rollup + findings           │
│    handleInvoke = (item, action) => {                                    │
│      const href = actionToHref(action);                                  │
│      if (!href) return;                                                  │
│      safeTrackEvent('process_hub.response_path_click', {...});          │
│      navigate(href);                                                     │
│    };                                                                    │
│    handleChipClick = (item, findings) => {                               │
│      safeTrackEvent('process_hub.evidence_chip_click', {...});          │
│      setEvidenceSheet({ item, findings });                               │
│    };                                                                    │
│                                                                          │
│  components/EvidenceSheet.tsx (NEW)                                      │
│    Bottom sheet listing finding label + status + click-thru             │
│    Lives in apps/azure for now. Promote to @variscout/ui if a second   │
│    consumer surfaces.                                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key invariants

- **Required props throughout** — no `?:` on new prop fields. Existing consumer (`apps/azure/src/components/ProcessHubReviewPanel.tsx`) is refactored in PR #4 to pass the contracts. (Per `feedback_no_backcompat_clean_architecture`.)
- **Product-domain semantics in core** — `ResponsePathAction` discrimination, `unsupported` reason taxonomy, evidence-finding linkage rules. Apps adapt to URLs and UI surfaces.
- **Exhaustive switches with `assertNever` defaults** — at three boundaries: `deriveResponsePathAction` (in core), `actionToHref` (in apps/azure), and the panel's pill renderer for `unsupported.reason`.
- **Pure aggregator** — `linkFindingsToStateItems` is a 2-input join with injected resolver; testable in isolation, no React, no DOM.
- **`@variscout/ui` props-based** — no app-state coupling, no router awareness, no telemetry awareness. Per ADR-056 / `@variscout/ui` package CLAUDE.md.
- **No PWA wiring** — Process Hub remains Azure-only.

## Components & Contracts

### `responsePathAction.ts` (core)

```ts
import type { ProcessStateItem, ProcessStateResponsePath } from './processState';

export type ResponsePathAction =
  | {
      kind: 'open-investigation';
      investigationId: string;
      intent: 'focused' | 'chartered' | 'quick';
    }
  | { kind: 'open-sustainment'; investigationId: string; surface: 'review' | 'handoff' }
  | { kind: 'unsupported'; reason: 'planned' | 'informational' };

/**
 * Pure mapping from a state item's response-path to a domain action.
 * Exhaustive on ProcessStateResponsePath. Returns 'unsupported' for paths
 * with no current Azure surface — those render as 'Planned' / 'Informational'
 * pills rather than fallback-routing.
 *
 * For items without their own investigation linkage (hub-aggregate items
 * like capability-gap, change-signals, top-focus), the caller passes
 * `defaultInvestigationId` — the open-investigation / open-sustainment
 * actions use it as the navigation target. Caller's heuristic for choosing
 * the default lives in the Dashboard (typically the rollup's most-recently-
 * updated investigation).
 */
export function deriveResponsePathAction(
  item: ProcessStateItem,
  defaultInvestigationId: string
): ResponsePathAction;
```

Action mapping (the canonical product-domain table):

| `responsePath`            | Action kind          | Detail                                                      |
| ------------------------- | -------------------- | ----------------------------------------------------------- |
| `monitor`                 | `unsupported`        | `reason: 'informational'` — informational only, no workflow |
| `quick-action`            | `open-investigation` | `intent: 'quick'`                                           |
| `focused-investigation`   | `open-investigation` | `intent: 'focused'`                                         |
| `chartered-project`       | `open-investigation` | `intent: 'chartered'`                                       |
| `measurement-system-work` | `unsupported`        | `reason: 'planned'` — H2 follow-up                          |
| `sustainment-review`      | `open-sustainment`   | `surface: 'review'`                                         |
| `control-handoff`         | `open-sustainment`   | `surface: 'handoff'`                                        |

`investigationId` resolution: state items carry varying linkage (`investigationIds[]` for queue items; none for hub-aggregate items like `capability-gap`, `change-signals`, `top-focus`). The Dashboard always passes a `defaultInvestigationId` — for queue items, `deriveResponsePathAction` uses the item's own first `investigationIds[0]` if present; for aggregate items, it falls back to `defaultInvestigationId`. The Dashboard's heuristic for choosing the default is the rollup's most-recently-updated investigation (see Open Question #3).

### `processEvidence.ts` (core)

```ts
import type { Finding, FindingStatus } from './findings/types';
import type { ProcessStateItem } from './processState';

export const RELEVANT_FINDING_STATUSES: ReadonlySet<FindingStatus> = new Set([
  'analyzed',
  'improving',
  'resolved',
]);

export interface LinkFindingsResult {
  byItemId: Map<string, readonly Finding[]>;
  totalLinked: number;
  unlinkedItemIds: string[];
}

/**
 * Pure 2-input join. Caller resolves item → investigation IDs.
 * Findings filtered to RELEVANT_FINDING_STATUSES.
 * Returns a structure suitable for both lookup (byItemId) and reporting.
 */
export function linkFindingsToStateItems(
  items: readonly ProcessStateItem[],
  findings: readonly Finding[],
  resolveInvestigationIds: (item: ProcessStateItem) => readonly string[]
): LinkFindingsResult;
```

### `ProcessHubCurrentStatePanel` (ui)

```ts
export interface ProcessHubCurrentStatePanelProps {
  state: CurrentProcessState;
  actions: ProcessHubActionsContract;
  evidence: ProcessHubEvidenceContract;
}

export interface ProcessHubActionsContract {
  actionFor: (item: ProcessStateItem) => ResponsePathAction;
  onInvoke: (item: ProcessStateItem, action: ResponsePathAction) => void;
}

export interface ProcessHubEvidenceContract {
  findingsFor: (item: ProcessStateItem) => readonly Finding[];
  onChipClick: (item: ProcessStateItem, findings: readonly Finding[]) => void;
}
```

Visual delta on a state-item card:

```
┌─ Supported card (e.g. focused-investigation) ─────────────────┐
│  OUTCOME                                              [● Red] │
│  Capability below target                                       │
│  Cpk 1.05 vs target 1.33                                       │
│                                                                │
│  [ Focused investigation ]              ⓘ 3 findings          │
│  ↑ pill = card primary action                ↑ click → sheet  │
│  (whole card clickable)                                        │
└────────────────────────────────────────────────────────────────┘

┌─ Unsupported / Planned card (measurement-system-work) ────────┐
│  MEASUREMENT                                       [● Amber] │
│  Subgroup-size warning                                        │
│  n=2 (target ≥5)                                              │
│                                                                │
│  [ Measurement system work · Planned ]    ⓘ 1 finding        │
│  ↑ tooltip: "MSA workflow planned for H2"   ↑ chip works     │
│  (no whole-card click)                                         │
└────────────────────────────────────────────────────────────────┘

┌─ Informational card (monitor) ────────────────────────────────┐
│  SUSTAINMENT                                       [● Green] │
│  Holding within control                                        │
│                                                                │
│  [ Monitor · Informational ]              (no chip if no      │
│  ↑ tooltip: "No action needed; tracked"        findings)      │
└────────────────────────────────────────────────────────────────┘
```

### `processHubRoutes.ts` (apps/azure)

```ts
import type { ResponsePathAction } from '@variscout/core';

/**
 * Single URL source. Exhaustive switch on action.kind.
 */
export function actionToHref(action: ResponsePathAction): string | null;

// 'open-investigation' → `/editor/${investigationId}?intent=${intent}`
// 'open-sustainment'   → `/editor/${investigationId}/sustainment[?surface=handoff]`
// 'unsupported'        → null
```

### `EvidenceSheet.tsx` (apps/azure)

Lightweight bottom-sheet React component. Props: `item: ProcessStateItem | null`, `findings: readonly Finding[]`, `onSelectFinding: (f: Finding) => void`, `onClose: () => void`. Renders finding labels + statuses + click-thru. Empty findings → placeholder. Esc key + click-outside both close.

## Data Flow

### On Dashboard mount

```
1. Existing: load investigations, findings, evidenceSnapshots, sustainment from store.
2. Existing: rollups = useMemo(() => buildProcessHubRollups(...))
3. Existing: state = useMemo(() => buildCurrentProcessState(rollup, cadence))
4. NEW: investigationIdResolver = useMemo(() => buildInvestigationIdResolver(rollup, cadence))
5. NEW: linkResult = useMemo(() => linkFindingsToStateItems(state.items, allFindings, investigationIdResolver))
6. NEW: findingsForItem = (item) => linkResult.byItemId.get(item.id) ?? []
7. NEW: actionFor = (item) => deriveResponsePathAction(item, defaultInvestigationId)
8. Render <ProcessHubCurrentStatePanel state={state} actions={{actionFor, onInvoke: handleInvoke}} evidence={{findingsFor, onChipClick: handleChipClick}} />
```

### Investigation-ID resolver per item type

Built once per rollup. Returns the closure `(item) => readonly string[]`.

| Item id pattern                   | Resolver returns                                                          |
| --------------------------------- | ------------------------------------------------------------------------- |
| `capability-gap`, `capability-ok` | All `rollup.investigations[].id` (hub-wide aggregate)                     |
| `change-signals`                  | All `rollup.investigations[].id`                                          |
| `top-focus`                       | All `rollup.investigations[].id`                                          |
| `evidence:{signal.id}`            | Investigations whose `metadata.evidenceSnapshotIds` reference `signal.id` |
| `readiness`                       | `cadence.readiness.items[].investigation.id`                              |
| `verification`                    | `cadence.verification.items[].investigation.id`                           |
| `overdue-actions`                 | `cadence.actions.items[].investigation.id`                                |
| `active:{depth}`                  | `cadence.activeWork[depth].items[].investigation.id`                      |

### On user click — response-path action

```
User clicks state-item card (action.kind != 'unsupported')
  → actions.onInvoke(item, action)
  → Dashboard.handleInvoke(item, action):
      1. href = actionToHref(action)              [pure]
      2. if (!href) return
      3. safeTrackEvent('process_hub.response_path_click', {hubId, responsePath, lens, severity})
      4. navigate(href)
  → React Router opens Editor at the right surface
```

### On user click — evidence chip

```
User clicks evidence chip
  → evidence.onChipClick(item, findings)  [findings already resolved at render]
  → Dashboard.handleChipClick(item, findings):
      1. safeTrackEvent('process_hub.evidence_chip_click', {hubId, responsePath, lens, evidenceCount})
      2. setEvidenceSheet({ item, findings })
  → EvidenceSheet bottom sheet renders
  → User clicks a finding → EvidenceSheet.onSelectFinding(finding)
  → Dashboard navigates to /editor/:investigationId#finding-:findingId
```

### Memoization boundaries

| Memo                              | Recomputes when                                          |
| --------------------------------- | -------------------------------------------------------- |
| `state`                           | rollup or cadence change (existing)                      |
| `investigationIdResolver`         | rollup or cadence change                                 |
| `linkResult`                      | state.items, allFindings, investigationIdResolver change |
| `findingsForItem` closure         | linkResult changes                                       |
| `actionFor` reference             | identity stable (module-level export)                    |
| `handleInvoke`, `handleChipClick` | useCallback over [navigate, appInsights]                 |

## Error Handling

### Type-system guarantees

- `deriveResponsePathAction` exhaustive `switch (item.responsePath)` with `assertNever` default → adding a new `ProcessStateResponsePath` to core without updating the action mapping = build error in core itself.
- `actionToHref` exhaustive `switch (action.kind)` with `assertNever` default → adding a new action kind without updating URL mapping = build error in apps/azure.
- Panel's pill renderer exhaustive on `unsupported.reason` → adding a new reason ('deprecated', 'beta', etc.) without updating the pill copy = build error in @variscout/ui.
- Required props throughout → missing-prop = compile error, not runtime fallthrough.

### Runtime guards

```ts
// linkFindingsToStateItems — defensive against malformed inputs
function linkFindingsToStateItems(items, findings, resolveInvestigationIds) {
  const validFindings = findings.filter(f => RELEVANT_FINDING_STATUSES.has(f.status));
  const byItemId = new Map<string, readonly Finding[]>();
  const unlinkedItemIds: string[] = [];
  let totalLinked = 0;
  for (const item of items) {
    const investigationIds = new Set(resolveInvestigationIds(item) ?? []);
    if (investigationIds.size === 0) {
      byItemId.set(item.id, []);
      unlinkedItemIds.push(item.id);
      continue;
    }
    const linked = validFindings.filter(f => investigationIds.has(f.investigationId));
    byItemId.set(item.id, linked);
    totalLinked += linked.length;
    if (linked.length === 0) unlinkedItemIds.push(item.id);
  }
  return { byItemId, totalLinked, unlinkedItemIds };
}

// Dashboard.handleInvoke — never crash on a navigation error
const handleInvoke = (item, action) => {
  try {
    const href = actionToHref(action);
    if (!href) return;  // unsupported
    safeTrackEvent('process_hub.response_path_click', {...});
    navigate(href);
  } catch (err) {
    safeTrackEvent('process_hub.response_path_error', {
      responsePath: item.responsePath, errorName: err.name
    });
  }
};
```

### Telemetry resilience

`safeTrackEvent` wraps `appInsights.trackEvent` in try/catch. App Insights down → user experience is unaffected. Telemetry is never load-bearing.

### No-PII per ADR-059

Allowed in event payloads:

| Field                              | Why allowed                                            |
| ---------------------------------- | ------------------------------------------------------ |
| `hubId`                            | Stable opaque ID; not customer-meaningful in isolation |
| `responsePath`, `lens`, `severity` | Enum values; structural                                |
| `evidenceCount`                    | Integer; structural                                    |

NOT allowed:

| Field                                  | Why not                                        |
| -------------------------------------- | ---------------------------------------------- |
| Finding label, item.label, item.detail | Free-form text from customer data              |
| Investigation IDs                      | Customer-meaningful when correlated externally |
| Factor names, column names             | Customer data leak risk                        |

A future ESLint rule that flags `trackEvent` payloads containing fields named `label`, `name`, `description`, `text`, `detail` would make this enforcement-grade — out of scope for this spec, noted as an Operations follow-up.

### EvidenceSheet edge states

| Sheet state                              | UI                                                            |
| ---------------------------------------- | ------------------------------------------------------------- |
| `findings.length === 0`                  | "No findings recorded for this item yet." (placeholder)       |
| Selected finding's investigation deleted | Toast: "Investigation no longer available." Sheet stays open. |
| Sheet close while navigation pending     | Cancel pending navigation; close sheet first                  |

### Intentionally NOT handled

- No retry logic for navigation failures. React Router's failure modes are user-correctable (back button); auto-retry would be confusing.
- No optimistic UI for response-path clicks. The navigation IS the feedback.
- No offline mode. Dashboard is Azure-only, EasyAuth-gated; offline access is the PWA's job.

## Testing

### Test pyramid

| Layer                      | Tool         | File                                                                                                                              | Target tests |
| -------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Pure: `responsePathAction` | vitest       | `packages/core/src/__tests__/responsePathAction.test.ts`                                                                          | ~8           |
| Pure: `processEvidence`    | vitest       | `packages/core/src/__tests__/processEvidence.test.ts`                                                                             | ~10          |
| Pure: `processHubRoutes`   | vitest       | `apps/azure/src/routing/__tests__/processHubRoutes.test.ts`                                                                       | ~6           |
| Component: panel           | vitest + RTL | `packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx` (extend existing 8 → ~14) | +6           |
| Component: EvidenceSheet   | vitest + RTL | `apps/azure/src/components/__tests__/EvidenceSheet.test.tsx`                                                                      | ~5           |
| Integration: Dashboard     | vitest + RTL | `apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx` (extend)                                                           | +4           |
| E2E happy path             | Playwright   | `apps/azure/tests/e2e/process-hub-actions.spec.ts`                                                                                | 1 scenario   |

### Critical scenarios

**`deriveResponsePathAction` (core, ~8 tests):**

- All 7 `ProcessStateResponsePath` values produce a `ResponsePathAction` (no fallthrough).
- 5 paths produce non-unsupported actions with correct `kind` and discriminator fields.
- 2 paths produce `unsupported` with the correct `reason` (`'planned'` vs `'informational'`).
- Exhaustive-switch enforcement: hypothetical 8th `ProcessStateResponsePath` triggers `@ts-expect-error` test.
- `defaultInvestigationId` parameter used when `item.investigationIds` is absent.

**`linkFindingsToStateItems` (core, ~10 tests):**

- Empty findings → all items map to `[]`, all in `unlinkedItemIds`.
- Empty items → empty result map, `totalLinked: 0`.
- Findings with status outside relevant set → filtered out.
- Resolver returns IDs no finding matches → empty list, item in `unlinkedItemIds`.
- Resolver returns duplicate IDs → no double-counting.
- Aggregate items (resolver returns all hub investigations) match all relevant findings.
- Per-investigation items match only their own findings.
- Resolver returns undefined → normalized to `[]` without crash.
- `totalLinked` and `unlinkedItemIds` correctness across mixed cases.
- Result is suitable for both lookup and aggregate reporting (snapshot test).

**`actionToHref` (azure, ~6 tests):**

- All 3 action kinds produce expected output.
- 5 'open-investigation' / 'open-sustainment' variants produce non-null URL strings of correct shape.
- `unsupported` action returns `null`.
- Snapshot-test the URL strings for stability.
- Exhaustive-switch enforcement: hypothetical 4th action kind triggers `@ts-expect-error` test.

**Panel (~+6 tests on existing 8):**

- Panel renders all cards with required contracts wired.
- Card click fires `actions.onInvoke(item, action)` only for non-unsupported actions.
- Unsupported card with `reason: 'planned'` renders "Planned" pill, no click affordance, has tooltip.
- Unsupported card with `reason: 'informational'` renders "Informational" pill, no click affordance.
- Evidence chip shows correct count from `evidence.findingsFor(item).length`.
- Evidence chip omitted when findings is empty array (per item, per chip).
- Chip click fires `evidence.onChipClick(item, findings)` with resolved findings.

**EvidenceSheet (azure, ~5 tests):**

- Renders finding labels + statuses.
- Empty findings → placeholder copy.
- Click finding → fires `onSelectFinding(finding)`.
- Close button + Esc key both close sheet.
- Sheet doesn't render when `item === null`.

**Dashboard integration (~+4 tests on existing):**

- Panel receives correct `actions` and `evidence` contracts derived from rollup.
- Click on supported path triggers `navigate()` with correct URL.
- Telemetry event fires with non-PII payload (mock App Insights, assert call args).
- Click on unsupported path is a true no-op (no nav, no telemetry, no error).

**E2E happy path (Playwright, 1 scenario):**

1. Seed Azure project with a hub containing one investigation + 1 analyzed finding.
2. Open Dashboard.
3. Assert state-item card visible with "1 finding" chip.
4. Click the chip → assert sheet opens with finding label.
5. Click the finding → assert URL navigates to `/editor/:id#finding-:fid`.
6. Use back button → assert Dashboard re-renders with state intact.

### CI gates

- `pnpm test` (turbo) all packages green.
- `pnpm --filter @variscout/ui build` clean (catches cross-package type gaps per `feedback_ui_build_before_merge`).
- `bash scripts/pr-ready-check.sh` green before each merge.
- Subagent code review per CLAUDE.md workflow.
- Each PR (PR #4 + PR #5) lands independently; both pass full CI; squash-merge in sequence.

### Manual verification (`claude --chrome`)

After PR #4 merges:

- Open Azure Dashboard with seeded hub.
- Verify each card responds correctly to its `responsePath`: 5 supported → click navigates; 2 unsupported → tooltip + 'Planned' / 'Informational' pill.
- Verify telemetry events appear in App Insights live stream (or local console).

After PR #5 merges:

- Add an analyzed finding to an investigation.
- Return to Dashboard.
- Verify evidence chip increments.
- Click chip → verify sheet opens.
- Click finding → verify navigation lands at the right anchor.

## Open Questions / Future Work

1. **Control-handoff concept revisit.** The user has flagged that the control-handoff concept itself deserves a focused design pass — its workflow scope, surface ownership (where/how handoff is performed and audited), evidence linkage to sustainment records, and relation to the response-path taxonomy are all worth re-examining as a unit. Out of scope for this spec; track as its own brainstorming session.

2. **MSA editor surface (H2).** The `'measurement-system-work'` response path renders as 'Planned' in this spec because no MSA workflow surface exists yet. H2 — Process Measurement System (per Product Method Roadmap line 155) is the natural home; design that surface separately.

3. **Aggregate-item `defaultInvestigationId` choice.** For hub-aggregate items (`capability-gap`, `change-signals`, `top-focus`), the Dashboard passes the rollup's most-recently-updated investigation (`investigation.metadata?.lastUpdatedAt ?? investigation.createdAt`, descending) as the `defaultInvestigationId` to `deriveResponsePathAction`. This is a heuristic; a richer flow (e.g. "open the investigation that contributed most to this signal") could replace it once usage data exists. The choice lives in the Dashboard's resolver helper, not in core, so it can evolve independently of the action-mapping table.

4. **Lint rule for telemetry no-PII enforcement.** A future ESLint rule that blocks `trackEvent` payloads with fields named `label`/`name`/`description`/`text`/`detail` would make ADR-059 enforcement-grade. Out of scope here.

5. **`StateItemCard` extraction.** The card subcomponent currently lives inside the panel. If a future surface (mobile cadence card, embedded snapshot) needs the same card shape, extracting it as a top-level export of `@variscout/ui` becomes worthwhile. Defer until a second consumer emerges.

6. **Sustainment-record + control-handoff evidence linkage.** Phase 6 deliverables (sustainment-records, control-handoffs) are not surfaced in the evidence chip in this spec — only findings. Adding them is straightforward (extend `linkFindingsToStateItems` or add a sibling `linkSustainmentToStateItems`); deferred so V2 stays tight. Connects to Open Question #1 above.

7. **Hub-canonical ProcessMap (H3).** Out of scope as Non-goal #2. The hub-vs-investigation ProcessMap design needs its own brainstorming session before V3 schema work begins (per `feedback_roadmap_horizon_alignment`).

## References

- Spec: `2026-04-27-layered-process-view-design.md` (parent of this V2 closure)
- Spec: `2026-04-27-process-learning-operating-model-design.md` (response-path taxonomy)
- Spec: `2026-04-27-product-method-roadmap-design.md` (H1 alignment, line 116-153)
- ADR-070: FRAME workspace (`processMap` is investigation-scoped)
- ADR-072: Process Hub storage (Azure-only feature surface)
- ADR-059: Web-first deployment (no-PII telemetry rule)
- ADR-056: PI Panel Redesign (props-based UI components, store-aware exception scope)
- Memory: `feedback_no_backcompat_clean_architecture` (required props, refactor consumers in same PR)
- Memory: `feedback_roadmap_horizon_alignment` (cross-check horizons before scoping)
- Memory: `project_phase_2_v2_closure` (this spec's broader Phase 2 V2 context)
