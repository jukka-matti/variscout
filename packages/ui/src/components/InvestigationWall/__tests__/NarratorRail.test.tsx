import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NarratorRail } from '../NarratorRail';
import type { NarratorMessage } from '../NarratorRail';

const m1: NarratorMessage = {
  id: 'm1',
  kind: 'coscout',
  text: 'H1 has no disconfirmation attempted.',
  timestamp: 1,
};

describe('NarratorRail', () => {
  it('renders messages when open', () => {
    render(<NarratorRail messages={[m1]} isOpen />);
    expect(screen.getByText(/disconfirmation/i)).toBeInTheDocument();
  });

  it('renders empty state when no messages', () => {
    render(<NarratorRail messages={[]} isOpen />);
    expect(screen.getByText(/no suggestions yet/i)).toBeInTheDocument();
  });

  it('shows collapsed toggle when closed', () => {
    render(<NarratorRail messages={[]} isOpen={false} />);
    expect(screen.getByRole('button', { name: /open narrator rail/i })).toBeInTheDocument();
  });

  it('calls onToggle when close button clicked', () => {
    const onToggle = vi.fn();
    render(<NarratorRail messages={[]} isOpen onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: /close narrator rail/i }));
    expect(onToggle).toHaveBeenCalled();
  });
});
