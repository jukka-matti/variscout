/**
 * Tests for DataQualityBanner component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@variscout/hooks', () => {
  const catalog: Record<string, string> = {
    'quality.allValid': 'All data valid',
    'quality.rowsReady': '{count} rows ready for analysis',
    'quality.rowsExcluded': '{count} rows excluded',
    'quality.missingValues': 'Missing values',
    'quality.nonNumeric': 'Non-numeric values',
    'quality.noVariation': 'No variation',
    'quality.emptyColumn': 'Empty column',
    'quality.noVariationWarning': 'This column has no variation \u2014 all values are identical',
    'quality.viewExcluded': 'View excluded',
    'quality.viewAll': 'View all',
    'quality.dataFile': 'Data File',
    'action.continue': 'Continue',
  };
  return {
    useTranslation: () => ({
      t: (key: string) => catalog[key] ?? key,
      tf: (key: string, params: Record<string, string | number>) => {
        let msg = catalog[key] ?? key;
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, String(v));
        }
        return msg;
      },
      locale: 'en',
      formatNumber: (n: number) => String(n),
      formatStat: (n: number) => String(n),
      formatPct: (n: number) => `${n}%`,
    }),
  };
});

import { DataQualityBanner } from '../index';
import type { DataQualityReport } from '@variscout/core';

function makeReport(overrides: Partial<DataQualityReport> = {}): DataQualityReport {
  return {
    totalRows: 100,
    validRows: 100,
    excludedRows: [],
    columnIssues: [],
    ...overrides,
  };
}

describe('DataQualityBanner', () => {
  it('renders with no issues', () => {
    const report = makeReport();
    render(<DataQualityBanner report={report} />);

    expect(screen.getByText('100 rows')).toBeDefined();
    expect(screen.getByText('All data valid')).toBeDefined();
  });

  it('renders filename when provided', () => {
    render(<DataQualityBanner report={makeReport()} filename="test.csv" />);
    expect(screen.getByText('test.csv')).toBeDefined();
  });

  it('shows default filename when not provided', () => {
    render(<DataQualityBanner report={makeReport()} />);
    expect(screen.getByText('Data File')).toBeDefined();
  });

  it('renders valid rows count', () => {
    const report = makeReport({ validRows: 95 });
    render(<DataQualityBanner report={report} />);

    expect(screen.getByText('95 rows ready for analysis')).toBeDefined();
  });

  it('renders excluded rows warning', () => {
    const report = makeReport({
      validRows: 95,
      excludedRows: [
        { index: 0, reasons: [{ type: 'missing', column: 'weight' }] },
        { index: 1, reasons: [{ type: 'missing', column: 'weight' }] },
        { index: 2, reasons: [{ type: 'non_numeric', column: 'weight' }] },
        { index: 3, reasons: [{ type: 'missing', column: 'weight' }] },
        { index: 4, reasons: [{ type: 'missing', column: 'weight' }] },
      ],
      columnIssues: [{ column: 'weight', type: 'missing', count: 5, severity: 'warning' }],
    });
    render(<DataQualityBanner report={report} />);

    expect(screen.getByText(/5 rows excluded/)).toBeDefined();
  });

  it('renders View Excluded button when handler provided', () => {
    const onView = vi.fn();
    const report = makeReport({
      validRows: 95,
      excludedRows: [{ index: 0, reasons: [{ type: 'missing', column: 'weight' }] }],
      columnIssues: [{ column: 'weight', type: 'missing', count: 1, severity: 'warning' }],
    });
    render(<DataQualityBanner report={report} onViewExcludedRows={onView} />);

    const button = screen.getByText('View excluded');
    fireEvent.click(button);
    expect(onView).toHaveBeenCalledOnce();
  });

  it('renders View All Data button when handler provided', () => {
    const onViewAll = vi.fn();
    render(<DataQualityBanner report={makeReport()} onViewAllData={onViewAll} />);

    const button = screen.getByText('View all');
    fireEvent.click(button);
    expect(onViewAll).toHaveBeenCalledOnce();
  });

  it('renders Continue button when handler provided', () => {
    const onContinue = vi.fn();
    render(<DataQualityBanner report={makeReport()} onContinue={onContinue} />);

    const button = screen.getByText('Continue');
    fireEvent.click(button);
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('hides actions when showActions is false', () => {
    render(<DataQualityBanner report={makeReport()} showActions={false} onContinue={() => {}} />);
    expect(screen.queryByText('Continue')).toBeNull();
  });

  it('has role="status" for screen readers', () => {
    const { container } = render(<DataQualityBanner report={makeReport()} />);
    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).not.toBeNull();
  });

  it('shows no variation info message', () => {
    const report = makeReport({
      columnIssues: [{ column: 'weight', type: 'no_variation', count: 100, severity: 'info' }],
    });
    render(<DataQualityBanner report={report} />);

    expect(screen.getByText(/no variation/i)).toBeDefined();
  });
});
