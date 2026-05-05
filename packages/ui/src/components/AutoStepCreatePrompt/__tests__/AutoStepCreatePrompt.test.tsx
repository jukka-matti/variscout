import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AutoStepCreatePrompt } from '../index';

describe('AutoStepCreatePrompt', () => {
  it('renders a positioned dialog that names the chip', () => {
    render(
      <AutoStepCreatePrompt
        chipLabel="Cycle time"
        position={{ x: 32, y: 48 }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog', { name: /Create step for Cycle time/i });
    expect(dialog).toHaveTextContent('Cycle time');
    expect(dialog).toHaveStyle({ position: 'absolute', left: '32px', top: '48px' });
  });

  it('calls onConfirm when Create step is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <AutoStepCreatePrompt
        chipLabel="Cycle time"
        position={{ x: 0, y: 0 }}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create step' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel from global Escape and the Cancel button', () => {
    const onCancel = vi.fn();
    render(
      <AutoStepCreatePrompt
        chipLabel="Operator"
        position={{ x: 0, y: 0 }}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
