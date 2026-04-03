import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoteButton } from '../VoteButton';

describe('VoteButton', () => {
  it('renders vote count', () => {
    render(<VoteButton voteCount={3} votedByMe={false} onToggle={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows pressed state when votedByMe', () => {
    render(<VoteButton voteCount={1} votedByMe={true} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows unpressed state when not votedByMe', () => {
    render(<VoteButton voteCount={0} votedByMe={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<VoteButton voteCount={0} votedByMe={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalled();
  });
});
