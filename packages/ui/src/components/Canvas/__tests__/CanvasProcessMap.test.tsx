import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessMap } from '../internal/ProcessMap';
import type { ProcessMap as CoreProcessMap, Gap } from '@variscout/core/frame';
import type { SpecRule } from '@variscout/core';
import { CANVAS_EMPTY_DROP_ID, encodeStepDropId } from '@variscout/hooks';

const isoNow = () => new Date('2026-04-18T12:00:00.000Z').toISOString();

const emptyMap = (): CoreProcessMap => ({
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: isoNow(),
  updatedAt: isoNow(),
});

const mapWithOneStep = (): CoreProcessMap => ({
  version: 1,
  nodes: [{ id: 'step-1', name: 'Fill', order: 0 }],
  tributaries: [],
  createdAt: isoNow(),
  updatedAt: isoNow(),
});

const mapWithTwoSteps = (): CoreProcessMap => ({
  version: 1,
  nodes: [
    { id: 'step-1', name: 'Mix', order: 0 },
    { id: 'step-2', name: 'Fill', order: 1, ctqColumn: 'Fill_Weight' },
  ],
  tributaries: [{ id: 'trib-1', stepId: 'step-2', column: 'Machine' }],
  subgroupAxes: [],
  createdAt: isoNow(),
  updatedAt: isoNow(),
});

const mapWithExplicitArrow = (): CoreProcessMap => ({
  ...mapWithTwoSteps(),
  arrows: [{ id: 'arrow-step-1-to-step-2', fromStepId: 'step-1', toStepId: 'step-2' }],
});

const COLUMNS = ['Fill_Weight', 'Machine', 'Shift', 'Lot', 'Timestamp'];

describe('Canvas internal process map — rendering', () => {
  it('renders steps in `order`, regardless of array order', () => {
    const map = emptyMap();
    map.nodes = [
      { id: 'step-B', name: 'B', order: 1 },
      { id: 'step-A', name: 'A', order: 0 },
      { id: 'step-C', name: 'C', order: 2 },
    ];
    render(<ProcessMap map={map} availableColumns={COLUMNS} onChange={vi.fn()} />);
    const nameInputs = [
      screen.getByTestId('process-map-step-name-step-A'),
      screen.getByTestId('process-map-step-name-step-B'),
      screen.getByTestId('process-map-step-name-step-C'),
    ] as HTMLInputElement[];
    // DOM left→right order must match the `order` field, not array order.
    const spine = screen.getByTestId('process-map-spine');
    const allCards = Array.from(spine.querySelectorAll('[data-testid^="process-map-step-step-"]'));
    expect(allCards.map(c => c.getAttribute('data-testid'))).toEqual([
      'process-map-step-step-A',
      'process-map-step-step-B',
      'process-map-step-step-C',
    ]);
    expect(nameInputs.map(i => i.value)).toEqual(['A', 'B', 'C']);
  });

  it('renders the ocean card with the CTS dropdown', () => {
    render(<ProcessMap map={emptyMap()} availableColumns={COLUMNS} onChange={vi.fn()} />);
    expect(screen.getByTestId('process-map-ocean')).toBeInTheDocument();
    expect(screen.getByTestId('process-map-ocean-cts')).toBeInTheDocument();
  });

  it('renders a flow arrow between each pair of adjacent steps plus a final arrow to the ocean', () => {
    render(<ProcessMap map={mapWithTwoSteps()} availableColumns={COLUMNS} onChange={vi.fn()} />);
    // 2 steps → 1 inter-step arrow + 1 ocean arrow
    expect(screen.getByTestId('process-map-arrow-0')).toBeInTheDocument();
    expect(screen.getByTestId('process-map-ocean-arrow')).toBeInTheDocument();
  });

  it('marks process steps and the empty flow area as chip drop targets when enabled', () => {
    render(
      <ProcessMap
        map={mapWithOneStep()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        chipDropTargets
      />
    );

    expect(screen.getByTestId('process-map-step-step-1')).toHaveAttribute(
      'data-droppable-id',
      encodeStepDropId('step-1')
    );
    expect(screen.getByTestId('process-map-empty-drop-target')).toHaveAttribute(
      'data-droppable-id',
      CANVAS_EMPTY_DROP_ID
    );
  });

  it('selects steps with Cmd/Ctrl-click and exposes aria-selected', () => {
    const onSelectionChange = vi.fn();
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        selectedStepIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );

    fireEvent.click(screen.getByTestId('process-map-step-step-1'), { metaKey: true });

    expect(onSelectionChange).toHaveBeenCalledWith(['step-1']);
  });

  it('renders explicit map arrows and disconnects them through callback', () => {
    const onDisconnectSteps = vi.fn();
    render(
      <ProcessMap
        map={mapWithExplicitArrow()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        onDisconnectSteps={onDisconnectSteps}
      />
    );

    expect(
      screen.getByTestId('process-map-explicit-arrow-arrow-step-1-to-step-2')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /disconnect Mix to Fill/i }));

    expect(onDisconnectSteps).toHaveBeenCalledWith('step-1', 'step-2');
  });
});

describe('Canvas internal process map — step CRUD', () => {
  it('invokes onChange with a new step appended when the "+ step" button is clicked', () => {
    const onChange = vi.fn();
    render(<ProcessMap map={emptyMap()} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('process-map-add-step'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as CoreProcessMap;
    expect(next.nodes).toHaveLength(1);
    expect(next.nodes[0].order).toBe(0);
    expect(next.nodes[0].name).toBe('');
  });

  it('renames a step inline via the text input', () => {
    const onChange = vi.fn();
    render(<ProcessMap map={mapWithOneStep()} availableColumns={COLUMNS} onChange={onChange} />);
    const input = screen.getByTestId('process-map-step-name-step-1') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Fill-renamed' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as CoreProcessMap;
    expect(next.nodes[0].name).toBe('Fill-renamed');
  });

  it('removes a step and re-packs the order field', () => {
    const onChange = vi.fn();
    const map: CoreProcessMap = {
      ...emptyMap(),
      nodes: [
        { id: 'step-1', name: 'A', order: 0 },
        { id: 'step-2', name: 'B', order: 1 },
        { id: 'step-3', name: 'C', order: 2 },
      ],
    };
    render(<ProcessMap map={map} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove step B'));
    const next = onChange.mock.calls[0][0] as CoreProcessMap;
    expect(next.nodes.map(n => n.id)).toEqual(['step-1', 'step-3']);
    expect(next.nodes.map(n => n.order)).toEqual([0, 1]);
  });

  it('removing a step also cleans up its tributaries and hunches', () => {
    const onChange = vi.fn();
    const map: CoreProcessMap = {
      ...mapWithTwoSteps(),
      assignments: { Machine: 'step-2', Operator: 'step-1' },
      hunches: [{ id: 'h-1', text: 'Nozzle wear', stepId: 'step-2' }],
    };
    render(<ProcessMap map={map} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove step Fill'));
    const next = onChange.mock.calls[0][0] as CoreProcessMap;
    expect(next.nodes.some(n => n.id === 'step-2')).toBe(false);
    expect(next.tributaries.some(t => t.stepId === 'step-2')).toBe(false);
    expect(next.hunches?.some(h => h.stepId === 'step-2')).toBe(false);
    expect(next.assignments).toEqual({ Operator: 'step-1' });
  });

  // IM-0b-2 (ADR-087 §5): ctqColumn authoring now dispatches `onSetStepCtq`
  // (canvasStore-backed) when the prop is provided — canvasStore is the single
  // authoring authority. The legacy `onChange` map-build is the fallback when no
  // dispatch prop is wired (covered separately below).
  it('dispatches onSetStepCtq when the CTQ dropdown changes (canvasStore path)', () => {
    const onSetStepCtq = vi.fn();
    const onChange = vi.fn();
    render(
      <ProcessMap
        map={mapWithOneStep()}
        availableColumns={COLUMNS}
        onChange={onChange}
        onSetStepCtq={onSetStepCtq}
      />
    );
    const select = screen.getByTestId('process-map-step-ctq-step-1') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Fill_Weight' } });
    expect(onSetStepCtq).toHaveBeenCalledWith('step-1', 'Fill_Weight');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('falls back to onChange map-build for CTQ when onSetStepCtq is absent (back-compat)', () => {
    const onChange = vi.fn();
    render(<ProcessMap map={mapWithOneStep()} availableColumns={COLUMNS} onChange={onChange} />);
    const select = screen.getByTestId('process-map-step-ctq-step-1') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Fill_Weight' } });
    const next = onChange.mock.calls[0][0] as CoreProcessMap;
    expect(next.nodes[0].ctqColumn).toBe('Fill_Weight');
  });
});

// IM-0b-2 (ADR-087 §5): tributary + subgroup-axis authoring now dispatches the
// canvasStore-backed props (onAddTributary / onRemoveTributary /
// onToggleSubgroupAxis). The removeTributary subgroupAxes+hunches cascade lives
// in the canvasStore action (asserted in canvasStore.test.ts), not in the
// component — the component only fires the dispatch. Legacy onChange map-build
// fallbacks are covered below.
describe('Canvas internal process map — tributary CRUD (canvasStore dispatch)', () => {
  it('dispatches onAddTributary with the step id + column when confirming the inline selector', () => {
    const onChange = vi.fn();
    const onAddTributary = vi.fn();
    render(
      <ProcessMap
        map={mapWithOneStep()}
        availableColumns={COLUMNS}
        onChange={onChange}
        onAddTributary={onAddTributary}
      />
    );
    const selector = screen.getByTestId(
      'process-map-step-add-tributary-select-step-1'
    ) as HTMLSelectElement;
    fireEvent.change(selector, { target: { value: 'Machine' } });
    fireEvent.click(screen.getByLabelText('Confirm add tributary to Fill'));
    expect(onAddTributary).toHaveBeenCalledWith('step-1', 'Machine');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('dispatches onRemoveTributary with the tributary id', () => {
    const onChange = vi.fn();
    const onRemoveTributary = vi.fn();
    const map: CoreProcessMap = {
      ...mapWithTwoSteps(),
      subgroupAxes: ['trib-1'],
    };
    render(
      <ProcessMap
        map={map}
        availableColumns={COLUMNS}
        onChange={onChange}
        onRemoveTributary={onRemoveTributary}
      />
    );
    fireEvent.click(screen.getByLabelText('Remove tributary Machine'));
    expect(onRemoveTributary).toHaveBeenCalledWith('trib-1');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('dispatches onToggleSubgroupAxis when toggled on', () => {
    const onChange = vi.fn();
    const onToggleSubgroupAxis = vi.fn();
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={onChange}
        onToggleSubgroupAxis={onToggleSubgroupAxis}
      />
    );
    fireEvent.click(screen.getByLabelText('Use Machine as subgroup axis'));
    expect(onToggleSubgroupAxis).toHaveBeenCalledWith('trib-1');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('dispatches onToggleSubgroupAxis when toggled off (store owns add/remove logic)', () => {
    const onChange = vi.fn();
    const onToggleSubgroupAxis = vi.fn();
    const map: CoreProcessMap = { ...mapWithTwoSteps(), subgroupAxes: ['trib-1'] };
    render(
      <ProcessMap
        map={map}
        availableColumns={COLUMNS}
        onChange={onChange}
        onToggleSubgroupAxis={onToggleSubgroupAxis}
      />
    );
    fireEvent.click(screen.getByLabelText('Use Machine as subgroup axis'));
    expect(onToggleSubgroupAxis).toHaveBeenCalledWith('trib-1');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Canvas internal process map — tributary CRUD (legacy onChange fallback)', () => {
  it('builds the next map via onChange when no dispatch props are wired (add)', () => {
    const onChange = vi.fn();
    render(<ProcessMap map={mapWithOneStep()} availableColumns={COLUMNS} onChange={onChange} />);
    const selector = screen.getByTestId(
      'process-map-step-add-tributary-select-step-1'
    ) as HTMLSelectElement;
    fireEvent.change(selector, { target: { value: 'Machine' } });
    fireEvent.click(screen.getByLabelText('Confirm add tributary to Fill'));
    const next = onChange.mock.calls[0][0] as CoreProcessMap;
    expect(next.tributaries).toHaveLength(1);
    expect(next.tributaries[0].column).toBe('Machine');
    expect(next.tributaries[0].stepId).toBe('step-1');
  });

  it('clears subgroupAxes through onChange when removing a tributary without dispatch props', () => {
    const onChange = vi.fn();
    const map: CoreProcessMap = {
      ...mapWithTwoSteps(),
      subgroupAxes: ['trib-1'],
    };
    render(<ProcessMap map={map} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove tributary Machine'));
    const next = onChange.mock.calls[0][0] as CoreProcessMap;
    expect(next.tributaries).toHaveLength(0);
    expect(next.subgroupAxes).toEqual([]);
  });
});

describe('Canvas internal process map — CTS / ocean', () => {
  it('sets the CTS column via the ocean dropdown', () => {
    const onChange = vi.fn();
    render(<ProcessMap map={emptyMap()} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('process-map-ocean-cts'), {
      target: { value: 'Fill_Weight' },
    });
    const next = onChange.mock.calls[0][0] as CoreProcessMap;
    expect(next.ctsColumn).toBe('Fill_Weight');
  });

  it('invokes onSpecsChange when target/USL/LSL inputs change (carries cpkTarget through)', () => {
    const onChange = vi.fn();
    const onSpecsChange = vi.fn();
    render(
      <ProcessMap
        map={emptyMap()}
        availableColumns={COLUMNS}
        onChange={onChange}
        onSpecsChange={onSpecsChange}
        target={500}
        lsl={495}
        usl={505}
        cpkTarget={1.67}
      />
    );
    fireEvent.change(screen.getByTestId('process-map-ocean-lsl'), { target: { value: '490' } });
    expect(onSpecsChange).toHaveBeenCalledWith({
      target: 500,
      usl: 505,
      lsl: 490,
      cpkTarget: 1.67,
    });
  });

  it('renders the Cpk target input alongside USL/LSL/target when onSpecsChange is provided', () => {
    render(
      <ProcessMap
        map={emptyMap()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        onSpecsChange={vi.fn()}
        cpkTarget={1.33}
      />
    );
    const input = screen.getByTestId('process-map-ocean-cpk-target') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('1.33');
  });

  it('emits a cpkTarget change via onSpecsChange when the Cpk target input is edited', () => {
    const onSpecsChange = vi.fn();
    render(
      <ProcessMap
        map={emptyMap()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        onSpecsChange={onSpecsChange}
        target={500}
        lsl={495}
        usl={505}
      />
    );
    fireEvent.change(screen.getByTestId('process-map-ocean-cpk-target'), {
      target: { value: '2.0' },
    });
    expect(onSpecsChange).toHaveBeenCalledWith({
      target: 500,
      usl: 505,
      lsl: 495,
      cpkTarget: 2.0,
    });
  });
});

// IM-0b-2 (ADR-087 §5): hunch authoring now dispatches onAddHunch / onRemoveHunch
// (canvasStore-backed) carrying the trimmed text + pin. The HunchList still
// guards empty text before dispatching. Legacy onChange map-build fallback is
// covered below.
describe('Canvas internal process map — hunches (canvasStore dispatch)', () => {
  it('dispatches onAddHunch with the trimmed text + tributary pin', () => {
    const onChange = vi.fn();
    const onAddHunch = vi.fn();
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={onChange}
        onAddHunch={onAddHunch}
      />
    );
    fireEvent.change(screen.getByTestId('process-map-hunch-text'), {
      target: { value: 'Nozzle wear on night shift' },
    });
    fireEvent.change(screen.getByTestId('process-map-hunch-pin'), {
      target: { value: 'trib:trib-1' },
    });
    fireEvent.click(screen.getByTestId('process-map-hunch-add'));
    expect(onAddHunch).toHaveBeenCalledWith('Nozzle wear on night shift', {
      tributaryId: 'trib-1',
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not dispatch onAddHunch for an empty hunch (HunchList guard)', () => {
    const onChange = vi.fn();
    const onAddHunch = vi.fn();
    render(
      <ProcessMap
        map={mapWithOneStep()}
        availableColumns={COLUMNS}
        onChange={onChange}
        onAddHunch={onAddHunch}
      />
    );
    fireEvent.click(screen.getByTestId('process-map-hunch-add'));
    expect(onAddHunch).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('dispatches onRemoveHunch with the hunch id', () => {
    const onChange = vi.fn();
    const onRemoveHunch = vi.fn();
    const map: CoreProcessMap = {
      ...mapWithOneStep(),
      hunches: [{ id: 'h-1', text: 'Nozzle wear', stepId: 'step-1' }],
    };
    render(
      <ProcessMap
        map={map}
        availableColumns={COLUMNS}
        onChange={onChange}
        onRemoveHunch={onRemoveHunch}
      />
    );
    fireEvent.click(screen.getByLabelText('Remove hunch Nozzle wear'));
    expect(onRemoveHunch).toHaveBeenCalledWith('h-1');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Canvas internal process map — hunches (legacy onChange fallback)', () => {
  it('builds the next map via onChange when no dispatch props are wired (add)', () => {
    const onChange = vi.fn();
    render(<ProcessMap map={mapWithTwoSteps()} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('process-map-hunch-text'), {
      target: { value: 'Nozzle wear on night shift' },
    });
    fireEvent.change(screen.getByTestId('process-map-hunch-pin'), {
      target: { value: 'trib:trib-1' },
    });
    fireEvent.click(screen.getByTestId('process-map-hunch-add'));
    const next = onChange.mock.calls[0][0] as CoreProcessMap;
    expect(next.hunches).toHaveLength(1);
    expect(next.hunches?.[0].text).toBe('Nozzle wear on night shift');
    expect(next.hunches?.[0].tributaryId).toBe('trib-1');
  });

  it('removes a hunch through onChange when no dispatch props are wired', () => {
    const onChange = vi.fn();
    const map: CoreProcessMap = {
      ...mapWithOneStep(),
      hunches: [{ id: 'h-1', text: 'Nozzle wear', stepId: 'step-1' }],
    };
    render(<ProcessMap map={map} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove hunch Nozzle wear'));
    const next = onChange.mock.calls[0][0] as CoreProcessMap;
    expect(next.hunches).toEqual([]);
  });
});

describe('Canvas internal process map — gap rendering', () => {
  const requiredGap: Gap = {
    kind: 'missing-spec-limits',
    severity: 'required',
    message: 'No specification limits.',
  };
  const recommendedGap: Gap = {
    kind: 'missing-time-axis',
    severity: 'recommended',
    message: 'No time or batch axis.',
  };
  const stepGap: Gap = {
    kind: 'missing-ctq-at-step',
    severity: 'recommended',
    message: 'No CTQ at "Fill".',
    stepId: 'step-2',
  };

  it('renders the GapStrip with required and recommended gaps at the bottom', () => {
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        gaps={[requiredGap, recommendedGap]}
      />
    );
    expect(screen.getByTestId('process-map-gap-strip')).toBeInTheDocument();
    expect(screen.getByTestId('process-map-gap-required-missing-spec-limits')).toBeInTheDocument();
    expect(screen.getByTestId('process-map-gap-recommended-missing-time-axis')).toBeInTheDocument();
  });

  it('renders step-scoped gaps inline next to the affected step, not in the strip', () => {
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        gaps={[stepGap]}
      />
    );
    expect(screen.getByTestId('process-map-step-gaps-step-2')).toBeInTheDocument();
    expect(screen.queryByTestId('process-map-gap-strip')).not.toBeInTheDocument();
  });

  it('renders nothing when the gaps array is empty or omitted', () => {
    render(<ProcessMap map={mapWithTwoSteps()} availableColumns={COLUMNS} onChange={vi.fn()} />);
    expect(screen.queryByTestId('process-map-gap-strip')).not.toBeInTheDocument();
  });

  it('GapStrip is suppressed when showGaps is false (b0 FrameView opt-out)', () => {
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        gaps={[requiredGap, recommendedGap]}
        showGaps={false}
      />
    );
    // Even though the parent supplied global gaps, the strip is hidden in b0.
    expect(screen.queryByTestId('process-map-gap-strip')).not.toBeInTheDocument();
  });
});

describe('Canvas internal process map — disabled mode', () => {
  it('hides destructive / additive controls when disabled', () => {
    render(
      <ProcessMap map={mapWithTwoSteps()} availableColumns={COLUMNS} onChange={vi.fn()} disabled />
    );
    expect(screen.queryByTestId('process-map-add-step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('process-map-hunch-add')).not.toBeInTheDocument();
    // Existing elements still render; name input still shows value
    expect(screen.getByTestId('process-map-step-name-step-1')).toBeInTheDocument();
  });
});

describe('Canvas internal process map — per-step CTQ specs editor (Task B)', () => {
  const mapWithCapabilityRules = (): CoreProcessMap => ({
    ...mapWithTwoSteps(),
    nodes: [
      { id: 'step-1', name: 'Mix', order: 0 },
      {
        id: 'step-2',
        name: 'Fill',
        order: 1,
        ctqColumn: 'Fill_Weight',
        capabilityScope: {
          specRules: [
            { specs: { target: 500, lsl: 495, usl: 505, cpkTarget: 1.33 } },
            { when: { product: 'A' }, specs: { target: 502, lsl: 498, usl: 506 } },
          ],
        },
      },
    ],
  });

  it('renders the per-step specs editor when the step has a CTQ column and onStepSpecsChange is provided', () => {
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        stepSpecs={{ Fill_Weight: { target: 500, lsl: 495, usl: 505, cpkTarget: 1.33 } }}
        onStepSpecsChange={vi.fn()}
      />
    );
    // step-2 has ctqColumn=Fill_Weight; specs grid should render with the values from the lookup.
    const lsl = screen.getByTestId('process-map-step-specs-step-2-lsl') as HTMLInputElement;
    const target = screen.getByTestId('process-map-step-specs-step-2-target') as HTMLInputElement;
    const usl = screen.getByTestId('process-map-step-specs-step-2-usl') as HTMLInputElement;
    const cpk = screen.getByTestId('process-map-step-specs-step-2-cpk-target') as HTMLInputElement;
    expect(lsl.value).toBe('495');
    expect(target.value).toBe('500');
    expect(usl.value).toBe('505');
    expect(cpk.value).toBe('1.33');
  });

  it('hides the per-step specs editor for steps without a CTQ column', () => {
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        stepSpecs={{}}
        onStepSpecsChange={vi.fn()}
      />
    );
    // step-1 has no ctqColumn → no specs grid.
    expect(screen.queryByTestId('process-map-step-specs-step-1-lsl')).not.toBeInTheDocument();
    // step-2 has ctqColumn → specs grid renders.
    expect(screen.getByTestId('process-map-step-specs-step-2-lsl')).toBeInTheDocument();
  });

  it('hides the per-step specs editor when onStepSpecsChange is omitted', () => {
    render(<ProcessMap map={mapWithTwoSteps()} availableColumns={COLUMNS} onChange={vi.fn()} />);
    expect(screen.queryByTestId('process-map-step-specs-step-2-lsl')).not.toBeInTheDocument();
  });

  it('emits onStepSpecsChange(column, next) when a per-step spec input changes (USL edit)', () => {
    const onStepSpecsChange = vi.fn();
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        stepSpecs={{ Fill_Weight: { target: 500, lsl: 495, usl: 505, cpkTarget: 1.33 } }}
        onStepSpecsChange={onStepSpecsChange}
      />
    );
    fireEvent.change(screen.getByTestId('process-map-step-specs-step-2-usl'), {
      target: { value: '510' },
    });
    expect(onStepSpecsChange).toHaveBeenCalledWith('Fill_Weight', {
      target: 500,
      usl: 510,
      lsl: 495,
      cpkTarget: 1.33,
      characteristicType: undefined,
    });
  });

  it('round-trips cpkTarget edits through onStepSpecsChange for the step CTQ column', () => {
    const onStepSpecsChange = vi.fn();
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        stepSpecs={{ Fill_Weight: { target: 500, lsl: 495, usl: 505 } }}
        onStepSpecsChange={onStepSpecsChange}
      />
    );
    fireEvent.change(screen.getByTestId('process-map-step-specs-step-2-cpk-target'), {
      target: { value: '1.67' },
    });
    expect(onStepSpecsChange).toHaveBeenCalledWith('Fill_Weight', {
      target: 500,
      usl: 505,
      lsl: 495,
      cpkTarget: 1.67,
      characteristicType: undefined,
    });
  });

  it('dispatches capabilityScope rules when a default per-step spec changes', () => {
    const onChange = vi.fn();
    const onCapabilityScopeChange = vi.fn();
    render(
      <ProcessMap
        map={mapWithCapabilityRules()}
        availableColumns={COLUMNS}
        onChange={onChange}
        onCapabilityScopeChange={onCapabilityScopeChange}
      />
    );

    fireEvent.change(screen.getByTestId('process-map-step-specs-step-2-lsl'), {
      target: { value: '496' },
    });

    expect(onCapabilityScopeChange).toHaveBeenCalledWith('step-2', [
      { specs: { target: 500, usl: 505, lsl: 496, cpkTarget: 1.33 } },
      { when: { product: 'A' }, specs: { target: 502, lsl: 498, usl: 506 } },
    ]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders the default capabilityScope rule in the step specs grid', () => {
    render(
      <ProcessMap
        map={mapWithCapabilityRules()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        onCapabilityScopeChange={vi.fn()}
      />
    );

    expect(
      (screen.getByTestId('process-map-step-specs-step-2-lsl') as HTMLInputElement).value
    ).toBe('495');
    expect(
      (screen.getByTestId('process-map-step-specs-step-2-target') as HTMLInputElement).value
    ).toBe('500');
  });

  it('adds a context-specific capabilityScope rule from available context options', () => {
    const onCapabilityScopeChange = vi.fn();
    render(
      <ProcessMap
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        onCapabilityScopeChange={onCapabilityScopeChange}
        capabilityContext={{
          availableContext: { hubColumns: ['product'] },
          contextValueOptions: { product: ['A', 'B'] },
        }}
      />
    );

    fireEvent.click(screen.getByTestId('process-map-step-add-context-rule-step-2'));

    expect(onCapabilityScopeChange).toHaveBeenCalledWith('step-2', [
      { when: { product: 'A' }, specs: {} },
    ] satisfies SpecRule[]);
  });

  it('edits and removes context-specific capabilityScope rules', () => {
    const onCapabilityScopeChange = vi.fn();
    render(
      <ProcessMap
        map={mapWithCapabilityRules()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        onCapabilityScopeChange={onCapabilityScopeChange}
        capabilityContext={{
          availableContext: { hubColumns: ['product', 'shift'] },
          contextValueOptions: { product: ['A', 'B'], shift: ['Day', 'Night'] },
        }}
      />
    );

    fireEvent.change(screen.getByTestId('process-map-step-context-rule-step-2-1-column'), {
      target: { value: 'shift' },
    });
    expect(onCapabilityScopeChange).toHaveBeenLastCalledWith('step-2', [
      { specs: { target: 500, lsl: 495, usl: 505, cpkTarget: 1.33 } },
      { when: { shift: 'Day' }, specs: { target: 502, lsl: 498, usl: 506 } },
    ]);

    fireEvent.change(screen.getByTestId('process-map-step-context-rule-step-2-1-usl'), {
      target: { value: '507' },
    });
    expect(onCapabilityScopeChange).toHaveBeenLastCalledWith('step-2', [
      { specs: { target: 500, lsl: 495, usl: 505, cpkTarget: 1.33 } },
      { when: { product: 'A' }, specs: { target: 502, lsl: 498, usl: 507 } },
    ]);

    fireEvent.click(screen.getByLabelText('Remove context-specific specs for Fill'));
    expect(onCapabilityScopeChange).toHaveBeenLastCalledWith('step-2', [
      { specs: { target: 500, lsl: 495, usl: 505, cpkTarget: 1.33 } },
    ]);
  });
});
