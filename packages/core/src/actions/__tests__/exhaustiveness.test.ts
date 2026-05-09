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
});
