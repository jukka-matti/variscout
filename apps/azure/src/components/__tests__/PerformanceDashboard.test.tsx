/**
 * Tests for the PerformanceDashboard wrapper.
 *
 * Task D (Cpk follow-ups): the dashboard now resolves a per-channel
 * `cpkTargets` array via `resolveCpkTarget` and passes it to the chart.
 * Verifies length matches channel count and that per-column overrides win.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// vi.mock() must come BEFORE component imports.
type ProjectStateShape = {
  selectedMeasure: string | null;
  setSelectedMeasure: (id: string | null) => void;
  specs: { usl?: number; lsl?: number };
  setSpecs: (s: { usl?: number; lsl?: number }) => void;
  measureColumns: string[];
  cpkTarget: number | undefined;
  measureSpecs: Record<string, { cpkTarget?: number }>;
};

const projectState: ProjectStateShape = {
  selectedMeasure: null,
  setSelectedMeasure: vi.fn(),
  specs: { usl: 11, lsl: 9 },
  setSpecs: vi.fn(),
  measureColumns: ['A', 'B', 'C'],
  cpkTarget: 1.33,
  measureSpecs: { B: { cpkTarget: 1.67 } },
};

vi.mock('@variscout/stores', () => ({
  useProjectStore: (selector: (state: ProjectStateShape) => unknown) => selector(projectState),
}));

vi.mock('@variscout/hooks', () => ({
  CANVAS_LENS_REGISTRY: {
    default: { id: 'default', label: 'Default', enabled: true, description: '' },
    capability: { id: 'capability', label: 'Capability', enabled: true, description: '' },
    defect: { id: 'defect', label: 'Defect', enabled: true, description: '' },
    performance: { id: 'performance', label: 'Performance', enabled: false, description: '' },
    yamazumi: { id: 'yamazumi', label: 'Yamazumi', enabled: false, description: '' },
  },
  coerceCanvasLens: (value: unknown) =>
    value === 'capability' || value === 'defect' ? value : 'default',
  useCanvasStepCards: () => ({ cards: [] }),
  usePerformanceAnalysis: () => ({
    channels: [
      { id: 'A', label: 'A', n: 30, mean: 10, stdDev: 0.5, cpk: 1.0 },
      { id: 'B', label: 'B', n: 30, mean: 10, stdDev: 0.5, cpk: 1.5 },
      { id: 'C', label: 'C', n: 30, mean: 10, stdDev: 0.5, cpk: 0.8 },
    ],
    summary: {},
  }),
}));

// Capture cpkTargets prop sent to the chart wrapper.
const capturedProps: { cpkTargets?: ReadonlyArray<number> }[] = [];
vi.mock('../charts/PerformanceIChart', () => ({
  __esModule: true,
  default: (props: { cpkTargets?: ReadonlyArray<number> }) => {
    capturedProps.push(props);
    return <div data-testid="performance-i-chart-mock" />;
  },
}));

vi.mock('../charts/PerformanceBoxplot', () => ({
  __esModule: true,
  default: () => <div data-testid="performance-boxplot-mock" />,
}));

vi.mock('../performance/CapabilityMetricToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="metric-toggle-mock" />,
}));

vi.mock('../performance/PerformanceSpecsControls', () => ({
  __esModule: true,
  default: () => <div data-testid="specs-controls-mock" />,
}));

vi.mock('../PerformanceSummary', () => ({
  __esModule: true,
  default: () => <div data-testid="summary-mock" />,
}));

vi.mock('../PerformanceSetupPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="setup-panel-mock" />,
}));

vi.mock('../../hooks/usePerformanceFocus', () => ({
  usePerformanceFocus: () => ({
    focusedChart: null,
    setFocusedChart: vi.fn(),
    handleNextChart: vi.fn(),
    handlePrevChart: vi.fn(),
  }),
}));

vi.mock('../../hooks/useDrillConfirmation', () => ({
  useDrillConfirmation: () => ({
    drillConfirmMeasure: null,
    handleBoxplotClick: vi.fn(),
    handleConfirmDrill: vi.fn(),
    handleCancelDrill: vi.fn(),
  }),
}));

import PerformanceDashboard from '../PerformanceDashboard';

describe('PerformanceDashboard — per-channel cpkTargets', () => {
  beforeEach(() => {
    capturedProps.length = 0;
  });

  it('passes cpkTargets array with one entry per channel via cascade resolution', () => {
    render(<PerformanceDashboard />);
    const last = capturedProps[capturedProps.length - 1];
    expect(last.cpkTargets).toBeDefined();
    expect(last.cpkTargets!.length).toBe(3);
    // A has no per-column override → falls back to projectCpkTarget (1.33)
    // B has measureSpecs override → 1.67
    // C has no per-column override → falls back to projectCpkTarget (1.33)
    expect(last.cpkTargets).toEqual([1.33, 1.67, 1.33]);
  });
});
