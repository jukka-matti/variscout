import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HubPortfolioReport } from '../HubPortfolioReport';
import type { HubPortfolioReport as HubPortfolioReportModel } from '@variscout/core';

const report: HubPortfolioReportModel = {
  capabilitySummary: { kind: 'distribution', label: '2 outcome specs · show distributions' },
  cadenceHealthLabel: '1 of 2 holding',
  driftSignalCount: 1,
  rows: [
    {
      id: 'ip-1',
      title: 'Fill Cpk lift',
      status: 'active',
      dayCounter: 12,
      lastActivityAt: 1,
      cadenceLabel: 'weekly · due 2026-05-22',
      driftLabel: 'Holding',
    },
  ],
};

describe('HubPortfolioReport', () => {
  it('renders the free-roaming Hub portfolio without the IP narrative headings', () => {
    render(<HubPortfolioReport report={report} />);

    expect(screen.getByRole('heading', { name: 'Hub portfolio' })).toBeInTheDocument();
    expect(screen.getByText('Fill Cpk lift')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Executive summary' })).not.toBeInTheDocument();
  });
});
