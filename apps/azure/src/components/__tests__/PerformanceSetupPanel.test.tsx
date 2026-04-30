/**
 * Tests for the Azure PerformanceSetupPanel wrapper.
 *
 * Task E (Cpk follow-up): wrapper translates the Base's `cpkTargetPerChannel` map
 * into one `setMeasureSpec(column, { cpkTarget })` call per selected channel,
 * replacing the legacy project-wide `setCpkTarget` write.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// vi.mock() must come BEFORE component imports.
const setMeasureColumns = vi.fn();
const setMeasureLabel = vi.fn();
const setAnalysisMode = vi.fn();
const setMeasureSpec = vi.fn();
const setCpkTarget = vi.fn();

vi.mock('@variscout/stores', () => ({
  useProjectStore: (selector: (state: unknown) => unknown) =>
    selector({
      rawData: [{ Valve_1: 1, Valve_2: 2, Valve_3: 3 }],
      specs: { usl: 11, lsl: 9 },
      measureColumns: [],
      measureLabel: 'Measure',
      cpkTarget: 1.33,
      setMeasureColumns,
      setMeasureLabel,
      setAnalysisMode,
      setMeasureSpec,
      setCpkTarget,
    }),
}));

vi.mock('@variscout/hooks', () => ({
  useTier: () => ({
    tier: 'team',
    maxChannels: 100,
    upgradeUrl: 'https://example.com/upgrade',
    validateChannels: (count: number) => ({ exceeded: false, current: count, max: 100 }),
  }),
}));

vi.mock('@variscout/core', () => ({
  detectChannelColumns: () => [
    { id: 'Valve_1', label: 'Valve 1', n: 1, matchedPattern: true },
    { id: 'Valve_2', label: 'Valve 2', n: 1, matchedPattern: true },
    { id: 'Valve_3', label: 'Valve 3', n: 1, matchedPattern: true },
  ],
}));

// Capture the onEnable prop the wrapper passes into the Base, then drive it from tests.
let capturedOnEnable:
  | ((columns: string[], label: string, cpkTargetPerChannel: Record<string, number>) => void)
  | null = null;

vi.mock('@variscout/ui', () => ({
  PerformanceSetupPanelBase: (props: {
    onEnable: (
      columns: string[],
      label: string,
      cpkTargetPerChannel: Record<string, number>
    ) => void;
  }) => {
    capturedOnEnable = props.onEnable;
    return <div data-testid="perf-setup-base" />;
  },
  performanceSetupPanelDefaultColorScheme: {},
}));

import PerformanceSetupPanel from '../PerformanceSetupPanel';

describe('PerformanceSetupPanel (Azure wrapper)', () => {
  beforeEach(() => {
    setMeasureColumns.mockClear();
    setMeasureLabel.mockClear();
    setAnalysisMode.mockClear();
    setMeasureSpec.mockClear();
    setCpkTarget.mockClear();
    capturedOnEnable = null;
  });

  it('writes setMeasureSpec once per selected channel and never calls setCpkTarget', () => {
    render(<PerformanceSetupPanel />);
    expect(capturedOnEnable).not.toBeNull();

    capturedOnEnable!(['Valve_1', 'Valve_2', 'Valve_3'], 'Valve', {
      Valve_1: 1.67,
      Valve_2: 1.67,
      Valve_3: 1.67,
    });

    expect(setMeasureColumns).toHaveBeenCalledWith(['Valve_1', 'Valve_2', 'Valve_3']);
    expect(setMeasureLabel).toHaveBeenCalledWith('Valve');
    expect(setAnalysisMode).toHaveBeenCalledWith('performance');

    expect(setMeasureSpec).toHaveBeenCalledTimes(3);
    expect(setMeasureSpec).toHaveBeenNthCalledWith(1, 'Valve_1', { cpkTarget: 1.67 });
    expect(setMeasureSpec).toHaveBeenNthCalledWith(2, 'Valve_2', { cpkTarget: 1.67 });
    expect(setMeasureSpec).toHaveBeenNthCalledWith(3, 'Valve_3', { cpkTarget: 1.67 });

    expect(setCpkTarget).not.toHaveBeenCalled();
  });

  it('defers to caller-provided onEnable without writing to store', () => {
    const callerOnEnable = vi.fn();
    render(<PerformanceSetupPanel onEnable={callerOnEnable} />);

    capturedOnEnable!(['Valve_1'], 'Valve', { Valve_1: 1.5 });

    expect(callerOnEnable).toHaveBeenCalledWith(['Valve_1'], 'Valve');
    expect(setMeasureSpec).not.toHaveBeenCalled();
    expect(setCpkTarget).not.toHaveBeenCalled();
    expect(setAnalysisMode).not.toHaveBeenCalled();
  });
});
