import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getAnalyzeInitialState, useAnalyzeStore, useProjectStore } from '@variscout/stores';
import type { Hypothesis } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { HubAction } from '@variscout/core/actions';
import type { ReingestPendingMatch } from '@variscout/core/autoLink';
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
    id: 'plan-1',
    createdAt: 0,
    deletedAt: null,
    hypothesisId: 'hyp-1',
    outcome: 'Fill Weight',
    primaryFactor: 'Nozzle temperature',
    neededFactors: ['nozzle-temp'],
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
  // the async cascade (Dexie reads) completes before assertions.
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useReingestAutoLink — inert states', () => {
  it('does nothing when repository is null', async () => {
    const onPendingMatches = vi.fn();
    renderHook(() => useReingestAutoLink(null, { debounceMs: DEBOUNCE, onPendingMatches }));
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'nozzle-temp']) });
    });
    await flush(DEBOUNCE);
    expect(onPendingMatches).not.toHaveBeenCalled();
  });

  it('does nothing before the debounce elapses', async () => {
    useAnalyzeStore.setState({ hypotheses: [sampleHyp] });
    const onPendingMatches = vi.fn();
    const { repo } = makeFakeRepo({ 'hyp-1': [plan({})] });
    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE, onPendingMatches }));
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'nozzle-temp']) });
    });
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE - 1);
      await Promise.resolve();
    });
    expect(onPendingMatches).not.toHaveBeenCalled();
  });
});

describe('useReingestAutoLink — APPEND-cascade (columns added)', () => {
  beforeEach(() => {
    // Seed prior column universe WITHOUT the to-be-added "nozzle-temp".
    useProjectStore.setState({ rawData: rowsWith(['Fill Weight']) });
    useAnalyzeStore.setState({ hypotheses: [sampleHyp] });
  });

  it('surfaces pending matches via onPendingMatches and performs ZERO writes', async () => {
    const onPendingMatches = vi.fn();
    const onPlansChanged = vi.fn();
    const { repo } = makeFakeRepo({ 'hyp-1': [plan({})] });
    renderHook(() =>
      useReingestAutoLink(repo, { debounceMs: DEBOUNCE, onPendingMatches, onPlansChanged })
    );

    // Append a column matching a plan's neededFactors → advance debounce timers.
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'nozzle-temp']) });
    });
    await flush(DEBOUNCE);

    expect(onPendingMatches).toHaveBeenCalledWith([
      expect.objectContaining({ planId: 'plan-1', column: 'nozzle-temp' }),
    ]);

    // De-automation negative controls:
    expect(useAnalyzeStore.getState().findings).toHaveLength(0); // no auto-Finding injected
    expect(repo.dispatch).not.toHaveBeenCalled(); // no link, no status bump
    expect(onPlansChanged).not.toHaveBeenCalled(); // nonce no longer fires from the cascade
  });

  it('same-delta re-fire does not duplicate pending matches', async () => {
    const onPendingMatches = vi.fn();
    const { repo } = makeFakeRepo({ 'hyp-1': [plan({})] });
    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE, onPendingMatches }));

    // First re-ingest brings "nozzle-temp".
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'nozzle-temp']) });
    });
    await flush(DEBOUNCE);
    expect(onPendingMatches).toHaveBeenCalledTimes(1);

    // Second rawData change introducing NO new columns (row append, same column set).
    act(() => {
      useProjectStore.setState({
        rawData: [
          ...rowsWith(['Fill Weight', 'nozzle-temp']),
          { 'Fill Weight': 2, 'nozzle-temp': 1 },
        ],
      });
    });
    await flush(DEBOUNCE);

    // The column delta is empty → onPendingMatches NOT called again.
    expect(onPendingMatches).toHaveBeenCalledTimes(1);
  });

  it('does not call onPendingMatches when no plan references the new column', async () => {
    const onPendingMatches = vi.fn();
    const { repo } = makeFakeRepo({ 'hyp-1': [plan({ neededFactors: ['Operator'] })] });
    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE, onPendingMatches }));

    act(() => {
      // Add 'nozzle-temp', but the plan only needs 'Operator' → no match.
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'nozzle-temp']) });
    });
    await flush(DEBOUNCE);

    expect(onPendingMatches).not.toHaveBeenCalled();
  });
});

describe('useReingestAutoLink — REPLACE telemetry branch (columns removed)', () => {
  it('REPLACE telemetry branch unchanged: missing columns still reported, never written', async () => {
    useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    useAnalyzeStore.setState({ hypotheses: [sampleHyp] });
    const onMissingColumns = vi.fn();
    const { repo } = makeFakeRepo({ 'hyp-1': [plan({})] });

    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE, onMissingColumns }));

    // Replace data dropping a needed column: "Shift" disappears (hyp-1.condition references Shift).
    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Operator']) });
    });
    await flush(DEBOUNCE);

    // onMissingColumns called; flagged, not deleted.
    expect(onMissingColumns).toHaveBeenCalledWith({ hypothesisIds: ['hyp-1'] });
    expect(useAnalyzeStore.getState().hypotheses).toHaveLength(1);
    expect(useAnalyzeStore.getState().hypotheses[0].id).toBe('hyp-1');
    // dispatch NOT called — telemetry-only, no destructive write.
    expect(repo.dispatch).not.toHaveBeenCalled();
  });

  it('handles add + remove in the same re-ingest (surface matches, flag missing, write nothing)', async () => {
    useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    useAnalyzeStore.setState({ hypotheses: [sampleHyp] });
    const onMissingColumns = vi.fn();
    const onPendingMatches = vi.fn();
    // Plan now needs "Operator".
    const { repo } = makeFakeRepo({ 'hyp-1': [plan({ neededFactors: ['Operator'] })] });

    renderHook(() =>
      useReingestAutoLink(repo, {
        debounceMs: DEBOUNCE,
        onMissingColumns,
        onPendingMatches,
      })
    );

    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Operator']) });
    });
    await flush(DEBOUNCE);

    // APPEND side: Operator matched → pending match surfaced.
    expect(onPendingMatches).toHaveBeenCalledWith([
      expect.objectContaining({ planId: 'plan-1', column: 'Operator' }),
    ]);
    // REPLACE side: Shift removed → hyp-1 flagged.
    expect(onMissingColumns).toHaveBeenCalledWith({ hypothesisIds: ['hyp-1'] });
    // Still zero writes.
    expect(repo.dispatch).not.toHaveBeenCalled();
    expect(useAnalyzeStore.getState().findings).toHaveLength(0);
  });
});

describe('useReingestAutoLink — no plans / no hypotheses', () => {
  it('no-ops when there are no hypotheses (no plans to match)', async () => {
    useProjectStore.setState({ rawData: rowsWith(['Fill Weight']) });
    const onPendingMatches = vi.fn();
    const { repo } = makeFakeRepo({});
    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE, onPendingMatches }));

    act(() => {
      useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'nozzle-temp']) });
    });
    await flush(DEBOUNCE);

    expect(useAnalyzeStore.getState().findings).toHaveLength(0);
    expect(onPendingMatches).not.toHaveBeenCalled();
  });
});

describe('useReingestAutoLink — teardown guard (rawData → [])', () => {
  it('does NOT flag missing columns when rawData is cleared to empty (teardown, not replace)', async () => {
    // Guard: when rawData → [], removedColumns === ALL prior columns. This is a
    // teardown/clear, NOT a replace-orphan event. The REPLACE branch must be skipped
    // (currentColumns.size === 0 guard) to avoid spurious onMissingColumns calls.
    useProjectStore.setState({ rawData: rowsWith(['Fill Weight', 'Shift']) });
    useAnalyzeStore.setState({ hypotheses: [sampleHyp] });
    const onMissingColumns = vi.fn();
    const { repo } = makeFakeRepo({ 'hyp-1': [plan({})] });

    renderHook(() => useReingestAutoLink(repo, { debounceMs: DEBOUNCE, onMissingColumns }));

    // Clear rawData entirely.
    act(() => {
      useProjectStore.setState({ rawData: [] });
    });
    await flush(DEBOUNCE);

    // Teardown → no spurious missing-column flag.
    expect(onMissingColumns).not.toHaveBeenCalled();
    // Hypotheses still intact — nothing was deleted.
    expect(useAnalyzeStore.getState().hypotheses).toHaveLength(1);
  });
});

// Type-level sanity: the engine descriptor used by callers is re-exported correctly.
const _typecheck: (m: ReingestPendingMatch[]) => void = () => {};
void _typecheck;
