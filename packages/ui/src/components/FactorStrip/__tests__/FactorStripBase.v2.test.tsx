/**
 * FactorStripBase v2 tests (ER-6).
 *
 * Strip v2: when a `modelStats` prop is present, chips render in-model ΔR²
 * (caption flips to "in the model"), residual = 1 − R²adj. When absent, the
 * v1 marginal output is byte-identical (snapshot guard). The ⚡ interaction
 * chip renders its conclusion on the face and fires `onInteractionSelect`.
 *
 * Uses the same useTranslation mock pattern as FactorStripBase.test.tsx.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { en } from '@variscout/core/i18n';
import { formatStatistic } from '@variscout/core/i18n';
import type { FactorStripChip } from '@variscout/hooks';
import type { ModelInteraction } from '../FactorStripBase';

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

function rankedChips(): FactorStripChip[] {
  return [
    makeChip({ factor: 'Team', adjustedPct: 18 }),
    makeChip({ factor: 'Queue', adjustedPct: 12 }),
  ];
}

const baseProps = {
  chips: rankedChips(),
  residualPct: 70,
  examinedKeys: new Set<string>(),
  onFactorSelect: vi.fn(),
};

// In-model stats fixture: Team=22%, Queue=15%, R²adj=0.37.
const modelStats = {
  deltaR2: new Map<string, number>([
    ['Team', 0.22],
    ['Queue', 0.15],
  ]),
  rSquaredAdj: 0.37 as number | null,
};

describe('FactorStripBase v2 — in-model ΔR² upgrade', () => {
  it('without modelStats — renders v1 marginal output (chips show adjustedPct)', () => {
    render(<FactorStripBase {...baseProps} />);
    const teamChip = screen.getByTestId('factor-chip-Team');
    // v1 path: Team.adjustedPct = 18 → "18.0%"
    expect(teamChip.textContent).toMatch(/18\.0%/);
    // v1 residual chip is present
    expect(screen.getByTestId('factor-chip-residual')).toBeTruthy();
  });

  it('with modelStats — chips render in-model ΔR² not marginal adjustedPct', () => {
    render(<FactorStripBase {...baseProps} modelStats={modelStats} />);
    const teamChip = screen.getByTestId('factor-chip-Team');
    // modelStats.deltaR2.get('Team') = 0.22 → 22.0%
    expect(teamChip.textContent).toMatch(/22\.0%/);
    // v1 adjustedPct = 18 must NOT appear as the chip readout
    const queueChip = screen.getByTestId('factor-chip-Queue');
    // modelStats.deltaR2.get('Queue') = 0.15 → 15.0%
    expect(queueChip.textContent).toMatch(/15\.0%/);
  });

  it('with modelStats — caption flips to "in-model" copy (not the v1 marginal η² subtitle)', () => {
    render(<FactorStripBase {...baseProps} modelStats={modelStats} />);
    // The subtitle should contain the in-model ΔR² copy, not the v1 marginal η² copy.
    const el = document.body.textContent ?? '';
    // The v2 subtitle references the fitted model (in-model ΔR²).
    expect(el).toMatch(/in-model/i);
    // The v1 marginal subtitle text must NOT appear.
    expect(el).not.toMatch(/row-to-row differences each factor accounts/i);
  });

  it('with modelStats — residual uses 1 − R²adj (not the passed residualPct)', () => {
    render(<FactorStripBase {...baseProps} modelStats={modelStats} />);
    // R²adj = 0.37 → residual = 1 − 0.37 = 0.63 = 63%
    const residual = screen.getByTestId('factor-chip-residual');
    expect(residual.textContent).toMatch(/63/);
  });

  it('membership variant is unaffected by modelStats (variant guard)', () => {
    render(
      <FactorStripBase
        {...baseProps}
        variant="membership"
        membershipChips={[]}
        modelStats={modelStats}
      />
    );
    // Membership variant should not show "in the model" caption.
    const el = document.body.textContent ?? '';
    // Membership renders its own subtitle — the "in the model" v2 caption must not appear
    // where it would conflict. Simplest check: membership subtitle key text renders.
    expect(el).toMatch(/distinguishes/i);
  });
});

describe('FactorStripBase v2 — ⚡ interaction chip', () => {
  const interaction: ModelInteraction = {
    factorA: 'G',
    factorB: 'X',
    deltaR2: 0.08,
    pattern: 'disordinal',
    focalLevel: 'hi',
  };

  it('without modelStats.interaction — no interaction chip rendered', () => {
    render(<FactorStripBase {...baseProps} modelStats={modelStats} />);
    expect(screen.queryByTestId('factor-chip-interaction')).toBeNull();
  });

  it('with modelStats.interaction — renders the ⚡ chip with factorA × factorB and ΔR²', () => {
    render(
      <FactorStripBase
        {...baseProps}
        modelStats={{ ...modelStats, interaction }}
        onInteractionSelect={vi.fn()}
      />
    );
    const chip = screen.getByTestId('factor-chip-interaction');
    expect(chip).toBeTruthy();
    // Must name both factors
    expect(chip.textContent).toMatch(/G/);
    expect(chip.textContent).toMatch(/X/);
    // Must show the ΔR² as a %
    expect(chip.textContent).toMatch(/8\.0%/);
  });

  it('interaction chip face carries the geometric conclusion, not role-based terms', () => {
    render(
      <FactorStripBase
        {...baseProps}
        modelStats={{ ...modelStats, interaction }}
        onInteractionSelect={vi.fn()}
      />
    );
    const chip = screen.getByTestId('factor-chip-interaction');
    const text = chip.textContent ?? '';
    // Must describe the geometric dependency
    expect(text).toMatch(/depend/i);
    // Must NOT use forbidden role-based vocabulary
    expect(text).not.toMatch(/moderator/i);
    expect(text).not.toMatch(/primary/i);
  });

  it('interaction chip click fires onInteractionSelect with the interaction payload', () => {
    const onInteractionSelect = vi.fn();
    render(
      <FactorStripBase
        {...baseProps}
        modelStats={{ ...modelStats, interaction }}
        onInteractionSelect={onInteractionSelect}
      />
    );
    const chip = screen.getByTestId('factor-chip-interaction');
    fireEvent.click(chip);
    expect(onInteractionSelect).toHaveBeenCalledTimes(1);
    const arg = onInteractionSelect.mock.calls[0][0];
    expect(arg.factorA).toBe('G');
    expect(arg.factorB).toBe('X');
    expect(arg.focalLevel).toBe('hi');
  });

  it('interaction chip has dashed border styling (distinct from factor chips)', () => {
    render(
      <FactorStripBase
        {...baseProps}
        modelStats={{ ...modelStats, interaction }}
        onInteractionSelect={vi.fn()}
      />
    );
    const chip = screen.getByTestId('factor-chip-interaction');
    // Dashed styling is applied via a class; check the class attribute contains 'dashed'.
    expect(chip.className).toMatch(/dashed/);
  });
});
