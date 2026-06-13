/**
 * Tests for FactorStripBase defect-rate-share variant (ER-5b).
 *
 * Covers:
 *   - variant='defect-rate-share' renders defect-rate chips
 *   - Honesty subtitle is present ("rate concentration — not % of variation")
 *   - topLevel annotation rendered for the most over-concentrated level
 *   - Star on the first significant chip with "largest share" title
 *   - Magnitude snapshot is byte-identical (regression guard)
 *   - Membership snapshot is byte-identical (regression guard)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { en } from '@variscout/core/i18n';
import { formatStatistic } from '@variscout/core/i18n';
import type { FactorStripChip, MembershipChip, DefectRateChip } from '@variscout/hooks';

// ---- Mock useTranslation BEFORE the component import -------------------------
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

// ---- Chip factories ---------------------------------------------------------

function makeMagnitudeChip(over: Partial<FactorStripChip> = {}): FactorStripChip {
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

function makeMembershipChip(over: Partial<MembershipChip> = {}): MembershipChip {
  return {
    factor: 'Queue',
    separation: 0.72,
    pValue: 0.001,
    isSignificant: true,
    df: 1,
    n: 200,
    binnedForRanking: false,
    topLevel: { level: 'Billing', lift: 3.1 },
    isSelected: false,
    ...over,
  };
}

function makeDefectRateChip(over: Partial<DefectRateChip> = {}): DefectRateChip {
  return {
    factor: 'Queue',
    concentration: 0.45,
    isSignificant: true,
    perLevel: [
      { level: 'Billing', rate: 0.9, share: 1.8, n: 10 },
      { level: 'Claims', rate: 0.1, share: 0.2, n: 10 },
    ],
    topLevel: { level: 'Billing', rate: 0.9 },
    ...over,
  };
}

const baseProps = {
  chips: [makeMagnitudeChip()],
  residualPct: 82,
  examinedKeys: new Set<string>(),
  onFactorSelect: vi.fn(),
};

describe('FactorStripBase — defect-rate-share variant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the defect-rate title "What drives the defect rate?"', () => {
    const drChips: DefectRateChip[] = [makeDefectRateChip()];
    render(
      <FactorStripBase {...baseProps} variant="defect-rate-share" defectRateChips={drChips} />
    );
    expect(screen.getByText('What drives the defect rate?')).toBeDefined();
  });

  it('renders the honesty subtitle (rate concentration — not % of variation)', () => {
    const drChips: DefectRateChip[] = [makeDefectRateChip()];
    render(
      <FactorStripBase {...baseProps} variant="defect-rate-share" defectRateChips={drChips} />
    );
    // The subtitle must contain "rate concentration" and "not % of variation"
    expect(screen.getByText(/rate concentration/)).toBeDefined();
    expect(screen.getByText(/not % of variation/)).toBeDefined();
  });

  it('renders a chip for each defect-rate factor', () => {
    const drChips: DefectRateChip[] = [
      makeDefectRateChip({ factor: 'Queue', concentration: 0.45 }),
      makeDefectRateChip({ factor: 'Shift', concentration: 0.05, isSignificant: false }),
    ];
    render(
      <FactorStripBase {...baseProps} variant="defect-rate-share" defectRateChips={drChips} />
    );
    expect(screen.getByTestId('factor-chip-Queue')).toBeDefined();
    expect(screen.getByTestId('factor-chip-Shift')).toBeDefined();
  });

  it('renders topLevel annotation for the most over-concentrated level', () => {
    const drChips: DefectRateChip[] = [makeDefectRateChip()];
    render(
      <FactorStripBase {...baseProps} variant="defect-rate-share" defectRateChips={drChips} />
    );
    // The chip should show the Billing level annotation
    expect(screen.getByTestId('factor-chip-defect-rate-top-level')).toBeDefined();
    expect(screen.getByTestId('factor-chip-defect-rate-top-level').textContent).toContain(
      'Billing'
    );
  });

  it('stars the first significant chip with "largest share" title', () => {
    const drChips: DefectRateChip[] = [
      makeDefectRateChip({ factor: 'Queue', concentration: 0.45, isSignificant: true }),
      makeDefectRateChip({ factor: 'Shift', concentration: 0.05, isSignificant: false }),
    ];
    render(
      <FactorStripBase {...baseProps} variant="defect-rate-share" defectRateChips={drChips} />
    );
    const star = screen.getByTestId('factor-chip-defect-rate-star');
    expect(star.getAttribute('title')).toBe('largest share');
    // Only one star
    expect(screen.getAllByTestId('factor-chip-defect-rate-star')).toHaveLength(1);
  });

  it('magnitude render path is byte-identical (snapshot guard)', () => {
    const { container } = render(<FactorStripBase {...baseProps} />);
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('membership render path is byte-identical (snapshot guard)', () => {
    const membershipChips: MembershipChip[] = [makeMembershipChip()];
    const { container } = render(
      <FactorStripBase {...baseProps} variant="membership" membershipChips={membershipChips} />
    );
    expect(container.innerHTML).toMatchSnapshot();
  });
});
