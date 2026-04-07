import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChannelAdjuster from '../ChannelAdjuster';
import type { ChannelResult } from '@variscout/core';

// Mock simulateDirectAdjustment from @variscout/core
vi.mock('@variscout/core', () => ({
  simulateDirectAdjustment: vi.fn(
    (
      stats: { mean: number; stdDev: number; cpk?: number },
      adj: { meanShift: number; variationReduction: number },
      specs?: { usl?: number; lsl?: number }
    ) => {
      const projectedMean = stats.mean + adj.meanShift;
      const projectedStdDev = stats.stdDev * (1 - adj.variationReduction);
      let projectedCpk: number | undefined;
      let projectedYield: number | undefined;
      if (specs?.usl !== undefined && specs?.lsl !== undefined && projectedStdDev > 0) {
        projectedCpk = Math.min(
          (specs.usl - projectedMean) / (3 * projectedStdDev),
          (projectedMean - specs.lsl) / (3 * projectedStdDev)
        );
        projectedYield = projectedCpk > 1 ? 99.7 : 95.0;
      } else if (stats.cpk !== undefined) {
        // Simple mock: Cpk improves proportionally
        projectedCpk =
          stats.cpk * (adj.variationReduction > 0 ? 1 / (1 - adj.variationReduction) : 1);
      }
      return {
        projectedMean,
        projectedStdDev,
        projectedCpk,
        projectedYield,
        improvements: {},
      };
    }
  ),
}));

// Mock Slider
vi.mock('../../Slider/Slider', () => ({
  default: ({
    label,
    value,
    onChange,
    min,
    max,
    step,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
  }) => (
    <div data-testid={`slider-${label}`}>
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        aria-label={label}
      />
    </div>
  ),
}));

// Sample channel data — 3 channels with different Cpk values
const makeChannels = (): ChannelResult[] => [
  {
    id: 'ch1',
    label: 'Head 1',
    n: 50,
    mean: 10.0,
    stdDev: 1.0,
    cpk: 1.5,
    cp: 1.6,
    min: 7,
    max: 13,
    health: 'excellent',
    outOfSpecPercentage: 0,
    values: [],
  },
  {
    id: 'ch2',
    label: 'Head 2',
    n: 50,
    mean: 9.5,
    stdDev: 1.5,
    cpk: 0.8,
    cp: 1.0,
    min: 6,
    max: 13,
    health: 'critical',
    outOfSpecPercentage: 5,
    values: [],
  },
  {
    id: 'ch3',
    label: 'Head 3',
    n: 50,
    mean: 10.2,
    stdDev: 1.2,
    cpk: 1.1,
    cp: 1.2,
    min: 7.5,
    max: 13,
    health: 'warning',
    outOfSpecPercentage: 2,
    values: [],
  },
];

const defaultStats = { mean: 9.9, stdDev: 1.2, cpk: 0.8 };
const defaultSpecs = { lsl: 7, usl: 13 };

describe('ChannelAdjuster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component', () => {
    render(<ChannelAdjuster currentStats={defaultStats} channels={makeChannels()} />);
    expect(screen.getByTestId('channel-adjuster')).toBeDefined();
  });

  it('renders channel selector', () => {
    render(<ChannelAdjuster currentStats={defaultStats} channels={makeChannels()} />);
    expect(screen.getByTestId('channel-selector')).toBeDefined();
  });

  it('orders channels worst Cpk first in the selector', () => {
    render(<ChannelAdjuster currentStats={defaultStats} channels={makeChannels()} />);
    const select = screen.getByTestId('channel-selector') as HTMLSelectElement;
    const options = Array.from(select.options);
    // First option should be Head 2 (Cpk 0.80 = worst)
    expect(options[0].text).toContain('Head 2');
    // Last option should be Head 1 (Cpk 1.50 = best)
    expect(options[options.length - 1].text).toContain('Head 1');
  });

  it('renders mean and variation sliders', () => {
    render(<ChannelAdjuster currentStats={defaultStats} channels={makeChannels()} />);
    expect(screen.getByTestId('slider-Adjust mean')).toBeDefined();
    expect(screen.getByTestId('slider-Reduce variation')).toBeDefined();
  });

  it('renders projection panel', () => {
    render(<ChannelAdjuster currentStats={defaultStats} channels={makeChannels()} />);
    expect(screen.getByTestId('projection-panel')).toBeDefined();
  });

  it('shows overall Cpk when channels have Cpk values', () => {
    render(<ChannelAdjuster currentStats={defaultStats} channels={makeChannels()} />);
    expect(screen.getByText('Overall Cpk:')).toBeDefined();
  });

  it('does not render save button when onSaveProjection not provided', () => {
    render(<ChannelAdjuster currentStats={defaultStats} channels={makeChannels()} />);
    expect(screen.queryByTestId('save-projection-button')).toBeNull();
  });

  it('renders save button when onSaveProjection provided', () => {
    render(
      <ChannelAdjuster
        currentStats={defaultStats}
        channels={makeChannels()}
        onSaveProjection={vi.fn()}
      />
    );
    expect(screen.getByTestId('save-projection-button')).toBeDefined();
  });

  it('save button is disabled when no adjustment', () => {
    render(
      <ChannelAdjuster
        currentStats={defaultStats}
        channels={makeChannels()}
        onSaveProjection={vi.fn()}
      />
    );
    const btn = screen.getByTestId('save-projection-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('changing mean slider enables save button', () => {
    render(
      <ChannelAdjuster
        currentStats={defaultStats}
        channels={makeChannels()}
        onSaveProjection={vi.fn()}
      />
    );
    const slider = screen.getByRole('slider', { name: 'Adjust mean' });
    fireEvent.change(slider, { target: { value: '0.5' } });
    const btn = screen.getByTestId('save-projection-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('calls onSaveProjection with FindingProjection when save is clicked', () => {
    const onSave = vi.fn();
    render(
      <ChannelAdjuster
        currentStats={defaultStats}
        channels={makeChannels()}
        onSaveProjection={onSave}
      />
    );
    const slider = screen.getByRole('slider', { name: 'Adjust mean' });
    fireEvent.change(slider, { target: { value: '0.5' } });
    fireEvent.click(screen.getByTestId('save-projection-button'));
    expect(onSave).toHaveBeenCalledTimes(1);
    const [proj] = onSave.mock.calls[0];
    expect(proj.baselineMean).toBeTypeOf('number');
    expect(proj.projectedMean).toBeTypeOf('number');
    expect(proj.simulationParams.meanAdjustment).toBe(0.5);
    expect(proj.createdAt).toMatch(/^\d{4}-/);
  });

  it('calls onProjectionChange on initial render', () => {
    const onChange = vi.fn();
    render(
      <ChannelAdjuster
        currentStats={defaultStats}
        channels={makeChannels()}
        onProjectionChange={onChange}
      />
    );
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('switching channel resets sliders', () => {
    const onSave = vi.fn();
    render(
      <ChannelAdjuster
        currentStats={defaultStats}
        channels={makeChannels()}
        onSaveProjection={onSave}
      />
    );
    // Apply adjustment
    const slider = screen.getByRole('slider', { name: 'Adjust mean' });
    fireEvent.change(slider, { target: { value: '0.5' } });
    const btn = screen.getByTestId('save-projection-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);

    // Switch channel
    const select = screen.getByTestId('channel-selector') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'ch1' } });

    // Save button should be disabled again
    expect(btn.disabled).toBe(true);
  });

  it('Reset button appears after adjustment and resets state', () => {
    render(<ChannelAdjuster currentStats={defaultStats} channels={makeChannels()} />);
    expect(screen.queryByTitle('Reset adjustments')).toBeNull();
    const slider = screen.getByRole('slider', { name: 'Adjust mean' });
    fireEvent.change(slider, { target: { value: '0.5' } });
    expect(screen.getByTitle('Reset adjustments')).toBeDefined();
    fireEvent.click(screen.getByTitle('Reset adjustments'));
    expect(screen.queryByTitle('Reset adjustments')).toBeNull();
  });

  it('renders reference markers when provided', () => {
    const references = [
      { label: 'Best channel', value: 10.5, cpk: 1.8, source: 'empirical' as const },
    ];
    render(
      <ChannelAdjuster
        currentStats={defaultStats}
        channels={makeChannels()}
        references={references}
      />
    );
    expect(screen.getByTestId('reference-markers')).toBeDefined();
    expect(screen.getByText('Best channel')).toBeDefined();
  });

  it('does not render reference markers when none provided', () => {
    render(<ChannelAdjuster currentStats={defaultStats} channels={makeChannels()} />);
    expect(screen.queryByTestId('reference-markers')).toBeNull();
  });

  it('variation reduction slider improves projected Cpk for the selected channel', () => {
    const onSave = vi.fn();
    render(
      <ChannelAdjuster
        currentStats={defaultStats}
        channels={makeChannels()}
        specs={defaultSpecs}
        onSaveProjection={onSave}
      />
    );
    const varSlider = screen.getByRole('slider', { name: 'Reduce variation' });
    fireEvent.change(varSlider, { target: { value: '0.2' } });
    fireEvent.click(screen.getByTestId('save-projection-button'));
    expect(onSave).toHaveBeenCalledTimes(1);
    const [proj] = onSave.mock.calls[0];
    // projectedSigma should be less than baseline sigma
    expect(proj.projectedSigma).toBeLessThan(proj.baselineSigma);
    expect(proj.simulationParams.variationReduction).toBe(0.2);
  });
});
