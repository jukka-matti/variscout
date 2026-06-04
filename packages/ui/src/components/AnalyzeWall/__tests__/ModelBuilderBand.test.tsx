/**
 * ModelBuilderBand component test — renders the REAL band over the REAL engine
 * (no injected stats), proving the vital-few is pre-selected, toggling moves the
 * R²adj/p header live via O(1) lookup, the snap-back restores the suggestion,
 * and capture-as-Finding emits the model snapshot. Deterministic fixtures.
 *
 * A dead band (no engine wiring) renders the empty/too-few state and FAILS the
 * "vital-few pre-selected" + "R²adj header" assertions.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { DataRow } from '@variscout/core';
import { ModelBuilderBand } from '../ModelBuilderBand';

// Wrap the foreignObject in an <svg> so jsdom mounts it without complaint.
function renderInSvg(ui: React.ReactElement) {
  return render(
    <svg width={400} height={300}>
      {ui}
    </svg>
  );
}

/**
 * Shift strongly explains Y; Noise + Machine are decoupled junk.
 * (Mirrors the core selector fixture so the vital few is {Shift}.)
 */
function shiftDominatedRows(): DataRow[] {
  const rows: DataRow[] = [];
  const shiftMean: Record<string, number> = { A: 10, B: 20, C: 30 };
  const wobble = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
  const noiseSeq = ['x', 'x', 'y', 'y', 'x', 'x', 'y', 'y', 'x', 'x', 'y', 'y'];
  const machineSeq = ['m1', 'm1', 'm1', 'm1', 'm2', 'm2', 'm1', 'm1', 'm1', 'm1', 'm2', 'm2'];
  for (const s of ['A', 'B', 'C']) {
    for (let r = 0; r < 12; r++) {
      rows.push({
        Shift: s,
        Noise: noiseSeq[r],
        Machine: machineSeq[r],
        Y: shiftMean[s] + wobble[r],
      });
    }
  }
  return rows;
}

const baseProps = {
  candidateFactors: ['Shift', 'Noise', 'Machine'],
  outcome: 'Y',
  scopeLabel: 'All data',
  x: 0,
  y: 0,
  width: 400,
  height: 300,
};

describe('ModelBuilderBand', () => {
  it('pre-selects the vital few above the line and shows R²adj + per-factor p', () => {
    renderInSvg(<ModelBuilderBand {...baseProps} rows={shiftDominatedRows()} />);

    const kept = screen.getByTestId('model-kept');
    // Shift is pre-selected (the vital few).
    expect(within(kept).getByTestId('model-kept-factor-Shift')).toBeTruthy();
    // R²adj header renders a numeric value.
    expect(screen.getByTestId('model-r2adj').textContent).toMatch(/R²adj\s+\d/);
    // Per-factor p renders for the kept factor.
    expect(screen.getByTestId('model-p-Shift').textContent).toMatch(/p\s+/);
    // Junk factors sit below the line as dimmed candidates.
    const candidates = screen.getByTestId('model-candidates');
    expect(within(candidates).getByTestId('model-candidate-factor-Noise')).toBeTruthy();
  });

  it('toggling a candidate across the line updates the model live (O(1) lookup)', () => {
    const parseR2 = (s: string | null) => parseFloat((s ?? '').replace(/[^\d.]/g, ''));
    renderInSvg(<ModelBuilderBand {...baseProps} rows={shiftDominatedRows()} />);
    const before = parseR2(screen.getByTestId('model-r2adj').textContent);
    // The suggested model has exactly one kept factor (Shift).
    expect(within(screen.getByTestId('model-kept')).queryAllByRole('button')).toHaveLength(1);

    // Add Noise (over-adding junk) → header recomputes via the enumerated subset.
    fireEvent.click(screen.getByTestId('model-candidate-factor-Noise'));

    // Noise is now kept — the band re-rendered the new model.
    expect(
      within(screen.getByTestId('model-kept')).getByTestId('model-kept-factor-Noise')
    ).toBeTruthy();
    expect(within(screen.getByTestId('model-kept')).queryAllByRole('button')).toHaveLength(2);
    // Per-factor p for Noise renders alongside Shift.
    expect(screen.getByTestId('model-p-Noise')).toBeTruthy();
    // Over-adding junk does NOT IMPROVE R²adj (parsimony penalty); it stays ≤ baseline.
    const after = parseR2(screen.getByTestId('model-r2adj').textContent);
    expect(after).toBeLessThanOrEqual(before + 1e-9);
  });

  it('snap-back appears after deviation and restores the suggested model', () => {
    renderInSvg(<ModelBuilderBand {...baseProps} rows={shiftDominatedRows()} />);
    // No snap-back before deviation.
    expect(screen.queryByTestId('model-use-suggested')).toBeNull();

    fireEvent.click(screen.getByTestId('model-candidate-factor-Noise'));
    const snap = screen.getByTestId('model-use-suggested');
    expect(snap).toBeTruthy();

    fireEvent.click(snap);
    // Noise is back below the line; snap-back disappears.
    expect(screen.queryByTestId('model-use-suggested')).toBeNull();
    expect(
      within(screen.getByTestId('model-candidates')).getByTestId('model-candidate-factor-Noise')
    ).toBeTruthy();
  });

  it('capture-as-Finding emits the kept factors + R²adj + scope snapshot', () => {
    const onCaptureModel = vi.fn();
    renderInSvg(
      <ModelBuilderBand
        {...baseProps}
        rows={shiftDominatedRows()}
        onCaptureModel={onCaptureModel}
      />
    );
    fireEvent.click(screen.getByTestId('model-capture'));
    expect(onCaptureModel).toHaveBeenCalledTimes(1);
    const snapshot = onCaptureModel.mock.calls[0][0];
    expect(snapshot.factors).toContain('Shift');
    expect(typeof snapshot.rSquaredAdj).toBe('number');
    expect(snapshot.scopeLabel).toBe('All data');
    expect(snapshot.topFactor).toBe('Shift');
  });

  it('renders the empty state when there is no outcome (dead-wiring guard)', () => {
    renderInSvg(<ModelBuilderBand {...baseProps} rows={shiftDominatedRows()} outcome={null} />);
    expect(screen.getByTestId('model-empty')).toBeTruthy();
    expect(screen.queryByTestId('model-r2adj')).toBeNull();
  });

  it('shows the fit-only-estimate dot when obs-per-predictor is low (overfit warning)', () => {
    // 9 rows, 1 CONTINUOUS factor (decimal values → OLS path) → engine flags a
    // low observation-to-predictor ratio on the winner; the band surfaces the dot.
    const rows: DataRow[] = [
      { Temp: 10.1, Y: 2.0 },
      { Temp: 12.4, Y: 4.1 },
      { Temp: 14.8, Y: 5.9 },
      { Temp: 16.2, Y: 8.05 },
      { Temp: 18.9, Y: 9.95 },
      { Temp: 21.3, Y: 11.7 },
      { Temp: 23.6, Y: 14.2 },
      { Temp: 25.1, Y: 15.8 },
      { Temp: 27.7, Y: 18.3 },
    ];
    renderInSvg(
      <ModelBuilderBand {...baseProps} candidateFactors={['Temp']} outcome="Y" rows={rows} />
    );
    // The model rendered AND the fit-only dot is present for this overfit fixture.
    expect(screen.getByTestId('model-r2adj')).toBeTruthy();
    expect(screen.getByTestId('model-fit-only-dot')).toBeTruthy();
  });

  it('surfaces the redundancy line when removing a high-VIF factor barely moves R²adj', () => {
    // X1 and X2 are near-collinear (X2 ≈ 2·X1); only X1 truly relates to Y. The
    // vital-few default keeps the parsimonious model (X1). Add X2 (collinear, so
    // high VIF, but barely lifts R²adj), then remove it → "redundant not irrelevant".
    const rows: DataRow[] = [];
    for (let i = 0; i < 40; i++) {
      const x1 = i;
      const x2 = 2 * i + (i % 2 === 0 ? 0.01 : -0.01); // near-collinear with x1
      rows.push({ X1: x1, X2: x2, Y: 3 * x1 + (i % 3) });
    }
    renderInSvg(
      <ModelBuilderBand {...baseProps} candidateFactors={['X1', 'X2']} outcome="Y" rows={rows} />
    );

    // The vital-few default keeps ONE of the two near-collinear factors; the
    // OTHER sits below the line. Add the below-the-line one (now both kept, the
    // added one is highly collinear), then remove it again → "redundant".
    const candidateBtns = within(screen.getByTestId('model-candidates')).getAllByRole('button');
    expect(candidateBtns.length).toBeGreaterThan(0);
    const addedTestId = candidateBtns[0].getAttribute('data-testid')!; // model-candidate-factor-XN
    const addedFactor = addedTestId.replace('model-candidate-factor-', '');
    fireEvent.click(candidateBtns[0]); // add it → kept = both

    // Remove the just-added (collinear) factor from the kept model.
    const removeBtn = within(screen.getByTestId('model-kept')).getByTestId(
      `model-kept-factor-${addedFactor}`
    );
    fireEvent.click(removeBtn);

    const hint = screen.getByTestId('model-redundancy');
    expect(hint.textContent).toMatch(/redundant not irrelevant/i);
    // Dismiss clears it (and does not reappear for the same factor).
    fireEvent.click(screen.getByTestId('model-redundancy-dismiss'));
    expect(screen.queryByTestId('model-redundancy')).toBeNull();
  });

  it('chips a scope-constant factor and excludes it from the model', () => {
    renderInSvg(
      <ModelBuilderBand
        {...baseProps}
        rows={shiftDominatedRows()}
        constantFactors={['Machine']}
        scopeLabel="Machine=m1"
      />
    );
    expect(screen.getByTestId('model-constant-factor-Machine')).toBeTruthy();
    expect(screen.getByTestId('model-constant-factor-Machine').textContent).toMatch(
      /constant in scope/i
    );
    // The constant factor is NOT a toggleable candidate.
    expect(screen.queryByTestId('model-candidate-factor-Machine')).toBeNull();
  });

  it('shows a ΔR² (association strength) value for each kept factor', () => {
    renderInSvg(
      <ModelBuilderBand
        rows={shiftDominatedRows()}
        candidateFactors={['Shift', 'Machine', 'Noise']}
        outcome="Y"
        scopeLabel="All data"
        x={0}
        y={0}
        width={320}
        height={260}
      />
    );
    expect(screen.getByTestId('model-deltaR2-Shift')).toBeInTheDocument();
    const text = screen.getByTestId('model-deltaR2-Shift').textContent ?? '';
    expect(text).toMatch(/ΔR²/);
    // Numeric-signal guard: ΔR² must be > 0 for the dominant Shift factor — catches
    // dead-wiring where the engine is disconnected and all values fall back to 0.
    expect(parseFloat(text.replace(/[^\d.]/g, ''))).toBeGreaterThan(0);
  });

  describe('onModelStatsChange (PR-CS-12)', () => {
    it('reports kept factors + ΔR² map once the engine computes, and again on analyst toggle', () => {
      const onModelStatsChange = vi.fn();
      renderInSvg(
        <ModelBuilderBand
          {...baseProps}
          rows={shiftDominatedRows()}
          onModelStatsChange={onModelStatsChange}
        />
      );

      // 1) After initial render: called with { kept: string[], deltaR2: Map }
      expect(onModelStatsChange).toHaveBeenCalled();
      const firstCall = onModelStatsChange.mock.calls[onModelStatsChange.mock.calls.length - 1][0];
      expect(firstCall).not.toBeNull();
      expect(Array.isArray(firstCall.kept)).toBe(true);
      expect(firstCall.kept.length).toBeGreaterThan(0);
      expect(firstCall.deltaR2.get(firstCall.kept[0])).toBeGreaterThanOrEqual(0);

      // 2) Toggle the first kept factor off via the band's real toggle UI.
      const firstKeptFactor = firstCall.kept[0];
      fireEvent.click(screen.getByTestId(`model-kept-factor-${firstKeptFactor}`));

      // The LATEST call's kept must NOT contain the toggled-off factor.
      const latestCall = onModelStatsChange.mock.calls[onModelStatsChange.mock.calls.length - 1][0];
      expect(latestCall).not.toBeNull();
      expect(latestCall.kept).not.toContain(firstKeptFactor);
    });

    it('reports null when the engine cannot compute (no outcome)', () => {
      const onModelStatsChange = vi.fn();
      renderInSvg(
        <ModelBuilderBand
          {...baseProps}
          rows={shiftDominatedRows()}
          outcome={null}
          onModelStatsChange={onModelStatsChange}
        />
      );
      expect(onModelStatsChange).toHaveBeenCalledWith(null);
    });
  });

  it('shows the "association, not a verdict" framing', () => {
    renderInSvg(
      <ModelBuilderBand
        rows={shiftDominatedRows()}
        candidateFactors={['Shift', 'Machine', 'Noise']}
        outcome="Y"
        scopeLabel="All data"
        x={0}
        y={0}
        width={320}
        height={260}
      />
    );
    expect(screen.getByTestId('model-not-a-verdict')).toHaveTextContent(/not a verdict/i);
  });

  /**
   * Conditional structure: globally Region drives Y (0 vs 500 — massive gap);
   * WITHIN Region A, Machine drives the residual (X≈0 vs Y≈8), while Noise is a
   * balanced junk factor with no association anywhere. Region B rows are clustered
   * so tightly that Machine adds no global marginal R² worth keeping.
   * → global vital few = [Region] only; drill to Region=A (Region constant) →
   *   [Machine] (and Noise stays below the line even though it is also eligible).
   *
   * The Region effect (500-unit gap) is ~62× larger than Machine (8 units), so the
   * semipartial R² for Machine after partialling out Region is negligible globally.
   * The wobble cycles -1/0/1 and is balanced within each 6-row cell, so Noise (which
   * only ever differs by wobble) carries exactly zero signal.
   */
  function buildConditionalData(): DataRow[] {
    const rows: DataRow[] = [];
    let i = 0;
    const push = (Region: string, Machine: string, Noise: string, base: number, mEff: number) => {
      for (let r = 0; r < 6; r++) {
        const wobble = (i % 3) - 1; // deterministic -1, 0, 1 rotation (sums to 0 per 6-row cell)
        rows.push({ Region, Machine, Noise, Y: base + mEff + wobble });
        i++;
      }
    };
    // Region A (base 0): Machine drives the residual (X=0, Y=8); Noise is junk.
    push('A', 'X', 'p', 0, 0);
    push('A', 'X', 'q', 0, 0);
    push('A', 'Y', 'p', 0, 8);
    push('A', 'Y', 'q', 0, 8);
    // Region B (base 500): Machine flat, Noise junk.
    push('B', 'X', 'p', 500, 0);
    push('B', 'X', 'q', 500, 0);
    push('B', 'Y', 'p', 500, 0);
    push('B', 'Y', 'q', 500, 0);
    return rows;
  }

  it('re-ranks the vital few when the analyst drills into a scope', () => {
    const all = buildConditionalData();

    // Global view: Region is the vital few; Machine and Noise are below the line.
    const { unmount } = render(
      <svg width={400} height={300}>
        <ModelBuilderBand
          rows={all}
          candidateFactors={['Region', 'Machine', 'Noise']}
          outcome="Y"
          scopeLabel="All data"
          x={0}
          y={0}
          width={320}
          height={260}
        />
      </svg>
    );
    expect(screen.getByTestId('model-kept-factor-Region')).toBeInTheDocument();
    expect(screen.queryByTestId('model-kept-factor-Machine')).not.toBeInTheDocument();
    expect(screen.queryByTestId('model-kept-factor-Noise')).not.toBeInTheDocument();
    unmount();

    // Drilled to Region=A: Region is constant in scope, so Machine AND Noise are
    // both eligible candidates. Keeping Machine but NOT Noise is load-bearing on
    // the band actually re-running the engine over the Region-A rows — it can't
    // pass by merely showing the sole remaining factor.
    const regionA = all.filter((r: DataRow) => r['Region'] === 'A');
    render(
      <svg width={400} height={300}>
        <ModelBuilderBand
          rows={regionA}
          candidateFactors={['Region', 'Machine', 'Noise']}
          outcome="Y"
          scopeLabel="Region = A"
          constantFactors={['Region']}
          x={0}
          y={0}
          width={320}
          height={260}
        />
      </svg>
    );
    expect(screen.getByTestId('model-kept-factor-Machine')).toBeInTheDocument();
    expect(screen.queryByTestId('model-kept-factor-Noise')).not.toBeInTheDocument();
    expect(screen.getByTestId('model-constant-factor-Region')).toBeInTheDocument();
  });
});
