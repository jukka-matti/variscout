import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText('Step 1: What are you measuring?')).toBeTruthy();
    expect(screen.getByText('Outcome (Y)')).toBeTruthy();
    expect(screen.getByText('Factors (X)')).toBeTruthy();
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
    expect(screen.queryByText('Step 1: What are you measuring?')).toBeNull();
  });

  it('renders performance mode toggle when enablePerformanceMode is true', () => {
    render(<ManualEntryBase {...defaultProps} enablePerformanceMode={true} />);

    expect(screen.getByText('Analysis Mode')).toBeTruthy();
    expect(screen.getByText('Standard Analysis')).toBeTruthy();
    expect(screen.getByText('Performance Mode')).toBeTruthy();
  });

  it('does not show performance mode toggle when enablePerformanceMode is false', () => {
    render(<ManualEntryBase {...defaultProps} enablePerformanceMode={false} />);

    expect(screen.queryByText('Analysis Mode')).toBeNull();
    expect(screen.queryByText('Performance Mode')).toBeNull();
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
    expect(screen.getByText('Step 1: What are you measuring?')).toBeTruthy();
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
