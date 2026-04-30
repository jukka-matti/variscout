import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineWindowPicker } from '../TimelineWindowPicker';

describe('TimelineWindowPicker', () => {
  it('renders the four window-type chips', () => {
    render(<TimelineWindowPicker window={{ kind: 'cumulative' }} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /fixed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rolling/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open-ended/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cumulative/i })).toBeInTheDocument();
  });

  it('calls onChange when clicking a chip', () => {
    const onChange = vi.fn();
    render(<TimelineWindowPicker window={{ kind: 'cumulative' }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /rolling/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ kind: 'rolling' }));
  });

  it('renders the days input when window.kind is rolling', () => {
    render(
      <TimelineWindowPicker window={{ kind: 'rolling', windowDays: 7 }} onChange={() => {}} />
    );
    expect(screen.getByDisplayValue('7')).toBeInTheDocument();
  });
});
