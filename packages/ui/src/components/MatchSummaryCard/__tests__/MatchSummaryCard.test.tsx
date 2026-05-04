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
// No mocks needed for MatchSummaryCard — it is a self-contained presentational component.

import { MatchSummaryCard } from '../index';

const APPEND = {
  source: 'same-source' as const,
  temporal: 'append' as const,
  blockReasons: [],
  existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-30T00:00:00Z' },
  newRange: { startISO: '2026-05-01T00:00:00Z', endISO: '2026-05-15T00:00:00Z' },
};

const OVERLAP = {
  source: 'same-source' as const,
  temporal: 'overlap' as const,
  blockReasons: ['overlap' as const],
  existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-30T00:00:00Z' },
  newRange: { startISO: '2026-04-15T00:00:00Z', endISO: '2026-05-15T00:00:00Z' },
  overlapRange: { startISO: '2026-04-15T00:00:00Z', endISO: '2026-04-30T00:00:00Z' },
};

const DIFFERENT_GRAIN = {
  source: 'same-source' as const,
  temporal: 'different-grain' as const,
  blockReasons: ['different-grain' as const],
  existingRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-04-30T00:00:00Z' },
  newRange: { startISO: '2026-04-01T00:00:00Z', endISO: '2026-05-15T00:00:00Z' },
};

const NO_KEY = {
  source: 'different-source-no-key' as const,
  temporal: 'no-timestamp' as const,
  blockReasons: ['different-source-no-key' as const],
};

const COL_SHAPE = {
  matched: ['ts', 'weight_g'],
  added: ['operator'],
  missing: ['machine_id'],
};

describe('MatchSummaryCard', () => {
  it('append — single Confirm button proceeds with default action', () => {
    const onChoose = vi.fn();
    render(
      <MatchSummaryCard
        classification={APPEND}
        columnShape={COL_SHAPE}
        onChoose={onChoose}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByTestId('match-summary-card')).toBeInTheDocument();
    expect(screen.getAllByText(/append/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('match-summary-confirm'));
    expect(onChoose).toHaveBeenCalledWith({ kind: 'append' });
  });

  it('overlap (BLOCK) — three explicit buttons, no default Confirm', () => {
    const onChoose = vi.fn();
    render(
      <MatchSummaryCard
        classification={OVERLAP}
        columnShape={COL_SHAPE}
        onChoose={onChoose}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByTestId('match-summary-confirm')).not.toBeInTheDocument();
    expect(screen.getByTestId('overlap-replace')).toBeInTheDocument();
    expect(screen.getByTestId('overlap-keep-both')).toBeInTheDocument();
    expect(screen.getByTestId('overlap-cancel')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('overlap-replace'));
    expect(onChoose).toHaveBeenCalledWith({ kind: 'overlap-replace' });
  });

  it('different-grain (BLOCK) — Cancel + Create separate Hub buttons', () => {
    const onChoose = vi.fn();
    render(
      <MatchSummaryCard
        classification={DIFFERENT_GRAIN}
        columnShape={COL_SHAPE}
        onChoose={onChoose}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByTestId('match-summary-confirm')).not.toBeInTheDocument();
    expect(screen.getByTestId('grain-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('grain-separate-hub')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('grain-separate-hub'));
    expect(onChoose).toHaveBeenCalledWith({ kind: 'different-grain-separate-hub' });
  });

  it('different-source-no-key — Create new Hub button only', () => {
    const onChoose = vi.fn();
    render(
      <MatchSummaryCard
        classification={NO_KEY}
        columnShape={{
          matched: [],
          added: ['inspection_ts', 'defect_type'],
          missing: ['weight_g'],
        }}
        onChoose={onChoose}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByTestId('match-summary-confirm')).not.toBeInTheDocument();
    expect(screen.getByTestId('new-hub-suggest')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('new-hub-suggest'));
    expect(onChoose).toHaveBeenCalledWith({ kind: 'different-source-no-key-new-hub' });
  });

  it('renders column shape sub-summary with matched/new/missing', () => {
    render(
      <MatchSummaryCard
        classification={APPEND}
        columnShape={COL_SHAPE}
        onChoose={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/operator/)).toBeInTheDocument();
    expect(screen.getByText(/machine_id/)).toBeInTheDocument();
    expect(screen.getByText(/weight_g/)).toBeInTheDocument();
  });

  it('renders timeline preview when ranges are present', () => {
    render(
      <MatchSummaryCard
        classification={APPEND}
        columnShape={COL_SHAPE}
        onChoose={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByTestId('timeline-preview')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-existing')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-incoming')).toBeInTheDocument();
  });

  it('Cancel button calls onCancel for non-block cases', () => {
    const onCancel = vi.fn();
    render(
      <MatchSummaryCard
        classification={APPEND}
        columnShape={COL_SHAPE}
        onChoose={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByTestId('match-summary-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
