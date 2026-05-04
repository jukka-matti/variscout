import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { registerLocaleLoaders } from '@variscout/core/i18n';
import type { MessageCatalog } from '@variscout/core';

// Register locale loaders at module level per testing.md hard rules.
registerLocaleLoaders(
  import.meta.glob<Record<string, MessageCatalog>>('../../../../../core/src/i18n/messages/*.ts', {
    eager: false,
  })
);

// NOTE: vi.mock() calls must come before component imports per testing.md hard rules.
// No mocks needed for StageFiveModal — it is a self-contained presentational component.

import { StageFiveModal } from '../index';

describe('StageFiveModal', () => {
  it('renders the issue + question fields when open', () => {
    render(
      <StageFiveModal
        open
        mode="mode-b"
        onOpenInvestigation={vi.fn()}
        onSkip={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByTestId('stage-five-modal')).toBeInTheDocument();
    expect(screen.getByLabelText(/issue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/question/i)).toBeInTheDocument();
    expect(screen.getByTestId('stage-five-open-investigation')).toBeInTheDocument();
    expect(screen.getByTestId('stage-five-skip')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    render(
      <StageFiveModal
        open={false}
        mode="mode-b"
        onOpenInvestigation={vi.fn()}
        onSkip={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByTestId('stage-five-modal')).not.toBeInTheDocument();
  });
});

describe('StageFiveModal interactions', () => {
  it('calls onOpenInvestigation with the populated brief on submit', () => {
    const onOpenInvestigation = vi.fn();
    render(
      <StageFiveModal
        open
        mode="mode-b"
        onOpenInvestigation={onOpenInvestigation}
        onSkip={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.change(screen.getByTestId('stage-five-issue-input'), {
      target: { value: 'Defect rate spiked Tuesday' },
    });
    fireEvent.change(screen.getByTestId('stage-five-question-input'), {
      target: { value: 'Was the new resin lot the cause?' },
    });
    fireEvent.click(screen.getByTestId('stage-five-open-investigation'));
    expect(onOpenInvestigation).toHaveBeenCalledWith({
      issueStatement: 'Defect rate spiked Tuesday',
      questions: [{ text: 'Was the new resin lot the cause?' }],
    });
  });

  it('calls onSkip on skip', () => {
    const onSkip = vi.fn();
    render(
      <StageFiveModal
        open
        mode="mode-b"
        onOpenInvestigation={vi.fn()}
        onSkip={onSkip}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('stage-five-skip'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    render(
      <StageFiveModal
        open
        mode="mode-b"
        onOpenInvestigation={vi.fn()}
        onSkip={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId('stage-five-modal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('omits issue/questions from brief when fields blank', () => {
    const onOpenInvestigation = vi.fn();
    render(
      <StageFiveModal
        open
        mode="mode-b"
        onOpenInvestigation={onOpenInvestigation}
        onSkip={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('stage-five-open-investigation'));
    expect(onOpenInvestigation).toHaveBeenCalledWith({});
  });

  it('strips whitespace-only input from brief', () => {
    const onOpenInvestigation = vi.fn();
    render(
      <StageFiveModal
        open
        mode="mode-b"
        onOpenInvestigation={onOpenInvestigation}
        onSkip={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.change(screen.getByTestId('stage-five-issue-input'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByTestId('stage-five-open-investigation'));
    expect(onOpenInvestigation).toHaveBeenCalledWith({});
  });

  it('does not call onClose when inner card is clicked', () => {
    const onClose = vi.fn();
    render(
      <StageFiveModal
        open
        mode="mode-b"
        onOpenInvestigation={vi.fn()}
        onSkip={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId('stage-five-open-investigation'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
