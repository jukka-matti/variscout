import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import type { CoScoutMessage } from '@variscout/core';
import { CoScoutMessages } from '../CoScoutMessages';

describe('CoScoutMessages', () => {
  it('renders user messages aligned to the right', () => {
    const messages: CoScoutMessage[] = [
      { id: '1', role: 'user', content: 'Hello there', timestamp: 1 },
    ];
    render(<CoScoutMessages messages={messages} isLoading={false} />);

    const msg = screen.getByTestId('coscout-message-0');
    expect(msg.className).toContain('justify-end');
    expect(screen.getByText('Hello there')).toBeDefined();
  });

  it('renders assistant messages aligned to the left', () => {
    const messages: CoScoutMessage[] = [
      { id: '1', role: 'assistant', content: 'I can help with that', timestamp: 1 },
    ];
    render(<CoScoutMessages messages={messages} isLoading={false} />);

    const msg = screen.getByTestId('coscout-message-0');
    expect(msg.className).toContain('justify-start');
    expect(screen.getByText('I can help with that')).toBeDefined();
  });

  it('renders error message with retry button when retryable', () => {
    const onRetry = vi.fn();
    const messages: CoScoutMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        timestamp: 1,
        error: { type: 'network', message: 'Failed', retryable: true },
      },
    ];
    render(<CoScoutMessages messages={messages} isLoading={false} onRetry={onRetry} />);

    expect(screen.getByText('Something went wrong.')).toBeDefined();
    const retryBtn = screen.getByText('Retry');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders rate-limit error without retry button', () => {
    const messages: CoScoutMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        timestamp: 1,
        error: { type: 'rate-limit', message: 'Too many', retryable: false },
      },
    ];
    render(<CoScoutMessages messages={messages} isLoading={false} onRetry={vi.fn()} />);

    expect(screen.getByText('Please wait a moment before asking again.')).toBeDefined();
    expect(screen.queryByText('Retry')).toBeNull();
  });

  it('renders content-filter error text', () => {
    const messages: CoScoutMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        timestamp: 1,
        error: { type: 'content-filter', message: 'Filtered', retryable: false },
      },
    ];
    render(<CoScoutMessages messages={messages} isLoading={false} />);
    expect(screen.getByText("I can't answer that question. Try rephrasing.")).toBeDefined();
  });

  it('shows loading dots when isLoading is true and not streaming', () => {
    render(<CoScoutMessages messages={[]} isLoading={true} />);
    expect(screen.getByTestId('coscout-loading-dots')).toBeDefined();
    const dots = screen.getByTestId('coscout-loading-dots').querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(3);
  });

  it('does not show loading dots when streaming with content', () => {
    const messages: CoScoutMessage[] = [
      { id: '1', role: 'assistant', content: 'Partial response...', timestamp: 1 },
    ];
    render(<CoScoutMessages messages={messages} isLoading={true} isStreaming={true} />);
    expect(screen.queryByTestId('coscout-loading-dots')).toBeNull();
  });

  it('shows loading dots when streaming but last message content is empty', () => {
    const messages: CoScoutMessage[] = [{ id: '1', role: 'assistant', content: '', timestamp: 1 }];
    render(<CoScoutMessages messages={messages} isLoading={true} isStreaming={true} />);
    expect(screen.getByTestId('coscout-loading-dots')).toBeDefined();
  });

  it('does not show loading dots when isLoading is false', () => {
    render(<CoScoutMessages messages={[]} isLoading={false} />);
    expect(screen.queryByTestId('coscout-loading-dots')).toBeNull();
  });
});
