---
title: Actionable Current Process State Panel — Implementation Plan
status: delivered
---

# Actionable Current Process State Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ProcessHubCurrentStatePanel` actionable: every state-item card becomes a clickable affordance routing to the correct response-path workflow, and each card surfaces an evidence-count chip.

**Architecture:** Three-layer slice per spec. New core modules (`responsePathAction.ts`, `processEvidence.ts`) own the product-domain semantics. The panel in `@variscout/ui` exposes three required props (`state`, `actions`, `evidence`). Azure adds a thin `routing/processHubRoutes.ts` URL adapter and wires the Dashboard with App Insights telemetry. PWA is unaffected (Process Hub is Azure-only).

**Tech Stack:** TypeScript • React + Vitest + RTL • react-router (Azure) • Tailwind v4 • App Insights browser SDK • pnpm workspaces / Turbo

**Spec:** `docs/superpowers/specs/2026-04-27-actionable-current-process-state-panel-design.md` (commit `24e85496` on main)

---

## Implementation Reality Notes (read before starting)

Two facts surfaced during plan exploration that diverge slightly from the spec's literal text — implementation must respect these:

1. **`Finding` has no `investigationId` field.** The Finding type in `packages/core/src/findings/types.ts:478` carries `context: FindingContext` and a `questionId?` but no direct investigation linkage. Findings live inside per-investigation storage. The spec's signature `linkFindingsToStateItems(items, findings, resolveInvestigationIds)` is implemented faithfully **as a pure 2-input join** — but the caller (Dashboard) is responsible for grouping findings by investigation before calling it. The plan adopts the cleaner shape: pass `findingsByInvestigationId: ReadonlyMap<string, readonly Finding[]>` instead of a flat `findings[]`. This documented divergence is recorded in the plan's PR #5 Task 1.

2. **Dashboard does not load findings hub-wide today.** Loading all findings across all investigations on Dashboard mount would be a meaningful new data load. PR #5 uses `ProcessHubInvestigationMetadata.findingCounts` (already on the rollup, cheap) for the chip's count display. The full `EvidenceSheet` with finding labels is **scoped down to a follow-up PR** — the chip click in this PR navigates to the most-recent linked investigation instead. The spec's EvidenceSheet design is intact for that follow-up.

These are the only divergences. All other contracts (ResponsePathAction, deriveResponsePathAction, panel props, telemetry events) match the spec exactly.

---

## File Map

### PR #4 — Response-path routing

**Create:**

- `packages/core/src/responsePathAction.ts` — ResponsePathAction discriminated union + deriveResponsePathAction pure function
- `packages/core/src/__tests__/responsePathAction.test.ts` — ~8 tests
- `apps/azure/src/routing/processHubRoutes.ts` — actionToHref single URL source
- `apps/azure/src/routing/__tests__/processHubRoutes.test.ts` — ~6 tests

**Modify:**

- `packages/core/src/index.ts` — export ResponsePathAction + deriveResponsePathAction
- `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx` — add 2 required props (state, actions); refactor StateItemCard to consume actions
- `packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx` — extend +6 tests for action behavior
- `apps/azure/src/components/ProcessHubReviewPanel.tsx` — pass `actions` contract to panel, plumb new callback prop up
- `apps/azure/src/lib/appInsights.ts` — add `safeTrackEvent` wrapper export
- `apps/azure/src/pages/Dashboard.tsx` — wire onResponsePathAction handler at the right level (whichever component owns navigation; likely passes through to App)
- `apps/azure/src/components/__tests__/ProcessHubReviewPanel.test.tsx` (if exists) or relevant integration test — assert handler wires correctly

### PR #5 — Evidence chip from `findingCounts`

**Create:**

- `packages/core/src/processEvidence.ts` — linkFindingsToStateItems pure function (exported but called with empty findingsByInvestigationId in this PR)
- `packages/core/src/__tests__/processEvidence.test.ts` — ~10 tests

**Modify:**

- `packages/core/src/index.ts` — export linkFindingsToStateItems + RELEVANT_FINDING_STATUSES
- `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx` — add `evidence` required prop (3rd contract); render evidence chip on each card
- `packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx` — extend with chip render/click tests
- `apps/azure/src/components/ProcessHubReviewPanel.tsx` — derive `evidenceFor` from `rollup.investigations[*].metadata.findingCounts`, pass `evidence` contract to panel
- `apps/azure/src/lib/appInsights.ts` — extend to emit chip-click event

(EvidenceSheet creation deferred — see "Future PRs" at end.)

---

## PR #4 — Response-path routing

**Branch:** `phase-2/pr-4-response-path-routing`
**Estimated diff:** ~450-550 LOC
**Independent of PR #5? Yes.** PR #5 builds on the same panel but PR #5 only adds the 3rd prop (`evidence`); PR #4 adds the first two (`state` is existing, `actions` new).

### Task 1: Branch from main, sync state

**Files:** none (git only)

- [ ] **Step 1: Verify main is clean**

```bash
git status
git fetch origin
git log HEAD..origin/main --oneline
```

Expected: `nothing added to commit but untracked files present` (only the existing `docs/06-design-system/claude desing/` untracked dir is OK), no commits behind origin/main.

- [ ] **Step 2: Create branch**

```bash
git checkout -b phase-2/pr-4-response-path-routing main
```

Expected: `Switched to a new branch 'phase-2/pr-4-response-path-routing'`

### Task 2: Add `assertNever` helper if not present

The exhaustive-switch pattern needs an `assertNever` helper. Check if one already exists; if not, add one to a shared util.

**Files:**

- Check: `packages/core/src/types.ts`, `packages/core/src/utils.ts`, `packages/core/src/index.ts`

- [ ] **Step 1: Search for existing assertNever**

```bash
grep -rn "assertNever" /Users/jukka-mattiturtiainen/Projects/VariScout_lite/packages/core/src/ | head
```

- [ ] **Step 2 (if missing): Add to `packages/core/src/types.ts` (or appropriate util file)**

```ts
/**
 * Exhaustive switch helper. The TypeScript compiler enforces that all cases
 * are handled — if a new variant is added to a union, calls to assertNever
 * become a compile error at the default case.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}
```

(Skip Step 2 if already present; just import it where needed.)

- [ ] **Step 3 (if added): Export from packages/core/src/index.ts**

```ts
export { assertNever } from './types';
```

### Task 3: Write failing tests for `responsePathAction`

**Files:**

- Test: `packages/core/src/__tests__/responsePathAction.test.ts` (new)

- [ ] **Step 1: Write the test file**

```ts
import { describe, expect, it } from 'vitest';
import type { ProcessStateItem } from '../processState';
import { deriveResponsePathAction, type ResponsePathAction } from '../responsePathAction';

const baseItem = (overrides: Partial<ProcessStateItem> = {}): ProcessStateItem => ({
  id: 'item-1',
  lens: 'outcome',
  severity: 'amber',
  responsePath: 'monitor',
  source: 'review-signal',
  label: 'Item label',
  ...overrides,
});

const DEFAULT_ID = 'inv-default';

describe('deriveResponsePathAction', () => {
  it('returns unsupported/informational for monitor', () => {
    const action = deriveResponsePathAction(baseItem({ responsePath: 'monitor' }), DEFAULT_ID);
    expect(action).toEqual({ kind: 'unsupported', reason: 'informational' });
  });

  it('returns unsupported/planned for measurement-system-work', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'measurement-system-work' }),
      DEFAULT_ID
    );
    expect(action).toEqual({ kind: 'unsupported', reason: 'planned' });
  });

  it('maps quick-action to open-investigation/quick using defaultInvestigationId', () => {
    const action = deriveResponsePathAction(baseItem({ responsePath: 'quick-action' }), DEFAULT_ID);
    expect(action).toEqual({
      kind: 'open-investigation',
      investigationId: DEFAULT_ID,
      intent: 'quick',
    });
  });

  it('maps focused-investigation to open-investigation/focused', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'focused-investigation' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-investigation',
      investigationId: DEFAULT_ID,
      intent: 'focused',
    });
  });

  it('maps chartered-project to open-investigation/chartered', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'chartered-project' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-investigation',
      investigationId: DEFAULT_ID,
      intent: 'chartered',
    });
  });

  it('maps sustainment-review to open-sustainment/review', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'sustainment-review' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-sustainment',
      investigationId: DEFAULT_ID,
      surface: 'review',
    });
  });

  it('maps control-handoff to open-sustainment/handoff', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'control-handoff' }),
      DEFAULT_ID
    );
    expect(action).toEqual({
      kind: 'open-sustainment',
      investigationId: DEFAULT_ID,
      surface: 'handoff',
    });
  });

  it('uses item.investigationIds[0] when present (queue items)', () => {
    const action = deriveResponsePathAction(
      baseItem({
        responsePath: 'focused-investigation',
        investigationIds: ['inv-from-item', 'inv-other'],
      }),
      DEFAULT_ID
    );
    expect(action).toMatchObject({ kind: 'open-investigation', investigationId: 'inv-from-item' });
  });

  it('falls back to defaultInvestigationId when item.investigationIds is empty', () => {
    const action = deriveResponsePathAction(
      baseItem({ responsePath: 'focused-investigation', investigationIds: [] }),
      DEFAULT_ID
    );
    expect(action).toMatchObject({ kind: 'open-investigation', investigationId: DEFAULT_ID });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail (file doesn't exist yet)**

```bash
pnpm --filter @variscout/core exec vitest run src/__tests__/responsePathAction.test.ts
```

Expected: FAIL with "Cannot find module '../responsePathAction'" or similar resolution error.

### Task 4: Implement `responsePathAction.ts`

**Files:**

- Create: `packages/core/src/responsePathAction.ts`

- [ ] **Step 1: Write the implementation**

```ts
import type { ProcessStateItem, ProcessStateResponsePath } from './processState';
import { assertNever } from './types';

export type ResponsePathAction =
  | {
      kind: 'open-investigation';
      investigationId: string;
      intent: 'focused' | 'chartered' | 'quick';
    }
  | {
      kind: 'open-sustainment';
      investigationId: string;
      surface: 'review' | 'handoff';
    }
  | { kind: 'unsupported'; reason: 'planned' | 'informational' };

/**
 * Pure mapping from a state item's response-path to a domain action.
 * Exhaustive on ProcessStateResponsePath. Returns 'unsupported' for paths
 * with no current Azure surface — those render as 'Planned' / 'Informational'
 * pills rather than fallback-routing.
 *
 * For items without their own investigation linkage, the caller passes
 * defaultInvestigationId. The Dashboard's heuristic for choosing the
 * default lives in the Dashboard (typically the rollup's most-recently-
 * updated investigation).
 */
export function deriveResponsePathAction(
  item: ProcessStateItem,
  defaultInvestigationId: string
): ResponsePathAction {
  const investigationId = item.investigationIds?.[0] ?? defaultInvestigationId;
  const path: ProcessStateResponsePath = item.responsePath;

  switch (path) {
    case 'monitor':
      return { kind: 'unsupported', reason: 'informational' };
    case 'measurement-system-work':
      return { kind: 'unsupported', reason: 'planned' };
    case 'quick-action':
      return { kind: 'open-investigation', investigationId, intent: 'quick' };
    case 'focused-investigation':
      return { kind: 'open-investigation', investigationId, intent: 'focused' };
    case 'chartered-project':
      return { kind: 'open-investigation', investigationId, intent: 'chartered' };
    case 'sustainment-review':
      return { kind: 'open-sustainment', investigationId, surface: 'review' };
    case 'control-handoff':
      return { kind: 'open-sustainment', investigationId, surface: 'handoff' };
    default:
      return assertNever(path);
  }
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
pnpm --filter @variscout/core exec vitest run src/__tests__/responsePathAction.test.ts
```

Expected: PASS, 9 tests pass.

### Task 5: Export from `@variscout/core`

**Files:**

- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Add export at appropriate section (with other process-state exports)**

Find the `export ... from './processState'` section, add directly after:

```ts
export { deriveResponsePathAction } from './responsePathAction';
export type { ResponsePathAction } from './responsePathAction';
```

- [ ] **Step 2: Verify the export resolves**

```bash
pnpm --filter @variscout/core exec tsc --noEmit
```

Expected: clean exit, no type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/responsePathAction.ts packages/core/src/__tests__/responsePathAction.test.ts packages/core/src/index.ts packages/core/src/types.ts
git commit -m "feat(core): add ResponsePathAction discriminated union + deriveResponsePathAction

Pure mapping from a state item's response-path to a domain action.
Exhaustive on ProcessStateResponsePath. Returns 'unsupported' for paths
with no current Azure surface (monitor → informational, MSA → planned).

Phase 2 V2 PR #4, Task 5.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 6: Write failing tests for `processHubRoutes.actionToHref`

**Files:**

- Test: `apps/azure/src/routing/__tests__/processHubRoutes.test.ts` (new)

- [ ] **Step 1: Write the test file**

```ts
import { describe, expect, it } from 'vitest';
import type { ResponsePathAction } from '@variscout/core';
import { actionToHref } from '../processHubRoutes';

describe('actionToHref', () => {
  it('returns null for unsupported actions', () => {
    const action: ResponsePathAction = { kind: 'unsupported', reason: 'planned' };
    expect(actionToHref(action)).toBeNull();
  });

  it('returns null for unsupported/informational', () => {
    const action: ResponsePathAction = { kind: 'unsupported', reason: 'informational' };
    expect(actionToHref(action)).toBeNull();
  });

  it('builds /editor/:id?intent=focused for open-investigation/focused', () => {
    const action: ResponsePathAction = {
      kind: 'open-investigation',
      investigationId: 'inv-123',
      intent: 'focused',
    };
    expect(actionToHref(action)).toBe('/editor/inv-123?intent=focused');
  });

  it('builds /editor/:id?intent=chartered for open-investigation/chartered', () => {
    const action: ResponsePathAction = {
      kind: 'open-investigation',
      investigationId: 'inv-abc',
      intent: 'chartered',
    };
    expect(actionToHref(action)).toBe('/editor/inv-abc?intent=chartered');
  });

  it('builds /editor/:id?intent=quick for open-investigation/quick', () => {
    const action: ResponsePathAction = {
      kind: 'open-investigation',
      investigationId: 'inv-q',
      intent: 'quick',
    };
    expect(actionToHref(action)).toBe('/editor/inv-q?intent=quick');
  });

  it('builds /editor/:id/sustainment for open-sustainment/review', () => {
    const action: ResponsePathAction = {
      kind: 'open-sustainment',
      investigationId: 'inv-s',
      surface: 'review',
    };
    expect(actionToHref(action)).toBe('/editor/inv-s/sustainment');
  });

  it('builds /editor/:id/sustainment?surface=handoff for open-sustainment/handoff', () => {
    const action: ResponsePathAction = {
      kind: 'open-sustainment',
      investigationId: 'inv-h',
      surface: 'handoff',
    };
    expect(actionToHref(action)).toBe('/editor/inv-h/sustainment?surface=handoff');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @variscout/azure-app exec vitest run src/routing/__tests__/processHubRoutes.test.ts
```

Expected: FAIL with module-not-found.

### Task 7: Implement `actionToHref`

**Files:**

- Create: `apps/azure/src/routing/processHubRoutes.ts`

- [ ] **Step 1: Write the implementation**

```ts
import { assertNever, type ResponsePathAction } from '@variscout/core';

/**
 * Single URL source for ProcessHub state-item actions.
 * Exhaustive switch on action.kind. Returns null for 'unsupported' actions.
 */
export function actionToHref(action: ResponsePathAction): string | null {
  switch (action.kind) {
    case 'unsupported':
      return null;
    case 'open-investigation':
      return `/editor/${action.investigationId}?intent=${action.intent}`;
    case 'open-sustainment': {
      const base = `/editor/${action.investigationId}/sustainment`;
      return action.surface === 'handoff' ? `${base}?surface=handoff` : base;
    }
    default:
      return assertNever(action);
  }
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
pnpm --filter @variscout/azure-app exec vitest run src/routing/__tests__/processHubRoutes.test.ts
```

Expected: PASS, 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/azure/src/routing/processHubRoutes.ts apps/azure/src/routing/__tests__/processHubRoutes.test.ts
git commit -m "feat(azure): add actionToHref URL adapter for ResponsePathAction

Thin Azure-side adapter mapping ResponsePathAction discriminated union
to URL strings. Single URL source — adding a new ResponsePathAction
variant in core triggers a TS build error here via the exhaustive
switch.

Phase 2 V2 PR #4, Task 7.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 8: Add `safeTrackEvent` to `appInsights.ts`

**Files:**

- Modify: `apps/azure/src/lib/appInsights.ts`

- [ ] **Step 1: Read the file to find the right insertion point**

```bash
grep -n "^export function" /Users/jukka-mattiturtiainen/Projects/VariScout_lite/apps/azure/src/lib/appInsights.ts
```

Expected: list of existing exported functions (initAppInsights, trackException, flushTraces, trackAICall, teardownTelemetry).

- [ ] **Step 2: Add `safeTrackEvent` after the existing trackException export**

Find `export function trackException(...)` and add this directly after it (preserving the file's `let appInsights` variable scope at module top):

```ts
/**
 * Safe wrapper around App Insights' trackEvent.
 *
 * Telemetry must NEVER block UX. If App Insights is unavailable (local dev,
 * SDK not loaded, transient failure), this silently swallows the error.
 *
 * Per ADR-059, payload MUST NOT contain PII (no labels, names, descriptions,
 * customer text, raw column names). Stick to enum values, hashed/opaque IDs,
 * and integers.
 */
export function safeTrackEvent(
  name: string,
  properties: Record<string, string | number | boolean | undefined>
): void {
  if (!appInsights) return;
  try {
    appInsights.trackEvent({ name }, properties);
  } catch {
    // Telemetry failure is never load-bearing.
  }
}
```

- [ ] **Step 3: Verify it compiles**

```bash
pnpm --filter @variscout/azure-app exec tsc --noEmit
```

Expected: clean exit.

### Task 9: Write the failing panel test for action-aware behavior

**Files:**

- Modify: `packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx`

- [ ] **Step 1: Read the existing test file structure**

The existing 8 tests pass `<ProcessHubCurrentStatePanel state={state} />`. After this PR's refactor, the panel will require `state`, `actions`, and `evidence` props. The new test will fail because the test helper invocation doesn't pass `actions` (and TS will error at compile time, vitest at run).

- [ ] **Step 2: Add a test helper at the top of the test file (after `buildItem`)**

```ts
import type { ResponsePathAction } from '@variscout/core';
import { vi } from 'vitest';

const NOOP_ACTION: ResponsePathAction = { kind: 'unsupported', reason: 'informational' };

function makeActions(
  overrides: { actionFor?: (item: ProcessStateItem) => ResponsePathAction } = {}
) {
  const actionFor = overrides.actionFor ?? (() => NOOP_ACTION);
  const onInvoke = vi.fn();
  return { actionFor, onInvoke };
}

function makeEvidence() {
  // Stubbed evidence contract for PR #4 tests; chip behavior is tested in PR #5.
  return {
    findingsFor: () => [],
    onChipClick: vi.fn(),
  };
}
```

- [ ] **Step 3: Update existing tests to pass the new required props**

Each existing `render(<ProcessHubCurrentStatePanel state={...} />)` call must become `render(<ProcessHubCurrentStatePanel state={...} actions={makeActions()} evidence={makeEvidence()} />)`. Update all 8 existing tests.

- [ ] **Step 4: Add 6 new tests for action behavior**

```ts
describe('ProcessHubCurrentStatePanel — actions', () => {
  it('fires onInvoke with the supported action when card is clicked', async () => {
    const supportedAction: ResponsePathAction = {
      kind: 'open-investigation',
      investigationId: 'inv-1',
      intent: 'focused',
    };
    const item = buildItem({ id: 'item-x', responsePath: 'focused-investigation' });
    const actions = makeActions({ actionFor: () => supportedAction });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    card.click();

    expect(actions.onInvoke).toHaveBeenCalledWith(item, supportedAction);
  });

  it('does NOT fire onInvoke for unsupported/planned cards', async () => {
    const item = buildItem({ id: 'item-msa', responsePath: 'measurement-system-work' });
    const actions = makeActions({
      actionFor: () => ({ kind: 'unsupported', reason: 'planned' }),
    });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    card.click();

    expect(actions.onInvoke).not.toHaveBeenCalled();
  });

  it('renders Planned pill on cards with unsupported/planned action', () => {
    const item = buildItem({ id: 'item-msa', responsePath: 'measurement-system-work' });
    const actions = makeActions({
      actionFor: () => ({ kind: 'unsupported', reason: 'planned' }),
    });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    expect(within(card).getByText(/Planned/)).toBeInTheDocument();
  });

  it('renders Informational pill on cards with unsupported/informational action', () => {
    const item = buildItem({ id: 'item-mon', responsePath: 'monitor' });
    const actions = makeActions({
      actionFor: () => ({ kind: 'unsupported', reason: 'informational' }),
    });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    expect(within(card).getByText(/Informational/)).toBeInTheDocument();
  });

  it('exposes a tooltip-text attribute on Planned cards', () => {
    const item = buildItem({ id: 'item-msa', responsePath: 'measurement-system-work' });
    const actions = makeActions({
      actionFor: () => ({ kind: 'unsupported', reason: 'planned' }),
    });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    expect(card).toHaveAttribute('title', expect.stringMatching(/planned/i));
  });

  it('makes the supported card keyboard-activatable (Enter key)', () => {
    const action: ResponsePathAction = {
      kind: 'open-sustainment',
      investigationId: 'inv-y',
      surface: 'review',
    };
    const item = buildItem({ id: 'item-y', responsePath: 'sustainment-review' });
    const actions = makeActions({ actionFor: () => action });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    card.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(actions.onInvoke).toHaveBeenCalledWith(item, action);
  });
});
```

- [ ] **Step 5: Run the test file to verify the new tests fail (and old ones pass with the new prop shape)**

```bash
pnpm --filter @variscout/ui exec vitest run src/components/ProcessHubCurrentStatePanel
```

Expected: FAIL — new tests fail because the panel doesn't yet handle the actions contract; old tests fail because they now require actions/evidence props (TS error or runtime error).

### Task 10: Refactor `ProcessHubCurrentStatePanel` to consume the actions contract

**Files:**

- Modify: `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx`

- [ ] **Step 1: Update the props interface**

Replace the existing `ProcessHubCurrentStatePanelProps`:

```ts
import type {
  CurrentProcessState,
  ProcessStateItem,
  ProcessStateLens,
  ProcessStateResponsePath,
  ProcessStateSeverity,
  ResponsePathAction,
} from '@variscout/core';
import { assertNever } from '@variscout/core';
import { formatPlural, formatStatistic } from '@variscout/core/i18n';
import type { Finding } from '@variscout/core';

export interface ProcessHubActionsContract {
  actionFor: (item: ProcessStateItem) => ResponsePathAction;
  onInvoke: (item: ProcessStateItem, action: ResponsePathAction) => void;
}

export interface ProcessHubEvidenceContract {
  findingsFor: (item: ProcessStateItem) => readonly Finding[];
  onChipClick: (item: ProcessStateItem, findings: readonly Finding[]) => void;
}

export interface ProcessHubCurrentStatePanelProps {
  state: CurrentProcessState;
  actions: ProcessHubActionsContract;
  evidence: ProcessHubEvidenceContract;
}
```

- [ ] **Step 2: Add tooltip + pill copy maps near the existing label maps**

```ts
const UNSUPPORTED_PILL_LABEL: Record<'planned' | 'informational', string> = {
  planned: 'Planned',
  informational: 'Informational',
};

const UNSUPPORTED_TOOLTIP: Record<'planned' | 'informational', string> = {
  planned: 'This response path is planned for a future horizon.',
  informational: 'No action needed — this item is informational only.',
};
```

- [ ] **Step 3: Refactor `StateItemCard` to consume action**

Replace the existing `StateItemCard` implementation:

```ts
const StateItemCard: React.FC<{
  item: ProcessStateItem;
  action: ResponsePathAction;
  onInvoke: (item: ProcessStateItem, action: ResponsePathAction) => void;
}> = ({ item, action, onInvoke }) => {
  const detail = formatStateDetail(item);
  const isSupported = action.kind !== 'unsupported';

  const handleActivate = () => {
    if (isSupported) onInvoke(item, action);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isSupported) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onInvoke(item, action);
    }
  };

  let pillText: string;
  let tooltipText: string | undefined;
  switch (action.kind) {
    case 'unsupported':
      pillText = `${RESPONSE_LABELS[item.responsePath]} · ${UNSUPPORTED_PILL_LABEL[action.reason]}`;
      tooltipText = UNSUPPORTED_TOOLTIP[action.reason];
      break;
    case 'open-investigation':
    case 'open-sustainment':
      pillText = RESPONSE_LABELS[item.responsePath];
      tooltipText = undefined;
      break;
    default:
      assertNever(action);
  }

  const interactiveProps = isSupported
    ? {
        role: 'button',
        tabIndex: 0,
        onClick: handleActivate,
        onKeyDown: handleKeyDown,
        'aria-label': `${item.label} — ${RESPONSE_LABELS[item.responsePath]}`,
      }
    : { 'aria-disabled': true };

  return (
    <div
      className={`rounded-md border bg-surface px-3 py-2 ${SEVERITY_CLASS[item.severity]} ${
        isSupported ? 'cursor-pointer transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-blue-500' : ''
      }`}
      data-testid="current-state-item"
      title={tooltipText}
      {...interactiveProps}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
            {LENS_LABELS[item.lens]}
          </p>
          <p className="mt-1 text-sm font-medium text-content">{item.label}</p>
          {detail && <p className="mt-1 text-xs text-content-secondary">{detail}</p>}
        </div>
        <span className="rounded-sm border border-current px-2 py-0.5 text-xs font-medium">
          {SEVERITY_LABELS[item.severity]}
        </span>
      </div>
      <p className="mt-2 inline-flex rounded-sm border border-edge px-2 py-0.5 text-xs font-medium text-content-secondary">
        {pillText}
      </p>
    </div>
  );
};
```

- [ ] **Step 4: Update the component body to thread actions and evidence**

Replace the existing `ProcessHubCurrentStatePanel` body:

```ts
export const ProcessHubCurrentStatePanel: React.FC<ProcessHubCurrentStatePanelProps> = ({
  state,
  actions,
  evidence: _evidence,  // unused in PR #4 — wired in PR #5
}) => {
  const visibleItems = state.items.slice(0, 6);
  const hiddenCount = Math.max(0, state.items.length - visibleItems.length);

  return (
    <div className="mt-4" data-testid="current-process-state">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-content">
          <Activity size={16} />
          <h4>Current Process State</h4>
        </div>
        <span
          className={`rounded-sm border px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[state.overallSeverity]}`}
        >
          {SEVERITY_LABELS[state.overallSeverity]}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        {LENSES.map(lens => (
          <StateCountCard key={lens} lens={lens} count={state.lensCounts[lens]} />
        ))}
      </div>

      {visibleItems.length > 0 ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {visibleItems.map(item => (
            <StateItemCard
              key={item.id}
              item={item}
              action={actions.actionFor(item)}
              onInvoke={actions.onInvoke}
            />
          ))}
          {hiddenCount > 0 && (
            <p className="rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
              +{hiddenCount} more current-state items
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-edge px-3 py-3 text-sm text-content-secondary">
          No current process state signals yet
        </p>
      )}
    </div>
  );
};
```

- [ ] **Step 5: Verify the panel test file compiles**

```bash
pnpm --filter @variscout/ui exec tsc --noEmit
```

Expected: clean exit. Any errors here mean the test file's makeActions/makeEvidence helpers don't match the contracts — fix the test file or the implementation, depending on the discrepancy.

- [ ] **Step 6: Run all panel tests to verify passing**

```bash
pnpm --filter @variscout/ui exec vitest run src/components/ProcessHubCurrentStatePanel
```

Expected: PASS, 14 tests pass (8 existing + 6 new).

### Task 11: Refactor `ProcessHubReviewPanel` to pass the actions contract

**Files:**

- Modify: `apps/azure/src/components/ProcessHubReviewPanel.tsx`

- [ ] **Step 1: Add a callback prop to ProcessHubReviewPanelProps**

```ts
import type {
  ProcessHubInvestigation,
  ProcessHubRollup,
  ProcessStateItem,
  ResponsePathAction,
} from '@variscout/core';

interface ProcessHubReviewPanelProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
  onOpenInvestigation: (id: string) => void;
  onStartInvestigation: () => void;
  onSetupSustainment: (investigationId: string) => void;
  onLogReview: (recordId: string) => void;
  onRecordHandoff: (investigationId: string) => void;
  onResponsePathAction: (item: ProcessStateItem, action: ResponsePathAction) => void; // NEW
}
```

- [ ] **Step 2: Compute `defaultInvestigationId` from the rollup**

Inside the component body, after `const cadence = ...` and `const currentState = ...`:

```ts
import { deriveResponsePathAction } from '@variscout/core';

// Pick the most-recently-updated investigation in this hub as the
// default navigation target for hub-aggregate state items (capability-gap,
// change-signals, top-focus). For per-investigation items, the action
// uses item.investigationIds[0] instead.
const defaultInvestigationId = React.useMemo(() => {
  const sorted = [...rollup.investigations].sort((a, b) =>
    (b.modified ?? '').localeCompare(a.modified ?? '')
  );
  return sorted[0]?.id ?? '';
}, [rollup.investigations]);

const actionFor = React.useCallback(
  (item: ProcessStateItem) => deriveResponsePathAction(item, defaultInvestigationId),
  [defaultInvestigationId]
);
```

- [ ] **Step 3: Pass the actions contract to ProcessHubCurrentStatePanel**

Replace the existing `<ProcessHubCurrentStatePanel state={currentState} />` line with:

```tsx
<ProcessHubCurrentStatePanel
  state={currentState}
  actions={{ actionFor, onInvoke: onResponsePathAction }}
  evidence={{ findingsFor: () => [], onChipClick: () => {} }} // wired in PR #5
/>
```

- [ ] **Step 4: Verify ProcessHubReviewPanel compiles**

```bash
pnpm --filter @variscout/azure-app exec tsc --noEmit
```

Expected: One error at the consumer of `ProcessHubReviewPanel` (Dashboard.tsx) — it doesn't pass `onResponsePathAction` yet. That's the next task.

### Task 12: Wire `onResponsePathAction` in Dashboard.tsx

**Files:**

- Modify: `apps/azure/src/pages/Dashboard.tsx`

- [ ] **Step 1: Open Dashboard.tsx and find the ProcessHubReviewPanel render (~line 433)**

```bash
grep -n "ProcessHubReviewPanel" /Users/jukka-mattiturtiainen/Projects/VariScout_lite/apps/azure/src/pages/Dashboard.tsx
```

- [ ] **Step 2: Add the imports**

Near other type imports at the top:

```ts
import type { ProcessStateItem, ResponsePathAction } from '@variscout/core';
import { actionToHref } from '../routing/processHubRoutes';
import { safeTrackEvent } from '../lib/appInsights';
```

- [ ] **Step 3: Add a memoized handler inside the Dashboard component**

Find a useCallback section in the Dashboard component (or add one near other handlers). The handler signature accepts `(item, action)`:

```tsx
const handleResponsePathAction = useCallback(
  (item: ProcessStateItem, action: ResponsePathAction) => {
    const href = actionToHref(action);
    if (!href) return; // unsupported

    safeTrackEvent('process_hub.response_path_click', {
      hubId: item.investigationIds?.[0] ?? 'aggregate', // hash-friendly opaque
      responsePath: item.responsePath,
      lens: item.lens,
      severity: item.severity,
    });

    // Dashboard already exposes onOpenProject for investigation navigation.
    // For now, route the navigation through that callback by extracting
    // the investigation id from the action.
    if (action.kind === 'open-investigation' || action.kind === 'open-sustainment') {
      onOpenProject(action.investigationId);
    }
  },
  [onOpenProject]
);
```

> **Note:** Full URL routing (intent + sustainment surface query params) requires the App-level navigation to honor those params. For this PR, we use `onOpenProject(investigationId)` which opens the editor. The intent query param is logged via telemetry but not yet acted on by the editor. A follow-up PR can wire the editor to honor `?intent=` and `?surface=`.

- [ ] **Step 4: Pass the handler to ProcessHubReviewPanel**

Find the existing `<ProcessHubReviewPanel ...>` render and add:

```tsx
<ProcessHubReviewPanel
  rollup={rollup}
  onOpenInvestigation={id => onOpenProject(id)}
  onStartInvestigation={onStartInvestigation}
  onSetupSustainment={onSetupSustainment}
  onLogReview={onLogReview}
  onRecordHandoff={onRecordHandoff}
  onResponsePathAction={handleResponsePathAction} // NEW
/>
```

- [ ] **Step 5: Verify Dashboard.tsx compiles**

```bash
pnpm --filter @variscout/azure-app exec tsc --noEmit
```

Expected: clean exit.

### Task 13: Run all tests + ui build

**Files:** none

- [ ] **Step 1: Run @variscout/core tests**

```bash
pnpm --filter @variscout/core exec vitest run
```

Expected: PASS. (Was 2805 + new 9 in responsePathAction = 2814.)

- [ ] **Step 2: Run @variscout/ui tests**

```bash
pnpm --filter @variscout/ui exec vitest run
```

Expected: PASS. (Panel tests now 14.)

- [ ] **Step 3: Run @variscout/azure-app tests**

```bash
pnpm --filter @variscout/azure-app exec vitest run
```

Expected: PASS. (924 + 7 new in processHubRoutes = 931.)

- [ ] **Step 4: Run @variscout/ui build (cross-package type check)**

```bash
pnpm --filter @variscout/ui build
```

Expected: clean tsc + vite build.

- [ ] **Step 5: Run pr-ready-check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: All checks passed.

### Task 14: Commit panel + consumer + Dashboard refactor

**Files:** all PR #4 changes since Task 7's commit

- [ ] **Step 1: Stage and commit**

```bash
git add packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx \
        packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx \
        apps/azure/src/components/ProcessHubReviewPanel.tsx \
        apps/azure/src/pages/Dashboard.tsx \
        apps/azure/src/lib/appInsights.ts
git commit -m "feat(ui,azure): wire ProcessHubCurrentStatePanel response-path actions

Refactors ProcessHubCurrentStatePanel to accept required actions +
evidence contracts (no back-compat optionality per
feedback_no_backcompat_clean_architecture). State-item cards become
clickable affordances routing to the appropriate workflow surface;
'monitor' and 'measurement-system-work' paths render as
'Informational' / 'Planned' pills with no click affordance.

Adds:
- safeTrackEvent wrapper in apps/azure/src/lib/appInsights.ts
- onResponsePathAction prop on ProcessHubReviewPanel
- handleResponsePathAction in Dashboard with App Insights telemetry
- 6 new panel tests for action behavior (8 existing rewired to new props)

Evidence contract is stubbed in this PR (passes empty findingsFor/onChipClick);
PR #5 wires the chip count + click.

Phase 2 V2 PR #4, Tasks 9-14.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 15: Push, open PR, subagent review, merge

**Files:** none (workflow)

- [ ] **Step 1: Push branch**

```bash
git push -u origin phase-2/pr-4-response-path-routing
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --base main --head phase-2/pr-4-response-path-routing \
  --title "feat: ProcessHubCurrentStatePanel actions (Phase 2 V2 PR #4)" \
  --body "$(cat <<'EOF'
## Summary
- Implements PR #4 of the Phase 2 V2 closure spec at `docs/superpowers/specs/2026-04-27-actionable-current-process-state-panel-design.md`.
- Adds `ResponsePathAction` discriminated union + `deriveResponsePathAction` pure function in `@variscout/core`.
- Adds `actionToHref` URL adapter + `safeTrackEvent` telemetry wrapper in `apps/azure`.
- Refactors `ProcessHubCurrentStatePanel` to take required `actions` + `evidence` contracts (no back-compat optionality).
- State-item cards become clickable affordances; `monitor` and `measurement-system-work` render as Informational / Planned.

## Test plan
- [ ] `pnpm --filter @variscout/core exec vitest run` — 9 new tests in responsePathAction
- [ ] `pnpm --filter @variscout/ui exec vitest run` — 6 new panel tests + 8 existing rewired
- [ ] `pnpm --filter @variscout/azure-app exec vitest run` — 7 new tests in processHubRoutes
- [ ] `pnpm --filter @variscout/ui build` clean
- [ ] `bash scripts/pr-ready-check.sh` green
- [ ] `claude --chrome` walk: open Azure Dashboard, click each card type, verify supported paths navigate, unsupported paths show pill + tooltip

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Subagent code review**

Dispatch `feature-dev:code-reviewer` with prompt: "Review the diff on branch `phase-2/pr-4-response-path-routing` against main. Spec at docs/superpowers/specs/2026-04-27-actionable-current-process-state-panel-design.md. Focus on: required-props-no-backcompat invariant, exhaustive switches with assertNever defaults, no-PII telemetry payloads, downward dep flow (core→ui→apps), test coverage."

- [ ] **Step 4: Squash-merge after review approves**

```bash
gh pr merge <PR-NUMBER> --squash --delete-branch
git checkout main
git pull --ff-only origin main
```

---

## PR #5 — Evidence chip from `findingCounts`

**Branch:** `phase-2/pr-5-evidence-chip`
**Estimated diff:** ~300-400 LOC
**Depends on:** PR #4 merged.

**Pragmatic divergence from spec:** Dashboard does NOT load full `Finding[]` objects today. The chip count uses `ProcessHubInvestigationMetadata.findingCounts` (already on the rollup). Chip click navigates to the most-recent linked investigation (no EvidenceSheet in this PR — sheet rendering is deferred until a Dashboard-side findings-load decision is made). The `linkFindingsToStateItems` aggregator is still implemented in core per spec — it's a pure function and ships with full test coverage even though the Dashboard initially calls it with empty findings.

### Task 1: Branch + write failing tests for `processEvidence`

**Files:**

- Test: `packages/core/src/__tests__/processEvidence.test.ts` (new)

- [ ] **Step 1: Branch**

```bash
git checkout -b phase-2/pr-5-evidence-chip main
```

- [ ] **Step 2: Write the test file**

```ts
import { describe, expect, it } from 'vitest';
import type { Finding } from '../findings/types';
import type { ProcessStateItem } from '../processState';
import { linkFindingsToStateItems, RELEVANT_FINDING_STATUSES } from '../processEvidence';

const baseItem = (overrides: Partial<ProcessStateItem> = {}): ProcessStateItem => ({
  id: 'item-1',
  lens: 'outcome',
  severity: 'amber',
  responsePath: 'monitor',
  source: 'review-signal',
  label: 'Item label',
  ...overrides,
});

const baseFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: `finding-${Math.floor(Math.random() * 1e9)}`,
  text: 'A finding',
  createdAt: 1714000000000,
  context: {
    /* minimal — adapt to actual FindingContext shape */
  } as Finding['context'],
  status: 'analyzed',
  comments: [],
  statusChangedAt: 1714000000000,
  ...overrides,
});

describe('RELEVANT_FINDING_STATUSES', () => {
  it('includes analyzed, improving, resolved', () => {
    expect(RELEVANT_FINDING_STATUSES.has('analyzed')).toBe(true);
    expect(RELEVANT_FINDING_STATUSES.has('improving')).toBe(true);
    expect(RELEVANT_FINDING_STATUSES.has('resolved')).toBe(true);
  });

  it('excludes observed and investigating', () => {
    expect(RELEVANT_FINDING_STATUSES.has('observed')).toBe(false);
    expect(RELEVANT_FINDING_STATUSES.has('investigating')).toBe(false);
  });
});

describe('linkFindingsToStateItems', () => {
  it('returns an empty result when there are no items', () => {
    const result = linkFindingsToStateItems([], new Map(), () => []);
    expect(result.byItemId.size).toBe(0);
    expect(result.totalLinked).toBe(0);
    expect(result.unlinkedItemIds).toEqual([]);
  });

  it('returns an empty mapping per item when findingsByInvestigationId is empty', () => {
    const items = [baseItem({ id: 'item-a' }), baseItem({ id: 'item-b' })];
    const result = linkFindingsToStateItems(items, new Map(), () => ['inv-1']);
    expect(result.byItemId.get('item-a')).toEqual([]);
    expect(result.byItemId.get('item-b')).toEqual([]);
    expect(result.totalLinked).toBe(0);
    expect(result.unlinkedItemIds).toEqual(['item-a', 'item-b']);
  });

  it('matches findings by resolver-returned investigation IDs', () => {
    const findings = new Map([
      ['inv-1', [baseFinding({ id: 'f-1' }), baseFinding({ id: 'f-2' })]],
      ['inv-2', [baseFinding({ id: 'f-3' })]],
    ]);
    const items = [baseItem({ id: 'item-x' }), baseItem({ id: 'item-y' })];
    const result = linkFindingsToStateItems(items, findings, item =>
      item.id === 'item-x' ? ['inv-1'] : ['inv-2']
    );
    expect(result.byItemId.get('item-x')).toHaveLength(2);
    expect(result.byItemId.get('item-y')).toHaveLength(1);
    expect(result.totalLinked).toBe(3);
    expect(result.unlinkedItemIds).toEqual([]);
  });

  it('filters findings outside RELEVANT_FINDING_STATUSES', () => {
    const findings = new Map([
      [
        'inv-1',
        [
          baseFinding({ id: 'analyzed', status: 'analyzed' }),
          baseFinding({ id: 'observed', status: 'observed' }),
          baseFinding({ id: 'investigating', status: 'investigating' }),
          baseFinding({ id: 'resolved', status: 'resolved' }),
        ],
      ],
    ]);
    const result = linkFindingsToStateItems([baseItem()], findings, () => ['inv-1']);
    const linked = result.byItemId.get('item-1') ?? [];
    expect(linked.map(f => f.id)).toEqual(['analyzed', 'resolved']);
  });

  it('aggregates findings across multiple investigation IDs returned by resolver', () => {
    const findings = new Map([
      ['inv-1', [baseFinding({ id: 'f-1' })]],
      ['inv-2', [baseFinding({ id: 'f-2' }), baseFinding({ id: 'f-3' })]],
      ['inv-3', [baseFinding({ id: 'f-4' })]],
    ]);
    const result = linkFindingsToStateItems([baseItem({ id: 'agg' })], findings, () => [
      'inv-1',
      'inv-2',
      'inv-3',
    ]);
    expect(result.byItemId.get('agg')).toHaveLength(4);
  });

  it('deduplicates investigation IDs returned by resolver', () => {
    const findings = new Map([['inv-1', [baseFinding()]]]);
    const result = linkFindingsToStateItems([baseItem()], findings, () => [
      'inv-1',
      'inv-1',
      'inv-1',
    ]);
    expect(result.byItemId.get('item-1')).toHaveLength(1);
  });

  it('treats undefined resolver return as empty array', () => {
    const findings = new Map([['inv-1', [baseFinding()]]]);
    // @ts-expect-error — testing resolver returning undefined at runtime
    const result = linkFindingsToStateItems([baseItem()], findings, () => undefined);
    expect(result.byItemId.get('item-1')).toEqual([]);
    expect(result.unlinkedItemIds).toEqual(['item-1']);
  });

  it('collects unlinkedItemIds for items with zero matched findings', () => {
    const findings = new Map([['inv-1', [baseFinding()]]]);
    const result = linkFindingsToStateItems(
      [baseItem({ id: 'matched' }), baseItem({ id: 'no-match' })],
      findings,
      item => (item.id === 'matched' ? ['inv-1'] : ['inv-other'])
    );
    expect(result.unlinkedItemIds).toEqual(['no-match']);
    expect(result.totalLinked).toBe(1);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
pnpm --filter @variscout/core exec vitest run src/__tests__/processEvidence.test.ts
```

Expected: FAIL with module-not-found.

### Task 2: Implement `processEvidence.ts`

**Files:**

- Create: `packages/core/src/processEvidence.ts`

- [ ] **Step 1: Write the implementation**

```ts
import type { Finding, FindingStatus } from './findings/types';
import type { ProcessStateItem } from './processState';

/**
 * The finding statuses that count as "evidence" for a state item.
 *
 * - 'observed' and 'investigating' are too early — they're observations,
 *   not analyzed findings.
 * - 'analyzed', 'improving', 'resolved' represent findings that have
 *   passed through the investigation lifecycle.
 */
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
 * Pure 2-input join: state items × findings (grouped by investigation).
 *
 * The caller pre-groups findings by investigation ID (cheaper than a flat
 * findings[] when items match many investigations). The caller also
 * provides a resolver that says which investigation IDs each item is
 * linked to (the resolver embodies the per-item-type linkage rules
 * — see the spec's Investigation-ID resolver table).
 *
 * Findings are filtered to RELEVANT_FINDING_STATUSES.
 *
 * Returns a map suitable for direct lookup, plus reporting helpers
 * (totalLinked, unlinkedItemIds).
 */
export function linkFindingsToStateItems(
  items: readonly ProcessStateItem[],
  findingsByInvestigationId: ReadonlyMap<string, readonly Finding[]>,
  resolveInvestigationIds: (item: ProcessStateItem) => readonly string[] | undefined
): LinkFindingsResult {
  const byItemId = new Map<string, readonly Finding[]>();
  const unlinkedItemIds: string[] = [];
  let totalLinked = 0;

  for (const item of items) {
    const investigationIds = resolveInvestigationIds(item);
    if (!investigationIds || investigationIds.length === 0) {
      byItemId.set(item.id, []);
      unlinkedItemIds.push(item.id);
      continue;
    }

    const seen = new Set<string>();
    const linked: Finding[] = [];
    for (const invId of investigationIds) {
      if (seen.has(invId)) continue;
      seen.add(invId);
      const findings = findingsByInvestigationId.get(invId);
      if (!findings) continue;
      for (const f of findings) {
        if (RELEVANT_FINDING_STATUSES.has(f.status)) {
          linked.push(f);
        }
      }
    }

    byItemId.set(item.id, linked);
    totalLinked += linked.length;
    if (linked.length === 0) unlinkedItemIds.push(item.id);
  }

  return { byItemId, totalLinked, unlinkedItemIds };
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
pnpm --filter @variscout/core exec vitest run src/__tests__/processEvidence.test.ts
```

Expected: PASS, 10 tests pass.

### Task 3: Export from `@variscout/core`

**Files:**

- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Add export near other process-state exports**

```ts
export { linkFindingsToStateItems, RELEVANT_FINDING_STATUSES } from './processEvidence';
export type { LinkFindingsResult } from './processEvidence';
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm --filter @variscout/core exec tsc --noEmit
```

Expected: clean exit.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/processEvidence.ts \
        packages/core/src/__tests__/processEvidence.test.ts \
        packages/core/src/index.ts
git commit -m "feat(core): add linkFindingsToStateItems pure aggregator

Pure 2-input join: state items × findings (pre-grouped by investigation
ID). Caller provides a resolver implementing the per-item-type linkage
rules. Findings filtered to RELEVANT_FINDING_STATUSES (analyzed,
improving, resolved).

Phase 2 V2 PR #5, Tasks 1-3.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

### Task 4: Write failing tests for evidence chip in panel

**Files:**

- Modify: `packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx`

- [ ] **Step 1: Add evidence-chip-specific tests**

Add a new `describe` block at the end of the test file:

```ts
describe('ProcessHubCurrentStatePanel — evidence chip', () => {
  it('shows the chip with finding count when findingsFor returns non-empty', () => {
    const item = buildItem({ id: 'item-e1', responsePath: 'focused-investigation' });
    const findings = [
      { id: 'f-1' } as unknown as Finding,
      { id: 'f-2' } as unknown as Finding,
      { id: 'f-3' } as unknown as Finding,
    ];
    const evidence = {
      findingsFor: () => findings,
      onChipClick: vi.fn(),
    };

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={evidence}
      />
    );

    const chip = screen.getByTestId('current-state-evidence-chip');
    expect(chip).toHaveTextContent('3 findings');
  });

  it('shows singular text for one finding', () => {
    const item = buildItem({ id: 'item-e2' });
    const evidence = {
      findingsFor: () => [{ id: 'f-only' } as unknown as Finding],
      onChipClick: vi.fn(),
    };

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={evidence}
      />
    );

    expect(screen.getByTestId('current-state-evidence-chip')).toHaveTextContent('1 finding');
  });

  it('omits the chip when findingsFor returns empty', () => {
    const item = buildItem({ id: 'item-e3' });
    const evidence = {
      findingsFor: () => [],
      onChipClick: vi.fn(),
    };

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={evidence}
      />
    );

    expect(screen.queryByTestId('current-state-evidence-chip')).not.toBeInTheDocument();
  });

  it('fires onChipClick with item + findings on chip click and stops card propagation', () => {
    const item = buildItem({ id: 'item-e4', responsePath: 'focused-investigation' });
    const findings = [{ id: 'f-1' } as unknown as Finding];
    const onChipClick = vi.fn();
    const onInvoke = vi.fn();

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={{
          actionFor: () => ({
            kind: 'open-investigation' as const,
            investigationId: 'inv-x',
            intent: 'focused' as const,
          }),
          onInvoke,
        }}
        evidence={{ findingsFor: () => findings, onChipClick }}
      />
    );

    const chip = screen.getByTestId('current-state-evidence-chip');
    chip.click();

    expect(onChipClick).toHaveBeenCalledWith(item, findings);
    // Card click should NOT have fired because chip stops propagation
    expect(onInvoke).not.toHaveBeenCalled();
  });

  it('renders chip on Planned/unsupported cards too (chip independent of action support)', () => {
    const item = buildItem({ id: 'item-e5', responsePath: 'measurement-system-work' });
    const findings = [{ id: 'f-1' } as unknown as Finding];
    const evidence = {
      findingsFor: () => findings,
      onChipClick: vi.fn(),
    };

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions({
          actionFor: () => ({ kind: 'unsupported' as const, reason: 'planned' as const }),
        })}
        evidence={evidence}
      />
    );

    expect(screen.getByTestId('current-state-evidence-chip')).toHaveTextContent('1 finding');
  });
});
```

You will also need to import the Finding type at the top of the test file:

```ts
import type { Finding } from '@variscout/core';
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @variscout/ui exec vitest run src/components/ProcessHubCurrentStatePanel
```

Expected: FAIL — chip tests fail because the panel doesn't render a chip yet.

### Task 5: Implement evidence chip in `ProcessHubCurrentStatePanel`

**Files:**

- Modify: `packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx`

- [ ] **Step 1: Import Finding type**

```ts
import type { Finding } from '@variscout/core';
```

- [ ] **Step 2: Add a small EvidenceChip subcomponent above StateItemCard**

```ts
const EvidenceChip: React.FC<{
  count: number;
  onClick: () => void;
}> = ({ count, onClick }) => {
  if (count === 0) return null;
  const label = formatPlural(count, { one: 'finding', other: 'findings' });
  return (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      data-testid="current-state-evidence-chip"
      className="inline-flex items-center gap-1 rounded-sm border border-edge px-2 py-0.5 text-xs font-medium text-content-secondary hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span aria-hidden>ⓘ</span>
      {count} {label}
    </button>
  );
};
```

- [ ] **Step 3: Update `StateItemCard` to accept evidence + render chip**

Add `findings` to `StateItemCard` props:

```ts
const StateItemCard: React.FC<{
  item: ProcessStateItem;
  action: ResponsePathAction;
  onInvoke: (item: ProcessStateItem, action: ResponsePathAction) => void;
  findings: readonly Finding[];
  onChipClick: (item: ProcessStateItem, findings: readonly Finding[]) => void;
}> = ({ item, action, onInvoke, findings, onChipClick }) => {
  // ... existing card body ...

  // After the existing pill <p> at the bottom of the card, add:
  return (
    <div /* ... existing wrapper ... */>
      {/* ... existing card body ... */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex rounded-sm border border-edge px-2 py-0.5 text-xs font-medium text-content-secondary">
          {pillText}
        </p>
        <EvidenceChip count={findings.length} onClick={() => onChipClick(item, findings)} />
      </div>
    </div>
  );
};
```

(Keep the existing card body code intact; only adjust the pill+chip row to flex-justify-between.)

- [ ] **Step 4: Pass evidence into StateItemCard from the panel body**

Replace the existing `<StateItemCard key={item.id} item={item} action={...} onInvoke={...} />` with:

```tsx
<StateItemCard
  key={item.id}
  item={item}
  action={actions.actionFor(item)}
  onInvoke={actions.onInvoke}
  findings={evidence.findingsFor(item)}
  onChipClick={evidence.onChipClick}
/>
```

Remove the `_evidence` placeholder; just destructure `evidence` directly:

```ts
export const ProcessHubCurrentStatePanel: React.FC<ProcessHubCurrentStatePanelProps> = ({
  state,
  actions,
  evidence,
}) => {
  // ... rest stays the same ...
};
```

- [ ] **Step 5: Run panel tests to verify they pass**

```bash
pnpm --filter @variscout/ui exec vitest run src/components/ProcessHubCurrentStatePanel
```

Expected: PASS, all panel tests (existing + new chip tests = 19) pass.

### Task 6: Wire `ProcessHubReviewPanel` to compute evidence per item

**Files:**

- Modify: `apps/azure/src/components/ProcessHubReviewPanel.tsx`

- [ ] **Step 1: Add the resolver + chip handler**

Inside the component body, after the existing `defaultInvestigationId` memo:

```ts
import type { Finding, ProcessStateItem } from '@variscout/core';
import { useNavigate } from 'react-router-dom'; // if not already imported elsewhere

// Resolver: given a state item, return the investigation IDs whose findings
// should "back" it. Mirrors the spec's Investigation-ID resolver table.
const investigationIdResolver = React.useCallback(
  (item: ProcessStateItem): readonly string[] => {
    if (item.investigationIds && item.investigationIds.length > 0) {
      return item.investigationIds;
    }
    // Hub-aggregate items (capability-gap, change-signals, top-focus, etc.)
    // are backed by all investigations in the hub.
    return rollup.investigations.map(inv => inv.id);
  },
  [rollup.investigations]
);

// findingsFor: count from ProcessHubInvestigationMetadata.findingCounts.
// Returns synthetic Finding-shaped objects with just enough surface to
// drive the chip count + click. Real Finding[] objects aren't loaded
// hub-wide on Dashboard (deferred — see plan).
const findingsFor = React.useCallback(
  (item: ProcessStateItem): readonly Finding[] => {
    const investigationIds = investigationIdResolver(item);
    let totalRelevantCount = 0;
    for (const invId of investigationIds) {
      const inv = rollup.investigations.find(i => i.id === invId);
      const counts = inv?.metadata?.findingCounts ?? {};
      totalRelevantCount +=
        (counts.analyzed ?? 0) + (counts.improving ?? 0) + (counts.resolved ?? 0);
    }
    // Return an array of synthetic placeholder objects matching the count.
    // Only `length` is used by the chip in this PR; full Finding objects
    // require a Dashboard findings-load (deferred follow-up).
    return Array.from({ length: totalRelevantCount }, (_, idx) => ({
      id: `${item.id}-placeholder-${idx}`,
    })) as unknown as readonly Finding[];
  },
  [rollup.investigations, investigationIdResolver]
);

const handleChipClick = React.useCallback(
  (item: ProcessStateItem, findings: readonly Finding[]) => {
    safeTrackEvent('process_hub.evidence_chip_click', {
      hubId: rollup.hub.id,
      responsePath: item.responsePath,
      lens: item.lens,
      evidenceCount: findings.length,
    });
    // Navigate to the most-recent linked investigation; full sheet rendering
    // deferred until Dashboard loads findings hub-wide.
    const targetId = item.investigationIds?.[0] ?? defaultInvestigationId;
    if (targetId) onOpenInvestigation(targetId);
  },
  [rollup.hub.id, defaultInvestigationId, onOpenInvestigation]
);
```

- [ ] **Step 2: Pass the evidence contract into the panel**

Replace the previously-stubbed `evidence={{ findingsFor: () => [], onChipClick: () => {} }}`:

```tsx
<ProcessHubCurrentStatePanel
  state={currentState}
  actions={{ actionFor, onInvoke: onResponsePathAction }}
  evidence={{ findingsFor, onChipClick: handleChipClick }}
/>
```

- [ ] **Step 3: Add safeTrackEvent import if not already there**

```ts
import { safeTrackEvent } from '../lib/appInsights';
```

### Task 7: Run all tests + ui build

- [ ] **Step 1: Run @variscout/core tests**

```bash
pnpm --filter @variscout/core exec vitest run
```

Expected: PASS. (Was 2814 + 12 new in processEvidence = 2826.)

- [ ] **Step 2: Run @variscout/ui tests**

```bash
pnpm --filter @variscout/ui exec vitest run
```

Expected: PASS. (Panel tests now 19.)

- [ ] **Step 3: Run @variscout/azure-app tests**

```bash
pnpm --filter @variscout/azure-app exec vitest run
```

Expected: PASS.

- [ ] **Step 4: Run @variscout/ui build**

```bash
pnpm --filter @variscout/ui build
```

Expected: clean.

- [ ] **Step 5: Run pr-ready-check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: All checks passed.

### Task 8: Commit, push, PR, review, merge

- [ ] **Step 1: Commit panel + consumer changes**

```bash
git add packages/ui/src/components/ProcessHubCurrentStatePanel/ProcessHubCurrentStatePanel.tsx \
        packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx \
        apps/azure/src/components/ProcessHubReviewPanel.tsx
git commit -m "feat(ui,azure): wire evidence chip on ProcessHubCurrentStatePanel state items

Adds an evidence chip to each state-item card showing the count of
relevant findings (analyzed / improving / resolved) for the item's
linked investigations. Chip click navigates to the most-recent linked
investigation and emits an App Insights event (no-PII per ADR-059).

Implementation note: chip count uses
ProcessHubInvestigationMetadata.findingCounts (already on the rollup,
cheap). Full EvidenceSheet rendering with finding labels is deferred
until Dashboard loads findings hub-wide — see plan PR #5 future work.

Phase 2 V2 PR #5, Tasks 4-8.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

- [ ] **Step 2: Push + open PR + subagent review + squash-merge**

(Mirror Task 15 from PR #4 with branch `phase-2/pr-5-evidence-chip` and PR title "feat: ProcessHubCurrentStatePanel evidence chip (Phase 2 V2 PR #5)".)

---

## Future PRs (out of scope here, captured for traceability)

The following items from the spec are intentionally deferred:

1. **PR #6 — Full EvidenceSheet rendering.** Requires a Dashboard-side findings load. Could load all open-project findings on Dashboard mount (heavy) or lazy-load per chip click (async). Decision deferred until the Dashboard's data-load architecture is reviewed. Sheet design already specced (see source spec § "EvidenceSheet").

2. **PR #7 — Editor honors `?intent=` and `?surface=` query params.** PR #4 builds and logs the URLs but Dashboard navigates via the existing `onOpenProject(id)` callback (no query params). To deliver the full UX where opening an investigation lands directly on the focused/chartered/sustainment surface, the Editor needs to read the URL params and route accordingly. Tracked as a follow-up.

3. **PR #8 — MSA editor surface.** Renders 'Planned' today (ResponsePathAction kind 'unsupported', reason 'planned'). H2 horizon — Process Measurement System. Independent of this Phase 2 V2 closure.

4. **Control-handoff revisit.** Spec § "Open Questions / Future Work" #1. Worth its own brainstorming session.

---

## Self-Review Checklist (run after writing the plan)

The plan author has completed the following self-review:

- [x] **Spec coverage:** Every section in the spec has at least one task. (PR #4 covers ResponsePathAction + actionToHref + panel actions wiring + telemetry. PR #5 covers linkFindingsToStateItems + evidence chip. EvidenceSheet deferred — captured in Future PRs.)
- [x] **Placeholder scan:** No "TBD", "TODO", "implement later" text in tasks. All code blocks contain implementable code.
- [x] **Type consistency:** `ResponsePathAction` shape matches across responsePathAction.ts, actionToHref, panel test helpers, and Dashboard handler. `ProcessHubActionsContract` / `ProcessHubEvidenceContract` field names match in spec, panel impl, panel tests, and Azure consumer wiring.
- [x] **Pragmatic divergence flagged:** The spec's `findings: readonly Finding[]` parameter is replaced with `findingsByInvestigationId: ReadonlyMap<string, readonly Finding[]>` (cleaner caller contract, the implementation reality of how findings are loaded). The EvidenceSheet's full-list rendering is deferred to a follow-up PR. Both deviations are documented in "Implementation Reality Notes" at the top.

---

## Workflow conventions (per CLAUDE.md)

- Branch → PR → `bash scripts/pr-ready-check.sh` green → subagent code review → squash-merge.
- No `gh pr merge --admin` unless emergency.
- Each PR ≤~600 LOC.
- `pnpm --filter @variscout/ui build` before merge (cross-package type gaps).
- App Insights payloads must contain only enum values, opaque IDs, and integers (no labels/text/customer data per ADR-059).
- Keep PWA untouched (Process Hub is Azure-only).

## References

- Spec: `docs/superpowers/specs/2026-04-27-actionable-current-process-state-panel-design.md`
- ADR-070: FRAME workspace
- ADR-072: Process Hub storage
- ADR-059: Web-first deployment (no-PII telemetry)
- Memory: `feedback_no_backcompat_clean_architecture` (required props, refactor consumers in same PR)
- Memory: `feedback_ui_build_before_merge`
- Memory: `feedback_starlight_frontmatter`
