/**
 * PWA CS-13 crossing-back SEAM test (spec §4.0a).
 *
 * AW-9 writes projectStore.filters as the chart mirror, so categorical WHERE
 * predicates affect Explore charts and chrome together. Numeric ranges remain
 * deferred.
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallCanvas, navigateToExploreForChip } from '@variscout/ui';
import {
  useAnalysisScopeStore,
  getAnalysisScopeInitialState,
  useProjectStore,
  getProjectInitialState,
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  useViewStore,
  getViewInitialState,
} from '@variscout/stores';
import { createHypothesis } from '@variscout/core/findings';
import type { Hypothesis } from '@variscout/core';
import { usePanelsStore } from '../../../features/panels/panelsStore';

beforeEach(() => {
  useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
  useProjectStore.setState(getProjectInitialState());
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useViewStore.setState(getViewInitialState());
  usePanelsStore.getState().showAnalyze();
});

// createHypothesis is positional (name, synthesis, findingIds?);
// id + condition land via spread (the evaluate.seam suite's typed-fixture precedent).
const hub: Hypothesis = {
  ...createHypothesis('Night shift runs hot', '', []),
  id: 'h1',
  condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
};

function Harness({ wired = true }: { wired?: boolean }) {
  const handleExploreFactor = React.useCallback((factor: string) => {
    navigateToExploreForChip(
      {
        kind: 'factor',
        columnName: factor,
        outcomeColumn: 'Y',
        predicates: [
          { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
          { kind: 'leaf', column: 'LINE', op: 'in', value: ['L2', 'L3'] },
        ],
        hypothesisId: hub.id,
      },
      () => usePanelsStore.getState().showExplore()
    );
  }, []);
  return (
    <WallCanvas
      hubs={[hub]}
      findings={[]}
      problemCpk={1}
      eventsPerWeek={0}
      activeColumns={['SHIFT', 'Y']}
      outcomeColumn="Y"
      onExploreFactor={wired ? handleExploreFactor : undefined}
    />
  );
}

describe('CS-13 crossing-back (PWA seam)', () => {
  it('card → lands on Explore with the local y=f(x) in the scope store', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('hub-explore-jump'));
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Y');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('SHIFT');
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([
      { column: 'SHIFT', values: ['Night'] },
      { column: 'LINE', values: ['L2', 'L3'] },
    ]);
    expect(useProjectStore.getState().filters).toEqual({ SHIFT: ['Night'], LINE: ['L2', 'L3'] });
    expect(usePanelsStore.getState().activeView).toBe('explore');
  });

  it('unwired Wall renders no → and writes nothing (negative control)', () => {
    render(<Harness wired={false} />);
    expect(screen.queryByTestId('hub-explore-jump')).toBeNull();
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
    expect(usePanelsStore.getState().activeView).toBe('analyze');
  });
});
