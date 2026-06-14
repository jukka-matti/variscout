/**
 * CL-5b: Consultation loop mounted into AnalyzeView.
 *
 * Asserts the app-owned seams:
 *  - A "Consultation" toolbar toggle opens the right-side panel (builder + review).
 *  - "Ask an expert" on a finding opens the panel AND seeds a question anchored
 *    to that finding id.
 *  - Accepting a pending insight from the MOUNTED review panel creates an
 *    `expert`-evidence Finding (CL-4 integration assertion).
 *
 * FindingsLog + ConsultationReviewPanel + ConsultationBuilder are NOT mocked —
 * we exercise the real integration. WallCanvas/ModelDrawer are mocked to avoid
 * the heavy canvas tree.
 *
 * vi.mock() BEFORE component imports — testing.md invariant.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks BEFORE component imports ─────────────────────────────────────────

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useResizablePanel: () => ({ width: 280, handleMouseDown: vi.fn() }),
    // Return raw keys so assertions are locale-independent.
    useTranslation: () => ({
      t: (key: string) => key,
      formatStat: (n: number) => String(n),
      locale: 'en-US',
    }),
  };
});

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    AnalyzeConclusion: () => null,
    WallCanvas: () => <div data-testid="wall-canvas" />,
    ModelDrawerBase: () => <div data-testid="model-drawer-mock" />,
  };
});

vi.mock('@variscout/core/strategy', () => ({
  resolveMode: () => 'standard',
  getStrategy: () => ({ questionStrategy: { evidenceLabel: 'R²' } }),
}));

vi.mock('../../../features/findings/findingsStore', () => ({
  useFindingsStore: (selector: (s: { highlightedFindingId: string | null }) => unknown) =>
    selector({ highlightedFindingId: null }),
}));

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: {
    getState: () => ({ showExplore: vi.fn(), showCharter: vi.fn() }),
  },
}));

// Gated export module — not exercised here, but the builder dynamic-imports it.
vi.mock('@pwa-artifacts', () => ({
  exportConsultationPack: vi.fn(),
}));

// ── Component + store imports AFTER mocks ──────────────────────────────────

import {
  getAnalyzeInitialState,
  getAnalysisScopeInitialState,
  getCanvasViewportInitialState,
  getProjectInitialState,
  getViewInitialState,
  useAnalysisScopeStore,
  useAnalyzeStore,
  useCanvasViewportStore,
  useProjectStore,
  useViewStore,
} from '@variscout/stores';
import { createFinding } from '@variscout/core';
import type { ProcessHubId } from '@variscout/core/processHub';
import AnalyzeView from '../AnalyzeView';

const h = (id: string) => id as ProcessHubId;

function makeMinimalProps(
  overrides: Partial<React.ComponentProps<typeof AnalyzeView>> = {}
): React.ComponentProps<typeof AnalyzeView> {
  const noOp = vi.fn();
  return {
    canvasViewportHubId: h('hub-test'),
    filteredData: [],
    outcome: null,
    factors: [],
    handleRestoreFinding: noOp,
    handleSetFindingStatus: noOp,
    drillPath: [],
    columnAliases: {},
    resolvedMode: 'standard' as never,
    ...overrides,
  };
}

describe('AnalyzeView — consultation loop mount (CL-5b)', () => {
  beforeEach(() => {
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useProjectStore.setState(getProjectInitialState());
    useAnalyzeStore.setState(getAnalyzeInitialState());
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
    useViewStore.setState(getViewInitialState());
    window.sessionStorage.clear();
  });

  it('toolbar Consultation toggle opens the builder + review panel', () => {
    // Findings lens so the toolbar toggle is visible.
    useCanvasViewportStore.getState().setViewMode('map');
    render(<AnalyzeView {...makeMinimalProps()} />);

    expect(screen.queryByTestId('consultation-builder-panel')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /consultation/i }));

    expect(screen.getByTestId('consultation-builder-panel')).toBeInTheDocument();
    expect(screen.getByTestId('consultation-review-panel')).toBeInTheDocument();
  });

  it('"Ask an expert" on a finding opens the panel and seeds a finding-anchored question', async () => {
    useCanvasViewportStore.getState().setViewMode('map');
    const finding = { ...createFinding('Monday startup spike', {}, null), id: 'f-ask-1' };
    useAnalyzeStore.setState({ ...getAnalyzeInitialState(), findings: [finding] });

    render(<AnalyzeView {...makeMinimalProps()} />);

    // Findings-exist arrival routing lands on the Wall; switch to the Findings
    // lens, then the list sub-view (the ask-expert button lives on the
    // list-view FindingCard).
    fireEvent.click(screen.getByRole('button', { name: /^findings$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^list$/i }));

    fireEvent.click(screen.getByTestId('ask-expert-finding'));

    // Panel opens.
    expect(screen.getByTestId('consultation-builder-panel')).toBeInTheDocument();

    // A consultation now exists with a question anchored to the finding.
    await waitFor(() => {
      const consultations = useAnalyzeStore.getState().consultations;
      expect(consultations.length).toBe(1);
      const q = consultations[0].questions.find(
        qq => qq.anchor?.kind === 'finding' && qq.anchor.id === 'f-ask-1'
      );
      expect(q).toBeDefined();
    });
  });

  it('"Ask an expert" is reachable in the DEFAULT board view (no list switch)', async () => {
    useCanvasViewportStore.getState().setViewMode('map');
    const finding = { ...createFinding('Monday startup spike', {}, null), id: 'f-board-1' };
    useAnalyzeStore.setState({ ...getAnalyzeInitialState(), findings: [finding] });

    render(<AnalyzeView {...makeMinimalProps()} />);

    // Findings-exist arrival routing lands on the Wall; switch to the Findings
    // lens but DO NOT switch to list — board is the default sub-view.
    fireEvent.click(screen.getByRole('button', { name: /^findings$/i }));

    // The ask-expert affordance is present in board mode.
    fireEvent.click(screen.getByTestId('ask-expert-finding'));

    expect(screen.getByTestId('consultation-builder-panel')).toBeInTheDocument();
    await waitFor(() => {
      const consultations = useAnalyzeStore.getState().consultations;
      expect(consultations.length).toBe(1);
      const q = consultations[0].questions.find(
        qq => qq.anchor?.kind === 'finding' && qq.anchor.id === 'f-board-1'
      );
      expect(q).toBeDefined();
    });
  });

  it('after a consultation is sent, a new Ask-an-expert mints a fresh draft (does not append)', async () => {
    useCanvasViewportStore.getState().setViewMode('map');
    const finding = { ...createFinding('Monday startup spike', {}, null), id: 'f-send-1' };
    useAnalyzeStore.setState({ ...getAnalyzeInitialState(), findings: [finding] });

    render(<AnalyzeView {...makeMinimalProps()} />);
    fireEvent.click(screen.getByRole('button', { name: /^findings$/i }));

    // First ask → one draft consultation with one question.
    fireEvent.click(screen.getByTestId('ask-expert-finding'));
    await waitFor(() => {
      expect(useAnalyzeStore.getState().consultations.length).toBe(1);
    });
    const firstId = useAnalyzeStore.getState().consultations[0].id;

    // Simulate the consultation being sent (export marks it sent).
    useAnalyzeStore.getState().markConsultationSent(firstId);
    expect(useAnalyzeStore.getState().consultations[0].status).toBe('sent');

    // Second ask → must NOT append to the sent consultation; a fresh draft.
    fireEvent.click(screen.getByTestId('ask-expert-finding'));

    await waitFor(() => {
      expect(useAnalyzeStore.getState().consultations.length).toBe(2);
    });
    const sent = useAnalyzeStore.getState().consultations.find(c => c.id === firstId)!;
    const fresh = useAnalyzeStore.getState().consultations.find(c => c.id !== firstId)!;
    // The sent consultation kept exactly its one question (no absorption).
    expect(sent.questions.length).toBe(1);
    expect(sent.status).toBe('sent');
    // The fresh draft carries the new anchored question.
    expect(fresh.status).toBe('draft');
    expect(fresh.questions.some(q => q.anchor?.id === 'f-send-1')).toBe(true);
  });

  it('accepting a pending insight from the mounted review panel creates an expert Finding', async () => {
    useCanvasViewportStore.getState().setViewMode('map');
    render(<AnalyzeView {...makeMinimalProps()} />);

    // Open the panel (creates the active consultation).
    fireEvent.click(screen.getByRole('button', { name: /consultation/i }));
    const consultationId = useAnalyzeStore.getState().consultations[0].id;

    // Seed a pending insight directly through the store action.
    useAnalyzeStore.getState().importResponse(consultationId, {
      source: 'typed',
      respondentLabel: 'J. Operator',
      insights: [{ text: 'Oven is cold on Monday mornings.', kind: 'answer' }],
    });

    // The review panel renders the pending insight; click Accept.
    await waitFor(() => {
      expect(screen.getByText('consultation.review.accept')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('consultation.review.accept'));

    const findings = useAnalyzeStore.getState().findings;
    expect(findings).toHaveLength(1);
    expect(findings[0].evidenceType).toBe('expert');
  });
});
