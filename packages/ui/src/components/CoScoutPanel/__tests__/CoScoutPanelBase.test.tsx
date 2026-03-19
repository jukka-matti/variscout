import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CoScoutMessage } from '@variscout/core';

// Mock dependencies BEFORE component import (critical vitest pattern)
vi.mock('@variscout/hooks', () => ({
  useResizablePanel: () => ({
    width: 384,
    isDragging: false,
    handleMouseDown: vi.fn(),
  }),
  useTranslation: () => ({
    t: (key: string) => key,
    formatStat: (n: number) => String(n),
    formatPct: (n: number) => `${n}%`,
    locale: 'en',
  }),
}));

vi.mock('lucide-react', () => ({
  GripVertical: (props: Record<string, unknown>) => <span data-testid="grip-icon" {...props} />,
  X: (props: Record<string, unknown>) => <span data-testid="x-icon" {...props} />,
  Send: (props: Record<string, unknown>) => <span data-testid="send-icon" {...props} />,
  RotateCw: (props: Record<string, unknown>) => <span data-testid="rotate-icon" {...props} />,
  MoreVertical: (props: Record<string, unknown>) => (
    <span data-testid="more-vertical-icon" {...props} />
  ),
  Square: (props: Record<string, unknown>) => <span data-testid="square-icon" {...props} />,
  Copy: (props: Record<string, unknown>) => <span data-testid="copy-icon" {...props} />,
  Check: (props: Record<string, unknown>) => <span data-testid="check-icon" {...props} />,
  ChevronDown: (props: Record<string, unknown>) => (
    <span data-testid="chevron-down-icon" {...props} />
  ),
  ChevronRight: (props: Record<string, unknown>) => (
    <span data-testid="chevron-right-icon" {...props} />
  ),
  ClipboardCopy: (props: Record<string, unknown>) => (
    <span data-testid="clipboard-icon" {...props} />
  ),
  Search: (props: Record<string, unknown>) => <span data-testid="search-icon" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="loader-icon" {...props} />,
  FileText: (props: Record<string, unknown>) => <span data-testid="filetext-icon" {...props} />,
  ExternalLink: (props: Record<string, unknown>) => (
    <span data-testid="externallink-icon" {...props} />
  ),
  Filter: (props: Record<string, unknown>) => <span data-testid="filter-icon" {...props} />,
  GitBranch: (props: Record<string, unknown>) => <span data-testid="gitbranch-icon" {...props} />,
  Zap: (props: Record<string, unknown>) => <span data-testid="zap-icon" {...props} />,
  Share2: (props: Record<string, unknown>) => <span data-testid="share-icon" {...props} />,
  FileUp: (props: Record<string, unknown>) => <span data-testid="fileup-icon" {...props} />,
  Bell: (props: Record<string, unknown>) => <span data-testid="bell-icon" {...props} />,
}));

import { CoScoutPanelBase } from '../CoScoutPanelBase';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  messages: [] as CoScoutMessage[],
  onSend: vi.fn(),
  isLoading: false,
  resizeConfig: { storageKey: 'test-key' },
};

describe('CoScoutPanelBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<CoScoutPanelBase {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders panel with correct test id when open', () => {
    render(<CoScoutPanelBase {...defaultProps} />);
    expect(screen.getByTestId('coscout-panel')).toBeDefined();
  });

  it('renders messages with correct alignment', () => {
    const messages: CoScoutMessage[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: 1 },
      { id: '2', role: 'assistant', content: 'Hi there', timestamp: 2 },
    ];
    render(<CoScoutPanelBase {...defaultProps} messages={messages} />);

    const msg0 = screen.getByTestId('coscout-message-0');
    const msg1 = screen.getByTestId('coscout-message-1');
    expect(msg0.className).toContain('justify-end'); // user = right
    expect(msg1.className).toContain('justify-start'); // assistant = left
  });

  it('calls onSend on Enter key', () => {
    const onSend = vi.fn();
    render(<CoScoutPanelBase {...defaultProps} onSend={onSend} />);

    const input = screen.getByTestId('coscout-input');
    fireEvent.change(input, { target: { value: 'Question' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Question');
  });

  it('does not send on Shift+Enter (newline)', () => {
    const onSend = vi.fn();
    render(<CoScoutPanelBase {...defaultProps} onSend={onSend} />);

    const input = screen.getByTestId('coscout-input');
    fireEvent.change(input, { target: { value: 'Text' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<CoScoutPanelBase {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading indicator when isLoading', () => {
    render(<CoScoutPanelBase {...defaultProps} isLoading={true} />);
    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(3);
  });

  it('shows error with retry button when retryable', () => {
    const onRetry = vi.fn();
    const messages: CoScoutMessage[] = [
      { id: '1', role: 'user', content: 'Question', timestamp: 1 },
      {
        id: '2',
        role: 'assistant',
        content: '',
        timestamp: 2,
        error: { type: 'network', message: 'Failed', retryable: true },
      },
    ];
    render(<CoScoutPanelBase {...defaultProps} messages={messages} onRetry={onRetry} />);

    expect(screen.getByText('coscout.error')).toBeDefined();
    const retryBtn = screen.getByText('action.retry');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows rate-limit error without retry button', () => {
    const messages: CoScoutMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        timestamp: 1,
        error: { type: 'rate-limit', message: 'Too many', retryable: false },
      },
    ];
    render(<CoScoutPanelBase {...defaultProps} messages={messages} onRetry={vi.fn()} />);

    expect(screen.getByText('coscout.rateLimit')).toBeDefined();
    expect(screen.queryByText('action.retry')).toBeNull();
  });

  it('shows content-filter error text', () => {
    const messages: CoScoutMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        timestamp: 1,
        error: { type: 'content-filter', message: 'Filtered', retryable: false },
      },
    ];
    render(<CoScoutPanelBase {...defaultProps} messages={messages} />);
    expect(screen.getByText('coscout.contentFilter')).toBeDefined();
  });

  it('does not send empty input', () => {
    const onSend = vi.fn();
    render(<CoScoutPanelBase {...defaultProps} onSend={onSend} />);

    const input = screen.getByTestId('coscout-input');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  describe('suggested question chips', () => {
    it('renders chips when questions provided and not loading', () => {
      const questions = ['What is Cpk?', 'Why out of control?', 'What next?'];
      render(
        <CoScoutPanelBase
          {...defaultProps}
          suggestedQuestions={questions}
          onSuggestedQuestionClick={vi.fn()}
        />
      );

      expect(screen.getByTestId('coscout-suggested-questions')).toBeDefined();
      expect(screen.getByTestId('coscout-suggestion-0')).toBeDefined();
      expect(screen.getByTestId('coscout-suggestion-1')).toBeDefined();
      expect(screen.getByTestId('coscout-suggestion-2')).toBeDefined();
    });

    it('clicking a chip calls onSuggestedQuestionClick', () => {
      const onClick = vi.fn();
      render(
        <CoScoutPanelBase
          {...defaultProps}
          suggestedQuestions={['What is Cpk?']}
          onSuggestedQuestionClick={onClick}
        />
      );

      fireEvent.click(screen.getByTestId('coscout-suggestion-0'));
      expect(onClick).toHaveBeenCalledWith('What is Cpk?');
    });

    it('hides chips when no questions', () => {
      render(<CoScoutPanelBase {...defaultProps} suggestedQuestions={[]} />);
      expect(screen.queryByTestId('coscout-suggested-questions')).toBeNull();
    });

    it('hides chips when loading', () => {
      render(
        <CoScoutPanelBase
          {...defaultProps}
          isLoading={true}
          suggestedQuestions={['Q1']}
          onSuggestedQuestionClick={vi.fn()}
        />
      );
      expect(screen.queryByTestId('coscout-suggested-questions')).toBeNull();
    });
  });

  describe('overflow menu', () => {
    const messagesWithContent: CoScoutMessage[] = [
      { id: '1', role: 'assistant', content: 'Hello', timestamp: 1 },
    ];

    it('shows overflow menu button when messages exist', () => {
      render(
        <CoScoutPanelBase
          {...defaultProps}
          messages={messagesWithContent}
          onClear={vi.fn()}
          onCopyLastResponse={vi.fn()}
        />
      );
      expect(screen.getByTestId('coscout-overflow-menu')).toBeDefined();
    });

    it('does not show overflow when no messages', () => {
      render(<CoScoutPanelBase {...defaultProps} onClear={vi.fn()} onCopyLastResponse={vi.fn()} />);
      expect(screen.queryByTestId('coscout-overflow-menu')).toBeNull();
    });

    it('opens/closes dropdown on click', () => {
      render(
        <CoScoutPanelBase
          {...defaultProps}
          messages={messagesWithContent}
          onClear={vi.fn()}
          onCopyLastResponse={vi.fn()}
        />
      );

      expect(screen.queryByTestId('coscout-menu-clear')).toBeNull();
      fireEvent.click(screen.getByTestId('coscout-overflow-menu'));
      expect(screen.getByTestId('coscout-menu-clear')).toBeDefined();
    });

    it('clear with confirm calls onClear', () => {
      const onClear = vi.fn();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <CoScoutPanelBase
          {...defaultProps}
          messages={messagesWithContent}
          onClear={onClear}
          onCopyLastResponse={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('coscout-overflow-menu'));
      fireEvent.click(screen.getByTestId('coscout-menu-clear'));
      expect(window.confirm).toHaveBeenCalledWith('Clear conversation?');
      expect(onClear).toHaveBeenCalled();
    });

    it('clear cancelled does not call onClear', () => {
      const onClear = vi.fn();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <CoScoutPanelBase
          {...defaultProps}
          messages={messagesWithContent}
          onClear={onClear}
          onCopyLastResponse={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('coscout-overflow-menu'));
      fireEvent.click(screen.getByTestId('coscout-menu-clear'));
      expect(onClear).not.toHaveBeenCalled();
    });

    it('copy calls onCopyLastResponse', () => {
      const onCopy = vi.fn();

      render(
        <CoScoutPanelBase
          {...defaultProps}
          messages={messagesWithContent}
          onClear={vi.fn()}
          onCopyLastResponse={onCopy}
        />
      );

      fireEvent.click(screen.getByTestId('coscout-overflow-menu'));
      fireEvent.click(screen.getByTestId('coscout-menu-copy'));
      expect(onCopy).toHaveBeenCalled();
    });
  });

  describe('streaming', () => {
    it('shows stop button when streaming', () => {
      render(<CoScoutPanelBase {...defaultProps} isStreaming={true} onStopStreaming={vi.fn()} />);
      expect(screen.getByTestId('coscout-stop-button')).toBeDefined();
    });

    it('shows send button when not streaming', () => {
      render(<CoScoutPanelBase {...defaultProps} isStreaming={false} />);
      expect(screen.queryByTestId('coscout-stop-button')).toBeNull();
      expect(screen.getByLabelText('coscout.send')).toBeDefined();
    });

    it('calls onStopStreaming when stop button clicked', () => {
      const onStop = vi.fn();
      render(<CoScoutPanelBase {...defaultProps} isStreaming={true} onStopStreaming={onStop} />);
      fireEvent.click(screen.getByTestId('coscout-stop-button'));
      expect(onStop).toHaveBeenCalled();
    });

    it('disables textarea during streaming', () => {
      render(<CoScoutPanelBase {...defaultProps} isStreaming={true} onStopStreaming={vi.fn()} />);
      const input = screen.getByTestId('coscout-input') as HTMLTextAreaElement;
      expect(input.disabled).toBe(true);
    });
  });
});
