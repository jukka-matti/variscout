import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';

const wallIsMobileRef = vi.hoisted(() => ({ current: false }));

vi.mock('@variscout/charts', async () => {
  const React = await import('react');
  return {
    chartColors: {
      mean: '#3b82f6',
      warning: '#f59e0b',
    },
    IChart: () => React.createElement('div', { 'data-testid': 'mock-cpk-trend' }),
    CapabilityGapTrendChart: () => React.createElement('div', { 'data-testid': 'mock-gap-trend' }),
    CapabilityBoxplot: () =>
      React.createElement('div', { 'data-testid': 'mock-capability-boxplot' }),
    StepErrorPareto: () => React.createElement('div', { 'data-testid': 'mock-step-pareto' }),
  };
});

vi.mock('../../InvestigationWall', async () => {
  const React = await import('react');
  return {
    useWallIsMobile: () => wallIsMobileRef.current,
    WallCanvas: ({
      findings,
      problemCpk,
      eventsPerWeek,
      activeColumns,
    }: {
      findings?: unknown[];
      problemCpk?: unknown;
      eventsPerWeek?: unknown;
      activeColumns?: ReadonlyArray<string>;
    }) =>
      React.createElement('div', {
        'data-testid': 'wall-canvas',
        'data-findings-count': String(findings?.length ?? 0),
        'data-problem-cpk': String(problemCpk),
        'data-events-per-week': String(eventsPerWeek),
        'data-active-columns': (activeColumns ?? []).join(','),
      }),
  };
});

import { fireEvent, render, screen } from '@testing-library/react';
import type { Finding } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';
import type { CanvasInvestigationOverlayModel, CanvasStepCardModel } from '@variscout/hooks';
import { getInvestigationInitialState, useInvestigationStore } from '@variscout/stores';
import { Canvas } from '../index';

const SIGNALS = { hasIntervention: false, sustainmentConfirmed: false };

const map: ProcessMap = {
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

const mapWithSteps: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'step-1', name: 'Mix', order: 0 },
    { id: 'step-2', name: 'Fill', order: 1 },
  ],
  tributaries: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

const mapWithGroupedChildStep: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'step-1', name: 'Mix', order: 0 },
    { id: 'step-2', name: 'Fill', order: 1, parentStepId: 'step-1' },
  ],
  tributaries: [],
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

const data = {
  cpkTrend: { data: [], stats: null, specs: { target: 1.33 } },
  cpkGapTrend: { series: [], stats: null },
  capabilityNodes: [],
  errorSteps: [],
};

const filter = {
  availableContext: { hubColumns: [] },
  contextValueOptions: {},
  value: {},
  onChange: vi.fn(),
};

const stepCards: CanvasStepCardModel[] = [
  {
    stepId: 'step-1',
    stepName: 'Mix',
    assignedColumns: ['Pressure'],
    metricColumn: 'Pressure',
    metricKind: 'numeric',
    values: [10, 11, 12, 13],
    distribution: [],
    stats: {
      mean: 11.5,
      median: 11.5,
      stdDev: 1.29,
      sigmaWithin: 0.89,
      mrBar: 1,
      ucl: 14.17,
      lcl: 8.83,
      outOfSpecPercentage: 0,
    },
    capability: { state: 'no-specs', n: 4, canAddSpecs: true },
  },
  {
    stepId: 'step-2',
    stepName: 'Fill',
    assignedColumns: ['Defect'],
    metricColumn: 'Defect',
    metricKind: 'categorical',
    values: [],
    distribution: [{ label: 'Scratch', count: 7 }],
    capability: { state: 'no-specs', n: 0, canAddSpecs: true },
    defectCount: 7,
  },
];

const metriclessStepCards: CanvasStepCardModel[] = [
  { ...stepCards[0], metricColumn: undefined },
  stepCards[1],
];

const investigationOverlays: CanvasInvestigationOverlayModel = {
  byStep: {
    'step-1': {
      stepId: 'step-1',
      questions: [
        {
          id: 'q-1',
          text: 'Does pressure drive fill?',
          status: 'open',
          factor: 'Pressure',
          focus: { kind: 'question', id: 'q-1', questionId: 'q-1' },
        },
      ],
      findings: [
        {
          id: 'f-1',
          text: 'Pressure shift on Machine A',
          status: 'observed',
          questionId: 'q-1',
          focus: { kind: 'finding', id: 'f-1', questionId: 'q-1' },
        },
      ],
      hypotheses: [
        {
          id: 'hub-1',
          name: 'Pressure setup drift',
          status: 'proposed',
          questionId: 'q-1',
          focus: { kind: 'suspected-cause', id: 'hub-1', questionId: 'q-1' },
        },
      ],
      causalLinks: [
        {
          id: 'link-1',
          fromStepId: 'step-1',
          toStepId: 'step-2',
          label: 'Pressure drives fill',
          questionId: 'q-1',
          focus: { kind: 'causal-link', id: 'link-1', questionId: 'q-1' },
        },
      ],
      investigationCounts: { open: 2, supported: 0, refuted: 0 },
    },
    'step-2': {
      stepId: 'step-2',
      questions: [],
      findings: [],
      hypotheses: [],
      causalLinks: [],
      investigationCounts: { open: 0, supported: 0, refuted: 0 },
    },
  },
  arrows: [
    {
      id: 'link-1',
      fromStepId: 'step-1',
      toStepId: 'step-2',
      label: 'Pressure drives fill',
      questionId: 'q-1',
      focus: { kind: 'causal-link', id: 'link-1', questionId: 'q-1' },
    },
  ],
  unresolved: { questions: [], findings: [], hypotheses: [], causalLinks: [] },
};

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

const wallFinding = {
  id: 'finding-wall-1',
  text: 'Nozzle defects cluster after changeover',
  context: { activeFilters: {}, cumulativeScope: null },
  evidenceType: 'data',
  status: 'observed',
  comments: [],
  statusChangedAt: 0,
  investigationId: 'inv-1',
  createdAt: 0,
  deletedAt: null,
} satisfies Finding;

function renderCanvas(overrides: Partial<ComponentProps<typeof Canvas>> = {}) {
  const props: ComponentProps<typeof Canvas> = {
    map: mapWithSteps,
    availableColumns: ['Pressure', 'Defect'],
    onChange: vi.fn(),
    data,
    filter,
    signals: SIGNALS,
    stepCards,
    ...overrides,
  };
  render(<Canvas {...props} />);
  return props;
}

describe('Canvas', () => {
  beforeEach(() => {
    setViewport(1024, 768);
    wallIsMobileRef.current = false;
    useInvestigationStore.setState(getInvestigationInitialState());
  });

  it('renders the PR5 card surface instead of the dedicated operations band', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
      />
    );

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-card-surface')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-step-card-step-1')).toHaveTextContent('Mix');
    expect(screen.getByTestId('canvas-step-card-step-1')).toHaveTextContent('11.50 +/- 1.29 · n=4');
    expect(screen.queryByTestId('ops-band-dashboard')).not.toBeInTheDocument();
  });

  it('renders the chip rail in author mode when chips are available', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        mode="author"
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
      />
    );

    expect(screen.getByTestId('chip-rail')).toBeInTheDocument();
    expect(screen.getByTestId('chip-rail-item-Bake_Time')).toBeInTheDocument();
    expect(screen.getByTestId('process-map-empty-drop-target')).toHaveAttribute(
      'data-droppable-id',
      'canvas:empty'
    );
  });

  it('hides the chip rail in read mode even when chips are available', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        mode="read"
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
      />
    );

    expect(screen.queryByTestId('chip-rail')).not.toBeInTheDocument();
    expect(screen.getByTestId('process-map-empty-drop-target')).toHaveClass('hidden');
    expect(screen.getByTestId('process-map-empty-drop-target')).not.toHaveAttribute(
      'data-droppable-id'
    );
  });

  it('does not expose chip placement drop targets when no chips are available', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        mode="author"
      />
    );

    expect(screen.queryByTestId('chip-rail')).not.toBeInTheDocument();
    expect(screen.getByTestId('process-map-empty-drop-target')).toHaveClass('hidden');
    expect(screen.getByTestId('process-map-empty-drop-target')).not.toHaveAttribute(
      'data-droppable-id'
    );
  });

  it('does not expose chip placement controls when the canvas is disabled', () => {
    render(
      <Canvas
        map={map}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        mode="author"
        disabled
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
      />
    );

    expect(screen.queryByTestId('chip-rail')).not.toBeInTheDocument();
    expect(screen.getByTestId('process-map-empty-drop-target')).toHaveClass('hidden');
    expect(screen.getByTestId('process-map-empty-drop-target')).not.toHaveAttribute(
      'data-droppable-id'
    );
  });

  it('keeps the mode toggle visible in read mode and hides structural authoring chrome', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        mode="read"
        onModeChange={vi.fn()}
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
      />
    );

    expect(screen.getByRole('button', { name: /edit canvas/i })).toBeInTheDocument();
    expect(screen.queryByTestId('structural-toolbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chip-rail')).not.toBeInTheDocument();
  });

  it('shows structural toolbar in author mode and forwards toolbar actions', () => {
    const onAddStep = vi.fn();
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        mode="author"
        onModeChange={vi.fn()}
        onAddStep={onAddStep}
        onUndo={onUndo}
        onRedo={onRedo}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add step/i }));
    fireEvent.click(screen.getByRole('button', { name: /undo canvas action/i }));
    fireEvent.click(screen.getByRole('button', { name: /redo canvas action/i }));

    expect(onAddStep).toHaveBeenCalledTimes(1);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard chip pickup and drop onto a focused step', () => {
    const onPlaceChip = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        mode="author"
        chips={[{ chipId: 'Bake_Time', label: 'Bake Time', role: 'factor' }]}
        onPlaceChip={onPlaceChip}
      />
    );

    fireEvent.keyDown(screen.getByTestId('chip-rail-item-Bake_Time'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByTestId('process-map-step-step-1'), { key: 'Enter' });

    expect(onPlaceChip).toHaveBeenCalledWith('Bake_Time', 'step-1');
  });

  it('exposes ungroup controls for grouped child steps and forwards the child step id', () => {
    const onUngroupSubStep = vi.fn();

    render(
      <Canvas
        map={mapWithGroupedChildStep}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        onUngroupSubStep={onUngroupSubStep}
      />
    );

    expect(screen.queryByRole('button', { name: /ungroup step mix/i })).not.toBeInTheDocument();

    const ungroupButton = screen.getByRole('button', { name: /ungroup step fill/i });
    expect(screen.getByTestId('process-map-step-step-2')).not.toContainElement(ungroupButton);

    fireEvent.click(ungroupButton);

    expect(onUngroupSubStep).toHaveBeenCalledWith('step-2');
  });

  it('renders a lens picker and forwards enabled lens changes', () => {
    const onLensChange = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        activeLens="default"
        onLensChange={onLensChange}
      />
    );

    expect(screen.getByTestId('canvas-lens-picker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /default lens/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: /capability lens/i }));

    expect(onLensChange).toHaveBeenCalledWith('capability');
    expect(screen.getByRole('button', { name: /performance lens/i })).toBeDisabled();
  });

  it('renders overlay picker and forwards overlay toggles without changing the map', () => {
    const onChange = vi.fn();
    const onOverlayToggle = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={onChange}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        activeOverlays={[]}
        onOverlayToggle={onOverlayToggle}
      />
    );

    expect(screen.getByTestId('canvas-overlay-picker')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /findings overlay/i }));

    expect(onOverlayToggle).toHaveBeenCalledWith('findings');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('hides the Wall overlay toggle when investigation content is empty', () => {
    renderCanvas();

    expect(screen.getByTestId('canvas-overlay-picker')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /wall overlay/i })).not.toBeInTheDocument();
  });

  it('shows the Wall overlay toggle when investigation content exists on desktop', () => {
    useInvestigationStore.getState().addQuestion('Does pressure explain defect clusters?');

    renderCanvas();

    expect(screen.getByRole('button', { name: /wall overlay/i })).toBeInTheDocument();
  });

  it('mounts the CanvasWallOverlay when the Wall overlay is active and content exists', () => {
    useInvestigationStore.getState().addQuestion('Does pressure explain defect clusters?');

    renderCanvas({
      activeOverlays: ['wall'],
      findings: [wallFinding],
      problemCpk: 0.82,
      eventsPerWeek: 14,
      activeColumns: ['Machine', 'Defect'],
    });

    expect(screen.getByTestId('canvas-wall-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-findings-count', '1');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-problem-cpk', '0.82');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute('data-events-per-week', '14');
    expect(screen.getByTestId('wall-canvas')).toHaveAttribute(
      'data-active-columns',
      'Machine,Defect'
    );
  });

  it('hides the Wall overlay toggle on mobile and shows the Wall shortcut when content exists', () => {
    wallIsMobileRef.current = true;
    useInvestigationStore.getState().addQuestion('Does pressure explain defect clusters?');

    renderCanvas({ onOpenWall: vi.fn() });

    expect(screen.queryByRole('button', { name: /wall overlay/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('canvas-wall-shortcut-button')).toBeInTheDocument();
  });

  it('calls onOpenWall once from the mobile Wall shortcut', () => {
    const onOpenWall = vi.fn();
    wallIsMobileRef.current = true;
    useInvestigationStore.getState().addQuestion('Does pressure explain defect clusters?');

    renderCanvas({ onOpenWall });

    fireEvent.click(screen.getByTestId('canvas-wall-shortcut-button'));

    expect(onOpenWall).toHaveBeenCalledTimes(1);
  });

  it('renders the hypothesis draw tool button and forwards tool changes', () => {
    const onCanvasToolChange = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        activeCanvasTool="select"
        onCanvasToolChange={onCanvasToolChange}
      />
    );

    fireEvent.click(screen.getByTestId('hypothesis-draw-tool-button'));

    expect(onCanvasToolChange).toHaveBeenCalledWith('draw-hypothesis');
  });

  it('draws a hypothesis arrow, opens the form, and saves a causal link', () => {
    const onAddCausalLink = vi.fn();
    const onCanvasToolChange = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        activeCanvasTool="draw-hypothesis"
        onCanvasToolChange={onCanvasToolChange}
        onAddCausalLink={onAddCausalLink}
        questions={[{ id: 'q-1', text: 'Does pressure drive fill?' }]}
      />
    );

    const surface = screen.getByTestId('canvas-card-surface');
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 800,
      bottom: 400,
      width: 800,
      height: 400,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerDown(screen.getByTestId('canvas-step-card-step-1'), {
      clientX: 10,
      clientY: 20,
    });
    fireEvent.pointerMove(screen.getByTestId('canvas-step-card-step-2'), {
      clientX: 100,
      clientY: 50,
    });
    expect(screen.getByTestId('canvas-rubber-band')).toBeInTheDocument();
    fireEvent.pointerUp(screen.getByTestId('canvas-step-card-step-2'), {
      clientX: 100,
      clientY: 50,
    });

    expect(screen.getByTestId('hypothesis-draft-popover')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/because/i), {
      target: { value: 'thermal coupling between chambers' },
    });
    fireEvent.change(screen.getByLabelText(/link to question/i), { target: { value: 'q-1' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onAddCausalLink).toHaveBeenCalledWith(
      'Pressure',
      'Defect',
      'thermal coupling between chambers',
      {
        questionIds: ['q-1'],
      }
    );
    expect(onCanvasToolChange).toHaveBeenCalledWith('select');
  });

  it('cancels an awaiting hypothesis without committing', () => {
    const onAddCausalLink = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        activeCanvasTool="draw-hypothesis"
        onAddCausalLink={onAddCausalLink}
      />
    );

    fireEvent.pointerDown(screen.getByTestId('canvas-step-card-step-1'), {
      clientX: 10,
      clientY: 20,
    });
    fireEvent.pointerUp(screen.getByTestId('canvas-step-card-step-2'), {
      clientX: 100,
      clientY: 50,
    });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByTestId('hypothesis-draft-popover')).not.toBeInTheDocument();
    expect(onAddCausalLink).not.toHaveBeenCalled();
  });

  it('does not start draw-flow hypotheses from metric-less step endpoints', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={metriclessStepCards}
        activeCanvasTool="draw-hypothesis"
      />
    );

    fireEvent.pointerDown(screen.getByTestId('canvas-step-card-step-1'), {
      clientX: 10,
      clientY: 20,
    });
    fireEvent.pointerUp(screen.getByTestId('canvas-step-card-step-2'), {
      clientX: 100,
      clientY: 50,
    });

    expect(screen.queryByTestId('hypothesis-draft-popover')).not.toBeInTheDocument();
  });

  it('supports keyboard source and target selection while draw tool is active', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        activeCanvasTool="draw-hypothesis"
      />
    );

    const step1 = screen.getByTestId('canvas-step-card-step-1');
    const step2 = screen.getByTestId('canvas-step-card-step-2');
    step1.focus();
    fireEvent.keyDown(step1, { key: 'Enter' });
    step2.focus();
    fireEvent.keyDown(step2, { key: 'Enter' });

    expect(screen.getByTestId('hypothesis-draft-popover')).toBeInTheDocument();
  });

  it('supports keyboard source and target selection for column endpoints', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        activeCanvasTool="draw-hypothesis"
      />
    );

    const sourceColumn = screen.getByLabelText('Hypothesis endpoint Pressure');
    const targetColumn = screen.getByLabelText('Hypothesis endpoint Defect');
    sourceColumn.focus();
    fireEvent.keyDown(sourceColumn, { key: 'Enter' });
    targetColumn.focus();
    fireEvent.keyDown(targetColumn, { key: 'Enter' });

    expect(screen.getByTestId('hypothesis-draft-popover')).toBeInTheDocument();
  });

  it('supports keyboard column endpoints on metric-less source cards', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={metriclessStepCards}
        activeCanvasTool="draw-hypothesis"
      />
    );

    const sourceColumn = screen.getByLabelText('Hypothesis endpoint Pressure');
    const targetColumn = screen.getByLabelText('Hypothesis endpoint Defect');
    sourceColumn.focus();
    fireEvent.keyDown(sourceColumn, { key: 'Enter' });
    targetColumn.focus();
    fireEvent.keyDown(targetColumn, { key: 'Enter' });

    expect(screen.getByTestId('hypothesis-draft-popover')).toBeInTheDocument();
  });

  it('projects investigation, finding, and suspected-cause markers only when overlays are active', () => {
    const { rerender } = render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        investigationOverlays={investigationOverlays}
        activeOverlays={[]}
      />
    );

    expect(screen.queryByTestId('canvas-step-investigation-badge-step-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('canvas-step-finding-pin-step-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step-node-marker')).not.toBeInTheDocument();

    rerender(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        investigationOverlays={investigationOverlays}
        activeOverlays={['investigations', 'findings', 'hypothesis-hubs']}
      />
    );

    expect(screen.getByTestId('canvas-step-investigation-badge-step-1')).toHaveTextContent(
      '2 investigation'
    );
    expect(screen.getByTestId('canvas-step-finding-pin-step-1')).toHaveTextContent('1 finding');
    expect(screen.getByTestId('step-node-marker')).toHaveTextContent('1');
  });

  it('renders hypothesis arrows when the hypotheses overlay is active', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        investigationOverlays={investigationOverlays}
        activeOverlays={['hypotheses']}
      />
    );

    expect(screen.getByTestId('canvas-hypothesis-arrow-link-1')).toBeInTheDocument();
  });

  it('remeasures hypothesis arrows after viewport resize', () => {
    let cardOffset = 0;
    const rectFor = (left: number, top: number, width: number, height: number): DOMRect =>
      ({
        x: left,
        y: top,
        top,
        left,
        right: left + width,
        bottom: top + height,
        width,
        height,
        toJSON: () => ({}),
      }) as DOMRect;
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        if (this.dataset.testid === 'canvas-card-surface') return rectFor(0, 0, 800, 400);
        if (this.dataset.testid === 'canvas-step-card-step-1')
          return rectFor(cardOffset, 10, 100, 80);
        if (this.dataset.testid === 'canvas-step-card-step-2')
          return rectFor(200 + cardOffset, 10, 100, 80);
        return rectFor(0, 0, 0, 0);
      });

    try {
      render(
        <Canvas
          map={mapWithSteps}
          availableColumns={[]}
          onChange={() => {}}
          data={data}
          filter={filter}
          signals={SIGNALS}
          stepCards={stepCards}
          investigationOverlays={investigationOverlays}
          activeOverlays={['hypotheses']}
        />
      );

      const arrow = screen.getByTestId('canvas-hypothesis-arrow-link-1');
      expect(arrow).toHaveAttribute('x1', '50');
      expect(arrow).toHaveAttribute('x2', '250');

      cardOffset = 20;
      fireEvent.resize(window);

      expect(arrow).toHaveAttribute('x1', '70');
      expect(arrow).toHaveAttribute('x2', '270');
    } finally {
      rectSpy.mockRestore();
    }
  });

  it('opens and dismisses the step overlay from a card click', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
      />
    );

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));

    expect(screen.getByTestId('canvas-step-overlay')).toHaveTextContent('Mix');

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByTestId('canvas-step-overlay')).not.toBeInTheDocument();
  });

  it('anchors the desktop step overlay near the clicked card', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
      />
    );

    const card = screen.getByTestId('canvas-step-card-step-1');
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      x: 200,
      y: 120,
      top: 120,
      left: 200,
      right: 320,
      bottom: 280,
      width: 120,
      height: 160,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.click(card);

    expect(screen.getByTestId('canvas-step-overlay')).toHaveStyle({
      top: '120px',
      left: '332px',
    });
  });

  it('clamps the desktop step overlay inside the viewport near edge cards', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
      />
    );

    const card = screen.getByTestId('canvas-step-card-step-1');
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      x: 940,
      y: 700,
      top: 700,
      left: 940,
      right: 1020,
      bottom: 760,
      width: 80,
      height: 60,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.click(card);

    expect(screen.getByTestId('canvas-step-overlay')).toHaveStyle({
      top: '392px',
      left: '568px',
    });
  });

  it('renders the mobile step overlay as a swipe-dismiss bottom sheet', () => {
    setViewport(500, 760);

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
      />
    );

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));

    const overlay = screen.getByTestId('canvas-step-overlay');
    expect(screen.getByTestId('canvas-step-overlay-handle')).toBeInTheDocument();
    expect(overlay).toHaveClass('rounded-t-lg');
    expect(overlay).not.toHaveStyle({ top: '120px' });

    fireEvent.touchStart(overlay, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(overlay, { changedTouches: [{ clientY: 180 }] });

    expect(screen.queryByTestId('canvas-step-overlay')).not.toBeInTheDocument();
  });

  it('shows capability state and defect count in the step overlay when projected', () => {
    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
      />
    );

    fireEvent.click(screen.getByTestId('canvas-step-card-step-2'));

    expect(screen.getByTestId('canvas-step-overlay')).toHaveTextContent('Capability');
    expect(screen.getByTestId('canvas-step-overlay')).toHaveTextContent('Defects: 7');
  });

  it('shows linked investigation items in the step overlay and opens focus callbacks', () => {
    const onOpenInvestigationFocus = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        investigationOverlays={investigationOverlays}
        onOpenInvestigationFocus={onOpenInvestigationFocus}
      />
    );

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));
    fireEvent.click(screen.getByRole('button', { name: /question: does pressure drive fill/i }));

    expect(screen.getByTestId('canvas-step-overlay')).toHaveTextContent(
      'Finding: Pressure shift on Machine A'
    );
    expect(screen.getByTestId('canvas-step-overlay')).toHaveTextContent(
      'Cause: Pressure setup drift'
    );
    expect(onOpenInvestigationFocus).toHaveBeenCalledWith({
      kind: 'question',
      id: 'q-1',
      questionId: 'q-1',
    });
  });

  it('forwards causal link removal from the step overlay', () => {
    const onRemoveCausalLink = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        investigationOverlays={investigationOverlays}
        onRemoveCausalLink={onRemoveCausalLink}
      />
    );

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));
    fireEvent.click(
      screen.getByRole('button', { name: /remove hypothesis pressure drives fill/i })
    );

    expect(onRemoveCausalLink).toHaveBeenCalledWith('link-1');
  });

  it('keeps spec edit affordances separate from card drill-down', () => {
    const onStepSpecsRequest = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        onStepSpecsRequest={onStepSpecsRequest}
      />
    );

    const mixCard = screen.getByTestId('canvas-step-card-step-1');
    expect(mixCard.tagName).toBe('DIV');

    fireEvent.click(mixCard);

    expect(screen.getByTestId('canvas-step-overlay')).toHaveTextContent('Mix');

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByTestId('canvas-step-overlay')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add specs for mix/i }));

    expect(onStepSpecsRequest).toHaveBeenCalledWith('Pressure', 'step-1');
    expect(screen.queryByTestId('canvas-step-overlay')).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('button', { name: /add specs for mix/i }), {
      key: 'Enter',
    });

    expect(screen.queryByTestId('canvas-step-overlay')).not.toBeInTheDocument();

    mixCard.focus();
    fireEvent.keyDown(mixCard, { key: 'Enter' });

    expect(screen.getByTestId('canvas-step-overlay')).toHaveTextContent('Mix');
  });

  it('wires the two PR5 response paths from the overlay', () => {
    const onQuickAction = vi.fn();
    const onFocusedInvestigation = vi.fn();

    render(
      <Canvas
        map={mapWithSteps}
        availableColumns={[]}
        onChange={() => {}}
        data={data}
        filter={filter}
        signals={SIGNALS}
        stepCards={stepCards}
        onQuickAction={onQuickAction}
        onFocusedInvestigation={onFocusedInvestigation}
      />
    );

    fireEvent.click(screen.getByTestId('canvas-step-card-step-1'));
    fireEvent.click(screen.getByRole('button', { name: /quick action/i }));
    fireEvent.click(screen.getByRole('button', { name: /focused investigation/i }));

    expect(onQuickAction).toHaveBeenCalledWith('step-1');
    expect(onFocusedInvestigation).toHaveBeenCalledWith('step-1');
    expect(screen.queryByTestId('canvas-cta-charter')).not.toBeInTheDocument();
  });
});
