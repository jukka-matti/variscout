/**
 * Rendering + interaction tests for InflectionSidePanel.
 *
 * Uses a seeded PRNG to produce deterministic bimodal Gaussian data so the
 * detection algorithm transitions the panel reliably.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BinnedFactorBinding } from '@variscout/core/binning';
import { InflectionSidePanel, InflectionSidePanelView } from '../InflectionSidePanel';
import { useInflectionBinningState } from '../useInflectionBinningState';

// ============================================================================
// Seeded data fixtures
// ============================================================================

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededNormalSample(rng: () => number, mean: number, std: number): number {
  const u = 1 - rng();
  const v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
}

function bimodalFixture(seed = 101) {
  const rng = mulberry32(seed);
  const values: number[] = [];
  for (let i = 0; i < 50; i++) values.push(seededNormalSample(rng, 10, 3));
  for (let i = 0; i < 50; i++) values.push(seededNormalSample(rng, 50, 3));
  return { values, sortedValues: [...values].sort((a, b) => a - b) };
}

// ============================================================================
// Tests
// ============================================================================

describe('InflectionSidePanel', () => {
  describe('idle state', () => {
    it('renders banner + Detect button when no binding exists', () => {
      const { values, sortedValues } = bimodalFixture();
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[]}
          patchBindings={vi.fn()}
        />
      );
      expect(screen.getByTestId('inflection-banner')).toBeInTheDocument();
      expect(screen.getByTestId('detect-inflections-button')).toBeInTheDocument();
    });

    it('clicking dismiss × hides the banner; Detect button remains', async () => {
      const user = userEvent.setup();
      const { values, sortedValues } = bimodalFixture();
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[]}
          patchBindings={vi.fn()}
        />
      );
      await user.click(screen.getByTestId('dismiss-inflection-banner'));
      expect(screen.queryByTestId('inflection-banner')).not.toBeInTheDocument();
      expect(screen.getByTestId('detect-inflections-button')).toBeInTheDocument();
    });
  });

  describe('proposing state', () => {
    it('clicking Detect on bimodal data shows segment table + Create button', async () => {
      const user = userEvent.setup();
      const { values, sortedValues } = bimodalFixture();
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[]}
          patchBindings={vi.fn()}
        />
      );
      await user.click(screen.getByTestId('detect-inflections-button'));
      expect(screen.getByTestId('inflection-segment-table')).toBeInTheDocument();
      expect(screen.getByTestId('inflection-segment-row-0')).toBeInTheDocument();
      expect(screen.getByTestId('inflection-segment-row-1')).toBeInTheDocument();
      const createButton = screen.getByTestId('create-bin-column-button');
      expect(createButton).toBeInTheDocument();
      expect(createButton).not.toBeDisabled();
    });

    it('clicking Create commits the binding and transitions to committed layout', async () => {
      const user = userEvent.setup();
      const patchBindings = vi.fn();
      const { values, sortedValues } = bimodalFixture();
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[]}
          patchBindings={patchBindings}
        />
      );
      await user.click(screen.getByTestId('detect-inflections-button'));
      await user.click(screen.getByTestId('create-bin-column-button'));
      expect(patchBindings).toHaveBeenCalledTimes(1);
      expect(screen.getByText('X_bin')).toBeInTheDocument();
      expect(screen.getByTestId('remove-binning-button')).toBeInTheDocument();
    });
  });

  describe('committed state', () => {
    const existing: BinnedFactorBinding = {
      id: 'binding-1',
      sourceColumn: 'X',
      cuts: [30],
      levelNames: ['<30', '≥30'],
      detectionMethod: 'gap-ratio-v1',
      detectedAt: '2026-05-28T00:00:00.000Z',
    };

    it('renders committed layout (header + table + Remove button) when an existing binding matches', () => {
      const { values, sortedValues } = bimodalFixture();
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[existing]}
          patchBindings={vi.fn()}
        />
      );
      expect(screen.getByText('X_bin')).toBeInTheDocument();
      expect(screen.getByTestId('inflection-segment-table')).toBeInTheDocument();
      expect(screen.getByTestId('remove-binning-button')).toBeInTheDocument();
    });

    it('renders n + % share + AD p inline on each segment row', () => {
      const { values, sortedValues } = bimodalFixture();
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[existing]}
          patchBindings={vi.fn()}
        />
      );
      // Each row has the "n=… · …%" stat block; with 100 points split near 30
      // both segments have n ≥ 7 so AD p is reported.
      const row0 = screen.getByTestId('inflection-segment-row-0');
      const row1 = screen.getByTestId('inflection-segment-row-1');
      expect(row0.textContent).toMatch(/n=\d+/);
      expect(row0.textContent).toMatch(/AD p=/);
      expect(row1.textContent).toMatch(/n=\d+/);
      expect(row1.textContent).toMatch(/AD p=/);
    });

    describe('Remove binning', () => {
      let confirmSpy: ReturnType<typeof vi.spyOn>;
      beforeEach(() => {
        confirmSpy = vi.spyOn(window, 'confirm');
      });
      afterEach(() => {
        confirmSpy.mockRestore();
      });

      it('clicking Remove binning + confirming calls patchBindings with empty array', async () => {
        confirmSpy.mockReturnValue(true);
        const user = userEvent.setup();
        const patchBindings = vi.fn();
        const { values, sortedValues } = bimodalFixture();
        render(
          <InflectionSidePanel
            sourceColumn="X"
            values={values}
            sortedValues={sortedValues}
            existingBindings={[existing]}
            patchBindings={patchBindings}
          />
        );
        await user.click(screen.getByTestId('remove-binning-button'));
        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(patchBindings).toHaveBeenCalledTimes(1);
        expect(patchBindings).toHaveBeenCalledWith([]);
      });

      it('clicking Remove binning + cancelling does NOT call patchBindings', async () => {
        confirmSpy.mockReturnValue(false);
        const user = userEvent.setup();
        const patchBindings = vi.fn();
        const { values, sortedValues } = bimodalFixture();
        render(
          <InflectionSidePanel
            sourceColumn="X"
            values={values}
            sortedValues={sortedValues}
            existingBindings={[existing]}
            patchBindings={patchBindings}
          />
        );
        await user.click(screen.getByTestId('remove-binning-button'));
        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(patchBindings).not.toHaveBeenCalled();
      });
    });

    it('clicking a segment label opens an inline rename input; Enter commits via patchBindings', async () => {
      const user = userEvent.setup();
      const patchBindings = vi.fn();
      const { values, sortedValues } = bimodalFixture();
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[existing]}
          patchBindings={patchBindings}
        />
      );
      await user.click(screen.getByTestId('inflection-segment-label-0'));
      const input = screen.getByTestId('inflection-segment-rename-input-0');
      await user.clear(input);
      await user.type(input, 'cold{Enter}');
      expect(patchBindings).toHaveBeenCalledTimes(1);
      const args = patchBindings.mock.calls[0][0] as BinnedFactorBinding[];
      expect(args[0].levelNames[0]).toBe('cold');
    });
  });

  describe('N<30 row-count guard', () => {
    it('values.length === 20 → shows insufficient-rows message with count; no banner; no Detect button', () => {
      const values = Array.from({ length: 20 }, (_, i) => i + 1);
      const sortedValues = [...values];
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[]}
          patchBindings={vi.fn()}
        />
      );
      const msg = screen.getByTestId('inflection-insufficient-rows');
      expect(msg).toBeInTheDocument();
      expect(msg.textContent).toMatch(/Need ≥30 rows/);
      expect(msg.textContent).toMatch(/current: 20/);
      expect(screen.queryByTestId('inflection-banner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('detect-inflections-button')).not.toBeInTheDocument();
    });

    it('values.length === 29 → shows insufficient-rows message', () => {
      const values = Array.from({ length: 29 }, (_, i) => i + 1);
      const sortedValues = [...values];
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[]}
          patchBindings={vi.fn()}
        />
      );
      expect(screen.getByTestId('inflection-insufficient-rows')).toBeInTheDocument();
      expect(screen.queryByTestId('detect-inflections-button')).not.toBeInTheDocument();
    });

    it('values.length === 30 → shows Detect button; no insufficient-rows message', () => {
      const values = Array.from({ length: 30 }, (_, i) => i + 1);
      const sortedValues = [...values];
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[]}
          patchBindings={vi.fn()}
        />
      );
      expect(screen.getByTestId('detect-inflections-button')).toBeInTheDocument();
      expect(screen.queryByTestId('inflection-insufficient-rows')).not.toBeInTheDocument();
    });

    it('values.length === 100 → shows Detect button; no insufficient-rows message', () => {
      const { values, sortedValues } = bimodalFixture();
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[]}
          patchBindings={vi.fn()}
        />
      );
      expect(screen.getByTestId('detect-inflections-button')).toBeInTheDocument();
      expect(screen.queryByTestId('inflection-insufficient-rows')).not.toBeInTheDocument();
    });
  });

  describe('per-segment × tooltip (middle-segment merge semantics)', () => {
    it('1-cut binding: × button has no explanatory title (2 segments — direction unambiguous)', () => {
      const oneCut: BinnedFactorBinding = {
        id: 'binding-1',
        sourceColumn: 'X',
        cuts: [30],
        levelNames: ['<30', '≥30'],
        detectionMethod: 'gap-ratio-v1',
        detectedAt: '2026-05-28T00:00:00.000Z',
      };
      const { values, sortedValues } = bimodalFixture();
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[oneCut]}
          patchBindings={vi.fn()}
        />
      );
      const removeBtn = screen.getByTestId('inflection-segment-remove-1');
      expect(removeBtn).not.toHaveAttribute('title');
    });

    it('2-cut binding: middle segment × button explains the merge-left semantics via title', () => {
      const twoCuts: BinnedFactorBinding = {
        id: 'binding-2',
        sourceColumn: 'X',
        cuts: [20, 40],
        levelNames: ['<20', '20-40', '≥40'],
        detectionMethod: 'gap-ratio-v1',
        detectedAt: '2026-05-28T00:00:00.000Z',
      };
      const { values, sortedValues } = bimodalFixture();
      render(
        <InflectionSidePanel
          sourceColumn="X"
          values={values}
          sortedValues={sortedValues}
          existingBindings={[twoCuts]}
          patchBindings={vi.fn()}
        />
      );
      const middleRemove = screen.getByTestId('inflection-segment-remove-1');
      expect(middleRemove).toHaveAttribute('title', 'Remove the cut before this segment');
    });
  });
});

// ============================================================================
// InflectionSidePanelView — controller-based API tests
// ============================================================================

/**
 * Test harness that calls the hook once at parent level and forwards to View.
 * Mirrors how Dashboard.tsx wires the lifted-hook integration.
 */
function ViewHarness({
  sourceColumn,
  values,
  sortedValues,
  existingBindings,
  patchBindings,
}: {
  sourceColumn: string;
  values: number[];
  sortedValues: number[];
  existingBindings: BinnedFactorBinding[];
  patchBindings: (next: BinnedFactorBinding[]) => void;
}) {
  const controller = useInflectionBinningState({
    sourceColumn,
    values,
    sortedValues,
    existingBindings,
    patchBindings,
  });
  return <InflectionSidePanelView sourceColumn={sourceColumn} controller={controller} />;
}

describe('InflectionSidePanelView (controller-based API)', () => {
  it('renders idle state from a fresh controller', () => {
    const { values, sortedValues } = bimodalFixture();
    render(
      <ViewHarness
        sourceColumn="X"
        values={values}
        sortedValues={sortedValues}
        existingBindings={[]}
        patchBindings={vi.fn()}
      />
    );
    expect(screen.getByTestId('detect-inflections-button')).toBeInTheDocument();
  });

  it('Detect + Create drive the controller through commit', async () => {
    const user = userEvent.setup();
    const patchBindings = vi.fn();
    const { values, sortedValues } = bimodalFixture();
    render(
      <ViewHarness
        sourceColumn="X"
        values={values}
        sortedValues={sortedValues}
        existingBindings={[]}
        patchBindings={patchBindings}
      />
    );
    await user.click(screen.getByTestId('detect-inflections-button'));
    await user.click(screen.getByTestId('create-bin-column-button'));
    expect(patchBindings).toHaveBeenCalledTimes(1);
    expect(screen.getByText('X_bin')).toBeInTheDocument();
  });
});
