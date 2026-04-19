import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionPill } from '../QuestionPill';

describe('QuestionPill', () => {
  it('renders the question text and ? glyph', () => {
    render(
      <svg>
        <QuestionPill questionId="q1" text="Why is night different?" status="open" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/Why is night different\?/)).toBeInTheDocument();
  });

  it('calls onPromote on right-click', () => {
    const onPromote = vi.fn();
    render(
      <svg>
        <QuestionPill questionId="q1" text="Test" status="open" x={0} y={0} onPromote={onPromote} />
      </svg>
    );
    fireEvent.contextMenu(screen.getByRole('button', { name: /question/i }));
    expect(onPromote).toHaveBeenCalledWith('q1');
  });

  it('marks ruled-out questions with data-status attribute', () => {
    const { container } = render(
      <svg>
        <QuestionPill questionId="q1" text="No" status="ruled-out" x={0} y={0} />
      </svg>
    );
    expect(container.querySelector('[data-status="ruled-out"]')).toBeTruthy();
  });
});
