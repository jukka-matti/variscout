import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock WhatIfExplorer before importing component under test
vi.mock('../WhatIfExplorer', () => ({
  WhatIfExplorer: (props: Record<string, unknown>) => (
    <div
      data-testid="mock-whatif-explorer"
      data-mode={props.mode}
      data-has-presets={props.presets != null ? 'true' : 'false'}
      data-has-complement={props.complementStats != null ? 'true' : 'false'}
      data-current-mean={
        (props.currentStats as { mean: number } | undefined)?.mean?.toString() ?? ''
      }
    >
      WhatIfExplorer
    </div>
  ),
}));

// Mock useTranslation
vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    formatStat: (v: number, d?: number) => (Number.isFinite(v) ? v.toFixed(d ?? 2) : '—'),
    t: (key: string) => key,
  }),
}));

// Mock computePresets from WhatIfPageBase
vi.mock('../../WhatIfPage/WhatIfPageBase', () => ({
  computePresets: vi.fn(() => [
    {
      label: 'Shift to target',
      description: 'Move to target',
      meanShift: 2,
      variationReduction: 0,
    },
  ]),
}));

import { WhatIfExplorerPage } from '../WhatIfExplorerPage';
import type { WhatIfExplorerPageProps } from '../WhatIfExplorerPage';
import type { DataRow, SpecLimits } from '@variscout/core';

// ============================================================================
// Test fixtures
// ============================================================================

function makeRows(values: number[]): DataRow[] {
  return values.map(v => ({ Moisture: v }));
}

const defaultData = makeRows([10, 12, 11, 13, 10, 14, 11, 12, 13, 10]);
const rawData = makeRows([10, 12, 11, 13, 10, 14, 11, 12, 13, 10, 20, 22, 21]);
const specs: SpecLimits = { usl: 18, lsl: 6 };

function renderPage(overrides: Partial<WhatIfExplorerPageProps> = {}) {
  const defaults: WhatIfExplorerPageProps = {
    filteredData: defaultData,
    rawData: rawData,
    outcome: 'Moisture',
    specs,
    onBack: vi.fn(),
    filterCount: 0,
    ...overrides,
  };
  return render(<WhatIfExplorerPage {...defaults} />);
}

// ============================================================================
// Header tests
// ============================================================================

describe('WhatIfExplorerPage — header', () => {
  it('renders back button and outcome name', () => {
    renderPage();
    expect(screen.getByTestId('whatif-back-btn')).toBeInTheDocument();
    expect(screen.getByTestId('whatif-outcome-label')).toHaveTextContent('Moisture');
  });

  it('displays sample count', () => {
    renderPage();
    expect(screen.getByTestId('whatif-sample-count')).toHaveTextContent('n = 10');
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    renderPage({ onBack });
    fireEvent.click(screen.getByTestId('whatif-back-btn'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows filter badges when filters active', () => {
    renderPage({ filterCount: 2, filterNames: ['Machine = A', 'Shift = Day'] });
    expect(screen.getByText('Machine = A, Shift = Day')).toBeInTheDocument();
  });

  it('shows filter count when no filter names provided', () => {
    renderPage({ filterCount: 3 });
    expect(screen.getByText('3 filters')).toBeInTheDocument();
  });
});

// ============================================================================
// Context banner tests
// ============================================================================

describe('WhatIfExplorerPage — projection context banner', () => {
  it('shows projection context banner when projectionContext provided', () => {
    renderPage({
      projectionContext: {
        ideaText: 'Reduce head temperature',
        questionText: 'Why is Head 5 high?',
      },
    });
    const banner = screen.getByTestId('projection-context-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Reduce head temperature');
    expect(banner).toHaveTextContent('Why is Head 5 high?');
  });

  it('does not show projection banner when no context', () => {
    renderPage();
    expect(screen.queryByTestId('projection-context-banner')).not.toBeInTheDocument();
  });
});

describe('WhatIfExplorerPage — reference context banner', () => {
  it('shows reference context when provided', () => {
    renderPage({
      referenceContext: {
        subsetLabel: 'Head 5-8',
        subsetCount: 40,
        subsetCpk: 0.8,
        referenceLabel: 'Head 1-4',
        referenceCount: 60,
        referenceCpk: 1.5,
      },
    });
    const banner = screen.getByTestId('reference-context-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Head 5-8');
    expect(banner).toHaveTextContent('Head 1-4');
    expect(banner).toHaveTextContent('n=40');
    expect(banner).toHaveTextContent('n=60');
  });

  it('does not show reference banner when no context', () => {
    renderPage();
    expect(screen.queryByTestId('reference-context-banner')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Data computation tests
// ============================================================================

describe('WhatIfExplorerPage — data computation', () => {
  it('computes currentStats from filteredData and passes to WhatIfExplorer', () => {
    renderPage();
    const explorer = screen.getByTestId('mock-whatif-explorer');
    expect(explorer).toBeInTheDocument();
    // Mean of [10, 12, 11, 13, 10, 14, 11, 12, 13, 10] = 11.6
    const mean = parseFloat(explorer.getAttribute('data-current-mean') ?? '');
    expect(mean).toBeCloseTo(11.6, 1);
  });

  it('passes presets to WhatIfExplorer', () => {
    renderPage();
    const explorer = screen.getByTestId('mock-whatif-explorer');
    expect(explorer.getAttribute('data-has-presets')).toBe('true');
  });

  it('computes complement stats when filtered is subset of raw', () => {
    renderPage();
    const explorer = screen.getByTestId('mock-whatif-explorer');
    expect(explorer.getAttribute('data-has-complement')).toBe('true');
  });

  it('does not compute complement stats when filtered equals raw', () => {
    renderPage({ rawData: defaultData });
    const explorer = screen.getByTestId('mock-whatif-explorer');
    expect(explorer.getAttribute('data-has-complement')).toBe('false');
  });
});

// ============================================================================
// Empty state tests
// ============================================================================

describe('WhatIfExplorerPage — empty state', () => {
  it('shows empty state when no outcome', () => {
    renderPage({ outcome: null });
    expect(screen.getByText(/Load data and set specification limits/)).toBeInTheDocument();
    expect(screen.queryByTestId('mock-whatif-explorer')).not.toBeInTheDocument();
  });

  it('shows empty state when rawData is empty', () => {
    renderPage({ rawData: [], filteredData: [] });
    expect(screen.getByText(/Load data and set specification limits/)).toBeInTheDocument();
  });
});

// ============================================================================
// Mode passthrough tests
// ============================================================================

describe('WhatIfExplorerPage — mode passthrough', () => {
  it('passes mode to WhatIfExplorer', () => {
    renderPage({ mode: 'performance' });
    const explorer = screen.getByTestId('mock-whatif-explorer');
    expect(explorer.getAttribute('data-mode')).toBe('performance');
  });

  it('defaults to standard mode', () => {
    renderPage();
    const explorer = screen.getByTestId('mock-whatif-explorer');
    expect(explorer.getAttribute('data-mode')).toBe('standard');
  });
});
