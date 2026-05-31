/**
 * PWA Wall FE-2b disconfirmation-fusion SEAM test (the anti-green-but-dead gate).
 *
 * NOT an injected-prop unit test. It renders the PRODUCTION `WallCanvas` →
 * `HypothesisCardWithPlans` (the tree AnalyzeView mounts) and wires
 * `onEvaluateFactor` to the EXACT verdict-mechanic routing AnalyzeView uses:
 * run the SAME engine, derive the verdict by inversion, write the typed Finding
 * into `useAnalyzeStore`, connect it, AND record the DisconfirmationAttempt with
 * the finding linked. The Wall derives status from the SAME engine, so a dead
 * wiring fails:
 *
 *   - significant + Try-to-break-it → SURVIVED: a 'supports' finding is linked,
 *     a DisconfirmationAttempt is recorded with verdict 'survived' and the finding
 *     in `linkedFindingIds` (the [] gap closed BY CONSTRUCTION).
 *   - not-significant + Try-to-break-it → REFUTED (the spindle inversion): a
 *     refuting finding is linked → `deriveHypothesisStatus` short-circuits the
 *     hub to 'refuted' (the card goes red).
 *   - plain evaluate (unchecked) is UNCHANGED: not-significant → inconclusive,
 *     no DisconfirmationAttempt.
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
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WallCanvas, type WallCanvasPlanningProps } from '@variscout/ui';
import type { EvaluateFactorOptions } from '@variscout/ui';
import {
  getAnalyzeInitialState,
  getCanvasViewportInitialState,
  useAnalyzeStore,
  useCanvasViewportStore,
} from '@variscout/stores';
import {
  evaluateHypothesisFactor,
  isEvaluateFindingForFactor,
  evaluateDisconfirmation,
  isDisconfirmationFindingForFactor,
} from '@variscout/core/findings';
import { generateDeterministicId } from '@variscout/core/identity';
import { deriveHypothesisStatus } from '@variscout/core/survey';
import type { DataRow, DisconfirmationAttempt, Hypothesis } from '@variscout/core';

const baseHub: Hypothesis = {
  id: 'h1',
  name: 'Night shift runs hot',
  synthesis: '',
  findingIds: [],
  status: 'proposed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  investigationId: 'inv-test',
  condition: { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'Night' },
};

// SHIFT sharply splits Y → significant. FLAT → not significant (the spindle case).
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

/** The EXACT verdict-mechanic routing AnalyzeView.handleEvaluateFactor uses. */
function pwaFusedEvaluate(rows: DataRow[], outcome: string) {
  return (hypothesisId: string, factor: string, options?: EvaluateFactorOptions) => {
    const tryToBreakIt = Boolean(options?.tryToBreakIt);
    const result = tryToBreakIt
      ? evaluateDisconfirmation(rows, factor, outcome)
      : evaluateHypothesisFactor(rows, factor, outcome);
    if (!result) return;
    const store = useAnalyzeStore.getState();
    const matches = (text: string) =>
      tryToBreakIt
        ? isDisconfirmationFindingForFactor(text, factor)
        : isEvaluateFindingForFactor(text, factor);
    const hub = store.hypotheses.find(h => h.id === hypothesisId);
    const existing = hub
      ? store.findings.find(f => hub.findingIds.includes(f.id) && matches(f.text))
      : undefined;
    let findingId: string;
    if (existing) {
      store.editFinding(existing.id, result.findingText);
      store.setFindingValidation(existing.id, result.validationStatus, result.refutes);
      findingId = existing.id;
    } else {
      const finding = store.addFinding(result.findingText, {
        activeFilters: {},
        cumulativeScope: null,
      });
      store.setFindingValidation(finding.id, result.validationStatus, result.refutes);
      store.connectFindingToHub(hypothesisId, finding.id);
      findingId = finding.id;
    }
    if (tryToBreakIt) {
      const attempt: DisconfirmationAttempt = {
        id: generateDeterministicId(),
        attemptedAt: new Date().toISOString(),
        attemptedBy: { displayName: 'Local browser', upn: 'analyst@local' },
        description: (options?.prediction ?? result.findingText).trim(),
        verdict: result.refutes ? 'refuted' : 'survived',
        linkedFindingIds: [findingId],
      };
      store.recordDisconfirmation(hypothesisId, attempt);
    }
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
  return render(
    <WallCanvas
      hubs={useAnalyzeStore.getState().hypotheses}
      findings={useAnalyzeStore.getState().findings}
      problemCpk={0.78}
      eventsPerWeek={42}
      rows={rows}
      outcomeColumn="Y"
      activeScopeSpecs={{ usl: 25, lsl: 5 }}
      planningProps={planningProps}
    />
  );
}

/** Check "Try to break it" for SHIFT, then tap Evaluate. */
function evaluateWithBreakIt() {
  fireEvent.click(within(screen.getByTestId('try-break-it-SHIFT')).getByRole('checkbox'));
  fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));
}

beforeEach(() => {
  useAnalyzeStore.setState(getAnalyzeInitialState());
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useAnalyzeStore.getState().resetHubs([{ ...baseHub }]);
});

describe('PWA Wall — FE-2b fused verdict seam (anti-green-but-dead)', () => {
  it('significant + Try-to-break-it → SURVIVED: supports finding linked + attempt records it', () => {
    renderWall(
      significantRows,
      makePlanningProps({ onEvaluateFactor: pwaFusedEvaluate(significantRows, 'Y') })
    );
    evaluateWithBreakIt();

    const hub = useAnalyzeStore.getState().hypotheses[0];
    const findings = useAnalyzeStore.getState().findings;
    expect(findings).toHaveLength(1);
    expect(findings[0].validationStatus).toBe('supports');
    expect(findings[0].refutes).toBeFalsy();
    const attempts = hub.disconfirmationAttempts ?? [];
    expect(attempts).toHaveLength(1);
    expect(attempts[0].verdict).toBe('survived');
    // The [] gap closed BY CONSTRUCTION — the evaluate made the finding.
    expect(attempts[0].linkedFindingIds).toEqual([findings[0].id]);
  });

  it('not-significant + Try-to-break-it → REFUTED (spindle inversion): card goes red', () => {
    renderWall(flatRows, makePlanningProps({ onEvaluateFactor: pwaFusedEvaluate(flatRows, 'Y') }));
    evaluateWithBreakIt();

    const hub = useAnalyzeStore.getState().hypotheses[0];
    const findings = useAnalyzeStore.getState().findings;
    expect(findings[0].refutes).toBe(true);
    expect(findings[0].validationStatus).toBe('contradicts');
    const attempts = hub.disconfirmationAttempts ?? [];
    expect(attempts[0].verdict).toBe('refuted');
    expect(attempts[0].linkedFindingIds).toEqual([findings[0].id]);
    // The refuting finding short-circuits the hub to red.
    expect(deriveHypothesisStatus(hub, findings)).toBe('refuted');
  });

  it('plain evaluate (unchecked) is UNCHANGED: not-significant → inconclusive, NO attempt', () => {
    renderWall(flatRows, makePlanningProps({ onEvaluateFactor: pwaFusedEvaluate(flatRows, 'Y') }));
    // Do NOT check the box — plain FE-2a path.
    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));

    const hub = useAnalyzeStore.getState().hypotheses[0];
    const findings = useAnalyzeStore.getState().findings;
    expect(findings[0].validationStatus).toBe('inconclusive');
    expect(findings[0].refutes).toBeFalsy();
    expect(hub.disconfirmationAttempts ?? []).toHaveLength(0);
  });
});
