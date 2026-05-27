import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTestOutcomeSpec } from '../../../../../test-utils/outcomeSpec';
import { OutcomeSpecsPopover } from '../OutcomeSpecsPopover';

describe('OutcomeSpecsPopover', () => {
  const baseProps = {
    spec: createTestOutcomeSpec(),
    anchor: { x: 120, y: 200 },
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders fixed-positioned popover anchored at given coordinates', () => {
    render(<OutcomeSpecsPopover {...baseProps} />);
    const popover = screen.getByRole('dialog');
    expect(popover).toHaveStyle({ position: 'fixed', left: '120px', top: '200px' });
  });

  it('renders all 4 spec inputs + characteristicType radio group', () => {
    render(<OutcomeSpecsPopover {...baseProps} />);
    expect(screen.getByLabelText(/^target$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^LSL$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^USL$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cpk target/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nominal is best/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Smaller is better/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Larger is better/i)).toBeInTheDocument();
  });

  it('LSL input disabled when characteristicType is smallerIsBetter', () => {
    render(
      <OutcomeSpecsPopover
        {...baseProps}
        spec={createTestOutcomeSpec({ characteristicType: 'smallerIsBetter' })}
      />
    );
    expect(screen.getByLabelText(/^LSL$/i)).toBeDisabled();
    expect(screen.getByLabelText(/^USL$/i)).not.toBeDisabled();
  });

  it('USL input disabled when characteristicType is largerIsBetter', () => {
    render(
      <OutcomeSpecsPopover
        {...baseProps}
        spec={createTestOutcomeSpec({ characteristicType: 'largerIsBetter' })}
      />
    );
    expect(screen.getByLabelText(/^USL$/i)).toBeDisabled();
    expect(screen.getByLabelText(/^LSL$/i)).not.toBeDisabled();
  });

  it('Escape key fires onClose', () => {
    const onClose = vi.fn();
    render(<OutcomeSpecsPopover {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click fires onClose', () => {
    const onClose = vi.fn();
    render(<OutcomeSpecsPopover {...baseProps} onClose={onClose} />);
    const backdrop = screen.getByTestId('specs-popover-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Apply button fires onApply with edited values', () => {
    const onApply = vi.fn();
    render(<OutcomeSpecsPopover {...baseProps} onApply={onApply} />);
    fireEvent.change(screen.getByLabelText(/^target$/i), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ target: 42 }));
  });
});
