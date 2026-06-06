import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CaptureCard } from '../CaptureCard';
import type { CaptureDraft } from '@variscout/hooks';

const draft: CaptureDraft = {
  entryKind: 'brush',
  source: {
    chart: 'ichart',
    anchorX: 1,
    anchorY: 45,
    brushedRange: { startIdx: 1, endIdx: 2 },
    timeLens: { mode: 'rolling', windowSize: 50 },
  },
  activeFilters: { Step: ['Fill'] },
  proposedFactorName: 'obs 2-3',
  conditionLabel: 'Step = Fill x obs 2-3',
  evidenceLabel: 'mean 45 vs 45 · n=2',
  note: '',
};

describe('CaptureCard', () => {
  it('renders the draft condition, evidence, factor, note, and actions', () => {
    render(
      <CaptureCard
        draft={draft}
        onDraftChange={vi.fn()}
        onCapture={vi.fn()}
        onFactorOnly={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'New Finding' })).toBeInTheDocument();
    expect(screen.getByText('Step = Fill x obs 2-3')).toBeInTheDocument();
    expect(screen.getByText('mean 45 vs 45 · n=2')).toBeInTheDocument();
    expect(screen.getByLabelText('Factor name')).toHaveValue('obs 2-3');
    expect(screen.getByLabelText('Note')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Capture' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Factor only' })).toBeInTheDocument();
  });

  it('reports edits and action clicks', () => {
    const onDraftChange = vi.fn();
    const onCapture = vi.fn();
    const onFactorOnly = vi.fn();

    render(
      <CaptureCard
        draft={draft}
        onDraftChange={onDraftChange}
        onCapture={onCapture}
        onFactorOnly={onFactorOnly}
        onCancel={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Factor name'), { target: { value: 'Launch window' } });
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Fill step lifted' } });
    fireEvent.click(screen.getByRole('button', { name: 'Factor only' }));
    fireEvent.click(screen.getByRole('button', { name: 'Capture' }));

    expect(onDraftChange).toHaveBeenCalledWith({ proposedFactorName: 'Launch window' });
    expect(onDraftChange).toHaveBeenCalledWith({ note: 'Fill step lifted' });
    expect(onFactorOnly).toHaveBeenCalledTimes(1);
    expect(onCapture).toHaveBeenCalledTimes(1);
  });

  it('cancels on Escape, Cancel, and click-away', () => {
    const onCancel = vi.fn();

    render(
      <div>
        <button>Outside</button>
        <CaptureCard
          draft={draft}
          onDraftChange={vi.fn()}
          onCapture={vi.fn()}
          onFactorOnly={vi.fn()}
          onCancel={onCancel}
        />
      </div>
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));

    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  it('uses bottom-sheet positioning for mobile rendering', () => {
    render(
      <CaptureCard
        draft={draft}
        variant="bottom-sheet"
        onDraftChange={vi.fn()}
        onCapture={vi.fn()}
        onFactorOnly={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByTestId('capture-card-shell')).toHaveClass('fixed', 'inset-x-0', 'bottom-0');
  });

  it('hides Factor only when there is no derived factor proposal', () => {
    render(
      <CaptureCard
        draft={{ ...draft, proposedFactorName: undefined }}
        onDraftChange={vi.fn()}
        onCapture={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Factor only' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Factor name')).not.toBeInTheDocument();
  });
});
