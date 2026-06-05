/**
 * Azure CS-13 crossing-back SEAM test (spec §4.0a).
 *
 * Renders the REAL WallCanvas with onExploreFactor wired exactly as
 * AnalyzeWorkspace.handleExploreFactor: navigateToExploreForChip
 * ({kind:'factor', columnName, outcomeColumn}) + the REAL panelsStore
 * showExplore(). Clicking the card → must land the analyst on the Explore
 * tab with BOTH yColumn and boxplotFactor written — a dead wire fails
 * (render-through, not a spy).
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallCanvas, navigateToExploreForChip } from '@variscout/ui';
import {
  useAnalysisScopeStore,
  getAnalysisScopeInitialState,
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
    navigateToExploreForChip({ kind: 'factor', columnName: factor, outcomeColumn: 'Y' }, () =>
      usePanelsStore.getState().showExplore()
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

describe('CS-13 crossing-back (Azure seam)', () => {
  it('card → lands on Explore with the local y=f(x) in the scope store', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('hub-explore-jump'));
    expect(useAnalysisScopeStore.getState().yColumn).toBe('Y');
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('SHIFT');
    expect(usePanelsStore.getState().activeView).toBe('explore');
  });

  it('unwired Wall renders no → and writes nothing (negative control)', () => {
    render(<Harness wired={false} />);
    expect(screen.queryByTestId('hub-explore-jump')).toBeNull();
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
    expect(usePanelsStore.getState().activeView).toBe('analyze');
  });
});
