// packages/ui/src/components/GoalBanner/__tests__/GoalBanner.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
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
});
