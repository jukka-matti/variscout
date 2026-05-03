import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessMapBase } from '../ProcessMapBase';
import type { ProcessMap, Gap } from '@variscout/core/frame';

const isoNow = () => new Date('2026-04-18T12:00:00.000Z').toISOString();

const emptyMap = (): ProcessMap => ({
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: isoNow(),
  updatedAt: isoNow(),
});

const mapWithOneStep = (): ProcessMap => ({
  version: 1,
  nodes: [{ id: 'step-1', name: 'Fill', order: 0 }],
  tributaries: [],
  createdAt: isoNow(),
  updatedAt: isoNow(),
});

const mapWithTwoSteps = (): ProcessMap => ({
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

const COLUMNS = ['Fill_Weight', 'Machine', 'Shift', 'Lot', 'Timestamp'];

describe('ProcessMapBase — rendering', () => {
  it('renders steps in `order`, regardless of array order', () => {
    const map = emptyMap();
    map.nodes = [
      { id: 'step-B', name: 'B', order: 1 },
      { id: 'step-A', name: 'A', order: 0 },
      { id: 'step-C', name: 'C', order: 2 },
    ];
    render(<ProcessMapBase map={map} availableColumns={COLUMNS} onChange={vi.fn()} />);
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
    render(<ProcessMapBase map={emptyMap()} availableColumns={COLUMNS} onChange={vi.fn()} />);
    expect(screen.getByTestId('process-map-ocean')).toBeInTheDocument();
    expect(screen.getByTestId('process-map-ocean-cts')).toBeInTheDocument();
  });

  it('renders a flow arrow between each pair of adjacent steps plus a final arrow to the ocean', () => {
    render(
      <ProcessMapBase map={mapWithTwoSteps()} availableColumns={COLUMNS} onChange={vi.fn()} />
    );
    // 2 steps → 1 inter-step arrow + 1 ocean arrow
    expect(screen.getByTestId('process-map-arrow-0')).toBeInTheDocument();
    expect(screen.getByTestId('process-map-ocean-arrow')).toBeInTheDocument();
  });
});

describe('ProcessMapBase — step CRUD', () => {
  it('invokes onChange with a new step appended when the "+ step" button is clicked', () => {
    const onChange = vi.fn();
    render(<ProcessMapBase map={emptyMap()} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('process-map-add-step'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.nodes).toHaveLength(1);
    expect(next.nodes[0].order).toBe(0);
    expect(next.nodes[0].name).toBe('');
  });

  it('renames a step inline via the text input', () => {
    const onChange = vi.fn();
    render(
      <ProcessMapBase map={mapWithOneStep()} availableColumns={COLUMNS} onChange={onChange} />
    );
    const input = screen.getByTestId('process-map-step-name-step-1') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Fill-renamed' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.nodes[0].name).toBe('Fill-renamed');
  });

  it('removes a step and re-packs the order field', () => {
    const onChange = vi.fn();
    const map: ProcessMap = {
      ...emptyMap(),
      nodes: [
        { id: 'step-1', name: 'A', order: 0 },
        { id: 'step-2', name: 'B', order: 1 },
        { id: 'step-3', name: 'C', order: 2 },
      ],
    };
    render(<ProcessMapBase map={map} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove step B'));
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.nodes.map(n => n.id)).toEqual(['step-1', 'step-3']);
    expect(next.nodes.map(n => n.order)).toEqual([0, 1]);
  });

  it('removing a step also cleans up its tributaries and hunches', () => {
    const onChange = vi.fn();
    const map: ProcessMap = {
      ...mapWithTwoSteps(),
      hunches: [{ id: 'h-1', text: 'Nozzle wear', stepId: 'step-2' }],
    };
    render(<ProcessMapBase map={map} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove step Fill'));
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.nodes.some(n => n.id === 'step-2')).toBe(false);
    expect(next.tributaries.some(t => t.stepId === 'step-2')).toBe(false);
    expect(next.hunches?.some(h => h.stepId === 'step-2')).toBe(false);
  });

  it('sets the CTQ column on a step via the dropdown', () => {
    const onChange = vi.fn();
    render(
      <ProcessMapBase map={mapWithOneStep()} availableColumns={COLUMNS} onChange={onChange} />
    );
    const select = screen.getByTestId('process-map-step-ctq-step-1') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Fill_Weight' } });
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.nodes[0].ctqColumn).toBe('Fill_Weight');
  });
});

describe('ProcessMapBase — tributary CRUD', () => {
  it('adds a tributary to a step via the inline selector', () => {
    const onChange = vi.fn();
    render(
      <ProcessMapBase map={mapWithOneStep()} availableColumns={COLUMNS} onChange={onChange} />
    );
    const selector = screen.getByTestId(
      'process-map-step-add-tributary-select-step-1'
    ) as HTMLSelectElement;
    fireEvent.change(selector, { target: { value: 'Machine' } });
    fireEvent.click(screen.getByLabelText('Confirm add tributary to Fill'));
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.tributaries).toHaveLength(1);
    expect(next.tributaries[0].column).toBe('Machine');
    expect(next.tributaries[0].stepId).toBe('step-1');
  });

  it('removes a tributary and also clears it from subgroupAxes', () => {
    const onChange = vi.fn();
    const map: ProcessMap = {
      ...mapWithTwoSteps(),
      subgroupAxes: ['trib-1'],
    };
    render(<ProcessMapBase map={map} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove tributary Machine'));
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.tributaries).toHaveLength(0);
    expect(next.subgroupAxes).toEqual([]);
  });

  it('adds the tributary to subgroupAxes when toggled on', () => {
    const onChange = vi.fn();
    render(
      <ProcessMapBase map={mapWithTwoSteps()} availableColumns={COLUMNS} onChange={onChange} />
    );
    fireEvent.click(screen.getByLabelText('Use Machine as subgroup axis'));
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.subgroupAxes).toEqual(['trib-1']);
  });

  it('removes the tributary from subgroupAxes when toggled off', () => {
    const onChange = vi.fn();
    const map: ProcessMap = { ...mapWithTwoSteps(), subgroupAxes: ['trib-1'] };
    render(<ProcessMapBase map={map} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Use Machine as subgroup axis'));
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.subgroupAxes).toEqual([]);
  });
});

describe('ProcessMapBase — CTS / ocean', () => {
  it('sets the CTS column via the ocean dropdown', () => {
    const onChange = vi.fn();
    render(<ProcessMapBase map={emptyMap()} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('process-map-ocean-cts'), {
      target: { value: 'Fill_Weight' },
    });
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.ctsColumn).toBe('Fill_Weight');
  });

  it('invokes onSpecsChange when target/USL/LSL inputs change (carries cpkTarget through)', () => {
    const onChange = vi.fn();
    const onSpecsChange = vi.fn();
    render(
      <ProcessMapBase
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
      <ProcessMapBase
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
      <ProcessMapBase
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

describe('ProcessMapBase — hunches', () => {
  it('adds a hunch via the text input + "+ hunch" button', () => {
    const onChange = vi.fn();
    render(
      <ProcessMapBase map={mapWithTwoSteps()} availableColumns={COLUMNS} onChange={onChange} />
    );
    fireEvent.change(screen.getByTestId('process-map-hunch-text'), {
      target: { value: 'Nozzle wear on night shift' },
    });
    fireEvent.change(screen.getByTestId('process-map-hunch-pin'), {
      target: { value: 'trib:trib-1' },
    });
    fireEvent.click(screen.getByTestId('process-map-hunch-add'));
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.hunches).toHaveLength(1);
    expect(next.hunches?.[0].text).toBe('Nozzle wear on night shift');
    expect(next.hunches?.[0].tributaryId).toBe('trib-1');
  });

  it('does not add an empty hunch', () => {
    const onChange = vi.fn();
    render(
      <ProcessMapBase map={mapWithOneStep()} availableColumns={COLUMNS} onChange={onChange} />
    );
    fireEvent.click(screen.getByTestId('process-map-hunch-add'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes a hunch via the per-item × button', () => {
    const onChange = vi.fn();
    const map: ProcessMap = {
      ...mapWithOneStep(),
      hunches: [{ id: 'h-1', text: 'Nozzle wear', stepId: 'step-1' }],
    };
    render(<ProcessMapBase map={map} availableColumns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove hunch Nozzle wear'));
    const next = onChange.mock.calls[0][0] as ProcessMap;
    expect(next.hunches).toEqual([]);
  });
});

describe('ProcessMapBase — gap rendering', () => {
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
      <ProcessMapBase
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
      <ProcessMapBase
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
    render(
      <ProcessMapBase map={mapWithTwoSteps()} availableColumns={COLUMNS} onChange={vi.fn()} />
    );
    expect(screen.queryByTestId('process-map-gap-strip')).not.toBeInTheDocument();
  });

  it('GapStrip is suppressed when showGaps is false (b0 FrameView opt-out)', () => {
    render(
      <ProcessMapBase
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

describe('ProcessMapBase — disabled mode', () => {
  it('hides destructive / additive controls when disabled', () => {
    render(
      <ProcessMapBase
        map={mapWithTwoSteps()}
        availableColumns={COLUMNS}
        onChange={vi.fn()}
        disabled
      />
    );
    expect(screen.queryByTestId('process-map-add-step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('process-map-hunch-add')).not.toBeInTheDocument();
    // Existing elements still render; name input still shows value
    expect(screen.getByTestId('process-map-step-name-step-1')).toBeInTheDocument();
  });
});

describe('ProcessMapBase — per-step CTQ specs editor (Task B)', () => {
  it('renders the per-step specs editor when the step has a CTQ column and onStepSpecsChange is provided', () => {
    render(
      <ProcessMapBase
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
      <ProcessMapBase
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
    render(
      <ProcessMapBase map={mapWithTwoSteps()} availableColumns={COLUMNS} onChange={vi.fn()} />
    );
    expect(screen.queryByTestId('process-map-step-specs-step-2-lsl')).not.toBeInTheDocument();
  });

  it('emits onStepSpecsChange(column, next) when a per-step spec input changes (USL edit)', () => {
    const onStepSpecsChange = vi.fn();
    render(
      <ProcessMapBase
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
      <ProcessMapBase
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
});
