import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CanvasModeToggle } from '../index';

describe('CanvasModeToggle', () => {
  it('renders a persistent pressed toggle for author mode', () => {
    render(<CanvasModeToggle mode="author" onChange={vi.fn()} />);

    const button = screen.getByRole('button', { name: /lock canvas/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Canvas authoring affordances visible')).toBeInTheDocument();
  });

  it('calls onChange with the opposite mode and announces read mode', () => {
    const onChange = vi.fn();
    render(<CanvasModeToggle mode="author" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /lock canvas/i }));

    expect(onChange).toHaveBeenCalledWith('read');
  });

  it('renders the read-mode affordance as the same persistent button', () => {
    render(<CanvasModeToggle mode="read" onChange={vi.fn()} />);

    const button = screen.getByRole('button', { name: /edit canvas/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Canvas authoring affordances hidden')).toBeInTheDocument();
  });
});
