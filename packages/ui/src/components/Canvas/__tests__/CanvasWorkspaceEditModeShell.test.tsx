import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import type { ProcessMap } from '@variscout/core/frame';
import {
  getCanvasViewportInitialState,
  useCanvasStore,
  useCanvasViewportStore,
} from '@variscout/stores';

// Heavy subsystem mocks — keep this test focused on shell-visibility logic.
// Mirrors the canonical CanvasWorkspace.test.tsx mock scaffolding but trimmed
// to the minimum surface needed for EditModeShell wiring assertions.

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  const React = await import('react');
  return {
    ...actual,
    IChart: () => React.createElement('div', { 'data-testid': 'mock-cpk-trend' }),
    CapabilityGapTrendChart: () => React.createElement('div', { 'data-testid': 'mock-gap-trend' }),
    CapabilityBoxplot: () =>
      React.createElement('div', { 'data-testid': 'mock-capability-boxplot' }),
    StepErrorPareto: () => React.createElement('div', { 'data-testid': 'mock-step-pareto' }),
  };
});

vi.mock('../../AnalyzeWall', async () => {
  const React = await import('react');
  return {
    useWallIsMobile: () => false,
    WallCanvas: () => React.createElement('div', { 'data-testid': 'wall-canvas' }),
  };
});

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));

vi.mock('../internal/LocalMechanismView', async () => {
  const React = await import('react');
  return {
    LocalMechanismView: () => React.createElement('div', { 'data-testid': 'local-mechanism-view' }),
  };
});

vi.mock('@variscout/hooks', () => ({
  CANVAS_LENS_REGISTRY: {
    default: { id: 'default', label: 'Default', enabled: true, description: '' },
    capability: { id: 'capability', label: 'Capability', enabled: true, description: '' },
    defect: { id: 'defect', label: 'Defect', enabled: true, description: '' },
    'process-flow': { id: 'process-flow', label: 'Process flow', enabled: true, description: '' },
    performance: { id: 'performance', label: 'Performance', enabled: false, description: '' },
    yamazumi: { id: 'yamazumi', label: 'Yamazumi', enabled: false, description: '' },
  },
  CANVAS_OVERLAY_REGISTRY: {
    investigations: {
      id: 'investigations',
      label: 'Investigations',
      enabled: true,
      description: '',
    },
    hypotheses: { id: 'hypotheses', label: 'Hypotheses', enabled: true, description: '' },
    'hypothesis-hubs': {
      id: 'hypothesis-hubs',
      label: 'Hypothesis hubs',
      enabled: true,
      description: '',
    },
    findings: { id: 'findings', label: 'Findings', enabled: true, description: '' },
    wall: { id: 'wall', label: 'Wall', enabled: true, description: '' },
  },
  coerceCanvasOverlays: vi.fn(() => []),
  enabledCanvasOverlays: vi.fn(() => []),
  CANVAS_EMPTY_DROP_ID: 'canvas:empty',
  coerceCanvasLens: vi.fn(() => 'default'),
  isCanvasLensValidAtLevel: vi.fn(() => true),
  suggestCanvasLevelForLens: vi.fn((_lens: string, level: string) => level),
  encodeChipDragId: (chipId: string) => `chip:${chipId}`,
  encodeStepDropId: (stepId: string) => `step:${stepId}`,
  useChipDragAndDrop: () => ({ handleDragEnd: vi.fn() }),
  useHypothesisDrawTool: () => ({
    state: { phase: 'idle' },
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
    onPointerCancel: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
  }),
  resolveEndpointToFactor: vi.fn(() => undefined),
  useCanvasKeyboard: vi.fn(),
  useCanvasViewportShortcuts: vi.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
    tf: (key: string) => key,
  }),
  useProductionLineGlanceFilter: vi.fn(() => ({ value: {}, onChange: vi.fn() })),
  useProductionLineGlanceOpsToggle: vi.fn(() => ({
    mode: 'spatial' as const,
    setMode: vi.fn(),
    toggle: vi.fn(),
  })),
  useProductionLineGlanceData: vi.fn(() => ({
    cpkTrend: { data: [], stats: null, specs: {} },
    cpkGapTrend: { series: [], stats: null },
    capabilityNodes: [],
    errorSteps: [],
    availableContext: { hubColumns: [], tributaryGroups: [] },
    contextValueOptions: {},
  })),
  useCanvasStepCards: vi.fn(() => ({ cards: [] })),
  useCanvasAnalyzeOverlays: vi.fn(() => ({
    overlays: {
      byStep: {},
      arrows: [],
      unresolved: { questions: [], findings: [], hypotheses: [], causalLinks: [] },
    },
  })),
  useHasAnalyzeContent: vi.fn(() => false),
  useSharedWallProps: vi.fn(() => ({
    findings: [],
    processMap: null,
    problemCpk: undefined,
    eventsPerWeek: undefined,
    activeColumns: undefined,
    hubs: [],
    questions: [],
    problemContributionTree: undefined,
  })),
  useSessionCanvasFilters: vi.fn(() => ({
    timelineWindow: { kind: 'cumulative' as const },
    scopeFilter: undefined,
    paretoGroupBy: undefined,
    activeCanvasLens: 'default',
    activeCanvasOverlays: [],
    setTimelineWindow: vi.fn(),
    setScopeFilter: vi.fn(),
    setParetoGroupBy: vi.fn(),
    setActiveCanvasLens: vi.fn(),
    setActiveCanvasOverlays: vi.fn(),
    toggleCanvasOverlay: vi.fn(),
    activeCanvasTool: 'select' as const,
    setActiveCanvasTool: vi.fn(),
  })),
  useCanvasViewportInput: vi.fn(),
  useCanvasHypothesisDrawing: vi.fn(() => ({
    handlers: {
      onPointerDown: vi.fn(),
      onPointerMove: vi.fn(),
      onPointerUp: vi.fn(),
      onKeyDown: vi.fn(),
    },
    endpointLabel: () => '',
    parseEndpointElement: () => null,
  })),
  useCanvasHypothesisArrows: vi.fn(() => ({
    arrowSegments: [],
    registerCardElement: vi.fn(),
  })),
}));

import { CanvasWorkspace } from '../CanvasWorkspace';

// 2-node ProcessMap so detectScopeFromMap returns 'b1' (the EditModeShell branch).
// An empty map returns 'b0' which renders FrameViewB0 instead — not the shell path.
const twoNodeMap = (): ProcessMap => ({
  version: 1,
  nodes: [
    { id: 'step-1', name: 'Bake', order: 0 },
    { id: 'step-2', name: 'Pack', order: 1 },
  ],
  tributaries: [],
  createdAt: '2026-05-26T00:00:00.000Z',
  updatedAt: '2026-05-26T00:00:00.000Z',
});

function renderWorkspace(overrides: Partial<React.ComponentProps<typeof CanvasWorkspace>> = {}) {
  return render(
    <CanvasWorkspace
      rawData={[{ Y: 1 }, { Y: 2 }, { Y: 3 }]}
      outcome={null}
      factors={[]}
      measureSpecs={{}}
      processContext={{ processMap: twoNodeMap() }}
      setOutcome={vi.fn()}
      setFactors={vi.fn()}
      setMeasureSpec={vi.fn()}
      setProcessContext={vi.fn()}
      onSeeData={vi.fn()}
      {...overrides}
    />
  );
}

describe('CanvasWorkspace · EditModeShell wiring', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    useCanvasStore.setState(useCanvasStore.getInitialState());
    useCanvasViewportStore.setState(getCanvasViewportInitialState());
  });

  it('renders EditModeShell when in author mode and canEditCanvas is undefined (default permissive)', () => {
    renderWorkspace();
    // 2-node map + 1 unassigned chip (Y) → author mode auto-selected.
    expect(screen.getByTestId('edit-mode-shell')).toBeInTheDocument();
  });

  it('hides EditModeShell when canEditCanvas is false', () => {
    renderWorkspace({ canEditCanvas: false });
    expect(screen.queryByTestId('edit-mode-shell')).not.toBeInTheDocument();
  });

  it('hides the mode toggle when canEditCanvas is false', () => {
    renderWorkspace({ canEditCanvas: false });
    expect(screen.queryByRole('button', { name: 'Edit map' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });

  it('clicking Done in the shell switches to read mode and hides the shell', () => {
    renderWorkspace();
    // Scope the query to the shell — the CanvasModeToggle also exposes a "Done"
    // button (Spec 2 vocabulary rename in Task 1). The shell's Done is the one
    // EditModeShell ships, structurally inside data-testid="edit-mode-shell".
    const shell = screen.getByTestId('edit-mode-shell');
    const doneButton = within(shell).getAllByRole('button', { name: 'Done' })[0];
    fireEvent.click(doneButton);
    expect(screen.queryByTestId('edit-mode-shell')).not.toBeInTheDocument();
  });
});
