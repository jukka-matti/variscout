import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrainstormQuadrant } from '../BrainstormQuadrant';

describe('BrainstormQuadrant', () => {
  const defaultProps = {
    direction: 'prevent' as const,
    hmwPrompt: 'How might we prevent night shift from causing variation?',
    ideas: [
      {
        id: '1',
        text: 'Standardize checklist',
        direction: 'prevent' as const,
        aiGenerated: true,
        voteCount: 0,
      },
    ],
    onAddIdea: vi.fn(),
    onEditIdea: vi.fn(),
    onRemoveIdea: vi.fn(),
  };

  it('renders direction badge and HMW prompt', () => {
    render(<BrainstormQuadrant {...defaultProps} />);
    expect(screen.getByText('Prevent')).toBeInTheDocument();
    expect(screen.getByText(defaultProps.hmwPrompt)).toBeInTheDocument();
  });

  it('renders existing ideas with AI badge', () => {
    render(<BrainstormQuadrant {...defaultProps} />);
    expect(screen.getByText('Standardize checklist')).toBeInTheDocument();
    expect(screen.getByText('✨')).toBeInTheDocument();
  });

  it('calls onAddIdea when typing and pressing Enter', () => {
    render(<BrainstormQuadrant {...defaultProps} />);
    const input = screen.getByPlaceholderText(/type an idea/i);
    fireEvent.change(input, { target: { value: 'New idea' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(defaultProps.onAddIdea).toHaveBeenCalledWith('prevent', 'New idea');
  });

  it('calls onRemoveIdea when remove button clicked', () => {
    render(<BrainstormQuadrant {...defaultProps} />);
    const removeBtn = screen.getByLabelText(/remove/i);
    fireEvent.click(removeBtn);
    expect(defaultProps.onRemoveIdea).toHaveBeenCalledWith('1');
  });
});
