import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useAnalysisScopeStore, getAnalysisScopeInitialState } from '@variscout/stores';
import { createTestOutcomeSpec } from '../../../../../test-utils/outcomeSpec';
import { OutcomeSummaryPill } from '../OutcomeSummaryPill';

describe('OutcomeSummaryPill', () => {
  beforeEach(() => {
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
  });

  it('renders nothing when scope.yColumn is undefined', () => {
    render(<OutcomeSummaryPill rawData={[]} outcomeSpecs={[]} />);
    expect(screen.queryByTestId('outcome-summary-pill')).toBeNull();
  });

  it('renders the pill with the outcome name when scope.yColumn is set', () => {
    useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
    render(
      <OutcomeSummaryPill
        rawData={[]}
        outcomeSpecs={[createTestOutcomeSpec({ columnName: 'Diameter' })]}
      />
    );
    const pill = screen.getByTestId('outcome-summary-pill');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveTextContent('Diameter');
  });

  it('shows formatted Cpk when outcomeSpec carries usl/lsl and data has variance', () => {
    useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
    const spec = createTestOutcomeSpec({
      columnName: 'Diameter',
      lsl: 9.5,
      usl: 10.5,
    });
    const rawData = [
      { Diameter: 9.9 },
      { Diameter: 10.1 },
      { Diameter: 10.0 },
      { Diameter: 9.95 },
      { Diameter: 10.05 },
      { Diameter: 10.02 },
      { Diameter: 9.98 },
      { Diameter: 10.01 },
      { Diameter: 9.99 },
      { Diameter: 10.03 },
    ];
    render(<OutcomeSummaryPill rawData={rawData} outcomeSpecs={[spec]} />);
    const pill = screen.getByTestId('outcome-summary-pill');
    expect(pill).toHaveTextContent(/Cpk \S/);
    expect(pill).not.toHaveTextContent('Cpk —');
  });

  it('filters data by scope.categoricalFilters before computing Cpk', () => {
    useAnalysisScopeStore.setState({
      yColumn: 'Diameter',
      categoricalFilters: [{ column: 'Vessel', values: ['A'] }],
    });
    const spec = createTestOutcomeSpec({
      columnName: 'Diameter',
      lsl: 9.5,
      usl: 10.5,
    });
    const rawData = [
      { Diameter: 9.99, Vessel: 'A' },
      { Diameter: 10.01, Vessel: 'A' },
      { Diameter: 10.0, Vessel: 'A' },
      { Diameter: 9.98, Vessel: 'A' },
      { Diameter: 10.02, Vessel: 'A' },
      { Diameter: 8.0, Vessel: 'B' },
      { Diameter: 12.0, Vessel: 'B' },
      { Diameter: 7.5, Vessel: 'B' },
    ];
    render(<OutcomeSummaryPill rawData={rawData} outcomeSpecs={[spec]} />);
    const pill = screen.getByTestId('outcome-summary-pill');
    expect(pill).toHaveTextContent(/Cpk \S/);
    expect(pill).not.toHaveTextContent('Cpk —');
  });

  it('shows Cpk — when outcomeSpec has no usl/lsl', () => {
    useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
    const spec = createTestOutcomeSpec({
      columnName: 'Diameter',
      lsl: undefined,
      usl: undefined,
    });
    render(
      <OutcomeSummaryPill rawData={[{ Diameter: 10 }, { Diameter: 11 }]} outcomeSpecs={[spec]} />
    );
    expect(screen.getByTestId('outcome-summary-pill')).toHaveTextContent('Cpk —');
  });

  it('opens OutcomeSpecsPopover on ↗ click with the current outcomeSpec', () => {
    useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
    const spec = createTestOutcomeSpec({ columnName: 'Diameter' });
    render(<OutcomeSummaryPill rawData={[]} outcomeSpecs={[spec]} />);

    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByTestId('outcome-summary-pill-spec-button'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/^target$/i)).toHaveValue(spec.target);
  });

  it('passes onApply through to onOutcomeSpecApply prop and closes popover', () => {
    useAnalysisScopeStore.setState({ yColumn: 'Diameter' });
    const spec = createTestOutcomeSpec({ columnName: 'Diameter' });
    const onApply = vi.fn();
    render(<OutcomeSummaryPill rawData={[]} outcomeSpecs={[spec]} onOutcomeSpecApply={onApply} />);
    fireEvent.click(screen.getByTestId('outcome-summary-pill-spec-button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ columnName: 'Diameter' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
