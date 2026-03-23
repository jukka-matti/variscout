import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createEventBus } from '@variscout/core/events';
import type { DomainEventBus } from '@variscout/core/events';
import { registerListeners } from '../listeners';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useFindingsStore } from '../../features/findings/findingsStore';
import { useInvestigationStore } from '../../features/investigation/investigationStore';
import type { Finding } from '@variscout/core';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFinding(id: string): Finding {
  return {
    id,
    title: `Finding ${id}`,
    description: '',
    status: 'observed',
    createdAt: new Date().toISOString(),
    tags: [],
  } as unknown as Finding;
}

// ── Test Suite ───────────────────────────────────────────────────────────────

describe('registerListeners', () => {
  let bus: DomainEventBus;
  let cleanup: () => void;

  beforeEach(() => {
    // Fresh bus per test — no listener stacking
    bus = createEventBus();
    cleanup = registerListeners(bus);

    // Reset stores to initial state
    usePanelsStore.setState({
      activeView: 'editor',
      isDataPanelOpen: false,
      isDataTableOpen: false,
      isFindingsOpen: false,
      isCoScoutOpen: false,
      isWhatIfOpen: false,
      isImprovementOpen: false,
      isPresentationMode: false,
      isReportOpen: false,
      highlightRowIndex: null,
      highlightedChartPoint: null,
      pendingChartFocus: null,
    });
    useFindingsStore.setState({
      findings: [],
      highlightedFindingId: null,
      chartFindings: { boxplot: [], pareto: [], ichart: [] },
      statusFilter: null,
    });
    useInvestigationStore.setState({
      hypotheses: [],
      hypothesesMap: {},
      ideaImpacts: {},
      projectionTarget: null,
      expandedHypothesisId: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  // ── finding:created ───────────────────────────────────────────────────────

  it('finding:created opens findings panel', () => {
    const finding = makeFinding('f1');
    bus.emit('finding:created', { finding });

    expect(usePanelsStore.getState().isFindingsOpen).toBe(true);
  });

  it('finding:created highlights the new finding', () => {
    const finding = makeFinding('f2');
    bus.emit('finding:created', { finding });

    expect(useFindingsStore.getState().highlightedFindingId).toBe('f2');
  });

  // ── highlight:finding ─────────────────────────────────────────────────────

  it('highlight:finding sets highlightedFindingId', () => {
    bus.emit('highlight:finding', { findingId: 'f3' });

    expect(useFindingsStore.getState().highlightedFindingId).toBe('f3');
  });

  // ── navigate:to ──────────────────────────────────────────────────────────

  it('navigate:to dashboard sets activeView to dashboard', () => {
    // Start in editor (default) so we can verify the switch
    bus.emit('navigate:to', { target: 'dashboard' });

    expect(usePanelsStore.getState().activeView).toBe('dashboard');
  });

  it('navigate:to finding opens editor, opens findings panel, and highlights finding', () => {
    // Put us on dashboard first
    usePanelsStore.getState().showDashboard();

    bus.emit('navigate:to', { target: 'finding', targetId: 'f4' });

    const panels = usePanelsStore.getState();
    expect(panels.activeView).toBe('editor');
    expect(panels.isFindingsOpen).toBe(true);
    expect(useFindingsStore.getState().highlightedFindingId).toBe('f4');
  });

  it('navigate:to improvement_workspace opens editor and improvement panel', () => {
    usePanelsStore.getState().showDashboard();

    bus.emit('navigate:to', { target: 'improvement_workspace' });

    const panels = usePanelsStore.getState();
    expect(panels.activeView).toBe('editor');
    expect(panels.isImprovementOpen).toBe(true);
  });

  it('navigate:to report opens editor and report panel', () => {
    usePanelsStore.getState().showDashboard();

    bus.emit('navigate:to', { target: 'report' });

    const panels = usePanelsStore.getState();
    expect(panels.activeView).toBe('editor');
    expect(panels.isReportOpen).toBe(true);
  });
});
