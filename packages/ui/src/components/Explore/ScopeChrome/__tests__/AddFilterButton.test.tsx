// packages/ui/src/components/Explore/ScopeChrome/__tests__/AddFilterButton.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { AddFilterButton } from '../AddFilterButton';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

const availableFactors = [
  { columnName: 'vessel', label: 'vessel' },
  { columnName: 'operator', label: 'operator' },
  { columnName: 'shift', label: 'shift' },
];

const categoricalValuesByColumn = {
  vessel: ['A', 'B', 'C'],
  operator: ['op1', 'op2'],
  shift: ['day', 'night'],
};

describe('AddFilterButton', () => {
  it('renders the + filter button', () => {
    render(
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
    );
    expect(screen.getByTestId('add-filter-button')).toHaveTextContent('+ filter');
  });

  it('opens a column picker on click with all factors not yet in scope', () => {
    render(
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
    );
    fireEvent.click(screen.getByTestId('add-filter-button'));
    expect(screen.getByTestId('single-select-option-vessel')).toBeInTheDocument();
    expect(screen.getByTestId('single-select-option-operator')).toBeInTheDocument();
    expect(screen.getByTestId('single-select-option-shift')).toBeInTheDocument();
  });

  it('excludes already-active categorical columns from the picker', () => {
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A']);
    render(
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
    );
    fireEvent.click(screen.getByTestId('add-filter-button'));
    expect(screen.queryByTestId('single-select-option-vessel')).toBeNull();
    expect(screen.getByTestId('single-select-option-operator')).toBeInTheDocument();
  });

  it('transitions to FilterChipDropdown after a column is picked + writes through to scope', () => {
    render(
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
    );
    fireEvent.click(screen.getByTestId('add-filter-button'));
    fireEvent.click(screen.getByTestId('single-select-option-operator'));
    // FilterChipDropdown for "operator" should now be open. The dropdown
    // renders each available value as a row containing the value text.
    // Adapt the selector to whatever FilterChipDropdown actually exposes —
    // ProcessHealthBar.test.tsx is the canonical reference for asserting
    // against this component's dropdown. The illustrative selector below
    // assumes a row labelled with the value text.
    fireEvent.click(screen.getByText('op1'));
    const filter = useAnalysisScopeStore
      .getState()
      .categoricalFilters.find(f => f.column === 'operator');
    expect(filter?.values).toContain('op1');
  });

  it('hides itself entirely when no factors remain to filter', () => {
    // All three factors are already in scope → pickerOptions is empty →
    // the button hides per `feedback_hidden_vs_disabled_cta`.
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A']);
    useAnalysisScopeStore.getState().setCategoricalValues('operator', ['op1']);
    useAnalysisScopeStore.getState().setCategoricalValues('shift', ['day']);
    render(
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
    );
    expect(screen.queryByTestId('add-filter-button')).toBeNull();
  });
});
