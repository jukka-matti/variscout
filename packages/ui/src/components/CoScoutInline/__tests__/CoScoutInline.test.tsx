import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CoScoutMessage } from '@variscout/core';

// Mock lucide-react BEFORE component import
vi.mock('lucide-react', () => ({
  ChevronDown: (props: Record<string, unknown>) => (
    <span data-testid="chevron-down-icon" {...props} />
  ),
  ChevronUp: (props: Record<string, unknown>) => <span data-testid="chevron-up-icon" {...props} />,
  Send: (props: Record<string, unknown>) => <span data-testid="send-icon" {...props} />,
  Square: (props: Record<string, unknown>) => <span data-testid="square-icon" {...props} />,
  Search: (props: Record<string, unknown>) => <span data-testid="search-icon" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="loader-icon" {...props} />,
  FileText: (props: Record<string, unknown>) => <span data-testid="filetext-icon" {...props} />,
  ExternalLink: (props: Record<string, unknown>) => (
    <span data-testid="externallink-icon" {...props} />
  ),
  Filter: (props: Record<string, unknown>) => <span data-testid="filter-icon" {...props} />,
  Check: (props: Record<string, unknown>) => <span data-testid="check-icon" {...props} />,
  X: (props: Record<string, unknown>) => <span data-testid="x-icon" {...props} />,
  GitBranch: (props: Record<string, unknown>) => <span data-testid="gitbranch-icon" {...props} />,
  Zap: (props: Record<string, unknown>) => <span data-testid="zap-icon" {...props} />,
  Share2: (props: Record<string, unknown>) => <span data-testid="share-icon" {...props} />,
  FileUp: (props: Record<string, unknown>) => <span data-testid="fileup-icon" {...props} />,
  Bell: (props: Record<string, unknown>) => <span data-testid="bell-icon" {...props} />,
  Lightbulb: (props: Record<string, unknown>) => <span data-testid="lightbulb-icon" {...props} />,
}));

import { CoScoutInline } from '../CoScoutInline';

const defaultProps = {
  messages: [] as CoScoutMessage[],
  onSend: vi.fn(),
  isLoading: false,
  isExpanded: false,
  onToggleExpand: vi.fn(),
};

describe('CoScoutInline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('collapsed state', () => {
    it('renders header with CoScout label', () => {
      render(<CoScoutInline {...defaultProps} />);
      expect(screen.getByText('CoScout')).toBeDefined();
    });

    it('shows chevron-up icon when collapsed', () => {
      render(<CoScoutInline {...defaultProps} isExpanded={false} />);
      expect(screen.getByTestId('chevron-up-icon')).toBeDefined();
    });

    it('does not show messages area when collapsed', () => {
      render(<CoScoutInline {...defaultProps} isExpanded={false} />);
      expect(screen.queryByTestId('coscout-messages')).toBeNull();
    });

    it('does not show input when collapsed', () => {
      render(<CoScoutInline {...defaultProps} isExpanded={false} />);
      expect(screen.queryByTestId('coscout-inline-input')).toBeNull();
    });
  });

  describe('expanded state', () => {
    it('shows messages area and input when expanded', () => {
      render(<CoScoutInline {...defaultProps} isExpanded={true} />);
      expect(screen.getByTestId('coscout-messages')).toBeDefined();
      expect(screen.getByTestId('coscout-inline-input')).toBeDefined();
    });

    it('shows chevron-down icon when expanded', () => {
      render(<CoScoutInline {...defaultProps} isExpanded={true} />);
      expect(screen.getByTestId('chevron-down-icon')).toBeDefined();
    });
  });

  describe('toggle', () => {
    it('calls onToggleExpand when header is clicked', () => {
      const onToggleExpand = vi.fn();
      render(<CoScoutInline {...defaultProps} onToggleExpand={onToggleExpand} />);
      fireEvent.click(screen.getByTestId('coscout-inline-toggle'));
      expect(onToggleExpand).toHaveBeenCalled();
    });
  });

  describe('suggested questions', () => {
    it('renders question chips when collapsed and questions provided', () => {
      render(
        <CoScoutInline
          {...defaultProps}
          isExpanded={false}
          suggestedQuestions={['What is Cpk?', 'Why unstable?']}
        />
      );
      expect(screen.getByTestId('coscout-inline-suggestions')).toBeDefined();
      expect(screen.getByTestId('coscout-inline-suggestion-0')).toBeDefined();
      expect(screen.getByTestId('coscout-inline-suggestion-1')).toBeDefined();
    });

    it('clicking a chip calls onSend with the question text', () => {
      const onSend = vi.fn();
      render(
        <CoScoutInline
          {...defaultProps}
          onSend={onSend}
          isExpanded={false}
          suggestedQuestions={['What is Cpk?']}
        />
      );
      fireEvent.click(screen.getByTestId('coscout-inline-suggestion-0'));
      expect(onSend).toHaveBeenCalledWith('What is Cpk?');
    });

    it('clicking a chip auto-expands when collapsed', () => {
      const onToggleExpand = vi.fn();
      render(
        <CoScoutInline
          {...defaultProps}
          isExpanded={false}
          onToggleExpand={onToggleExpand}
          suggestedQuestions={['What is Cpk?']}
        />
      );
      fireEvent.click(screen.getByTestId('coscout-inline-suggestion-0'));
      expect(onToggleExpand).toHaveBeenCalled();
    });

    it('clicking a chip when expanded does not call onToggleExpand', () => {
      const onToggleExpand = vi.fn();
      render(
        <CoScoutInline
          {...defaultProps}
          isExpanded={true}
          onToggleExpand={onToggleExpand}
          suggestedQuestions={['What is Cpk?']}
        />
      );
      fireEvent.click(screen.getByTestId('coscout-inline-suggestion-0'));
      expect(onToggleExpand).not.toHaveBeenCalled();
    });

    it('hides chips when loading', () => {
      render(<CoScoutInline {...defaultProps} isLoading={true} suggestedQuestions={['Q1']} />);
      expect(screen.queryByTestId('coscout-inline-suggestions')).toBeNull();
    });
  });

  describe('sending messages', () => {
    it('sends input text on send button click', () => {
      const onSend = vi.fn();
      render(<CoScoutInline {...defaultProps} onSend={onSend} isExpanded={true} />);

      const input = screen.getByTestId('coscout-inline-input');
      fireEvent.change(input, { target: { value: 'My question' } });
      fireEvent.click(screen.getByLabelText('Send message'));
      expect(onSend).toHaveBeenCalledWith('My question');
    });

    it('sends input text on Enter key', () => {
      const onSend = vi.fn();
      render(<CoScoutInline {...defaultProps} onSend={onSend} isExpanded={true} />);

      const input = screen.getByTestId('coscout-inline-input');
      fireEvent.change(input, { target: { value: 'Question' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onSend).toHaveBeenCalledWith('Question');
    });

    it('does not send empty input', () => {
      const onSend = vi.fn();
      render(<CoScoutInline {...defaultProps} onSend={onSend} isExpanded={true} />);

      const input = screen.getByTestId('coscout-inline-input');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onSend).not.toHaveBeenCalled();
    });

    it('does not send on Shift+Enter', () => {
      const onSend = vi.fn();
      render(<CoScoutInline {...defaultProps} onSend={onSend} isExpanded={true} />);

      const input = screen.getByTestId('coscout-inline-input');
      fireEvent.change(input, { target: { value: 'Text' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('streaming', () => {
    it('shows stop button when streaming', () => {
      render(
        <CoScoutInline
          {...defaultProps}
          isExpanded={true}
          isStreaming={true}
          onStopStreaming={vi.fn()}
        />
      );
      expect(screen.getByTestId('coscout-inline-stop')).toBeDefined();
    });

    it('calls onStopStreaming when stop button clicked', () => {
      const onStop = vi.fn();
      render(
        <CoScoutInline
          {...defaultProps}
          isExpanded={true}
          isStreaming={true}
          onStopStreaming={onStop}
        />
      );
      fireEvent.click(screen.getByTestId('coscout-inline-stop'));
      expect(onStop).toHaveBeenCalled();
    });

    it('shows send button when not streaming', () => {
      render(<CoScoutInline {...defaultProps} isExpanded={true} />);
      expect(screen.queryByTestId('coscout-inline-stop')).toBeNull();
      expect(screen.getByLabelText('Send message')).toBeDefined();
    });

    it('disables textarea during streaming', () => {
      render(
        <CoScoutInline
          {...defaultProps}
          isExpanded={true}
          isStreaming={true}
          onStopStreaming={vi.fn()}
        />
      );
      const input = screen.getByTestId('coscout-inline-input') as HTMLTextAreaElement;
      expect(input.disabled).toBe(true);
    });
  });

  describe('phase badge', () => {
    it('renders investigation phase badge when phase provided', () => {
      render(<CoScoutInline {...defaultProps} phase="diverging" />);
      expect(screen.getByTestId('investigation-phase-badge')).toBeDefined();
      expect(screen.getByText('Diverging')).toBeDefined();
    });

    it('does not render phase badge when no phase', () => {
      render(<CoScoutInline {...defaultProps} />);
      expect(screen.queryByTestId('investigation-phase-badge')).toBeNull();
    });
  });
});
