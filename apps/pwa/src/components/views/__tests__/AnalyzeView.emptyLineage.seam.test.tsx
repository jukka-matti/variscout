/**
 * AnalyzeView (PWA) — Workspace Project scope shows the whole document on the Wall
 * (PO-5 permanent semantics).
 *
 * Mirrors the Azure AnalyzeWorkspace seam test. The IP lineage section is
 * retired (PO-5); Workspace Project surfaces no longer filter the Wall by a lineage
 * membership set — under Workspace Project scope the Wall renders every hub.
 * See decision-log 2026-06-05 (PO-5).
 *
 * IMPORTANT: vi.mock() calls must appear before any component imports.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// ── 1. Mocks BEFORE component imports ──────────────────────────────────────

const capturedWallCanvasProps = vi.hoisted(() => ({
  current: null as { hubs: unknown[]; findings?: unknown[] } | null,
}));

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  return actual;
});

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useResizablePanel: () => ({ width: 280, handleMouseDown: vi.fn() }),
  };
});

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    QuestionChecklist: () => <div data-testid="question-checklist" />,
    AnalyzeConclusion: () => null,
    FindingsLog: () => <div data-testid="findings-log" />,
    useWallIsMobile: () => false,
    WallCanvas: (props: { hubs: unknown[]; findings?: unknown[] }) => {
      capturedWallCanvasProps.current = props;
      return props.hubs.length > 0 ? (
        <div data-testid="wall-canvas" />
      ) : (
        <div data-testid="wall-canvas-empty" />
      );
    },
  };
});

vi.mock('@variscout/core/ai', () => ({
  detectInvestigationPhase: () => null,
}));

vi.mock('@variscout/core/strategy', () => ({
  resolveMode: () => 'standard',
  getStrategy: () => ({ questionStrategy: { evidenceLabel: 'R²' } }),
}));

vi.mock('../../../features/findings/findingsStore', () => ({
  useFindingsStore: (selector: (s: { highlightedFindingId: string | null }) => unknown) =>
    selector({ highlightedFindingId: null }),
}));

vi.mock('../../../features/analyze/analyzeStore', () => ({
  useAnalyzeFeatureStore: {
    getState: () => ({ expandToQuestion: vi.fn() }),
  },
}));

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: {
    getState: () => ({ showExplore: vi.fn(), showCharter: vi.fn() }),
  },
}));

// ── 2. Component + store imports AFTER mocks ───────────────────────────────

import {
  getCanvasViewportInitialState,
  getProjectInitialState,
  getAnalyzeInitialState,
  useCanvasViewportStore,
  useProjectStore,
  useAnalyzeStore,
} from '@variscout/stores';
import { createHypothesis, createFinding } from '@variscout/core/findings';
import type { WorkspaceProjectScopeLabels } from '@variscout/ui';
import AnalyzeView from '../AnalyzeView';

// ── 3. Fixtures ─────────────────────────────────────────────────────────────

const activeScope: { title: string; labels: WorkspaceProjectScopeLabels } = {
  title: 'Reduce Defect Rate',
  labels: {
    outcomeLabel: 'Defect Rate',
    factorLabels: [],
    timelineLabel: 'Jan 1',
  },
};

const hub1 = { ...createHypothesis('Mech A', '', []), id: 'hub-A' };
const hub2 = { ...createHypothesis('Mech B', '', []), id: 'hub-B' };

const finding1 = { ...createFinding('Evidence A', {}, null, undefined, 'observed'), id: 'f-A' };
const finding2 = { ...createFinding('Evidence B', {}, null, undefined, 'observed'), id: 'f-B' };

function makeMinimalProps(
  overrides: Partial<React.ComponentProps<typeof AnalyzeView>> = {}
): React.ComponentProps<typeof AnalyzeView> {
  const noOp = vi.fn();
  return {
    canvasViewportHubId: 'hub-test' as never,
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

// ── 4. Tests ───────────────────────────────────────────────────────────────

describe('PWA AnalyzeView — Workspace Project shows the whole document on the Wall (PO-5 permanent semantics)', () => {
  beforeEach(() => {
    capturedWallCanvasProps.current = null;
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
    useCanvasViewportStore.getState().setViewMode('wall');
    useProjectStore.setState(getProjectInitialState());
    useAnalyzeStore.setState({
      ...getAnalyzeInitialState(),
      hypotheses: [hub1, hub2],
      findings: [finding1, finding2],
    });
    window.sessionStorage.clear();
  });

  // PO-5: under Workspace Project scope the Wall renders every hub (lineage filter retired).
  it('(1) Workspace Project scope → all hubs visible on Wall', () => {
    render(<AnalyzeView {...makeMinimalProps()} workspaceProjectScope={activeScope} />);
    expect(capturedWallCanvasProps.current).not.toBeNull();
    const receivedHubs = capturedWallCanvasProps.current!.hubs as { id: string }[];
    expect(receivedHubs.map(h => h.id).sort()).toEqual(['hub-A', 'hub-B']);
  });

  // CONTROL: no workspaceProjectScope → all hubs visible.
  it('(control) no workspaceProjectScope → all hubs visible', () => {
    render(<AnalyzeView {...makeMinimalProps()} />);
    const receivedHubs = capturedWallCanvasProps.current!.hubs as { id: string }[];
    expect(receivedHubs.map(h => h.id).sort()).toEqual(['hub-A', 'hub-B']);
  });
});
