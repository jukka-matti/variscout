import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock @variscout/hooks BEFORE any imports that use it
vi.mock('@variscout/hooks', () => {
  return {
    useTranslation: () => ({
      t: (key: string) => key,
      tf: (key: string) => key,
      formatStat: (n: number, decimals?: number) => {
        if (decimals !== undefined) return n.toFixed(decimals);
        return n % 1 === 0 ? String(n) : n.toFixed(2);
      },
      formatPct: (n: number) => `${n}%`,
      locale: 'en',
    }),
    useTooltipPosition: () => ({ tooltipStyle: {}, direction: 'below' as const }),
  };
});

// Mock @variscout/core to avoid import issues
vi.mock('@variscout/core', () => {
  return {
    getVariationImpactLevel: () => 'moderate',
    getVariationInsight: () => 'Some insight',
  };
});

import ProcessHealthBar from '../ProcessHealthBar';
import type { ProcessHealthBarProps } from '../types';
import type { FilterChipData } from '@variscout/hooks';

const baseStats = {
  mean: 10.5,
  median: 10.3,
  stdDev: 1.2,
  sigmaWithin: 1.1,
  mrBar: 1.24,
  ucl: 13.8,
  lcl: 7.2,
  outOfSpecPercentage: 5,
};

const specsWithLimits = { lsl: 8, usl: 13 };

const sampleChips: FilterChipData[] = [
  {
    factor: 'Machine',
    values: ['A', 'B'],
    contributionPct: 45,
    availableValues: [
      { value: 'A', contributionPct: 25, isSelected: true },
      { value: 'B', contributionPct: 20, isSelected: true },
      { value: 'C', contributionPct: 10, isSelected: false },
    ],
  },
];

const defaultProps: ProcessHealthBarProps = {
  stats: baseStats,
  specs: {},
  sampleCount: 100,
  filterChipData: [],
  onUpdateFilterValues: vi.fn(),
  onRemoveFilter: vi.fn(),
  layout: 'grid',
  onLayoutChange: vi.fn(),
  factorCount: 2,
};

describe('ProcessHealthBar', () => {
  it('renders Mean, sigma, n when no specs', () => {
    render(<ProcessHealthBar {...defaultProps} />);
    // Mean label
    const bar = screen.getByTestId('process-health-bar');
    expect(bar.textContent).toContain('10.50');
    expect(bar.textContent).toContain('1.20');
    expect(bar.textContent).toContain('100');
  });

  it('renders Cpk and Pass Rate when specs set', () => {
    const propsWithSpecs: ProcessHealthBarProps = {
      ...defaultProps,
      specs: specsWithLimits,
      stats: { ...baseStats, cpk: 1.45, cp: 1.5 },
    };
    render(<ProcessHealthBar {...propsWithSpecs} />);
    expect(screen.getByTestId('stat-cpk')).toBeDefined();
    const bar = screen.getByTestId('process-health-bar');
    expect(bar.textContent).toContain('Pass');
    expect(bar.textContent).toContain('95.0%');
  });

  it('renders Cpk color green when cpk >= target', () => {
    const propsWithSpecs: ProcessHealthBarProps = {
      ...defaultProps,
      specs: specsWithLimits,
      stats: { ...baseStats, cpk: 1.5, cp: 1.6 },
      cpkTarget: 1.33,
    };
    render(<ProcessHealthBar {...propsWithSpecs} />);
    const cpkBtn = screen.getByTestId('stat-cpk');
    expect(cpkBtn.className).toContain('text-green-500');
  });

  it('renders Cpk color amber when cpk between 1.0 and target', () => {
    const propsWithSpecs: ProcessHealthBarProps = {
      ...defaultProps,
      specs: specsWithLimits,
      stats: { ...baseStats, cpk: 1.1, cp: 1.2 },
      cpkTarget: 1.33,
    };
    render(<ProcessHealthBar {...propsWithSpecs} />);
    const cpkBtn = screen.getByTestId('stat-cpk');
    expect(cpkBtn.className).toContain('text-amber-500');
  });

  it('renders Cpk color red when cpk < 1.0', () => {
    const propsWithSpecs: ProcessHealthBarProps = {
      ...defaultProps,
      specs: specsWithLimits,
      stats: { ...baseStats, cpk: 0.8, cp: 0.9 },
      cpkTarget: 1.33,
    };
    render(<ProcessHealthBar {...propsWithSpecs} />);
    const cpkBtn = screen.getByTestId('stat-cpk');
    expect(cpkBtn.className).toContain('text-red-400');
  });

  it('renders filter chips when drilling', () => {
    render(<ProcessHealthBar {...defaultProps} filterChipData={sampleChips} />);
    expect(screen.getByTestId('filter-chip-Machine')).toBeDefined();
    const bar = screen.getByTestId('process-health-bar');
    expect(bar.textContent).toContain('Machine');
    expect(bar.textContent).toContain('45%');
  });

  it('calls onRemoveFilter when dismiss button clicked', () => {
    const onRemoveFilter = vi.fn();
    render(
      <ProcessHealthBar
        {...defaultProps}
        filterChipData={sampleChips}
        onRemoveFilter={onRemoveFilter}
      />
    );
    fireEvent.click(screen.getByTestId('filter-chip-remove-Machine'));
    expect(onRemoveFilter).toHaveBeenCalledWith('Machine');
  });

  it('calls onClearAll when Clear button clicked', () => {
    const onClearAll = vi.fn();
    render(
      <ProcessHealthBar {...defaultProps} filterChipData={sampleChips} onClearAll={onClearAll} />
    );
    fireEvent.click(screen.getByTestId('filter-clear-all'));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('shows "Set specs" prompt when no specs and onSetSpecs provided', () => {
    const onSetSpecs = vi.fn();
    render(<ProcessHealthBar {...defaultProps} specs={{}} onSetSpecs={onSetSpecs} />);
    const setSpecsBtn = screen.getByTestId('btn-set-specs');
    expect(setSpecsBtn).toBeDefined();
    fireEvent.click(setSpecsBtn);
    expect(onSetSpecs).toHaveBeenCalled();
  });

  it('does not show "Set specs" prompt when specs are set', () => {
    render(
      <ProcessHealthBar
        {...defaultProps}
        specs={specsWithLimits}
        stats={{ ...baseStats, cpk: 1.4 }}
        onSetSpecs={vi.fn()}
      />
    );
    expect(screen.queryByTestId('btn-set-specs')).toBeNull();
  });

  it('renders layout toggle buttons', () => {
    render(<ProcessHealthBar {...defaultProps} />);
    expect(screen.getByTestId('layout-grid-btn')).toBeDefined();
    expect(screen.getByTestId('layout-scroll-btn')).toBeDefined();
  });

  it('calls onLayoutChange with correct value when layout buttons clicked', () => {
    const onLayoutChange = vi.fn();
    render(<ProcessHealthBar {...defaultProps} layout="grid" onLayoutChange={onLayoutChange} />);
    fireEvent.click(screen.getByTestId('layout-scroll-btn'));
    expect(onLayoutChange).toHaveBeenCalledWith('scroll');

    fireEvent.click(screen.getByTestId('layout-grid-btn'));
    expect(onLayoutChange).toHaveBeenCalledWith('grid');
  });

  it('marks active layout button as pressed', () => {
    render(<ProcessHealthBar {...defaultProps} layout="scroll" />);
    const scrollBtn = screen.getByTestId('layout-scroll-btn');
    expect(scrollBtn.getAttribute('aria-pressed')).toBe('true');
    const gridBtn = screen.getByTestId('layout-grid-btn');
    expect(gridBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders Factors button with count', () => {
    render(<ProcessHealthBar {...defaultProps} factorCount={3} />);
    const factorsBtn = screen.getByTestId('btn-manage-factors');
    expect(factorsBtn.textContent).toContain('Factors(3)');
  });

  it('calls onManageFactors when Factors button clicked', () => {
    const onManageFactors = vi.fn();
    render(<ProcessHealthBar {...defaultProps} onManageFactors={onManageFactors} />);
    fireEvent.click(screen.getByTestId('btn-manage-factors'));
    expect(onManageFactors).toHaveBeenCalled();
  });

  it('renders Export button when onExportCSV provided', () => {
    const onExportCSV = vi.fn();
    render(<ProcessHealthBar {...defaultProps} onExportCSV={onExportCSV} />);
    const exportBtn = screen.getByTestId('btn-export-csv');
    expect(exportBtn).toBeDefined();
    fireEvent.click(exportBtn);
    expect(onExportCSV).toHaveBeenCalled();
  });

  it('renders Present button when onEnterPresentationMode provided', () => {
    const onPresentationMode = vi.fn();
    render(<ProcessHealthBar {...defaultProps} onEnterPresentationMode={onPresentationMode} />);
    const presentBtn = screen.getByTestId('btn-present');
    expect(presentBtn).toBeDefined();
    fireEvent.click(presentBtn);
    expect(onPresentationMode).toHaveBeenCalled();
  });

  it('does not render when stats is null', () => {
    render(<ProcessHealthBar {...defaultProps} stats={null} />);
    // Bar still renders but stats section is empty
    const bar = screen.getByTestId('process-health-bar');
    expect(bar).toBeDefined();
    expect(bar.textContent).not.toContain('Cpk');
  });

  it('renders column alias for filter chip factor label', () => {
    render(
      <ProcessHealthBar
        {...defaultProps}
        filterChipData={sampleChips}
        columnAliases={{ Machine: 'Machinery' }}
      />
    );
    const bar = screen.getByTestId('process-health-bar');
    expect(bar.textContent).toContain('Machinery');
  });
});
