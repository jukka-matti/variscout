/**
 * Azure Wall one-tap evaluate SEAM test (Factors & Evaluation Increment 2a §4).
 *
 * Parity with the PWA evaluate seam — but Azure routes through the REAL
 * `useFindings` + `useHypotheses` hooks (not `useAnalyzeStore`), so this drives
 * those hooks via a small harness component that wires `onEvaluateFactor` EXACTLY
 * as AnalyzeWorkspace does: run the real `evaluateHypothesisFactor`, write a typed
 * Finding via `findingsState.addFinding`, classify via `setValidation`, connect
 * via `hypothesesState.connectFinding`. The REAL WallCanvas derives the triad +
 * renders the Evaluate CTA, so a dead wiring fails (render-through, not a spy).
 */
import React, { useMemo, useCallback } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallCanvas, type WallCanvasPlanningProps } from '@variscout/ui';
import { useFindings, useHypotheses } from '@variscout/hooks';
import {
  getCanvasViewportInitialState,
  useCanvasViewportStore,
  useViewStore,
} from '@variscout/stores';
import { evaluateHypothesisFactor, isEvaluateFindingForFactor } from '@variscout/core/findings';
import { deriveHypothesisStatus } from '@variscout/core/survey';
import type { DataRow, Hypothesis } from '@variscout/core';

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

/**
 * Harness that mounts the REAL Azure hooks + the REAL WallCanvas, wiring
 * onEvaluateFactor exactly as AnalyzeWorkspace's `handleEvaluateFactor`. Exposes
 * the live findings + hub state to the test via a callback ref.
 */
function AzureWallHarness({
  rows,
  wireEvaluate = true,
  onState,
}: {
  rows: DataRow[];
  wireEvaluate?: boolean;
  onState?: (s: {
    findings: ReturnType<typeof useFindings>['findings'];
    hubs: Hypothesis[];
  }) => void;
}) {
  const findingsState = useFindings();
  const hypothesesState = useHypotheses({ initialHubs: [{ ...seedHub }] });

  const handleEvaluateFactor = useCallback(
    (hypothesisId: string, factor: string) => {
      const result = evaluateHypothesisFactor(rows, factor, 'Y');
      if (!result) return;
      // FE-2a idempotency: refresh the prior evaluate-finding for this
      // (hypothesis × factor) instead of appending a duplicate.
      const hub = hypothesesState.hubs.find(h => h.id === hypothesisId);
      const existing = hub
        ? findingsState.findings.find(
            f => hub.findingIds.includes(f.id) && isEvaluateFindingForFactor(f.text, factor)
          )
        : undefined;
      if (existing) {
        findingsState.editFinding(existing.id, result.findingText);
        findingsState.setValidation(existing.id, result.validationStatus, result.refutes);
        return;
      }
      const finding = findingsState.addFinding(result.findingText, {
        activeFilters: {},
        cumulativeScope: null,
      });
      findingsState.setValidation(finding.id, result.validationStatus, result.refutes);
      hypothesesState.connectFinding(hypothesisId, finding.id);
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
      ...(wireEvaluate ? { onEvaluateFactor: handleEvaluateFactor } : {}),
    }),
    [wireEvaluate, handleEvaluateFactor]
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

describe('Azure Wall one-tap evaluate seam', () => {
  it('tapping Evaluate writes a typed supporting Finding, links it, and advances the hub', () => {
    let latest = {
      findings: [] as ReturnType<typeof useFindings>['findings'],
      hubs: [] as Hypothesis[],
    };
    render(<AzureWallHarness rows={significantRows} onState={s => (latest = s)} />);

    fireEvent.click(screen.getByTestId('evaluate-factor-SHIFT'));

    expect(latest.findings).toHaveLength(1);
    expect(latest.findings[0].validationStatus).toBe('supports');
    expect(latest.findings[0].evidenceType).toBe('data');
    // Linked to the hub (render-through).
    expect(latest.hubs[0].findingIds).toContain(latest.findings[0].id);
    // The hub advances past 'proposed' — deriveHypothesisStatus now sees a
    // supporting evidence clue (NOT still the bare proposed state).
    const status = deriveHypothesisStatus(latest.hubs[0], latest.findings);
    expect(status).not.toBe('proposed');
  });

  it('does NOT render the Evaluate CTA when onEvaluateFactor is omitted', () => {
    render(<AzureWallHarness rows={significantRows} wireEvaluate={false} />);
    expect(screen.queryByTestId('evaluate-factor-SHIFT')).toBeNull();
  });

  it('a repeat evaluate of the same factor refreshes ONE finding (idempotent — FIX 2)', () => {
    let latest = {
      findings: [] as ReturnType<typeof useFindings>['findings'],
      hubs: [] as Hypothesis[],
    };
    render(<AzureWallHarness rows={significantRows} onState={s => (latest = s)} />);

    const cta = screen.getByTestId('evaluate-factor-SHIFT');
    fireEvent.click(cta);
    fireEvent.click(cta);
    fireEvent.click(cta);

    // Three taps → still exactly one finding, still linked exactly once.
    expect(latest.findings).toHaveLength(1);
    expect(latest.findings[0].validationStatus).toBe('supports');
    expect(latest.hubs[0].findingIds.filter(id => id === latest.findings[0].id)).toHaveLength(1);
  });
});
