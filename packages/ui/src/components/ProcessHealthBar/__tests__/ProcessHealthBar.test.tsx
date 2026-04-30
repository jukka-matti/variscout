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
  return {};
});

import ProcessHealthBar from '../ProcessHealthBar';
import type { ProcessHealthBarProps } from '../types';
import type { FilterChipData } from '../../filterTypes';

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
    availableValues: [
      { value: 'A', count: 25, isSelected: true },
      { value: 'B', count: 20, isSelected: true },
      { value: 'C', count: 10, isSelected: false },
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

  // Single banding rule (target-relative): amber when cpk >= target * 0.75 and < target.
  // For target=1.33 the amber boundary is 0.9975 — value 1.1 is inside the amber band.
  it('renders Cpk color amber when cpk in [target*0.75, target)', () => {
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

  // Single banding rule (target-relative): red when cpk < target * 0.75.
  // For target=1.33 that's < 0.9975 — value 0.8 lands in the red band.
  it('renders Cpk color red when cpk < target * 0.75', () => {
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
    expect(bar.textContent).toContain('n=45');
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

  describe('Cpk target provenance caption', () => {
    it.each([
      ['spec', 'per-spec'],
      ['hub', 'hub default'],
      ['investigation', 'investigation default'],
      ['default', 'default'],
    ] as const)('renders %s caption when cpkTargetSource is %s', (source, label) => {
      render(
        <ProcessHealthBar
          {...defaultProps}
          specs={specsWithLimits}
          stats={{ ...baseStats, cpk: 1.4 }}
          cpkTarget={1.33}
          cpkTargetSource={source}
        />
      );
      const chip = screen.getByTestId('cpk-target-source-chip');
      expect(chip.textContent).toBe(`(${label})`);
    });

    it('does not render the chip when cpkTargetSource is omitted', () => {
      render(
        <ProcessHealthBar
          {...defaultProps}
          specs={specsWithLimits}
          stats={{ ...baseStats, cpk: 1.4 }}
        />
      );
      expect(screen.queryByTestId('cpk-target-source-chip')).toBeNull();
    });
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

  describe('capability mode', () => {
    const capabilityProps: ProcessHealthBarProps = {
      ...defaultProps,
      specs: specsWithLimits,
      stats: { ...baseStats, cpk: 1.45, cp: 1.5 },
      isCapabilityMode: true,
      capabilityStats: {
        subgroupsMeetingTarget: 17,
        totalSubgroups: 20,
      },
    };

    it('shows subgroup target percentage instead of pass rate', () => {
      render(<ProcessHealthBar {...capabilityProps} />);
      const bar = screen.getByTestId('process-health-bar');
      const subgroupEl = screen.getByTestId('subgroup-target-pct');
      expect(subgroupEl.textContent).toContain('85%');
      expect(subgroupEl.textContent).toContain('1.33');
      // Should NOT show "Pass"
      expect(bar.textContent).not.toContain('Pass');
    });

    it('shows subgroup count instead of sample count', () => {
      render(<ProcessHealthBar {...capabilityProps} />);
      const bar = screen.getByTestId('process-health-bar');
      // Should show k (subgroup count label) with totalSubgroups value
      expect(bar.textContent).toContain('k');
      expect(bar.textContent).toContain('20');
    });

    it('still shows Cpk as primary KPI', () => {
      render(<ProcessHealthBar {...capabilityProps} />);
      expect(screen.getByTestId('stat-cpk')).toBeDefined();
      const cpkBtn = screen.getByTestId('stat-cpk');
      expect(cpkBtn.textContent).toContain('1.45');
    });

    it('uses custom cpkTarget in subgroup label', () => {
      render(<ProcessHealthBar {...capabilityProps} cpkTarget={1.67} />);
      const subgroupEl = screen.getByTestId('subgroup-target-pct');
      expect(subgroupEl.textContent).toContain('1.67');
    });

    it('falls back to pass rate when capabilityStats is undefined', () => {
      render(
        <ProcessHealthBar
          {...capabilityProps}
          capabilityStats={undefined}
          isCapabilityMode={true}
        />
      );
      const bar = screen.getByTestId('process-health-bar');
      expect(bar.textContent).toContain('Pass');
      expect(bar.textContent).toContain('95.0%');
    });
  });

  describe('Cpk target inline editor', () => {
    const editableProps: ProcessHealthBarProps = {
      ...defaultProps,
      specs: specsWithLimits,
      stats: { ...baseStats, cpk: 1.45 },
      cpkTarget: 1.33,
    };

    it('renders the inline edit button when onCpkTargetCommit is provided', () => {
      render(<ProcessHealthBar {...editableProps} onCpkTargetCommit={vi.fn()} />);
      expect(screen.getByTestId('cpk-target-btn')).toBeDefined();
    });

    it('renders a static target when onCpkTargetCommit is not provided', () => {
      render(<ProcessHealthBar {...editableProps} />);
      expect(screen.queryByTestId('cpk-target-btn')).toBeNull();
    });

    it('calls onCpkTargetCommit with parsed value on Enter', () => {
      const onCpkTargetCommit = vi.fn();
      render(<ProcessHealthBar {...editableProps} onCpkTargetCommit={onCpkTargetCommit} />);
      fireEvent.click(screen.getByTestId('cpk-target-btn'));
      const input = screen.getByTestId('cpk-target-input');
      fireEvent.change(input, { target: { value: '1.67' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onCpkTargetCommit).toHaveBeenCalledWith(1.67);
    });
  });

  describe('column label chip', () => {
    it('renders the chip when columnLabel is provided', () => {
      render(
        <ProcessHealthBar
          {...defaultProps}
          specs={specsWithLimits}
          stats={{ ...baseStats, cpk: 1.4 }}
          cpkTarget={1.33}
          columnLabel="Diameter"
        />
      );
      const chip = screen.getByTestId('cpk-target-column-chip');
      expect(chip.textContent).toContain('Diameter');
    });

    it('does not render the chip when columnLabel is omitted', () => {
      render(
        <ProcessHealthBar
          {...defaultProps}
          specs={specsWithLimits}
          stats={{ ...baseStats, cpk: 1.4 }}
          cpkTarget={1.33}
        />
      );
      expect(screen.queryByTestId('cpk-target-column-chip')).toBeNull();
    });
  });
});
