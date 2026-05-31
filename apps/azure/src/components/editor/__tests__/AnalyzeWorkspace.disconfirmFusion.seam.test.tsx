/**
 * Azure Wall FE-2b disconfirmation-fusion SEAM test (anti-green-but-dead).
 *
 * Parity with the PWA fused seam, but Azure routes through the REAL `useFindings`
 * + `useHypotheses` hooks (not `useAnalyzeStore`). The harness wires
 * `onEvaluateFactor` EXACTLY as AnalyzeWorkspace's `handleEvaluateFactor`: when
 * "Try to break it" is checked, run `evaluateDisconfirmation`, write the typed
 * Finding, connect it, AND record the DisconfirmationAttempt with the finding
 * linked via the REAL `hypothesesState.recordDisconfirmation`. The REAL WallCanvas
 * derives status from the SAME engine, so a dead wiring fails (render-through).
 */
import React, { useMemo, useCallback } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WallCanvas, type WallCanvasPlanningProps } from '@variscout/ui';
import type { EvaluateFactorOptions } from '@variscout/ui';
import { useFindings, useHypotheses } from '@variscout/hooks';
import {
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  useViewStore,
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

beforeEach(() => {
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useViewStore.setState({ focusedWallEntityId: null });
});

const seedHub: Hypothesis = {
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
// 10 per group (≥ the refute power floor of 10/group), flat across SHIFT → a
// TRUE null with adequate power → 'refuted' (not the low-power 'pending' that a
// thin sample now correctly returns post-FE-2b min-n guard).
const flatRows: DataRow[] = [
  { SHIFT: 'Day', Y: 20 },
  { SHIFT: 'Day', Y: 21 },
  { SHIFT: 'Day', Y: 19 },
  { SHIFT: 'Day', Y: 20 },
  { SHIFT: 'Day', Y: 21 },
  { SHIFT: 'Day', Y: 19 },
  { SHIFT: 'Day', Y: 20 },
  { SHIFT: 'Day', Y: 21 },
  { SHIFT: 'Day', Y: 19 },
  { SHIFT: 'Day', Y: 20 },
  { SHIFT: 'Night', Y: 20 },
  { SHIFT: 'Night', Y: 21 },
  { SHIFT: 'Night', Y: 19 },
  { SHIFT: 'Night', Y: 20 },
  { SHIFT: 'Night', Y: 21 },
  { SHIFT: 'Night', Y: 19 },
  { SHIFT: 'Night', Y: 20 },
  { SHIFT: 'Night', Y: 21 },
  { SHIFT: 'Night', Y: 19 },
  { SHIFT: 'Night', Y: 20 },
];

function AzureFusedHarness({
  rows,
  onState,
}: {
  rows: DataRow[];
  onState?: (s: {
    findings: ReturnType<typeof useFindings>['findings'];
    hubs: Hypothesis[];
  }) => void;
}) {
  const findingsState = useFindings();
  const hypothesesState = useHypotheses({ initialHubs: [{ ...seedHub }] });

  // The EXACT verdict-mechanic routing AnalyzeWorkspace.handleEvaluateFactor uses.
  const handleEvaluateFactor = useCallback(
    (hypothesisId: string, factor: string, options?: EvaluateFactorOptions) => {
      const tryToBreakIt = Boolean(options?.tryToBreakIt);
      const result = tryToBreakIt
        ? evaluateDisconfirmation(rows, factor, 'Y')
        : evaluateHypothesisFactor(rows, factor, 'Y');
      if (!result) return;
      const matches = (text: string) =>
        tryToBreakIt
          ? isDisconfirmationFindingForFactor(text, factor)
          : isEvaluateFindingForFactor(text, factor);
      const hub = hypothesesState.hubs.find(h => h.id === hypothesisId);
      const existing = hub
        ? findingsState.findings.find(f => hub.findingIds.includes(f.id) && matches(f.text))
        : undefined;
      let findingId: string;
      if (existing) {
        findingsState.editFinding(existing.id, result.findingText);
        findingsState.setValidation(existing.id, result.validationStatus, result.refutes);
        findingId = existing.id;
      } else {
        const finding = findingsState.addFinding(result.findingText, {
          activeFilters: {},
          cumulativeScope: null,
        });
        findingsState.setValidation(finding.id, result.validationStatus, result.refutes);
        hypothesesState.connectFinding(hypothesisId, finding.id);
        findingId = finding.id;
      }
      if (tryToBreakIt) {
        const attempt: DisconfirmationAttempt = {
          id: generateDeterministicId(),
          attemptedAt: new Date().toISOString(),
          attemptedBy: { displayName: 'Analyst', upn: 'analyst@local' },
          description: (options?.prediction ?? result.findingText).trim(),
          verdict: result.refutes ? 'refuted' : 'survived',
          linkedFindingIds: [findingId],
        };
        hypothesesState.recordDisconfirmation(hypothesisId, attempt);
      }
    },
    [rows, findingsState, hypothesesState]
  );

  onState?.({ findings: findingsState.findings, hubs: hypothesesState.hubs });

  const planningProps: WallCanvasPlanningProps = useMemo(
    () => ({
      plans: [],
      members: [],
      currentUserId: 'analyst@local',
      onAddPlan: vi.fn(),
      onLinkFinding: vi.fn(),
      onEditPlan: vi.fn(),
      onEvaluateFactor: handleEvaluateFactor,
    }),
    [handleEvaluateFactor]
  );

  return (
    <WallCanvas
      hubs={hypothesesState.hubs}
      findings={findingsState.findings}
      problemCpk={0.8}
      eventsPerWeek={10}
      rows={rows}
      outcomeColumn="Y"
      activeScopeSpecs={{ usl: 25, lsl: 5 }}
      planningProps={planningProps}
    />
  );
}

function evaluateWithBreakIt() {
  fireEvent.click(within(screen.getByTestId('try-break-it-SHIFT')).getByRole('checkbox'));
  fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));
}

describe('Azure Wall — FE-2b fused verdict seam', () => {
  it('significant + Try-to-break-it → SURVIVED: supports finding linked + attempt records it', () => {
    let latest = {
      findings: [] as ReturnType<typeof useFindings>['findings'],
      hubs: [] as Hypothesis[],
    };
    render(<AzureFusedHarness rows={significantRows} onState={s => (latest = s)} />);
    evaluateWithBreakIt();

    expect(latest.findings).toHaveLength(1);
    expect(latest.findings[0].validationStatus).toBe('supports');
    const attempts = latest.hubs[0].disconfirmationAttempts ?? [];
    expect(attempts).toHaveLength(1);
    expect(attempts[0].verdict).toBe('survived');
    // The [] gap closed BY CONSTRUCTION.
    expect(attempts[0].linkedFindingIds).toEqual([latest.findings[0].id]);
  });

  it('not-significant + Try-to-break-it → REFUTED (spindle inversion): hub goes red', () => {
    let latest = {
      findings: [] as ReturnType<typeof useFindings>['findings'],
      hubs: [] as Hypothesis[],
    };
    render(<AzureFusedHarness rows={flatRows} onState={s => (latest = s)} />);
    evaluateWithBreakIt();

    expect(latest.findings[0].refutes).toBe(true);
    const attempts = latest.hubs[0].disconfirmationAttempts ?? [];
    expect(attempts[0].verdict).toBe('refuted');
    expect(attempts[0].linkedFindingIds).toEqual([latest.findings[0].id]);
    expect(deriveHypothesisStatus(latest.hubs[0], latest.findings)).toBe('refuted');
  });

  it('plain evaluate (unchecked) is UNCHANGED: not-significant → inconclusive, NO attempt', () => {
    let latest = {
      findings: [] as ReturnType<typeof useFindings>['findings'],
      hubs: [] as Hypothesis[],
    };
    render(<AzureFusedHarness rows={flatRows} onState={s => (latest = s)} />);
    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));

    expect(latest.findings[0].validationStatus).toBe('inconclusive');
    expect(latest.hubs[0].disconfirmationAttempts ?? []).toHaveLength(0);
  });
});
