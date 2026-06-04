/**
 * AnalyzeView (PWA) — empty-lineage-means-unfiltered Wall filter (item 1).
 *
 * Mirrors the Azure AnalyzeWorkspace.emptyLineage.seam test.
 * Mechanism: `IP.sections.investigationLineage.hypothesisIds` has no UI writer.
 * With active-IP scope engaged, the old filter compared against always-empty set
 * → every hypothesis hidden. Interim semantic: empty lineage = show everything.
 * See decision-log OQ 2026-06-04.
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
    AnalyzePhaseBadge: () => null,
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
import { createHypothesis } from '@variscout/core/findings';
import type { Finding } from '@variscout/core';
import type { ActiveIPLineageIds, ActiveIPScopeLabels } from '@variscout/ui';
import AnalyzeView from '../AnalyzeView';

// ── 3. Fixtures ─────────────────────────────────────────────────────────────

const activeScope: { title: string; labels: ActiveIPScopeLabels } = {
  title: 'Reduce Defect Rate',
  labels: {
    outcomeLabel: 'Defect Rate',
    factorLabels: [],
    since: 'Jan 1',
    memberCount: 1,
  },
};

const hub1 = { ...createHypothesis('Mech A', '', [], 'inv-1'), id: 'hub-A' };
const hub2 = { ...createHypothesis('Mech B', '', [], 'inv-1'), id: 'hub-B' };

const finding1: Finding = {
  id: 'f-A',
  text: 'Evidence A',
  status: 'open',
  tags: [],
  context: { activeFilters: {}, scopeLabel: '' },
  refutes: false,
  originStepId: undefined,
  projection: undefined,
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
};
const finding2: Finding = {
  id: 'f-B',
  text: 'Evidence B',
  status: 'open',
  tags: [],
  context: { activeFilters: {}, scopeLabel: '' },
  refutes: false,
  originStepId: undefined,
  projection: undefined,
  createdAt: 2,
  updatedAt: 2,
  deletedAt: null,
};

function makeMinimalProps(
  overrides: Partial<React.ComponentProps<typeof AnalyzeView>> = {}
): React.ComponentProps<typeof AnalyzeView> {
  const noOp = vi.fn();
  return {
    canvasViewportHubId: 'hub-test' as never,
    filteredData: [],
    outcome: null,
    factors: [],
    findingsState: {
      findings: [finding1, finding2],
      addFinding: vi.fn(() => ({ id: 'f1', text: '' }) as never),
      editFinding: noOp,
      deleteFinding: noOp,
      setFindingTag: noOp,
      setOutcome: noOp,
      addAction: noOp,
      completeAction: noOp,
      deleteAction: noOp,
      addFindingComment: noOp,
    } as never,
    handleRestoreFinding: noOp,
    handleSetFindingStatus: noOp,
    drillPath: [],
    columnAliases: {},
    resolvedMode: 'standard' as never,
    ...overrides,
  };
}

// ── 4. Tests ───────────────────────────────────────────────────────────────

describe('PWA AnalyzeView — empty lineage means unfiltered (interim curation semantics)', () => {
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

  // LOAD-BEARING: old code → empty Set → hub1 + hub2 both filtered out → [] fails.
  it('(1a) active-IP scope + EMPTY hypothesisIds → all hubs visible on Wall', () => {
    const emptyLineage: ActiveIPLineageIds = { hypothesisIds: [], findingIds: [] };
    render(
      <AnalyzeView
        {...makeMinimalProps()}
        activeIPScope={activeScope}
        activeIPLineage={emptyLineage}
      />
    );
    expect(capturedWallCanvasProps.current).not.toBeNull();
    const receivedHubs = capturedWallCanvasProps.current!.hubs as { id: string }[];
    expect(receivedHubs.map(h => h.id).sort()).toEqual(['hub-A', 'hub-B']);
  });

  // REGRESSION: non-empty list must still filter.
  it('(1b) active-IP scope + hypothesisIds = ["hub-A"] → only hub-A on Wall', () => {
    const lineage: ActiveIPLineageIds = { hypothesisIds: ['hub-A'], findingIds: [] };
    render(
      <AnalyzeView {...makeMinimalProps()} activeIPScope={activeScope} activeIPLineage={lineage} />
    );
    const receivedHubs = capturedWallCanvasProps.current!.hubs as { id: string }[];
    expect(receivedHubs).toHaveLength(1);
    expect(receivedHubs[0].id).toBe('hub-A');
  });

  // CONTROL: no activeIPScope → all hubs visible regardless of lineage.
  it('(control) no activeIPScope → all hubs visible', () => {
    render(<AnalyzeView {...makeMinimalProps()} />);
    const receivedHubs = capturedWallCanvasProps.current!.hubs as { id: string }[];
    expect(receivedHubs.map(h => h.id).sort()).toEqual(['hub-A', 'hub-B']);
  });
});
