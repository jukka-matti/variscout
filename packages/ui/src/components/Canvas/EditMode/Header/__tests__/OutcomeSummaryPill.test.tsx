import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
