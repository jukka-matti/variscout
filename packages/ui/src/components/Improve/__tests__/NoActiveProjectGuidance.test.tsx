import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NoActiveProjectGuidance } from '../NoActiveProjectGuidance';

describe('NoActiveProjectGuidance', () => {
  it('renders the "No active project" heading + body copy', () => {
    render(<NoActiveProjectGuidance onGoHome={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no active project/i })).toBeInTheDocument();
    expect(
      screen.getByText(/improvement work happens inside a chartered project/i)
    ).toBeInTheDocument();
  });

  it('renders a "Go to Home" button', () => {
    render(<NoActiveProjectGuidance onGoHome={() => {}} />);
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
  });

  it('calls onGoHome when the button is clicked', () => {
    const onGoHome = vi.fn();
    render(<NoActiveProjectGuidance onGoHome={onGoHome} />);
    fireEvent.click(screen.getByRole('button', { name: /go to home/i }));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
