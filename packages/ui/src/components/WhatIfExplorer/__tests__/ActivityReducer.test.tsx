import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityReducer from '../ActivityReducer';
import type { ActivityReducerProps } from '../types';

// Mock @variscout/core — ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_ORDER
vi.mock('@variscout/core', () => ({
  ACTIVITY_TYPE_COLORS: {
    va: '#22c55e',
    'nva-required': '#f59e0b',
    waste: '#ef4444',
    wait: '#94a3b8',
  },
  ACTIVITY_TYPE_LABELS: {
    va: 'Value-Adding',
    'nva-required': 'NVA Required',
    waste: 'Waste',
    wait: 'Wait',
  },
  ACTIVITY_TYPE_ORDER: ['va', 'nva-required', 'waste', 'wait'],
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
    formatValue,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    formatValue?: (v: number) => string;
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
      {formatValue && <span data-testid={`slider-value-${label}`}>{formatValue(value)}</span>}
    </div>
  ),
}));

// Sample activities (3 bars, each with some segments)
const makeActivities = (): ActivityReducerProps['activities'] => [
  {
    key: 'Welding',
    totalTime: 60,
    segments: [
      { activityType: 'va', totalTime: 30, percentage: 50, count: 5 },
      { activityType: 'waste', totalTime: 20, percentage: 33, count: 3 },
      { activityType: 'wait', totalTime: 10, percentage: 17, count: 2 },
    ],
  },
  {
    key: 'Assembly',
    totalTime: 40,
    segments: [
      { activityType: 'va', totalTime: 25, percentage: 62.5, count: 4 },
      { activityType: 'nva-required', totalTime: 15, percentage: 37.5, count: 3 },
    ],
  },
];

describe('ActivityReducer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component', () => {
    render(<ActivityReducer activities={makeActivities()} />);
    expect(screen.getByTestId('activity-reducer')).toBeDefined();
  });

  it('renders activity selector', () => {
    render(<ActivityReducer activities={makeActivities()} />);
    expect(screen.getByTestId('activity-selector')).toBeDefined();
  });

  it('populates selector with activities, waste first', () => {
    render(<ActivityReducer activities={makeActivities()} />);
    const select = screen.getByTestId('activity-selector') as HTMLSelectElement;
    const options = Array.from(select.options).map(o => o.text);
    // Waste should appear before VA
    const wasteIdx = options.findIndex(t => t.includes('Waste'));
    const vaIdx = options.findIndex(t => t.includes('Value-Adding'));
    expect(wasteIdx).toBeGreaterThanOrEqual(0);
    expect(vaIdx).toBeGreaterThanOrEqual(0);
    expect(wasteIdx).toBeLessThan(vaIdx);
  });

  it('renders reduction slider when an activity is selected', () => {
    render(<ActivityReducer activities={makeActivities()} />);
    expect(screen.getByTestId('slider-Reduce activity time')).toBeDefined();
  });

  it('renders preset buttons (Eliminate, Halve)', () => {
    render(<ActivityReducer activities={makeActivities()} />);
    expect(screen.getByTestId('preset-eliminate')).toBeDefined();
    expect(screen.getByTestId('preset-halve')).toBeDefined();
  });

  it('renders projection panel', () => {
    render(<ActivityReducer activities={makeActivities()} />);
    expect(screen.getByTestId('projection-panel')).toBeDefined();
  });

  it('shows takt compliance when taktTime provided', () => {
    render(<ActivityReducer activities={makeActivities()} taktTime={80} />);
    // Total cycle time is 100; takt is 80 — should show exceeds
    expect(screen.getByText(/Takt/)).toBeDefined();
  });

  it('shows Reach takt preset when taktTime provided and CT > takt', () => {
    render(<ActivityReducer activities={makeActivities()} taktTime={80} />);
    expect(screen.getByTestId('preset-reach-takt')).toBeDefined();
  });

  it('does not show Reach takt preset when CT <= taktTime', () => {
    render(<ActivityReducer activities={makeActivities()} taktTime={200} />);
    expect(screen.queryByTestId('preset-reach-takt')).toBeNull();
  });

  it('shows Match best preset when bestReference provided with lower time than current CT', () => {
    render(
      <ActivityReducer activities={makeActivities()} bestReference={{ name: 'Line B', time: 50 }} />
    );
    expect(screen.getByTestId('preset-match-best')).toBeDefined();
  });

  it('does not show save button when onSaveProjection not provided', () => {
    render(<ActivityReducer activities={makeActivities()} />);
    expect(screen.queryByTestId('save-projection-button')).toBeNull();
  });

  it('renders save button when onSaveProjection provided', () => {
    render(<ActivityReducer activities={makeActivities()} onSaveProjection={vi.fn()} />);
    expect(screen.getByTestId('save-projection-button')).toBeDefined();
  });

  it('save button is disabled when no adjustment', () => {
    render(<ActivityReducer activities={makeActivities()} onSaveProjection={vi.fn()} />);
    const btn = screen.getByTestId('save-projection-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('applying Eliminate preset makes save button active', () => {
    const onSave = vi.fn();
    render(<ActivityReducer activities={makeActivities()} onSaveProjection={onSave} />);
    fireEvent.click(screen.getByTestId('preset-eliminate'));
    const btn = screen.getByTestId('save-projection-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('calls onSaveProjection with a FindingProjection when save clicked after adjustment', () => {
    const onSave = vi.fn();
    render(<ActivityReducer activities={makeActivities()} onSaveProjection={onSave} />);
    fireEvent.click(screen.getByTestId('preset-eliminate'));
    fireEvent.click(screen.getByTestId('save-projection-button'));
    expect(onSave).toHaveBeenCalledTimes(1);
    const [proj] = onSave.mock.calls[0];
    expect(proj.baselineMean).toBeTypeOf('number');
    expect(proj.projectedMean).toBeTypeOf('number');
    expect(proj.createdAt).toMatch(/^\d{4}-/);
    // Eliminate should reduce projected CT
    expect(proj.projectedMean).toBeLessThan(proj.baselineMean);
  });

  it('calls onProjectionChange on initial render', () => {
    const onChange = vi.fn();
    render(<ActivityReducer activities={makeActivities()} onProjectionChange={onChange} />);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('switching activity resets reduction to 0', () => {
    render(<ActivityReducer activities={makeActivities()} onSaveProjection={vi.fn()} />);
    // Apply Eliminate preset
    fireEvent.click(screen.getByTestId('preset-eliminate'));
    // Save button should be active
    const btn = screen.getByTestId('save-projection-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);

    // Change activity selection
    const select = screen.getByTestId('activity-selector') as HTMLSelectElement;
    const nextValue =
      select.options[1].value !== select.value ? select.options[1].value : select.options[0].value;
    fireEvent.change(select, { target: { value: nextValue } });

    // Save button should be disabled again (reduction reset)
    expect(btn.disabled).toBe(true);
  });

  it('Reset button appears after adjustment and resets state', () => {
    render(<ActivityReducer activities={makeActivities()} />);
    expect(screen.queryByTitle('Reset adjustment')).toBeNull();
    fireEvent.click(screen.getByTestId('preset-halve'));
    expect(screen.getByTitle('Reset adjustment')).toBeDefined();
    fireEvent.click(screen.getByTitle('Reset adjustment'));
    expect(screen.queryByTitle('Reset adjustment')).toBeNull();
  });

  it('renders correctly with empty activities array', () => {
    render(<ActivityReducer activities={[]} />);
    expect(screen.getByTestId('activity-reducer')).toBeDefined();
  });
});
