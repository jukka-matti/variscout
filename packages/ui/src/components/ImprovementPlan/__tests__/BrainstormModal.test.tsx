import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrainstormModal } from '../BrainstormModal';
import type { BrainstormIdea } from '@variscout/core/findings';

describe('BrainstormModal', () => {
  const defaultProps = {
    isOpen: true,
    causeName: 'Shift (Night)',
    evidence: { rSquaredAdj: 0.34 },
    hmwPrompts: {
      prevent: 'How might we prevent Shift (Night) from causing variation?',
      detect: 'How might we detect Shift (Night) problems before defects?',
      simplify: 'How might we simplify the Shift (Night) process?',
      eliminate: 'How might we eliminate the Shift (Night) dependency?',
    },
    ideas: [] as BrainstormIdea[],
    onAddIdea: vi.fn(),
    onEditIdea: vi.fn(),
    onRemoveIdea: vi.fn(),
    onSelectIdea: vi.fn(),
    onClose: vi.fn(),
    onDone: vi.fn(),
  };

  it('renders all 4 HMW quadrants when open', () => {
    render(<BrainstormModal {...defaultProps} />);
    expect(screen.getByText('Prevent')).toBeInTheDocument();
    expect(screen.getByText('Detect')).toBeInTheDocument();
    expect(screen.getByText('Simplify')).toBeInTheDocument();
    expect(screen.getByText('Eliminate')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<BrainstormModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Prevent')).not.toBeInTheDocument();
  });

  it('shows cause name and evidence in header', () => {
    render(<BrainstormModal {...defaultProps} />);
    // cause name appears in header and HMW prompts; check at least one instance
    expect(screen.getAllByText(/Shift \(Night\)/).length).toBeGreaterThan(0);
    expect(screen.getByText(/34%/)).toBeInTheDocument();
  });

  it('transitions to select step when Done clicked', () => {
    const ideas: BrainstormIdea[] = [
      { id: '1', text: 'Test idea', direction: 'prevent', aiGenerated: false, voteCount: 0 },
    ];
    render(<BrainstormModal {...defaultProps} ideas={ideas} />);
    fireEvent.click(screen.getByText(/Done brainstorming/));
    // In select mode, ideas should be shown as selectable items
    expect(screen.getByText('Test idea')).toBeInTheDocument();
  });

  it('calls onDone with selected ideas when Add to plan clicked', () => {
    const ideas: BrainstormIdea[] = [
      { id: '1', text: 'Test idea', direction: 'prevent', aiGenerated: false, voteCount: 0 },
    ];
    const onDone = vi.fn();
    render(<BrainstormModal {...defaultProps} ideas={ideas} onDone={onDone} />);
    // Move to select step
    fireEvent.click(screen.getByText(/Done brainstorming/));
    // Select the idea (click the idea row)
    fireEvent.click(screen.getByText('Test idea'));
    // Add to plan
    fireEvent.click(screen.getByText(/Add.*to plan/));
    expect(onDone).toHaveBeenCalledWith(['1']);
  });
});
