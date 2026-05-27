import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTestFactorControl } from '../../../../../test-utils/factorControl';
import { FactorSpecsPopover } from '../FactorSpecsPopover';

describe('FactorSpecsPopover', () => {
  const steps = [
    { id: 's-mix', name: 'Mix' },
    { id: 's-bake', name: 'Bake' },
  ];
  const baseProps = {
    control: createTestFactorControl(),
    anchor: { x: 100, y: 200 },
    steps,
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders fixed-positioned popover at anchor', () => {
    render(<FactorSpecsPopover {...baseProps} />);
    const popover = screen.getByRole('dialog');
    expect(popover).toHaveStyle({ position: 'fixed', left: '100px', top: '200px' });
  });

  it('renders targetCondition input + step-binding select', () => {
    render(<FactorSpecsPopover {...baseProps} />);
    expect(screen.getByLabelText(/target condition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/step binding/i)).toBeInTheDocument();
  });

  it('step select shows global option + each step', () => {
    render(<FactorSpecsPopover {...baseProps} />);
    expect(screen.getByRole('option', { name: /global \(no step binding\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /^mix/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /^bake/i })).toBeInTheDocument();
  });

  it('Escape fires onClose', () => {
    const onClose = vi.fn();
    render(<FactorSpecsPopover {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click fires onClose', () => {
    const onClose = vi.fn();
    render(<FactorSpecsPopover {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('factor-specs-popover-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Apply fires onApply with edited values', () => {
    const onApply = vi.fn();
    render(<FactorSpecsPopover {...baseProps} onApply={onApply} />);
    fireEvent.change(screen.getByLabelText(/target condition/i), {
      target: { value: 'New condition' },
    });
    fireEvent.change(screen.getByLabelText(/step binding/i), { target: { value: 's-bake' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        targetCondition: 'New condition',
        stepId: 's-bake',
      })
    );
  });

  it('Apply with global selection clears stepId (undefined)', () => {
    const onApply = vi.fn();
    render(
      <FactorSpecsPopover
        {...baseProps}
        control={createTestFactorControl({ stepId: 's-mix' })}
        onApply={onApply}
      />
    );
    fireEvent.change(screen.getByLabelText(/step binding/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ stepId: undefined }));
  });
});
