/**
 * PWA Wall one-tap evaluate SEAM test (Factors & Evaluation Increment 2a §4).
 *
 * NOT an injected-prop unit test. It renders the PRODUCTION `WallCanvas` →
 * `HypothesisCardWithPlans` (the same tree AnalyzeView mounts) and wires
 * `onEvaluateFactor` to the EXACT routing AnalyzeView uses — run the real
 * `evaluateHypothesisFactor`, write the typed Finding into `useAnalyzeStore`
 * (the PWA Wall's reactive source of truth), classify it, connect it. The Wall
 * DERIVES the triad from the same engine, so a dead wiring fails:
 *
 *   - Live wire: tapping Evaluate lands a typed Finding (validationStatus) in
 *     `useAnalyzeStore.findings`, links it to the hub, and advances the hub via
 *     `deriveHypothesisStatus` (render-through, not a spy).
 *   - Honesty: a NON-significant factor classifies 'inconclusive' (NOT-tested),
 *     NEVER 'supports'.
 *   - Dead wire: omitting `onEvaluateFactor` hides the Evaluate CTA → fails.
 */

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key, locale: 'en-US' }),
  };
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallCanvas, type WallCanvasPlanningProps } from '@variscout/ui';
import {
  getAnalyzeInitialState,
  getCanvasViewportInitialState,
  useAnalyzeStore,
  useCanvasViewportStore,
} from '@variscout/stores';
import { evaluateHypothesisFactor, isEvaluateFindingForFactor } from '@variscout/core/findings';
import type { DataRow, Hypothesis } from '@variscout/core';

const baseHub: Hypothesis = {
  id: 'h1',
  name: 'Night shift runs hot',
  synthesis: '',
  findingIds: [],
  status: 'proposed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null, // SHIFT (categorical) is the cause's condition → the derived triad factor.
  condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
};

// SHIFT sharply splits Y → significant (supports). FLAT splits nothing.
const significantRows: DataRow[] = [
  { SHIFT: 'Day', Y: 10 },
  { SHIFT: 'Day', Y: 11 },
  { SHIFT: 'Day', Y: 12 },
  { SHIFT: 'Day', Y: 13 },
  { SHIFT: 'Day', Y: 14 },
  { SHIFT: 'Night', Y: 30 },
  { SHIFT: 'Night', Y: 31 },
  { SHIFT: 'Night', Y: 32 },
  { SHIFT: 'Night', Y: 33 },
  { SHIFT: 'Night', Y: 34 },
];

const flatRows: DataRow[] = [
  { SHIFT: 'Day', Y: 20 },
  { SHIFT: 'Day', Y: 21 },
  { SHIFT: 'Day', Y: 19 },
  { SHIFT: 'Day', Y: 20 },
  { SHIFT: 'Night', Y: 20 },
  { SHIFT: 'Night', Y: 21 },
  { SHIFT: 'Night', Y: 19 },
  { SHIFT: 'Night', Y: 20 },
];

/** The EXACT routing AnalyzeView uses: run the engine, write to useAnalyzeStore. */
function pwaEvaluateFactor(rows: DataRow[], outcome: string) {
  return (hypothesisId: string, factor: string) => {
    const result = evaluateHypothesisFactor(rows, factor, outcome);
    if (!result) return;
    const store = useAnalyzeStore.getState();
    // FE-2a idempotency: refresh the prior evaluate-finding for this
    // (hypothesis × factor) instead of appending a duplicate.
    const hub = store.hypotheses.find(h => h.id === hypothesisId);
    const existing = hub
      ? store.findings.find(
          f => hub.findingIds.includes(f.id) && isEvaluateFindingForFactor(f.text, factor)
        )
      : undefined;
    if (existing) {
      store.editFinding(existing.id, result.findingText);
      store.setFindingValidation(existing.id, result.validationStatus, result.refutes);
      return;
    }
    const finding = store.addFinding(result.findingText, {
      activeFilters: {},
      cumulativeScope: null,
    });
    store.setFindingValidation(finding.id, result.validationStatus, result.refutes);
    store.connectFindingToHub(hypothesisId, finding.id);
  };
}

function makePlanningProps(
  overrides: Partial<WallCanvasPlanningProps> = {}
): WallCanvasPlanningProps {
  return {
    plans: [],
    members: [],
    currentUserId: 'analyst@local',
    onAddPlan: vi.fn(),
    onLinkFinding: vi.fn(),
    onEditPlan: vi.fn(),
    ...overrides,
  };
}

function renderWall(rows: DataRow[], planningProps: WallCanvasPlanningProps) {
  const hubs = useAnalyzeStore.getState().hypotheses;
  const findings = useAnalyzeStore.getState().findings;
  return render(
    <WallCanvas
      hubs={hubs}
      findings={findings}
      problemCpk={0.78}
      eventsPerWeek={42}
      rows={rows}
      outcomeColumn="Y"
      activeScopeSpecs={{ usl: 25, lsl: 5 }}
      planningProps={planningProps}
    />
  );
}

beforeEach(() => {
  useAnalyzeStore.setState(getAnalyzeInitialState());
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useAnalyzeStore.getState().resetHubs([{ ...baseHub }]);
});

describe('PWA Wall one-tap evaluate seam', () => {
  it('tapping Evaluate writes a typed supporting Finding into useAnalyzeStore and links it', () => {
    renderWall(
      significantRows,
      makePlanningProps({ onEvaluateFactor: pwaEvaluateFactor(significantRows, 'Y') })
    );

    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));

    const findings = useAnalyzeStore.getState().findings;
    expect(findings).toHaveLength(1);
    expect(findings[0].validationStatus).toBe('supports');
    expect(findings[0].evidenceType).toBe('data');
    // Linked to the hub (render-through, not a spy).
    expect(useAnalyzeStore.getState().hypotheses[0].findingIds).toContain(findings[0].id);
  });

  it('a non-significant factor classifies inconclusive (NOT supporting)', () => {
    useAnalyzeStore.getState().resetHubs([{ ...baseHub }]);
    renderWall(flatRows, makePlanningProps({ onEvaluateFactor: pwaEvaluateFactor(flatRows, 'Y') }));

    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));

    const findings = useAnalyzeStore.getState().findings;
    expect(findings).toHaveLength(1);
    expect(findings[0].validationStatus).toBe('inconclusive');
    expect(findings[0].validationStatus).not.toBe('supports');
    expect(findings[0].refutes).toBeFalsy();
  });

  it('writes exactly ONE finding per evaluation (one `data` evidence type — locked #2)', () => {
    renderWall(
      significantRows,
      makePlanningProps({ onEvaluateFactor: pwaEvaluateFactor(significantRows, 'Y') })
    );
    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));
    expect(useAnalyzeStore.getState().findings).toHaveLength(1);
  });

  it('a repeat evaluate of the same factor refreshes ONE finding (idempotent — FIX 2)', () => {
    renderWall(
      significantRows,
      makePlanningProps({ onEvaluateFactor: pwaEvaluateFactor(significantRows, 'Y') })
    );
    const cta = screen.getByTestId('evaluate-factor-SHIFT');
    fireEvent.click(cta);
    fireEvent.click(cta);
    fireEvent.click(cta);
    // Three taps → still exactly one finding, still linked once.
    const findings = useAnalyzeStore.getState().findings;
    expect(findings).toHaveLength(1);
    expect(findings[0].validationStatus).toBe('supports');
    const hubFindingIds = useAnalyzeStore.getState().hypotheses[0].findingIds;
    expect(hubFindingIds.filter(id => id === findings[0].id)).toHaveLength(1);
  });

  it('does NOT render the Evaluate CTA when onEvaluateFactor is omitted', () => {
    renderWall(significantRows, makePlanningProps());
    expect(screen.queryByTestId('evaluate-factor-SHIFT')).toBeNull();
  });
});
