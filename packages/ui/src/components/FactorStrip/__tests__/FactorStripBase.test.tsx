/**
 * Tests for FactorStripBase (ER-2 — "What explains the variation?").
 *
 * The strip is props-based and reads no store. It ranks candidate factors by
 * cardinality-penalised share of variation (the hook does the math; the strip
 * renders the chips), with honesty copy verbatim from the wireframe.
 *
 * i18n is exercised against the REAL English catalog via a useTranslation mock
 * that interpolates {var} params and formats numbers with the real
 * formatStatistic — so copy + numbers are asserted exactly as a user sees them.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { en } from '@variscout/core/i18n';
import { formatStatistic } from '@variscout/core/i18n';
import type { FactorStripChip } from '@variscout/hooks';

// ---- Mock useTranslation BEFORE the component import (vi.mock is hoisted) ----
vi.mock('@variscout/hooks', () => {
  const interpolate = (key: string, params?: Record<string, string | number>) => {
    let msg = (en as unknown as Record<string, string>)[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        msg = msg.replaceAll(`{${k}}`, String(v));
      }
    }
    return msg;
  };
  return {
    useTranslation: () => ({
      t: (key: string) => (en as unknown as Record<string, string>)[key] ?? key,
      tf: (key: string, params: Record<string, string | number>) => interpolate(key, params),
      locale: 'en',
      formatStat: (value: number, decimals = 2) => formatStatistic(value, 'en', decimals),
      formatNumber: (value: number, decimals = 2) => formatStatistic(value, 'en', decimals),
      formatPct: (value: number, decimals = 1) => formatStatistic(value, 'en', decimals),
    }),
  };
});

import { FactorStripBase } from '../FactorStripBase';

// ---- Chip factory ----
function makeChip(over: Partial<FactorStripChip> = {}): FactorStripChip {
  return {
    factor: 'Team',
    adjustedPct: 18,
    rawPct: 22,
    pValue: 0.0003,
    dfBetween: 3,
    dfWithin: 1596,
    n: 1600,
    isSignificant: true,
    isWeak: false,
    isSelected: false,
    binnedForRanking: false,
    whatIf: undefined,
    ...over,
  };
}

// A ranked set of chips: Team (top) > Queue > Weekday > Tenure > Site (weak).
function rankedChips(): FactorStripChip[] {
  return [
    makeChip({ factor: 'Team', adjustedPct: 18, rawPct: 22 }),
    makeChip({ factor: 'Queue', adjustedPct: 12, rawPct: 14 }),
    makeChip({ factor: 'Weekday', adjustedPct: 6, rawPct: 7 }),
    makeChip({ factor: 'Tenure', adjustedPct: 3, rawPct: 4 }),
    makeChip({ factor: 'Site', adjustedPct: 0.4, rawPct: 0.6, isWeak: true, isSignificant: false }),
  ];
}

const baseProps = {
  residualPct: 82,
  examinedKeys: new Set<string>(),
  onFactorSelect: vi.fn(),
};

describe('FactorStripBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Label row ──────────────────────────────────────────────────────────
  it('renders the unscoped title + subtitle', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} />);
    expect(screen.getByText('What explains the variation?')).toBeDefined();
    expect(screen.getByText(/each factor accounts for \(η²\)/)).toBeDefined();
    expect(screen.getByText(/won't sum to 100%/)).toBeDefined();
  });

  it('retitles to the scoped question when isScoped', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} isScoped />);
    expect(screen.getByText('What explains the variation within this condition?')).toBeDefined();
    expect(screen.queryByText('What explains the variation?')).toBeNull();
  });

  // ── Ranking render order ───────────────────────────────────────────────
  it('renders chips in the engine ranking order (props order preserved)', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} />);
    // Expand the disclosure so all ranks are visible, then check order.
    fireEvent.click(screen.getByTestId('factor-strip-also-screened'));
    const chipEls = screen
      .getAllByTestId(/^factor-chip-/)
      .filter(el => el.getAttribute('data-factor') !== null);
    const order = chipEls.map(el => el.getAttribute('data-factor'));
    expect(order).toEqual(['Team', 'Queue', 'Weekday', 'Tenure', 'Site']);
  });

  // ── Star gating ────────────────────────────────────────────────────────
  it('stars the rank-0 chip only when it is significant, with title "largest share"', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} />);
    const top = screen.getByTestId('factor-chip-Team');
    const star = within(top).getByTestId('factor-chip-star');
    expect(star.getAttribute('title')).toBe('largest share');
    // No other chip carries a star.
    expect(screen.getAllByTestId('factor-chip-star')).toHaveLength(1);
  });

  it('does NOT star a non-significant rank-0 chip', () => {
    const chips = [
      makeChip({ factor: 'Noise', adjustedPct: 0.5, isWeak: true, isSignificant: false }),
      makeChip({ factor: 'Other', adjustedPct: 0.3, isWeak: true, isSignificant: false }),
    ];
    render(<FactorStripBase chips={chips} {...baseProps} />);
    expect(screen.queryByTestId('factor-chip-star')).toBeNull();
  });

  // ── Weak chips ─────────────────────────────────────────────────────────
  it('marks weak chips visibly (still rendered, data-weak=true)', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} />);
    fireEvent.click(screen.getByTestId('factor-strip-also-screened'));
    const weak = screen.getByTestId('factor-chip-Site');
    expect(weak.getAttribute('data-weak')).toBe('true');
    const strong = screen.getByTestId('factor-chip-Team');
    expect(strong.getAttribute('data-weak')).toBe('false');
  });

  // ── Examined glyph ─────────────────────────────────────────────────────
  it('shows an examined ✓ glyph for examined factors only', () => {
    render(
      <FactorStripBase chips={rankedChips()} {...baseProps} examinedKeys={new Set(['Queue'])} />
    );
    expect(
      within(screen.getByTestId('factor-chip-Queue')).getByTestId('factor-chip-check')
    ).toBeDefined();
    expect(
      within(screen.getByTestId('factor-chip-Team')).queryByTestId('factor-chip-check')
    ).toBeNull();
  });

  // ── Binned suffix ──────────────────────────────────────────────────────
  it('annotates binned-for-ranking chips with the (binned) suffix', () => {
    const chips = [makeChip({ factor: 'CallLength', binnedForRanking: true })];
    render(<FactorStripBase chips={chips} {...baseProps} />);
    expect(
      within(screen.getByTestId('factor-chip-CallLength')).getByText('(binned)')
    ).toBeDefined();
  });

  // ── Common-scale bars ──────────────────────────────────────────────────
  it('normalizes bar widths to the largest share (max → 72px, floor 4px)', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} />);
    fireEvent.click(screen.getByTestId('factor-strip-also-screened'));
    const topBar = within(screen.getByTestId('factor-chip-Team')).getByTestId('factor-chip-bar');
    const weakBar = within(screen.getByTestId('factor-chip-Site')).getByTestId('factor-chip-bar');
    // Team is the max (18) → 72px. Site (0.4) → max(4, 0.4/18*72=1.6) → 4px floor.
    expect(topBar.style.width).toBe('72px');
    expect(weakBar.style.width).toBe('4px');
  });

  // ── Active (selected) chip ─────────────────────────────────────────────
  it('marks the selectedFactor chip active', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} selectedFactor="Queue" />);
    expect(screen.getByTestId('factor-chip-Queue').getAttribute('data-active')).toBe('true');
    expect(screen.getByTestId('factor-chip-Team').getAttribute('data-active')).toBe('false');
  });

  // ── Chip click ─────────────────────────────────────────────────────────
  it('calls onFactorSelect with the factor name on click', () => {
    const onFactorSelect = vi.fn();
    render(
      <FactorStripBase chips={rankedChips()} {...baseProps} onFactorSelect={onFactorSelect} />
    );
    fireEvent.click(screen.getByTestId('factor-chip-Weekday'));
    expect(onFactorSelect).toHaveBeenCalledWith('Weekday');
  });

  // ── Chip hover title (p/df/joint n) ───────────────────────────────────
  it('exposes p · df · joint n in the chip title attribute', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} />);
    const top = screen.getByTestId('factor-chip-Team');
    const title = top.getAttribute('title') ?? '';
    expect(title).toContain('p=');
    expect(title).toContain('df=3,1596');
    // M-6: title uses "joint n=" to distinguish from the per-factor n in the what-if card.
    expect(title).toContain('joint n=1600');
  });

  // ── Keyboard accessibility on chips ────────────────────────────────────
  it('fires onFactorSelect on Enter keydown (keyboard a11y)', () => {
    const onFactorSelect = vi.fn();
    render(
      <FactorStripBase chips={rankedChips()} {...baseProps} onFactorSelect={onFactorSelect} />
    );
    fireEvent.keyDown(screen.getByTestId('factor-chip-Team'), { key: 'Enter' });
    expect(onFactorSelect).toHaveBeenCalledWith('Team');
  });

  it('fires onFactorSelect on Space keydown (keyboard a11y)', () => {
    const onFactorSelect = vi.fn();
    render(
      <FactorStripBase chips={rankedChips()} {...baseProps} onFactorSelect={onFactorSelect} />
    );
    fireEvent.keyDown(screen.getByTestId('factor-chip-Queue'), { key: ' ' });
    expect(onFactorSelect).toHaveBeenCalledWith('Queue');
  });

  it('exposes aria-label equal to the factor name on each chip', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} />);
    expect(screen.getByTestId('factor-chip-Team').getAttribute('aria-label')).toBe('Team');
    expect(screen.getByTestId('factor-chip-Weekday').getAttribute('aria-label')).toBe('Weekday');
  });

  // ── Residual chip ──────────────────────────────────────────────────────
  it('renders the residual chip with the mandatory ~ prefix and copy', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} residualPct={82} />);
    const residual = screen.getByTestId('factor-chip-residual');
    expect(residual.textContent).toContain('~82%');
    expect(residual.textContent).toContain('not tied to these factors');
    // Honest hover title (adapted from the mockup).
    expect(residual.getAttribute('title')).toContain('Residual of the joint model');
    expect(residual.getAttribute('title')).toContain('row-to-row');
  });

  it('omits the residual chip when residualPct is null', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} residualPct={null} />);
    expect(screen.queryByTestId('factor-chip-residual')).toBeNull();
  });

  // ── Disclosure: top-3 + selected expanded; +N collapsed ────────────────
  it('renders only the top-3 ranked chips expanded, collapsing the rest under "+N also screened"', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} />);
    // Top 3 visible.
    expect(screen.getByTestId('factor-chip-Team')).toBeDefined();
    expect(screen.getByTestId('factor-chip-Queue')).toBeDefined();
    expect(screen.getByTestId('factor-chip-Weekday')).toBeDefined();
    // Ranks 4 + 5 collapsed.
    expect(screen.queryByTestId('factor-chip-Tenure')).toBeNull();
    expect(screen.queryByTestId('factor-chip-Site')).toBeNull();
    // The disclosure row shows the remaining count (2).
    expect(screen.getByTestId('factor-strip-also-screened').textContent).toContain(
      '+2 also screened'
    );
  });

  it('expands the collapsed chips inline when the "also screened" row is clicked', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} />);
    fireEvent.click(screen.getByTestId('factor-strip-also-screened'));
    expect(screen.getByTestId('factor-chip-Tenure')).toBeDefined();
    expect(screen.getByTestId('factor-chip-Site')).toBeDefined();
  });

  it('keeps a framing-selected chip outside the top-3 expanded (selection = prominence)', () => {
    const chips = rankedChips();
    chips[4] = makeChip({ factor: 'Site', adjustedPct: 0.4, isWeak: true, isSelected: true });
    render(<FactorStripBase chips={chips} {...baseProps} />);
    // Rank-4 Site is selected → renders expanded even though it's outside the top-3.
    expect(screen.getByTestId('factor-chip-Site')).toBeDefined();
    // Tenure (rank-3, not selected) stays collapsed → only 1 left under the disclosure.
    expect(screen.queryByTestId('factor-chip-Tenure')).toBeNull();
    expect(screen.getByTestId('factor-strip-also-screened').textContent).toContain(
      '+1 also screened'
    );
  });

  it('does not render the disclosure row when ≤3 chips', () => {
    const chips = rankedChips().slice(0, 3);
    render(<FactorStripBase chips={chips} {...baseProps} />);
    expect(screen.queryByTestId('factor-strip-also-screened')).toBeNull();
  });

  // ── ANOVA link stub ────────────────────────────────────────────────────
  it('shows a transient stub tooltip when the model link is clicked with no handler', () => {
    render(<FactorStripBase chips={rankedChips()} {...baseProps} />);
    const link = screen.getByText('How these % are computed (model & ANOVA) →');
    fireEvent.click(link);
    expect(screen.getByText('coming with the model drawer')).toBeDefined();
  });

  it('calls onAnovaLinkClick when provided (no stub tooltip)', () => {
    const onAnovaLinkClick = vi.fn();
    render(
      <FactorStripBase chips={rankedChips()} {...baseProps} onAnovaLinkClick={onAnovaLinkClick} />
    );
    fireEvent.click(screen.getByText('How these % are computed (model & ANOVA) →'));
    expect(onAnovaLinkClick).toHaveBeenCalled();
    expect(screen.queryByText('coming with the model drawer')).toBeNull();
  });

  // ── What-if hover card ─────────────────────────────────────────────────
  it('renders the full what-if hover card on chip hover when whatIf is present', () => {
    const chips = [
      makeChip({
        factor: 'Team',
        adjustedPct: 18,
        whatIf: {
          bestLevel: 'Team Alpha',
          currentMean: 519,
          projectedMean: 497,
          currentCpk: 0.42,
          projectedCpk: 0.61,
          k: 4,
          n: 1600,
        },
      }),
    ];
    render(
      <FactorStripBase chips={chips} {...baseProps} outcomeLabel="Handle_Time" cpkTarget={1.33} />
    );
    fireEvent.mouseEnter(screen.getByTestId('factor-chip-Team'));
    const card = screen.getByTestId('factor-whatif-card');
    expect(card.textContent).toContain('what-if · everyone matched the best group');
    expect(card.textContent).toContain('If all Team groups matched Team Alpha:');
    expect(card.textContent).toContain('average Handle_Time, all 1600 rows: 519 → 497');
    expect(card.textContent).toContain('Cpk 0.42 → 0.61 (reference 1.33)');
    expect(card.textContent).toContain(
      'the gap is bigger per group — this is the overall average across 4 groups'
    );
  });

  it('uses the scoped average copy ("this condition") in the what-if when isScoped', () => {
    const chips = [
      makeChip({
        factor: 'Team',
        whatIf: { bestLevel: 'Alpha', currentMean: 519, projectedMean: 497, k: 4, n: 1600 },
      }),
    ];
    render(<FactorStripBase chips={chips} {...baseProps} isScoped outcomeLabel="Handle_Time" />);
    fireEvent.mouseEnter(screen.getByTestId('factor-chip-Team'));
    const card = screen.getByTestId('factor-whatif-card');
    expect(card.textContent).toContain('average Handle_Time, this condition: 519 → 497');
    expect(card.textContent).not.toContain('all 1600 rows');
  });

  it('omits the Cpk line in the what-if card when no Cpk is present', () => {
    const chips = [
      makeChip({
        factor: 'Team',
        whatIf: { bestLevel: 'Alpha', currentMean: 519, projectedMean: 497, k: 4, n: 1600 },
      }),
    ];
    render(<FactorStripBase chips={chips} {...baseProps} outcomeLabel="Handle_Time" />);
    fireEvent.mouseEnter(screen.getByTestId('factor-chip-Team'));
    expect(screen.getByTestId('factor-whatif-card').textContent).not.toContain('Cpk');
  });

  it('renders NO what-if block when chip.whatIf is undefined (no-direction case)', () => {
    const chips = [makeChip({ factor: 'Team', whatIf: undefined })];
    render(<FactorStripBase chips={chips} {...baseProps} outcomeLabel="Handle_Time" />);
    fireEvent.mouseEnter(screen.getByTestId('factor-chip-Team'));
    expect(screen.queryByTestId('factor-whatif-card')).toBeNull();
  });

  it('hides the what-if card on mouse leave', () => {
    const chips = [
      makeChip({
        factor: 'Team',
        whatIf: { bestLevel: 'Alpha', currentMean: 519, projectedMean: 497, k: 4, n: 1600 },
      }),
    ];
    render(<FactorStripBase chips={chips} {...baseProps} outcomeLabel="Handle_Time" />);
    fireEvent.mouseEnter(screen.getByTestId('factor-chip-Team'));
    expect(screen.getByTestId('factor-whatif-card')).toBeDefined();
    fireEvent.mouseLeave(screen.getByTestId('factor-chip-Team'));
    expect(screen.queryByTestId('factor-whatif-card')).toBeNull();
  });

  // ── Empty state ────────────────────────────────────────────────────────
  it('renders nothing meaningful when there are no chips', () => {
    const { container } = render(<FactorStripBase chips={[]} {...baseProps} residualPct={null} />);
    expect(screen.queryByTestId(/^factor-chip-/)).toBeNull();
    expect(container).toBeDefined();
  });
});
