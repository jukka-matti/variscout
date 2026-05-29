// packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChrome.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { ScopeChrome } from '../ScopeChrome';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

const baseProps = {
  availableOutcomes: [
    { columnName: 'yield', label: 'yield' },
    { columnName: 'defectRate', label: 'defectRate' },
  ],
  availableFactors: [
    { columnName: 'temperature', label: 'temperature' },
    { columnName: 'vessel', label: 'vessel' },
  ],
  availableSteps: [
    { stepId: 'mix', label: 'Mix' },
    { stepId: 'pack', label: 'Pack' },
  ],
  categoricalValuesByColumn: {
    vessel: ['A', 'B', 'C'],
  },
};

describe('ScopeChrome', () => {
  it('renders the empty-state hint when yColumn is undefined', () => {
    render(<ScopeChrome {...baseProps} />);
    expect(screen.getByTestId('scope-chrome-empty-state-hint')).toBeInTheDocument();
    expect(screen.queryByTestId('scope-chip-outcome')).toBeNull();
  });

  it('invokes onNavigateToProcess when the empty-state link is clicked', () => {
    const onNavigateToProcess = vi.fn();
    render(<ScopeChrome {...baseProps} onNavigateToProcess={onNavigateToProcess} />);
    fireEvent.click(screen.getByTestId('empty-state-hint-process-link'));
    expect(onNavigateToProcess).toHaveBeenCalledTimes(1);
  });

  it('renders the chip row + clear all when yColumn is defined', () => {
    useAnalysisScopeStore.getState().setY('yield');
    render(<ScopeChrome {...baseProps} />);
    expect(screen.getByTestId('scope-chip-outcome')).toHaveTextContent('yield');
    expect(screen.getByTestId('scope-chrome-clear-all')).toBeInTheDocument();
  });

  it('renders X / step / categorical chips when those scope fields are populated', () => {
    useAnalysisScopeStore.getState().setY('yield');
    useAnalysisScopeStore.getState().setBoxplotFactor('temperature');
    useAnalysisScopeStore.getState().setStepId('mix');
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A']);
    render(<ScopeChrome {...baseProps} />);
    expect(screen.getByTestId('scope-chip-factor')).toHaveTextContent('temperature');
    expect(screen.getByTestId('scope-chip-step')).toHaveTextContent('mix');
    expect(screen.getByTestId('scope-chip-categorical-vessel')).toHaveTextContent('vessel: A');
  });

  it('clear all dispatches clearScope and returns to empty state', () => {
    useAnalysisScopeStore.getState().setY('yield');
    useAnalysisScopeStore.getState().setBoxplotFactor('temperature');
    render(<ScopeChrome {...baseProps} />);
    fireEvent.click(screen.getByTestId('scope-chrome-clear-all'));
    expect(useAnalysisScopeStore.getState().yColumn).toBeUndefined();
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
  });

  it('renders the AddFilterButton when yColumn is defined', () => {
    useAnalysisScopeStore.getState().setY('yield');
    render(<ScopeChrome {...baseProps} />);
    expect(screen.getByTestId('add-filter-button')).toBeInTheDocument();
  });
});
