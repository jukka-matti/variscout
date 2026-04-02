import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import type { CoScoutMessage } from '@variscout/core';
import { CoScoutMessages } from '../CoScoutMessages';
import type { KnowledgeCitationData } from '../KnowledgeCitationCard';

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

    expect(screen.getByText('An error occurred. Please try again.')).toBeDefined();
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

    expect(screen.getByText('Rate limit reached. Please wait.')).toBeDefined();
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
    expect(screen.getByText('Content filtered by safety policy.')).toBeDefined();
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

  describe('citation card interaction', () => {
    // REF marker format: [REF:type:id]display text[/REF]
    const docMessage: CoScoutMessage = {
      id: 'msg-1',
      role: 'assistant',
      content: 'See [REF:document:doc-001]SOP-103[/REF] for details.',
      timestamp: 1,
    };

    const citationDataMap: Record<string, KnowledgeCitationData> = {
      'document:doc-001': {
        fileName: 'SOP-103.pdf',
        section: 'Section 4',
        chunkText: 'The temperature must be verified.',
      },
      'answer:ans-007': {
        answerText: 'Temperature was 210°C.',
        questionText: 'What was the temperature?',
      },
    };

    it('shows citation card when a citation RefLink is clicked', () => {
      render(
        <CoScoutMessages
          messages={[docMessage]}
          isLoading={false}
          citationDataMap={citationDataMap}
        />
      );

      // No citation card before click
      expect(screen.queryByTestId('citation-card-document')).toBeNull();

      // Click the RefLink button rendered from the REF marker
      const refLink = screen.getByText('SOP-103');
      fireEvent.click(refLink);

      // Citation card should now be visible
      expect(screen.getByTestId('citation-card-document')).toBeDefined();
    });

    it('collapses citation card when the same RefLink is clicked again', () => {
      render(
        <CoScoutMessages
          messages={[docMessage]}
          isLoading={false}
          citationDataMap={citationDataMap}
        />
      );

      const refLink = screen.getByText('SOP-103');

      // First click: expand
      fireEvent.click(refLink);
      expect(screen.getByTestId('citation-card-document')).toBeDefined();

      // Second click: collapse
      fireEvent.click(refLink);
      expect(screen.queryByTestId('citation-card-document')).toBeNull();
    });

    it('closes citation card when close button is clicked', () => {
      render(
        <CoScoutMessages
          messages={[docMessage]}
          isLoading={false}
          citationDataMap={citationDataMap}
        />
      );

      // Expand the card
      fireEvent.click(screen.getByText('SOP-103'));
      expect(screen.getByTestId('citation-card-document')).toBeDefined();

      // Click the close button on the citation card
      fireEvent.click(screen.getByTestId('citation-close-btn'));
      expect(screen.queryByTestId('citation-card-document')).toBeNull();
    });

    it('only one citation card is expanded at a time across different messages', () => {
      const answerMessage: CoScoutMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'See [REF:answer:ans-007]Q7 answer[/REF] also.',
        timestamp: 2,
      };

      render(
        <CoScoutMessages
          messages={[docMessage, answerMessage]}
          isLoading={false}
          citationDataMap={citationDataMap}
        />
      );

      // Expand the document citation in first message
      fireEvent.click(screen.getByText('SOP-103'));
      expect(screen.getByTestId('citation-card-document')).toBeDefined();
      expect(screen.queryByTestId('citation-card-answer')).toBeNull();

      // Expand the answer citation in second message — document card should disappear
      fireEvent.click(screen.getByText('Q7 answer'));
      expect(screen.queryByTestId('citation-card-document')).toBeNull();
      expect(screen.getByTestId('citation-card-answer')).toBeDefined();
    });

    it('only one citation card is expanded at a time within the same message', () => {
      const twoRefMessage: CoScoutMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: 'See [REF:document:doc-001]SOP-103[/REF] and [REF:answer:ans-007]Q7 answer[/REF].',
        timestamp: 1,
      };

      render(
        <CoScoutMessages
          messages={[twoRefMessage]}
          isLoading={false}
          citationDataMap={citationDataMap}
        />
      );

      // Expand document citation
      fireEvent.click(screen.getByText('SOP-103'));
      expect(screen.getByTestId('citation-card-document')).toBeDefined();
      expect(screen.queryByTestId('citation-card-answer')).toBeNull();

      // Click answer citation — document collapses, answer expands
      fireEvent.click(screen.getByText('Q7 answer'));
      expect(screen.queryByTestId('citation-card-document')).toBeNull();
      expect(screen.getByTestId('citation-card-answer')).toBeDefined();
    });

    it('does not open citation card for non-citation ref types (e.g. chart refs)', () => {
      const onRefActivate = vi.fn();
      const chartRefMessage: CoScoutMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Check [REF:boxplot]the boxplot[/REF] here.',
        timestamp: 1,
      };

      render(
        <CoScoutMessages
          messages={[chartRefMessage]}
          isLoading={false}
          onRefActivate={onRefActivate}
        />
      );

      fireEvent.click(screen.getByText('the boxplot'));

      // No citation card should appear for chart refs
      expect(screen.queryByTestId('citation-card-document')).toBeNull();
      expect(screen.queryByTestId('citation-card-answer')).toBeNull();

      // Parent onRefActivate should be called for chart refs
      expect(onRefActivate).toHaveBeenCalledWith('boxplot', undefined);
    });

    it('renders citation card with data from citationDataMap', () => {
      render(
        <CoScoutMessages
          messages={[docMessage]}
          isLoading={false}
          citationDataMap={citationDataMap}
        />
      );

      fireEvent.click(screen.getByText('SOP-103'));

      // Data from the map should appear in the card
      expect(screen.getByText('SOP-103.pdf')).toBeDefined();
      expect(screen.getByText('Section 4')).toBeDefined();
      expect(screen.getByText('The temperature must be verified.')).toBeDefined();
    });

    it('shows download button when onCitationDownload is provided for document type', () => {
      const onCitationDownload = vi.fn();
      render(
        <CoScoutMessages
          messages={[docMessage]}
          isLoading={false}
          citationDataMap={citationDataMap}
          onCitationDownload={onCitationDownload}
        />
      );

      fireEvent.click(screen.getByText('SOP-103'));

      const downloadBtn = screen.getByTestId('citation-download-btn');
      expect(downloadBtn).toBeDefined();
      fireEvent.click(downloadBtn);
      expect(onCitationDownload).toHaveBeenCalledWith('document', 'doc-001');
    });
  });
});
