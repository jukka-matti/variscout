/**
 * PWA Wall disconfirmation SEAM test (parity with Azure).
 *
 * The bug this pins: the PWA's `wallPlanningProps` (App.tsx) omitted
 * `onRecordDisconfirmation`, so a PWA hypothesis could NEVER record a survived
 * disconfirmation and never leaves `needs-disconfirmation`. Azure had it; the PWA
 * did not.
 *
 * Strategy — this is NOT an injected-prop unit test. It renders the PRODUCTION
 * `WallCanvas` → `HypothesisCardWithPlans` (the same component tree the PWA mounts
 * via AnalyzeView's `planningProps`) and wires `onRecordDisconfirmation` to the
 * REAL `useAnalyzeStore.getState().recordDisconfirmation` — exactly how App.tsx
 * routes it. The PWA Wall reads hubs reactively from `useAnalyzeStore`, so this is
 * the actual source of truth.
 *
 *   - Live wire: firing the real gesture lands a DisconfirmationAttempt in
 *     `useAnalyzeStore.hypotheses` (the source the Wall re-renders from). A wire
 *     that bypassed the store (the failure mode the Azure comment warns about)
 *     would leave the store untouched → test fails.
 *   - Dead wire: omitting `onRecordDisconfirmation` from planningProps (the
 *     original PWA bug) hides the gesture entirely → the prompt button is not in
 *     the document → test fails.
 *
 * Mirrors the harness in
 * packages/ui/src/components/AnalyzeWall/__tests__/WallCanvas.collab.seam.test.tsx.
 */

vi.mock('lucide-react', () => ({
  MessageSquare: (props: Record<string, unknown>) => (
    <span data-testid="messagesquare-icon" {...props} />
  ),
  Pencil: (props: Record<string, unknown>) => <span data-testid="pencil-icon" {...props} />,
  Trash2: (props: Record<string, unknown>) => <span data-testid="trash-icon" {...props} />,
  Camera: (props: Record<string, unknown>) => <span data-testid="camera-icon" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="loader-icon" {...props} />,
  ImageIcon: (props: Record<string, unknown>) => <span data-testid="image-icon" {...props} />,
  Paperclip: (props: Record<string, unknown>) => <span data-testid="paperclip-icon" {...props} />,
  FileText: (props: Record<string, unknown>) => <span data-testid="filetext-icon" {...props} />,
  X: (props: Record<string, unknown>) => <span data-testid="x-icon" {...props} />,
  Mic: (props: Record<string, unknown>) => <span data-testid="mic-icon" {...props} />,
}));

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
import { generateDeterministicId } from '@variscout/core/identity';
import type { DisconfirmationAttempt, Hypothesis, ProcessMap } from '@variscout/core';

const processMap: ProcessMap = {
  version: 1,
  nodes: [{ id: 'n1', name: 'Fill', order: 0 }],
  tributaries: [{ id: 't1', stepId: 'n1', column: 'SHIFT' }],
  ctsColumn: 'FILL',
  createdAt: '2026-05-09T00:00:00.000Z',
  updatedAt: '2026-05-09T00:00:00.000Z',
};

const baseHub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle runs hot',
  synthesis: '',
  findingIds: [],
  status: 'needs-disconfirmation',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
};

const PWA_WALL_USER_ID = 'analyst@local';

/**
 * The EXACT routing App.tsx uses: stamp id/timestamp/attemptedBy in the app, then
 * record into useAnalyzeStore — the PWA Wall's reactive source of truth.
 */
function pwaRecordDisconfirmation(
  hypothesisId: string,
  input: { description: string; verdict: 'pending' | 'survived' | 'refuted' }
) {
  const attempt: DisconfirmationAttempt = {
    id: generateDeterministicId(),
    attemptedAt: new Date().toISOString(),
    attemptedBy: { displayName: 'Local browser', upn: PWA_WALL_USER_ID },
    description: input.description,
    verdict: input.verdict,
    linkedFindingIds: [],
  };
  useAnalyzeStore.getState().recordDisconfirmation(hypothesisId, attempt);
}

function makePlanningProps(
  overrides: Partial<WallCanvasPlanningProps> = {}
): WallCanvasPlanningProps {
  return {
    plans: [],
    members: [],
    currentUserId: PWA_WALL_USER_ID,
    onAddPlan: vi.fn(),
    onLinkFinding: vi.fn(),
    onEditPlan: vi.fn(),
    onRecordDisconfirmation: pwaRecordDisconfirmation,
    ...overrides,
  };
}

function renderWall(planningProps: WallCanvasPlanningProps) {
  // The Wall reads hubs from useAnalyzeStore; render from that source of truth.
  const hubs = useAnalyzeStore.getState().hypotheses;
  return render(
    <WallCanvas
      hubs={hubs}
      findings={[]}
      processMap={processMap}
      problemCpk={0.78}
      eventsPerWeek={42}
      planningProps={planningProps}
    />
  );
}

beforeEach(() => {
  useAnalyzeStore.setState(getAnalyzeInitialState());
  useCanvasViewportStore.setState(getCanvasViewportInitialState());
  useAnalyzeStore.getState().resetHubs([{ ...baseHub }]);
});

describe('PWA Wall disconfirmation seam (Azure parity)', () => {
  it('firing the gesture records a survived attempt into useAnalyzeStore (the Wall source of truth)', () => {
    renderWall(makePlanningProps());

    // FE-2b — the legacy free-text form survives ONLY as the manual non-data
    // (gemba/expert) fallback; open it via that button.
    fireEvent.click(screen.getByText(/gemba or expert/i));
    fireEvent.change(screen.getByLabelText('What did you try?'), {
      target: { value: 'Re-ran on the day shift; the spread held.' },
    });
    fireEvent.change(screen.getByLabelText('Did it hold?'), { target: { value: 'survived' } });
    fireEvent.click(screen.getByText('Record'));

    // A dead wire (handler omitted, or one that bypasses the store) leaves
    // hypotheses unchanged and fails here.
    const attempts = useAnalyzeStore.getState().hypotheses[0].disconfirmationAttempts ?? [];
    expect(attempts).toHaveLength(1);
    expect(attempts[0].verdict).toBe('survived');
    expect(attempts[0].description).toBe('Re-ran on the day shift; the spread held.');
  });

  it('does NOT render the disconfirmation gesture when onRecordDisconfirmation is omitted (the original PWA bug)', () => {
    renderWall(makePlanningProps({ onRecordDisconfirmation: undefined }));
    expect(screen.queryByText(/gemba or expert/i)).toBeNull();
  });
});
