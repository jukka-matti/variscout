import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { EditModeShell } from '../EditModeShell';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { createTestColumnParsingProfile } from '../../../../test-utils/columnParsingProfile';
import { createTestOutcomeSpec } from '../../../../test-utils/outcomeSpec';
import { createTestFactorControl } from '../../../../test-utils/factorControl';

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
