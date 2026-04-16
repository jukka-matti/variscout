/**
 * Tests for QuestionLinkPrompt component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionLinkPrompt } from '../QuestionLinkPrompt';

const openQuestions = [
  { id: 'q-1', text: 'Is machine speed a factor?', status: 'open' },
  { id: 'q-2', text: 'Does shift affect output?', status: 'open' },
  { id: 'q-3', text: 'Old closed question', status: 'closed' },
];

function defaultProps(overrides = {}) {
  return {
    isOpen: true,
    findingId: 'f-1',
    questions: openQuestions,
    onLink: vi.fn(),
    onSkip: vi.fn(),
    onSkipForever: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

describe('QuestionLinkPrompt', () => {
  // 1. isOpen={false} renders nothing
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<QuestionLinkPrompt {...defaultProps({ isOpen: false })} />);
    expect(container.firstChild).toBeNull();
  });

  // 2. Opens with header text visible
  it('shows header text when open', () => {
    render(<QuestionLinkPrompt {...defaultProps()} />);
    expect(screen.getByText('Link this observation to a question?')).toBeDefined();
  });

  // 3. Renders only status === 'open' questions in the picker
  it('only shows open questions in the picker', () => {
    render(<QuestionLinkPrompt {...defaultProps()} />);
    expect(screen.getByText('Is machine speed a factor?')).toBeDefined();
    expect(screen.getByText('Does shift affect output?')).toBeDefined();
    expect(screen.queryByText('Old closed question')).toBeNull();
  });

  // 4. Empty state message shown when no open questions
  it('shows empty state when no open questions exist', () => {
    const noOpen = openQuestions.filter(q => q.status !== 'open');
    render(<QuestionLinkPrompt {...defaultProps({ questions: noOpen })} />);
    expect(screen.getByText(/No open questions yet/)).toBeDefined();
  });

  // 5. Click on a question calls onLink(questionId) AND onClose()
  it('calls onLink with correct id and onClose when a question is clicked', () => {
    const props = defaultProps();
    render(<QuestionLinkPrompt {...props} />);
    fireEvent.click(screen.getByText('Is machine speed a factor?'));
    expect(props.onLink).toHaveBeenCalledWith('q-1');
    expect(props.onLink).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  // 6. Click Skip without checkbox calls onSkip + onClose, NOT onSkipForever
  it('calls onSkip and onClose (not onSkipForever) when Skip clicked without checkbox', () => {
    const props = defaultProps();
    render(<QuestionLinkPrompt {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(props.onSkip).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSkipForever).not.toHaveBeenCalled();
  });

  // 7. Click Skip with checkbox checked calls onSkipForever + onClose, NOT onSkip
  it('calls onSkipForever and onClose (not onSkip) when Skip clicked with "Don\'t ask again" checked', () => {
    const props = defaultProps();
    render(<QuestionLinkPrompt {...props} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(props.onSkipForever).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSkip).not.toHaveBeenCalled();
  });

  // 8. Escape key calls onClose
  it('calls onClose when Escape is pressed', () => {
    const props = defaultProps();
    render(<QuestionLinkPrompt {...props} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
