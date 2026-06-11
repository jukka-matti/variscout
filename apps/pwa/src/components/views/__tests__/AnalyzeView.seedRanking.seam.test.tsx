/**
 * PWA AnalyzeView — Seed-3 ranking SEAM test (ER-2 / A3 honesty fix).
 *
 * Verifies that handleSeedFromFactorIntel selects the top-3 factors by
 * adjustedEtaSquared from computeMainEffects, NOT the first three columns in
 * insertion order.
 *
 * Fixture: factors ['Noise','Strong','Medium','Weak'] where Strong has the
 * dominant group separation. Insertion order would seed Noise first; the fixed
 * handler must seed Strong first.
 *
 * Also asserts the fallback path: when the engine returns null (n < 3 / all
 * single-level), the CTA still seeds the first 3 factors in list order — never
 * blocking the action.
 */

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useResizablePanel: () => ({ width: 280, handleMouseDown: vi.fn() }),
  };
});

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    AnalyzeConclusion: () => null,
    FindingsLog: () => <div data-testid="findings-log" />,
    useWallIsMobile: () => false,
    WallCanvas: (props: {
      hubs: Array<{ id: string; name?: string }>;
      onSeedFromFactorIntel?: () => void;
      onWriteHypothesis?: () => void;
    }) => (
      <div data-testid="wall-canvas-empty">
        {props.onWriteHypothesis && (
          <button data-testid="empty-write-hypothesis" onClick={props.onWriteHypothesis}>
            write
          </button>
        )}
        {props.onSeedFromFactorIntel && (
          <button data-testid="empty-seed-factors" onClick={props.onSeedFromFactorIntel}>
            seed
          </button>
        )}
      </div>
    ),
    CommandPalette: () => null,
    Minimap: () => null,
    OverallProblemHeader: () => null,
    ScopeRail: () => null,
    ObjectDetailDrawer: () => null,
    CausesMatrix: () => null,
    useWallKeyboard: () => {},
  };
});

vi.mock('@variscout/core/ai', () => ({
  detectInvestigationPhase: () => null,
}));

vi.mock('@variscout/core/strategy', () => ({
  resolveMode: () => 'standard',
  getStrategy: () => ({ questionStrategy: { evidenceLabel: 'R²' } }),
}));

vi.mock('../../../features/findings/findingsStore', () => ({
  useFindingsStore: (selector: (s: { highlightedFindingId: string | null }) => unknown) =>
    selector({ highlightedFindingId: null }),
}));

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: {
    getState: () => ({ showExplore: vi.fn(), showCharter: vi.fn() }),
  },
}));

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  getAnalyzeInitialState,
  getCanvasViewportInitialState,
  useAnalyzeStore,
  useCanvasViewportStore,
  useProjectStore,
} from '@variscout/stores';
import type { DataRow } from '@variscout/core';
import AnalyzeView from '../AnalyzeView';
import type { ProcessHubId } from '@variscout/core/processHub';

const h = (id: string) => id as ProcessHubId;

// ── Fixture: insertion order ≠ effect order ─────────────────────────────────
// Factors in list order: ['Noise', 'Strong', 'Medium', 'Weak']
// 'Strong' has the largest mean-separation → highest adjustedEtaSquared (~0.60)
// 'Medium' has a moderate separation      → 2nd highest (~0.20)
// 'Noise'  has identical group means      → zero adjustedEtaSquared
// 'Weak'   has minimal separation         → zero adjustedEtaSquared (tied with Noise)
//
// Old code (factors.slice(0,3)): seeds Noise, Strong, Medium (insertion order)
// Fixed code (by rank):           seeds Strong, Medium, Noise or Weak (rank order)
//   → the key assertions: Strong is FIRST, and Noise is NOT first
//
// Grounded against computeMainEffects: Strong=0.5972, Medium=0.2007,
// Noise=0.0000, Weak=0.0000 (verified via tsx 2026-06-11)

const OUTCOME = 'Y';
const FACTORS = ['Noise', 'Strong', 'Medium', 'Weak'];

const RANKED_ROWS: DataRow[] = [
  // Strong: Day≈28-30, Night≈4-11 (large separation)
  // Medium: X≈8-11, Z≈13-16 (moderate separation)
  // Noise:  A and B interleaved at same values (zero separation)
  // Weak:   P and Q also balanced across Strong groups (zero separation)
  { Noise: 'A', Strong: 'Day', Medium: 'X', Weak: 'P', Y: 30 },
  { Noise: 'B', Strong: 'Day', Medium: 'X', Weak: 'Q', Y: 28 },
  { Noise: 'A', Strong: 'Day', Medium: 'Z', Weak: 'P', Y: 16 },
  { Noise: 'B', Strong: 'Day', Medium: 'Z', Weak: 'Q', Y: 14 },
  { Noise: 'B', Strong: 'Night', Medium: 'X', Weak: 'P', Y: 11 },
  { Noise: 'A', Strong: 'Night', Medium: 'X', Weak: 'Q', Y: 9 },
  { Noise: 'B', Strong: 'Night', Medium: 'Z', Weak: 'P', Y: 7 },
  { Noise: 'A', Strong: 'Night', Medium: 'Z', Weak: 'Q', Y: 5 },
  { Noise: 'A', Strong: 'Day', Medium: 'X', Weak: 'P', Y: 29 },
  { Noise: 'B', Strong: 'Day', Medium: 'X', Weak: 'Q', Y: 27 },
  { Noise: 'A', Strong: 'Day', Medium: 'Z', Weak: 'P', Y: 15 },
  { Noise: 'B', Strong: 'Day', Medium: 'Z', Weak: 'Q', Y: 13 },
  { Noise: 'B', Strong: 'Night', Medium: 'X', Weak: 'P', Y: 10 },
  { Noise: 'A', Strong: 'Night', Medium: 'X', Weak: 'Q', Y: 8 },
  { Noise: 'B', Strong: 'Night', Medium: 'Z', Weak: 'P', Y: 6 },
  { Noise: 'A', Strong: 'Night', Medium: 'Z', Weak: 'Q', Y: 4 },
];

function makeProps(
  filteredData: DataRow[],
  factors: string[],
  outcome: string
): React.ComponentProps<typeof AnalyzeView> {
  return {
    canvasViewportHubId: h('hub-test'),
    filteredData: filteredData as Record<string, unknown>[],
    outcome,
    factors,
    handleRestoreFinding: vi.fn(),
    handleSetFindingStatus: vi.fn(),
    drillPath: [],
    columnAliases: {},
    resolvedMode: 'standard' as never,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PWA AnalyzeView — Seed-3 ranking honesty (ER-2 / A3)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    useAnalyzeStore.setState(getAnalyzeInitialState());
    useProjectStore.setState({ outcome: OUTCOME });
  });

  it('seeds hubs in adjustedEtaSquared rank order, not insertion order (Strong first, not Noise first)', () => {
    render(<AnalyzeView {...makeProps(RANKED_ROWS, FACTORS, OUTCOME)} />);

    fireEvent.click(screen.getByTestId('empty-seed-factors'));

    const hubs = useAnalyzeStore.getState().hypotheses;
    expect(hubs).toHaveLength(3);

    // Strong must be first — it has the dominant separation (adjustedEtaSquared ~0.60)
    // Noise is insertion-order first but effect-rank last → must NOT be first in seeded set
    expect(hubs[0].name).toBe('Suspected cause: Strong');
    expect(hubs[0].name).not.toBe('Suspected cause: Noise');

    // Second must be Medium (moderate effect ~0.20)
    expect(hubs[1].name).toBe('Suspected cause: Medium');

    // All three have the "Suspected cause:" prefix (P5 invariant)
    for (const hub of hubs) {
      expect(hub.name).toMatch(/^Suspected cause:/);
    }
  });

  it('seeds exactly 3 factors when 4 are available', () => {
    render(<AnalyzeView {...makeProps(RANKED_ROWS, FACTORS, OUTCOME)} />);

    fireEvent.click(screen.getByTestId('empty-seed-factors'));

    expect(useAnalyzeStore.getState().hypotheses).toHaveLength(3);
  });

  it('fallback: engine null (n<3) → seeds first 3 factors in list order, CTA still works', () => {
    // Only 2 rows — engine returns null (n < 3 per factor)
    const tinyRows: DataRow[] = [
      { Noise: 'A', Strong: 'Day', Y: 10 },
      { Noise: 'B', Strong: 'Night', Y: 20 },
    ];

    render(<AnalyzeView {...makeProps(tinyRows, ['Alpha', 'Beta', 'Gamma', 'Delta'], OUTCOME)} />);

    fireEvent.click(screen.getByTestId('empty-seed-factors'));

    const hubs = useAnalyzeStore.getState().hypotheses;
    expect(hubs).toHaveLength(3);
    // Fallback preserves list order (Alpha, Beta, Gamma)
    expect(hubs[0].name).toBe('Suspected cause: Alpha');
    expect(hubs[1].name).toBe('Suspected cause: Beta');
    expect(hubs[2].name).toBe('Suspected cause: Gamma');
  });

  it('fallback: no outcome → seeds first 3 in list order (CTA still works)', () => {
    useProjectStore.setState({ outcome: null });

    render(
      <AnalyzeView
        {...makeProps(RANKED_ROWS, ['Alpha', 'Beta', 'Gamma', 'Delta'], OUTCOME)}
        outcome={null}
      />
    );

    fireEvent.click(screen.getByTestId('empty-seed-factors'));

    const hubs = useAnalyzeStore.getState().hypotheses;
    expect(hubs).toHaveLength(3);
    expect(hubs[0].name).toBe('Suspected cause: Alpha');
  });
});
