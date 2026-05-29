// packages/ui/src/components/Explore/ScopeChrome/__tests__/ScopeChip.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { ScopeChip } from '../ScopeChip';

beforeEach(() => {
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
});

const outcomeOptions = [
  { columnName: 'yield', label: 'yield' },
  { columnName: 'defectRate', label: 'defectRate' },
];

const factorOptions = [
  { columnName: 'temperature', label: 'temperature' },
  { columnName: 'pressure', label: 'pressure' },
];

const stepOptions = [
  { stepId: 'mix', label: 'Mix' },
  { stepId: 'pack', label: 'Pack' },
];

describe('ScopeChip — outcome', () => {
  it('renders the active outcome and is not removable', () => {
    render(
      <ScopeChip
        chip={{ kind: 'outcome', value: 'yield', options: outcomeOptions }}
        removable={false}
      />
    );
    expect(screen.getByTestId('scope-chip-outcome')).toHaveTextContent('yield');
    expect(screen.queryByTestId('scope-chip-remove-outcome')).toBeNull();
  });

  it('opens a SingleSelectPopover on click and dispatches setY on selection', () => {
    render(
      <ScopeChip
        chip={{ kind: 'outcome', value: 'yield', options: outcomeOptions }}
        removable={false}
      />
    );
    fireEvent.click(screen.getByTestId('scope-chip-outcome'));
    fireEvent.click(screen.getByTestId('single-select-option-defectRate'));
    expect(useAnalysisScopeStore.getState().yColumn).toBe('defectRate');
  });
});

describe('ScopeChip — factor', () => {
  it('renders the active factor with × and dispatches setBoxplotFactor(undefined) on remove', () => {
    useAnalysisScopeStore.getState().setBoxplotFactor('temperature');
    render(
      <ScopeChip
        chip={{ kind: 'factor', value: 'temperature', options: factorOptions }}
        removable={true}
      />
    );
    fireEvent.click(screen.getByTestId('scope-chip-remove-factor'));
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
  });

  it('dispatches setBoxplotFactor when a new factor is selected', () => {
    render(
      <ScopeChip
        chip={{ kind: 'factor', value: 'temperature', options: factorOptions }}
        removable={true}
      />
    );
    fireEvent.click(screen.getByTestId('scope-chip-factor'));
    fireEvent.click(screen.getByTestId('single-select-option-pressure'));
    expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('pressure');
  });
});

describe('ScopeChip — step', () => {
  it('renders the nullOption "All steps" and dispatches setStepId(undefined) on click', () => {
    useAnalysisScopeStore.getState().setStepId('mix');
    render(
      <ScopeChip chip={{ kind: 'step', value: 'mix', options: stepOptions }} removable={true} />
    );
    fireEvent.click(screen.getByTestId('scope-chip-step'));
    fireEvent.click(screen.getByTestId('single-select-null-option'));
    expect(useAnalysisScopeStore.getState().stepId).toBeUndefined();
  });
});

describe('ScopeChip — categorical', () => {
  it('renders a multi-value label and dispatches removeCategoricalFilter on remove', () => {
    useAnalysisScopeStore.getState().setCategoricalValues('vessel', ['A', 'B']);
    render(
      <ScopeChip
        chip={{
          kind: 'categorical',
          column: 'vessel',
          values: ['A', 'B'],
          availableValues: ['A', 'B', 'C'],
        }}
        removable={true}
      />
    );
    expect(screen.getByTestId('scope-chip-categorical-vessel')).toHaveTextContent('vessel: A, B');
    fireEvent.click(screen.getByTestId('scope-chip-remove-categorical-vessel'));
    expect(
      useAnalysisScopeStore.getState().categoricalFilters.find(f => f.column === 'vessel')
    ).toBeUndefined();
  });

  it('renders a "3 values" label when more than two values selected', () => {
    render(
      <ScopeChip
        chip={{
          kind: 'categorical',
          column: 'operator',
          values: ['op1', 'op2', 'op3'],
          availableValues: ['op1', 'op2', 'op3', 'op4'],
        }}
        removable={true}
      />
    );
    expect(screen.getByTestId('scope-chip-categorical-operator')).toHaveTextContent(
      'operator: 3 values'
    );
  });
});
