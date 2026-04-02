import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KnowledgeCitationCard } from '../KnowledgeCitationCard';

describe('KnowledgeCitationCard', () => {
  describe('document variant', () => {
    it('renders with correct styling', () => {
      const onClose = vi.fn();
      render(
        <KnowledgeCitationCard
          refType="document"
          refId="doc-001"
          displayText="SOP-103 §4.2"
          citationData={{
            fileName: 'SOP-103.pdf',
            section: 'Section 4.2',
            chunkText: 'The temperature must be verified before each run.',
            chunkIndex: 3,
            totalChunks: 12,
          }}
          onClose={onClose}
        />
      );

      const card = screen.getByTestId('citation-card-document');
      expect(card).toBeDefined();
      expect(card.className).toContain('border-blue-500/30');
      expect(card.className).toContain('bg-blue-500/5');
      expect(screen.getByText('SOP-103.pdf')).toBeDefined();
      expect(screen.getByText('Section 4.2')).toBeDefined();
      expect(screen.getByText('The temperature must be verified before each run.')).toBeDefined();
      expect(screen.getByText(/Chunk 3 of 12/)).toBeDefined();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(
        <KnowledgeCitationCard
          refType="document"
          refId="doc-001"
          displayText="SOP-103"
          onClose={onClose}
        />
      );

      const closeBtn = screen.getByTestId('citation-close-btn');
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('renders download button and calls onDownload', () => {
      const onClose = vi.fn();
      const onDownload = vi.fn();
      render(
        <KnowledgeCitationCard
          refType="document"
          refId="doc-001"
          displayText="SOP-103"
          onDownload={onDownload}
          onClose={onClose}
        />
      );

      const downloadBtn = screen.getByTestId('citation-download-btn');
      expect(downloadBtn).toBeDefined();
      fireEvent.click(downloadBtn);
      expect(onDownload).toHaveBeenCalledOnce();
    });

    it('does not render download button when onDownload not provided', () => {
      render(
        <KnowledgeCitationCard
          refType="document"
          refId="doc-001"
          displayText="SOP-103"
          onClose={vi.fn()}
        />
      );

      const downloadBtn = screen.queryByTestId('citation-download-btn');
      expect(downloadBtn).toBeNull();
    });

    it('shows uploader and date in footer when provided', () => {
      render(
        <KnowledgeCitationCard
          refType="document"
          refId="doc-001"
          displayText="SOP-103"
          citationData={{
            uploadedBy: 'Antti',
            uploadedAt: '2026-03-15',
          }}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/Antti/)).toBeDefined();
      expect(screen.getByText(/2026-03-15/)).toBeDefined();
    });

    it('gracefully handles missing citationData fields', () => {
      render(
        <KnowledgeCitationCard
          refType="document"
          refId="doc-001"
          displayText="SOP-103"
          onClose={vi.fn()}
        />
      );

      // Should render without errors; displayText used as fallback filename
      const card = screen.getByTestId('citation-card-document');
      expect(card).toBeDefined();
      expect(screen.getByText('SOP-103')).toBeDefined();
    });
  });

  describe('finding variant', () => {
    it('renders with correct styling and status badge', () => {
      const onClose = vi.fn();
      render(
        <KnowledgeCitationCard
          refType="finding"
          refId="finding-42"
          displayText="Machine A shows elevated variation"
          citationData={{
            status: 'analyzing',
            outcome: { effective: 'Yes', cpkDelta: 0.24 },
            commentCount: 3,
            linkedQuestion: 'Is Machine A the root cause?',
          }}
          onClose={onClose}
        />
      );

      const card = screen.getByTestId('citation-card-finding');
      expect(card).toBeDefined();
      expect(card.className).toContain('border-amber-500/30');
      expect(card.className).toContain('bg-amber-500/5');
      expect(screen.getByText('Machine A shows elevated variation')).toBeDefined();
      expect(screen.getByText('analyzing')).toBeDefined();
      expect(screen.getByText(/3 comments/)).toBeDefined();
      expect(screen.getByText('Is Machine A the root cause?')).toBeDefined();
    });

    it('shows cpkDelta in outcome when provided', () => {
      render(
        <KnowledgeCitationCard
          refType="finding"
          refId="finding-42"
          displayText="Finding text"
          citationData={{
            outcome: { effective: 'Yes', cpkDelta: 0.35 },
          }}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/\+0\.35/)).toBeDefined();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(
        <KnowledgeCitationCard
          refType="finding"
          refId="finding-42"
          displayText="Finding text"
          onClose={onClose}
        />
      );

      fireEvent.click(screen.getByTestId('citation-close-btn'));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not render download button (finding variant)', () => {
      render(
        <KnowledgeCitationCard
          refType="finding"
          refId="finding-42"
          displayText="Finding text"
          onDownload={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Finding card has no download button
      expect(screen.queryByTestId('citation-download-btn')).toBeNull();
    });
  });

  describe('answer variant', () => {
    it('renders with correct styling and question text', () => {
      const onClose = vi.fn();
      render(
        <KnowledgeCitationCard
          refType="answer"
          refId="answer-7"
          displayText="Temperature was 210°C during shift B"
          citationData={{
            answerText:
              'During shift B on March 14th the temperature was recorded at 210°C, which is 5° above the upper limit.',
            questionText: 'What was the temperature during shift B?',
          }}
          onClose={onClose}
        />
      );

      const card = screen.getByTestId('citation-card-answer');
      expect(card).toBeDefined();
      expect(card.className).toContain('border-blue-400/20');
      expect(card.className).toContain('bg-blue-400/5');
      expect(screen.getByText('Temperature was 210°C during shift B')).toBeDefined();
      expect(screen.getByText('answer')).toBeDefined();
      expect(
        screen.getByText(
          'During shift B on March 14th the temperature was recorded at 210°C, which is 5° above the upper limit.'
        )
      ).toBeDefined();
      expect(screen.getByText('What was the temperature during shift B?')).toBeDefined();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(
        <KnowledgeCitationCard
          refType="answer"
          refId="answer-7"
          displayText="Answer text"
          onClose={onClose}
        />
      );

      fireEvent.click(screen.getByTestId('citation-close-btn'));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('gracefully handles missing answerText and questionText', () => {
      render(
        <KnowledgeCitationCard
          refType="answer"
          refId="answer-7"
          displayText="Answer text"
          citationData={{}}
          onClose={vi.fn()}
        />
      );

      const card = screen.getByTestId('citation-card-answer');
      expect(card).toBeDefined();
    });
  });
});
