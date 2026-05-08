import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HypothesisDraftPopover } from '../HypothesisDraftPopover';

const baseProps = {
  sourceLabel: 'pressure_psi',
  targetLabel: 'yield',
  releaseAt: { x: 100, y: 200 },
  questions: [],
  onSave: () => undefined,
  onCancel: () => undefined,
};

describe('HypothesisDraftPopover', () => {
  it('renders source and target labels as read-only context', () => {
    render(<HypothesisDraftPopover {...baseProps} />);

    expect(screen.getByText('pressure_psi')).toBeInTheDocument();
    expect(screen.getByText('yield')).toBeInTheDocument();
  });

  it('saves the because statement and optional question', () => {
    const onSave = vi.fn();
    render(
      <HypothesisDraftPopover
        {...baseProps}
        questions={[{ id: 'q1', text: 'Why does yield drop?' }]}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/because/i), {
      target: { value: 'thermal drift in the chamber' },
    });
    fireEvent.change(screen.getByLabelText(/link to question/i), { target: { value: 'q1' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith({
      whyStatement: 'thermal drift in the chamber',
      questionId: 'q1',
    });
  });

  it('saves undefined questionId when no question is selected', () => {
    const onSave = vi.fn();
    render(<HypothesisDraftPopover {...baseProps} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/because/i), { target: { value: 'shift change' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith({
      whyStatement: 'shift change',
      questionId: undefined,
    });
  });

  it('disables Save for empty statements', () => {
    render(<HypothesisDraftPopover {...baseProps} />);

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/because/i), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/because/i), { target: { value: 'real text' } });
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });

  it('cancels by button and Escape', () => {
    const onCancel = vi.fn();
    render(<HypothesisDraftPopover {...baseProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.keyDown(screen.getByTestId('hypothesis-draft-popover'), { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('positions itself relative to release point', () => {
    render(<HypothesisDraftPopover {...baseProps} releaseAt={{ x: 250, y: 350 }} />);

    expect(screen.getByTestId('hypothesis-draft-popover').style.left).toMatch(/px$/);
    expect(screen.getByTestId('hypothesis-draft-popover').style.top).toMatch(/px$/);
  });
});
