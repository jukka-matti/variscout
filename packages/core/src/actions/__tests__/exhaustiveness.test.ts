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
    // Suspected cause
    case 'SUSPECTED_CAUSE_ADD':
      return;
    case 'SUSPECTED_CAUSE_UPDATE':
      return;
    case 'SUSPECTED_CAUSE_ARCHIVE':
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
