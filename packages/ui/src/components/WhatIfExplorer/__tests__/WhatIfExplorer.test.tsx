import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock child renderers BEFORE importing the component under test
vi.mock('../BasicEstimator', () => ({
  default: () => <div data-testid="mock-basic-estimator">BasicEstimator</div>,
}));
vi.mock('../ModelInformedEstimator', () => ({
  default: () => <div data-testid="mock-model-informed-estimator">ModelInformedEstimator</div>,
}));
vi.mock('../ActivityReducer', () => ({
  default: () => <div data-testid="mock-activity-reducer">ActivityReducer</div>,
}));
vi.mock('../ChannelAdjuster', () => ({
  default: () => <div data-testid="mock-channel-adjuster">ChannelAdjuster</div>,
}));

import { WhatIfExplorer } from '../WhatIfExplorer';
import type { WhatIfExplorerProps, ModelScope } from '../types';
import type { BestSubsetResult, ChannelResult } from '@variscout/core';
import type { YamazumiBarData } from '@variscout/core/yamazumi';

// ============================================================================
// Test fixtures
// ============================================================================

const baseStats = { mean: 100, stdDev: 5, cpk: 1.2, n: 50 };

/** Minimal BestSubsetResult with required fields only */
function makeModel(rSquaredAdj: number): BestSubsetResult {
  return {
    factors: ['FactorA'],
    factorCount: 1,
    rSquared: rSquaredAdj + 0.03,
    rSquaredAdj,
    fStatistic: 10,
    pValue: 0.01,
    isSignificant: true,
    dfModel: 1,
    levelEffects: new Map(),
    cellMeans: new Map(),
  };
}

const mockModel = makeModel(0.75);
const mockModelWeak = makeModel(0.3);
const mockModelModerate = makeModel(0.55);

const mockActivities: YamazumiBarData[] = [
  {
    key: 'Step 1',
    totalTime: 120,
    segments: [
      { activityType: 'va', totalTime: 60, percentage: 50, count: 10 },
      { activityType: 'waste', totalTime: 60, percentage: 50, count: 10 },
    ],
  },
];

const mockChannels: ChannelResult[] = [
  {
    id: 'ch1',
    label: 'Head 1',
    n: 30,
    mean: 100,
    stdDev: 5,
    cpk: 1.1,
    min: 85,
    max: 115,
    health: 'warning',
    outOfSpecPercentage: 2.5,
    values: [],
  },
  {
    id: 'ch2',
    label: 'Head 2',
    n: 30,
    mean: 102,
    stdDev: 4,
    cpk: 1.4,
    min: 90,
    max: 114,
    health: 'capable',
    outOfSpecPercentage: 0,
    values: [],
  },
];

const mockScope1: ModelScope = {
  id: 'global',
  label: 'All data',
  filters: {},
  n: 100,
  model: mockModel,
  factors: ['FactorA'],
  rSquaredAdj: 0.75,
};

const mockScope2: ModelScope = {
  id: 'filtered-abc',
  label: 'Machine=B',
  filters: { Machine: ['B'] },
  n: 40,
  model: makeModel(0.55),
  factors: ['FactorA'],
  rSquaredAdj: 0.55,
};

function renderExplorer(props: Partial<WhatIfExplorerProps> = {}) {
  return render(<WhatIfExplorer mode="standard" currentStats={baseStats} {...props} />);
}

// ============================================================================
// Mode dispatch tests
// ============================================================================

describe('WhatIfExplorer — mode dispatch', () => {
  it('renders ActivityReducer when mode=yamazumi and activities provided', () => {
    renderExplorer({ mode: 'yamazumi', activities: mockActivities });
    expect(screen.getByTestId('mock-activity-reducer')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-basic-estimator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-channel-adjuster')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-model-informed-estimator')).not.toBeInTheDocument();
  });

  it('renders ChannelAdjuster when mode=performance and channels provided', () => {
    renderExplorer({ mode: 'performance', channels: mockChannels });
    expect(screen.getByTestId('mock-channel-adjuster')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-basic-estimator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-activity-reducer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-model-informed-estimator')).not.toBeInTheDocument();
  });

  it('renders ModelInformedEstimator when model provided in standard mode', () => {
    renderExplorer({ mode: 'standard', model: mockModel });
    expect(screen.getByTestId('mock-model-informed-estimator')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-basic-estimator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-activity-reducer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-channel-adjuster')).not.toBeInTheDocument();
  });

  it('renders BasicEstimator when no model provided in standard mode', () => {
    renderExplorer({ mode: 'standard' });
    expect(screen.getByTestId('mock-basic-estimator')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-model-informed-estimator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-activity-reducer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-channel-adjuster')).not.toBeInTheDocument();
  });

  it('prefers yamazumi renderer over model when mode=yamazumi with both activities and model', () => {
    renderExplorer({ mode: 'yamazumi', activities: mockActivities, model: mockModel });
    expect(screen.getByTestId('mock-activity-reducer')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-model-informed-estimator')).not.toBeInTheDocument();
  });

  it('falls back to BasicEstimator when mode=yamazumi but no activities', () => {
    renderExplorer({ mode: 'yamazumi' });
    expect(screen.getByTestId('mock-basic-estimator')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-activity-reducer')).not.toBeInTheDocument();
  });

  it('falls back to BasicEstimator when mode=performance but no channels', () => {
    renderExplorer({ mode: 'performance' });
    expect(screen.getByTestId('mock-basic-estimator')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-channel-adjuster')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Scope selector tests
// ============================================================================

describe('WhatIfExplorer — scope selector', () => {
  it('does not render scope selector when only one scope available', () => {
    renderExplorer({ availableScopes: [mockScope1] });
    expect(screen.queryByTestId('scope-selector')).not.toBeInTheDocument();
  });

  it('renders scope selector when more than one scope available', () => {
    renderExplorer({ availableScopes: [mockScope1, mockScope2] });
    expect(screen.getByTestId('scope-selector')).toBeInTheDocument();
  });

  it('renders a button for each scope', () => {
    renderExplorer({ availableScopes: [mockScope1, mockScope2] });
    expect(screen.getByTestId('scope-option-global')).toBeInTheDocument();
    expect(screen.getByTestId('scope-option-filtered-abc')).toBeInTheDocument();
  });

  it('calls onScopeChange with the selected scope when a scope button is clicked', () => {
    const onScopeChange = vi.fn();
    renderExplorer({ availableScopes: [mockScope1, mockScope2], onScopeChange });
    fireEvent.click(screen.getByTestId('scope-option-filtered-abc'));
    expect(onScopeChange).toHaveBeenCalledWith(mockScope2);
  });

  it('does not render scope selector when availableScopes is undefined', () => {
    renderExplorer({});
    expect(screen.queryByTestId('scope-selector')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Model quality indicator tests
// ============================================================================

describe('WhatIfExplorer — model quality indicator', () => {
  it('shows trust dots for strong model (R²adj > 0.7)', () => {
    renderExplorer({ model: mockModel }); // rSquaredAdj = 0.75
    const indicator = screen.getByTestId('model-quality-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-green-400');
    expect(indicator.textContent).toContain('●●●○');
  });

  it('shows trust dots for moderate model (R²adj 0.4–0.7)', () => {
    renderExplorer({ model: mockModelModerate }); // rSquaredAdj = 0.55
    const indicator = screen.getByTestId('model-quality-indicator');
    expect(indicator).toHaveClass('text-amber-400');
    expect(indicator.textContent).toContain('●●○○');
  });

  it('shows trust dots for weak model (R²adj < 0.4)', () => {
    renderExplorer({ model: mockModelWeak }); // rSquaredAdj = 0.3
    const indicator = screen.getByTestId('model-quality-indicator');
    expect(indicator).toHaveClass('text-red-400');
    expect(indicator.textContent).toContain('●○○○');
  });

  it('does not show model quality indicator when no model provided', () => {
    renderExplorer({});
    expect(screen.queryByTestId('model-quality-indicator')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Mode badge tests
// ============================================================================

describe('WhatIfExplorer — mode badge', () => {
  it('renders mode badge for standard mode', () => {
    const { container } = renderExplorer({ mode: 'standard' });
    expect(container.textContent).toContain('Standard');
  });

  it('renders mode badge for yamazumi mode', () => {
    const { container } = renderExplorer({ mode: 'yamazumi', activities: mockActivities });
    expect(container.textContent).toContain('Lean / Time Study');
  });

  it('renders mode badge for performance mode', () => {
    const { container } = renderExplorer({ mode: 'performance', channels: mockChannels });
    expect(container.textContent).toContain('Multi-Channel');
  });
});
