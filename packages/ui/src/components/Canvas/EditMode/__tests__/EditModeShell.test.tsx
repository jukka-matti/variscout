import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { EditModeShell } from '../EditModeShell';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { createTestColumnParsingProfile } from '../../../../test-utils/columnParsingProfile';
import { createTestOutcomeSpec } from '../../../../test-utils/outcomeSpec';
import { createTestFactorControl } from '../../../../test-utils/factorControl';
import { handleEditModeDragEnd } from '../handleEditModeDragEnd';
import { encodeColumnDragId } from '../Palette/encodeColumnDragId';
import { encodeOutcomeDropId } from '../OutcomeZone/encodeOutcomeDropId';
import { encodeFactorDropId } from '../FactorZone/encodeFactorDropId';
import { encodeProcessDropId } from '../ProcessZone/encodeProcessDropId';

describe('EditModeShell', () => {
  it('renders the three zone placeholders by name', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined} />
      </DndContext>
    );
    expect(screen.getByTestId('edit-mode-shell')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-palette')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-outcomes-factors')).toBeInTheDocument();
    expect(screen.getByTestId('edit-mode-zone-process')).toBeInTheDocument();
  });

  it('exposes a Done button that calls onDone when clicked', () => {
    const onDone = vi.fn();
    render(
      <DndContext>
        <EditModeShell onDone={onDone} />
      </DndContext>
    );
    const doneButton = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneButton);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('renders the Edit map header title', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined} />
      </DndContext>
    );
    expect(screen.getByText('Edit map')).toBeInTheDocument();
  });

  it('labels palette and outcomes-factors zones as B2/C-phase placeholders', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined} />
      </DndContext>
    );
    expect(screen.getByTestId('edit-mode-zone-palette')).toHaveTextContent(/Palette/);
    expect(screen.getByTestId('edit-mode-zone-outcomes-factors')).toHaveTextContent(
      /Outcomes.*Factors/
    );
  });
});

describe('EditModeShell — Palette wiring', () => {
  it('renders the Palette with the given profiles inside the palette zone', () => {
    const profiles: ColumnParsingProfile[] = [
      createTestColumnParsingProfile({ columnName: 'Speed' }),
    ];
    render(
      <DndContext>
        <EditModeShell onDone={() => {}} profiles={profiles} numericValuesByColumn={{}} />
      </DndContext>
    );
    const zone = screen.getByTestId('edit-mode-zone-palette');
    expect(zone).toContainElement(screen.getByTestId('palette'));
    expect(zone).toContainElement(screen.getByText('Speed'));
  });

  it('falls back to the empty-state hint when no profiles are passed', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => {}} />
      </DndContext>
    );
    expect(screen.getByTestId('palette-empty')).toBeInTheDocument();
  });
});

describe('EditModeShell — Palette callback forwarding', () => {
  it('forwards onMenuItemSelect from chip context menu through to the host', () => {
    const onMenuItemSelect = vi.fn();
    render(
      <DndContext>
        <EditModeShell
          onDone={() => {}}
          profiles={[
            createTestColumnParsingProfile({
              columnName: 'Speed',
              primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
            }),
          ]}
          numericValuesByColumn={{}}
          onMenuItemSelect={onMenuItemSelect}
        />
      </DndContext>
    );
    fireEvent.click(screen.getByTestId('column-chip-context-button'));
    fireEvent.click(screen.getByText('Bin into categorical…'));
    expect(onMenuItemSelect).toHaveBeenCalledWith('Speed', 'bin-into-categorical');
  });
});

describe('EditModeShell — OutcomeZone wiring (C1)', () => {
  it('renders OutcomeZone in the outcomes-factors zone (replaces top-half placeholder)', () => {
    render(
      <DndContext>
        <EditModeShell onDone={vi.fn()} outcomeSpecs={[]} />
      </DndContext>
    );
    expect(screen.getByTestId('outcome-zone')).toBeInTheDocument();
    expect(
      screen.queryByText(/outcome and factor zones arrive in phase c/i)
    ).not.toBeInTheDocument();
  });

  it('forwards onOutcomeSpecUpdate to OutcomeZone via the OutcomeSpecsPopover Apply', () => {
    const onOutcomeSpecUpdate = vi.fn();
    const spec = createTestOutcomeSpec({ id: 'o-1', columnName: 'A' });
    render(
      <DndContext>
        <EditModeShell
          onDone={vi.fn()}
          outcomeSpecs={[spec]}
          onOutcomeSpecUpdate={onOutcomeSpecUpdate}
        />
      </DndContext>
    );
    fireEvent.click(screen.getByRole('button', { name: /edit specs/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onOutcomeSpecUpdate).toHaveBeenCalledWith('o-1', expect.objectContaining({ id: 'o-1' }));
  });
});

describe('EditModeShell — FactorZone wiring (C2)', () => {
  it('renders FactorZone in outcomes-factors zone (replaces Factor zone arrives in C2 placeholder)', () => {
    render(
      <DndContext>
        <EditModeShell onDone={vi.fn()} factorControls={[]} />
      </DndContext>
    );
    expect(screen.getByTestId('factor-zone-global')).toBeInTheDocument();
    expect(screen.queryByText(/factor zone arrives in c2/i)).not.toBeInTheDocument();
  });

  it('renders FactorChips for provided controls', () => {
    render(
      <DndContext>
        <EditModeShell
          onDone={vi.fn()}
          factorControls={[createTestFactorControl({ factor: 'Temp', targetCondition: 'low' })]}
        />
      </DndContext>
    );
    expect(screen.getByText('Temp')).toBeInTheDocument();
  });

  it('forwards onFactorControlUpdate via the FactorSpecsPopover Apply', () => {
    const onFactorControlUpdate = vi.fn();
    render(
      <DndContext>
        <EditModeShell
          onDone={vi.fn()}
          factorControls={[createTestFactorControl({ factor: 'Temp' })]}
          onFactorControlUpdate={onFactorControlUpdate}
        />
      </DndContext>
    );
    fireEvent.click(screen.getByRole('button', { name: /edit factor/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onFactorControlUpdate).toHaveBeenCalledWith(
      'Temp',
      expect.objectContaining({ factor: 'Temp' })
    );
  });

  it('passes steps to FactorSpecsPopover for step-binding selection', () => {
    render(
      <DndContext>
        <EditModeShell
          onDone={vi.fn()}
          factorControls={[createTestFactorControl()]}
          steps={[{ id: 's-mix', name: 'Mix', order: 0 }]}
        />
      </DndContext>
    );
    fireEvent.click(screen.getByRole('button', { name: /edit factor/i }));
    expect(screen.getByRole('option', { name: /^mix/i })).toBeInTheDocument();
  });
});

describe('EditModeShell — ProcessStructureZone wiring (C3 Task 4)', () => {
  it('renders ProcessStructureZone empty-state hint when steps is empty', () => {
    render(
      <DndContext>
        <EditModeShell onDone={vi.fn()} steps={[]} />
      </DndContext>
    );
    const processZone = screen.getByLabelText('Process structure zone');
    expect(processZone).toContainElement(screen.getByTestId('process-structure-zone'));
    expect(
      screen.getByText(/drop a categorical column to define process steps/i)
    ).toBeInTheDocument();
  });

  it('omitting steps still defaults to the empty ProcessStructureZone', () => {
    render(
      <DndContext>
        <EditModeShell onDone={vi.fn()} />
      </DndContext>
    );
    expect(screen.getByTestId('process-structure-zone')).toBeInTheDocument();
    expect(
      screen.getByText(/drop a categorical column to define process steps/i)
    ).toBeInTheDocument();
  });

  it('renders a StepBox per step (sorted by order) when steps are present', () => {
    render(
      <DndContext>
        <EditModeShell
          onDone={vi.fn()}
          steps={[
            { id: 'a', name: 'Mix', order: 0 },
            { id: 'b', name: 'Fill', order: 1 },
          ]}
        />
      </DndContext>
    );
    expect(screen.getByTestId('step-box-a')).toBeInTheDocument();
    expect(screen.getByTestId('step-box-b')).toBeInTheDocument();
    expect(screen.getByText('Mix')).toBeInTheDocument();
    expect(screen.getByText('Fill')).toBeInTheDocument();
  });
});

describe('EditModeShell — StepBox internal drop zones smoke test (C3 Task 8)', () => {
  /**
   * Smoke test: EditModeShell renders StepBoxes with BOTH internal-Y (outcome)
   * and internal-X (factor) droppable sections visible. Verifies the full
   * render pipeline from EditModeShell → ProcessStructureZone → StepBox without
   * needing to simulate DnD events.
   */
  it('renders internal-Y and internal-X sections for each StepBox', () => {
    render(
      <DndContext>
        <EditModeShell onDone={vi.fn()} steps={[{ id: 's1', name: 'Mix', order: 0 }]} />
      </DndContext>
    );
    expect(screen.getByTestId('step-box-s1-internal-y')).toBeInTheDocument();
    expect(screen.getByTestId('step-box-s1-internal-x')).toBeInTheDocument();
  });
});

/**
 * End-to-end drag-end integration tests (C3 Task 8 — Approach 1).
 *
 * We call `handleEditModeDragEnd` directly — the same pure function that
 * EditModeShell wires as its DndContext `onDragEnd`. This validates the full
 * codec-to-callback pipeline (column drag id encoding → zone drop id decoding →
 * callback dispatch) without needing to mock `@dnd-kit/core`.
 *
 * Approach 1 was chosen over Approach 2 (DndContext mock) because:
 * - The existing EditModeShell tests rely on a real (un-mocked) DndContext for
 *   fireEvent interactions with OutcomeZone and FactorZone popovers; a
 *   module-level vi.mock would break those tests.
 * - handleEditModeDragEnd IS the integration point: EditModeShell does nothing
 *   more than pass its props into this function on each drag-end event.
 * - The `handleEditModeDragEnd.test.ts` unit suite already covers no-op cases;
 *   these tests focus on the per-step stepId extraction paths added in C3.
 */
describe('end-to-end drag-end integration (C3 Task 8 — Approach 1)', () => {
  /** Minimal DragEndEvent shape the router reads. */
  const makeDragEnd = (activeId: string, overId: string | undefined): DragEndEvent =>
    ({ active: { id: activeId }, over: overId ? { id: overId } : null }) as unknown as DragEndEvent;

  it('categorical column drop on process-zone:singleton → onStepsReplace fires with extracted steps + source column', () => {
    const onStepsReplace = vi.fn();
    const onOutcomeSpecAdd = vi.fn();
    const onFactorControlAdd = vi.fn();

    handleEditModeDragEnd(makeDragEnd(encodeColumnDragId('Process_step'), encodeProcessDropId()), {
      numericValuesByColumn: {},
      categoricalDistinctValuesByColumn: { Process_step: ['Mix', 'Fill'] },
      onStepsReplace,
      onOutcomeSpecAdd,
      onFactorControlAdd,
    });

    expect(onStepsReplace).toHaveBeenCalledTimes(1);
    const [steps, sourceColumnName] = onStepsReplace.mock.calls[0];
    expect(sourceColumnName).toBe('Process_step');
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ name: 'Mix', order: 0 });
    expect(steps[1]).toMatchObject({ name: 'Fill', order: 1 });
    // Process route short-circuits; outcome + factor must not fire
    expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
    expect(onFactorControlAdd).not.toHaveBeenCalled();
  });

  it('numeric column drop on outcome-zone:step:<stepId> → onOutcomeSpecAdd fires with columnName, derived, and stepId', () => {
    const onOutcomeSpecAdd = vi.fn();
    const onFactorControlAdd = vi.fn();

    handleEditModeDragEnd(
      makeDragEnd(encodeColumnDragId('Temp'), encodeOutcomeDropId({ stepId: 's1' })),
      {
        numericValuesByColumn: { Temp: [1, 2, 3] },
        categoricalDistinctValuesByColumn: {},
        onOutcomeSpecAdd,
        onFactorControlAdd,
      }
    );

    expect(onOutcomeSpecAdd).toHaveBeenCalledTimes(1);
    const [columnName, derived, stepId] = onOutcomeSpecAdd.mock.calls[0];
    expect(columnName).toBe('Temp');
    expect(derived).toEqual(expect.any(Object));
    expect(stepId).toBe('s1');
    expect(onFactorControlAdd).not.toHaveBeenCalled();
  });

  it('column drop on factor-zone:step:<stepId> → onFactorControlAdd fires with columnName and stepId', () => {
    const onOutcomeSpecAdd = vi.fn();
    const onFactorControlAdd = vi.fn();

    handleEditModeDragEnd(
      makeDragEnd(encodeColumnDragId('Speed'), encodeFactorDropId({ stepId: 's1' })),
      {
        numericValuesByColumn: {},
        categoricalDistinctValuesByColumn: {},
        onOutcomeSpecAdd,
        onFactorControlAdd,
      }
    );

    expect(onFactorControlAdd).toHaveBeenCalledTimes(1);
    const [columnName, stepId] = onFactorControlAdd.mock.calls[0];
    expect(columnName).toBe('Speed');
    expect(stepId).toBe('s1');
    expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
  });

  it('numeric column drop on process-zone:singleton → falls through; neither onStepsReplace nor onOutcomeSpecAdd fires', () => {
    // Numeric columns are absent from categoricalDistinctValuesByColumn; the
    // process handler returns false, and the drop id does not match the outcome
    // zone either — so both callbacks remain silent.
    const onStepsReplace = vi.fn();
    const onOutcomeSpecAdd = vi.fn();

    handleEditModeDragEnd(makeDragEnd(encodeColumnDragId('Temp'), encodeProcessDropId()), {
      numericValuesByColumn: { Temp: [1, 2, 3] },
      categoricalDistinctValuesByColumn: {}, // 'Temp' absent — numeric column
      onStepsReplace,
      onOutcomeSpecAdd,
    });

    expect(onStepsReplace).not.toHaveBeenCalled();
    expect(onOutcomeSpecAdd).not.toHaveBeenCalled();
  });
});

describe('EditModeShell — timingByStepId thread-through (D1 Task 9)', () => {
  it('forwards timingByStepId badges to the ProcessStructureZone StepBoxes', () => {
    render(
      <DndContext>
        <EditModeShell
          onDone={vi.fn()}
          steps={[
            { id: 'mix', name: 'Mix', order: 0 },
            { id: 'fill', name: 'Fill', order: 1 },
          ]}
          timingByStepId={{ mix: <span data-testid="timing-badge-mix">⏱ ~42 min</span> }}
        />
      </DndContext>
    );
    const mixBox = screen.getByTestId('step-box-mix');
    expect(mixBox).toContainElement(screen.getByTestId('timing-badge-mix'));
    expect(screen.queryByTestId('timing-badge-fill')).not.toBeInTheDocument();
  });

  it('no badge rendered when timingByStepId is omitted', () => {
    render(
      <DndContext>
        <EditModeShell onDone={vi.fn()} steps={[{ id: 'mix', name: 'Mix', order: 0 }]} />
      </DndContext>
    );
    // ProcessStructureZone receives default {} → no badge spans beyond normal markup
    expect(screen.queryByTestId('timing-badge-mix')).not.toBeInTheDocument();
  });
});

describe('EditModeShell — EditModeToolbar wiring (D1 Task 7)', () => {
  it('renders EditModeToolbar between the header and the 3-column grid', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined} />
      </DndContext>
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Edit mode toolbar' });
    expect(toolbar).toBeInTheDocument();
  });

  it('toolbar button is disabled when steps is empty (default)', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined} />
      </DndContext>
    );
    const btn = screen.getByRole('button', { name: /\+ Capture step timings/i });
    expect(btn).toBeDisabled();
  });

  it('toolbar button is disabled when steps=[] is passed explicitly', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined} steps={[]} />
      </DndContext>
    );
    const btn = screen.getByRole('button', { name: /\+ Capture step timings/i });
    expect(btn).toBeDisabled();
  });

  it('toolbar button is enabled when steps has at least one step', () => {
    render(
      <DndContext>
        <EditModeShell onDone={() => undefined} steps={[{ id: 's1', name: 'Mix', order: 0 }]} />
      </DndContext>
    );
    const btn = screen.getByRole('button', { name: /\+ Capture step timings/i });
    expect(btn).not.toBeDisabled();
  });

  it('clicking the toolbar button calls onCaptureStepTimings when steps are present', () => {
    const onCaptureStepTimings = vi.fn();
    render(
      <DndContext>
        <EditModeShell
          onDone={() => undefined}
          steps={[{ id: 's1', name: 'Mix', order: 0 }]}
          onCaptureStepTimings={onCaptureStepTimings}
        />
      </DndContext>
    );
    fireEvent.click(screen.getByRole('button', { name: /\+ Capture step timings/i }));
    expect(onCaptureStepTimings).toHaveBeenCalledTimes(1);
  });

  it('toolbar appears between the header and the grid (DOM order)', () => {
    const { container } = render(
      <DndContext>
        <EditModeShell onDone={() => undefined} />
      </DndContext>
    );
    const section = container.querySelector('[data-testid="edit-mode-shell"]');
    const children = Array.from(section?.children ?? []);
    const headerIdx = children.findIndex(el => el.tagName === 'HEADER');
    const toolbarIdx = children.findIndex(el => el.getAttribute('role') === 'toolbar');
    const gridIdx = children.findIndex(el => el.className.includes('grid'));
    expect(headerIdx).toBeGreaterThanOrEqual(0);
    expect(toolbarIdx).toBeGreaterThan(headerIdx);
    expect(gridIdx).toBeGreaterThan(toolbarIdx);
  });
});
