/**
 * Task 3 — ActionItem tasks on hypotheses (RED tests).
 *
 * Encodes the acceptance oracle:
 *   - `Hypothesis.actions?: ActionItem[]` field exists on the type.
 *   - Three new HubAction kinds: HYPOTHESIS_ACTION_ADD / HYPOTHESIS_ACTION_UPDATE /
 *     HYPOTHESIS_ACTION_COMPLETE compile under the discriminated union.
 *   - The `_exhaustive` switch in exhaustiveness.test.ts (see note below) must
 *     include all three new cases — that test will fail to compile until the
 *     implementer adds the new kinds to HubAction.
 *   - Distinct from Measurement Plan data-collection tasks (no overlap).
 *
 * Strategy: these tests fail TODAY because the new action kinds do not exist on
 * HypothesisAction / HubAction, and `Hypothesis.actions` field is absent. Each
 * test either exercises a type narrowing that causes a TS compile error, or
 * asserts against a runtime shape that doesn't exist yet.
 *
 * NOTE on exhaustiveness: the canonical exhaustiveness compile-time check lives in
 * exhaustiveness.test.ts.  That test will produce a TypeScript compile error
 * ("Property 'HYPOTHESIS_ACTION_ADD' does not exist on type 'never'") as soon as
 * the action kinds are added to HubAction but before the switch cases are added —
 * which is the correct RED signal.  We add a mirror runtime check here for the CI
 * pipeline that catches the same gap even when the TS build is cached.
 */

import { describe, it, expect } from 'vitest';
import type { HubAction } from '../HubAction';
import type { ActionItem, Hypothesis } from '../../findings/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertNeverInTest(x: never): never {
  throw new Error(
    `Unhandled HubAction kind in test: ${JSON.stringify((x as { kind: string }).kind)}`
  );
}

/**
 * Mirrors _exhaustive in exhaustiveness.test.ts but adds the three new cases.
 * This function must compile and the switch must be exhaustive — if the new
 * action kinds are NOT present in HubAction, TypeScript will complain that
 * `action.kind` cannot be `'HYPOTHESIS_ACTION_ADD'` etc.
 */
function _exhaustiveWithHypothesisActions(action: HubAction): void {
  switch (action.kind) {
    // Outcome
    case 'OUTCOME_ADD':
      return;
    case 'OUTCOME_UPDATE':
      return;
    case 'OUTCOME_ARCHIVE':
      return;
    // Evidence
    case 'EVIDENCE_ADD_SNAPSHOT':
      return;
    case 'EVIDENCE_ARCHIVE_SNAPSHOT':
      return;
    // Evidence source
    case 'EVIDENCE_SOURCE_ADD':
      return;
    case 'EVIDENCE_SOURCE_UPDATE_CURSOR':
      return;
    case 'EVIDENCE_SOURCE_REMOVE':
      return;
    // Finding
    case 'FINDING_ADD':
      return;
    case 'FINDING_UPDATE':
      return;
    case 'FINDING_ARCHIVE':
      return;
    // Scope
    case 'SCOPE_ADD':
      return;
    case 'SCOPE_UPDATE':
      return;
    case 'SCOPE_ARCHIVE':
      return;
    // Causal link
    case 'CAUSAL_LINK_ADD':
      return;
    case 'CAUSAL_LINK_UPDATE':
      return;
    case 'CAUSAL_LINK_ARCHIVE':
      return;
    // Hypothesis
    case 'HYPOTHESIS_ADD':
      return;
    case 'HYPOTHESIS_UPDATE':
      return;
    case 'HYPOTHESIS_ARCHIVE':
      return;
    case 'HYPOTHESIS_RECORD_DISCONFIRMATION':
      return;
    // *** NEW — Task 3: ActionItem tasks on hypotheses ***
    case 'HYPOTHESIS_ACTION_ADD':
      return;
    case 'HYPOTHESIS_ACTION_UPDATE':
      return;
    case 'HYPOTHESIS_ACTION_COMPLETE':
      return;
    // Hub meta
    case 'HUB_UPDATE_GOAL':
      return;
    case 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS':
      return;
    case 'HUB_PERSIST_SNAPSHOT':
      return;
    // Canvas
    case 'PLACE_CHIP_ON_STEP':
      return;
    case 'UNASSIGN_CHIP':
      return;
    case 'REORDER_CHIP_IN_STEP':
      return;
    case 'ADD_STEP':
      return;
    case 'REMOVE_STEP':
      return;
    case 'RENAME_STEP':
      return;
    case 'CONNECT_STEPS':
      return;
    case 'DISCONNECT_STEPS':
      return;
    case 'GROUP_INTO_SUB_STEP':
      return;
    case 'UNGROUP_SUB_STEP':
      return;
    // Improvement Project
    case 'IMPROVEMENT_PROJECT_CREATE':
      return;
    case 'IMPROVEMENT_PROJECT_UPDATE':
      return;
    case 'IMPROVEMENT_PROJECT_ARCHIVE':
      return;
    // Action Item (canvas steps / findings)
    case 'ACTION_ITEM_ADD':
      return;
    case 'ACTION_ITEM_UPDATE':
      return;
    case 'ACTION_ITEM_REMOVE':
      return;
    // Measurement Plan
    case 'MEASUREMENT_PLAN_ADD':
      return;
    case 'MEASUREMENT_PLAN_UPDATE':
      return;
    case 'MEASUREMENT_PLAN_REMOVE':
      return;
    case 'MEASUREMENT_PLAN_LINK_FINDING':
      return;
    // Control
    case 'SUSTAINMENT_RECORD_CREATE':
      return;
    case 'SUSTAINMENT_RECORD_UPDATE':
      return;
    case 'SUSTAINMENT_RECORD_ARCHIVE':
      return;
    case 'SUSTAINMENT_CONFIRM':
      return;
    case 'SUSTAINMENT_MARK_DRIFTED':
      return;
    case 'SUSTAINMENT_TICK_EVALUATED':
      return;
    // Control Handoff
    case 'CONTROL_HANDOFF_CREATE':
      return;
    case 'CONTROL_HANDOFF_UPDATE':
      return;
    case 'CONTROL_HANDOFF_ARCHIVE':
      return;
    case 'CONTROL_HANDOFF_ACKNOWLEDGE':
      return;
    case 'CONTROL_HANDOFF_MARK_OPERATIONAL':
      return;
    default:
      return assertNeverInTest(action);
  }
}

// ---------------------------------------------------------------------------
// Type-level acceptance: Hypothesis.actions field
// ---------------------------------------------------------------------------

describe('Hypothesis.actions field', () => {
  it('Hypothesis accepts an actions array of ActionItems', () => {
    // This is a compile-time + shape test.
    // If `Hypothesis` does not have `actions?: ActionItem[]`, TypeScript errors here.
    const action: ActionItem = {
      id: 'ai-h1',
      text: '@Jane: validate against night-shift data',
      assignee: { upn: 'jane@contoso.com', displayName: 'Jane Analyst' },
      dueDate: '2026-06-15',
      createdAt: 1_748_649_600_000, // 2026-05-30 deterministic
      deletedAt: null,
    };

    // Type-level assertion: Hypothesis must accept actions field.
    const h: Hypothesis = {
      id: 'h-1',
      name: 'Worn spindle',
      synthesis: 'Night shift data shows Cpk drop of 0.4',
      findingIds: ['f-1'],
      status: 'proposed',
      createdAt: 1_748_649_600_000,
      updatedAt: 1_748_649_600_000,
      deletedAt: null,
      investigationId: 'inv-1',
      actions: [action], // ← NEW field — must exist on Hypothesis
    };

    expect(h.actions).toHaveLength(1);
    expect(h.actions![0].text).toBe('@Jane: validate against night-shift data');
    expect(h.actions![0].assignee?.displayName).toBe('Jane Analyst');
  });

  it('Hypothesis.actions defaults to absent (backward-compatible)', () => {
    const h: Hypothesis = {
      id: 'h-2',
      name: 'Coolant temp drift',
      synthesis: '',
      findingIds: [],
      status: 'proposed',
      createdAt: 1_748_649_600_000,
      updatedAt: 1_748_649_600_000,
      deletedAt: null,
      investigationId: 'inv-1',
    };
    // No actions field → undefined (optional, not required)
    expect(h.actions).toBeUndefined();
  });

  it('ActionItem on Hypothesis has open/done status', () => {
    const openAction: ActionItem = {
      id: 'ai-open',
      text: 'Confirm spindle wear on next shift',
      createdAt: 1_748_649_600_000,
      deletedAt: null,
    };
    // completedAt absent → open
    expect(openAction.completedAt).toBeUndefined();

    const doneAction: ActionItem = {
      ...openAction,
      id: 'ai-done',
      completedAt: 1_748_736_000_000, // 2026-05-31 deterministic
    };
    expect(doneAction.completedAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// HubAction union — new kinds compile and carry the right payload
// ---------------------------------------------------------------------------

describe('HYPOTHESIS_ACTION_ADD — compiles under HubAction', () => {
  it('carries hypothesisId + actionItem payload', () => {
    const action: HubAction = {
      kind: 'HYPOTHESIS_ACTION_ADD',
      hypothesisId: 'h-1',
      actionItem: {
        id: 'ai-1',
        text: '@Jane: validate against night-shift data',
        assignee: { upn: 'jane@contoso.com', displayName: 'Jane Analyst' },
        dueDate: '2026-06-15',
        createdAt: 1_748_649_600_000,
        deletedAt: null,
      },
    };
    expect(action.kind).toBe('HYPOTHESIS_ACTION_ADD');
    if (action.kind === 'HYPOTHESIS_ACTION_ADD') {
      expect(action.hypothesisId).toBe('h-1');
      expect(action.actionItem.text).toBe('@Jane: validate against night-shift data');
      expect(action.actionItem.assignee?.displayName).toBe('Jane Analyst');
    }
  });
});

describe('HYPOTHESIS_ACTION_UPDATE — compiles under HubAction', () => {
  it('carries hypothesisId + actionId + patch', () => {
    const action: HubAction = {
      kind: 'HYPOTHESIS_ACTION_UPDATE',
      hypothesisId: 'h-1',
      actionId: 'ai-1',
      patch: { text: 'Updated task text' },
    };
    expect(action.kind).toBe('HYPOTHESIS_ACTION_UPDATE');
    if (action.kind === 'HYPOTHESIS_ACTION_UPDATE') {
      expect(action.hypothesisId).toBe('h-1');
      expect(action.actionId).toBe('ai-1');
      expect(action.patch.text).toBe('Updated task text');
    }
  });

  it('patch can include assignee (re-assign)', () => {
    const action: HubAction = {
      kind: 'HYPOTHESIS_ACTION_UPDATE',
      hypothesisId: 'h-1',
      actionId: 'ai-1',
      patch: {
        assignee: { upn: 'bob@contoso.com', displayName: 'Bob Sponsor' },
        dueDate: '2026-06-30',
      },
    };
    expect(action.kind).toBe('HYPOTHESIS_ACTION_UPDATE');
    if (action.kind === 'HYPOTHESIS_ACTION_UPDATE') {
      expect(action.patch.assignee?.displayName).toBe('Bob Sponsor');
    }
  });
});

describe('HYPOTHESIS_ACTION_COMPLETE — compiles under HubAction', () => {
  it('carries hypothesisId + actionId + completedAt', () => {
    const action: HubAction = {
      kind: 'HYPOTHESIS_ACTION_COMPLETE',
      hypothesisId: 'h-1',
      actionId: 'ai-1',
      completedAt: 1_748_736_000_000,
    };
    expect(action.kind).toBe('HYPOTHESIS_ACTION_COMPLETE');
    if (action.kind === 'HYPOTHESIS_ACTION_COMPLETE') {
      expect(action.hypothesisId).toBe('h-1');
      expect(action.actionId).toBe('ai-1');
      expect(action.completedAt).toBe(1_748_736_000_000);
    }
  });
});

// ---------------------------------------------------------------------------
// Exhaustiveness guard (mirrors exhaustiveness.test.ts with new cases)
// ---------------------------------------------------------------------------

describe('HubAction exhaustiveness — includes HYPOTHESIS_ACTION_* kinds', () => {
  it('_exhaustiveWithHypothesisActions compiles with assertNever fallback', () => {
    // If a new action kind is added without a case branch, assertNever errors at compile.
    // This also provides a runtime assertion that the function exists.
    expect(typeof _exhaustiveWithHypothesisActions).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Distinct from Measurement Plan (spec §5 locked decision)
// ---------------------------------------------------------------------------

describe('HYPOTHESIS_ACTION_* is distinct from MEASUREMENT_PLAN_* actions', () => {
  it('HYPOTHESIS_ACTION_ADD does NOT carry MeasurementPlan fields', () => {
    // The data-collection task (owner=collector) routes through MEASUREMENT_PLAN_ADD.
    // The general ActionItem task routes through HYPOTHESIS_ACTION_ADD.
    // This test asserts that the HYPOTHESIS_ACTION_ADD payload shape does NOT have
    // `primaryFactor` or `method` (which belong to MeasurementPlan, not ActionItem).

    const action: HubAction = {
      kind: 'HYPOTHESIS_ACTION_ADD',
      hypothesisId: 'h-1',
      actionItem: {
        id: 'ai-2',
        text: 'Run gemba walk on night shift',
        createdAt: 1_748_649_600_000,
        deletedAt: null,
      },
    };

    // primaryFactor / method are NOT on ActionItem — this line compiles only if
    // the action payload is typed as ActionItem (not MeasurementPlan).
    // @ts-expect-error primaryFactor is not on ActionItem
    const _noPrimaryFactor = action.actionItem.primaryFactor;
    // @ts-expect-error method is not on ActionItem
    const _noMethod = action.actionItem.method;

    expect(action.kind).toBe('HYPOTHESIS_ACTION_ADD');
  });
});
