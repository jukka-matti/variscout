import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CopilotMessage } from '@variscout/core';

// Mock dependencies BEFORE component import (critical vitest pattern)
vi.mock('@variscout/hooks', () => ({
  useResizablePanel: () => ({
    width: 384,
    isDragging: false,
    handleMouseDown: vi.fn(),
  }),
}));

vi.mock('lucide-react', () => ({
  GripVertical: (props: Record<string, unknown>) => <span data-testid="grip-icon" {...props} />,
  X: (props: Record<string, unknown>) => <span data-testid="x-icon" {...props} />,
  Send: (props: Record<string, unknown>) => <span data-testid="send-icon" {...props} />,
  RotateCw: (props: Record<string, unknown>) => <span data-testid="rotate-icon" {...props} />,
}));

import { CopilotPanelBase } from '../CopilotPanelBase';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  messages: [] as CopilotMessage[],
  onSend: vi.fn(),
  isLoading: false,
  resizeConfig: { storageKey: 'test-key' },
};

describe('CopilotPanelBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<CopilotPanelBase {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders panel with correct test id when open', () => {
    render(<CopilotPanelBase {...defaultProps} />);
    expect(screen.getByTestId('copilot-panel')).toBeDefined();
  });

  it('renders messages with correct alignment', () => {
    const messages: CopilotMessage[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: 1 },
      { id: '2', role: 'assistant', content: 'Hi there', timestamp: 2 },
    ];
    render(<CopilotPanelBase {...defaultProps} messages={messages} />);

    const msg0 = screen.getByTestId('copilot-message-0');
    const msg1 = screen.getByTestId('copilot-message-1');
    expect(msg0.className).toContain('justify-end'); // user = right
    expect(msg1.className).toContain('justify-start'); // assistant = left
  });

  it('calls onSend on Enter key', () => {
    const onSend = vi.fn();
    render(<CopilotPanelBase {...defaultProps} onSend={onSend} />);

    const input = screen.getByTestId('copilot-input');
    fireEvent.change(input, { target: { value: 'Question' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Question');
  });

  it('does not send on Shift+Enter (newline)', () => {
    const onSend = vi.fn();
    render(<CopilotPanelBase {...defaultProps} onSend={onSend} />);

    const input = screen.getByTestId('copilot-input');
    fireEvent.change(input, { target: { value: 'Text' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<CopilotPanelBase {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading indicator when isLoading', () => {
    render(<CopilotPanelBase {...defaultProps} isLoading={true} />);
    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(3);
  });

  it('shows error with retry button when retryable', () => {
    const onRetry = vi.fn();
    const messages: CopilotMessage[] = [
      { id: '1', role: 'user', content: 'Question', timestamp: 1 },
      {
        id: '2',
        role: 'assistant',
        content: '',
        timestamp: 2,
        error: { type: 'network', message: 'Failed', retryable: true },
      },
    ];
    render(<CopilotPanelBase {...defaultProps} messages={messages} onRetry={onRetry} />);

    expect(screen.getByText('Something went wrong.')).toBeDefined();
    const retryBtn = screen.getByText('Retry');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows rate-limit error without retry button', () => {
    const messages: CopilotMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        timestamp: 1,
        error: { type: 'rate-limit', message: 'Too many', retryable: false },
      },
    ];
    render(<CopilotPanelBase {...defaultProps} messages={messages} onRetry={vi.fn()} />);

    expect(screen.getByText('Please wait a moment before asking again.')).toBeDefined();
    expect(screen.queryByText('Retry')).toBeNull();
  });

  it('shows content-filter error text', () => {
    const messages: CopilotMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        timestamp: 1,
        error: { type: 'content-filter', message: 'Filtered', retryable: false },
      },
    ];
    render(<CopilotPanelBase {...defaultProps} messages={messages} />);
    expect(screen.getByText("I can't answer that question. Try rephrasing.")).toBeDefined();
  });

  it('does not send empty input', () => {
    const onSend = vi.fn();
    render(<CopilotPanelBase {...defaultProps} onSend={onSend} />);

    const input = screen.getByTestId('copilot-input');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows clear button when messages exist and onClear provided', () => {
    const onClear = vi.fn();
    const messages: CopilotMessage[] = [
      { id: '1', role: 'assistant', content: 'Hello', timestamp: 1 },
    ];
    render(<CopilotPanelBase {...defaultProps} messages={messages} onClear={onClear} />);

    const clearBtn = screen.getByLabelText('Clear conversation');
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });
});
