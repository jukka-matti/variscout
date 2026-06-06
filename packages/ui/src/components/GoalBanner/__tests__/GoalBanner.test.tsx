// packages/ui/src/components/GoalBanner/__tests__/GoalBanner.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GoalBanner } from '../GoalBanner';

describe('GoalBanner', () => {
  it('renders the process goal narrative', () => {
    render(<GoalBanner goal="We mold barrels for medical customers." />);
    expect(screen.getByTestId('goal-banner')).toHaveTextContent('We mold barrels');
  });

  it('does not render when goal is empty AND not editable', () => {
    const { container } = render(<GoalBanner goal="" />);
    expect(container.firstChild).toBeNull();
  });

  it('click-to-edit opens textarea; Save fires onChange with new value', () => {
    const onChange = vi.fn();
    render(<GoalBanner goal="Old text" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('goal-banner'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New text' } });
    fireEvent.click(screen.getByText(/save/i));
    expect(onChange).toHaveBeenCalledWith('New text');
  });

  it('Cancel reverts to original text', () => {
    const onChange = vi.fn();
    render(<GoalBanner goal="Old text" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('goal-banner'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Discarded' } });
    fireEvent.click(screen.getByText(/cancel/i));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Save with empty draft does NOT invoke onChange and banner stays in edit mode', () => {
    const onChange = vi.fn();
    render(<GoalBanner goal="Old text" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('goal-banner'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    fireEvent.click(screen.getByText(/save/i));
    // onChange must not fire
    expect(onChange).not.toHaveBeenCalled();
    // Still in edit mode — textarea still present
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  // FSJ-2 (spec §3): opt-in ceremony entry — goal narrative relocated off the
  // paste path. These three tests cover the new startPrompt prop behaviour.

  it('renders the opt-in prompt when no goal exists and startPrompt is given (FSJ-2 relocation)', () => {
    render(<GoalBanner goal="" startPrompt="Set a process goal…" onChange={vi.fn()} />);
    expect(screen.getByText(/Set a process goal/)).toBeInTheDocument();
  });

  it('clicking the prompt opens the editor; saving fires onChange', async () => {
    const onChange = vi.fn();
    render(<GoalBanner goal="" startPrompt="Set a process goal…" onChange={onChange} />);
    await userEvent.click(screen.getByText(/Set a process goal/));
    await userEvent.type(screen.getByRole('textbox'), 'Reduce cycle time');
    await userEvent.click(screen.getByText('Save'));
    expect(onChange).toHaveBeenCalledWith('Reduce cycle time');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('still renders nothing when empty without startPrompt (Azure parity — negative control)', () => {
    const { container } = render(<GoalBanner goal="" onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
