import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getAnalyzeInitialState, useAnalyzeStore, useProjectStore } from '@variscout/stores';
import type { Hypothesis } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { HubAction } from '@variscout/core/actions';
import { mintAutoLinkFindingId } from '@variscout/core/autoLink';
import { useReingestAutoLink } from '../useReingestAutoLink';

const DEBOUNCE = 10;

const sampleHyp: Hypothesis = {
  id: 'hyp-1',
  name: 'Nozzle wear',
  synthesis: '',
  status: 'proposed',
  findingIds: [],
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  investigationId: 'inv-1',
  condition: { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' },
};

function plan(overrides: Partial<MeasurementPlan>): MeasurementPlan {
  return {
    id: 'mp-1',
    createdAt: 0,
    deletedAt: null,
    hypothesisId: 'hyp-1',
    outcome: 'Fill Weight',
    primaryFactor: 'Nozzle temperature',
    neededFactors: ['Shift'],
    method: 'sensor',
    sampleSize: 50,
    owner: 'pm-1',
    status: 'planned',
    scope: [],
    processLocation: '',
    ...overrides,
  };
}

/** A fake HubRepository capturing dispatched actions + serving plans by hypothesis. */
function makeFakeRepo(plansByHyp: Record<string, MeasurementPlan[]>): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repo: any;
  dispatched: HubAction[];
} {
  const dispatched: HubAction[] = [];
  const repo = {
    dispatch: vi.fn(async (action: HubAction) => {
      dispatched.push(action);
    }),
    measurementPlans: {
      get: vi.fn(),
      listByHypothesis: vi.fn(async (id: string) => plansByHyp[id] ?? []),
    },
  };
  return { repo, dispatched };
}

const rowsWith = (cols: string[]): Array<Record<string, number | string>> => {
  const row: Record<string, number | string> = {};
  for (const c of cols) row[c] = 1;
  return [row, { ...row }];
};

beforeEach(() => {
  vi.useFakeTimers();
  useAnalyzeStore.setState(getAnalyzeInitialState());
  useProjectStore.setState({ rawData: [], outcome: null });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

async function flush(ms: number): Promise<void> {
  // Advance timers (fires the debounce callback) then drain the microtask queue so
  // the async cascade (Dexie reads/dispatches) completes before assertions.
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useReingestAutoLink — inert states', () => {
  it('does nothing when repository is null', async () => {
    const { repo } = makeFakeRepo({});
    renderHook(() => useReingestAutoLink(null, { debounceMs: DEBOUNCE }));
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    });
    await flush(DEBOUNCE);
    expect(repo.dispatch).not.toHaveBeenCalled();
  });

  it('does nothing before the debounce elapses', async () => {
    useAnalyzeStore.setState({ hypotheses: [sampleHyp] });
    const { repo, dispatched } = makeFakeRepo({ 'hyp-1': [plan({})] });
    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE }));
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    });
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE - 1);
      await Promise.resolve();
    });
    expect(dispatched).toHaveLength(0);
  });
});

describe('useReingestAutoLink — APPEND-cascade (columns added)', () => {
  beforeEach(() => {
    // Seed prior column universe WITHOUT the to-be-added "Shift".
    useProjectStore.setState({ rawData: rowsWith(['Fill Weight']) });
    useAnalyzeStore.setState({ hypotheses: [sampleHyp] });
  });

  it('adds a bare auto-Finding, links it, and progresses planned → in-progress', async () => {
    const { repo, dispatched } = makeFakeRepo({ 'hyp-1': [plan({})] });
    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE }));

    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    });
    await flush(DEBOUNCE);

    const findings = useAnalyzeStore.getState().findings;
    expect(findings).toHaveLength(1);
    expect(findings[0].id).toBe(mintAutoLinkFindingId('mp-1', 'Shift'));
    expect(findings[0].source).toBeUndefined(); // bare observation
    expect(findings[0].status).toBe('observed');

    const kinds = dispatched.map(a => a.kind);
    expect(kinds).toContain('MEASUREMENT_PLAN_LINK_FINDING');
    expect(kinds).toContain('MEASUREMENT_PLAN_UPDATE');
    const update = dispatched.find(a => a.kind === 'MEASUREMENT_PLAN_UPDATE');
    expect(update).toMatchObject({ planId: 'mp-1', patch: { status: 'in-progress' } });
  });

  it('does NOT re-progress a plan already in-progress (status guard)', async () => {
    const { repo, dispatched } = makeFakeRepo({ 'hyp-1': [plan({ status: 'in-progress' })] });
    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE }));

    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    });
    await flush(DEBOUNCE);

    expect(dispatched.some(a => a.kind === 'MEASUREMENT_PLAN_UPDATE')).toBe(false);
    expect(dispatched.some(a => a.kind === 'MEASUREMENT_PLAN_LINK_FINDING')).toBe(true);
  });

  it('IDEMPOTENT: re-firing on the same added column does NOT double-add the finding', async () => {
    const { repo } = makeFakeRepo({ 'hyp-1': [plan({})] });
    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE }));

    // First re-ingest brings "Shift".
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    });
    await flush(DEBOUNCE);
    expect(useAnalyzeStore.getState().findings).toHaveLength(1);

    // Second re-ingest re-supplies the SAME column set (e.g. row append). The
    // column delta is empty, so the cascade no-ops — but even forcing a re-run with
    // the column present again must not duplicate (stable id + existing-id gate).
    act(() => {
      // New array reference, same columns + one extra row → triggers subscription.
      useProjectStore.setState({
        rawData: [...rowsWith(['Fill Weight', 'Shift']), { 'Fill Weight': 2, Shift: 1 }],
      });
    });
    await flush(DEBOUNCE);

    expect(useAnalyzeStore.getState().findings).toHaveLength(1); // still ONE
  });

  it('IDEMPOTENT: a column removed then re-added does not duplicate the finding', async () => {
    const { repo } = makeFakeRepo({ 'hyp-1': [plan({})] });
    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE }));

    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    });
    await flush(DEBOUNCE);
    expect(useAnalyzeStore.getState().findings).toHaveLength(1);

    // Remove Shift...
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight']) });
    });
    await flush(DEBOUNCE);

    // ...then re-add Shift (counts as "added" again) — stable id keeps it single.
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    });
    await flush(DEBOUNCE);

    expect(useAnalyzeStore.getState().findings).toHaveLength(1);
  });
});

describe('useReingestAutoLink — REPLACE re-evaluation (columns removed)', () => {
  it('flags hypotheses referencing a now-absent column and NEVER deletes them', async () => {
    useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    useAnalyzeStore.setState({ hypotheses: [sampleHyp] });
    const onMissingColumns = vi.fn();
    const { repo, dispatched } = makeFakeRepo({ 'hyp-1': [plan({})] });

    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE, onMissingColumns }));

    // Replace data: "Shift" disappears (hyp-1.condition references Shift).
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Operator']) });
    });
    await flush(DEBOUNCE);

    // Flagged, not deleted.
    expect(onMissingColumns).toHaveBeenCalledWith({ hypothesisIds: ['hyp-1'] });
    expect(useAnalyzeStore.getState().hypotheses).toHaveLength(1);
    expect(useAnalyzeStore.getState().hypotheses[0].id).toBe('hyp-1');
    // No findings/hypotheses deleted; no destructive dispatch.
    expect(dispatched.some(a => a.kind === 'MEASUREMENT_PLAN_REMOVE')).toBe(false);
  });

  it('handles add + remove in the same re-ingest (Operator added, Shift removed)', async () => {
    useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    useAnalyzeStore.setState({ hypotheses: [sampleHyp] });
    const onMissingColumns = vi.fn();
    // Plan now needs "Operator".
    const { repo } = makeFakeRepo({ 'hyp-1': [plan({ neededFactors: ['Operator'] })] });

    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE, onMissingColumns }));

    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Operator']) });
    });
    await flush(DEBOUNCE);

    // APPEND side: Operator matched → finding added.
    expect(useAnalyzeStore.getState().findings).toHaveLength(1);
    expect(useAnalyzeStore.getState().findings[0].id).toBe(
      mintAutoLinkFindingId('mp-1', 'Operator')
    );
    // REPLACE side: Shift removed → hyp-1 flagged.
    expect(onMissingColumns).toHaveBeenCalledWith({ hypothesisIds: ['hyp-1'] });
  });
});

describe('useReingestAutoLink — no plans / no hypotheses', () => {
  it('no-ops when there are no hypotheses (no plans to match)', async () => {
    useProjectStore.setState({ rawData: rowsWith(['Fill Weight']) });
    const { repo, dispatched } = makeFakeRepo({});
    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE }));

    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    });
    await flush(DEBOUNCE);

    expect(useAnalyzeStore.getState().findings).toHaveLength(0);
    expect(dispatched).toHaveLength(0);
  });
});
