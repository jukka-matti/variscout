import { describe, it, expect } from 'vitest';
import type { HubAction } from '../HubAction';

function assertNever(x: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(x)}`);
}

// Type-only check: this function must compile.
// If a new action kind is added to HubAction without a case branch here, TS errors.
function _exhaustive(action: HubAction): void {
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
    // Investigation
    case 'INVESTIGATION_CREATE':
      return;
    case 'INVESTIGATION_UPDATE_METADATA':
      return;
    case 'INVESTIGATION_ARCHIVE':
      return;
    // Finding
    case 'FINDING_ADD':
      return;
    case 'FINDING_UPDATE':
      return;
    case 'FINDING_ARCHIVE':
      return;
    // Question
    case 'QUESTION_ADD':
      return;
    case 'QUESTION_UPDATE':
      return;
    case 'QUESTION_ARCHIVE':
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
    // Hub meta
    case 'HUB_UPDATE_GOAL':
      return;
    case 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS':
      return;
    case 'HUB_PERSIST_SNAPSHOT':
      return;
    // Canvas — all kinds from packages/core/src/canvas/types.ts
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
    // Action Item
    case 'ACTION_ITEM_ADD':
      return;
    // Sustainment
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
    case 'CONTROL_HANDOFF_SIGNOFF':
      return;
    default:
      return assertNever(action);
  }
}

describe('HubAction exhaustiveness', () => {
  it('compiles with assertNever fallback', () => {
    // The fact that _exhaustive compiles is the test. If a new action kind is added without
    // a case branch, the assertNever() call's `action: never` type errors at compile time.
    expect(typeof _exhaustive).toBe('function');
  });
});

describe('ACTION_ITEM_ADD action', () => {
  it('compiles under the HubAction discriminated union', () => {
    const action: HubAction = {
      kind: 'ACTION_ITEM_ADD',
      hubId: 'hub-1',
      actionItem: {
        id: 'action-1',
        text: 'Refill buffer tank',
        stepId: 'step-1',
        parentImprovementProjectId: null,
        parentImprovementIdeaId: null,
        assignedTo: null,
        dueAt: null,
        status: 'done',
        doneAt: '2026-05-10T10:00:00.000Z',
        doneBy: null,
        createdBy: { displayName: 'Local browser' },
        createdAt: 1_746_352_800_000,
        deletedAt: null,
      },
    };

    expect(action.kind).toBe('ACTION_ITEM_ADD');
    expect(action.hubId).toBe('hub-1');
    expect(action.actionItem.stepId).toBe('step-1');
  });
});

describe('IMPROVEMENT_PROJECT actions', () => {
  it('compile under the HubAction discriminated union', () => {
    const create: HubAction = {
      kind: 'IMPROVEMENT_PROJECT_CREATE',
      hubId: 'hub-1',
      project: {
        id: 'ip-1',
        hubId: 'hub-1',
        createdAt: 0,
        deletedAt: null,
        status: 'draft',
        metadata: { title: 't' },
        goal: { outcomeGoal: { outcomeSpecId: 'o-1', target: 1 } },
        sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
        updatedAt: 0,
      },
    };
    const update: HubAction = {
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'ip-1',
      patch: { metadata: { title: 't2' } },
    };
    const archive: HubAction = { kind: 'IMPROVEMENT_PROJECT_ARCHIVE', projectId: 'ip-1' };
    expect(create.kind).toBe('IMPROVEMENT_PROJECT_CREATE');
    expect(update.kind).toBe('IMPROVEMENT_PROJECT_UPDATE');
    expect(archive.kind).toBe('IMPROVEMENT_PROJECT_ARCHIVE');
  });

  it('partial-sections patch is a valid UPDATE action (documented contract)', () => {
    const partialSections: HubAction = {
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'ip-1',
      patch: { sections: { background: { snapshotText: 'x' } } },
    };
    expect(partialSections.kind).toBe('IMPROVEMENT_PROJECT_UPDATE');
  });
});

describe('SUSTAINMENT actions', () => {
  it('compile under the HubAction discriminated union', () => {
    const create: HubAction = {
      kind: 'SUSTAINMENT_RECORD_CREATE',
      hubId: 'hub-1',
      record: {
        id: 'sus-1',
        title: 'Hold improved fill weight',
        investigationId: 'inv-1',
        hubId: 'hub-1',
        cadence: 'weekly',
        status: 'pending',
        consecutiveOnTargetTicks: 0,
        hasOverride: false,
        lastEvaluatedSnapshotId: undefined,
        createdAt: 1_746_352_800_000,
        updatedAt: 1_746_352_800_000,
        deletedAt: null,
      },
    };
    const update: HubAction = {
      kind: 'SUSTAINMENT_RECORD_UPDATE',
      recordId: 'sus-1',
      patch: { targetSummary: 'Cpk >= 1.33' },
    };
    const archive: HubAction = { kind: 'SUSTAINMENT_RECORD_ARCHIVE', recordId: 'sus-1' };
    const confirm: HubAction = { kind: 'SUSTAINMENT_CONFIRM', recordId: 'sus-1' };
    const drifted: HubAction = { kind: 'SUSTAINMENT_MARK_DRIFTED', recordId: 'sus-1' };
    const tick: HubAction = {
      kind: 'SUSTAINMENT_TICK_EVALUATED',
      record: create.record,
      review: {
        id: 'review-1',
        recordId: 'sus-1',
        investigationId: 'inv-1',
        hubId: 'hub-1',
        reviewedAt: 1_746_352_800_000,
        reviewer: { displayName: 'System' },
        verdict: 'holding',
        snapshotId: 'snapshot-1',
        createdAt: 1_746_352_800_000,
        deletedAt: null,
      },
    };

    expect(create.kind).toBe('SUSTAINMENT_RECORD_CREATE');
    expect(update.kind).toBe('SUSTAINMENT_RECORD_UPDATE');
    expect(archive.kind).toBe('SUSTAINMENT_RECORD_ARCHIVE');
    expect(confirm.kind).toBe('SUSTAINMENT_CONFIRM');
    expect(drifted.kind).toBe('SUSTAINMENT_MARK_DRIFTED');
    expect(tick.kind).toBe('SUSTAINMENT_TICK_EVALUATED');
  });
});
