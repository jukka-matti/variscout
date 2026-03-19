import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@variscout/hooks', () => {
  const catalog: Record<string, string> = {
    'manual.setupTitle': 'Manual Data Entry',
    'manual.analysisMode': 'Analysis mode',
    'manual.standard': 'Standard',
    'manual.standardDesc': 'Single measurement column with optional factors',
    'manual.performance': 'Performance',
    'manual.performanceDesc': 'Multiple measurement channels (fill heads, cavities)',
    'manual.outcome': 'Outcome column',
    'manual.outcomeExample': 'e.g. Weight, Length, Temperature',
    'manual.factors': 'Factors',
    'manual.addFactor': 'Add factor',
    'manual.measureLabel': 'Measure label',
    'manual.measureExample': 'e.g. Fill Head, Cavity, Nozzle',
    'manual.channelCount': 'Number of channels',
    'manual.channelRange': '{min}\u2013{max} channels',
    'manual.startEntry': 'Start Entry',
    'manual.specs': 'Specifications',
    'manual.specsApplyAll': 'Apply to all channels',
    'manual.specsHelper': 'Set specification limits for the outcome column',
    'action.cancel': 'Cancel',
    'error.generic': 'Something went wrong',
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

import ManualEntryBase from '../ManualEntryBase';

// Mock lucide-react icons used by child components
vi.mock('lucide-react', () => ({
  ArrowRight: ({ size }: { size?: number }) => (
    <span data-testid="icon-arrow-right" data-size={size} />
  ),
  Plus: ({ size }: { size?: number }) => <span data-testid="icon-plus" data-size={size} />,
  Trash2: ({ size }: { size?: number }) => <span data-testid="icon-trash" data-size={size} />,
  Play: ({ size, fill }: { size?: number; fill?: string }) => (
    <span data-testid="icon-play" data-size={size} data-fill={fill} />
  ),
  RotateCcw: ({ size }: { size?: number }) => <span data-testid="icon-rotate" data-size={size} />,
  Clipboard: ({ size }: { size?: number }) => (
    <span data-testid="icon-clipboard" data-size={size} />
  ),
}));

describe('ManualEntryBase', () => {
  const defaultProps = {
    onAnalyze: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders setup step initially', () => {
    render(<ManualEntryBase {...defaultProps} />);

    // Setup step should show the heading and outcome/factor labels
    expect(screen.getByText('Manual Data Entry')).toBeTruthy();
    expect(screen.getByText('Outcome column')).toBeTruthy();
    expect(screen.getByText('Factors')).toBeTruthy();
  });

  it('shows default outcome name "Weight"', () => {
    render(<ManualEntryBase {...defaultProps} />);

    const outcomeInput = screen.getByDisplayValue('Weight');
    expect(outcomeInput).toBeTruthy();
    expect(outcomeInput.tagName).toBe('INPUT');
  });

  it('shows default factors "Operator" and "Machine"', () => {
    render(<ManualEntryBase {...defaultProps} />);

    expect(screen.getByDisplayValue('Operator')).toBeTruthy();
    expect(screen.getByDisplayValue('Machine')).toBeTruthy();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ManualEntryBase {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('transitions to grid step when Continue is clicked', () => {
    render(<ManualEntryBase {...defaultProps} />);

    // Click "Start Entry" (the continue button text)
    const continueButton = screen.getByText(/Start Entry/);
    fireEvent.click(continueButton);

    // Grid step should now be visible with "Add Row" and "Manual Entry" heading
    expect(screen.getByText('Add Row')).toBeTruthy();
    expect(screen.getByText('Manual Entry')).toBeTruthy();
    // Setup heading should no longer be visible
    expect(screen.queryByText('Manual Data Entry')).toBeNull();
  });

  it('renders performance mode toggle when enablePerformanceMode is true', () => {
    render(<ManualEntryBase {...defaultProps} enablePerformanceMode={true} />);

    expect(screen.getByText('Analysis mode')).toBeTruthy();
    expect(screen.getByText('Standard')).toBeTruthy();
    expect(screen.getByText('Performance')).toBeTruthy();
  });

  it('does not show performance mode toggle when enablePerformanceMode is false', () => {
    render(<ManualEntryBase {...defaultProps} enablePerformanceMode={false} />);

    expect(screen.queryByText('Analysis mode')).toBeNull();
    expect(screen.queryByText('Performance')).toBeNull();
  });

  it('pre-fills outcome from existingConfig in append mode', () => {
    render(
      <ManualEntryBase
        {...defaultProps}
        appendMode={true}
        existingConfig={{
          outcome: 'Temperature',
          factors: ['Shift', 'Line'],
          specs: { usl: 100, lsl: 50 },
        }}
      />
    );

    expect(screen.getByDisplayValue('Temperature')).toBeTruthy();
    expect(screen.getByDisplayValue('Shift')).toBeTruthy();
    expect(screen.getByDisplayValue('Line')).toBeTruthy();
  });

  it('renders without errors with minimal props', () => {
    const { container } = render(<ManualEntryBase {...defaultProps} />);

    // Component should render some content
    expect(container.innerHTML.length).toBeGreaterThan(0);
    // Setup step should be shown
    expect(screen.getByText('Manual Data Entry')).toBeTruthy();
  });

  it('allows changing spec limit values', () => {
    render(<ManualEntryBase {...defaultProps} />);

    // Find the LSL and USL inputs by their placeholder text
    const lslInput = screen.getByPlaceholderText('Min');
    const uslInput = screen.getByPlaceholderText('Max');

    fireEvent.change(lslInput, { target: { value: '10' } });
    fireEvent.change(uslInput, { target: { value: '50' } });

    expect((lslInput as HTMLInputElement).value).toBe('10');
    expect((uslInput as HTMLInputElement).value).toBe('50');
  });
});
