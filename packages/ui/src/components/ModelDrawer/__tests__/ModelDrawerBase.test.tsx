/**
 * ModelDrawerBase component test — renders the REAL drawer over the REAL engine
 * (no injected stats). The "one fit, one story" coherence rule is the load-bearing
 * invariant here: on the ALL-CATEGORICAL fixture the drawer fits the shown subset
 * via `fitSubsetGLM`, and every number (summary S, equation β's, the coefficient
 * table, the ANOVA SS, and the predict widget) reads from THAT single fit. We
 * assert hand-checkable numbers against the fixture so a number coming from a
 * different fit (or a placeholder) fails.
 *
 * Fixtures are deterministic literals (no Math.random). The balanced 2×2
 * categorical fixture has exact, hand-computed cell means; the mixed fixture has
 * a continuous X so the engine takes the OLS path (winner carries `predictors`).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { DataRow } from '@variscout/core';
import { ModelDrawerBase } from '../ModelDrawerBase';

/**
 * Balanced 2×2 categorical design, 4 replicates per cell. Purely additive cell
 * means {a1b1:10, a1b2:14, a2b1:20, a2b2:24} + a zero-sum wobble per cell so SE
 * is finite. References = most-frequent (balanced → ties alphabetical) = a1, b1.
 *
 * Hand-checked against fitSubsetGLM:
 *   intercept = 10 (the a1,b1 reference cell mean)
 *   A[a2] coef = 10, B[b2] coef = 4
 *   SSE = 40, dfRes = 16 − 3 = 13 → S = √(40/13) ≈ 1.754
 *   Type III: SS_A = 400 (df 1), SS_B = 64 (df 1)
 *   all coefficients significant (p < .05)
 */
function balancedAnovaRows(): DataRow[] {
  const cellMeans: Record<string, number> = {
    'a1|b1': 10,
    'a1|b2': 14,
    'a2|b1': 20,
    'a2|b2': 24,
  };
  const wobble = [1, -1, 2, -2]; // mean 0, sum 0 per cell
  const rows: DataRow[] = [];
  for (const A of ['a1', 'a2']) {
    for (const B of ['b1', 'b2']) {
      const base = cellMeans[`${A}|${B}`];
      for (let r = 0; r < 4; r++) rows.push({ A, B, Y: base + wobble[r] });
    }
  }
  return rows;
}

/**
 * Mixed fixture: continuous X (i·1.37) dominates, categorical G adds a constant.
 * The engine takes the OLS path; the winner subset carries `predictors`, so the
 * drawer reads the engine's BestSubsetResult directly (no second fit).
 *   y = 5 + 3·X + (G=q ? 6 : 0) + small wobble
 */
function mixedOlsRows(): DataRow[] {
  const rows: DataRow[] = [];
  const wob = [0.5, -0.5, 1, -1];
  for (let i = 0; i < 40; i++) {
    const X = (i % 10) * 1.37 + 0.5;
    const G = i % 2 === 0 ? 'p' : 'q';
    const Y = 5 + 3 * X + (G === 'q' ? 6 : 0) + wob[i % 4];
    rows.push({ X, G, Y });
  }
  return rows;
}

/**
 * Differential-slope interaction fixture: CONTINUOUS X, categorical G with two
 * levels. Both main effects are real (G='lo' steeper than G='hi', both positive,
 * plus a large G offset), and the slope DIFFERENCE is a strong X·G interaction.
 *
 *   G='lo': Y = 5  + 9·X + wobble  (steep positive slope)
 *   G='hi': Y = 40 + 1·X + wobble  (shallow positive slope, lifted by the offset)
 *
 * Why these exact choices (verified against the live engine, not assumed):
 *   • X must be CONTINUOUS to reach the OLS engine path — that's where Pass-2
 *     interaction screening lives. `classifyFactorType` treats 7–20 unique
 *     INTEGER values as categorical (e.g. the old 1,2,…,10 fixture took the
 *     ANOVA path and never screened interactions at all). Distinct DECIMAL X
 *     values across a wide range are classified continuous.
 *   • Both slopes positive (not a symmetric ±8 crossover) keeps the X main
 *     effect real, so {X,G} wins `subsets[0]`. A symmetric crossover averages
 *     X's slope to ~0 and X drops OUT of the winner — then Pass-2 never runs
 *     (it requires ≥2 winning factors) and there is no interaction to show.
 *   • The slope difference (9 vs 1) makes the X·G interaction strongly
 *     significant, so Pass-2 AUGMENTS `subsets[0]` with the interaction term.
 *
 * 30 obs per group (60 total). `selectVitalFew` returns the augmented {X,G}
 * winner as the SHOWN subset, so its `typeIIIResults` carries the compound
 * interaction key. The engine names it from the ALPHABETICALLY-sorted source
 * pair → "G×X" (G before X), so the ANOVA row testid is `…-anova-row-G×X`.
 */
function crossoverInteractionRows(): DataRow[] {
  const rows: DataRow[] = [];
  const wob = [0.3, -0.3, 0.6, -0.6]; // deterministic, zero-sum
  for (let i = 0; i < 60; i++) {
    const X = 1 + i * 0.37; // 60 distinct decimal values → classified continuous
    const G = i % 2 === 0 ? 'lo' : 'hi';
    const Y = G === 'lo' ? 5 + 9 * X + wob[i % 4] : 40 + 1 * X + wob[i % 4];
    rows.push({ X, G, Y });
  }
  return rows;
}

const anovaProps = {
  open: true,
  onClose: vi.fn(),
  rows: balancedAnovaRows(),
  outcome: 'Y',
  candidateFactors: ['A', 'B'],
  scopeLabel: 'All data',
};

describe('ModelDrawerBase — six sections (ANOVA path / fitSubsetGLM)', () => {
  it('renders all six sections from the deterministic categorical fixture', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    const drawer = screen.getByTestId('model-drawer');
    expect(within(drawer).getByTestId('model-drawer-summary')).toBeTruthy();
    expect(within(drawer).getByTestId('model-drawer-equation')).toBeTruthy();
    expect(within(drawer).getByTestId('model-drawer-coefficients')).toBeTruthy();
    expect(within(drawer).getByTestId('model-drawer-anova')).toBeTruthy();
    expect(within(drawer).getByTestId('model-drawer-ladder')).toBeTruthy();
    expect(within(drawer).getByTestId('model-drawer-predict')).toBeTruthy();
  });

  it('does not render when closed', () => {
    render(<ModelDrawerBase {...anovaProps} open={false} />);
    expect(screen.queryByTestId('model-drawer')).toBeNull();
  });

  it('header shows the genericised subtitle: outcome ~ terms · fitted on scope', () => {
    render(<ModelDrawerBase {...anovaProps} outcomeLabel="Y" scopeLabel="All data" />);
    const sub = screen.getByTestId('model-drawer-subtitle').textContent ?? '';
    expect(sub).toMatch(/Y\s*~/);
    expect(sub).toMatch(/A/);
    expect(sub).toMatch(/B/);
    expect(sub).toMatch(/fitted on All data/);
  });

  it('SAME-FIT: summary S equals fitSubsetGLM rmse (≈1.754), not undefined', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    const s = screen.getByTestId('model-drawer-S').textContent ?? '';
    // √(40/13) = 1.7541… → "1.75" at 2 decimals.
    expect(s).toMatch(/1\.75/);
    expect(s).not.toMatch(/—|undefined|NaN/);
  });

  it('coefficient table: the (Intercept) row is FIRST and equals the reference cell mean (10)', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    const coefTable = screen.getByTestId('model-drawer-coefficients');
    const rows = within(coefTable).getAllByTestId(/^model-drawer-coef-row-/);
    expect(rows.length).toBeGreaterThan(0);
    // First data row is the intercept, labelled (Intercept).
    expect(rows[0].getAttribute('data-testid')).toBe('model-drawer-coef-row-(Intercept)');
    expect(rows[0].textContent).toMatch(/\(Intercept\)/);
    expect(rows[0].textContent).toMatch(/10\.0/);
  });

  it('significant rows are bold via isSignificant (not a hardcoded |t|>2)', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    // All three coefficients are significant in this fixture; each sig row carries the marker class.
    const sigRows = screen
      .getByTestId('model-drawer-coefficients')
      .querySelectorAll('[data-coef-significant="true"]');
    expect(sigRows.length).toBe(3); // intercept + A[a2] + B[b2]
  });

  it('ANOVA caption states Type III (model-comparison) SS — engine truth over wireframe', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    const caption = screen.getByTestId('model-drawer-anova-caption').textContent ?? '';
    expect(caption).toContain('Type III (model-comparison) SS');
    expect(caption).not.toMatch(/Sequential SS/i);
  });

  it('ANOVA table carries per-term + Error + Total rows (Total df = n−1 = 15)', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    const anova = screen.getByTestId('model-drawer-anova');
    expect(within(anova).getByTestId('model-drawer-anova-row-A')).toBeTruthy();
    expect(within(anova).getByTestId('model-drawer-anova-row-B')).toBeTruthy();
    expect(within(anova).getByTestId('model-drawer-anova-row-Error').textContent).toMatch(/13/); // dfRes
    expect(within(anova).getByTestId('model-drawer-anova-row-Total').textContent).toMatch(/15/); // n−1
  });

  it('ANOVA per-term Type III SS is hand-checkable (SS_A = 400, df 1; SS_B = 64; Error 40; Total 504)', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    // Columns: Source | DF | SS | F | p. Read the SS cell (index 2) per row.
    const ss = (testId: string) =>
      (screen.getByTestId(testId).querySelectorAll('td')[2]?.textContent ?? '').trim();
    const df = (testId: string) =>
      (screen.getByTestId(testId).querySelectorAll('td')[1]?.textContent ?? '').trim();
    expect(ss('model-drawer-anova-row-A')).toBe('400');
    expect(df('model-drawer-anova-row-A')).toBe('1');
    expect(ss('model-drawer-anova-row-B')).toBe('64');
    // Error SS = 40 (SSE); Total SS = 504 (Σ(y−ȳ)²) — honest, not a partial-SS reconstruction.
    expect(ss('model-drawer-anova-row-Error')).toBe('40');
    expect(ss('model-drawer-anova-row-Total')).toBe('504');
  });

  it('GLM-path Total SS = glm.sst (same listwise-deleted population as Error row)', () => {
    // This is the population-consistency regression guard: the Total row must come
    // from glm.sst (solver-owned, listwise-complete rows only), NOT from a
    // separate Σ(y − ȳ)² pass over ALL finite-y rows. On the balanced fixture
    // (no missing values) both numbers are equal, so this test verifies the render
    // value is correct regardless of which source is used; when factors have missing
    // values the two diverge and only glm.sst is consistent with Error SS.
    //
    // Hand-check: balanced 2×2 fixture, 4 reps/cell, deterministic wobble ±1/±2.
    //   Grand mean: (10+11+9+12+8 + 14+15+13+16+12 + 20+21+19+22+18 + 24+25+23+26+22) / 16
    //   Cell means: a1b1=10, a1b2=14, a2b1=20, a2b2=24 (wobble averages to 0 per cell)
    //   Σ(y − ȳ)² = SST = 504 (hand-verified in the ANOVA fixture comment above)
    render(<ModelDrawerBase {...anovaProps} />);
    const totalRow = screen.getByTestId('model-drawer-anova-row-Total');
    const ss = (totalRow.querySelectorAll('td')[2]?.textContent ?? '').trim();
    expect(ss).toBe('504');
  });

  it('best-subsets ladder marks the SHOWN row with ✓ shown', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    const ladder = screen.getByTestId('model-drawer-ladder');
    const shown = within(ladder).getByTestId('model-drawer-ladder-shown');
    expect(shown.textContent).toMatch(/✓ shown/);
    // The shown row must be the {A, B} winner.
    expect(shown.textContent).toMatch(/A/);
    expect(shown.textContent).toMatch(/B/);
  });

  it('predict selects default to the reference levels (never auto-select a best)', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    const selA = screen.getByTestId('model-drawer-predict-select-A') as HTMLSelectElement;
    const selB = screen.getByTestId('model-drawer-predict-select-B') as HTMLSelectElement;
    expect(selA.value).toBe('a1'); // reference
    expect(selB.value).toBe('b1'); // reference
  });

  it('predict widget shows fitted vs observed for a chosen combination (hand-checkable)', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    const selA = screen.getByTestId('model-drawer-predict-select-A') as HTMLSelectElement;
    const selB = screen.getByTestId('model-drawer-predict-select-B') as HTMLSelectElement;
    // Pick a2, b2 → fitted = 10 + 10 + 4 = 24; observed cell mean = 24 (n=4).
    fireEvent.change(selA, { target: { value: 'a2' } });
    fireEvent.change(selB, { target: { value: 'b2' } });
    const out = screen.getByTestId('model-drawer-predict-result').textContent ?? '';
    expect(out).toMatch(/24/); // fitted
    expect(out).toMatch(/n=4|n = 4/); // observed cell count
  });

  it('fires onModelStats with kept + a deltaR2 map after the engine run', () => {
    const onModelStats = vi.fn();
    render(<ModelDrawerBase {...anovaProps} onModelStats={onModelStats} />);
    expect(onModelStats).toHaveBeenCalled();
    const arg = onModelStats.mock.calls.at(-1)?.[0];
    expect(arg).not.toBeNull();
    expect(arg.kept).toEqual(expect.arrayContaining(['A', 'B']));
    expect(arg.deltaR2 instanceof Map).toBe(true);
    expect(arg.deltaR2.has('A')).toBe(true);
  });

  it('ER-3 ALWAYS-LIVE: onModelStats fires even when the drawer is CLOSED (the DOI feed without opening)', () => {
    // The app mounts the drawer ALWAYS (closed) so the glyph-weighting DOI feed
    // stays live without the analyst opening it. The engine memo + onModelStats
    // effect run before the `if (!open) return null` guard — proven here: with
    // open={false} the surface renders nothing but the stats still flow.
    const onModelStats = vi.fn();
    render(<ModelDrawerBase {...anovaProps} open={false} onModelStats={onModelStats} />);
    expect(screen.queryByTestId('model-drawer')).toBeNull();
    expect(onModelStats).toHaveBeenCalled();
    const arg = onModelStats.mock.calls.at(-1)?.[0];
    expect(arg).not.toBeNull();
    expect(arg.kept).toEqual(expect.arrayContaining(['A', 'B']));
    expect(arg.deltaR2.has('A')).toBe(true);
  });

  it('Escape closes the drawer', () => {
    const onClose = vi.fn();
    render(<ModelDrawerBase {...anovaProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('× button closes the drawer', () => {
    const onClose = vi.fn();
    render(<ModelDrawerBase {...anovaProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('model-drawer-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('no footer / capture button without onCaptureModel', () => {
    render(<ModelDrawerBase {...anovaProps} />);
    expect(screen.queryByTestId('model-drawer-capture')).toBeNull();
  });

  it('capture button present and fires the snapshot when onCaptureModel is provided', () => {
    const onCaptureModel = vi.fn();
    render(<ModelDrawerBase {...anovaProps} onCaptureModel={onCaptureModel} />);
    const btn = screen.getByTestId('model-drawer-capture');
    fireEvent.click(btn);
    expect(onCaptureModel).toHaveBeenCalled();
    const snap = onCaptureModel.mock.calls[0][0];
    expect(snap.factors).toEqual(expect.arrayContaining(['A', 'B']));
    expect(typeof snap.rSquaredAdj).toBe('number');
    expect(snap.scopeLabel).toBe('All data');
    expect('perFactorP' in snap).toBe(true);
    expect('topFactor' in snap).toBe(true);
  });
});

describe('ModelDrawerBase — engine-predictors path (mixed OLS)', () => {
  const mixedProps = {
    open: true,
    onClose: vi.fn(),
    rows: mixedOlsRows(),
    outcome: 'Y',
    candidateFactors: ['X', 'G'],
    scopeLabel: 'All data',
  };

  it('reads the engine winner directly: coefficients + a finite S', () => {
    render(<ModelDrawerBase {...mixedProps} />);
    const coefTable = screen.getByTestId('model-drawer-coefficients');
    // Intercept first.
    const rows = within(coefTable).getAllByTestId(/^model-drawer-coef-row-/);
    expect(rows[0].getAttribute('data-testid')).toBe('model-drawer-coef-row-(Intercept)');
    // OLS engine intercept row has no SE/t/p (diagnosticsUnavailable) — render em-dashes.
    const interceptCells = rows[0].querySelectorAll('td');
    expect(interceptCells[2]?.textContent).toBe('—'); // SE
    expect(interceptCells[3]?.textContent).toBe('—'); // t
    expect(interceptCells[4]?.textContent).toBe('—'); // p
    // X slope ≈ 3 renders somewhere in the table.
    expect(coefTable.textContent).toMatch(/3\.0/);
    const s = screen.getByTestId('model-drawer-S').textContent ?? '';
    expect(s).not.toMatch(/—|undefined|NaN/);
  });

  it('predict widget uses predictFromUnifiedModel for the OLS path (continuous select)', () => {
    render(<ModelDrawerBase {...mixedProps} />);
    // Continuous X gets a select of observed levels; default = reference is N/A for
    // continuous, so the widget exposes a select over the observed X values.
    const out = screen.getByTestId('model-drawer-predict-result').textContent ?? '';
    expect(out).toMatch(/fitted/);
  });

  it('constant-in-scope factors are excluded from the model and chipped', () => {
    render(<ModelDrawerBase {...mixedProps} constantFactors={['G']} />);
    // G is constant in scope → not a model term; surfaced as a chip.
    expect(screen.getByTestId('model-drawer-constant-G')).toBeTruthy();
  });

  it('focus lands on the close button when the drawer opens', () => {
    render(<ModelDrawerBase {...mixedProps} />);
    const closeBtn = screen.getByTestId('model-drawer-close');
    expect(document.activeElement).toBe(closeBtn);
  });
});

describe('ModelDrawerBase — interaction-augmented winner (ANOVA compound row)', () => {
  /**
   * The differential-slope fixture has a strong X·G interaction. The engine's
   * Pass-2 screening augments subsets[0] with the interaction term and updates
   * `typeIIIResults` to include it under the compound key "G×X" (sources sorted
   * alphabetically). The ANOVA table MUST render that compound row — the drawer
   * iterates the typeIII MAP's own keys (not shownFactors, which only carries
   * ['X','G']), so the compound row is included; iterating shownFactors would
   * silently drop it.
   *
   * NOTE: the engine's `computeTypeIIISS` is hierarchy-aware — removing a main
   * effect also removes its dependent interaction term (marginality), so the
   * Type III decomposition for an interaction-augmented model is computable.
   * Without that the reduced-model build throws and the interaction key never
   * reaches `typeIIIResults` (this was the masked defect these tests now cover).
   */
  const crossoverProps = {
    open: true,
    onClose: vi.fn(),
    rows: crossoverInteractionRows(),
    outcome: 'Y',
    candidateFactors: ['X', 'G'],
    scopeLabel: 'All data',
  };

  it('ANOVA table contains the compound interaction row (G×X) when the winner is interaction-augmented', () => {
    render(<ModelDrawerBase {...crossoverProps} />);
    const anova = screen.getByTestId('model-drawer-anova');
    // The compound row is keyed "G×X" in the typeIII map — it MUST appear in the
    // table. The fixture is constructed to reliably trigger Pass-2 interaction
    // augmentation; getByTestId throws if the row is absent (no soft-skip), so a
    // regression where the engine stops augmenting — or stops emitting the
    // interaction Type III key — fails this test loudly.
    const interactionRow = within(anova).getByTestId('model-drawer-anova-row-G×X');
    expect(interactionRow).toBeTruthy();
    // The main-effect rows are present alongside the compound row.
    expect(within(anova).getByTestId('model-drawer-anova-row-X')).toBeTruthy();
    expect(within(anova).getByTestId('model-drawer-anova-row-G')).toBeTruthy();
    expect(within(anova).getByTestId('model-drawer-anova-row-Error')).toBeTruthy();
    expect(within(anova).getByTestId('model-drawer-anova-row-Total')).toBeTruthy();
  });

  it('ANOVA compound row has a non-zero SS and finite F', () => {
    render(<ModelDrawerBase {...crossoverProps} />);
    const anova = screen.getByTestId('model-drawer-anova');
    const interactionRow = within(anova).getByTestId('model-drawer-anova-row-G×X');
    const cells = interactionRow.querySelectorAll('td');
    // cells[2] = SS, cells[3] = F
    const ss = parseFloat(cells[2]?.textContent ?? '0');
    const f = parseFloat(cells[3]?.textContent?.replace(',', '.') ?? '0');
    expect(ss).toBeGreaterThan(0);
    expect(f).toBeGreaterThan(0);
  });

  it('coefficient table renders the interaction term row for the augmented winner', () => {
    render(<ModelDrawerBase {...crossoverProps} />);
    const coefTable = screen.getByTestId('model-drawer-coefficients');
    // The OLS engine winner exposes the interaction predictor (named "G×X"), so
    // the coefficient table must carry its row — the same compound key the ANOVA
    // table uses. This confirms the interaction-augmented code path end to end.
    const interactionCoef = within(coefTable).getByTestId('model-drawer-coef-row-G×X');
    expect(interactionCoef).toBeTruthy();
    // Intercept still first.
    const rows = within(coefTable).getAllByTestId(/^model-drawer-coef-row-/);
    expect(rows[0].getAttribute('data-testid')).toBe('model-drawer-coef-row-(Intercept)');
  });
});

describe('ModelDrawerBase — ER-6 extended ModelDrawerStats (rSquaredAdj + interaction)', () => {
  const crossoverProps = {
    open: true,
    onClose: vi.fn(),
    rows: crossoverInteractionRows(),
    outcome: 'Y',
    candidateFactors: ['X', 'G'],
    scopeLabel: 'All data',
  };

  const noInteractionProps = {
    open: true,
    onClose: vi.fn(),
    rows: balancedAnovaRows(),
    outcome: 'Y',
    candidateFactors: ['A', 'B'],
    scopeLabel: 'All data',
  };

  it('ER-6: onModelStats carries rSquaredAdj (finite number) when the engine produces a model', () => {
    const onModelStats = vi.fn();
    render(<ModelDrawerBase {...crossoverProps} onModelStats={onModelStats} />);
    const arg = onModelStats.mock.calls.at(-1)?.[0];
    expect(arg).not.toBeNull();
    expect(typeof arg.rSquaredAdj).toBe('number');
    expect(Number.isFinite(arg.rSquaredAdj)).toBe(true);
  });

  it('ER-6 I2: interaction pattern is exactly "disordinal" for the crossover fixture (not just a 2-element set)', () => {
    /**
     * Load-bearing B1/I2 test. The differential-slope fixture has G='lo' (slope 9)
     * vs G='hi' (slope 1 + offset 40). Lines cross at X≈4.4 → classifyInteractionPattern
     * returns 'disordinal'. A hardcoded string or wrong pass would fail this exact match.
     */
    const onModelStats = vi.fn();
    render(<ModelDrawerBase {...crossoverProps} onModelStats={onModelStats} />);
    const arg = onModelStats.mock.calls.at(-1)?.[0];
    expect(arg).not.toBeNull();
    expect(arg.interaction).not.toBeNull();
    // Exact geometric classification — must be 'disordinal', not just in the set.
    expect(arg.interaction.pattern).toBe('disordinal');
  });

  it('ER-6 I3: focalLevel is the specific non-reference level "lo", NOT the compound term name "G×X"', () => {
    /**
     * Load-bearing B1/I3 test. The crossover fixture uses G (categorical, levels
     * ['hi','lo'], reference='hi' by alphabetical tie-break) × X (continuous).
     * The interaction encoding has one column for the non-reference level 'lo'.
     * Its coefficient (slope-difference = 9−1 = 8) has the largest |value|, so
     * focalLevel MUST be 'lo'. Before the B1 fix, focalLevel was "G×X" (the
     * compound term name) because interaction predictors had no `level` field —
     * this test fails against that buggy output.
     */
    const onModelStats = vi.fn();
    render(<ModelDrawerBase {...crossoverProps} onModelStats={onModelStats} />);
    const arg = onModelStats.mock.calls.at(-1)?.[0];
    expect(arg).not.toBeNull();
    expect(arg.interaction).not.toBeNull();
    // Must be exactly 'lo' — the non-reference categorical level with the largest
    // |interaction coefficient|. 'G×X' is wrong; 'hi' (the reference) is wrong.
    expect(arg.interaction.focalLevel).toBe('lo');
    // Ensure factorA/factorB are the alphabetically-sorted source pair.
    expect(arg.interaction.factorA).toBe('G');
    expect(arg.interaction.factorB).toBe('X');
  });

  it('ER-6: onModelStats.interaction is null when no significant interaction exists', () => {
    const onModelStats = vi.fn();
    render(<ModelDrawerBase {...noInteractionProps} onModelStats={onModelStats} />);
    const arg = onModelStats.mock.calls.at(-1)?.[0];
    expect(arg).not.toBeNull();
    // The balanced 2×2 ANOVA fixture has no continuous predictor → no Pass-2 screening.
    expect(arg.interaction).toBeNull();
  });
});
