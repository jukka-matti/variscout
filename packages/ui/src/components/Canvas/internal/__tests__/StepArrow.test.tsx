import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepArrow } from '../StepArrow';

describe('StepArrow', () => {
  it('renders a directed connection with a disconnect affordance', () => {
    const onDisconnect = vi.fn();

    render(
      <StepArrow
        arrow={{ id: 'arrow-1', fromStepId: 'step-a', toStepId: 'step-b' }}
        fromLabel="Mix"
        toLabel="Fill"
        onDisconnect={onDisconnect}
      />
    );

    expect(screen.getByTestId('process-map-explicit-arrow-arrow-1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /disconnect Mix to Fill/i }));

    expect(onDisconnect).toHaveBeenCalledWith('step-a', 'step-b');
  });
});
