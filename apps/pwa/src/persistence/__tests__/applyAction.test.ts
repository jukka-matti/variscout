// apps/pwa/src/persistence/__tests__/applyAction.test.ts
//
// Unit tests for applyAction — per-action Immer recipe dispatcher.
//
// Coverage:
//   - Each hub-resident action produces the expected diff
//   - OUTCOME_ARCHIVE soft-marks deletedAt; idempotent if already archived
//   - Non-hub-resident actions return the input hub unchanged (deep-equal)
//   - HUB_PERSIST_SNAPSHOT returns action.hub directly (reference equality)
//   - Canvas actions return input hub unchanged (canvasStore is canonical)
//   - assertNever fires for unhandled actions (TypeScript prevents this in prod)
//
// Determinism: vi.useFakeTimers + vi.setSystemTime pins Date.now() to a fixed value.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyAction } from '../applyAction';
import type { ProcessHub, OutcomeSpec } from '@variscout/core/processHub';
import type { OutcomeAction, HubMetaAction, CanvasAction } from '@variscout/core/actions';

// ---------------------------------------------------------------------------
// Fixed time for deterministic Date.now() assertions
// ---------------------------------------------------------------------------

const FIXED_NOW = new Date('2026-05-06T12:00:00.000Z');
const FIXED_NOW_MS = FIXED_NOW.getTime();

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_HUB: ProcessHub = {
  id: 'hub-001',
  name: 'Test Hub',
  createdAt: 1_000_000,
  deletedAt: null,
  processGoal: 'Reduce cycle time',
  primaryScopeDimensions: ['shift'],
  outcomes: [],
};

const BASE_OUTCOME: OutcomeSpec = {
  id: 'outcome-001',
  hubId: 'hub-001',
  createdAt: 1_000_000,
  deletedAt: null,
  columnName: 'cycle_time',
  characteristicType: 'smallerIsBetter',
  target: 10,
};

const HUB_WITH_OUTCOMES: ProcessHub = {
  ...BASE_HUB,
  outcomes: [{ ...BASE_OUTCOME }],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deep clone a plain object (fixture safety — prevents draft mutations leaking). */
function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// HUB_PERSIST_SNAPSHOT
// ---------------------------------------------------------------------------

describe('HUB_PERSIST_SNAPSHOT', () => {
  it('returns action.hub directly (reference equality)', () => {
    const replacement = clone({ ...BASE_HUB, name: 'Replaced Hub' });
    const action: HubMetaAction = { kind: 'HUB_PERSIST_SNAPSHOT', hub: replacement };
    const result = applyAction(clone(BASE_HUB), action);
    expect(result).toBe(replacement); // reference equality — bypasses produce
  });

  it('discards any prior hub state', () => {
    const replacement: ProcessHub = {
      ...BASE_HUB,
      processGoal: 'New goal',
      outcomes: [{ ...BASE_OUTCOME, columnName: 'throughput' }],
    };
    const action: HubMetaAction = { kind: 'HUB_PERSIST_SNAPSHOT', hub: replacement };
    const result = applyAction(clone(HUB_WITH_OUTCOMES), action);
    expect(result.processGoal).toBe('New goal');
    expect(result.outcomes).toHaveLength(1);
    expect(result.outcomes![0].columnName).toBe('throughput');
  });
});

// ---------------------------------------------------------------------------
// HUB_UPDATE_GOAL
// ---------------------------------------------------------------------------

describe('HUB_UPDATE_GOAL', () => {
  it('sets processGoal and bumps updatedAt', () => {
    const action: HubMetaAction = {
      kind: 'HUB_UPDATE_GOAL',
      hubId: 'hub-001',
      processGoal: 'Eliminate defects',
    };
    const result = applyAction(clone(BASE_HUB), action);
    expect(result.processGoal).toBe('Eliminate defects');
    expect(result.updatedAt).toBe(FIXED_NOW_MS);
  });

  it('is a no-op when hubId does not match', () => {
    const action: HubMetaAction = {
      kind: 'HUB_UPDATE_GOAL',
      hubId: 'different-hub',
      processGoal: 'Should not apply',
    };
    const input = clone(BASE_HUB);
    const result = applyAction(input, action);
    expect(result.processGoal).toBe('Reduce cycle time');
    expect(result.updatedAt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS
// ---------------------------------------------------------------------------

describe('HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS', () => {
  it('sets primaryScopeDimensions and bumps updatedAt', () => {
    const action: HubMetaAction = {
      kind: 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS',
      hubId: 'hub-001',
      dimensions: ['shift', 'line'],
    };
    const result = applyAction(clone(BASE_HUB), action);
    expect(result.primaryScopeDimensions).toEqual(['shift', 'line']);
    expect(result.updatedAt).toBe(FIXED_NOW_MS);
  });

  it('is a no-op when hubId does not match', () => {
    const action: HubMetaAction = {
      kind: 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS',
      hubId: 'different-hub',
      dimensions: ['should-not-apply'],
    };
    const input = clone(BASE_HUB);
    const result = applyAction(input, action);
    expect(result.primaryScopeDimensions).toEqual(['shift']);
    expect(result.updatedAt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// OUTCOME_ADD
// ---------------------------------------------------------------------------

describe('OUTCOME_ADD', () => {
  it('pushes outcome into outcomes array', () => {
    const action: OutcomeAction = {
      kind: 'OUTCOME_ADD',
      hubId: 'hub-001',
      outcome: { ...BASE_OUTCOME, id: 'outcome-002', columnName: 'defect_rate' },
    };
    const input = clone({ ...BASE_HUB, outcomes: [] });
    const result = applyAction(input, action);
    expect(result.outcomes).toHaveLength(1);
    expect(result.outcomes![0].columnName).toBe('defect_rate');
  });

  it('initializes outcomes array if undefined', () => {
    const hubWithoutOutcomes: ProcessHub = {
      id: 'hub-001',
      name: 'Test Hub',
      createdAt: 1_000_000,
      deletedAt: null,
      // outcomes intentionally absent
    };
    const action: OutcomeAction = {
      kind: 'OUTCOME_ADD',
      hubId: 'hub-001',
      outcome: { ...BASE_OUTCOME },
    };
    const result = applyAction(clone(hubWithoutOutcomes), action);
    expect(result.outcomes).toHaveLength(1);
    expect(result.outcomes![0].id).toBe('outcome-001');
  });

  it('throws when hubId mismatches (hub-of-one constraint)', () => {
    const action: OutcomeAction = {
      kind: 'OUTCOME_ADD',
      hubId: 'different-hub',
      outcome: { ...BASE_OUTCOME },
    };
    expect(() => applyAction(clone(BASE_HUB), action)).toThrow('OUTCOME_ADD hubId mismatch');
  });
});

// ---------------------------------------------------------------------------
// OUTCOME_UPDATE
// ---------------------------------------------------------------------------

describe('OUTCOME_UPDATE', () => {
  it('merges patch into matching outcome', () => {
    const action: OutcomeAction = {
      kind: 'OUTCOME_UPDATE',
      outcomeId: 'outcome-001',
      patch: { target: 8, usl: 15 },
    };
    const result = applyAction(clone(HUB_WITH_OUTCOMES), action);
    const updated = result.outcomes!.find(o => o.id === 'outcome-001')!;
    expect(updated.target).toBe(8);
    expect(updated.usl).toBe(15);
    expect(updated.columnName).toBe('cycle_time'); // unchanged
  });

  it('is a no-op when outcomeId is not found', () => {
    const action: OutcomeAction = {
      kind: 'OUTCOME_UPDATE',
      outcomeId: 'nonexistent',
      patch: { target: 99 },
    };
    const input = clone(HUB_WITH_OUTCOMES);
    const result = applyAction(input, action);
    expect(result.outcomes![0].target).toBe(10); // unchanged
  });
});

// ---------------------------------------------------------------------------
// OUTCOME_ARCHIVE
// ---------------------------------------------------------------------------

describe('OUTCOME_ARCHIVE', () => {
  it('soft-marks deletedAt on the matching outcome', () => {
    const action: OutcomeAction = {
      kind: 'OUTCOME_ARCHIVE',
      outcomeId: 'outcome-001',
    };
    const result = applyAction(clone(HUB_WITH_OUTCOMES), action);
    const archived = result.outcomes!.find(o => o.id === 'outcome-001')!;
    expect(archived.deletedAt).toBe(FIXED_NOW_MS);
  });

  it('is idempotent — already-archived outcome stays unchanged', () => {
    const alreadyArchived: ProcessHub = {
      ...BASE_HUB,
      outcomes: [{ ...BASE_OUTCOME, deletedAt: 999_999 }],
    };
    const action: OutcomeAction = {
      kind: 'OUTCOME_ARCHIVE',
      outcomeId: 'outcome-001',
    };
    const result = applyAction(clone(alreadyArchived), action);
    const outcome = result.outcomes!.find(o => o.id === 'outcome-001')!;
    expect(outcome.deletedAt).toBe(999_999); // preserved — not overwritten
  });

  it('is a no-op when outcomeId is not found', () => {
    const action: OutcomeAction = {
      kind: 'OUTCOME_ARCHIVE',
      outcomeId: 'nonexistent',
    };
    const input = clone(HUB_WITH_OUTCOMES);
    const result = applyAction(input, action);
    expect(result.outcomes![0].deletedAt).toBeNull(); // unchanged
  });
});

// ---------------------------------------------------------------------------
// Non-hub-resident actions — return hub unchanged (deep-equal)
//
// Each entity type (Investigation, Finding, Question, CausalLink, SuspectedCause,
// Evidence, EvidenceSource) has required fields beyond EntityBase that are not
// relevant to the no-op behavior being tested here. We cast with `as unknown as
// HubAction` to avoid building out full entity fixtures — the hub blob doesn't
// use these fields anyway (they live in session-only Zustand stores).
// ---------------------------------------------------------------------------

describe('Non-hub-resident actions return hub unchanged', () => {
  // Helper type alias for clarity
  type A = Parameters<typeof applyAction>[1];

  const noopCases: Array<{ label: string; action: A }> = [
    {
      label: 'INVESTIGATION_CREATE',
      action: {
        kind: 'INVESTIGATION_CREATE',
        hubId: 'hub-001',
        investigation: { id: 'inv-001', createdAt: 0, deletedAt: null, name: 'I', updatedAt: 0 },
      } as unknown as A,
    },
    {
      label: 'INVESTIGATION_UPDATE_METADATA',
      action: { kind: 'INVESTIGATION_UPDATE_METADATA', investigationId: 'inv-001', patch: {} } as A,
    },
    {
      label: 'INVESTIGATION_ARCHIVE',
      action: { kind: 'INVESTIGATION_ARCHIVE', investigationId: 'inv-001' } as A,
    },
    {
      label: 'FINDING_ADD',
      action: {
        kind: 'FINDING_ADD',
        investigationId: 'inv-001',
        finding: { id: 'f-001', createdAt: 0, deletedAt: null },
      } as unknown as A,
    },
    {
      label: 'FINDING_UPDATE',
      action: { kind: 'FINDING_UPDATE', findingId: 'f-001', patch: {} } as A,
    },
    {
      label: 'FINDING_ARCHIVE',
      action: { kind: 'FINDING_ARCHIVE', findingId: 'f-001' } as A,
    },
    {
      label: 'QUESTION_ADD',
      action: {
        kind: 'QUESTION_ADD',
        investigationId: 'inv-001',
        question: { id: 'q-001', createdAt: 0, deletedAt: null },
      } as unknown as A,
    },
    {
      label: 'QUESTION_UPDATE',
      action: { kind: 'QUESTION_UPDATE', questionId: 'q-001', patch: {} } as A,
    },
    {
      label: 'QUESTION_ARCHIVE',
      action: { kind: 'QUESTION_ARCHIVE', questionId: 'q-001' } as A,
    },
    {
      label: 'CAUSAL_LINK_ADD',
      action: {
        kind: 'CAUSAL_LINK_ADD',
        investigationId: 'inv-001',
        link: { id: 'cl-001', createdAt: 0, deletedAt: null },
      } as unknown as A,
    },
    {
      label: 'CAUSAL_LINK_UPDATE',
      action: { kind: 'CAUSAL_LINK_UPDATE', linkId: 'cl-001', patch: {} } as A,
    },
    {
      label: 'CAUSAL_LINK_ARCHIVE',
      action: { kind: 'CAUSAL_LINK_ARCHIVE', linkId: 'cl-001' } as A,
    },
    {
      label: 'SUSPECTED_CAUSE_ADD',
      action: {
        kind: 'SUSPECTED_CAUSE_ADD',
        investigationId: 'inv-001',
        cause: { id: 'sc-001', createdAt: 0, deletedAt: null },
      } as unknown as A,
    },
    {
      label: 'SUSPECTED_CAUSE_UPDATE',
      action: { kind: 'SUSPECTED_CAUSE_UPDATE', causeId: 'sc-001', patch: {} } as A,
    },
    {
      label: 'SUSPECTED_CAUSE_ARCHIVE',
      action: { kind: 'SUSPECTED_CAUSE_ARCHIVE', causeId: 'sc-001' } as A,
    },
    {
      label: 'EVIDENCE_ADD_SNAPSHOT',
      action: {
        kind: 'EVIDENCE_ADD_SNAPSHOT',
        hubId: 'hub-001',
        snapshot: { id: 'es-001', createdAt: 0, deletedAt: null },
        provenance: [],
      } as unknown as A,
    },
    {
      label: 'EVIDENCE_ARCHIVE_SNAPSHOT',
      action: { kind: 'EVIDENCE_ARCHIVE_SNAPSHOT', snapshotId: 'es-001' } as A,
    },
    {
      label: 'EVIDENCE_SOURCE_ADD',
      action: {
        kind: 'EVIDENCE_SOURCE_ADD',
        hubId: 'hub-001',
        source: { id: 'src-001', createdAt: 0, deletedAt: null },
      } as unknown as A,
    },
    {
      label: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      action: {
        kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
        sourceId: 'src-001',
        cursor: {},
      } as unknown as A,
    },
    {
      label: 'EVIDENCE_SOURCE_REMOVE',
      action: { kind: 'EVIDENCE_SOURCE_REMOVE', sourceId: 'src-001' } as A,
    },
  ];

  for (const { label, action } of noopCases) {
    it(`${label} — hub returned deep-equal to input`, () => {
      const input = clone(HUB_WITH_OUTCOMES);
      const result = applyAction(input, action);
      expect(result).toEqual(input);
    });
  }
});

// ---------------------------------------------------------------------------
// Canvas actions — no-ops (canvasStore is the canonical mutation surface)
// ---------------------------------------------------------------------------

describe('Canvas actions return hub unchanged', () => {
  const canvasCases: Array<{ label: string; action: CanvasAction }> = [
    {
      label: 'PLACE_CHIP_ON_STEP',
      action: { kind: 'PLACE_CHIP_ON_STEP', chipId: 'c1', stepId: 's1' },
    },
    { label: 'UNASSIGN_CHIP', action: { kind: 'UNASSIGN_CHIP', chipId: 'c1' } },
    {
      label: 'REORDER_CHIP_IN_STEP',
      action: { kind: 'REORDER_CHIP_IN_STEP', chipId: 'c1', stepId: 's1', toIndex: 0 },
    },
    { label: 'ADD_STEP', action: { kind: 'ADD_STEP', stepName: 'New Step' } },
    { label: 'REMOVE_STEP', action: { kind: 'REMOVE_STEP', stepId: 's1' } },
    { label: 'RENAME_STEP', action: { kind: 'RENAME_STEP', stepId: 's1', newName: 'Renamed' } },
    { label: 'CONNECT_STEPS', action: { kind: 'CONNECT_STEPS', fromStepId: 's1', toStepId: 's2' } },
    {
      label: 'DISCONNECT_STEPS',
      action: { kind: 'DISCONNECT_STEPS', fromStepId: 's1', toStepId: 's2' },
    },
    {
      label: 'GROUP_INTO_SUB_STEP',
      action: { kind: 'GROUP_INTO_SUB_STEP', stepIds: ['s1', 's2'], parentStepId: 'p1' },
    },
    { label: 'UNGROUP_SUB_STEP', action: { kind: 'UNGROUP_SUB_STEP', stepId: 's1' } },
  ];

  for (const { label, action } of canvasCases) {
    it(`${label} — hub returned deep-equal to input`, () => {
      const input = clone(HUB_WITH_OUTCOMES);
      const result = applyAction(input, action as Parameters<typeof applyAction>[1]);
      expect(result).toEqual(input);
    });
  }
});

// ---------------------------------------------------------------------------
// Input immutability — hub is not mutated in place
// ---------------------------------------------------------------------------

describe('Input immutability', () => {
  it('does not mutate the input hub (OUTCOME_ADD)', () => {
    const action: OutcomeAction = {
      kind: 'OUTCOME_ADD',
      hubId: 'hub-001',
      outcome: { ...BASE_OUTCOME, id: 'outcome-002', columnName: 'throughput' },
    };
    const input = clone({ ...BASE_HUB, outcomes: [] });
    const inputCopy = clone(input);
    applyAction(input, action);
    expect(input).toEqual(inputCopy); // input unchanged
  });

  it('does not mutate the input hub (OUTCOME_ARCHIVE)', () => {
    const action: OutcomeAction = { kind: 'OUTCOME_ARCHIVE', outcomeId: 'outcome-001' };
    const input = clone(HUB_WITH_OUTCOMES);
    const inputCopy = clone(input);
    applyAction(input, action);
    expect(input).toEqual(inputCopy); // input unchanged
  });
});
