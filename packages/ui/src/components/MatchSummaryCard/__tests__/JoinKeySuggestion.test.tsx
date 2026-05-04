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
// No mocks needed — JoinKeySuggestion is a self-contained presentational component.

import { JoinKeySuggestion } from '../JoinKeySuggestion';
import type { JoinKeyCandidate } from '@variscout/core/matchSummary';

const CANDIDATES: JoinKeyCandidate[] = [
  {
    hubColumn: 'lot_id',
    newColumn: 'lot_id',
    nameMatchScore: 1,
    valueOverlapPct: 1,
    cardinalityCompatible: true,
    totalScore: 1,
  },
  {
    hubColumn: 'batch_id',
    newColumn: 'batch',
    nameMatchScore: 0.5,
    valueOverlapPct: 0.8,
    cardinalityCompatible: true,
    totalScore: 0.68,
  },
];

describe('JoinKeySuggestion', () => {
  it('renders nothing when candidates empty', () => {
    const { container } = render(<JoinKeySuggestion candidates={[]} onConfirm={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders ranked candidates with overlap and score percentages', () => {
    render(<JoinKeySuggestion candidates={CANDIDATES} onConfirm={vi.fn()} />);
    expect(screen.getByTestId('join-key-suggestion')).toBeInTheDocument();
    expect(screen.getByTestId('join-key-lot_id')).toBeInTheDocument();
    expect(screen.getByTestId('join-key-batch_id')).toBeInTheDocument();
  });

  it('calls onConfirm with the chosen candidate', () => {
    const onConfirm = vi.fn();
    render(<JoinKeySuggestion candidates={CANDIDATES} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByTestId('join-key-batch_id'));
    expect(onConfirm).toHaveBeenCalledWith(CANDIDATES[1]);
  });

  it('only shows the top 3 candidates', () => {
    const many: JoinKeyCandidate[] = Array.from({ length: 5 }, (_, i) => ({
      hubColumn: `col_${i}`,
      newColumn: `col_${i}`,
      nameMatchScore: 1,
      valueOverlapPct: 1 - i * 0.1,
      cardinalityCompatible: true,
      totalScore: 1 - i * 0.1,
    }));
    render(<JoinKeySuggestion candidates={many} onConfirm={vi.fn()} />);
    expect(screen.getByTestId('join-key-col_0')).toBeInTheDocument();
    expect(screen.getByTestId('join-key-col_2')).toBeInTheDocument();
    expect(screen.queryByTestId('join-key-col_3')).not.toBeInTheDocument();
  });
});
