/**
 * WallCanvas factor-glyph + Finding-mediated edge SEAM test (PR-CS-12 slice A).
 *
 * Renders the PRODUCTION WallCanvas and asserts:
 *  - one FactorGlyph per candidate factor (band row),
 *  - Finding-mediated signed factor↔hypothesis edges (support/refute), keyed by
 *    the namespaced `factor:${column}` source id,
 *  - a LOAD-BEARING negative control: a distractor factor no finding mentions
 *    draws NO edge,
 *  - glyph click writes `factor:${key}` into the single viewStore focus field +
 *    dims the unrelated glyph,
 *  - the domain-weighting WIRING: a high-contribution-but-graph-distant factor
 *    is lifted off the DIM floor (MID), which the unweighted `focusOpacity`
 *    path cannot produce — reverting `focusFor` to `focusOpacity` MUST fail
 *    that test.
 *
 * Fixtures use the `createFinding` / `createHypothesis` factories (ui/CLAUDE.md
 * — never bare domain literals).
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { WallCanvas } from '../WallCanvas';
import type { WallCanvasModelBuilderProps } from '../WallCanvas';
import {
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  useViewStore,
  getViewInitialState,
} from '@variscout/stores';
import { createFinding, createHypothesis } from '@variscout/core';
import type { Finding, Hypothesis } from '@variscout/core';

// ── Findings: a supporting finding captured under Line=B, a counter under Temp=high ──
const supportFinding: Finding = {
  ...createFinding('Line B runs spike', { Line: ['B'] }, null, undefined, 'observed', undefined),
  id: 'f-support',
};
const counterFinding: Finding = {
  ...createFinding(
    'High temp holds spec',
    { Temp: ['high'] },
    null,
    undefined,
    'observed',
    undefined
  ),
  id: 'f-counter',
};

const hub1: Hypothesis = {
  ...createHypothesis('Line B drives lead time', '', ['f-support', 'f-counter']),
  id: 'hub-1',
  counterFindingIds: ['f-counter'],
};

// ── Band rows: outcome strongly driven by Noise (the distractor) so its ΔR² is
//    the max → contribution01 normalizes to 1.0. ≥5 rows so the engine models. ──
const bandRows = [
  { Line: 'A', Temp: 'low', Noise: 'q', lead_time: 1 },
  { Line: 'B', Temp: 'low', Noise: 'q', lead_time: 2 },
  { Line: 'A', Temp: 'high', Noise: 'q', lead_time: 3 },
  { Line: 'B', Temp: 'high', Noise: 'loud', lead_time: 50 },
  { Line: 'A', Temp: 'low', Noise: 'loud', lead_time: 51 },
  { Line: 'B', Temp: 'high', Noise: 'loud', lead_time: 52 },
];

const modelBuilderProps: WallCanvasModelBuilderProps = {
  candidateFactors: ['Line', 'Temp', 'Noise'],
  scopeLabel: 'All data',
  scopeRows: bandRows,
};

const findings: Finding[] = [supportFinding, counterFinding];

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useViewStore.setState(getViewInitialState());
});

function renderWall() {
  return render(
    <WallCanvas
      hubs={[hub1]}
      findings={findings}
      problemCpk={0.78}
      eventsPerWeek={42}
      rows={bandRows}
      outcomeColumn="lead_time"
      modelBuilderProps={modelBuilderProps}
    />
  );
}

describe('WallCanvas factor glyphs + Finding-mediated edges', () => {
  it('renders a glyph per candidate factor', () => {
    const { queryByTestId } = renderWall();
    expect(queryByTestId('factor-glyph-Line')).not.toBeNull();
    expect(queryByTestId('factor-glyph-Temp')).not.toBeNull();
    expect(queryByTestId('factor-glyph-Noise')).not.toBeNull();
  });

  it('draws signed Finding-mediated edges (support + refute)', () => {
    const { container } = renderWall();
    const supportEdge = container.querySelector(
      '[data-factor-edge="factor:Line→hub-1"][data-factor-edge-kind="factor-support"]'
    );
    const refuteEdge = container.querySelector(
      '[data-factor-edge="factor:Temp→hub-1"][data-factor-edge-kind="factor-refute"]'
    );
    expect(supportEdge).not.toBeNull();
    expect(refuteEdge).not.toBeNull();
  });

  it('NEGATIVE CONTROL: the distractor factor (no finding mentions it) draws no edge', () => {
    const { container } = renderWall();
    expect(container.querySelector('[data-factor-edge^="factor:Noise"]')).toBeNull();
  });

  it('clicking a glyph focuses factor:${key} and dims the unrelated factor below the focal node', () => {
    const { getByTestId } = renderWall();
    expect(useViewStore.getState().focusedWallEntityId).toBeNull();
    fireEvent.click(getByTestId('factor-glyph-Line'));
    expect(useViewStore.getState().focusedWallEntityId).toBe('factor:Line');

    // Noise shares no edge with factor:Line → graph-distant (doi >= 2) and
    // strictly dimmer than the focal Line glyph (doi 0). (Domain weighting keeps
    // it off the absolute floor since Noise is the top-ΔR² factor; the relative
    // ordering is the load-bearing assertion for the focus wiring.)
    const line = getByTestId('factor-glyph-Line');
    const noise = getByTestId('factor-glyph-Noise');
    expect(Number(noise.getAttribute('data-doi'))).toBeGreaterThanOrEqual(2);
    expect(Number(noise.getAttribute('opacity'))).toBeLessThan(
      Number(line.getAttribute('opacity'))
    );
  });

  it('MUTATION GUARD: domain weighting lifts a high-contribution distant factor off the DIM floor', () => {
    // Focus the hub: Noise is graph-distant (no Finding mentions it → DOI 2,
    // unweighted = 0.25 DIM). But Noise drives the outcome → top ΔR² →
    // contribution01 = 1.0 → domainWeightedOpacity(2, 1) = 0.55 (MID).
    // Reverting focusFor to unweighted focusOpacity yields 0.25 → fails here.
    useViewStore.getState().setFocusedWallEntity('hub-1');
    const { getByTestId } = renderWall();
    const noise = getByTestId('factor-glyph-Noise');
    expect(Number(noise.getAttribute('opacity'))).toBeCloseTo(0.55, 2);
  });
});
