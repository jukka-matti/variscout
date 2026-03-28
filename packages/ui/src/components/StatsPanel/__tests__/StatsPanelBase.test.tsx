import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@variscout/hooks', () => {
  const catalog: Record<string, string> = {
    'stats.summary': 'Summary Statistics',
    'stats.histogram': 'Histogram',
    'stats.probPlot': 'Probability Plot',
    'stats.editSpecs': 'Edit specifications',
    'stats.mean': 'Mean',
    'stats.median': 'Median',
    'stats.stdDev': 'Std Dev',
    'stats.samples': 'Samples',
    'stats.passRate': 'Pass Rate',
    'empty.noData': 'No data available',
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
      formatStat: (n: number, decimals?: number) => {
        if (decimals !== undefined) return n.toFixed(decimals);
        return n % 1 === 0 ? String(n) : n.toFixed(2);
      },
      formatPct: (n: number) => `${n}%`,
      locale: 'en',
    }),
  };
});

import StatsPanelBase from '../StatsPanelBase';
import type { StatsPanelBaseProps } from '../types';

const mockGetTerm = vi.fn().mockReturnValue(undefined);

const baseStats = {
  mean: 10.5,
  median: 10.3,
  stdDev: 1.2,
  sigmaWithin: 1.1,
  mrBar: 1.24,
  ucl: 13.8,
  lcl: 7.2,
  cp: 1.45,
  cpk: 1.33,
  outOfSpecPercentage: 2.5,
};

const specsWithLimits = { lsl: 8, usl: 13, target: 10.5 };

const defaultProps: StatsPanelBaseProps = {
  stats: baseStats,
  specs: {},
  filteredData: Array.from({ length: 50 }, (_, i) => ({ value: 10 + i * 0.1 })),
  outcome: 'value',
  getTerm: mockGetTerm,
};

describe('StatsPanelBase', () => {
  it('renders 4 basic metric cards without specs', () => {
    render(<StatsPanelBase {...defaultProps} />);
    expect(screen.getByTestId('stat-value-mean')).toBeDefined();
    expect(screen.getByTestId('stat-value-median')).toBeDefined();
    expect(screen.getByTestId('stat-value-std-dev')).toBeDefined();
    expect(screen.getByTestId('stat-value-samples')).toBeDefined();
  });

  it('renders 7 cards (+ Pass Rate, Cp, Cpk) with specs', () => {
    render(<StatsPanelBase {...defaultProps} specs={specsWithLimits} />);
    expect(screen.getByTestId('stat-value-pass-rate')).toBeDefined();
    expect(screen.getByTestId('stat-value-cp')).toBeDefined();
    expect(screen.getByTestId('stat-value-cpk')).toBeDefined();
    expect(screen.getByTestId('stat-value-mean')).toBeDefined();
  });

  it('hides Cp/Cpk/Pass Rate cards when showCpk=false', () => {
    render(<StatsPanelBase {...defaultProps} specs={specsWithLimits} showCpk={false} />);
    expect(screen.queryByTestId('stat-value-cp')).toBeNull();
    expect(screen.queryByTestId('stat-value-cpk')).toBeNull();
    expect(screen.queryByTestId('stat-value-pass-rate')).toBeNull();
    expect(screen.getByTestId('stat-value-mean')).toBeDefined();
  });

  it('shows empty state when stats=null', () => {
    render(<StatsPanelBase {...defaultProps} stats={null} />);
    const mean = screen.getByTestId('stat-value-mean');
    expect(mean.textContent).toBe('N/A');
  });

  it('displays correct stat values', () => {
    render(<StatsPanelBase {...defaultProps} />);
    expect(screen.getByTestId('stat-value-mean').textContent).toBe('10.50');
    expect(screen.getByTestId('stat-value-median').textContent).toBe('10.30');
    expect(screen.getByTestId('stat-value-std-dev').textContent).toBe('1.20');
    expect(screen.getByTestId('stat-value-samples').textContent).toBe('n=50');
  });

  describe('tab switching', () => {
    it('starts on Summary tab by default', () => {
      render(<StatsPanelBase {...defaultProps} />);
      expect(screen.getByTestId('stat-value-mean')).toBeDefined();
    });

    it('switches to Data tab', () => {
      const renderDataTable = vi.fn().mockReturnValue(<div data-testid="data-table">Table</div>);
      render(<StatsPanelBase {...defaultProps} renderDataTable={renderDataTable} />);

      fireEvent.click(screen.getByText('Data'));
      expect(screen.getByTestId('data-table')).toBeDefined();
      expect(renderDataTable).toHaveBeenCalled();
    });

    it('switches to What-If tab', () => {
      const renderWhatIf = vi.fn().mockReturnValue(<div data-testid="what-if">Simulator</div>);
      render(<StatsPanelBase {...defaultProps} renderWhatIf={renderWhatIf} />);

      fireEvent.click(screen.getByText('What-If'));
      expect(screen.getByTestId('what-if')).toBeDefined();
      expect(renderWhatIf).toHaveBeenCalled();
    });

    it('shows empty state for Data tab when no render function', () => {
      render(<StatsPanelBase {...defaultProps} />);
      fireEvent.click(screen.getByText('Data'));
      expect(screen.getByText('No data available')).toBeDefined();
    });

    it('shows empty state for What-If tab when no render function', () => {
      render(<StatsPanelBase {...defaultProps} />);
      fireEvent.click(screen.getByText('What-If'));
      expect(screen.getByText('No What-If simulator available')).toBeDefined();
    });
  });

  describe('pencil link', () => {
    it('shows "Edit specifications" when onEditSpecs provided', () => {
      const onEditSpecs = vi.fn();
      render(<StatsPanelBase {...defaultProps} onEditSpecs={onEditSpecs} />);
      expect(screen.getByTestId('edit-specs-link')).toBeDefined();
      expect(screen.getByText('Edit specifications')).toBeDefined();
    });

    it('calls onEditSpecs when pencil link is clicked', () => {
      const onEditSpecs = vi.fn();
      render(<StatsPanelBase {...defaultProps} onEditSpecs={onEditSpecs} />);
      fireEvent.click(screen.getByTestId('edit-specs-link'));
      expect(onEditSpecs).toHaveBeenCalledOnce();
    });

    it('does not show pencil link without onEditSpecs', () => {
      render(<StatsPanelBase {...defaultProps} />);
      expect(screen.queryByTestId('edit-specs-link')).toBeNull();
    });
  });

  describe('target discovery', () => {
    it('shows prompt when no specs and not drilling', () => {
      render(<StatsPanelBase {...defaultProps} specs={{}} isDrilling={false} />);
      expect(screen.getByTestId('target-discovery-prompt')).toBeDefined();
    });

    it('shows complement insight when no specs and drilling', () => {
      render(
        <StatsPanelBase
          {...defaultProps}
          specs={{}}
          isDrilling={true}
          complement={{ mean: 10.92, stdDev: 0.31, count: 20 }}
        />
      );
      expect(screen.getByTestId('target-discovery-complement')).toBeDefined();
    });

    it('shows centering opportunity when specs exist and not drilling', () => {
      render(
        <StatsPanelBase
          {...defaultProps}
          specs={specsWithLimits}
          isDrilling={false}
          centeringOpportunity={{ currentCpk: 0.26, cp: 1.01, gap: 0.75 }}
        />
      );
      expect(screen.getByTestId('target-discovery-centering')).toBeDefined();
    });

    it('shows headroom check when specs exist and drilling', () => {
      render(
        <StatsPanelBase
          {...defaultProps}
          specs={specsWithLimits}
          isDrilling={true}
          activeProjection={{
            currentCpk: 0.26,
            projectedCpk: 1.85,
            label: 'if fixed',
            findingCount: 1,
          }}
          cpkTarget={1.33}
        />
      );
      expect(screen.getByTestId('target-discovery-headroom')).toBeDefined();
    });
  });

  it('compact mode renders tab bar', () => {
    const { container } = render(<StatsPanelBase {...defaultProps} compact={true} />);
    expect(container.querySelector('.scroll-touch')).not.toBeNull();
  });

  it('applies default styling classes', () => {
    const { container } = render(<StatsPanelBase {...defaultProps} />);
    expect(container.querySelector('.bg-surface-secondary')).not.toBeNull();
  });

  it('respects defaultTab prop', () => {
    const renderDataTable = vi.fn().mockReturnValue(<div data-testid="data-table">Table</div>);
    render(
      <StatsPanelBase {...defaultProps} defaultTab="data" renderDataTable={renderDataTable} />
    );
    expect(screen.getByTestId('data-table')).toBeDefined();
  });
});
