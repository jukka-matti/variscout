// packages/ui/src/components/Explore/ScopeChrome/__tests__/PersistentScopeChip.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { PersistentScopeChip } from '../PersistentScopeChip';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

describe('PersistentScopeChip', () => {
  it('renders nothing when no scope is active', () => {
    const { container } = render(<PersistentScopeChip />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the outcome + filter count summary when a scope is active', () => {
    useAnalysisScopeStore.getState().setY('yield');
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A']);
    useAnalysisScopeStore.getState().setCategoricalValues('shift', ['day']);
    render(<PersistentScopeChip />);
    const chip = screen.getByTestId('persistent-scope-chip');
    expect(chip).toHaveTextContent('yield');
    expect(chip).toHaveTextContent('2 filters');
  });

  it('renders the singular "1 filter" form for a single categorical filter', () => {
    useAnalysisScopeStore.getState().setY('yield');
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A']);
    render(<PersistentScopeChip />);
    expect(screen.getByTestId('persistent-scope-chip')).toHaveTextContent('1 filter');
  });

  it('renders the boxplot factor segment when set', () => {
    useAnalysisScopeStore.getState().setY('yield');
    useAnalysisScopeStore.getState().setBoxplotFactor('temperature');
    render(<PersistentScopeChip />);
    expect(screen.getByTestId('persistent-scope-chip')).toHaveTextContent('temperature');
  });

  it('renders when only a categorical filter is set (no yColumn)', () => {
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A']);
    render(<PersistentScopeChip />);
    expect(screen.getByTestId('persistent-scope-chip')).toBeInTheDocument();
  });

  it('uses columnAliases for the outcome label when provided, else the raw column', () => {
    useAnalysisScopeStore.getState().setY('y1');
    render(<PersistentScopeChip columnAliases={{ y1: 'Yield %' }} />);
    expect(screen.getByTestId('persistent-scope-chip')).toHaveTextContent('Yield %');
  });

  it('clears the scope when the × affordance is clicked', () => {
    useAnalysisScopeStore.getState().setY('yield');
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A']);
    render(<PersistentScopeChip />);
    fireEvent.click(screen.getByTestId('persistent-scope-chip-clear'));
    const state = useAnalysisScopeStore.getState();
    expect(state.yColumn).toBeUndefined();
    expect(state.categoricalFilters).toHaveLength(0);
  });

  it('renders the summary as a button calling onOpen when provided', () => {
    const onOpen = vi.fn();
    useAnalysisScopeStore.getState().setY('yield');
    render(<PersistentScopeChip onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId('persistent-scope-chip-open'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renders the summary as non-interactive text when onOpen is omitted', () => {
    useAnalysisScopeStore.getState().setY('yield');
    render(<PersistentScopeChip />);
    expect(screen.queryByTestId('persistent-scope-chip-open')).toBeNull();
  });
});
